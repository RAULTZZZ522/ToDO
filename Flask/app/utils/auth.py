from functools import wraps
from flask import request, g
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from ..models import User, UserRole
from .response import error_response

def jwt_required(fn):
    """
    JWT令牌验证装饰器
    
    Args:
        fn: 被装饰的函数
        
    Returns:
        包含验证逻辑的装饰函数
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            # 验证JWT
            verify_jwt_in_request()
            # 获取用户ID
            user_id = get_jwt_identity()
            # 查询用户
            user = User.query.get(user_id)
            if not user:
                return error_response(401, "用户不存在或已被删除")
            # 将用户对象存储在g中，供后续使用
            g.current_user = user
            return fn(*args, **kwargs)
        except Exception as e:
            return error_response(401, f"认证失败: {str(e)}")
    return wrapper

def admin_required(fn):
    """
    管理员权限验证装饰器
    
    Args:
        fn: 被装饰的函数
        
    Returns:
        包含验证管理员身份逻辑的装饰函数
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        # 先验证JWT
        try:
            verify_jwt_in_request()
            # 获取用户ID
            user_id = get_jwt_identity()
            # 查询用户
            user = User.query.get(user_id)
            if not user:
                return error_response(401, "用户不存在或已被删除")
            # 检查用户角色
            if user.role != UserRole.ADMIN:
                return error_response(403, "权限不足，需要管理员权限")
            # 将用户对象存储在g中，供后续使用
            g.current_user = user
            return fn(*args, **kwargs)
        except Exception as e:
            return error_response(401, f"认证失败: {str(e)}")
    return wrapper 