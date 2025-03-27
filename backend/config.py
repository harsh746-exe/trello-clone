import os
from datetime import timedelta

class Config:
    # Flask settings
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key'
    
    # MongoDB settings
    MONGO_URI = os.environ.get('MONGO_URI') or 'mongodb://localhost:27017/trello_clone'
    
    # JWT settings
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-secret-key'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    
    # CORS settings
    CORS_HEADERS = 'Content-Type'
    
    # API settings
    API_TITLE = 'Trello Clone API'
    API_VERSION = 'v1'
    
    # Performance settings
    JSON_SORT_KEYS = False  # Disable JSON key sorting for better performance
    SEND_FILE_MAX_AGE_DEFAULT = 0  # Disable caching for development 