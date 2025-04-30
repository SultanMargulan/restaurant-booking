from flask import Flask, send_from_directory
from .config import Config
from flask_migrate import Migrate
from .extensions import db, mail, login_manager, csrf, limiter
from flask_cors import CORS
from flask_wtf.csrf import CSRFProtect
from datetime import timedelta
import os
import logging
import sys

logging.basicConfig(
    level=logging.DEBUG,
    stream=sys.stdout,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

def create_app(config_class=Config):
    app = Flask(__name__, static_folder='build', static_url_path='')
    app.config.from_object(config_class)

    # Session configuration
    app.config.update(
        SECRET_KEY='unique-secret-key',  # Replace with a secure key
        SESSION_TYPE='filesystem',  # Use filesystem for session storage
        SESSION_COOKIE_NAME='restaurant_session',
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SECURE=False,  # For development only
        SESSION_COOKIE_SAMESITE='Lax',
        PERMANENT_SESSION_LIFETIME=timedelta(hours=12)
    )

    csrf.init_app(app)

    # Enable CORS
    CORS(app, resources={r"/api/*": {
            "origins": [
                "http://localhost:3000",          # Chrome on your laptop
                "http://10.0.2.2:3000",           # Android emulator WebView
                "http://192.168.0.0/16"           # any phone on your LAN
            ],
            "supports_credentials": True,
            "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    }})

    # Initialize extensions
    db.init_app(app)
    mail.init_app(app)
    csrf.init_app(app)
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'
    Migrate(app, db)
    limiter.init_app(app)  # Add this line
    
    # Register user loader
    from .models import User
    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    # Register API blueprints
    from .routes import register_routes
    register_routes(app)

    # Catch-all route to serve the React app for any non-API route
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_react(path):
        if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)
        return send_from_directory(app.static_folder, 'index.html')

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)
