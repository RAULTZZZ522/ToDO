from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

from app import db
from app.models.todo import Todo
from app.utils.response import success_response, error_response

todos_bp = Blueprint('todos', __name__)

@todos_bp.route('/', methods=['GET'])
@jwt_required()
def get_todos():
    """获取当前用户的所有待办事项"""
    try:
        current_user_id = get_jwt_identity()
        
        # 查询该用户的所有待办事项
        todos = Todo.query.filter_by(user_id=current_user_id).all()
        
        # 转换为字典列表
        todo_list = [todo.to_dict() for todo in todos]
        
        return jsonify(success_response(todo_list, '获取待办事项成功'))
    
    except Exception as e:
        current_app.logger.error(f"获取待办事项失败: {str(e)}")
        return jsonify(error_response('获取待办事项失败', error=str(e))), 500

@todos_bp.route('/', methods=['POST'])
@jwt_required()
def add_todo():
    """添加新的待办事项"""
    try:
        current_user_id = get_jwt_identity()
        data = request.json
        
        if not data or not data.get('title'):
            return jsonify(error_response('标题不能为空')), 400
            
        # 从请求数据创建新的待办事项
        todo = Todo.from_dict(data, current_user_id)
        
        # 保存到数据库
        db.session.add(todo)
        db.session.commit()
        
        return jsonify(success_response({'id': todo.id}, '添加待办事项成功'))
    
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"添加待办事项失败: {str(e)}")
        return jsonify(error_response('添加待办事项失败', error=str(e))), 500

@todos_bp.route('/<int:todo_id>', methods=['PUT'])
@jwt_required()
def update_todo(todo_id):
    """更新待办事项"""
    try:
        current_user_id = get_jwt_identity()
        data = request.json
        
        # 查找待办事项
        todo = Todo.query.filter_by(id=todo_id, user_id=current_user_id).first()
        
        if not todo:
            return jsonify(error_response('找不到该待办事项')), 404
            
        # 更新待办事项字段
        for field in ['title', 'description', 'importance', 'completed', 
                     'tomato_duration', 'tomato_count', 'tomato_total_time', 'category']:
            if field in data:
                setattr(todo, field, data[field])
                
        # 更新更新时间
        todo.update_time = datetime.utcnow()
        
        # 保存到数据库
        db.session.commit()
        
        return jsonify(success_response({'id': todo.id}, '更新待办事项成功'))
    
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"更新待办事项失败: {str(e)}")
        return jsonify(error_response('更新待办事项失败', error=str(e))), 500

@todos_bp.route('/<int:todo_id>', methods=['DELETE'])
@jwt_required()
def delete_todo(todo_id):
    """删除待办事项"""
    try:
        current_user_id = get_jwt_identity()
        
        # 查找待办事项
        todo = Todo.query.filter_by(id=todo_id, user_id=current_user_id).first()
        
        if not todo:
            return jsonify(error_response('找不到该待办事项')), 404
            
        # 从数据库中删除
        db.session.delete(todo)
        db.session.commit()
        
        return jsonify(success_response(None, '删除待办事项成功'))
    
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"删除待办事项失败: {str(e)}")
        return jsonify(error_response('删除待办事项失败', error=str(e))), 500

@todos_bp.route('/reset', methods=['POST'])
@jwt_required()
def reset_todos():
    """重置待办事项状态，用于每日更新"""
    try:
        current_user_id = get_jwt_identity()
        
        # 重置已完成状态
        Todo.query.filter_by(user_id=current_user_id, completed=True).update({'completed': False})
        
        # 重置番茄钟计数
        Todo.query.filter_by(user_id=current_user_id).update({'tomato_count': 0})
        
        db.session.commit()
        
        return jsonify(success_response(None, '待办事项状态已重置'))
    
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"重置待办事项状态失败: {str(e)}")
        return jsonify(error_response('重置待办事项状态失败', error=str(e))), 500 