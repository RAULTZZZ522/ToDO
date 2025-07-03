from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from datetime import datetime

from app import db
from app.models.user import User
from app.utils.response import success_response, error_response
from app.utils.wechat import get_openid

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    """微信小程序登录"""
    try:
        data = request.json
        if not data or 'code' not in data:
            return jsonify(error_response('缺少参数: code')), 400
        
        code = data.get('code')
        user_info = data.get('userInfo', {})
        
        # 通过code获取openid
        try:
            wx_result = get_openid(code)
            openid = wx_result.get('openid')
            unionid = wx_result.get('unionid')
            
            if not openid:
                return jsonify(error_response('获取openid失败')), 400
            
            # 查找或创建用户
            user = User.query.filter_by(openid=openid).first()
            
            if user:
                # 更新用户信息
                user.last_login = datetime.utcnow()
                if user_info:
                    user.nickname = user_info.get('nickName', user.nickname)
                    user.avatar_url = user_info.get('avatarUrl', user.avatar_url)
                    user.gender = user_info.get('gender', user.gender)
                    user.country = user_info.get('country', user.country)
                    user.province = user_info.get('province', user.province)
                    user.city = user_info.get('city', user.city)
            else:
                # 创建新用户
                user = User(
                    openid=openid,
                    unionid=unionid,
                    nickname=user_info.get('nickName') if user_info else None,
                    avatar_url=user_info.get('avatarUrl') if user_info else None,
                    gender=user_info.get('gender', 0) if user_info else 0,
                    country=user_info.get('country') if user_info else None,
                    province=user_info.get('province') if user_info else None,
                    city=user_info.get('city') if user_info else None
                )
                db.session.add(user)
            
            db.session.commit()
            
            # 生成JWT令牌
            access_token = create_access_token(identity=openid)
            
            return jsonify(success_response({
                'token': access_token,
                'user': user.to_dict()
            }, '登录成功'))
        
        except ValueError as e:
            current_app.logger.error(f"登录失败: {str(e)}")
            return jsonify(error_response(f'登录失败: {str(e)}')), 400
        
    except Exception as e:
        current_app.logger.error(f"登录处理过程中发生错误: {str(e)}")
        return jsonify(error_response('服务器错误')), 500

@auth_bp.route('/user', methods=['GET'])
@jwt_required()
def get_user():
    """获取当前登录用户信息"""
    try:
        current_openid = get_jwt_identity()
        user = User.query.filter_by(openid=current_openid).first()
        
        if not user:
            return jsonify(error_response('用户不存在')), 404
            
        return jsonify(success_response(user.to_dict(), '获取用户信息成功'))
        
    except Exception as e:
        current_app.logger.error(f"获取用户信息失败: {str(e)}")
        return jsonify(error_response('服务器错误')), 500