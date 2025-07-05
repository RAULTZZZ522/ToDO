// 云函数：logout
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  // 如果有会话 / token，可在此处清理，例如删除用户在线状态
  return { success: true }
} 