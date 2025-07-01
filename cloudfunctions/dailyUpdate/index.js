const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
exports.main = async (event, context) => {
  // 每天重置所有日程的 completed 状态为 false
  await db.collection('todos').where({ completed: true }).update({
    data: { completed: false }
  })
  // 每天重置所有日程的 tomatoCount 为 0
  await db.collection('todos').update({
    data: { tomatoCount: 0 }
  })
  return { code: 0, msg: '每日状态已重置' }
} 