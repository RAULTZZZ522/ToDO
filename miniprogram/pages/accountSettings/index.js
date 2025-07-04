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
      confirmColor: '#f87c7c',
      success: (res) => {
        if (res.confirm) {
          // 同步后端注销
          wx.cloud.callFunction({ name: 'logout' }).finally(() => {
            wx.removeStorageSync('userInfo');
            wx.removeStorageSync('authSetting');
            wx.showToast({ title: '已退出登录', icon: 'success' });
            // 返回上一页（用户中心），页面会自动刷新登录状态
            setTimeout(() => {
              wx.navigateBack({ delta: 1 });
            }, 600);
          });
        }
      }
    });
  }
}) 