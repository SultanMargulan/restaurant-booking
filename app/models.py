from app.extensions import db
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)

    # For loyalty/CRM:
    loyalty_points = db.Column(db.Integer, default=0)
    # Or you can store membership tier, e.g. "Silver", "Gold", "Platinum"
    loyalty_tier = db.Column(db.String(50), default="Basic")

    def set_password(self, password):
        self.password = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password, password)

class UserPreference(db.Model):
    __tablename__ = 'user_preference'
    id = db.Column(db.Integer, primary_key=True)
    
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    user = db.relationship('User', backref='preferences')

    preferred_cuisine = db.Column(db.String(100), nullable=True)
    dietary_restrictions = db.Column(db.String(200), nullable=True)
    ambiance_preference = db.Column(db.String(100), nullable=True)
    
class Restaurant(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    location = db.Column(db.String(200), nullable=False)
    cuisine = db.Column(db.String(100), nullable=False)
    images = db.relationship('RestaurantImage', backref='restaurant', lazy=True, cascade="all, delete-orphan")

    capacity = db.Column(db.Integer, default=50)  
    booking_duration = db.Column(db.Integer, default=120)  # minutes
    average_price = db.Column(db.Float, nullable=True)

    lat = db.Column(db.Float)  # Latitude
    lon = db.Column(db.Float)  # Longitude
    features = db.Column(db.JSON)  # Store features as JSON array
    opening_time = db.Column(db.Time)
    closing_time = db.Column(db.Time)

    promo = db.Column(db.String(200), nullable=True)

    layouts = db.relationship('Layout', backref='restaurant', cascade="all, delete-orphan", lazy=True)

    @property
    def rating(self):
        if not self.reviews:
            return 4.0  # Default rating
        total = sum(review.rating for review in self.reviews)
        return round(total / len(self.reviews), 1)

class RestaurantImage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    restaurant_id = db.Column(db.Integer, db.ForeignKey('restaurant.id'), nullable=False)
    image_url = db.Column(db.String(300), nullable=False)

class MenuItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    restaurant_id = db.Column(db.Integer, db.ForeignKey('restaurant.id'))
    category = db.Column(db.String(50))
    name = db.Column(db.String(100))
    description = db.Column(db.String(300))
    price = db.Column(db.Float)

class Layout(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    restaurant_id = db.Column(db.Integer, db.ForeignKey('restaurant.id'), nullable=False)
    table_number = db.Column(db.Integer, nullable=False)
    x_coordinate = db.Column(db.Float, nullable=False)
    y_coordinate = db.Column(db.Float, nullable=False)
    shape = db.Column(db.String(50), default="rectangle")  # or 'circle', etc.
    capacity = db.Column(db.Integer, default=4)

class LayoutVersion(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    restaurant_id = db.Column(db.Integer, db.ForeignKey('restaurant.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    layout_data = db.Column(db.JSON)  # Stores tables' positions
    description = db.Column(db.String(200))  # "Admin edit 2024-03-15" or "Auto-generated"
    is_suggestion = db.Column(db.Boolean, default=False)

class Booking(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    restaurant_id = db.Column(db.Integer, db.ForeignKey('restaurant.id'), nullable=False)
    
    # For clarifying how many seats are needed
    num_guests = db.Column(db.Integer, nullable=True, default=1)
    
    # Store the status, so you know if it’s canceled, confirmed, completed, etc.
    status = db.Column(db.String(50), default='CONFIRMED')

    special_requests = db.Column(db.String(300), nullable=True)

    date = db.Column(db.DateTime, nullable=False)
    layout_id = db.Column(db.Integer, db.ForeignKey('layout.id'), nullable=False)

    # relationships
    restaurant = db.relationship('Restaurant', backref='bookings', lazy=True)

class Review(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    restaurant_id = db.Column(db.Integer, db.ForeignKey('restaurant.id'), nullable=False)
    rating = db.Column(db.Integer, nullable=False)
    comment = db.Column(db.String(500))
    date_created = db.Column(db.DateTime, default=datetime.utcnow)
