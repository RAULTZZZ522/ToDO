import os
from datetime import timedelta

class Config:
    # 基本配置
    SECRET_KEY = os.environ.get('SECRET_KEY', 'todo-app-secret-key')
    
    # 数据库配置
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URI', 'sqlite:///todo_app.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT配置
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-key')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=30)
    
    # 微信小程序配置
    WECHAT_APPID = os.environ.get('WECHAT_APPID', '')
    WECHAT_SECRET = os.environ.get('WECHAT_SECRET', '')
    
    # 跨域配置
    CORS_HEADERS = 'Content-Type'

class DevelopmentConfig(Config):
    DEBUG = True

class ProductionConfig(Config):
    DEBUG = False

# 配置映射
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
} 