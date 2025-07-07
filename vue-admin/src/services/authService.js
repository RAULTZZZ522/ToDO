// 认证服务
// 提供二维码登录相关方法以及管理员权限校验

import { initCloud } from './cloudService'

/**
 * 生成微信扫码登录二维码地址
 * 实际项目中应调用后端生成的登录链接。
 * 这里为了演示，直接拼接开放平台 QRConnect URL。
 * 注：必须在微信开放平台配置好回调域名，且网页需部署到 HTTPS。
 */
export const generateLoginQrCode = async () => {
  // TODO: 替换为真实的 AppID 与回调地址
  const APPID = 'wxd98a8015b096ab89'
  const redirectUri = encodeURIComponent(window.location.origin + '/login')
  // state 可随机字符串避免 CSRF，此处简单示例
  const state = Date.now()
  return `https://open.weixin.qq.com/connect/qrconnect?appid=${APPID}&redirect_uri=${redirectUri}&response_type=code&scope=snsapi_login&state=${state}#wechat_redirect`
}

/**
 * 根据 openid 判断是否为管理员
 * @param {String} openid 用户 openid
 * @returns {Boolean} 是否管理员
 */
export const checkAdminByOpenId = async (openid) => {
  if (!openid) return false
  try {
    const cloud = await initCloud()
    if (!cloud) return false

    const db = cloud.database()
    const res = await db.collection('users').where({ wxOpenId: openid }).limit(1).get()
    if (res && res.data && res.data.length > 0) {
      const user = res.data[0]
      return user.role === 'admin'
    }
    return false
  } catch (error) {
    console.error('检查管理员权限失败:', error)
    return false
  }
}

/**
 * 管理员账号密码登录
 * @param {String} openid openid 作为账号
 * @param {String} password 密码
 * @returns {Boolean} 登录是否成功
 */
export const loginAdmin = async (openid, password) => {
  if (!openid || !password) return false
  try {
    const cloud = await initCloud()
    if (!cloud) return false

    try {
      const resp = await cloud.callFunction({
        name: 'adminAuth',
        data: { openid, password }
      })

      const result = resp && resp.result
      if (result && result.success) {
        return true
      }
      console.warn('adminAuth 云函数返回失败信息: ', result && result.message)
    } catch (fnErr) {
      console.warn('调用 adminAuth 失败，尝试直接查询数据库验证:', fnErr)
    }

    // Fallback: 直接查询 users 集合
    try {
      const db = cloud.database()
      const res = await db.collection('users').where({ wxOpenId: openid, role: 'admin' }).limit(1).get()
      if (res && res.data && res.data.length > 0) {
        const user = res.data[0]
        if (user.password && user.password === password) {
          return true
        }
      }
    } catch (dbErr) {
      console.error('数据库验证管理员失败:', dbErr)
    }
    return false
  } catch (error) {
    console.error('管理员登录失败:', error)
    return false
  }
} 