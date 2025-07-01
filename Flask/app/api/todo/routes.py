from datetime import datetime
from flask import request, g, jsonify
from . import todo_bp
from ... import db
from ...models import Todo, User
from ...utils.response import success_response, error_response, validation_error
from ...utils.validators import TodoSchema
from ...utils.auth import jwt_required
from ...utils.export import export_to_csv, export_to_excel

@todo_bp.route('/todos', methods=['GET'])
@jwt_required
def get_todos():
    """
    获取当前用户的所有待办事项
    
    请求方法: GET
    请求参数:
    - completed: 可选，筛选是否完成
    - category: 可选，按分类筛选
    - importance: 可选，按重要性筛选
    
    返回:
    成功 - {"code": 200, "msg": "获取成功", "data": [待办事项列表]}
    """
    # 获取查询参数
    completed = request.args.get('completed')
    if completed is not None:
        completed = completed.lower() == 'true'
    
    category = request.args.get('category')
    importance = request.args.get('importance')
    
    # 构建查询条件
    query = Todo.query.filter_by(user_id=g.current_user.id)
    
    # 应用筛选条件
    if completed is not None:
        query = query.filter_by(completed=completed)
    
    if category:
        query = query.filter_by(category=category)
    
    if importance:
        query = query.filter_by(importance=int(importance))
    
    # 执行查询，按创建时间降序排序
    todos = query.order_by(Todo.create_time.desc()).all()
    
    # 转换为字典列表
    result = [todo.to_dict() for todo in todos]
    
    return success_response(result, "获取待办事项成功")

@todo_bp.route('/todos/<int:todo_id>', methods=['GET'])
@jwt_required
def get_todo(todo_id):
    """
    获取单个待办事项详情
    
    请求方法: GET
    
    返回:
    成功 - {"code": 200, "msg": "获取成功", "data": 待办事项详情}
    失败 - {"code": 404, "msg": "待办事项不存在", "data": null}
    """
    # 查询待办事项
    todo = Todo.query.filter_by(id=todo_id, user_id=g.current_user.id).first()
    
    # 检查是否存在
    if not todo:
        return error_response(404, "待办事项不存在")
    
    return success_response(todo.to_dict(), "获取待办事项详情成功")

@todo_bp.route('/todos', methods=['POST'])
@jwt_required
def create_todo():
    """
    创建新的待办事项
    
    请求方法: POST
    请求体:
    {
        "title": "标题",
        "description": "描述",
        "completed": false,
        "importance": 3,
        "category": "分类",
        "deadline": "截止日期时间"
    }
    
    返回:
    成功 - {"code": 200, "msg": "创建成功", "data": 新创建的待办事项}
    失败 - {"code": 400, "msg": "数据验证失败", "data": 错误信息}
    """
    # 验证请求数据
    schema = TodoSchema()
    data = request.get_json()
    
    # 验证表单数据
    errors = schema.validate(data)
    if errors:
        return validation_error(errors)
    
    # 创建新的待办事项
    todo = Todo(
        title=data.get('title'),
        description=data.get('description'),
        completed=data.get('completed', False),
        importance=data.get('importance', 2),
        category=data.get('category'),
        deadline=data.get('deadline'),
        user_id=g.current_user.id,
        openid=g.current_user.openid or data.get('_openid')
    )
    
    # 保存到数据库
    db.session.add(todo)
    db.session.commit()
    
    # 返回新创建的待办事项
    return success_response(todo.to_dict(), "创建待办事项成功")

@todo_bp.route('/todos/<int:todo_id>', methods=['PUT'])
@jwt_required
def update_todo(todo_id):
    """
    更新待办事项
    
    请求方法: PUT
    请求体: 同创建待办事项
    
    返回:
    成功 - {"code": 200, "msg": "更新成功", "data": 更新后的待办事项}
    失败 - {"code": 404, "msg": "待办事项不存在", "data": null}
    """
    # 查询待办事项
    todo = Todo.query.filter_by(id=todo_id, user_id=g.current_user.id).first()
    
    # 检查是否存在
    if not todo:
        return error_response(404, "待办事项不存在")
    
    # 获取请求数据
    schema = TodoSchema()
    data = request.get_json()
    
    # 验证表单数据
    errors = schema.validate(data)
    if errors:
        return validation_error(errors)
    
    # 更新字段
    if 'title' in data:
        todo.title = data['title']
    
    if 'description' in data:
        todo.description = data['description']
    
    if 'completed' in data:
        todo.completed = data['completed']
    
    if 'importance' in data:
        todo.importance = data['importance']
    
    if 'category' in data:
        todo.category = data['category']
    
    if 'deadline' in data:
        todo.deadline = data['deadline']
    
    # 更新时间
    todo.update_time = datetime.utcnow()
    
    # 保存到数据库
    db.session.commit()
    
    # 返回更新后的待办事项
    return success_response(todo.to_dict(), "更新待办事项成功")

@todo_bp.route('/todos/<int:todo_id>', methods=['DELETE'])
@jwt_required
def delete_todo(todo_id):
    """
    删除待办事项
    
    请求方法: DELETE
    
    返回:
    成功 - {"code": 200, "msg": "删除成功", "data": null}
    失败 - {"code": 404, "msg": "待办事项不存在", "data": null}
    """
    # 查询待办事项
    todo = Todo.query.filter_by(id=todo_id, user_id=g.current_user.id).first()
    
    # 检查是否存在
    if not todo:
        return error_response(404, "待办事项不存在")
    
    # 从数据库中删除
    db.session.delete(todo)
    db.session.commit()
    
    return success_response(None, "删除待办事项成功")

@todo_bp.route('/todos/export', methods=['GET'])
@jwt_required
def export_todos():
    """
    导出待办事项
    
    请求方法: GET
    请求参数:
    - format: 导出格式，可选 'csv' 或 'excel'，默认 'csv'
    - completed: 可选，筛选是否完成
    - category: 可选，按分类筛选
    
    返回:
    成功 - 文件下载
    """
    # 获取导出格式
    export_format = request.args.get('format', 'csv').lower()
    
    # 获取筛选条件
    completed = request.args.get('completed')
    if completed is not None:
        completed = completed.lower() == 'true'
    
    category = request.args.get('category')
    
    # 构建查询
    query = Todo.query.filter_by(user_id=g.current_user.id)
    
    # 应用筛选条件
    if completed is not None:
        query = query.filter_by(completed=completed)
    
    if category:
        query = query.filter_by(category=category)
    
    # 执行查询
    todos = query.order_by(Todo.create_time.desc()).all()
    
    # 转换为字典列表
    todos_data = [todo.to_dict() for todo in todos]
    
    # 根据格式导出
    if export_format == 'excel':
        return export_to_excel(todos_data, f"todos_{g.current_user.username}")
    else:
        return export_to_csv(todos_data, f"todos_{g.current_user.username}")

@todo_bp.route('/todos/batch', methods=['POST'])
@jwt_required
def batch_update_todos():
    """
    批量更新待办事项状态
    
    请求方法: POST
    请求体:
    {
        "todo_ids": [1, 2, 3],
        "completed": true
    }
    
    返回:
    成功 - {"code": 200, "msg": "批量更新成功", "data": null}
    """
    # 获取请求数据
    data = request.get_json()
    todo_ids = data.get('todo_ids', [])
    completed = data.get('completed')
    
    # 验证参数
    if not todo_ids or completed is None:
        return error_response(400, "参数错误，需要待办ID列表和完成状态")
    
    # 批量更新
    todos = Todo.query.filter(
        Todo.id.in_(todo_ids),
        Todo.user_id == g.current_user.id
    ).all()
    
    for todo in todos:
        todo.completed = completed
        todo.update_time = datetime.utcnow()
    
    # 保存到数据库
    db.session.commit()
    
    return success_response(None, "批量更新成功")

@todo_bp.route('/todos/categories', methods=['GET'])
@jwt_required
def get_categories():
    """
    获取用户所有待办事项的分类列表
    
    请求方法: GET
    
    返回:
    成功 - {"code": 200, "msg": "获取成功", "data": ["分类1", "分类2", ...]}
    """
    # 查询用户的所有分类
    categories = db.session.query(Todo.category).filter(
        Todo.user_id == g.current_user.id,
        Todo.category.isnot(None)
    ).distinct().all()
    
    # 提取分类名称
    category_list = [category[0] for category in categories]
    
    return success_response(category_list, "获取分类列表成功")

@todo_bp.route('/todos/wechat', methods=['POST'])
def sync_wechat_todo():
    """
    同步微信小程序的待办事项
    
    请求方法: POST
    请求体:
    {
        "_id": "微信端记录ID",
        "_openid": "微信用户ID",
        "title": "标题",
        "description": "描述",
        "completed": false,
        "importance": 3,
        "category": "分类",
        "createTime": "创建时间",
        "updateTime": "更新时间"
    }
    
    返回:
    成功 - {"code": 200, "msg": "同步成功", "data": 同步的待办事项}
    """
    # 获取请求数据
    data = request.get_json()
    
    # 验证必要参数
    if not data.get('_id') or not data.get('_openid'):
        return error_response(400, "参数错误，需要_id和_openid")
    
    # 查询是否有对应的todo记录
    todo = Todo.query.filter_by(wx_id=data['_id']).first()
    
    # 查找或创建用户
    user = User.query.filter_by(openid=data['_openid']).first()
    if not user:
        # 如果是新用户，创建一个临时用户
        user = User(
            username=f"wx_user_{data['_openid'][:8]}",
            email=f"{data['_openid']}@temp.com",  # 临时邮箱
            openid=data['_openid'],
            password="temp_password"  # 设置一个临时密码
        )
        db.session.add(user)
        db.session.commit()
    
    if todo:
        # 更新已有记录
        todo.title = data.get('title', todo.title)
        todo.description = data.get('description', todo.description)
        todo.completed = data.get('completed', todo.completed)
        todo.importance = data.get('importance', todo.importance)
        todo.category = data.get('category', todo.category)
        todo.update_time = datetime.utcnow()
    else:
        # 创建新记录
        todo = Todo(
            wx_id=data['_id'],
            title=data.get('title', '无标题'),
            description=data.get('description'),
            completed=data.get('completed', False),
            importance=data.get('importance', 2),
            category=data.get('category'),
            user_id=user.id,
            openid=data['_openid']
        )
        db.session.add(todo)
    
    # 保存到数据库
    db.session.commit()
    
    # 返回同步后的待办事项
    return success_response(todo.to_dict(), "同步待办事项成功") 