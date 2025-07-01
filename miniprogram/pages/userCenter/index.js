Page({
  data: {
    userInfo: null,
    hasUserInfo: false
  },

  onLoad: function () {
    // 检查是否已有登录信息
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({
        userInfo: userInfo,
        hasUserInfo: true
      });
    }
  },

  // 获取用户信息
  onGetUserInfo: function (e) {
    if (e.detail.userInfo) {
      const userInfo = e.detail.userInfo;

      // 调用微信登录获取openid
      wx.login({
        success: (loginRes) => {
          // 获取code，用于后续获取openid
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
              this.setData({
                userInfo: userInfo,
                hasUserInfo: true
              });
            }
          });
        }
      });
    } else {
      wx.showToast({
        title: '您拒绝了授权',
        icon: 'none'
      });
    }
  },

  logout: function () {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除本地存储的用户信息
          wx.removeStorageSync('userInfo');

          this.setData({
            userInfo: null,
            hasUserInfo: false
          });

          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          });
        }
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