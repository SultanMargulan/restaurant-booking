# booking_routes.py
from flask import Blueprint, request, jsonify
from app.extensions import db, mail
from app.models import Booking, Restaurant, User, Layout
from datetime import datetime, timedelta
from flask_login import login_required, current_user
from flask_mail import Message
from sqlalchemy import func
from app.extensions import csrf
from app.utils.response import json_response

booking_bp = Blueprint('booking', __name__, url_prefix='/api/bookings')

def is_table_available(restaurant_id, layout_id, date):
    layout = Layout.query.get(layout_id)
    if not layout or layout.restaurant_id != restaurant_id:
        return False
    duration = Restaurant.query.get(restaurant_id).booking_duration
    start = date
    end = date + timedelta(minutes=duration)
    overlapping = Booking.query.filter(
        (Booking.layout_id == layout_id) &
        (Booking.restaurant_id == restaurant_id) &
        (Booking.date < end) &
        (Booking.date + timedelta(minutes=duration) > start)
    ).first()
    return not overlapping

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
        date_str = data.get('date')
        if 'T' in date_str:
            booking_date = datetime.strptime(date_str, "%Y-%m-%dT%H:%M")
        else:
            booking_date = datetime.strptime(date_str, "%Y-%m-%d")
    except (ValueError, TypeError):
        return json_response(error="Invalid date format. Use YYYY-MM-DD or YYYY-MM-DDTHH:MM", status=400)
    layout_id = data.get('layout_id')
    if not layout_id:
        return json_response(error="Invalid layout ID", status=400)
    if not is_table_available(restaurant.id, layout_id, booking_date):
        return json_response(error="Table not available at the requested time", status=409)
    num_guests = data.get('num_guests', 1)
    special_requests = data.get('special_requests')
    new_booking = Booking(
        user_id=data.get('user_id'),
        restaurant_id=data.get('restaurant_id'),
        date=booking_date,
        layout_id=layout_id,
        num_guests=num_guests,
        special_requests=special_requests,
    )
    db.session.add(new_booking)
    db.session.commit()
    msg = Message('Booking Confirmation', recipients=[user.email])
    msg.body = f"""
    Dear {user.name},
    Your booking at {restaurant.name} is confirmed!
    Date: {booking_date.strftime("%Y-%m-%d %H:%M")}
    Table Number: {layout_id}
    Number of Guests: {num_guests}
    """
    mail.send(msg)
    return json_response(data={"message": "Booking successful, email sent!"}, status=201)

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
    
    try:
        if 'T' in date_str:
            booking_date = datetime.strptime(date_str, "%Y-%m-%dT%H:%M")
        else:
            booking_date = datetime.strptime(date_str, "%Y-%m-%d")
    except (ValueError, TypeError):
        return json_response(error="Invalid date format. Use YYYY-MM-DD or YYYY-MM-DDTHH:MM", status=400)
    
    restaurant = Restaurant.query.get(restaurant_id)
    if not restaurant:
        return json_response(error="Restaurant not found", status=404)
    
    duration = restaurant.booking_duration
    start = booking_date
    end = booking_date + timedelta(minutes=duration)
    
    available_tables = Layout.query.filter(
        Layout.restaurant_id == restaurant_id,
        ~db.session.query(Booking.id).filter(
            (Booking.layout_id == Layout.id) &
            (Booking.restaurant_id == restaurant_id) &
            (Booking.date < end) &
            (Booking.date + timedelta(minutes=duration) > start)
        ).exists()
    ).all()
    
    layout_ids = [table.id for table in available_tables]
    
    return json_response(data={"available_tables": layout_ids}, status=200)