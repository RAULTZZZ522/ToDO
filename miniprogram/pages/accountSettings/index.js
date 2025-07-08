Page({
  onTapPersonal() {
    wx.showToast({ title: '功能开发中', icon: 'none' })
  },
  onTapSecurity() {
    wx.showToast({ title: '功能开发中', icon: 'none' })
  },
  onTapPrivacy() {
    wx.showToast({ title: '功能开发中', icon: 'none' })
  },
  onTapNotification() {
    wx.showToast({ title: '功能开发中', icon: 'none' })
  },
  onTapAppearance() {
    wx.showToast({ title: '功能开发中', icon: 'none' })
  },
  onTapClearCache() {
    wx.clearStorageSync();
    wx.showToast({ title: '缓存已清理', icon: 'success' })
  },
  onTapLogout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出当前账号吗？',
      confirmColor: '#ff8f66',
      success: (res) => {
        if (res.confirm) {
          // 同步后端注销
          wx.cloud.callFunction({ name: 'logout' }).finally(() => {
            wx.removeStorageSync('userInfo');
            wx.removeStorageSync('authSetting');
            wx.showToast({ title: '已退出登录', icon: 'success' });
            
            // 返回上一页（用户中心）并刷新
            setTimeout(() => {
              // 获取上一页实例并直接更新数据
              const pages = getCurrentPages();
              if (pages.length > 1) {
                const prevPage = pages[pages.length - 2];
                // 直接设置上一页的数据，清除登录状态
                prevPage.setData({
                  userInfo: null,
                  hasUserInfo: false
                });
              }
              wx.navigateBack({ delta: 1 });
            }, 600);
          });
        }
      }
    });
  }
}) 