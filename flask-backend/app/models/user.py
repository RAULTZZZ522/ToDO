from datetime import datetime
from app import db

class User(db.Model):
    """用户模型"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    openid = db.Column(db.String(64), unique=True, index=True, nullable=False)  # 微信用户唯一标识
    unionid = db.Column(db.String(64), unique=True, index=True, nullable=True)  # 微信开放平台唯一标识
    nickname = db.Column(db.String(64), nullable=True)  # 昵称
    avatar_url = db.Column(db.String(256), nullable=True)  # 头像URL
    gender = db.Column(db.Integer, default=0)  # 性别，0未知，1男，2女
    country = db.Column(db.String(64), nullable=True)  # 国家
    province = db.Column(db.String(64), nullable=True)  # 省份
    city = db.Column(db.String(64), nullable=True)  # 城市
    create_time = db.Column(db.DateTime, default=datetime.utcnow)  # 创建时间
    last_login = db.Column(db.DateTime, default=datetime.utcnow)  # 最后登录时间
    
    def to_dict(self):
        """转换为字典格式"""
        return {
            'id': self.id,
            'openid': self.openid,
            'nickname': self.nickname,
            'avatar_url': self.avatar_url,
            'gender': self.gender,
            'country': self.country,
            'province': self.province,
            'city': self.city,
            'create_time': self.create_time.isoformat() if self.create_time else None,
            'last_login': self.last_login.isoformat() if self.last_login else None
        } 