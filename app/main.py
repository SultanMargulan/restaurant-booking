from flask import Flask, send_from_directory
from .config import Config
from flask_migrate import Migrate
from .extensions import db, mail, login_manager, csrf
from flask_cors import CORS
from flask_wtf.csrf import CSRFProtect

import os

def create_app(config_class=Config):
    # Set static_folder to point to your React build output (e.g., "build")
    app = Flask(__name__, static_folder='build', static_url_path='')
    app.config.from_object(config_class)
    
    csrf.init_app(app)

    # Enable CORS for all routes. You can also restrict it if needed.
    CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}}, supports_credentials=True)
    
    # Initialize extensions
    db.init_app(app)
    mail.init_app(app)
    csrf.init_app(app)
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'
    Migrate(app, db)
    
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
