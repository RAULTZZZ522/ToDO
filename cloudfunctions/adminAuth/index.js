const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const usersCollection = db.collection('users')

/**
 * 管理员账号密码校验
 * @param {String} openid
 * @param {String} password
 * 返回 { success: Boolean, message: String, userId?: String }
 */
exports.main = async (event, context) => {
  const { openid, password } = event || {}

  if (!openid || !password) {
    return { success: false, message: '缺少 openid 或 password 参数' }
  }

  try {
    // 查询管理员账号
    const res = await usersCollection.where({ wxOpenId: openid, role: 'admin' }).limit(1).get()
    if (!res || !res.data || res.data.length === 0) {
      return { success: false, message: '账号不存在或权限不足' }
    }

    const user = res.data[0]
    if (user.password === password) {
      return { success: true, userId: user._id }
    }
    return { success: false, message: '密码错误' }
  } catch (error) {
    console.error('adminAuth 云函数错误:', error)
    return { success: false, message: '服务器内部错误', error }
  }
} 