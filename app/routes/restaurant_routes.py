# restaurant_routes.py
from flask import Blueprint, request
from app.extensions import db
import logging
from app.models import Restaurant, MenuItem, RestaurantImage, Layout, Review
from flask_login import login_required, current_user
# Removed unused import
import random
import math
from app.extensions import csrf
from app.utils.response import json_response

restaurant_bp = Blueprint('restaurant', __name__, url_prefix='/api/restaurants')

# Configure logger
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

PREDEFINED_LAYOUTS = {
    # Small restaurant layouts (Capacity: 20-50)
    'small_1': {
        'tables': [
            {'type': 'table', 'table_number': 1, 'x_coordinate': 15, 'y_coordinate': 15, 
             'shape': 'circle', 'capacity': 6, 'table_type': 'vip'},
            {'type': 'table', 'table_number': 2, 'x_coordinate': 15, 'y_coordinate': 30, 
             'shape': 'circle', 'capacity': 6, 'table_type': 'vip'},
            {'type': 'table', 'table_number': 3, 'x_coordinate': 50, 'y_coordinate': 50, 
             'shape': 'rectangle', 'capacity': 4, 'table_type': 'standard'},
            {'type': 'table', 'table_number': 4, 'x_coordinate': 65, 'y_coordinate': 50, 
             'shape': 'rectangle', 'capacity': 4, 'table_type': 'standard'},
            {'type': 'table', 'table_number': 5, 'x_coordinate': 50, 'y_coordinate': 65, 
             'shape': 'rectangle', 'capacity': 4, 'table_type': 'standard'},
            {'type': 'table', 'table_number': 6, 'x_coordinate': 65, 'y_coordinate': 65, 
             'shape': 'rectangle', 'capacity': 4, 'table_type': 'standard'},
        ],
        'furniture': [
            {'type': 'furniture', 'name': 'Bar', 'x_coordinate': 80, 'y_coordinate': 20, 
             'width': 15, 'height': 8, 'color': '#4a5568'},
            {'type': 'furniture', 'name': 'Entrance', 'x_coordinate': 5, 'y_coordinate': 50, 
             'width': 10, 'height': 20, 'color': '#718096'}
        ]
    },
    'small_2': {
        'tables': [
            {'type': 'table', 'table_number': i+1, 'x_coordinate': 50 + 25*math.cos(angle), 
             'y_coordinate': 50 + 25*math.sin(angle), 'shape': 'circle', 'capacity': 4, 
             'table_type': 'standard'} 
            for i, angle in enumerate([n*(2*math.pi/8) for n in range(8)])
        ],
        'furniture': [
            {'type': 'furniture', 'name': 'Show Kitchen', 'x_coordinate': 70, 'y_coordinate': 20, 
             'width': 25, 'height': 15, 'color': '#2d3748'}
        ]
    },

    # Medium restaurant layouts (Capacity: 50-100)
    'medium_1': {
        'tables': [
            {'type': 'table', 'table_number': i+1, 'x_coordinate': 10 + i*15, 'y_coordinate': 35, 
             'shape': 'rectangle', 'capacity': 6, 'table_type': 'booth'} for i in range(4)
        ] + [
            {'type': 'table', 'table_number': i+5, 'x_coordinate': 50 + (i%2)*20, 
             'y_coordinate': 50 + math.floor(i/2)*20, 'shape': 'circle', 'capacity': 4, 
             'table_type': 'standard'} for i in range(8)
        ],
        'furniture': [
            {'type': 'furniture', 'name': 'Wine Bar', 'x_coordinate': 80, 'y_coordinate': 10, 
             'width': 15, 'height': 25, 'color': '#2b6cb0'},
            {'type': 'furniture', 'name': 'Patio', 'x_coordinate': 5, 'y_coordinate': 70, 
             'width': 40, 'height': 25, 'color': '#48bb78'}
        ]
    },
    'medium_2': {
        'tables': [
            {'type': 'table', 'table_number': i+1, 'x_coordinate': 25 + (i%3)*25, 
             'y_coordinate': 35 + math.floor(i/3)*20, 'shape': 'rectangle', 'capacity': 4, 
             'table_type': 'standard' if i < 6 else 'vip'} for i in range(9)
            if not (70 <= 25 + (i%3)*25 <= 95 and 70 <= 35 + math.floor(i/3)*20 <= 95)
        ],
        'furniture': [
            {'type': 'furniture', 'name': 'Private Dining', 'x_coordinate': 70, 'y_coordinate': 70, 
             'width': 25, 'height': 25, 'color': '#c53030'},
            {'type': 'furniture', 'name': 'Sushi Counter', 'x_coordinate': 5, 'y_coordinate': 20, 
             'width': 15, 'height': 30, 'color': '#4a5568'}
        ]
    },

    # Large restaurant layouts (Capacity: 100+)
    'large_1': {
        'tables': [
            # Main dining area - symmetrical grid layout
            *[  # Left section
                {'type': 'table', 'table_number': i + 1,
                 'x_coordinate': 15 + (i % 3) * 20,
                 'y_coordinate': 20 + (i // 3) * 20,
                 'shape': 'rectangle', 'capacity': 4,
                 'table_type': 'standard'}
                for i in range(9)
            ],
            *[  # Right section
                {'type': 'table', 'table_number': i + 10,
                 'x_coordinate': 65 + (i % 2) * 20,
                 'y_coordinate': 20 + (i // 2) * 20,
                 'shape': 'rectangle', 'capacity': 4,
                 'table_type': 'standard'}
                for i in range(6)
            ],
            # VIP area with round tables
            {'type': 'table', 'table_number': 16,
             'x_coordinate': 40, 'y_coordinate': 75,
             'shape': 'circle', 'capacity': 6,
             'table_type': 'vip'},
            {'type': 'table', 'table_number': 17,
             'x_coordinate': 60, 'y_coordinate': 75,
             'shape': 'circle', 'capacity': 6,
             'table_type': 'vip'}
        ],
        'furniture': [
            {'type': 'furniture', 'name': 'Main Bar',
             'x_coordinate': 75, 'y_coordinate': 10,
             'width': 20, 'height': 8,
             'color': '#2d3748'},
            {'type': 'furniture', 'name': 'Entrance',
             'x_coordinate': 5, 'y_coordinate': 45,
             'width': 8, 'height': 15,
             'color': '#718096'},
            {'type': 'furniture', 'name': 'Lounge',
             'x_coordinate': 80, 'y_coordinate': 70,
             'width': 15, 'height': 25,
             'color': '#4a5568'}
        ]
    },
    'large_2': {
        'tables': [
            # Central booth section
            *[
                {'type': 'table', 'table_number': i + 1,
                 'x_coordinate': 40 + (i % 2) * 20,
                 'y_coordinate': 25 + (i // 2) * 15,
                 'shape': 'rectangle', 'capacity': 6,
                 'table_type': 'booth'}
                for i in range(6)
            ],
            # Window-side tables
            *[
                {'type': 'table', 'table_number': i + 7,
                 'x_coordinate': 15,
                 'y_coordinate': 20 + i * 20,
                 'shape': 'circle', 'capacity': 4,
                 'table_type': 'standard'}
                for i in range(4)
            ],
            # Bar-side high tables
            *[
                {'type': 'table', 'table_number': i + 11,
                 'x_coordinate': 85,
                 'y_coordinate': 30 + i * 15,
                 'shape': 'circle', 'capacity': 2,
                 'table_type': 'high'}
                for i in range(4)
            ],
            # VIP corner section
            {'type': 'table', 'table_number': 15,
             'x_coordinate': 40, 'y_coordinate': 80,
             'shape': 'circle', 'capacity': 8,
             'table_type': 'vip'},
            {'type': 'table', 'table_number': 16,
             'x_coordinate': 60, 'y_coordinate': 80,
             'shape': 'circle', 'capacity': 8,
             'table_type': 'vip'}
        ],
        'furniture': [
            {'type': 'furniture', 'name': 'Bar Counter',
             'x_coordinate': 70, 'y_coordinate': 10,
             'width': 25, 'height': 10,
             'color': '#2d3748'},
            {'type': 'furniture', 'name': 'Entrance',
             'x_coordinate': 5, 'y_coordinate': 45,
             'width': 8, 'height': 15,
             'color': '#718096'},
            {'type': 'furniture', 'name': 'Wine Display',
             'x_coordinate': 70, 'y_coordinate': 75,
             'width': 15, 'height': 20,
             'color': '#742a2a'}
        ]
    }
}

def select_predefined_layout(restaurant_id, capacity):
    if capacity <= 50:
        layouts = ['small_1', 'small_2']
    elif capacity <= 100:
        layouts = ['medium_1', 'medium_2']
    else:
        layouts = ['large_1', 'large_2']
    index = restaurant_id % len(layouts)
    return layouts[index]

@restaurant_bp.route('/<int:restaurant_id>/layout', methods=['GET'])
def get_restaurant_layout(restaurant_id):
    restaurant = Restaurant.query.get_or_404(restaurant_id)
    existing_layout = Layout.query.filter_by(restaurant_id=restaurant_id).all()
    
    if not existing_layout:
        layout_key = select_predefined_layout(restaurant_id, restaurant.capacity)
        layout_data = PREDEFINED_LAYOUTS[layout_key]
        
        for item in layout_data['tables'] + layout_data['furniture']:
            layout_item = Layout(
                restaurant_id=restaurant_id,
                type=item['type'],
                table_type=item.get('table_type'),
                table_number=item.get('table_number'),
                x_coordinate=item.get('x_coordinate'),
                y_coordinate=item.get('y_coordinate'),
                shape=item.get('shape'),
                capacity=item.get('capacity'),
                name=item.get('name'),
                width=item.get('width'),
                height=item.get('height'),
                color=item.get('color')
            )
            db.session.add(layout_item)
        
        db.session.commit()
        existing_layout = Layout.query.filter_by(restaurant_id=restaurant_id).all()
    
    return json_response(data=[
        {c.name: getattr(l, c.name) for c in l.__table__.columns}
        for l in existing_layout
    ], status=200)

@restaurant_bp.route('', methods=['GET'])
def get_restaurants():
    restaurants = Restaurant.query.all()
    restaurants_list = [{
        "id": r.id,
        "name": r.name,
        "location": r.location,
        "cuisine": r.cuisine,
        "promo": r.promo,
        "lat": r.lat,
        "lon": r.lon,
        "opening_time": r.opening_time.strftime("%H:%M") if r.opening_time else None,
        "closing_time": r.closing_time.strftime("%H:%M") if r.closing_time else None,
        "image_url": r.images[0].image_url if r.images else "/static/placeholder.png"
    } for r in restaurants]
    return json_response(data=restaurants_list, status=200)

@restaurant_bp.route('', methods=['POST'])
@login_required
@csrf.exempt
def add_restaurant():
    if not current_user.is_admin:
        return json_response(error="Unauthorized", status=403)

    data = request.json
    name = data.get('name')
    location = data.get('location')
    cuisine = data.get('cuisine')

    if not name or len(name.strip()) < 2:
        return json_response(error="Name must be at least 2 characters long", status=400)
    if not location or not cuisine:
        return json_response(error="Location and cuisine are required", status=400)

    try:
        new_restaurant = Restaurant(
            name=name,
            location=location,
            cuisine=cuisine,
            booking_duration=120,
            opening_time=data.get('opening_time'),
            closing_time=data.get('closing_time'),
            capacity=data.get('capacity', 50),
            average_price=data.get('average_price')
        )
        db.session.add(new_restaurant)
        db.session.commit()
        return json_response(data={"message": "Restaurant added successfully"}, status=201)
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error adding restaurant: {str(e)}", exc_info=True)
        return json_response(error="Error adding restaurant", status=500)

@restaurant_bp.route('/<int:restaurant_id>', methods=['GET'])
def restaurant_details(restaurant_id):
    restaurant = Restaurant.query.get_or_404(restaurant_id)
    data = {
        "id": restaurant.id,
        "name": restaurant.name,
        "location": restaurant.location,
        "cuisine": restaurant.cuisine,
        "promo": restaurant.promo,
        "lat": restaurant.lat,
        "lon": restaurant.lon,
        "opening_time": restaurant.opening_time.strftime("%H:%M") if restaurant.opening_time else None,
        "closing_time": restaurant.closing_time.strftime("%H:%M") if restaurant.closing_time else None,
        "images": [img.image_url for img in restaurant.images],
        "capacity": restaurant.capacity,
        "average_price": restaurant.average_price,
        "features": restaurant.features
    }
    return json_response(data=data, status=200)

@restaurant_bp.route('/<int:restaurant_id>', methods=['PUT'])
@login_required
@csrf.exempt
def edit_restaurant(restaurant_id):
    if not current_user.is_admin:
        return json_response(error="Admin privileges required", status=403)
    restaurant = Restaurant.query.get_or_404(restaurant_id)
    data = request.json
    restaurant.name = data.get('name', restaurant.name)
    restaurant.location = data.get('location', restaurant.location)
    restaurant.cuisine = data.get('cuisine', restaurant.cuisine)
    restaurant.promo = data.get('promo', restaurant.promo)
    restaurant.lat = data.get('lat', restaurant.lat)
    restaurant.lon = data.get('lon', restaurant.lon)
    restaurant.opening_time = data.get('opening_time', restaurant.opening_time)
    restaurant.closing_time = data.get('closing_time', restaurant.closing_time)

    RestaurantImage.query.filter_by(restaurant_id=restaurant.id).delete()
    image_urls = data.get('image_urls', [])
    for url in image_urls:
        url = url.strip()
        if url:
            new_image = RestaurantImage(restaurant_id=restaurant.id, image_url=url)
            db.session.add(new_image)

    db.session.commit()
    return json_response(data={"message": "Restaurant updated successfully"}, status=200)

@restaurant_bp.route('/<int:restaurant_id>', methods=['DELETE'])
@login_required
@csrf.exempt
def delete_restaurant(restaurant_id):
    if not current_user.is_admin:
        return json_response(error="Admin privileges required", status=403)
    restaurant = Restaurant.query.get_or_404(restaurant_id)
    Layout.query.filter_by(restaurant_id=restaurant.id).delete()
    db.session.delete(restaurant)
    db.session.commit()
    return json_response(data={"message": "Restaurant deleted successfully"}, status=200)

@restaurant_bp.route('/search', methods=['GET'])
def search_restaurants():
    search_query = request.args.get('q', '')
    cuisine_filter = request.args.get('cuisine', '')
    min_rating = request.args.get('min_rating', 0, type=float)

    query = Restaurant.query

    if search_query:
        query = query.filter(
            (Restaurant.name.ilike(f'%{search_query}%')) | 
            (Restaurant.location.ilike(f'%{search_query}%'))
        )

    if cuisine_filter:
        query = query.filter_by(cuisine=cuisine_filter)

    if min_rating > 0:
        query = query.filter(Restaurant.rating >= min_rating)

    results = query.all()

    return json_response(data=[{
        "id": r.id,
        "name": r.name,
        "cuisine": r.cuisine,
        "rating": r.rating,
        "lat": r.lat,
        "lon": r.lon,
        "features": r.features,
        "promo": r.promo,
        "image_url": r.images[0].image_url if r.images else ''
    } for r in results], status=200)

@restaurant_bp.route('/<int:restaurant_id>/menu', methods=['GET'])
def get_menu(restaurant_id):
    menu_items = MenuItem.query.filter_by(restaurant_id=restaurant_id).all()
    return json_response(data=[{
        "id": item.id,
        "category": item.category,
        "name": item.name,
        "description": item.description,
        "price": item.price,
        "image_url": item.image_url
    } for item in menu_items], status=200)

@restaurant_bp.route('/recommendations', methods=['GET'])
@login_required
def restaurant_recommendations():
    user_pref = current_user.preferences[0] if current_user.preferences else None
    restaurants = Restaurant.query.all()

    if not user_pref:
        return json_response(data=[
            {
                "id": r.id,
                "name": r.name,
                "location": r.location,
                "cuisine": r.cuisine
            } for r in restaurants
        ], status=200)

    pref_cuisine = user_pref.preferred_cuisine.lower() if user_pref.preferred_cuisine else None
    dietary_res = user_pref.dietary_restrictions.lower() if user_pref.dietary_restrictions else ""
    # Removed unused variable

    scored_restaurants = []

    for r in restaurants:
        score = 0
        if pref_cuisine and pref_cuisine in r.cuisine.lower():
            score += 2
        if "no peanuts" in dietary_res and "peanut" in r.cuisine.lower():
            score -= 999
        scored_restaurants.append((score, r))

    scored_restaurants.sort(key=lambda x: x[0], reverse=True)
    top_5 = scored_restaurants[:5]

    result = [{"id": rest.id, "name": rest.name, "location": rest.location, "cuisine": rest.cuisine}
              for (scr, rest) in top_5 if scr >= 0]

    return json_response(data=result, status=200)

@restaurant_bp.route('/<int:restaurant_id>/layout', methods=['PUT'])
@login_required
@csrf.exempt
def update_layout(restaurant_id):
    if not current_user.is_admin:
        return json_response(error="Admin privileges required", status=403)
    try:
        data = request.get_json()
        new_layout = data.get('layout', [])
        
        if not new_layout:
            return json_response(error="Layout data is empty", status=400)

        Layout.query.filter_by(restaurant_id=restaurant_id).delete()
        
        for item in new_layout:
            if not all(key in item for key in ['type', 'x_coordinate', 'y_coordinate']):
                return json_response(error="Missing required fields in layout item", status=400)
            
            new_item = Layout(
                restaurant_id=restaurant_id,
                type=item['type'],
                x_coordinate=float(item['x_coordinate']),
                y_coordinate=float(item['y_coordinate']),
                table_type=item.get('table_type'),
                table_number=item.get('table_number'),
                capacity=item.get('capacity', 4),
                width=item.get('width'),
                height=item.get('height'),
                color=item.get('color', '#4a5568'),
                name=item.get('name', 'New Item'),
                shape=item.get('shape', 'rectangle')
            )
            db.session.add(new_item)

        db.session.commit()
        return json_response(data={"message": "Layout updated successfully"}, status=200)
    except Exception as e:
        db.session.rollback()
        return json_response(error=f"Error saving layout: {str(e)}", status=500)

@restaurant_bp.route('/<int:restaurant_id>/suggest-layout', methods=['POST'])
@login_required
@csrf.exempt
def suggest_layout(restaurant_id):
    if not current_user.is_admin:
        return json_response(error="Admin privileges required", status=403)
    
    Layout.query.filter_by(restaurant_id=restaurant_id).delete()
    db.session.commit()

    total_tables = random.randint(8, 12)
    container_width = 800
    container_height = 600
    center_x = container_width / 2
    center_y = container_height / 2
    # Removed unused variable
    radius = random.randint(15, 30)
    offset_angle = random.random() * math.pi

    MIN_DISTANCE = 10.0  # Increased for better spacing
    SAFE_ZONE = 15.0  # Safe zone around furniture

    # Define furniture for collision checks
    furniture = [
        {'x': 5, 'y': 5, 'width': 10, 'height': 8},
        {'x': 90, 'y': 90, 'width': 10, 'height': 10}
    ]

    def is_valid_position(x, y, generated_tables):
        for f in furniture:
            fx, fy, fw, fh = f['x'], f['y'], f['width'], f['height']
            if (fx - SAFE_ZONE < x < fx + fw + SAFE_ZONE and 
                fy - SAFE_ZONE < y < fy + fh + SAFE_ZONE):
                return False
        for t in generated_tables:
            dx = x - t['x']
            dy = y - t['y']
            if math.sqrt(dx**2 + dy**2) < MIN_DISTANCE:
                return False
        return True

    generated_tables = []
    for i in range(total_tables):
        collision = True
        attempts = 0
        while collision and attempts < 100:
            angle = 2 * math.pi * i / total_tables + offset_angle
            x_px = center_x + radius * math.cos(angle)
            y_px = center_y + radius * math.sin(angle)
            x_percent = (x_px / container_width) * 100
            y_percent = (y_px / container_height) * 100
            x_percent = max(20, min(80, x_percent))
            y_percent = max(20, min(80, y_percent))

            collision = not is_valid_position(x_percent, y_percent, generated_tables)
            if collision:
                radius += 1
            attempts += 1

        if not collision:
            generated_tables.append({'x': x_percent, 'y': y_percent})
            new_table = Layout(
                restaurant_id=restaurant_id,
                table_number=i + 1,
                x_coordinate=x_percent,
                y_coordinate=y_percent,
                shape='circle' if random.random() < 0.5 else 'rectangle',
                capacity=random.randint(2, 8)
            )
            db.session.add(new_table)
    db.session.commit()

    tables = Layout.query.filter_by(restaurant_id=restaurant_id).all()
    layout_data = [{
        "id": t.id,
        "table_number": t.table_number,
        "x_coordinate": t.x_coordinate,
        "y_coordinate": t.y_coordinate,
        "shape": t.shape,
        "capacity": t.capacity,
        "type": "table"
    } for t in tables]

    furniture_data = [
        {"id": 101, "name": "Bar", "x_coordinate": 5, "y_coordinate": 5, "width": 10, "height": 8, "color": "#6c757d", "type": "furniture"},
        {"id": 102, "name": "Stage", "x_coordinate": 90, "y_coordinate": 90, "width": 10, "height": 10, "color": "#343a40", "type": "furniture"}
    ]
    return json_response(data=layout_data + furniture_data, status=200)

@restaurant_bp.route('/<int:restaurant_id>/reviews', methods=['GET'])
def list_reviews(restaurant_id):
    page = request.args.get('page', 1, type=int)
    per_page = 10

    reviews = Review.query.filter_by(restaurant_id=restaurant_id).order_by(Review.date_created.desc()).paginate(page=page, per_page=per_page)

    reviews_list = [{
        "id": r.id,
        "user_id": r.user_id,
        "restaurant_id": r.restaurant_id,
        "rating": r.rating,
        "comment": r.comment,
        "date_created": r.date_created
    } for r in reviews.items]

    return json_response(data={
        "reviews": reviews_list,
        "total_pages": reviews.pages
    }, status=200)

@csrf.exempt
@restaurant_bp.route('/<int:restaurant_id>/reviews', methods=['POST'])
@login_required
def add_review(restaurant_id):
    data = request.json
    rating = data.get('rating')
    comment = data.get('comment')

    if not rating or not comment:
        return json_response(error="Rating and comment are required", status=400)

    if not (1 <= rating <= 5):
        return json_response(error="Rating must be 1-5", status=400)
    
    new_review = Review(
        user_id=current_user.id,
        restaurant_id=restaurant_id,
        rating=rating,
        comment=comment
    )
    db.session.add(new_review)
    db.session.commit()

    return json_response(data={"message": "Review added successfully", "review_id": new_review.id}, status=201)

@restaurant_bp.route('/count', methods=['GET'])
def get_restaurant_count():
    count = Restaurant.query.count()
    return json_response(data={"count": count}, status=200)

