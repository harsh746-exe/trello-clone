import pytest
from app import app
from app.routes.auth_routes import bp as auth_bp
from app.routes.board_routes import bp as board_bp
from app.routes.list_routes import bp as list_bp
from app.routes.card_routes import bp as card_bp

@pytest.fixture
def client():
    app.config['TESTING'] = True
    app.config['JWT_SECRET_KEY'] = 'test-jwt-secret-key'
    
    with app.test_client() as client:
        yield client

def test_app_creation():
    assert app is not None
    assert auth_bp is not None
    assert board_bp is not None
    assert list_bp is not None
    assert card_bp is not None

def test_health_check(client):
    response = client.get('/api/health')
    assert response.status_code == 200
    assert response.json['status'] == 'healthy' 