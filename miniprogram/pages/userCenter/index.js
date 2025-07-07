Page({
  data: {
    userInfo: null,
    hasUserInfo: false
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
        console.log('获取到的用户信息:', userInfo);

        // 调用微信登录获取openid
        wx.login({
          success: (loginRes) => {
            const code = loginRes.code;
            console.log('获取到的登录code:', code);

            // 调用云函数登录，获取openid并将用户信息存入云数据库
            wx.cloud.callFunction({
              name: 'login',
              data: { 
                code,
                wxUserInfo: userInfo // 改用wxUserInfo名称以区分云函数上下文的userInfo
              },
              success: res => {
                console.log('云函数调用成功，返回:', res.result);
                
                // 合并用户信息
                const userData = {
                  ...userInfo,
                  openid: res.result.openid,
                  role: res.result.role || 'common'
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