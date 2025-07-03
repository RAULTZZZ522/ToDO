Page({
  data: {
    aims: [],
    categories: ['学习', '工作', '健身', '爱好','生活'],
    showAddModal: false,
    newAim: {
      title: '',
      description: '',
      category: '学习',
      totalTime: 60,
      deadline: '',
      relatedTodos: []
    },
    todos: [], // 用户的所有日程，用于选择关联日程
    selectedTodoIds: [] // 选中的日程IDs
  },

  onLoad: function() {
    this.getAimList();
    this.getTodoList();
  },

  onShow: function() {
    this.getAimList();
    this.getTodoList(); // 确保每次显示页面时也更新todo列表
  },

  // 获取目标列表
  getAimList: function() {
    wx.showLoading({
      title: '加载中',
    });
    
    console.log('正在调用云函数 getAims...');
    
    wx.cloud.callFunction({
      name: 'todoModel',
      data: {
        type: 'getAims'
      }
    }).then(res => {
      console.log('云函数 getAims 返回结果:', res);
      
      if (res.result && res.result.code === 0) {
        // 格式化日期并计算剩余天数
        const aims = res.result.data.map(aim => {
          // 处理deadline显示
          if (aim.deadline) {
            const deadline = new Date(aim.deadline);
            aim.formattedDeadline = `${deadline.getFullYear()}-${String(deadline.getMonth() + 1).padStart(2, '0')}-${String(deadline.getDate()).padStart(2, '0')}`;
            
            // 计算剩余天数
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const diffTime = deadline - today;
            aim.daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          } else {
            aim.formattedDeadline = '无截止日期';
            aim.daysLeft = null;
          }
          
          return aim;
        });
        
        this.setData({
          aims: aims
        });
      } else {
        console.error('获取目标失败，错误信息:', res.result);
        wx.showToast({
          title: '获取目标失败',
          icon: 'none'
        });
      }
      wx.hideLoading();
    }).catch(err => {
      console.error('获取目标失败，详细错误:', err);
      wx.hideLoading();
      wx.showToast({
        title: '获取目标失败',
        icon: 'none'
      });
    });
  },
  
  // 获取日程列表（用于关联）
  getTodoList: function() {
    console.log('正在调用云函数 getTodos...');
    
    wx.cloud.callFunction({
      name: 'todoModel',
      data: {
        type: 'getTodos'
      }
    }).then(res => {
      console.log('云函数 getTodos 返回结果:', res);
      
      if (res.result && res.result.code === 0) {
        const todos = res.result.data || [];
        console.log('获取到的日程列表:', todos);
        
        this.setData({
          todos: todos
        });
      } else {
        console.error('获取日程失败，错误信息:', res.result);
      }
    }).catch(err => {
      console.error('获取日程失败，详细错误:', err);
    });
  },
  
  // 显示添加目标模态框
  showAddModal: function() {
    // 刷新日程列表，确保有最新数据
    this.getTodoList();
    
    this.setData({
      showAddModal: true,
      newAim: {
        title: '',
        description: '',
        category: '学习',
        totalTime: 60,
        deadline: '',
        relatedTodos: []
      },
      selectedTodoIds: []
    });
  },
  
  // 隐藏添加目标模态框
  hideAddModal: function() {
    this.setData({
      showAddModal: false
    });
  },
  
  // 表单输入处理
  onInputChange: function(e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    
    this.setData({
      [`newAim.${field}`]: value
    });
  },
  
  // 处理日期选择
  onDateChange: function(e) {
    this.setData({
      'newAim.deadline': e.detail.value
    });
  },
  
  // 处理类别选择
  onCategoryChange: function(e) {
    this.setData({
      'newAim.category': this.data.categories[e.detail.value]
    });
  },
  
  // 处理相关日程选择
  onTodoCheckboxChange: function(e) {
    console.log('checkbox change 事件触发，value:', e.detail.value);
    
    const selectedTodoIds = e.detail.value;
    
    this.setData({
      selectedTodoIds: selectedTodoIds,
      'newAim.relatedTodos': selectedTodoIds
    });
    
    console.log('选中的日程IDs:', selectedTodoIds);
    console.log('更新后的 newAim:', this.data.newAim);
  },
  
  // 添加新目标
  addAim: function() {
    const { title, description, category, totalTime, deadline, relatedTodos } = this.data.newAim;
    
    if (!title) {
      wx.showToast({
        title: '请输入目标标题',
        icon: 'none'
      });
      return;
    }
    
    wx.showLoading({
      title: '添加中',
    });
    
    const params = {
      type: 'addAim',
      title,
      description,
      category,
      totalTime: Number(totalTime),
      relatedTodos,
      deadline: deadline || null
    };
    
    console.log('正在调用云函数 addAim，参数:', params);
    
    wx.cloud.callFunction({
      name: 'todoModel',
      data: params
    }).then(res => {
      wx.hideLoading();
      console.log('云函数 addAim 返回结果:', res);
      
      if (res.result && res.result.code === 0) {
        wx.showToast({
          title: '添加成功',
        });
        this.hideAddModal();
        this.getAimList();
      } else {
        wx.showToast({
          title: res.result?.msg || '添加失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      wx.hideLoading();
      console.error('添加目标失败，详细错误:', err);
      wx.showToast({
        title: '添加失败',
        icon: 'none'
      });
    });
  },
  
  // 更新目标进度
  updateProgress: function(e) {
    const { id, progress } = e.currentTarget.dataset;
    
    wx.showLoading({
      title: '更新中',
    });
    
    wx.cloud.callFunction({
      name: 'todoModel',
      data: {
        type: 'updateAim',
        id: id,
        progress: progress
      }
    }).then(res => {
      wx.hideLoading();
      if (res.result && res.result.code === 0) {
        wx.showToast({
          title: '更新成功',
        });
        this.getAimList();
      } else {
        wx.showToast({
          title: '更新失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      wx.hideLoading();
      console.error('更新目标失败:', err);
      wx.showToast({
        title: '更新失败',
        icon: 'none'
      });
    });
  },
  
  // 删除目标
  deleteAim: function(e) {
    const { id } = e.currentTarget.dataset;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个目标吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '删除中',
          });
          
          wx.cloud.callFunction({
            name: 'todoModel',
            data: {
              type: 'deleteAim',
              id: id
            }
          }).then(res => {
            wx.hideLoading();
            if (res.result && res.result.code === 0) {
              wx.showToast({
                title: '删除成功',
              });
              this.getAimList();
            } else {
              wx.showToast({
                title: '删除失败',
                icon: 'none'
              });
            }
          }).catch(err => {
            wx.hideLoading();
            console.error('删除目标失败:', err);
            wx.showToast({
              title: '删除失败',
              icon: 'none'
            });
          });
        }
      }
    });
  },
  
  // 手动调整进度
  adjustProgress: function(e) {
    const { id } = e.currentTarget.dataset;
    const aim = this.data.aims.find(a => a._id === id);
    
    if (!aim) return;
    
    wx.showActionSheet({
      itemList: ['0%', '25%', '50%', '75%', '100%'],
      success: (res) => {
        const progressValues = [0, 25, 50, 75, 100];
        const newProgress = progressValues[res.tapIndex];
        
        wx.cloud.callFunction({
          name: 'todoModel',
          data: {
            type: 'updateAim',
            id: id,
            progress: newProgress
          }
        }).then(() => {
          this.getAimList();
        });
      }
    });
  }
}) 