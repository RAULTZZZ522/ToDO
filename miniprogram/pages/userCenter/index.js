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
    // 检查是否已有登录信息
    const userInfo = wx.getStorageSync('userInfo');
    const authSetting = wx.getStorageSync('authSetting');

    if (userInfo) {
      this.setData({
        userInfo: userInfo,
        hasUserInfo: true
      });
    } else if (authSetting && authSetting.userInfo) {
      // 已授权但没有用户信息，尝试获取
      this.silentLogin();
    }
  },

  // 静默登录，适用于已授权用户
  silentLogin: function () {
    wx.getUserInfo({
      success: (res) => {
        const userInfo = res.userInfo;

        // 获取登录凭证
        wx.login({
          success: (loginRes) => {
            const code = loginRes.code;

            // 调用云函数登录
            wx.cloud.callFunction({
              name: 'login',
              data: { code },
              success: res => {
                const userData = {
                  ...userInfo,
                  openid: res.result.openid
                };

                wx.setStorageSync('userInfo', userData);
                wx.setStorageSync('authSetting', { userInfo: true });

                this.setData({
                  userInfo: userData,
                  hasUserInfo: true
                });

                console.log('自动登录成功');
              },
              fail: err => {
                console.error('自动登录失败', err);
                // 保存基本用户信息
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
      }
    });
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

            // 调用云函数登录，获取openid
            wx.cloud.callFunction({
              name: 'login',
              data: { code },
              success: res => {
                // 合并用户信息
                const userData = {
                  ...userInfo,
                  openid: res.result.openid
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
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  },

  goToAbout: function () {
    wx.showToast({
      title: '关于应用',
      icon: 'none'
    });
  }
}) 