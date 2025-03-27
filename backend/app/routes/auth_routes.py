from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from bson.objectid import ObjectId
from .. import bcrypt, db

bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    # Validate required fields
    if not all(k in data for k in ['name', 'email', 'password']):
        return jsonify({'message': 'Missing required fields'}), 400
    
    # Check if user already exists
    if db.users.find_one({'email': data['email']}):
        return jsonify({'message': 'Email already registered'}), 400
    
    # Hash password
    hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    
    # Create user
    user = {
        'name': data['name'],
        'email': data['email'],
        'password': hashed_password
    }
    
    result = db.users.insert_one(user)
    user['_id'] = str(result.inserted_id)
    
    # Remove password from response
    user.pop('password', None)
    
    # Generate token
    token = create_access_token(identity=str(result.inserted_id))
    
    return jsonify({
        'message': 'User registered successfully',
        'token': token,
        'user': user
    }), 201

@bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    # Validate required fields
    if not all(k in data for k in ['email', 'password']):
        return jsonify({'message': 'Missing required fields'}), 400
    
    # Find user
    user = db.users.find_one({'email': data['email']})
    if not user:
        return jsonify({'message': 'Invalid email or password'}), 401
    
    # Check password
    if not bcrypt.check_password_hash(user['password'], data['password']):
        return jsonify({'message': 'Invalid email or password'}), 401
    
    # Convert ObjectId to string
    user['_id'] = str(user['_id'])
    
    # Remove password from response
    user.pop('password', None)
    
    # Generate token
    token = create_access_token(identity=str(user['_id']))
    
    return jsonify({
        'message': 'Login successful',
        'token': token,
        'user': user
    }), 200

@bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    user_id = get_jwt_identity()
    user = db.users.find_one({'_id': ObjectId(user_id)})
    
    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    # Convert ObjectId to string
    user['_id'] = str(user['_id'])
    
    # Remove password from response
    user.pop('password', None)
    
    return jsonify(user) 