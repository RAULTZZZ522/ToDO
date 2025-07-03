# 待办事项管理系统 - Web管理端

## 项目简介

这是一个基于Vue3开发的Web管理系统，用于与微信小程序云数据库进行交互，实现待办事项的增删改查功能。系统采用微信云开发的Identityless模式，无需用户登录即可访问云数据库。

## 技术栈

- Vue 3 (Composition API)
- Vite
- 微信小程序云开发SDK

## 功能特点

- 初始化云开发SDK (Identityless模式)
- 完整的CRUD操作：获取、添加、更新和删除待办事项
- 支持按状态、重要性和关键字筛选待办事项
- 响应式UI设计，适应不同设备尺寸
- 实时数据更新和交互

## 配置说明

### 1. 配置云环境和小程序信息

在开始使用前，请修改 `src/services/cloudDbService.js` 文件中的配置信息：

```js
// 替换为你的小程序 appid 和云环境 id
const config = {
  resourceAppid: 'YOUR_APPID', // 替换为实际的小程序 AppID
  resourceEnv: 'YOUR_ENV_ID', // 替换为实际的云环境 ID
};
```

### 2. 设置云数据库权限

确保在微信云开发控制台中已将云数据库的访问权限设置为"所有用户可读写"或"未登录访问"，特别是对`todos`集合。

## 开发与部署

### 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 构建生产版本

```bash
# 构建生产版本
npm run build
```

## 数据库结构

系统使用的`todos`集合应包含以下字段：

```
{
  _id: String,           // 数据库自动生成
  _openid: String,       // 用户的openid（小程序端创建时自动生成）
  title: String,         // 标题
  description: String,   // 描述
  importance: Number,    // 重要性(1低,2中,3高)
  completed: Boolean,    // 是否已完成
  createTime: String,    // 创建时间
  updateTime: String,    // 更新时间
  userNickname: String   // 用户昵称
}
```

## 注意事项

1. 此Web端管理系统使用Identityless模式，无需用户登录即可访问云数据库，因此需要特别注意数据安全性。
2. 在生产环境中，建议设置更细粒度的数据库权限控制。
3. 使用管理员创建的条目会缺少`_openid`字段，这是正常现象。
4. 部署到生产环境时，请确保已在云开发安全域名中添加您的Web应用域名。

## 排错指南

- 如遇到"云环境未初始化"错误，请检查index.html中是否正确引入了cloud.js。
- 如遇到权限错误，请检查云数据库的访问权限设置。
- 如遇到跨域问题，请在云开发控制台的"安全配置"中添加您的域名。
