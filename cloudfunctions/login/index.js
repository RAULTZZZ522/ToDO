// 云函数模板
// 部署：在 cloud-functions/login 文件夹右击选择 "上传并部署"

const cloud = require('wx-server-sdk')

// 初始化 cloud
cloud.init({
  // API 调用都保持和云函数当前所在环境一致
  env: cloud.DYNAMIC_CURRENT_ENV
})

/**
 * 云函数：用户登录
 * 功能：获取用户openid并返回
 */
exports.main = async (event, context) => {
  // 获取微信上下文
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const appid = wxContext.APPID
  const unionid = wxContext.UNIONID || ''

  // 返回数据
  return {
    event,
    openid,
    appid,
    unionid,
    success: true
  }
} 