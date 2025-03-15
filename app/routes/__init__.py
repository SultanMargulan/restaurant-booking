from flask import Blueprint
from .auth_routes import auth_bp
from .booking_routes import booking_bp
from .restaurant_routes import restaurant_bp

def register_routes(main):
    main.register_blueprint(auth_bp)
    main.register_blueprint(booking_bp)
    main.register_blueprint(restaurant_bp)
