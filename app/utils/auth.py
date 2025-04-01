from flask import jsonify
from flask_login import current_user

def api_login_required(func):
    def wrapper(*args, **kwargs):
        if not current_user.is_authenticated:
            return jsonify({"error": "Unauthorized"}), 401
        return func(*args, **kwargs)
    wrapper.__name__ = func.__name__  # Preserve the function name for Flask
    return wrapper