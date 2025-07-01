from marshmallow import Schema, fields, validate, ValidationError

class LoginSchema(Schema):
    """登录表单验证"""
    username = fields.String(required=True, error_messages={"required": "用户名不能为空"})
    password = fields.String(required=True, error_messages={"required": "密码不能为空"})

class WechatLoginSchema(Schema):
    """微信登录表单验证"""
    openid = fields.String(required=True, error_messages={"required": "openid不能为空"})
    username = fields.String(required=False)  # 微信登录可能没有用户名

class RegisterSchema(Schema):
    """注册表单验证"""
    username = fields.String(
        required=True,
        validate=validate.Length(min=3, max=50),
        error_messages={
            "required": "用户名不能为空",
            "validate": "用户名长度必须在3-50个字符之间"
        }
    )
    email = fields.Email(
        required=True,
        error_messages={
            "required": "邮箱不能为空",
            "invalid": "邮箱格式不正确"
        }
    )
    password = fields.String(
        required=True,
        validate=validate.Length(min=6, max=50),
        error_messages={
            "required": "密码不能为空",
            "validate": "密码长度必须在6-50个字符之间"
        }
    )
    openid = fields.String(required=False)  # 可选，微信用户的openid

class TodoSchema(Schema):
    """待办事项表单验证"""
    title = fields.String(
        required=True,
        validate=validate.Length(min=1, max=100),
        error_messages={
            "required": "标题不能为空",
            "validate": "标题长度必须在1-100个字符之间"
        }
    )
    description = fields.String(allow_none=True)
    completed = fields.Boolean(default=False)  # 是否完成
    importance = fields.Integer(validate=validate.Range(min=1, max=5), default=2)  # 重要性
    category = fields.String(allow_none=True)
    deadline = fields.DateTime(allow_none=True)
    _openid = fields.String(required=False)  # 微信用户的openid

class TimerSchema(Schema):
    """番茄钟表单验证"""
    duration = fields.Integer(required=True, validate=validate.Range(min=1, max=120))
    todo_id = fields.Integer(allow_none=True)
    notes = fields.String(allow_none=True)
    _openid = fields.String(required=False)  # 微信用户的openid 