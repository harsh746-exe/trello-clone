from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from .. import db

bp = Blueprint('cards', __name__, url_prefix='/api/cards')

@bp.route('/list/<list_id>', methods=['GET'])
@jwt_required()
def get_cards(list_id):
    cards = list(db.cards.find({'list_id': list_id}).sort('position', 1))
    for card in cards:
        card['_id'] = str(card['_id'])
    return jsonify(cards)

@bp.route('/', methods=['POST'])
@jwt_required()
def create_card():
    data = request.get_json()
    
    if not all(k in data for k in ['title', 'list_id']):
        return jsonify({'message': 'Title and list_id are required'}), 400
        
    # Get the highest position
    max_position = db.cards.find_one(
        {'list_id': data['list_id']},
        sort=[('position', -1)]
    )
    position = (max_position['position'] + 1000) if max_position else 1000
        
    card = {
        'title': data['title'],
        'description': data.get('description', ''),
        'list_id': data['list_id'],
        'position': position,
        'deadline': data.get('deadline'),
        'priority': data.get('priority', 'low')
    }
    
    result = db.cards.insert_one(card)
    card['_id'] = str(result.inserted_id)
    
    return jsonify(card), 201

@bp.route('/<card_id>', methods=['PUT'])
@jwt_required()
def update_card(card_id):
    data = request.get_json()
    
    if not data.get('title'):
        return jsonify({'message': 'Title is required'}), 400
        
    update_data = {
        'title': data['title'],
        'description': data.get('description', ''),
        'deadline': data.get('deadline'),
        'priority': data.get('priority', 'low')
    }
    
    # Remove None values
    update_data = {k: v for k, v in update_data.items() if v is not None}
    
    result = db.cards.update_one(
        {'_id': ObjectId(card_id)},
        {'$set': update_data}
    )
    
    if result.modified_count == 0:
        return jsonify({'message': 'Card not found'}), 404
        
    updated_card = db.cards.find_one({'_id': ObjectId(card_id)})
    updated_card['_id'] = str(updated_card['_id'])
    
    return jsonify(updated_card)

@bp.route('/<card_id>', methods=['DELETE'])
@jwt_required()
def delete_card(card_id):
    user_id = get_jwt_identity()
    
    # First get the card to find its list
    card = db.cards.find_one({'_id': ObjectId(card_id)})
    if not card:
        return jsonify({'message': 'Card not found'}), 404
        
    # Get the list to find the board
    list_data = db.lists.find_one({'_id': ObjectId(card['list_id'])})
    if not list_data:
        return jsonify({'message': 'List not found'}), 404
        
    # Get the board to check ownership
    board = db.boards.find_one({'_id': ObjectId(list_data['board_id'])})
    if not board or board['user_id'] != user_id:
        return jsonify({'message': 'Unauthorized'}), 403
        
    # Delete the card
    result = db.cards.delete_one({'_id': ObjectId(card_id)})
    if result.deleted_count == 0:
        return jsonify({'message': 'Card not found'}), 404
        
    return jsonify({'message': 'Card deleted successfully'})

@bp.route('/reorder', methods=['POST'])
@jwt_required()
def reorder_cards():
    data = request.get_json()
    
    if not all(k in data for k in ['source_list_id', 'destination_list_id', 'cards']):
        return jsonify({'message': 'source_list_id, destination_list_id, and cards are required'}), 400
        
    for index, card_id in enumerate(data['cards']):
        db.cards.update_one(
            {'_id': ObjectId(card_id)},
            {'$set': {
                'list_id': data['destination_list_id'],
                'position': index * 1000
            }}
        )
        
    return jsonify({'message': 'Cards reordered successfully'}) 