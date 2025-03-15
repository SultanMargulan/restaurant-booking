# auth_routes.py
from flask import Blueprint, request, jsonify, session
from app.extensions import db, mail
from app.models import User, UserPreference, Review, Restaurant, Booking
from datetime import datetime, timedelta
import random
from flask_login import login_user, current_user, login_required, logout_user
from werkzeug.security import generate_password_hash, check_password_hash
from flask_mail import Message
from app.extensions import csrf


auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/login', methods=['POST'])
@csrf.exempt 
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    user = User.query.filter_by(email=email).first()
    if user and check_password_hash(user.password, password):
        otp_code = str(random.randint(100000, 999999))
        session['otp_user_id'] = user.id
        session['otp_code'] = otp_code
        try:
            msg = Message('Your OTP Code', recipients=[user.email])
            msg.body = f"Your verification code is: {otp_code}"
            mail.send(msg)
            return jsonify({"message": "OTP sent", "otp_required": True}), 200
        except Exception as e:
            return jsonify({"error": f"Failed to send OTP: {str(e)}"}), 500
    else:
        return jsonify({"error": "Invalid email or password"}), 401

@auth_bp.route('/verify-otp', methods=['POST'])
@csrf.exempt
def verify_otp():
    data = request.json
    otp_code = data.get('otp_code')
    user_id = session.get('otp_user_id')
    if not user_id:
        return jsonify({"error": "Session expired. Please log in again."}), 401
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found."}), 404
    if otp_code == session.get('otp_code'):
        session.pop('otp_code', None)
        session.pop('otp_user_id', None)
        login_user(user)
        return jsonify({"message": "Logged in successfully."}), 200
    else:
        return jsonify({"error": "Invalid OTP. Please try again."}), 400

@auth_bp.route('/register', methods=['POST'])
@csrf.exempt
def register():
    data = request.json
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered."}), 400
    new_user = User(name=name, email=email)
    new_user.password = generate_password_hash(password)
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"message": "Registration successful. Please log in."}), 201

@auth_bp.route('/profile', methods=['GET'])
@login_required
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
    return jsonify({
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "is_admin": current_user.is_admin,
        "loyalty_points": current_user.loyalty_points,
        "loyalty_tier": current_user.loyalty_tier,
        "preferences": preferences_data
    }), 200

@auth_bp.route('/profile/edit', methods=['POST'])
@login_required
@csrf.exempt
def edit_profile():
    data = request.json
    if not data:
        return jsonify({"error": "Invalid data"}), 400

    # Ensure name and email are provided
    new_name = data.get("name")
    new_email = data.get("email")

    if not new_name or not new_email:
        return jsonify({"error": "Name and email are required"}), 400

    # Check if the email is already taken (but allow the same email)
    existing_user = User.query.filter(User.email == new_email, User.id != current_user.id).first()
    if existing_user:
        return jsonify({"error": "Email is already in use by another account."}), 400

    # Update user info
    current_user.name = new_name
    current_user.email = new_email

    try:
        db.session.commit()
        return jsonify({"message": "Profile updated successfully."}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Database error: {str(e)}"}), 500

@auth_bp.route('/preferences', methods=['POST'])
@login_required
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
        return jsonify({"message": "Preferences updated."}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Database error: {str(e)}"}), 500


@auth_bp.route('/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({"message": "Logged out successfully."}), 200
