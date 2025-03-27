from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from .. import db

bp = Blueprint('lists', __name__, url_prefix='/api/lists')

@bp.route('/board/<board_id>', methods=['GET'])
@jwt_required()
def get_lists(board_id):
    lists = list(db.lists.find({'board_id': board_id}).sort('position', 1))
    for lst in lists:
        lst['_id'] = str(lst['_id'])
    return jsonify(lists)

@bp.route('/', methods=['POST'])
@jwt_required()
def create_list():
    data = request.get_json()
    
    if not all(k in data for k in ['title', 'board_id']):
        return jsonify({'message': 'Title and board_id are required'}), 400
        
    # Get the highest position
    max_position = db.lists.find_one(
        {'board_id': data['board_id']},
        sort=[('position', -1)]
    )
    position = (max_position['position'] + 1000) if max_position else 1000
        
    lst = {
        'title': data['title'],
        'board_id': data['board_id'],
        'position': position
    }
    
    result = db.lists.insert_one(lst)
    lst['_id'] = str(result.inserted_id)
    
    return jsonify(lst), 201

@bp.route('/<list_id>', methods=['PUT'])
@jwt_required()
def update_list(list_id):
    data = request.get_json()
    
    if not data.get('title'):
        return jsonify({'message': 'Title is required'}), 400
        
    lst = db.lists.find_one_and_update(
        {'_id': ObjectId(list_id)},
        {'$set': {'title': data['title']}},
        return_document=True
    )
    
    if not lst:
        return jsonify({'message': 'List not found'}), 404
        
    lst['_id'] = str(lst['_id'])
    return jsonify(lst)

@bp.route('/<list_id>', methods=['DELETE'])
@jwt_required()
def delete_list(list_id):
    user_id = get_jwt_identity()
    
    # First get the list to check board ownership
    list_data = db.lists.find_one({'_id': ObjectId(list_id)})
    if not list_data:
        return jsonify({'message': 'List not found'}), 404
        
    # Get the board to check ownership
    board = db.boards.find_one({'_id': ObjectId(list_data['board_id'])})
    if not board or board['user_id'] != user_id:
        return jsonify({'message': 'Unauthorized'}), 403
        
    # Delete the list and its cards
    result = db.lists.delete_one({'_id': ObjectId(list_id)})
    if result.deleted_count == 0:
        return jsonify({'message': 'List not found'}), 404
        
    # Delete all cards in the list
    db.cards.delete_many({'list_id': list_id})
        
    return jsonify({'message': 'List deleted successfully'})

@bp.route('/reorder', methods=['POST'])
@jwt_required()
def reorder_lists():
    data = request.get_json()
    
    if not all(k in data for k in ['board_id', 'lists']):
        return jsonify({'message': 'board_id and lists are required'}), 400
        
    for index, list_id in enumerate(data['lists']):
        db.lists.update_one(
            {'_id': ObjectId(list_id)},
            {'$set': {'position': index * 1000}}
        )
        
    return jsonify({'message': 'Lists reordered successfully'}) 