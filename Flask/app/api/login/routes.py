from datetime import datetime
from flask import request, g, jsonify
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from . import login_bp
from ... import db
from ...models import User, UserRole
from ...utils.response import success_response, error_response, validation_error
from ...utils.validators import LoginSchema, RegisterSchema, WechatLoginSchema
from ...utils.auth import jwt_required as custom_jwt_required

@login_bp.route('/login', methods=['POST'])
def login():
    """
    用户登录接口
    
    请求方法: POST
    请求体:
    {
        "username": "用户名",
        "password": "密码"
    }
    
    返回:
    成功 - {"code": 200, "msg": "登录成功", "data": {"token": "访问令牌", "user": 用户信息}}
    失败 - {"code": 401, "msg": "用户名或密码错误", "data": null}
    """
    # 验证请求数据
    schema = LoginSchema()
    data = request.get_json()
    
    # 验证表单数据
    errors = schema.validate(data)
    if errors:
        return validation_error(errors)
    
    username = data.get('username')
    password = data.get('password')
    
    # 查询用户
    user = User.query.filter_by(username=username).first()
    
    # 验证用户和密码
    if user is None or not user.verify_password(password):
        return error_response(401, "用户名或密码错误")
    
    # 更新最后登录时间
    user.last_login = datetime.utcnow()
    db.session.commit()
    
    # 创建访问令牌
    access_token = create_access_token(identity=user.id)
    
    # 返回成功响应
    return success_response({
        "token": access_token,
        "user": user.to_dict()
    }, "登录成功")

@login_bp.route('/wechat/login', methods=['POST'])
def wechat_login():
    """
    微信小程序用户登录接口
    
    请求方法: POST
    请求体:
    {
        "openid": "微信用户openid",
        "username": "用户昵称（可选）"
    }
    
    返回:
    成功 - {"code": 200, "msg": "登录成功", "data": {"token": "访问令牌", "user": 用户信息}}
    失败 - {"code": 401, "msg": "登录失败", "data": null}
    """
    # 验证请求数据
    schema = WechatLoginSchema()
    data = request.get_json()
    
    # 验证表单数据
    errors = schema.validate(data)
    if errors:
        return validation_error(errors)
    
    openid = data.get('openid')
    username = data.get('username')
    
    # 查询用户
    user = User.query.filter_by(openid=openid).first()
    
    # 如果用户不存在，则创建新用户
    if not user:
        # 生成用户名
        if not username:
            username = f"wx_user_{openid[:8]}"
            
        # 检查用户名是否存在
        existing_user = User.query.filter_by(username=username).first()
        if existing_user:
            username = f"{username}_{datetime.now().strftime('%H%M%S')}"
            
        # 创建新用户
        user = User(
            username=username,
            email=f"{openid}@wechat.temp",  # 临时邮箱
            openid=openid,
            role=UserRole.USER,
            last_login=datetime.utcnow()
        )
        # 设置临时密码
        user.password = f"wx_temp_{openid[-6:]}"
        
        # 保存到数据库
        db.session.add(user)
        db.session.commit()
    else:
        # 更新最后登录时间
        user.last_login = datetime.utcnow()
        db.session.commit()
    
    # 创建访问令牌
    access_token = create_access_token(identity=user.id)
    
    # 返回成功响应
    return success_response({
        "token": access_token,
        "user": user.to_dict()
    }, "微信登录成功")

@login_bp.route('/register', methods=['POST'])
def register():
    """
    用户注册接口
    
    请求方法: POST
    请求体:
    {
        "username": "用户名",
        "email": "邮箱",
        "password": "密码",
        "openid": "微信openid（可选）"
    }
    
    返回:
    成功 - {"code": 200, "msg": "注册成功", "data": {"token": "访问令牌", "user": 用户信息}}
    失败 - {"code": 400, "msg": "注册失败，用户名或邮箱已存在", "data": null}
    """
    # 验证请求数据
    schema = RegisterSchema()
    data = request.get_json()
    
    # 验证表单数据
    errors = schema.validate(data)
    if errors:
        return validation_error(errors)
    
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    openid = data.get('openid')  # 可选的微信openid
    
    # 检查用户名和邮箱是否已存在
    if User.query.filter_by(username=username).first():
        return error_response(400, "用户名已存在")
    
    if User.query.filter_by(email=email).first():
        return error_response(400, "邮箱已被使用")
    
    # 如果提供了openid，检查是否已绑定其他账号
    if openid and User.query.filter_by(openid=openid).first():
        return error_response(400, "该微信账号已绑定其他用户")
    
    # 创建新用户
    user = User(
        username=username,
        email=email,
        openid=openid,
        role=UserRole.USER,
        last_login=datetime.utcnow()
    )
    user.password = password  # 设置密码，会自动生成哈希值
    
    # 保存到数据库
    db.session.add(user)
    db.session.commit()
    
    # 创建访问令牌
    access_token = create_access_token(identity=user.id)
    
    # 返回成功响应
    return success_response({
        "token": access_token,
        "user": user.to_dict()
    }, "注册成功")

@login_bp.route('/verify-token', methods=['GET'])
@custom_jwt_required
def verify_token():
    """
    验证令牌有效性接口
    
    请求方法: GET
    请求头: Authorization: Bearer {token}
    
    返回:
    成功 - {"code": 200, "msg": "令牌有效", "data": {"user": 用户信息}}
    失败 - {"code": 401, "msg": "认证失败", "data": null}
    """
    # custom_jwt_required装饰器已经验证了令牌的有效性
    # 从g对象中获取当前用户
    current_user = g.current_user
    
    # 返回成功响应和用户信息
    return success_response({
        "user": current_user.to_dict()
    }, "令牌有效")

@login_bp.route('/logout', methods=['POST'])
@custom_jwt_required
def logout():
    """
    用户登出接口
    
    请求方法: POST
    请求头: Authorization: Bearer {token}
    
    返回:
    成功 - {"code": 200, "msg": "登出成功", "data": null}
    失败 - {"code": 401, "msg": "认证失败", "data": null}
    """
    # 由于JWT是无状态的，服务器端实际上不需要执行任何操作
    # 客户端需要删除本地存储的token
    # 这里只是一个形式上的接口，返回成功消息
    return success_response(None, "登出成功")

@login_bp.route('/refresh-token', methods=['POST'])
@jwt_required()
def refresh_token():
    """
    刷新令牌接口
    
    请求方法: POST
    请求头: Authorization: Bearer {token}
    
    返回:
    成功 - {"code": 200, "msg": "令牌已刷新", "data": {"token": "新的访问令牌"}}
    失败 - {"code": 401, "msg": "认证失败", "data": null}
    """
    # 获取当前用户ID
    current_user_id = get_jwt_identity()
    
    # 创建新的访问令牌
    new_token = create_access_token(identity=current_user_id)
    
    # 返回成功响应和新的访问令牌
    return success_response({
        "token": new_token
    }, "令牌已刷新")

@login_bp.route('/bind-wechat', methods=['POST'])
@custom_jwt_required
def bind_wechat():
    """
    绑定微信账号
    
    请求方法: POST
    请求头: Authorization: Bearer {token}
    请求体:
    {
        "openid": "微信openid"
    }
    
    返回:
    成功 - {"code": 200, "msg": "绑定成功", "data": {"user": 用户信息}}
    失败 - {"code": 400, "msg": "绑定失败", "data": null}
    """
    # 获取当前用户
    current_user = g.current_user
    
    # 获取请求数据
    data = request.get_json()
    openid = data.get('openid')
    
    # 验证openid
    if not openid:
        return error_response(400, "微信openid不能为空")
    
    # 检查openid是否已绑定其他账号
    existing_user = User.query.filter_by(openid=openid).first()
    if existing_user and existing_user.id != current_user.id:
        return error_response(400, "该微信账号已绑定其他用户")
    
    # 绑定openid
    current_user.openid = openid
    db.session.commit()
    
    # 返回成功响应
    return success_response({
        "user": current_user.to_dict()
    }, "微信账号绑定成功") 