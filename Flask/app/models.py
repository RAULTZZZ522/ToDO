from datetime import datetime
from . import db
from werkzeug.security import generate_password_hash, check_password_hash
import enum

class UserRole(enum.Enum):
    """用户角色枚举"""
    USER = 'user'      # 普通用户
    ADMIN = 'admin'    # 管理员

class TodoStatus(enum.Enum):
    """待办事项状态枚举"""
    TODO = 'todo'          # 待完成
    IN_PROGRESS = 'doing'  # 进行中
    DONE = 'done'          # 已完成
    ARCHIVED = 'archived'  # 已归档

class TodoPriority(enum.Enum):
    """待办事项优先级枚举"""
    LOW = 'low'        # 低优先级
    MEDIUM = 'medium'  # 中优先级
    HIGH = 'high'      # 高优先级
    URGENT = 'urgent'  # 紧急

class TimerStatus(enum.Enum):
    """番茄钟状态枚举"""
    IDLE = 'idle'          # 闲置状态
    RUNNING = 'running'    # 计时中
    PAUSED = 'paused'      # 已暂停
    FINISHED = 'finished'  # 已完成

class User(db.Model):
    """用户模型"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False, index=True)
    email = db.Column(db.String(100), unique=True, nullable=False)
    openid = db.Column(db.String(100), unique=True, index=True)  # 微信用户openid
    password_hash = db.Column(db.String(128), nullable=False)
    role = db.Column(db.Enum(UserRole), default=UserRole.USER)
    avatar = db.Column(db.String(200))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    
    # 关联关系
    todos = db.relationship('Todo', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    timers = db.relationship('TomatoTimer', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    
    @property
    def password(self):
        """密码属性不允许读取"""
        raise AttributeError('密码不是可读属性')
    
    @password.setter
    def password(self, password):
        """设置密码时自动生成哈希值"""
        self.password_hash = generate_password_hash(password)
    
    def verify_password(self, password):
        """验证密码是否正确"""
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        """将用户对象转换为字典"""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'openid': self.openid,
            'role': self.role.value,
            'avatar': self.avatar,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None
        }

class Todo(db.Model):
    """待办事项模型"""
    __tablename__ = 'todos'
    
    id = db.Column(db.Integer, primary_key=True)
    wx_id = db.Column(db.String(100), unique=True, index=True)  # 微信端记录的_id
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    completed = db.Column(db.Boolean, default=False)  # 替换status，使用微信小程序的completed字段
    importance = db.Column(db.Integer, default=2)     # 重要性/优先级，与微信小程序保持一致
    category = db.Column(db.String(50))
    deadline = db.Column(db.DateTime)
    create_time = db.Column(db.DateTime, default=datetime.utcnow)  # 对应微信的createTime
    update_time = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)  # 对应微信的updateTime
    
    # 外键关系
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    openid = db.Column(db.String(100))  # 存储微信用户的openid，方便与微信小程序数据同步
    
    # 关联关系
    timers = db.relationship('TomatoTimer', backref='todo', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self):
        """将待办事项对象转换为字典"""
        return {
            'id': self.id,
            '_id': self.wx_id,
            'title': self.title,
            'description': self.description,
            'completed': self.completed,
            'importance': self.importance,
            'category': self.category,
            'deadline': self.deadline.isoformat() if self.deadline else None,
            'createTime': self.create_time.isoformat() if self.create_time else None,
            'updateTime': self.update_time.isoformat() if self.update_time else None,
            '_openid': self.openid,
            'user_id': self.user_id
        }

class TomatoTimer(db.Model):
    """番茄钟计时器模型"""
    __tablename__ = 'timers'
    
    id = db.Column(db.Integer, primary_key=True)
    wx_id = db.Column(db.String(100), unique=True, index=True)  # 微信端记录的_id
    duration = db.Column(db.Integer, default=25)  # 计划时长(分钟)
    actual_duration = db.Column(db.Integer)       # 实际时长(分钟)
    status = db.Column(db.Enum(TimerStatus), default=TimerStatus.IDLE)
    start_time = db.Column(db.DateTime)           # 开始时间
    end_time = db.Column(db.DateTime)             # 结束时间
    paused_at = db.Column(db.DateTime)            # 暂停时间
    total_pause_duration = db.Column(db.Integer, default=0)  # 总暂停时长(秒)
    notes = db.Column(db.Text)                    # 笔记/总结
    create_time = db.Column(db.DateTime, default=datetime.utcnow)  # 创建时间，对应微信的createTime
    
    # 外键关系
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    todo_id = db.Column(db.Integer, db.ForeignKey('todos.id'))
    openid = db.Column(db.String(100))  # 存储微信用户的openid
    
    def to_dict(self):
        """将番茄钟对象转换为字典"""
        return {
            'id': self.id,
            '_id': self.wx_id,
            'duration': self.duration,
            'actual_duration': self.actual_duration,
            'status': self.status.value,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'paused_at': self.paused_at.isoformat() if self.paused_at else None,
            'total_pause_duration': self.total_pause_duration,
            'notes': self.notes,
            'createTime': self.create_time.isoformat() if self.create_time else None,
            '_openid': self.openid,
            'user_id': self.user_id,
            'todo_id': self.todo_id
        } 