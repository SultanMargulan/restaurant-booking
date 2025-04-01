from app.models import User, Restaurant, RestaurantImage, Review
from app.extensions import db
from datetime import datetime
import random
from werkzeug.security import generate_password_hash

# List of provided image URLs
image_urls = [
    "https://i.vimeocdn.com/video/1438791648-14bbede2257125dd829173f33e3ccc4e7d101135c2369ba85a7ab017abc89a7c-d?f=webp",
    "https://s4.afisha.ru/mediastorage/0d/5d/72afdb06555c49f59aa9d5035d0d.jpg",
    "https://i.pinimg.com/originals/fa/6f/2c/fa6f2cb035741280b0d868f80b17c3ec.jpg",
    "https://biz-nes.ru/wp-content/uploads/2022/06/Novyj-proekt-21.jpg",
    "https://delood.com/wp-content/uploads/2011/05/tres-encinas_delood001_0.jpg",
    "https://jtrelondon.com/sites/default/files/2018-01/_MG_8954.jpg",
    "https://mm-g.ru/upload/iblock/07f/07fee081eb7a21deac65b9560aa7af56.jpg",
    "https://attaches.1001tur.ru/hotels/gallery/562155/60841502884132.jpg",
    "https://static.mk.ru/upload/entities/2022/01/14/13/articles/facebookPicture/d2/a6/63/0a/0a0e8d2db18083f68f78183d16edcd6c.jpg",
    "https://i.pinimg.com/originals/4a/37/f2/4a37f2208b44ea1cc30c99087a3bb032.jpg",
]

# Data for 10 restaurants with diverse attributes
restaurants_data = [
    {
        "name": "Italian Delight",
        "location": "New York",
        "cuisine": "Italian",
        "image_urls": [image_urls[0]],
        "promo": "10% off on weekdays",
        "lat": 40.7128,
        "lon": -74.0060,
        "opening_time": "11:00",
        "closing_time": "22:00"
    },
    {
        "name": "Spicy Dragon",
        "location": "San Francisco",
        "cuisine": "Chinese",
        "image_urls": [image_urls[1]],
        "promo": None,
        "lat": 37.7749,
        "lon": -122.4194,
        "opening_time": "12:00",
        "closing_time": "23:00"
    },
    {
        "name": "Taco Fiesta",
        "location": "Los Angeles",
        "cuisine": "Mexican",
        "image_urls": [image_urls[2]],
        "promo": "Free dessert with every meal",
        "lat": 34.0522,
        "lon": -118.2437,
        "opening_time": "10:00",
        "closing_time": "21:00"
    },
    {
        "name": "Curry House",
        "location": "London",
        "cuisine": "Indian",
        "image_urls": [image_urls[3]],
        "promo": None,
        "lat": 51.5074,
        "lon": -0.1278,
        "opening_time": "11:30",
        "closing_time": "22:30"
    },
    {
        "name": "Sushi World",
        "location": "Tokyo",
        "cuisine": "Japanese",
        "image_urls": [image_urls[4]],
        "promo": "Sushi happy hour 5-7pm",
        "lat": 35.6895,
        "lon": 139.6917,
        "opening_time": "11:00",
        "closing_time": "23:00"
    },
    {
        "name": "Pasta Paradise",
        "location": "Rome",
        "cuisine": "Italian",
        "image_urls": [image_urls[5]],
        "promo": None,
        "lat": 41.9028,
        "lon": 12.4964,
        "opening_time": "12:00",
        "closing_time": "22:00"
    },
    {
        "name": "Dim Sum Delight",
        "location": "Hong Kong",
        "cuisine": "Chinese",
        "image_urls": [image_urls[6]],
        "promo": "20% off for students",
        "lat": 22.3193,
        "lon": 114.1694,
        "opening_time": "10:00",
        "closing_time": "22:00"
    },
    {
        "name": "Enchilada Express",
        "location": "Mexico City",
        "cuisine": "Mexican",
        "image_urls": [image_urls[7]],
        "promo": None,
        "lat": 19.4326,
        "lon": -99.1332,
        "opening_time": "11:00",
        "closing_time": "21:00"
    },
    {
        "name": "Tandoori Nights",
        "location": "Mumbai",
        "cuisine": "Indian",
        "image_urls": [image_urls[8]],
        "promo": "Free naan with every curry",
        "lat": 19.0760,
        "lon": 72.8777,
        "opening_time": "12:00",
        "closing_time": "23:00"
    },
    {
        "name": "Noodle Nook",
        "location": "Beijing",
        "cuisine": "Chinese",
        "image_urls": [image_urls[9]],
        "promo": None,
        "lat": 39.9042,
        "lon": 116.4074,
        "opening_time": "11:00",
        "closing_time": "22:00"
    },
]

def seed_database():
    """Seed the database with test data for the restaurant search function."""
    # Create dummy users if none exist (needed for reviews)
    if not User.query.first():
        for i in range(1, 6):
            user = User(
                name=f"Test User {i}",
                email=f"test{i}@example.com",
                password=generate_password_hash("password"),
                is_admin=False
            )
            db.session.add(user)
        db.session.commit()

    # Get all users for assigning reviews
    users = User.query.all()

    # Create restaurants
    for data in restaurants_data:
        restaurant = Restaurant(
            name=data["name"],
            location=data["location"],
            cuisine=data["cuisine"],
            promo=data["promo"],
            lat=data["lat"],
            lon=data["lon"],
            opening_time=datetime.strptime(data["opening_time"], "%H:%M").time(),
            closing_time=datetime.strptime(data["closing_time"], "%H:%M").time(),
        )
        db.session.add(restaurant)
        db.session.flush()  # Get the restaurant ID for relationships

        # Add images
        for url in data["image_urls"]:
            image = RestaurantImage(restaurant_id=restaurant.id, image_url=url)
            db.session.add(image)

        # Add random reviews (0 to 5) to vary ratings
        num_reviews = random.randint(0, 5)
        for _ in range(num_reviews):
            review = Review(
                user_id=random.choice(users).id,
                restaurant_id=restaurant.id,
                rating=random.randint(1, 5),
                comment="This is a test review.",
                date_created=datetime.utcnow()
            )
            db.session.add(review)

    db.session.commit()
    print("Database seeded successfully with 10 restaurants, images, and reviews!")