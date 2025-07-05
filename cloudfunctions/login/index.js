// 云函数模板
// 部署：在 cloud-functions/login 文件夹右击选择 "上传并部署"

const cloud = require('wx-server-sdk')

// 初始化 cloud
cloud.init({
  // API 调用都保持和云函数当前所在环境一致
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database();
const usersCollection = db.collection('users');

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

  // ==== 新增：写入 / 更新 users 集合 ====
  let role = 'common';
  try {
    // 尝试查找该用户
    const userRes = await usersCollection.where({ _openid: openid }).get();
    if (userRes.data.length === 0) {
      // 不存在则新增
      await usersCollection.add({
        _openid: openid,
        role: 'common',
        unionid,
        createTime: db.serverDate(),
        updateTime: db.serverDate()
      });
    } else {
      // 若已存在，可取出 role；同时更新最后登录时间
      role = userRes.data[0].role || 'common';
      await usersCollection.doc(userRes.data[0]._id).update({
        data: { updateTime: db.serverDate() }
      });
    }
  } catch (err) {
    // 记录但不影响登录流程
    console.error('写入 users 集合失败:', err);
  }

  // 返回数据
  return {
    event,
    openid,
    appid,
    unionid,
    role,
    success: true
  }
} 