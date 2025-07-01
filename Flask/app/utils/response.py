from flask import jsonify

def success_response(data=None, msg="操作成功"):
    """
    成功响应格式化
    
    Args:
        data: 响应数据，默认为None
        msg: 成功信息，默认为"操作成功"
        
    Returns:
        返回统一格式的JSON响应，状态码为200
    """
    return jsonify({
        "code": 200,
        "msg": msg,
        "data": data
    }), 200

def error_response(code=400, msg="操作失败", data=None):
    """
    错误响应格式化
    
    Args:
        code: 错误码，默认为400
        msg: 错误信息，默认为"操作失败"
        data: 附加数据，默认为None
        
    Returns:
        返回统一格式的JSON响应，状态码与传入的code相同
    """
    return jsonify({
        "code": code,
        "msg": msg,
        "data": data
    }), code

def validation_error(errors):
    """
    表单验证错误响应
    
    Args:
        errors: 验证错误信息
        
    Returns:
        返回包含验证错误信息的JSON响应，状态码为400
    """
    return jsonify({
        "code": 400,
        "msg": "数据验证失败",
        "data": errors
    }), 400 