import requests
from flask import current_app
import json

def get_openid(code):
    """通过code获取微信openid和session_key"""
    appid = current_app.config['WECHAT_APPID']
    secret = current_app.config['WECHAT_SECRET']
    
    if not appid or not secret:
        raise ValueError("未配置微信小程序appid或secret")
    
    url = f"https://api.weixin.qq.com/sns/jscode2session?appid={appid}&secret={secret}&js_code={code}&grant_type=authorization_code"
    
    try:
        response = requests.get(url)
        response.raise_for_status()
        result = response.json()
        
        if 'errcode' in result and result['errcode'] != 0:
            raise ValueError(f"微信API错误: {result.get('errmsg', '未知错误')}")
        
        if 'openid' not in result:
            raise ValueError("微信API返回数据中不包含openid")
        
        return {
            'openid': result.get('openid'),
            'session_key': result.get('session_key'),
            'unionid': result.get('unionid')  # 如果有
        }
        
    except requests.RequestException as e:
        current_app.logger.error(f"请求微信API失败: {str(e)}")
        raise ValueError(f"请求微信API失败: {str(e)}")
    except (ValueError, json.JSONDecodeError) as e:
        current_app.logger.error(f"解析微信API响应失败: {str(e)}")
        raise ValueError(f"解析微信API响应失败: {str(e)}")
    except Exception as e:
        current_app.logger.error(f"获取openid过程中发生未知错误: {str(e)}")
        raise ValueError(f"获取openid过程中发生未知错误: {str(e)}") 