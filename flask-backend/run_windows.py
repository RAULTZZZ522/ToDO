"""
Windows平台运行Flask应用的启动脚本
使用waitress作为WSGI服务器
"""
import os
from waitress import serve
from app import create_app
from scheduler import init_scheduler

# 获取运行环境
env = os.environ.get('FLASK_ENV', 'development')
app = create_app(env)

# 如果是生产环境，初始化定时任务
if env == 'production':
    init_scheduler()

if __name__ == '__main__':
    print(f"使用Waitress启动Flask应用，环境：{env}")
    print("服务器运行在 http://127.0.0.1:5000")
    serve(app, host='0.0.0.0', port=5000) 