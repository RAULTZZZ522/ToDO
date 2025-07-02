def success_response(data=None, message="操作成功", code=0):
    """成功响应格式化"""
    response = {
        "code": code,
        "msg": message
    }
    
    if data is not None:
        response["data"] = data
        
    return response

def error_response(message="操作失败", code=-1, error=None):
    """错误响应格式化"""
    response = {
        "code": code,
        "msg": message
    }
    
    if error is not None:
        if isinstance(error, Exception):
            response["error"] = str(error)
        else:
            response["error"] = error
            
    return response 