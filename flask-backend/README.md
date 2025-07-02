# ToDo 应用 Flask 后端

这是 ToDo 应用的 Flask 后端服务，提供待办事项管理、番茄钟记录等功能的 API。

## 功能特点

- 用户认证（基于微信小程序和 JWT）
- 待办事项的增删改查
- 番茄钟计时记录
- 每日自动重置功能

## 项目结构

```
flask-backend/
├── app/                  # 应用主目录
│   ├── __init__.py       # 应用初始化
│   ├── models/           # 数据模型
│   │   └── todo.py       # Todo 模型
│   │   └── user.py       # User 模型
│   ├── routes/           # API 路由
│   │   └── auth.py       # 认证相关路由
│   │   └── todos.py      # Todo 相关路由
│   └── utils/            # 工具函数
│       └── response.py   # 响应格式化
│       └── wechat.py     # 微信API工具
├── config.py             # 配置文件
├── requirements.txt      # 依赖包
├── wsgi.py               # WSGI 入口
├── run_windows.py        # Windows环境运行脚本
└── scheduler.py          # 定时任务
```

## 安装与运行

### Linux/MacOS环境

1. 安装依赖：

```bash
pip install -r requirements.txt
```

2. 创建环境变量文件：

```bash
cp .env.sample .env
```

然后编辑 `.env` 文件，填入相关配置。

3. 初始化数据库：

```bash
flask db init
flask db migrate -m "初始化数据表"
flask db upgrade
```

4. 运行开发服务器：

```bash
flask run
```

### Windows环境

Windows用户请参考 [WINDOWS_README.md](./WINDOWS_README.md) 文件获取详细指南。

## API 文档

### 认证 API

- `POST /api/auth/login` - 微信小程序登录
- `GET /api/auth/user` - 获取用户信息

### Todo API

- `GET /api/todos` - 获取所有待办事项
- `POST /api/todos` - 添加新的待办事项
- `PUT /api/todos/:id` - 更新待办事项
- `DELETE /api/todos/:id` - 删除待办事项
- `POST /api/todos/reset` - 重置待办事项状态

## 部署

### Linux/MacOS使用Gunicorn部署

```bash
gunicorn -w 4 -b 0.0.0.0:5000 wsgi:app
```

### Windows使用Waitress部署

```bash
python run_windows.py
```

### 使用Docker部署

```bash
docker-compose up -d
```

## 许可证

MIT 