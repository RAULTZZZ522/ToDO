// pages/tomatoTimer/index.js
const db = wx.cloud.database();
const _ = db.command;

Page({

  /**
   * 页面的初始数据
   */
  data: {
    title: '',
    duration: 25,
    id: '',
    timeLeft: 1500,
    timer: null,
    paused: false,
    percent: 1,
    // 预设的番茄钟时长选项
    durationOptions: [
      { value: 15, label: '15分钟' },
      { value: 25, label: '25分钟' },
      { value: 30, label: '30分钟' },
      { value: 45, label: '45分钟' },
      { value: 60, label: '60分钟' }
    ],
    showDurationPicker: false,
    category: '',
    startTime: 0, // 记录开始时间
    pomodoroRecordId: '' // 存储番茄钟记录ID，用于后续更新
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log('番茄钟页面加载，参数:', options);
    
    // 检查必要参数
    if (!options.id) {
      console.error('缺少必要的任务ID参数');
      wx.showToast({
        title: '缺少必要的任务ID参数',
        icon: 'none',
        duration: 2000
      });
      
      // 延迟返回上一页
      setTimeout(() => {
        wx.navigateBack();
      }, 2000);
      
      return;
    }
    
    const startTime = new Date().getTime(); // 记录开始时间
    
    // 确保options中的参数存在，并设置默认值
    this.setData({
      title: decodeURIComponent(options.title || ''),
      duration: Number(options.duration || 25),
      id: options.id || '',
      timeLeft: Number(options.duration || 25) * 60,
      category: decodeURIComponent(options.category || ''),
      startTime: startTime
    });
    
    console.log('番茄钟页面数据设置完成:', {
      title: this.data.title,
      duration: this.data.duration,
      id: this.data.id,
      timeLeft: this.data.timeLeft,
      category: this.data.category,
      startTime: this.data.startTime
    });
    
    // 格式化时间测试
    console.log('格式化时间测试:', this.formatTime(this.data.timeLeft));
    
    // 先创建番茄钟记录，成功后再开始计时
    this.createPomodoroRecord()
      .then(() => {
        console.log('番茄钟记录创建成功，开始计时');
        
        // 等待页面渲染完成后再绘制圆环
        wx.nextTick(() => {
          this.drawProgress(1);
          this.startTimer();
        });
      })
      .catch(err => {
        console.error('创建番茄钟记录失败，但仍继续计时:', err);
        
        // 即使创建记录失败，也继续计时
        wx.nextTick(() => {
          this.drawProgress(1);
          this.startTimer();
        });
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
    // 确保数据在页面隐藏时也能得到保存
    // 注意：页面隐藏可能是由于返回按钮或其他方式导致的
    if (this.data.timer) {
      clearTimeout(this.data.timer);
      
      // 计算已经计时的时间（秒）
      const originalTimeInSeconds = this.data.duration * 60;
      const elapsedTimeInSeconds = originalTimeInSeconds - this.data.timeLeft;
      
      console.log('页面隐藏时保存计时状态:', elapsedTimeInSeconds, '秒，总共:', originalTimeInSeconds, '秒');
      
      // 如果已经计时超过一定时间（如10秒），自动保存
      if (elapsedTimeInSeconds > 10) {
        // 转换为分钟并四舍五入到整数
        const elapsedTimeInMinutes = Math.round(elapsedTimeInSeconds / 60);
        const todoId = this.data.id;
        const endTime = new Date().getTime(); // 结束时间（当前时间）
        
        console.log('页面隐藏自动保存部分完成的番茄钟:');
        console.log('计时时间:', elapsedTimeInMinutes, '分钟');
        console.log('开始时间:', new Date(this.data.startTime).toLocaleString());
        console.log('结束时间:', new Date(endTime).toLocaleString());
        
        // 设置一个标记，表示页面正在保存数据
        this.savingData = true;
        
        // 更新番茄钟记录
        this.updatePomodoroRecord(endTime, false, elapsedTimeInMinutes)
          .then(() => {
            console.log('页面隐藏时番茄钟记录已更新');
            
            // 更新对应的todo记录，增加番茄钟计数和总时长
            if (todoId && elapsedTimeInMinutes >= 5) { // 只有超过5分钟才计入统计
              return wx.cloud.callFunction({
                name: 'todoModel',
                data: {
                  type: 'updateTodo',
                  id: todoId,
                  tomatoCount: _.inc(1), // 增加番茄钟计数
                  tomatoTotalTime: _.inc(elapsedTimeInMinutes) // 增加总时长
                }
              }).catch(err => {
                console.error('页面隐藏时更新todo番茄钟计数失败:', err);
                // 不中断主流程
                return null;
              });
            }
            return null;
          })
          .then(todoRes => {
            if (todoRes) {
              console.log('页面隐藏时更新todo番茄钟计数结果:', todoRes);
            }
            
            // 确保返回上一页时会刷新数据
            const pages = getCurrentPages();
            if (pages.length > 1) {
              const prevPage = pages[pages.length - 2];
              
              // 向上一页传递更新后的数据
              if (prevPage && prevPage.route.includes('todoList')) {
                console.log('尝试更新todoList页面数据');
                if (typeof prevPage.setData === 'function') {
                  prevPage.setData({
                    needRefresh: true
                  });
                }
              }
            }
            
            this.savingData = false;
          })
          .catch(err => {
            console.error('页面隐藏时保存部分番茄钟失败:', err);
            this.savingData = false;
          });
      }
    }
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    // 如果计时器还在运行，需要保存当前状态
    if (this.data.timer) {
      clearTimeout(this.data.timer);
      
      // 计算已经计时的时间（秒）
      const originalTimeInSeconds = this.data.duration * 60;
      const elapsedTimeInSeconds = originalTimeInSeconds - this.data.timeLeft;
      
      console.log('页面卸载时保存计时状态:', elapsedTimeInSeconds, '秒，总共:', originalTimeInSeconds, '秒');
      
      // 如果已经计时超过一定时间（如10秒），自动保存
      if (elapsedTimeInSeconds > 10) {
        // 转换为分钟并四舍五入到整数
        const elapsedTimeInMinutes = Math.round(elapsedTimeInSeconds / 60);
        const todoId = this.data.id;
        const endTime = new Date().getTime(); // 结束时间（当前时间）
        
        console.log('页面卸载自动保存部分完成的番茄钟:');
        console.log('ID:', todoId);
        console.log('计时时间:', elapsedTimeInMinutes, '分钟');
        console.log('开始时间:', new Date(this.data.startTime).toLocaleString());
        console.log('结束时间:', new Date(endTime).toLocaleString());
        
        // 更新番茄钟记录
        this.updatePomodoroRecord(endTime, false, elapsedTimeInMinutes)
          .then(() => {
            console.log('页面卸载时番茄钟记录已更新');
            
            // 更新对应的todo记录，增加番茄钟计数和总时长
            if (todoId && elapsedTimeInMinutes >= 5) { // 只有超过5分钟才计入统计
              return wx.cloud.callFunction({
                name: 'todoModel',
                data: {
                  type: 'updateTodo',
                  id: todoId,
                  tomatoCount: _.inc(1), // 增加番茄钟计数
                  tomatoTotalTime: _.inc(elapsedTimeInMinutes) // 增加总时长
                }
              }).catch(err => {
                console.error('页面卸载时更新todo番茄钟计数失败:', err);
                // 不中断主流程
                return null;
              });
            }
            return null;
          })
          .then(todoRes => {
            if (todoRes) {
              console.log('页面卸载时更新todo番茄钟计数结果:', todoRes);
            }
            
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
                    lastUpdatedTodoId: todoId
                  });
                }
              }
            }
          })
          .catch(err => {
            console.error('页面卸载时保存部分番茄钟失败:', err);
          });
      }
    }
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

  // 停止番茄钟
  onStop() {
    if (!this.data.timer) return;
    
    clearTimeout(this.data.timer);
    
    // 计算已经计时的时间（秒）
    const originalTimeInSeconds = this.data.duration * 60;
    const elapsedTimeInSeconds = originalTimeInSeconds - this.data.timeLeft;
    
    console.log('停止番茄钟，已计时:', elapsedTimeInSeconds, '秒，总共:', originalTimeInSeconds, '秒');
    
    // 如果已经计时超过一定时间（如10秒），询问是否保存
    if (elapsedTimeInSeconds > 10) {
      wx.showModal({
        title: '保存计时',
        content: '是否保存已计时的时间？',
        confirmText: '保存',
        cancelText: '不保存',
        success: (res) => {
          if (res.confirm) {
            // 用户点击确定，保存部分完成的番茄钟
            this.savePartialTomato(elapsedTimeInSeconds);
          } else {
            // 用户点击取消，更新记录为未完成并返回
            const endTime = new Date().getTime();
            const elapsedTimeInMinutes = Math.round(elapsedTimeInSeconds / 60);
            
            // 更新番茄钟记录
            this.updatePomodoroRecord(endTime, false, elapsedTimeInMinutes)
              .then(() => {
                console.log('番茄钟记录已更新为未完成');
              })
              .catch(err => {
                console.error('更新番茄钟记录失败:', err);
                // 显示错误但不阻止返回
                wx.showToast({
                  title: '更新记录失败: ' + (err.message || '未知错误'),
                  icon: 'none',
                  duration: 1500
                });
              })
              .finally(() => {
                wx.navigateBack();
              });
          }
        }
      });
    } else {
      // 时间太短，更新记录为未完成并返回
      const endTime = new Date().getTime();
      
      // 更新番茄钟记录
      this.updatePomodoroRecord(endTime, false, 0)
        .then(() => {
          console.log('番茄钟记录已更新为未完成（时间太短）');
        })
        .catch(err => {
          console.error('更新番茄钟记录失败:', err);
          // 显示错误但不阻止返回
          wx.showToast({
            title: '更新记录失败: ' + (err.message || '未知错误'),
            icon: 'none',
            duration: 1500
          });
        })
        .finally(() => {
          wx.showToast({
            title: '时间太短，未保存',
            icon: 'none',
            duration: 1000
          });
          setTimeout(() => wx.navigateBack(), 1000);
        });
    }
  },
  onFinish() {
    clearTimeout(this.data.timer);
    
    // 播放完成提示音
    const innerAudioContext = wx.createInnerAudioContext();
    innerAudioContext.src = 'https://6d61-mycloud-4gvfly7v9aecf10f-1305446481.tcb.qcloud.la/ding.mp3';
    innerAudioContext.play();
    
    // 震动提示
    wx.vibrateShort();
    
    wx.showLoading({ title: '保存中...' });
    
    const todoId = this.data.id;
    const duration = this.data.duration; // 番茄钟时长（分钟）
    const endTime = new Date().getTime(); // 结束时间（当前时间）
    
    console.log('完成番茄钟:');
    console.log('ID:', todoId);
    console.log('时长:', duration, '分钟');
    console.log('开始时间:', new Date(this.data.startTime).toLocaleString());
    console.log('结束时间:', new Date(endTime).toLocaleString());
    
    // 更新番茄钟记录
    this.updatePomodoroRecord(endTime, true, duration)
      .then(() => {
        console.log('番茄钟记录已更新为已完成');
        
        // 更新对应的todo记录，增加tomatoCount
        if (todoId) {
          return wx.cloud.callFunction({
            name: 'todoModel',
            data: {
              type: 'updateTodo',
              id: todoId,
              tomatoCount: _.inc(1), // 增加番茄钟计数
              tomatoTotalTime: _.inc(duration) // 增加总时长
            }
          });
        }
      })
      .then(todoRes => {
        if (todoRes) {
          console.log('更新todo番茄钟计数结果:', todoRes);
        }
        
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
                  lastUpdatedTodoId: todoId
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
      })
      .catch(err => {
        console.error('保存番茄钟记录失败:', err);
        wx.hideLoading();
        
        // 显示详细错误信息
        const errorMsg = err.message || err.errMsg || JSON.stringify(err);
        console.error('错误详情:', errorMsg);
        
        wx.showModal({
          title: '保存失败',
          content: '无法保存番茄钟记录: ' + errorMsg,
          showCancel: false,
          success: () => {
            // 即使保存失败，也返回上一页
            wx.navigateBack();
          }
        });
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
      ctx.setStrokeStyle('rgba(255, 224, 204, 0.5)'); // 更改为暖色调背景
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
      ctx.stroke();
      
      // 绘制进度圆环
      ctx.beginPath();
      ctx.setLineWidth(12);
      ctx.setLineCap('round');
      ctx.setStrokeStyle('#ff8f66'); // 更改为橙色
      ctx.arc(centerX, centerY, radius, -Math.PI/2, -Math.PI/2 + 2 * Math.PI * percent, false);
      ctx.stroke();
      ctx.draw();
    }).exec();
  },
  // 保存部分完成的番茄钟
  savePartialTomato(elapsedTimeInSeconds) {
    const todoId = this.data.id;
    
    // 转换为分钟并四舍五入到整数
    const elapsedTimeInMinutes = Math.round(elapsedTimeInSeconds / 60);
    const endTime = new Date().getTime(); // 结束时间（当前时间）
    
    console.log('保存部分完成的番茄钟:');
    console.log('ID:', todoId);
    console.log('计时时间:', elapsedTimeInMinutes, '分钟');
    console.log('开始时间:', new Date(this.data.startTime).toLocaleString());
    console.log('结束时间:', new Date(endTime).toLocaleString());
    
    wx.showLoading({ title: '保存中...' });
    
    // 更新番茄钟记录
    this.updatePomodoroRecord(endTime, false, elapsedTimeInMinutes)
      .then(() => {
        console.log('部分番茄钟记录已更新');
        
        // 更新对应的todo记录，增加番茄钟计数和总时长
        if (todoId && elapsedTimeInMinutes >= 5) { // 只有超过5分钟才计入统计
          return wx.cloud.callFunction({
            name: 'todoModel',
            data: {
              type: 'updateTodo',
              id: todoId,
              tomatoCount: _.inc(1), // 增加番茄钟计数
              tomatoTotalTime: _.inc(elapsedTimeInMinutes) // 增加总时长
            }
          }).catch(err => {
            console.error('更新todo番茄钟计数失败:', err);
            // 不中断主流程
            return null;
          });
        }
        return null;
      })
      .then(todoRes => {
        if (todoRes) {
          console.log('更新todo番茄钟计数结果:', todoRes);
        }
        
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
                  lastUpdatedTodoId: todoId
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
      })
      .catch(err => {
        console.error('保存部分番茄钟记录失败:', err);
        wx.hideLoading();
        
        // 显示详细错误信息
        const errorMsg = err.message || err.errMsg || JSON.stringify(err);
        console.error('错误详情:', errorMsg);
        
        wx.showModal({
          title: '保存失败',
          content: '无法保存番茄钟记录: ' + errorMsg,
          showCancel: false,
          success: () => {
            // 即使保存失败，也返回上一页
            wx.navigateBack();
          }
        });
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
      // 完成番茄钟，增加计数，并保存到数据库
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
  },

  /**
   * 切换时长选择器的显示状态
   */
  toggleDurationPicker() {
    if (this.data.timer) {
      // 如果计时器已经在运行，提示不能更改时长
      wx.showToast({
        title: '计时中无法更改时长',
        icon: 'none'
      });
      return;
    }
    
    this.setData({
      showDurationPicker: !this.data.showDurationPicker
    });
  },
  
  /**
   * 选择新的番茄钟时长
   */
  selectDuration(e) {
    const duration = Number(e.currentTarget.dataset.duration);
    if (duration) {
      this.setData({
        duration: duration,
        timeLeft: duration * 60,
        showDurationPicker: false
      });
      
      // 重绘进度条
      wx.nextTick(() => {
        this.drawProgress(1);
      });
    }
  },
  
  /**
   * 创建番茄钟记录（开始计时时）
   */
  createPomodoroRecord() {
    const todoId = this.data.id;
    if (!todoId) {
      console.error('没有有效的todoId，无法创建番茄钟记录');
      wx.showToast({
        title: '没有有效的任务ID',
        icon: 'none',
        duration: 2000
      });
      return Promise.reject(new Error('没有有效的todoId'));
    }
    
    // 创建番茄钟记录（开始状态）
    const tomatoRecord = {
      todoId: todoId,
      title: this.data.title,
      category: this.data.category,
      startTime: this.data.startTime, // 使用记录的开始时间
      endTime: null, // 初始时结束时间为空
      duration: this.data.duration, // 预计持续时间（分钟）
      completed: false, // 初始状态为未完成
      inProgress: true // 标记为进行中
    };
    
    console.log('创建初始番茄钟记录:', JSON.stringify(tomatoRecord));
    console.log('详细参数检查:');
    console.log('- todoId:', todoId);
    console.log('- title:', this.data.title);
    console.log('- category:', this.data.category);
    console.log('- startTime:', this.data.startTime, new Date(this.data.startTime).toLocaleString());
    console.log('- duration:', this.data.duration);
    console.log('- inProgress:', true);
    
    // 显示加载提示
    wx.showLoading({
      title: '初始化番茄钟...',
      mask: true
    });
    
    // 使用云函数保存并返回Promise
    return new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: 'todoModel',
        data: {
          type: 'addTomatoRecord',
          record: tomatoRecord
        }
      }).then(recordRes => {
        console.log('初始番茄钟记录保存结果:', recordRes);
        
        // 隐藏加载提示
        wx.hideLoading();
        
        // 检查响应是否成功
        if (recordRes && recordRes.result && recordRes.result.code === 0) {
          const recordId = recordRes.result.data.id;
          console.log('初始番茄钟记录保存成功，ID:', recordId);
          
          // 保存记录ID到页面数据中，用于后续更新
          this.setData({
            pomodoroRecordId: recordId
          });
          
          resolve(recordId);
        } else {
          const errorMsg = recordRes && recordRes.result ? recordRes.result.msg : '未知错误';
          console.error('初始番茄钟记录保存失败，响应:', errorMsg);
          
          // 显示错误提示
          wx.showToast({
            title: '创建番茄钟记录失败: ' + errorMsg,
            icon: 'none',
            duration: 2000
          });
          
          reject(new Error('创建番茄钟记录失败: ' + errorMsg));
        }
      }).catch(err => {
        // 隐藏加载提示
        wx.hideLoading();
        
        console.error('创建初始番茄钟记录失败:', err);
        
        // 显示错误提示
        wx.showToast({
          title: '创建番茄钟记录失败: ' + (err.message || '未知错误'),
          icon: 'none',
          duration: 2000
        });
        
        reject(err);
      });
    });
  },
  
  /**
   * 更新番茄钟记录（结束计时时）
   */
  updatePomodoroRecord(endTime, completed, elapsedTimeInMinutes) {
    const recordId = this.data.pomodoroRecordId;
    const todoId = this.data.id;
    
    if (!recordId) {
      console.error('没有有效的pomodoroRecordId，将创建新记录而不是更新');
      
      // 如果没有记录ID，创建一个新记录
      const tomatoRecord = {
        todoId: todoId,
        title: this.data.title,
        category: this.data.category,
        startTime: this.data.startTime,
        endTime: endTime,
        duration: elapsedTimeInMinutes,
        completed: completed,
        inProgress: false // 明确标记为非进行中
      };
      
      console.log('创建新的番茄钟记录:', JSON.stringify(tomatoRecord));
      console.log('详细参数检查:');
      console.log('- todoId:', todoId);
      console.log('- title:', this.data.title);
      console.log('- category:', this.data.category);
      console.log('- startTime:', this.data.startTime, new Date(this.data.startTime).toLocaleString());
      console.log('- endTime:', endTime, new Date(endTime).toLocaleString());
      console.log('- duration:', elapsedTimeInMinutes);
      console.log('- completed:', completed);
      console.log('- inProgress:', false);
      
      // 显示加载提示
      wx.showLoading({
        title: '保存记录...',
        mask: true
      });
      
      return wx.cloud.callFunction({
        name: 'todoModel',
        data: {
          type: 'addTomatoRecord',
          record: tomatoRecord
        }
      }).then(recordRes => {
        console.log('新番茄钟记录创建结果:', recordRes);
        
        // 隐藏加载提示
        wx.hideLoading();
        
        if (recordRes && recordRes.result && recordRes.result.code === 0) {
          const newRecordId = recordRes.result.data.id;
          console.log('新番茄钟记录创建成功，ID:', newRecordId);
          
          // 保存记录ID到页面数据中
          this.setData({
            pomodoroRecordId: newRecordId
          });
          
          return recordRes;
        } else {
          const errorMsg = recordRes && recordRes.result ? recordRes.result.msg : '未知错误';
          console.error('新番茄钟记录创建失败，响应:', errorMsg);
          throw new Error('创建番茄钟记录失败: ' + errorMsg);
        }
      }).catch(err => {
        // 隐藏加载提示
        wx.hideLoading();
        
        console.error('创建新番茄钟记录失败:', err);
        throw err;
      });
    }
    
    console.log('更新番茄钟记录:', recordId);
    console.log('结束时间:', new Date(endTime).toLocaleString());
    console.log('是否完成:', completed);
    console.log('实际持续时间:', elapsedTimeInMinutes, '分钟');
    
    // 显示加载提示
    wx.showLoading({
      title: '更新记录...',
      mask: true
    });
    
    // 使用云函数更新
    return wx.cloud.callFunction({
      name: 'todoModel',
      data: {
        type: 'updateTomatoRecord',
        recordId: recordId,
        updateData: {
          endTime: endTime,
          completed: completed,
          duration: elapsedTimeInMinutes,
          inProgress: false
        }
      }
    }).then(updateRes => {
      console.log('番茄钟记录更新结果:', updateRes);
      
      // 隐藏加载提示
      wx.hideLoading();
      
      if (updateRes && updateRes.result && updateRes.result.code === 0) {
        return updateRes;
      } else {
        const errorMsg = updateRes && updateRes.result ? updateRes.result.msg : '未知错误';
        console.error('番茄钟记录更新失败，响应:', errorMsg);
        throw new Error('更新番茄钟记录失败: ' + errorMsg);
      }
    }).catch(err => {
      // 隐藏加载提示
      wx.hideLoading();
      
      console.error('更新番茄钟记录失败:', err);
      
      // 如果更新失败，尝试创建新记录
      console.log('尝试创建新记录...');
      
      const tomatoRecord = {
        todoId: todoId,
        title: this.data.title,
        category: this.data.category,
        startTime: this.data.startTime,
        endTime: endTime,
        duration: elapsedTimeInMinutes,
        completed: completed,
        inProgress: false
      };
      
      console.log('创建备用番茄钟记录:', JSON.stringify(tomatoRecord));
      
      // 显示加载提示
      wx.showLoading({
        title: '重试保存...',
        mask: true
      });
      
      return wx.cloud.callFunction({
        name: 'todoModel',
        data: {
          type: 'addTomatoRecord',
          record: tomatoRecord
        }
      }).then(recordRes => {
        console.log('备用方案：新番茄钟记录创建结果:', recordRes);
        
        // 隐藏加载提示
        wx.hideLoading();
        
        if (recordRes && recordRes.result && recordRes.result.code === 0) {
          const newRecordId = recordRes.result.data.id;
          console.log('备用方案：新番茄钟记录创建成功，ID:', newRecordId);
          return recordRes;
        } else {
          throw new Error('备用方案创建番茄钟记录也失败');
        }
      }).catch(finalErr => {
        // 隐藏加载提示
        wx.hideLoading();
        
        console.error('备用方案也失败:', finalErr);
        throw finalErr;
      });
    });
  }
})