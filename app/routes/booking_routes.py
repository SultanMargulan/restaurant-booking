# booking_routes.py
from flask import Blueprint, request, jsonify
from app.extensions import db, mail
from app.models import Booking, Restaurant, User
from datetime import datetime, timedelta
from flask_login import login_required, current_user
from flask_mail import Message
from sqlalchemy import func
from app.extensions import csrf

booking_bp = Blueprint('booking', __name__, url_prefix='/api/bookings')

def is_table_available_fixed(restaurant_id, table_number, booking_datetime, duration=timedelta(hours=2), total_tables=10):
    if table_number < 1 or table_number > total_tables:
        return False
    start_time = booking_datetime
    end_time = booking_datetime + duration
    overlapping_bookings = Booking.query.filter_by(
        restaurant_id=restaurant_id,
        table_number=table_number
    ).filter(Booking.date < end_time).all()
    for booking in overlapping_bookings:
        if booking.date + duration > start_time:
            return False
    return True

@csrf.exempt
@booking_bp.route('', methods=['POST'])
def book_table():
    data = request.json
    user = User.query.get(data.get('user_id'))
    if not user:
        return jsonify({"error": "User not found"}), 404
    restaurant = Restaurant.query.get(data.get('restaurant_id'))
    if not restaurant:
        return jsonify({"error": "Restaurant not found"}), 404
    try:
        booking_date = datetime.strptime(data.get('date'), "%Y-%m-%dT%H:%M")
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DDTHH:MM"}), 400
    try:
        table_number = int(data.get('table_number'))
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid table number"}), 400
    if not is_table_available_fixed(restaurant.id, table_number, booking_date):
        return jsonify({"error": "Table not available at the requested time"}), 409
    num_guests = data.get('num_guests', 1)
    special_requests = data.get('special_requests')
    new_booking = Booking(
        user_id=data.get('user_id'),
        restaurant_id=data.get('restaurant_id'),
        date=booking_date,
        table_number=table_number,
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
    Table Number: {table_number}
    Number of Guests: {num_guests}
    """
    mail.send(msg)
    return jsonify({"message": "Booking successful, email sent!"}), 201

@booking_bp.route('/<int:booking_id>', methods=['PUT'])
@login_required
def update_booking(booking_id):
    booking = Booking.query.get_or_404(booking_id)
    if booking.user_id != current_user.id:
        return jsonify({"error": "Unauthorized"}), 403
    data = request.json
    if 'date' in data:
        try:
            booking.date = datetime.strptime(data.get('date'), "%Y-%m-%dT%H:%M")
        except (ValueError, TypeError):
            return jsonify({"error": "Invalid date format. Use YYYY-MM-DDTHH:MM"}), 400
    if 'table_number' in data:
        try:
            booking.table_number = int(data.get('table_number'))
        except (ValueError, TypeError):
            return jsonify({"error": "Invalid table number"}), 400
    if 'num_guests' in data:
        booking.num_guests = data.get('num_guests')
    if 'special_requests' in data:
        booking.special_requests = data.get('special_requests')
    db.session.commit()
    return jsonify({"message": "Booking updated successfully"}), 200

@booking_bp.route('/<int:booking_id>', methods=['DELETE'])
@login_required
def cancel_booking(booking_id):
    booking = Booking.query.get_or_404(booking_id)
    if booking.user_id != current_user.id and not current_user.is_admin:
        return jsonify({"error": "Unauthorized"}), 403
    db.session.delete(booking)
    db.session.commit()
    return jsonify({"message": "Booking canceled successfully"}), 200

@booking_bp.route('/user', methods=['GET'])
@login_required
def get_user_bookings():
    bookings = Booking.query.filter_by(user_id=current_user.id).all()
    booking_list = [{
        "id": booking.id,
        "restaurant_id": booking.restaurant_id,
        "restaurant_name": booking.restaurant.name if booking.restaurant else "Unknown",
        "date": booking.date.strftime("%Y-%m-%d %H:%M"),
        "table_number": booking.table_number
    } for booking in bookings]
    return jsonify(booking_list), 200

@booking_bp.route('/analytics', methods=['GET'])
@login_required
def bookings_analytics():
    if not current_user.is_admin:
        return jsonify({"error": "Admin privileges required"}), 403
    analytics = db.session.query(func.date(Booking.date), func.count(Booking.id)) \
                  .group_by(func.date(Booking.date)).all()
    result = [{"date": str(date), "bookings": count} for date, count in analytics]
    return jsonify(result), 200
