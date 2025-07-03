# Windows环境下使用指南

此文档提供在Windows环境下设置和运行Flask后端的具体步骤。

## 安装依赖

1. 打开命令提示符或PowerShell，进入项目目录：
```
cd path\to\flask-backend
```

2. 创建虚拟环境（推荐）：
```
python -m venv venv
venv\Scripts\activate
```

3. 安装依赖：
```
pip install -r requirements.txt
```

## 设置环境变量

创建`.env`文件，配置以下环境变量：

```
FLASK_APP=wsgi.py
FLASK_ENV=development
SECRET_KEY=your-secret-key
DATABASE_URI=sqlite:///todo_app.db
JWT_SECRET_KEY=your-jwt-secret
WECHAT_APPID=your-wechat-appid
WECHAT_SECRET=your-wechat-secret
```

## 初始化数据库

1. 初始化迁移仓库：
```
flask db init
```

2. 创建迁移脚本：
```
flask db migrate -m "初始化数据表"
```

3. 应用迁移：
```
flask db upgrade
```

## 运行应用

### 开发模式

```
flask run
```

### 生产模式

使用Waitress作为WSGI服务器：

```
python run_windows.py
```

## 故障排除

1. 如果遇到`psycopg2`安装问题，可以尝试使用`psycopg2-binary`或安装其Windows二进制版本。

2. 如果遇到`flask db`命令无法运行，确保已设置环境变量`FLASK_APP=wsgi.py`。

3. 对于其他包安装问题，可能需要安装Windows特定的依赖。

## 注意事项

1. Docker Compose配置文件仍使用gunicorn，如需在Windows上使用Docker，请安装Docker Desktop for Windows。

2. 定时任务在Windows环境可能表现不同，建议在生产环境使用Linux服务器。 