Page({
  data: {
    userInfo: null,
    hasUserInfo: false,
    debugInfo: ''
  },

  onLoad: function () {
    this.autoLogin();
  },

  onShow: function () {
    // 每次页面显示时检查登录状态
    this.autoLogin();
  },

  // 自动登录
  autoLogin: function () {
    // 检查登录状态，如果没有userInfo或authSetting，则显示为未登录状态
    const userInfo = wx.getStorageSync('userInfo');
    const authSetting = wx.getStorageSync('authSetting');

    if (userInfo && authSetting && authSetting.userInfo) {
      this.setData({
        userInfo,
        hasUserInfo: true
      });
    } else {
      // 确保清除登录状态
      this.setData({
        userInfo: null,
        hasUserInfo: false
      });
    }
  },

  // 获取用户信息 - 使用getUserProfile API
  getUserProfile: function () {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        const userInfo = res.userInfo;

        // 调用微信登录获取openid
        wx.login({
          success: (loginRes) => {
            const code = loginRes.code;

            // 记录 wx.login 返回
            console.log('wx.login 成功，code:', code);
            this.setData({
              debugInfo: `wx.login 成功，code: ${code}`
            });

            // 调用云函数登录，获取openid
            wx.cloud.callFunction({
              name: 'login',
              data: { code, userInfo },
              success: res => {
                console.log('云函数 login 调用成功，结果:', res);
                // 在调试栏展示云函数调用成功
                this.setData({
                  debugInfo: `云函数成功，openid: ${res.result && res.result.openid}`
                });
                const result = res.result || {};
                // 合并用户信息
                const userData = {
                  ...userInfo,
                  openid: result.openid,
                  role: result.role || 'common',
                  userId: result.userId || ''
                };

                // 保存到本地
                wx.setStorageSync('userInfo', userData);
                wx.setStorageSync('authSetting', { userInfo: true });

                this.setData({
                  userInfo: userData,
                  hasUserInfo: true
                });

                wx.showToast({
                  title: '登录成功',
                  icon: 'success'
                });
              },
              fail: err => {
                console.error('获取用户openid失败', err);
                this.setData({
                  debugInfo: `云函数调用失败: ${err.errMsg || err}`
                });
                // 即使没有openid，也可以显示基本用户信息
                wx.setStorageSync('userInfo', userInfo);
                wx.setStorageSync('authSetting', { userInfo: true });

                this.setData({
                  userInfo: userInfo,
                  hasUserInfo: true
                });
              }
            });
          }
        });
      },
      fail: (err) => {
        wx.showToast({
          title: '您拒绝了授权',
          icon: 'none'
        });
      }
    });
  },

  goToSettings: function () {
    wx.navigateTo({
      url: '/pages/accountSettings/index'
    });
  },

  goToAbout: function () {
    wx.navigateTo({
      url: '/pages/aboutApp/index'
    });
  }
}) 