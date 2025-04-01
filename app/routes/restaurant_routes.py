# restaurant_routes.py
from flask import Blueprint, request, jsonify
from app.extensions import db, mail
from app.models import Restaurant, MenuItem, RestaurantImage, Layout, Review, LayoutVersion
from flask_login import login_required, current_user
from flask_mail import Message
import random
import math
from app.extensions import csrf
from app.utils.response import json_response

restaurant_bp = Blueprint('restaurant', __name__, url_prefix='/api/restaurants')

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
        return json_response(error="Admin privileges required", status=403)

    data = request.json
    name = data.get('name')
    location = data.get('location')
    cuisine = data.get('cuisine')

    # Basic validation
    if not name or len(name.strip()) < 2:
        return json_response(error="Restaurant name must be at least 2 characters", status=400)
    if not location or not cuisine:
        return json_response(error="Location and cuisine are required", status=400)

    try:
        db.session.begin_nested()  # Start transaction
        new_restaurant = Restaurant(
            name=name,
            location=location,
            cuisine=cuisine,
            promo=data.get('promo'),  # Add promo field
            lat=data.get('lat'),
            lon=data.get('lon'),
            opening_time=data.get('opening_time'),
            closing_time=data.get('closing_time')
        )
        db.session.add(new_restaurant)
        db.session.flush()  # Assign ID before adding images

        image_urls = data.get('image_urls', [])
        for url in image_urls:
            url = url.strip()
            if url:
                restaurant_image = RestaurantImage(restaurant_id=new_restaurant.id, image_url=url)
                db.session.add(restaurant_image)

        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return json_response(error="Failed to create restaurant", status=500)

    return json_response(data={"message": "Restaurant added successfully", "restaurant_id": new_restaurant.id}, status=201)

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

    # Remove existing images and add new ones
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
    # Delete related layouts first
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
        "rating": r.rating,  # Now using the computed property
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
        "category": item.category,
        "name": item.name,
        "description": item.description,
        "price": item.price
    } for item in menu_items], status=200)

@restaurant_bp.route('/recommendations', methods=['GET'])
@login_required
def restaurant_recommendations():
    """
    A simple content-based recommender:
    1) Look at current_user's preferences.
    2) For each restaurant, compute a 'score' based on matching preferences.
    3) Sort by score desc, return top 5.
    """
    user_pref = current_user.preferences[0] if current_user.preferences else None
    restaurants = Restaurant.query.all()

    if not user_pref:
        # If user has no preferences, just return all or random.
        # Return them unfiltered for simplicity
        return json_response(data=[
            {
                "id": r.id,
                "name": r.name,
                "location": r.location,
                "cuisine": r.cuisine
            } for r in restaurants
        ], status=200)

    # Extract user prefs
    pref_cuisine = user_pref.preferred_cuisine.lower() if user_pref.preferred_cuisine else None
    dietary_res = user_pref.dietary_restrictions.lower() if user_pref.dietary_restrictions else ""
    ambiance_pref = user_pref.ambiance_preference.lower() if user_pref.ambiance_preference else ""

    # We'll store (score, restaurant_obj) in a list
    scored_restaurants = []

    for r in restaurants:
        score = 0

        # 1) Cuisine match => +2
        if pref_cuisine and pref_cuisine in r.cuisine.lower():
            score += 2

        # 2) If "no peanuts" and r might be "peanut-heavy" => skip or reduce
        # For example, if user said "no peanuts" in dietaryRes,
        # But your restaurant data doesn't store it, you can skip or
        # do partial matching. We'll just do a naive example:
        if "no peanuts" in dietary_res:
            # If the restaurant has 'peanut' in its name/cuisine => reduce points
            if "peanut" in r.cuisine.lower():
                # or skip entirely
                score -= 999  # effectively kill it
        # If the user said "vegan" but r has "steak" in cuisine => also kill it, etc.

        # 3) Ambiance => if you had a field r.ambiance
        # We'll do a naive example
        # if r.ambiance and ambiance_pref in r.ambiance.lower():
        #     score += 1

        # If the restaurant hasn't been effectively killed, keep it
        scored_restaurants.append((score, r))

    # Sort by score descending
    scored_restaurants.sort(key=lambda x: x[0], reverse=True)

    # Return top 5 or top 10
    top_5 = scored_restaurants[:5]

    # Convert to JSON
    result = []
    for (scr, rest) in top_5:
        if scr < 0:
            continue  # skip if negative
        result.append({
            "id": rest.id,
            "name": rest.name,
            "location": rest.location,
            "cuisine": rest.cuisine,
            # "score": scr, # optionally return the score
        })

    return json_response(data=result, status=200)

@restaurant_bp.route('/<int:restaurant_id>/layout', methods=['GET'])
def get_restaurant_layout(restaurant_id):
    # Define safe region for tables (in percentages)
    safe_x_min = 20
    safe_x_max = 80
    safe_y_min = 20
    safe_y_max = 80

    # Try to load existing tables from DB
    tables = Layout.query.filter_by(restaurant_id=restaurant_id).all()

    # If no tables exist, generate a baseline layout
    if not tables:
        # Randomly choose between a ring layout and a grid layout
        if random.random() < 0.5:
            # Ring layout within safe zone: center at (50,50) and radius that keeps tables in [20,80]
            total_tables = 8
            max_radius = min(50 - safe_x_min, safe_x_max - 50)  # = 30
            radius_px = random.randint(10, int(max_radius))  # choose a radius between 10 and 30
            for i in range(total_tables):
                angle = 2 * math.pi * i / total_tables
                # Compute percentage positions
                x_percent = 50 + radius_px * math.cos(angle)
                y_percent = 50 + radius_px * math.sin(angle)
                # Ensure values are clamped into safe zone
                x_percent = max(safe_x_min, min(safe_x_max, x_percent))
                y_percent = max(safe_y_min, min(safe_y_max, y_percent))
                new_table = Layout(
                    restaurant_id=restaurant_id,
                    table_number=i + 1,
                    x_coordinate=x_percent,
                    y_coordinate=y_percent,
                    shape='circle',
                    capacity=4
                )
                db.session.add(new_table)
        else:
            # Grid layout within safe zone
            rows = 3
            cols = 3
            # Compute spacing so that the grid fits within safe region.
            # safe region width in % = (safe_x_max - safe_x_min)
            horizontal_spacing = (safe_x_max - safe_x_min) / (cols - 1) if cols > 1 else 0
            vertical_spacing = (safe_y_max - safe_y_min) / (rows - 1) if rows > 1 else 0

            table_number = 1
            for row in range(rows):
                for col in range(cols):
                    x_percent = safe_x_min + col * horizontal_spacing
                    y_percent = safe_y_min + row * vertical_spacing
                    new_table = Layout(
                        restaurant_id=restaurant_id,
                        table_number=table_number,
                        x_coordinate=x_percent,
                        y_coordinate=y_percent,
                        shape='rectangle',
                        capacity=4
                    )
                    db.session.add(new_table)
                    table_number += 1
        db.session.commit()
        tables = Layout.query.filter_by(restaurant_id=restaurant_id).all()

    # Build layout items for response
    layout_data = [{
        "id": t.id,
        "table_number": t.table_number,
        "x_coordinate": t.x_coordinate,
        "y_coordinate": t.y_coordinate,
        "shape": t.shape,
        "capacity": t.capacity,
        "type": "table"
    } for t in tables]

    # Always add ephemeral furniture in fixed positions outside the safe zone:
    furniture = [
        {
            "id": 101,
            "name": "Bar",
            "x_coordinate": 5,   # top-left corner (outside safe zone)
            "y_coordinate": 5,
            "width": 10,
            "height": 8,
            "color": "#6c757d",
            "type": "furniture"
        },
        {
            "id": 102,
            "name": "Stage",
            "x_coordinate": 90,  # bottom-right corner (outside safe zone)
            "y_coordinate": 90,
            "width": 10,
            "height": 10,
            "color": "#343a40",
            "type": "furniture"
        }
    ]

    return json_response(data=layout_data + furniture, status=200)

@restaurant_bp.route('/<int:restaurant_id>/layout', methods=['PUT'])
@login_required
@csrf.exempt
def update_layout(restaurant_id):
    if not current_user.is_admin:
        return json_response(error="Admin privileges required", status=403)

    data = request.json
    new_layout = data.get('layout')
    if not new_layout:
        return json_response(error="No layout data provided", status=400)

    # Validate coordinates for each table
    for table_data in new_layout:
        x = table_data.get('x_coordinate')
        y = table_data.get('y_coordinate')
        if not (20 <= x <= 80) or not (20 <= y <= 80):
            return json_response(
                error=f"Table {table_data.get('id')}: Coordinates must be between 20% and 80%",
                status=400
            )

    # Update existing tables
    for table_data in new_layout:
        table = Layout.query.get(table_data.get('id'))
        if table and table.restaurant_id == restaurant_id:
            table.x_coordinate = float(table_data.get('x_coordinate', table.x_coordinate))
            table.y_coordinate = float(table_data.get('y_coordinate', table.y_coordinate))
            table.capacity = int(table_data.get('capacity', table.capacity))

    new_version = LayoutVersion(
        restaurant_id=restaurant_id,
        layout_data=new_layout
    )
    db.session.add(new_version)
    db.session.commit()

    return json_response(data={"message": "Layout updated successfully"}, status=200)

@restaurant_bp.route('/<int:restaurant_id>/suggest-layout', methods=['POST'])
@login_required
@csrf.exempt
def suggest_layout(restaurant_id):
    if not current_user.is_admin:
        return json_response(error="Admin privileges required", status=403)
    
    # Remove existing layout for a fresh start
    Layout.query.filter_by(restaurant_id=restaurant_id).delete()
    db.session.commit()

    total_tables = random.randint(8, 12)
    container_width = 800
    container_height = 600
    center_x = container_width / 2
    center_y = container_height / 2
    max_radius = min(50 - 20, 80 - 50)  # using safe zone 20-80%
    radius = random.randint(10, 30)
    offset_angle = random.random() * math.pi

    MIN_DISTANCE = 5.0  # Minimum distance between tables (in percentage)

    generated_tables = []
    for i in range(total_tables):
        collision = True
        attempts = 0
        while collision and attempts < 100:
            # Generate candidate position
            angle = 2 * math.pi * i / total_tables + offset_angle
            x_px = center_x + radius * math.cos(angle)
            y_px = center_y + radius * math.sin(angle)
            x_percent = (x_px / container_width) * 100
            y_percent = (y_px / container_height) * 100
            x_percent = max(20, min(80, x_percent))
            y_percent = max(20, min(80, y_percent))

            # Check for collisions
            collision = False
            for existing in generated_tables:
                dx = existing['x'] - x_percent
                dy = existing['y'] - y_percent
                distance = math.sqrt(dx**2 + dy**2)
                if distance < MIN_DISTANCE:
                    collision = True
                    radius += 1  # Adjust radius to avoid collision
                    break

            attempts += 1

        if not collision:
            generated_tables.append({'x': x_percent, 'y': y_percent})
            # Create and save new table
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

    # Ephemeral furniture always appended in fixed safe spots
    furniture = [
        {
            "id": 101,
            "name": "Bar",
            "x_coordinate": 5,
            "y_coordinate": 5,
            "width": 10,
            "height": 8,
            "color": "#6c757d",
            "type": "furniture"
        },
        {
            "id": 102,
            "name": "Stage",
            "x_coordinate": 90,
            "y_coordinate": 90,
            "width": 10,
            "height": 10,
            "color": "#343a40",
            "type": "furniture"
        }
    ]
    return json_response(data=layout_data + furniture, status=200)

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

