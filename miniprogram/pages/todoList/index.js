Page({
  data: {
    todos: [],
    categories: ['学习', '工作', '运动', '爱好', '生活', '其他'],
    showAddModal: false,
    newTodo: {
      title: '',
      description: '',
      importance: 3,
      category: '学习',
      tomatoDuration: 25
    },
    tomatoTimer: null,
    tomatoTimeLeft: 0,
    tomatoRunningId: null,
    showTomatoBar: false,
    tomatoTotalTime: 0,
    needRefresh: false,
    lastUpdatedTodoId: null,
    lastUpdatedTomatoCount: null,
    lastUpdatedTomatoTotalTime: null
  },

  onLoad: function() {
    this.loadTodos();
  },

  onShow: function() {
    console.log('TodoList页面显示，将重新加载数据');
    
    // 检查是否需要刷新特定todo的tomatoCount和tomatoTotalTime
    if (this.data.needRefresh && this.data.lastUpdatedTodoId) {
      console.log('检测到需要刷新，更新特定todo的tomatoCount和tomatoTotalTime');
      
      // 找到需要更新的todo
      const todos = this.data.todos;
      const updatedTodos = todos.map(todo => {
        if (todo._id === this.data.lastUpdatedTodoId) {
          // 只更新提供的字段
          if (this.data.lastUpdatedTomatoCount !== undefined && this.data.lastUpdatedTomatoCount !== null) {
            console.log(`更新 ${todo.title} 的番茄钟计数为 ${this.data.lastUpdatedTomatoCount}`);
            todo.tomatoCount = this.data.lastUpdatedTomatoCount;
          }
          
          if (this.data.lastUpdatedTomatoTotalTime !== undefined && this.data.lastUpdatedTomatoTotalTime !== null) {
            console.log(`更新 ${todo.title} 的总计时为 ${this.data.lastUpdatedTomatoTotalTime} 分钟`);
            todo.tomatoTotalTime = this.data.lastUpdatedTomatoTotalTime;
          }
        }
        return todo;
      });
      
      // 更新界面
      this.setData({
        todos: updatedTodos,
        needRefresh: false,
        lastUpdatedTodoId: null,
        lastUpdatedTomatoCount: null,
        lastUpdatedTomatoTotalTime: null
      }, () => {
        console.log('局部更新完成，排序中...');
        this.sortTodos();
      });
    } else {
      // 正常加载全部数据
      this.loadTodos();
    }
  },

  /**
   * 加载待办事项列表
   */
  loadTodos: function() {
    wx.showLoading({
      title: '加载中...'
    });
    
    // 调用云函数获取待办事项
    wx.cloud.callFunction({
      name: 'todoModel',
      data: {
        type: 'getTodos'
      }
    }).then(res => {
      wx.hideLoading();
      
      const result = res.result;
      if (result.code === 0) {
        // 打印原始数据中的字段
        console.log('原始数据中的字段:');
        result.data.forEach(todo => {
          console.log(`${todo.title}: tomatoCount = ${todo.tomatoCount}, tomatoTotalTime = ${todo.tomatoTotalTime}, category = ${todo.category}`);
        });
        
        // 格式化日期并确保字段存在
        const todos = result.data.map(todo => {
          // 格式化日期
          if (todo.createTime) {
            todo.createTime = this.formatDate(todo.createTime);
          }
          if (todo.updateTime) {
            todo.updateTime = this.formatDate(todo.updateTime);
          }
          
          // 确保tomatoCount字段存在且为数字
          if (todo.tomatoCount === undefined || todo.tomatoCount === null) {
            todo.tomatoCount = 0;
          } else {
            // 确保是数字类型
            todo.tomatoCount = Number(todo.tomatoCount);
          }
          
          // 确保tomatoTotalTime字段存在且为数字
          if (todo.tomatoTotalTime === undefined || todo.tomatoTotalTime === null) {
            todo.tomatoTotalTime = 0;
          } else {
            // 确保是数字类型
            todo.tomatoTotalTime = Number(todo.tomatoTotalTime);
          }
          
          // 确保category字段存在
          if (!todo.category) {
            todo.category = '学习';
          }
          
          console.log(`处理后 Todo ${todo.title} 的 tomatoCount: ${todo.tomatoCount}, tomatoTotalTime: ${todo.tomatoTotalTime}, category: ${todo.category}`);
          return todo;
        });
        
        // 为了确保UI能够正确渲染，我们在设置数据后延迟执行一次页面更新
        this.setData({ todos: todos }, () => {
          console.log('数据已设置，排序中...');
          this.sortTodos();
          
          // 检查字段是否被正确设置
          setTimeout(() => {
            const todos = this.data.todos;
            console.log('页面渲染后检查数据:');
            todos.forEach(todo => {
              console.log(`${todo.title}: tomatoCount = ${todo.tomatoCount}, tomatoTotalTime = ${todo.tomatoTotalTime}, category = ${todo.category}`);
            });
          }, 500);
        });
      } else {
        wx.showToast({
          title: '加载失败: ' + (result.message || '未知错误'),
          icon: 'none'
        });
      }
    }).catch(err => {
      wx.hideLoading();
      console.error('加载待办事项失败:', err);
      wx.showToast({
        title: '加载失败: ' + err.message,
        icon: 'none'
      });
    });
  },

  // 开始番茄钟
  startTomato: function(e) {
    const id = e.currentTarget.dataset.id;
    const todo = this.data.todos.find(t => t._id === id);
    if (!todo) return;
    
    console.log('开始番茄钟，当前todo:', todo);
    
    // 确保tomatoCount是数字
    let tomatoCount = 0;
    if (todo.tomatoCount !== undefined && todo.tomatoCount !== null) {
      tomatoCount = Number(todo.tomatoCount);
    }
    
    // 确保tomatoTotalTime是数字
    let tomatoTotalTime = 0;
    if (todo.tomatoTotalTime !== undefined && todo.tomatoTotalTime !== null) {
      tomatoTotalTime = Number(todo.tomatoTotalTime);
    }
    
    console.log(`准备传递的番茄钟计数: ${tomatoCount}, 总计时: ${tomatoTotalTime}, 类型: ${typeof tomatoCount}`);
    console.log('类别:', todo.category || '无类别');
    
    // 准备传递给番茄钟页面的参数
    const title = encodeURIComponent(todo.title);
    const duration = todo.tomatoDuration || 25;
    const category = encodeURIComponent(todo.category || '');
    
    // 设置需要刷新的标记
    this.setData({
      needRefresh: false,
      lastUpdatedTodoId: id,
      lastUpdatedTomatoCount: tomatoCount,
      lastUpdatedTomatoTotalTime: tomatoTotalTime
    });
    
    // 跳转到番茄钟页面
    console.log(`跳转到番茄钟页面: /pages/tomatoTimer/index?title=${title}&duration=${duration}&count=${tomatoCount}&totalTime=${tomatoTotalTime}&id=${id}&category=${category}`);
    
    wx.navigateTo({
      url: `/pages/tomatoTimer/index?title=${title}&duration=${duration}&count=${tomatoCount}&totalTime=${tomatoTotalTime}&id=${id}&category=${category}`,
      fail: function(err) {
        console.error('跳转番茄钟页面失败:', err);
        wx.showToast({
          title: '跳转失败: ' + err.errMsg,
          icon: 'none'
        });
      }
    });
  },
  
  formatTomatoTime: function(t) {
    const m = Math.floor(t / 60);
    const s = t % 60;
    return `${m}:${s < 10 ? '0' + s : s}`;
  },
   
  // 格式化日期为年月日
  formatDate: function(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
  },

  // Toggle sorting method
  toggleSort: function(e) {
    const type = e.currentTarget.dataset.type;
    if (this.data.sortBy === type) {
      // Toggle sort direction if same type
      this.setData({
        sortAsc: !this.data.sortAsc
      });
    } else {
      // Set new sort type
      this.setData({
        sortBy: type,
        sortAsc: false // Default to descending (newest/most important first)
      });
    }
    this.sortTodos();
  },

  // Sort todos based on current sort settings
  sortTodos: function() {
    const { todos, sortBy, sortAsc } = this.data;
    
    const sortedTodos = [...todos].sort((a, b) => {
      if (sortBy === 'updateTime') {
        const timeA = new Date(a.updateTime || a.createTime).getTime();
        const timeB = new Date(b.updateTime || b.createTime).getTime();
        return sortAsc ? timeA - timeB : timeB - timeA;
      } else if (sortBy === 'importance') {
        return sortAsc ? a.importance - b.importance : b.importance - a.importance;
      }
      return 0;
    });
    
    this.setData({
      todos: sortedTodos
    });
  },

  // Show modal to add new todo
  showAddModal: function() {
    this.setData({
      showAddModal: true,
      newTodo: {
        title: '',
        description: '',
        importance: 3,
        tomatoDuration: 25,
        tomatoCount: 0,
        category: '学习'
      }
    });
  },

  // Hide add modal
  hideAddModal: function() {
    this.setData({
      showAddModal: false
    });
  },

  // Handle input for new todo
  onTitleInput: function(e) {
    this.setData({
      'newTodo.title': e.detail.value
    });
  },

  onDescriptionInput: function(e) {
    this.setData({
      'newTodo.description': e.detail.value
    });
  },

  // Change importance level
  changeImportance: function(e) {
    const level = parseInt(e.currentTarget.dataset.level);
    this.setData({
      'newTodo.importance': level
    });
  },

  // Save new todo
  saveTodo: function() {
    const { title, description, importance, tomatoDuration, tomatoCount, category } = this.data.newTodo;
    
    if (!title.trim()) {
      wx.showToast({
        title: '请输入标题',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({
      title: '保存中',
    });

    console.log('Calling cloud function with params:', {
      type: 'addTodo',
      title: title.trim(),
      description: description.trim(),
      importance: importance,
      tomatoDuration: tomatoDuration,
      tomatoCount: tomatoCount,
      category: category
    });

    wx.cloud.callFunction({
      name: 'todoModel',
      data: {
        type: 'addTodo',
        title: title.trim(),
        description: description.trim(),
        importance: importance,
        tomatoDuration: tomatoDuration,
        tomatoCount: tomatoCount,
        category: category
      }
    }).then(res => {
      console.log('Cloud function response:', res);
      const result = res.result;
      if (result.code === 0) {
        wx.showToast({
          title: '添加成功'
        });
        this.setData({
          showAddModal: false
        });
        this.loadTodos(); // Refresh the list
      } else {
        wx.showToast({
          title: result.msg || '添加失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      console.error('Cloud function error:', err);
      wx.showToast({
        title: '网络错误: ' + (err.errMsg || err.message || JSON.stringify(err)),
        icon: 'none',
        duration: 3000
      });
    }).finally(() => {
      wx.hideLoading();
    });
  },

  // Toggle todo completion status
  toggleComplete: function(e) {
    const id = e.currentTarget.dataset.id;
    const completed = e.currentTarget.dataset.completed;
    
    wx.cloud.callFunction({
      name: 'todoModel',
      data: {
        type: 'updateTodo',
        id: id,
        completed: !completed
      }
    }).then(res => {
      const result = res.result;
      if (result.code === 0) {
        this.loadTodos(); // Refresh the list
      } else {
        wx.showToast({
          title: result.msg || '操作失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      console.error(err);
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      });
    });
  },

  // Delete a todo
  deleteTodo: function(e) {
    const id = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个日程吗？',
      success: res => {
        if (res.confirm) {
          wx.showLoading({
            title: '删除中',
          });
          
          wx.cloud.callFunction({
            name: 'todoModel',
            data: {
              type: 'deleteTodo',
              id: id
            }
          }).then(res => {
            const result = res.result;
            if (result.code === 0) {
              wx.showToast({
                title: '删除成功'
              });
              this.loadTodos(); // Refresh the list
            } else {
              wx.showToast({
                title: result.msg || '删除失败',
                icon: 'none'
              });
            }
          }).catch(err => {
            console.error(err);
            wx.showToast({
              title: '网络错误',
              icon: 'none'
            });
          }).finally(() => {
            wx.hideLoading();
          });
        }
      }
    });
  },

  // 新增/编辑弹窗输入绑定
  onTomatoDurationInput: function(e) {
    this.setData({ 'newTodo.tomatoDuration': Number(e.detail.value) });
  },

  onCategoryChange: function(e) {
    this.setData({ 'newTodo.category': this.data.categories[e.detail.value] });
  },

  runTomatoTimer: function() {
    if (this.data.tomatoTimeLeft <= 0) {
      this.finishTomato();
      return;
    }
    this.data.tomatoTimer = setTimeout(() => {
      this.setData({ tomatoTimeLeft: this.data.tomatoTimeLeft - 1 });
      this.runTomatoTimer();
    }, 1000);
  },

  finishTomato: function() {
    clearTimeout(this.data.tomatoTimer);
    const id = this.data.tomatoRunningId;
    const todo = this.data.todos.find(t => t._id === id);
    if (!todo) return;
    wx.cloud.callFunction({
      name: 'todoModel',
      data: {
        type: 'updateTodo',
        id: id,
        tomatoCount: (todo.tomatoCount || 0) + 1
      }
    }).then(() => {
      wx.showToast({ title: '番茄钟完成！', icon: 'success' });
      this.setData({ tomatoTimer: null, tomatoTimeLeft: 0, tomatoRunningId: null });
      this.loadTodos();
    });
  },

  stopTomato: function() {
    clearTimeout(this.data.tomatoTimer);
    this.setData({ tomatoTimer: null, tomatoTimeLeft: 0, tomatoRunningId: null });
    wx.showToast({ title: '已结束番茄钟', icon: 'none' });
  },

  // 跳转到番茄钟页面
  goToTomato: function(e) {
    const { id, title, category, count, totalTime } = e.currentTarget.dataset;
    
    console.log('跳转到番茄钟页面:');
    console.log('ID:', id);
    console.log('标题:', title);
    console.log('类别:', category);
    console.log('当前计数:', count || 0);
    console.log('当前总时间:', totalTime || 0);
    
    // 准备缺省值
    const tomatoCount = count || 0;
    const tomatoTotalTime = totalTime || 0;
    
    // 设置需要刷新的标记
    this.setData({
      needRefresh: false, // 先设为false，等番茄钟页面返回时会根据需要设为true
      lastUpdatedTodoId: id,
      lastUpdatedTomatoCount: tomatoCount,
      lastUpdatedTomatoTotalTime: tomatoTotalTime
    });
    
    wx.navigateTo({
      url: `/pages/tomatoTimer/index?id=${id}&title=${encodeURIComponent(title)}&category=${category || ''}&count=${tomatoCount}&totalTime=${tomatoTotalTime}`
    });
  }
}) 