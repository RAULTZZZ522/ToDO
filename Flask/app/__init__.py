from flask import Flask, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
import os
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 初始化扩展，但不绑定到应用实例
db = SQLAlchemy()
jwt = JWTManager()
migrate = Migrate()

def create_app(config_name=None):
    app = Flask(__name__)
    
    # 配置应用
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev_secret_key')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URI', 'sqlite:///todo.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'jwt_secret_key')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = 3600  # 令牌有效期1小时
    
    # 初始化扩展
    CORS(app)
    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)
    
    # 注册蓝图
    from .api.login import login_bp
    from .api.todo import todo_bp
    from .api.admin import admin_bp
    from .api.statistics import statistics_bp
    from .api.timer import timer_bp
    
    app.register_blueprint(login_bp, url_prefix='/api')
    app.register_blueprint(todo_bp, url_prefix='/api')
    app.register_blueprint(admin_bp, url_prefix='/api')
    app.register_blueprint(statistics_bp, url_prefix='/api')
    app.register_blueprint(timer_bp, url_prefix='/api')
    
    # 通用错误处理
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"code": 404, "msg": "资源不存在", "data": None}), 404
    
    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({"code": 500, "msg": "服务器内部错误", "data": None}), 500
    
    # 创建数据库表
    with app.app_context():
        db.create_all()
    
    return app 