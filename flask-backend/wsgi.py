import os
from app import create_app
from scheduler import init_scheduler

# 获取运行环境
env = os.environ.get('FLASK_ENV', 'development')
app = create_app(env)

# 如果是生产环境，初始化定时任务
if env == 'production':
    init_scheduler()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000) 