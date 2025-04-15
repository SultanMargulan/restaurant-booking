# booking_routes.py
from pytz import UTC
from flask import Blueprint, request, jsonify
from app.extensions import db, mail
from app.models import Booking, Restaurant, User, Layout
from datetime import datetime, timedelta
from flask_login import login_required, current_user
from flask_mail import Message
from sqlalchemy import func, cast, literal, Interval, text
from app.extensions import csrf
from app.utils.response import json_response
import logging
from sqlalchemy.sql import text  # Import for raw SQL expressions

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

booking_bp = Blueprint('booking', __name__, url_prefix='/api/bookings')

def is_table_available(restaurant_id, layout_id, date):
    """
    Check if a table is available for the given time slot.
    Performs overlap check in Python for reliability.
    """
    restaurant = Restaurant.query.get(restaurant_id)
    if not restaurant:
        logger.warning(f"Restaurant not found: ID={restaurant_id}")
        return False

    duration = restaurant.booking_duration or 120  # Default to 120 minutes if not set
    end = date + timedelta(minutes=duration)

    # Fetch all bookings for the table that could overlap
    bookings = Booking.query.filter(
        Booking.layout_id == layout_id,
        Booking.restaurant_id == restaurant_id,
        Booking.date < end,  # Booking starts before the requested end
        Booking.date >= date - timedelta(minutes=duration)  # Booking ends after the requested start
    ).all()

    logger.debug(f"Checking table {layout_id}: Found {len(bookings)} potential overlapping bookings")

    # Check for actual overlaps in Python
    for booking in bookings:
        booking_end = booking.date + timedelta(minutes=duration)
        if booking.date < end and booking_end > date:
            logger.debug(f"Table {layout_id} unavailable due to booking from {booking.date} to {booking_end}")
            return False

    logger.debug(f"Table {layout_id} is available")
    return True

@csrf.exempt
@booking_bp.route('', methods=['POST'])
def book_table():
    data = request.json
    user = User.query.get(data.get('user_id'))
    if not user:
        return json_response(error="User not found", status=404)
    restaurant = Restaurant.query.get(data.get('restaurant_id'))
    if not restaurant:
        return json_response(error="Restaurant not found", status=404)
    try:
        booking_date = datetime.strptime(data.get('date'), "%Y-%m-%dT%H:%M").replace(tzinfo=UTC)
    except (ValueError, TypeError):
        return json_response(error="Invalid date format. Use YYYY-MM-DDTHH:MM", status=400)
    layout_id = data.get('layout_id')
    if not layout_id:
        return json_response(error="Invalid layout ID", status=400)
    if not is_table_available(restaurant.id, layout_id, booking_date):
        return json_response(error="Table not available at the requested time", status=409)
    num_guests = data.get('num_guests', 1)
    special_requests = data.get('special_requests')
    menu_orders = data.get('menu_orders', [])  # Expecting list of {item_id, quantity}

    new_booking = Booking(
        user_id=data.get('user_id'),
        restaurant_id=data.get('restaurant_id'),
        date=booking_date,
        layout_id=layout_id,
        num_guests=num_guests,
        special_requests=special_requests,
        menu_orders=menu_orders,
    )
    db.session.add(new_booking)
    db.session.commit()
    
    msg = Message('Booking Confirmation', recipients=[user.email])
    msg.body = f"""
    Dear {user.name},
    Your booking at {restaurant.name} is confirmed!
    Date: {booking_date.strftime("%Y-%m-%d %H:%M")} UTC
    Table Number: {layout_id}
    Number of Guests: {num_guests}
    """
    mail.send(msg)
    
    return json_response(data={
        "message": "Booking successful, email sent!",
        "booking_id": new_booking.id
    }, status=201)

@booking_bp.route('/<int:booking_id>', methods=['PUT'])
@login_required
@csrf.exempt
def update_booking(booking_id):
    booking = Booking.query.get_or_404(booking_id)
    if booking.user_id != current_user.id:
        return json_response(error="Unauthorized", status=403)
    data = request.json
    if 'date' in data:
        try:
            date_str = data.get('date')
            if 'T' in date_str:
                booking_date = datetime.strptime(date_str, "%Y-%m-%dT%H:%M")
            else:
                booking_date = datetime.strptime(date_str, "%Y-%m-%d")
            booking.date = booking_date
        except (ValueError, TypeError):
            return json_response(error="Invalid date format. Use YYYY-MM-DD or YYYY-MM-DDTHH:MM", status=400)
    if 'layout_id' in data:
        try:
            booking.layout_id = int(data.get('layout_id'))
        except (ValueError, TypeError):
            return json_response(error="Invalid layout ID", status=400)
    if 'num_guests' in data:
        booking.num_guests = data.get('num_guests')
    if 'special_requests' in data:
        booking.special_requests = data.get('special_requests')
    db.session.commit()
    return json_response(data={"message": "Booking updated successfully"}, status=200)

@booking_bp.route('/<int:booking_id>', methods=['DELETE'])
@login_required
@csrf.exempt
def cancel_booking(booking_id):
    booking = Booking.query.get_or_404(booking_id)
    if booking.user_id != current_user.id and not current_user.is_admin:
        return json_response(error="Unauthorized", status=403)
    db.session.delete(booking)
    db.session.commit()
    return json_response(data={"message": "Booking canceled successfully"}, status=200)

@booking_bp.route('/user', methods=['GET'])
@login_required
def get_user_bookings():
    bookings = Booking.query.filter_by(user_id=current_user.id).all()
    booking_list = [{
        "id": booking.id,
        "restaurant_id": booking.restaurant_id,
        "layout_id": booking.layout_id,  # Changed from table_number
        "date": booking.date.strftime("%Y-%m-%d %H:%M")
    } for booking in bookings]
    return json_response(data=booking_list, status=200)

@booking_bp.route('/analytics', methods=['GET'])
@login_required
def bookings_analytics():
    if not current_user.is_admin:
        return json_response(error="Admin privileges required", status=403)
    analytics = db.session.query(func.date(Booking.date), func.count(Booking.id)) \
                  .group_by(func.date(Booking.date)).all()
    result = [{"date": str(date), "bookings": count} for date, count in analytics]
    return json_response(data=result, status=200)

@booking_bp.route('/availability', methods=['GET'])
def get_available_tables():
    restaurant_id = request.args.get('restaurant_id')
    date_str = request.args.get('date')

    logger.debug(f"Received request: restaurant_id={restaurant_id}, date={date_str}")

    # Parse the date as UTC
    try:
        booking_date = datetime.strptime(date_str, "%Y-%m-%dT%H:%M").replace(tzinfo=UTC)
        logger.debug(f"Parsed booking_date: {booking_date}")
    except (ValueError, TypeError) as e:
        logger.error(f"Date parsing error: {str(e)}")
        return json_response(error="Invalid date format. Use YYYY-MM-DDTHH:MM", status=400)

    # Parse restaurant_id
    try:
        restaurant_id = int(restaurant_id)
        logger.debug(f"Parsed restaurant_id: {restaurant_id}")
    except (ValueError, TypeError) as e:
        logger.error(f"Restaurant ID parsing error: {str(e)}")
        return json_response(error="Invalid restaurant ID", status=400)

    # Check if restaurant exists
    try:
        restaurant = Restaurant.query.get(restaurant_id)
        if not restaurant:
            logger.warning(f"Restaurant not found: ID={restaurant_id}")
            return json_response(error="Restaurant not found", status=404)
        duration = restaurant.booking_duration or 120  # Default to 120 if not set
        logger.debug(f"Restaurant found, booking_duration={duration}")
    except Exception as e:
        logger.error(f"Error fetching restaurant: {str(e)}", exc_info=True)
        return json_response(error="Error accessing restaurant data", status=500)

    # Query available tables
    try:
        # Get all tables for the restaurant
        all_tables = Layout.query.filter(
            Layout.restaurant_id == restaurant_id,
            Layout.type == 'table'
        ).all()
        logger.debug(f"Found {len(all_tables)} tables for restaurant {restaurant_id}")

        if not all_tables:
            logger.warning(f"No tables found for restaurant {restaurant_id}")
            return json_response(data={"available_tables": []}, status=200)

        available_tables = []
        for table in all_tables:
            if is_table_available(restaurant_id, table.id, booking_date):
                available_tables.append(table.id)
        logger.debug(f"Found {len(available_tables)} available tables")
    except Exception as e:
        logger.error(f"Error querying available tables: {str(e)}", exc_info=True)
        return json_response(error="Error fetching table availability", status=500)

    # Return available table IDs
    logger.debug(f"Returning layout_ids: {available_tables}")
    return json_response(data={"available_tables": available_tables}, status=200)

@booking_bp.route('/count/this-week', methods=['GET'])
def get_bookings_this_week():
    today = datetime.utcnow()
    start_of_week = today - timedelta(days=today.weekday())  # Monday of this week
    end_of_week = start_of_week + timedelta(days=7)  # End of week
    count = Booking.query.filter(
        Booking.date >= start_of_week,
        Booking.date < end_of_week
    ).count()
    return json_response(data={"count": count}, status=200)