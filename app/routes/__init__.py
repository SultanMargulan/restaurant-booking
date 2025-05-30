from flask import Blueprint
from .auth_routes import auth_bp
from .booking_routes import booking_bp
from .restaurant_routes import restaurant_bp
from .payment_routes import payment_bp
from .restaurant_bot import restaurant_bot_bp

def register_routes(main):
    main.register_blueprint(auth_bp)
    main.register_blueprint(booking_bp)
    main.register_blueprint(restaurant_bp)
    main.register_blueprint(payment_bp)
    main.register_blueprint(restaurant_bot_bp)