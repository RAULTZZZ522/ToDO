// pages/tomatoTimer/index.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    title: '',
    duration: 25,
    count: 0,
    total: 1,
    id: '',
    totalTime: 0,
    timeLeft: 1500,
    timer: null,
    paused: false,
    percent: 1
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log('番茄钟页面加载，参数:', options);
    
    // 确保options中的参数存在，并设置默认值
    this.setData({
      title: decodeURIComponent(options.title || ''),
      duration: Number(options.duration || 25),
      count: Number(options.count || 0),
      total: Number(options.total || 1),
      id: options.id || '',
      totalTime: Number(options.totalTime || 0),
      timeLeft: Number(options.duration || 25) * 60
    });
    
    console.log('番茄钟页面数据设置完成:', {
      title: this.data.title,
      duration: this.data.duration,
      count: this.data.count,
      totalTime: this.data.totalTime,
      id: this.data.id,
      timeLeft: this.data.timeLeft
    });
    
    // 等待页面渲染完成后再绘制圆环
    wx.nextTick(() => {
      this.drawProgress(1);
      this.startTimer();
    });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    // 页面渲染完成后重新绘制圆环
    this.drawProgress(this.data.timeLeft / (this.data.duration * 60));
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  },

  onStop() {
    // 如果番茄钟正在运行，需要询问用户是否要放弃这次计时
    if (this.data.timer) {
      clearTimeout(this.data.timer);
      this.setData({ timer: null });

      // 计算已经计时的时间（秒）
      const originalTimeInSeconds = this.data.duration * 60;
      const elapsedTimeInSeconds = originalTimeInSeconds - this.data.timeLeft;
      
      console.log('已经计时:', elapsedTimeInSeconds, '秒，总共:', originalTimeInSeconds, '秒');
      
      // 如果已经计时超过一半，询问是否要保存这次计时
      if (elapsedTimeInSeconds > originalTimeInSeconds / 2) {
        wx.showModal({
          title: '保存计时',
          content: `您已经完成了超过一半的番茄钟时间(${Math.floor(elapsedTimeInSeconds/60)}分钟)，是否保存这次计时?`,
          confirmText: '保存',
          cancelText: '放弃',
          success: (res) => {
            if (res.confirm) {
              // 用户选择保存，更新计数和时间
              this.savePartialTomato(elapsedTimeInSeconds);
            } else {
              // 用户选择放弃，直接返回
              wx.navigateBack();
            }
          }
        });
      } else {
        // 时间不到一半，询问是否放弃
        wx.showModal({
          title: '放弃计时',
          content: '确定要放弃这次番茄钟计时吗?',
          confirmText: '放弃',
          cancelText: '继续',
          success: (res) => {
            if (res.confirm) {
              // 用户确认放弃
              wx.navigateBack();
            } else {
              // 用户选择继续，重新开始计时
              this.setData({ paused: false });
              this.startTimer();
            }
          }
        });
      }
    } else {
      // 如果番茄钟已经暂停，直接返回
      wx.navigateBack();
    }
  },
  onFinish() {
    if (this.data.timer) {
      clearTimeout(this.data.timer);
    }
    
    const todoId = this.data.id;
    const currentCount = this.data.count;
    const newCount = currentCount + 1;
    const duration = this.data.duration; // 当前番茄钟时长（分钟）
    const currentTotalTime = this.data.totalTime; // 当前总计时
    const newTotalTime = currentTotalTime + duration; // 新的总计时
    
    // 显示详细日志
    console.log('番茄钟完成，准备更新计数和总计时');
    console.log('任务ID:', todoId);
    console.log('当前计数:', currentCount);
    console.log('新计数将为:', newCount);
    console.log('本次番茄钟时长:', duration, '分钟');
    console.log('当前总计时:', currentTotalTime, '分钟');
    console.log('新总计时:', newTotalTime, '分钟');
    
    // 调用云函数更新番茄钟完成次数和总计时
    wx.showLoading({ title: '保存中...' });
    
    // 直接更新tomatoCount和tomatoTotalTime
    wx.cloud.callFunction({
      name: 'todoModel',
      data: {
        type: 'updateTodo',
        id: todoId,
        tomatoCount: newCount,
        tomatoTotalTime: newTotalTime
      }
    }).then(res => {
      console.log('番茄钟计数和总计时更新结果:', res);
      
      if (res.result && res.result.code === 0) {
        wx.hideLoading();
        wx.showToast({ 
          title: '番茄钟完成!', 
          icon: 'success',
          duration: 1500
        });
        
        // 返回上一页并立即刷新
        setTimeout(() => {
          // 确保返回上一页时会刷新数据
          const pages = getCurrentPages();
          if (pages.length > 1) {
            const prevPage = pages[pages.length - 2];
            
            // 向上一页传递更新后的数据
            if (prevPage && prevPage.route.includes('todoList')) {
              console.log('尝试更新todoList页面数据');
              // 设置标记，表示需要刷新
              if (typeof prevPage.setData === 'function') {
                prevPage.setData({
                  needRefresh: true,
                  lastUpdatedTodoId: todoId,
                  lastUpdatedTomatoCount: newCount,
                  lastUpdatedTomatoTotalTime: newTotalTime
                });
              }
            }
          }
          
          // 返回上一页
          wx.navigateBack({
            success: function() {
              console.log('成功返回上一页');
            }
          });
        }, 1000);
      } else {
        wx.hideLoading();
        wx.showToast({ 
          title: '保存失败', 
          icon: 'none' 
        });
        setTimeout(() => wx.navigateBack(), 800);
      }
    }).catch(err => {
      console.error('更新番茄钟计数失败:', err);
      wx.hideLoading();
      wx.showToast({ title: '保存失败: ' + err.message, icon: 'none' });
      setTimeout(() => wx.navigateBack(), 800);
    });
  },
  formatTime(t) {
    const m = Math.floor(t / 60);
    const s = t % 60;
    return `${m}:${s < 10 ? '0' + s : s}`;
  },
  drawProgress(percent) {
    // 获取系统信息以适应不同设备
    const query = wx.createSelectorQuery();
    query.select('.progress-canvas').boundingClientRect(rect => {
      if (!rect) {
        console.error('未找到canvas元素');
        return;
      }
      
      const ctx = wx.createCanvasContext('progressCanvas', this);
      const width = rect.width;
      const height = rect.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) / 2 - 10; // 留出边距
      
      ctx.clearRect(0, 0, width, height);
      
      // 绘制背景圆环
      ctx.beginPath();
      ctx.setLineWidth(12);
      ctx.setLineCap('round');
      ctx.setStrokeStyle('rgba(255, 255, 255, 0.3)');
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
      ctx.stroke();
      
      // 绘制进度圆环
      ctx.beginPath();
      ctx.setLineWidth(12);
      ctx.setLineCap('round');
      ctx.setStrokeStyle('#673ab7');
      ctx.arc(centerX, centerY, radius, -Math.PI/2, -Math.PI/2 + 2 * Math.PI * percent, false);
      ctx.stroke();
      ctx.draw();
    }).exec();
  },
  // 保存部分完成的番茄钟
  savePartialTomato(elapsedTimeInSeconds) {
    const todoId = this.data.id;
    const currentCount = this.data.count;
    const currentTotalTime = this.data.totalTime;
    
    // 转换为分钟并四舍五入到整数
    const elapsedTimeInMinutes = Math.round(elapsedTimeInSeconds / 60);
    
    // 不增加番茄钟计数，只增加总时间
    const newTotalTime = currentTotalTime + elapsedTimeInMinutes;
    
    console.log('保存部分完成的番茄钟:');
    console.log('ID:', todoId);
    console.log('当前计数:', currentCount, '(保持不变)');
    console.log('计时时间:', elapsedTimeInMinutes, '分钟');
    console.log('当前总时间:', currentTotalTime, '分钟');
    console.log('新总时间:', newTotalTime, '分钟');
    
    wx.showLoading({ title: '保存中...' });
    
    // 调用云函数只更新总时间
    wx.cloud.callFunction({
      name: 'todoModel',
      data: {
        type: 'updateTodo',
        id: todoId,
        tomatoTotalTime: newTotalTime
      }
    }).then(res => {
      console.log('部分番茄钟保存结果:', res);
      
      if (res.result && res.result.code === 0) {
        wx.hideLoading();
        wx.showToast({
          title: '已保存时间',
          icon: 'success',
          duration: 1500
        });
        
        // 返回上一页并立即刷新
        setTimeout(() => {
          // 确保返回上一页时会刷新数据
          const pages = getCurrentPages();
          if (pages.length > 1) {
            const prevPage = pages[pages.length - 2];
            
            // 向上一页传递更新后的数据
            if (prevPage && prevPage.route.includes('todoList')) {
              console.log('尝试更新todoList页面数据');
              // 设置标记，表示需要刷新
              if (typeof prevPage.setData === 'function') {
                prevPage.setData({
                  needRefresh: true,
                  lastUpdatedTodoId: todoId,
                  lastUpdatedTomatoCount: currentCount, // 计数保持不变
                  lastUpdatedTomatoTotalTime: newTotalTime
                });
              }
            }
          }
          
          // 返回上一页
          wx.navigateBack({
            success: function() {
              console.log('成功返回上一页');
            }
          });
        }, 1000);
      } else {
        wx.hideLoading();
        wx.showToast({
          title: '保存失败',
          icon: 'none'
        });
        setTimeout(() => wx.navigateBack(), 800);
      }
    }).catch(err => {
      console.error('保存部分番茄钟失败:', err);
      wx.hideLoading();
      wx.showToast({ title: '保存失败: ' + err.message, icon: 'none' });
      setTimeout(() => wx.navigateBack(), 800);
    });
  },
  /**
   * 开始计时器
   */
  startTimer() {
    if (this.data.timer) {
      clearTimeout(this.data.timer);
      this.setData({ timer: null });
    }
    
    if (this.data.paused) return;
    
    if (this.data.timeLeft <= 0) {
      this.onFinish();
      return;
    }
    
    this.drawProgress(this.data.timeLeft / (this.data.duration * 60));
    
    const timer = setTimeout(() => {
      this.setData({ timeLeft: this.data.timeLeft - 1 });
      this.startTimer();
    }, 1000);
    
    this.setData({ timer });
  },
  
  /**
   * 暂停或继续
   */
  onPause() {
    this.setData({ paused: !this.data.paused });
    
    if (!this.data.paused) {
      this.startTimer();
    } else if (this.data.timer) {
      clearTimeout(this.data.timer);
      this.setData({ timer: null });
    }
  }
})