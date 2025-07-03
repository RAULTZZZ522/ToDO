from datetime import datetime
from app import db

class Todo(db.Model):
    """待办事项模型"""
    __tablename__ = 'todos'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(64), index=True, nullable=False)  # 用户ID (微信openid)
    title = db.Column(db.String(100), nullable=False)  # 标题
    description = db.Column(db.Text, nullable=True)  # 描述
    importance = db.Column(db.Integer, default=3)  # 重要程度 (1-5)
    create_time = db.Column(db.DateTime, default=datetime.utcnow)  # 创建时间
    update_time = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)  # 更新时间
    completed = db.Column(db.Boolean, default=False)  # 是否完成
    tomato_duration = db.Column(db.Integer, default=25)  # 番茄钟时长（分钟）
    tomato_count = db.Column(db.Integer, default=0)  # 番茄钟完成次数
    tomato_total_time = db.Column(db.Integer, default=0)  # 番茄钟总时间（分钟）
    category = db.Column(db.String(20), default='学习')  # 分类
    
    def to_dict(self):
        """转换为字典格式"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'description': self.description,
            'importance': self.importance,
            'create_time': self.create_time.isoformat() if self.create_time else None,
            'update_time': self.update_time.isoformat() if self.update_time else None,
            'completed': self.completed,
            'tomato_duration': self.tomato_duration,
            'tomato_count': self.tomato_count,
            'tomato_total_time': self.tomato_total_time,
            'category': self.category
        }
    
    @staticmethod
    def from_dict(data, user_id=None):
        """从字典创建Todo对象"""
        todo = Todo()
        if user_id:
            todo.user_id = user_id
            
        for field in ['title', 'description', 'importance', 'completed', 
                      'tomato_duration', 'tomato_count', 'tomato_total_time', 'category']:
            if field in data:
                setattr(todo, field, data[field])
        
        return todo 