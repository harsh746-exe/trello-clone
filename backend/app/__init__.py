from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
from pymongo import MongoClient
from .config.config import Config

app = Flask(__name__)
app.config.from_object(Config)

# Initialize extensions
CORS(app)
jwt = JWTManager(app)
bcrypt = Bcrypt(app)

# Initialize MongoDB
client = MongoClient(Config.MONGODB_URI)
db = client[Config.MONGODB_DB]

# Import routes
from .routes import auth_routes, board_routes, list_routes, card_routes

# Register blueprints
app.register_blueprint(auth_routes.bp)
app.register_blueprint(board_routes.bp)
app.register_blueprint(list_routes.bp)
app.register_blueprint(card_routes.bp)

# Create indexes for better performance
with app.app_context():
    # User indexes
    db.users.create_index('email', unique=True)
    
    # Board indexes
    db.boards.create_index('user_id')
    db.boards.create_index('title')
    
    # List indexes
    db.lists.create_index('board_id')
    db.lists.create_index([('board_id', 1), ('position', 1)])
    
    # Card indexes
    db.cards.create_index('list_id')
    db.cards.create_index([('list_id', 1), ('position', 1)]) 