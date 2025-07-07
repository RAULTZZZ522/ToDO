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
  console.log('云函数login被调用，参数:', event);
  
  // 获取微信上下文
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const appid = wxContext.APPID
  const unionid = wxContext.UNIONID || ''
  
  // 如果是检查数据库，则执行检查数据库操作
  if (event.checkDb) {
    try {
      console.log('开始检查数据库集合状态...');
      // 尝试查询users集合，如果不存在会抛出异常
      await db.collection('users').limit(1).get();
      return {
        success: true,
        message: 'Users集合已存在'
      };
    } catch (err) {
      console.error('查询users集合出错:', err);
      if (err.errCode === -502005) {
        console.log('users集合不存在，尝试创建...');
        try {
          // 直接添加一个测试记录，系统会自动创建集合
          const testDoc = await db.createCollection('users');
          return {
            success: true,
            message: 'Users集合已成功创建',
            result: testDoc
          };
        } catch (createErr) {
          console.error('创建集合失败:', createErr);
          return {
            success: false,
            message: '创建users集合失败',
            error: createErr
          };
        }
      }
      return {
        success: false,
        message: '检查users集合失败',
        error: err
      };
    }
  }
  
  console.log('获取到的openid:', openid);

  // 获取从小程序端传来的用户信息
  // 注意：微信小程序现在通过wxUserInfo字段传递用户信息，以区分云函数自带的context.userInfo
  const wxUserInfo = event.wxUserInfo || {};
  console.log('从小程序获取的用户信息:', wxUserInfo);

  // ==== 写入 / 更新 users 集合 ====
  let role = 'common';
  let dbOperationResult = null;
  
  try {
    // 尝试查找该用户
    console.log('开始查询数据库...');
    const userRes = await usersCollection.where({ _openid: openid }).get();
    console.log('查询结果:', userRes);
    
    if (userRes.data.length === 0) {
      console.log('用户不存在，准备创建新用户...');
      // 不存在则新增
      const userData = {
        _openid: openid,
        role: 'common',
        unionid,
        nickName: wxUserInfo.nickName,
        avatarUrl: wxUserInfo.avatarUrl,
        gender: wxUserInfo.gender,
        country: wxUserInfo.country,
        province: wxUserInfo.province,
        city: wxUserInfo.city,
        language: wxUserInfo.language,
        createTime: db.serverDate(),
        updateTime: db.serverDate()
      };
      
      console.log('准备添加的用户数据:', userData);
      dbOperationResult = await usersCollection.add({
        data: userData
      });
      console.log('添加结果:', dbOperationResult);
    } else {
      // 若已存在，可取出 role；同时更新最后登录时间和用户资料
      console.log('用户已存在，准备更新用户信息...');
      role = userRes.data[0].role || 'common';
      const updateData = { 
        updateTime: db.serverDate() 
      };
      
      // 如果有新的用户信息，则更新
      if (wxUserInfo.nickName) {
        updateData.nickName = wxUserInfo.nickName;
        updateData.avatarUrl = wxUserInfo.avatarUrl;
        updateData.gender = wxUserInfo.gender;
        updateData.country = wxUserInfo.country;
        updateData.province = wxUserInfo.province;
        updateData.city = wxUserInfo.city;
        updateData.language = wxUserInfo.language;
      }
      
      console.log('准备更新的数据:', updateData);
      dbOperationResult = await usersCollection.doc(userRes.data[0]._id).update({
        data: updateData
      });
      console.log('更新结果:', dbOperationResult);
    }
  } catch (err) {
    // 记录但不影响登录流程
    console.error('写入 users 集合失败:', err);
    return {
      event,
      openid,
      appid,
      unionid,
      role,
      success: false,
      error: err
    }
  }

  // 返回数据
  return {
    event,
    openid,
    appid,
    unionid,
    role,
    dbResult: dbOperationResult,
    success: true
  }
} 