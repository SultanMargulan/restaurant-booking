# auth_routes.py
import logging
from flask import Blueprint, request, jsonify, session
from app.extensions import db, mail
from app.models import User, UserPreference, Review, Restaurant, Booking
from datetime import datetime, timedelta
import random
from flask_login import login_user, current_user, logout_user
from werkzeug.security import generate_password_hash, check_password_hash
from flask_mail import Message
from app.extensions import csrf
from app.utils.response import json_response
from app.utils.auth import api_login_required

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

@auth_bp.route('/login', methods=['POST'])
@csrf.exempt
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    user = User.query.filter_by(email=email).first()
    
    if user and check_password_hash(user.password, password):
        session.clear()  # Clear any existing session data
        session.permanent = True
        otp_code = str(random.randint(100000, 999999))
        session[f'otp_{user.id}'] = otp_code  # Store OTP with user ID
        logger.debug(f"Login - Stored OTP for user {user.id}: {otp_code}")
        
        try:
            msg = Message('Your OTP Code', recipients=[user.email])
            msg.body = f"Verification code: {otp_code}"
            mail.send(msg)
            return json_response(data={
                "message": "OTP sent",
                "otp_required": True,
                "temp_user_id": user.id
            }, status=200)
        except Exception as e:
            logger.error(f"Failed to send OTP: {str(e)}")
            return json_response(error=f"Failed to send OTP: {str(e)}", status=500)
    else:
        logger.warning(f"Login failed for email {email}")
        return json_response(error="Invalid credentials", status=401)

@auth_bp.route('/verify-otp', methods=['POST'])
@csrf.exempt
def verify_otp():
    data = request.get_json()
    if not data:
        logger.error("Verify OTP - Invalid request body")
        return json_response(error="Invalid request body", status=400)

    otp_code = data.get('otp_code')
    temp_user_id = data.get('temp_user_id')

    if not otp_code:
        logger.error("Verify OTP - Missing OTP code")
        return json_response(error="Missing OTP code", status=400)
    if not temp_user_id:
        logger.error("Verify OTP - Missing user ID")
        return json_response(error="Missing user ID", status=400)

    # Convert temp_user_id to integer to match session key
    try:
        user_id = int(temp_user_id)
    except (ValueError, TypeError):
        logger.error(f"Verify OTP - Invalid user ID format: {temp_user_id}")
        return json_response(error="Invalid user ID format", status=400)

    user = User.query.get(user_id)
    if not user:
        logger.error(f"Verify OTP - User not found: {user_id}")
        return json_response(error="User not found", status=404)

    stored_code = session.get(f'otp_{user_id}')
    logger.debug(f"Verify OTP - Retrieved OTP for user {user_id}: {stored_code}, Submitted OTP: {otp_code}")
    
    if not stored_code:
        logger.error(f"Verify OTP - Session expired or OTP not found for user {user_id}")
        return json_response(error="Session expired or OTP not found", status=400)
    if str(otp_code) != str(stored_code):  # Ensure both are strings for comparison
        logger.error(f"Verify OTP - Invalid OTP for user {user_id}. Expected {stored_code}, got {otp_code}")
        return json_response(error="Invalid OTP", status=400)

    session.pop(f'otp_{user_id}', None)  # Clear OTP after successful verification
    login_user(user, remember=True)
    session.permanent = True

    logger.info(f"Verify OTP - User {user_id} logged in successfully")
    return json_response(data={
        "message": "Login successful",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "is_admin": user.is_admin
        }
    }, status=200)

@auth_bp.route('/register', methods=['POST'])
@csrf.exempt
def register():
    data = request.json
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    if User.query.filter_by(email=email).first():
        return json_response(error="Email already registered.", status=400)
    new_user = User(name=name, email=email)
    new_user.password = generate_password_hash(password)
    db.session.add(new_user)
    db.session.commit()
    return json_response(data={"message": "Registration successful. Please log in."}, status=201)

@auth_bp.route('/profile', methods=['GET'])
@api_login_required
def profile():
    if current_user.preferences:
        pref = current_user.preferences[0]
        preferences_data = {
            "preferred_cuisine": pref.preferred_cuisine,
            "dietary_restrictions": pref.dietary_restrictions,
            "ambiance_preference": pref.ambiance_preference
        }
    else:
        preferences_data = {}
    return json_response(data={
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "is_admin": current_user.is_admin,
        "loyalty_points": current_user.loyalty_points,
        "loyalty_tier": current_user.loyalty_tier,
        "preferences": preferences_data
    }, status=200)

@auth_bp.route('/profile/edit', methods=['POST'])
@api_login_required
@csrf.exempt
def edit_profile():
    data = request.json
    if not data:
        return json_response(error="Invalid data", status=400)

    # Ensure name and email are provided
    new_name = data.get("name")
    new_email = data.get("email")

    if not new_name or not new_email:
        return json_response(error="Name and email are required", status=400)

    # Check if the email is already taken (but allow the same email)
    existing_user = User.query.filter(User.email == new_email, User.id != current_user.id).first()
    if existing_user:
        return json_response(error="Email is already in use by another account.", status=400)

    # Update user info
    current_user.name = new_name
    current_user.email = new_email

    try:
        db.session.commit()
        return json_response(data={"message": "Profile updated successfully."}, status=200)
    except Exception as e:
        db.session.rollback()
        return json_response(error=f"Database error: {str(e)}", status=500)

@auth_bp.route('/preferences', methods=['POST'])
@api_login_required
@csrf.exempt
def update_preferences():
    data = request.json
    existing_pref = UserPreference.query.filter_by(user_id=current_user.id).first()
    if existing_pref:
        pref = existing_pref
    else:
        pref = UserPreference(user_id=current_user.id)
        db.session.add(pref)
    pref.preferred_cuisine = data.get('preferred_cuisine') or pref.preferred_cuisine
    pref.dietary_restrictions = data.get('dietary_restrictions') or pref.dietary_restrictions
    pref.ambiance_preference = data.get('ambiance_preference') or pref.ambiance_preference
    try:
        db.session.commit()
        return json_response(data={"message": "Preferences updated."}, status=200)
    except Exception as e:
        db.session.rollback()
        return json_response(error=f"Database error: {str(e)}", status=500)

@auth_bp.route('/logout', methods=['POST'])
@api_login_required
def logout():
    logout_user()
    return json_response(data={"message": "Logged out successfully."}, status=200)
