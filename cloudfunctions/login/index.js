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
  const { code, userInfo = {} } = event || {};

  // 1. 通过 code2Session 或 getWXContext 获取 openid/unionid
  let openid = '';
  let unionid = '';
  let session_key = '';
  try {
    if (code) {
      // 使用 openapi 调用 code2Session
      const sessionRes = await cloud.openapi.auth.code2Session({
        js_code: code,
        grant_type: 'authorization_code'
      });
      openid = sessionRes.openid;
      unionid = sessionRes.unionid || '';
      session_key = sessionRes.session_key;
    }

    // 如果未获得 openid，则回退使用 getWXContext
    if (!openid) {
      const wxContext = cloud.getWXContext();
      console.log('getWXContext:', wxContext);
      openid = wxContext.OPENID;
      unionid = wxContext.UNIONID || unionid;
    }

    // 若依然缺少 openid，则抛出异常
    if (!openid) {
      throw new Error('无法获取用户 openid');
    }
  } catch (sessionErr) {
    console.error('获取 openid 过程中发生异常:', sessionErr);
    // 最终兜底尝试使用 getWXContext
    const wxContext = cloud.getWXContext();
    console.log('catch getWXContext:', wxContext);
    openid = openid || wxContext.OPENID;
    unionid = unionid || wxContext.UNIONID || '';
    // 若仍未获取到 openid，则返回失败
    if (!openid) {
      return {
        success: false,
        message: '获取 openid 失败',
        error: sessionErr
      };
    }
  }

  // 2. 写入 / 更新 users 集合
  let role = 'common';
  let userId = '';
  try {
    const now = db.serverDate();
    const userRes = await usersCollection.where({ wxOpenId: openid }).get();
    if (userRes.data.length === 0) {
      // 新增用户
      const addRes = await usersCollection.add({
        data: {
          wxOpenId: openid,
          unionid,
          role: 'common',
          nickname: userInfo.nickName || '',
          avatarUrl: userInfo.avatarUrl || '',
          gender: userInfo.gender || 0,
          country: userInfo.country || '',
          province: userInfo.province || '',
          city: userInfo.city || '',
          createTime: now,
          updateTime: now
        }
      });
      userId = addRes._id;
    } else {
      // 更新用户登录信息
      const userDoc = userRes.data[0];
      role = userDoc.role || 'common';
      userId = userDoc._id;

      await usersCollection.doc(userDoc._id).update({
        data: {
          wxOpenId: openid,
          nickname: userInfo.nickName || userDoc.nickname,
          avatarUrl: userInfo.avatarUrl || userDoc.avatarUrl,
          gender: typeof userInfo.gender === 'number' ? userInfo.gender : userDoc.gender,
          country: userInfo.country || userDoc.country,
          province: userInfo.province || userDoc.province,
          city: userInfo.city || userDoc.city,
          updateTime: now
        }
      });
    }
  } catch (userErr) {
    console.error('写入 / 更新 users 集合失败:', userErr);
  }

  // 3. 返回结果
  return {
    success: true,
    openid,
    unionid,
    session_key,
    userId,
    role
  };
} 