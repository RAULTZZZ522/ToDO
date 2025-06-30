Page({
  data: {
    todos: [],
    sortBy: 'updateTime', // Sorting option: 'updateTime' or 'importance'
    sortAsc: false, // Sort direction: false = descending (newest/most important first)
    showAddModal: false, // Control the visibility of add todo modal
    newTodo: {
      title: '',
      description: '',
      importance: 3 // Default importance level
    },
    loading: false
  },

  onLoad: function() {
    this.loadTodos();
  },

  onShow: function() {
    this.loadTodos(); // Refresh todos when page shows
  },

  // Load todos from cloud database
  loadTodos: function() {
    this.setData({ loading: true });
    wx.showLoading({
      title: '加载中',
    });
    
    console.log('Calling getTodos cloud function');
    wx.cloud.callFunction({
      name: 'todoModel',
      data: {
        type: 'getTodos'
      }
    }).then(res => {
      console.log('getTodos response:', res);
      const result = res.result;
      if (result.code === 0) {
        this.setData({
          todos: result.data
        });
        this.sortTodos();
      } else {
        wx.showToast({
          title: result.msg || '加载失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      console.error('getTodos error:', err);
      wx.showToast({
        title: '网络错误: ' + (err.errMsg || err.message || JSON.stringify(err)),
        icon: 'none',
        duration: 3000
      });
    }).finally(() => {
      this.setData({ loading: false });
      wx.hideLoading();
    });
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
        importance: 3
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
    const { title, description, importance } = this.data.newTodo;
    
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
      importance: importance
    });

    wx.cloud.callFunction({
      name: 'todoModel',
      data: {
        type: 'addTodo',
        title: title.trim(),
        description: description.trim(),
        importance: importance
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
  }
}) 