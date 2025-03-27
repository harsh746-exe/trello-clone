from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from .. import db

bp = Blueprint('boards', __name__, url_prefix='/api/boards')

@bp.route('/', methods=['GET'])
@jwt_required()
def get_boards():
    user_id = get_jwt_identity()
    boards = list(db.boards.find({'user_id': user_id}))
    for board in boards:
        board['_id'] = str(board['_id'])
    return jsonify(boards)

@bp.route('/', methods=['POST'])
@jwt_required()
def create_board():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data.get('title'):
        return jsonify({'message': 'Title is required'}), 400
        
    board = {
        'title': data['title'],
        'description': data.get('description', ''),
        'user_id': user_id
    }
    
    result = db.boards.insert_one(board)
    board['_id'] = str(result.inserted_id)
    
    return jsonify(board), 201

@bp.route('/<board_id>', methods=['GET'])
@jwt_required()
def get_board(board_id):
    user_id = get_jwt_identity()
    board = db.boards.find_one({'_id': ObjectId(board_id), 'user_id': user_id})
    
    if not board:
        return jsonify({'message': 'Board not found'}), 404
        
    board['_id'] = str(board['_id'])
    return jsonify(board)

@bp.route('/<board_id>', methods=['PUT'])
@jwt_required()
def update_board(board_id):
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data.get('title'):
        return jsonify({'message': 'Title is required'}), 400
        
    board = db.boards.find_one_and_update(
        {'_id': ObjectId(board_id), 'user_id': user_id},
        {'$set': {
            'title': data['title'],
            'description': data.get('description', '')
        }},
        return_document=True
    )
    
    if not board:
        return jsonify({'message': 'Board not found'}), 404
        
    board['_id'] = str(board['_id'])
    return jsonify(board)

@bp.route('/<board_id>', methods=['DELETE'])
@jwt_required()
def delete_board(board_id):
    user_id = get_jwt_identity()
    result = db.boards.delete_one({'_id': ObjectId(board_id), 'user_id': user_id})
    
    if result.deleted_count == 0:
        return jsonify({'message': 'Board not found'}), 404
        
    return jsonify({'message': 'Board deleted successfully'}) 