# payment_routes.py
from flask import Blueprint, request
from flask_login import login_required, current_user
from app.extensions import db
from app.models import Payment, Booking, MenuItem
from app.utils.response import json_response

payment_bp = Blueprint('payment', __name__, url_prefix='/api/payments')

@payment_bp.route('', methods=['POST'])
@login_required
def create_payment():
    data = request.json
    booking_id = data.get('booking_id')
    amount = data.get('amount')

    if not booking_id or not amount:
        return json_response(error="Missing booking_id or amount", status=400)

    booking = Booking.query.get(booking_id)
    if not booking:
        return json_response(error="Booking not found", status=404)

    # Ensure the current user owns the booking (or is admin)
    if booking.user_id != current_user.id and not current_user.is_admin:
        return json_response(error="Unauthorized", status=403)

    # Calculate total amount from menu_orders
    menu_orders = booking.menu_orders or []
    calculated_amount = 0
    for order in menu_orders:
        item_id = order.get('item_id')
        quantity = order.get('quantity', 1)
        menu_item = MenuItem.query.get(item_id)
        if menu_item and menu_item.restaurant_id == booking.restaurant_id:
            calculated_amount += menu_item.price * quantity

    if abs(calculated_amount - amount) > 0.01:  # Allow small float discrepancies
        return json_response(error="Amount mismatch", status=400)

    # Create payment
    payment = Payment(booking_id=booking_id, amount=amount)
    db.session.add(payment)
    db.session.commit()

    # Simulate payment processing
    payment.status = 'PAID'
    db.session.commit()

    return json_response(data={
        "message": "Payment successful",
        "payment_id": payment.id,
        "status": payment.status
    }, status=201)