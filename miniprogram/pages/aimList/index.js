Page({
  data: {
    aims: [],
    categories: ['学习', '工作', '健身', '爱好', '生活'],
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
    selectedTodoIds: [], // 选中的日程IDs
    showTodoSelectModal: false,
    currentAimId: null
  },

  onLoad: function () {
    this.getAimList();
    this.getTodoList().catch(err => {
      console.error('加载日程失败:', err);
    });
  },

  onShow: function () {
    this.getAimList();
    this.getTodoList().catch(err => {
      console.error('刷新日程失败:', err);
    }); // 确保每次显示页面时也更新todo列表
  },

  // 获取目标列表
  getAimList: function () {
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
  getTodoList: function () {
    console.log('正在调用云函数 getTodos...');

    return new Promise((resolve, reject) => {
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
          }, () => {
            resolve(todos);
          });
        } else {
          console.error('获取日程失败，错误信息:', res.result);
          reject(res.result);
        }
      }).catch(err => {
        console.error('获取日程失败，详细错误:', err);
        reject(err);
      });
    });
  },

  // 显示添加目标模态框
  showAddModal: function () {
    // 先立即清空选中状态，避免旧数据残留
    this.setData({
      selectedTodoIds: []
    });

    // 刷新日程列表，确保有最新数据
    this.getTodoList().then(() => {
      this.setData({
        showAddModal: true,
        newAim: {
          title: '',
          description: '',
          category: '学习',
          totalTime: 60,
          deadline: '',
          relatedTodos: []
        }
      });
    }).catch(err => {
      console.error('获取日程列表失败:', err);
      wx.showToast({
        title: '获取日程列表失败',
        icon: 'none'
      });
    });
  },

  // 隐藏添加目标模态框
  hideAddModal: function () {
    this.setData({
      showAddModal: false,
      selectedTodoIds: []
    });
  },

  // 表单输入处理
  onInputChange: function (e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;

    this.setData({
      [`newAim.${field}`]: value
    });
  },

  // 处理日期选择
  onDateChange: function (e) {
    this.setData({
      'newAim.deadline': e.detail.value
    });
  },

  // 处理类别选择
  onCategoryChange: function (e) {
    this.setData({
      'newAim.category': this.data.categories[e.detail.value]
    });
  },

  // 处理相关日程选择
  onTodoCheckboxChange: function (e) {
    console.log('checkbox change 事件触发，value:', e.detail.value);

    // 利用 Set 去重，防止出现重复 ID
    const selectedTodoIds = [...new Set(e.detail.value)];

    // 根据当前显示的模态框类型，更新不同的数据
    if (this.data.showAddModal) {
      // 添加目标模态框中的选择
      this.setData({
        selectedTodoIds: selectedTodoIds,
        'newAim.relatedTodos': selectedTodoIds
      });
      console.log('添加目标时选中的日程IDs:', selectedTodoIds);
      console.log('更新后的 newAim:', this.data.newAim);
    } else if (this.data.showTodoSelectModal) {
      // 关联日程模态框中的选择
      this.setData({
        selectedTodoIds: selectedTodoIds
      });
      console.log('关联日程时选中的日程IDs:', selectedTodoIds);
    }
  },

  // 添加新目标
  addAim: function () {
    const { title, description, category, totalTime, deadline, relatedTodos } = this.data.newAim;
    const uniqueRelated = Array.isArray(relatedTodos) ? [...new Set(relatedTodos)] : [];

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
      relatedTodos: uniqueRelated,
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
  updateProgress: function (e) {
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
  deleteAim: function (e) {
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
  adjustProgress: function (e) {
    const { id } = e.currentTarget.dataset;
    const aim = this.data.aims.find(a => a._id === id);

    if (!aim) return;

    wx.showActionSheet({
      itemList: ['0%', '25%', '50%', '75%', '100%', '根据番茄钟自动计算'],
      success: (res) => {
        if (res.tapIndex === 5) {
          // 自动计算进度
          this.refreshAimProgress(id);
        } else {
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
      }
    });
  },

  // 更新目标关联的日程
  updateAimRelatedTodos: function (e) {
    const { id } = e.currentTarget.dataset;
    console.log('打开关联日程模态框，目标ID:', id);

    const localAim = (this.data.aims || []).find(a => a._id === id);

    if (localAim) {
      // 规范化 relatedTodos，确保为数组
      let relatedTodos = [];
      if (Array.isArray(localAim.relatedTodos)) {
        relatedTodos = localAim.relatedTodos;
      } else if (typeof localAim.relatedTodos === 'string') {
        try {
          const parsed = JSON.parse(localAim.relatedTodos);
          relatedTodos = Array.isArray(parsed) ? parsed : [localAim.relatedTodos];
        } catch (err) {
          relatedTodos = [localAim.relatedTodos];
        }
      }

      console.log('使用本地aim数据打开关联日程, relatedTodos:', relatedTodos);

      this.setData({
        selectedTodoIds: relatedTodos,
        currentAimId: id,
        showTodoSelectModal: true
      });
      return;
    }

    // 本地没有，退回云端查询，确保兼容旧数据
    wx.showLoading({
      title: '加载中',
    });

    wx.cloud.callFunction({
      name: 'todoModel',
      data: {
        type: 'getAims'
      }
    }).then(res => {
      if (res.result && res.result.code === 0) {
        const aim = res.result.data.find(a => a._id === id);

        if (!aim) {
          wx.hideLoading();
          console.error('未找到目标:', id);
          wx.showToast({
            title: '未找到目标',
            icon: 'none'
          });
          return;
        }

        console.log('目标详情:', aim);
        console.log('目标原有关联的日程IDs:', aim.relatedTodos || []);

        // 获取所有日程，确保数据是最新的
        this.getTodoList().then(todos => {
          wx.hideLoading();

          console.log('获取到的所有日程:', todos);

          // 确保relatedTodos是数组
          let relatedTodos = [];
          if (aim.relatedTodos) {
            if (Array.isArray(aim.relatedTodos)) {
              relatedTodos = aim.relatedTodos;
            } else if (typeof aim.relatedTodos === 'string') {
              try {
                const parsed = JSON.parse(aim.relatedTodos);
                relatedTodos = Array.isArray(parsed) ? parsed : [aim.relatedTodos];
              } catch (e) {
                console.error('解析relatedTodos失败:', e);
                relatedTodos = [aim.relatedTodos]; // 当作单个ID处理
              }
            }
          }

          console.log('处理后的关联日程IDs:', relatedTodos);

          // 直接设置 showTodoSelectModal 和 selectedTodoIds，避免延迟和闪烁
          this.setData({
            selectedTodoIds: relatedTodos,
            currentAimId: id,
            showTodoSelectModal: true
          }, () => {
            console.log('设置完成，当前选中的日程IDs:', this.data.selectedTodoIds);
          });
        }).catch(err => {
          wx.hideLoading();
          console.error('获取日程列表失败:', err);
          wx.showToast({
            title: '获取日程列表失败',
            icon: 'none'
          });
        });
      } else {
        wx.hideLoading();
        console.error('获取目标失败:', res.result);
        wx.showToast({
          title: '获取目标失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      wx.hideLoading();
      console.error('获取目标信息失败:', err);
      wx.showToast({
        title: '获取目标失败',
        icon: 'none'
      });
    });
  },

  // 处理日程项点击事件
  toggleTodoItem: function (e) {
    const id = e.currentTarget.dataset.id;
    console.log('点击了日程项，ID:', id);

    // 获取当前选中的IDs
    let selectedTodoIds = [...this.data.selectedTodoIds];

    // 切换选中状态
    if (selectedTodoIds.includes(id)) {
      // 如果已经选中，则移除
      selectedTodoIds = selectedTodoIds.filter(item => item !== id);
      console.log('移除ID:', id);
    } else {
      // 如果未选中，则添加
      selectedTodoIds.push(id);
      console.log('添加ID:', id);
    }

    console.log('更新后的selectedTodoIds:', selectedTodoIds);

    // 更新选中状态
    this.setData({
      selectedTodoIds: selectedTodoIds
    }, () => {
      // 在回调函数中确认数据已更新
      console.log('setData回调中的selectedTodoIds:', this.data.selectedTodoIds);
    });
  },

  // 隐藏日程选择模态框
  hideTodoSelectModal: function () {
    console.log('关闭关联日程模态框');
    this.setData({
      showTodoSelectModal: false,
      currentAimId: null,
      selectedTodoIds: []
    });
  },

  // 关联日程功能处理函数
  toggleTodo: function (e) {
    const id = e.currentTarget.dataset.id;
    console.log('关联日程模态框中点击了复选框，ID:', id);

    // 获取当前选中的IDs，确保它是一个数组
    let selectedTodoIds = Array.isArray(this.data.selectedTodoIds) ? [...this.data.selectedTodoIds] : [];

    console.log('当前选中的IDs:', selectedTodoIds);

    // 切换选中状态
    const index = selectedTodoIds.findIndex(item => item === id);
    if (index > -1) {
      // 如果已经选中，则移除
      selectedTodoIds.splice(index, 1);
      console.log('移除ID:', id);
    } else {
      // 如果未选中，则添加
      selectedTodoIds.push(id);
      console.log('添加ID:', id);
    }

    console.log('更新后的selectedTodoIds:', selectedTodoIds);

    // 更新选中状态
    this.setData({
      selectedTodoIds: selectedTodoIds
    }, () => {
      console.log('setData回调中的selectedTodoIds:', this.data.selectedTodoIds);
    });
  },

  // 添加目标模态框中的复选框点击事件
  toggleAddTodo: function (e) {
    const id = e.currentTarget.dataset.id;
    console.log('添加目标模态框中点击了复选框，ID:', id);

    // 获取当前选中的IDs，确保它是一个数组
    let selectedTodoIds = Array.isArray(this.data.selectedTodoIds) ? [...this.data.selectedTodoIds] : [];

    // 切换选中状态
    const index = selectedTodoIds.findIndex(item => item === id);
    if (index > -1) {
      // 如果已经选中，则移除
      selectedTodoIds.splice(index, 1);
      console.log('移除ID:', id);
    } else {
      // 如果未选中，则添加
      selectedTodoIds.push(id);
      console.log('添加ID:', id);
    }

    console.log('更新后的selectedTodoIds:', selectedTodoIds);

    // 更新选中状态以及newAim中的relatedTodos
    this.setData({
      selectedTodoIds: selectedTodoIds,
      'newAim.relatedTodos': selectedTodoIds
    }, () => {
      console.log('setData回调中的selectedTodoIds:', this.data.selectedTodoIds);
      console.log('setData回调中的newAim.relatedTodos:', this.data.newAim.relatedTodos);
    });
  },

  // 确认更新关联日程
  confirmUpdateRelatedTodos: function () {
    const { currentAimId } = this.data;
    // 去重
    const selectedTodoIds = [...new Set(this.data.selectedTodoIds)];

    console.log('确认关联日程，当前目标ID:', currentAimId);
    console.log('选中的日程IDs:', selectedTodoIds);

    if (!currentAimId) {
      console.error('未找到当前目标ID');
      this.hideTodoSelectModal();
      return;
    }

    // 获取处理后的todoIds，确保它是数组
    const validTodoIds = Array.isArray(selectedTodoIds) ? selectedTodoIds : [];
    console.log('处理后的todoIds:', validTodoIds);

    // 显示确认对话框
    wx.showModal({
      title: '确认关联',
      content: `确定要关联 ${validTodoIds.length} 个日程到目标吗？`,
      success: (res) => {
        if (res.confirm) {
          // 用户点击确定
          wx.showLoading({
            title: '关联中',
          });

          // 使用更可靠的方法更新关联
          wx.cloud.callFunction({
            name: 'todoModel',
            data: {
              type: 'linkTodosToAim',
              aimId: currentAimId,
              todoIds: validTodoIds
            }
          }).then(res => {
            wx.hideLoading();
            console.log('关联日程云函数返回结果:', res);

            if (res.result && res.result.code === 0) {
              wx.showToast({
                title: '关联成功',
                icon: 'success',
                duration: 2000
              });

              // 关闭模态框
              this.hideTodoSelectModal();

              // 刷新目标列表
              this.getAimList();

              // 如果有关联日程，尝试刷新进度
              if (validTodoIds.length > 0) {
                // 给一定延迟确保数据库已更新
                setTimeout(() => {
                  console.log('开始刷新目标进度');
                  this.refreshAimProgress(currentAimId);
                }, 1000);
              }
            } else {
              wx.showToast({
                title: res.result?.msg || '关联失败',
                icon: 'none',
                duration: 2000
              });
            }
          }).catch(err => {
            wx.hideLoading();
            console.error('关联日程失败:', err);
            wx.showToast({
              title: '关联失败',
              icon: 'none',
              duration: 2000
            });
          });
        } else {
          // 用户点击取消
          console.log('用户取消关联日程');
        }
      }
    });
  },

  // 刷新目标进度（根据番茄钟记录自动计算）
  refreshAimProgress: function (e) {
    // 支持事件对象或直接传入ID
    const aimId = e.currentTarget ? e.currentTarget.dataset.id : e;
    console.log('开始刷新目标进度，aimId:', aimId);

    wx.showLoading({
      title: '计算进度中',
    });

    wx.cloud.callFunction({
      name: 'todoModel',
      data: {
        type: 'updateAimProgress',
        aimId: aimId
      }
    }).then(progressRes => {
      wx.hideLoading();
      console.log('刷新进度云函数返回结果:', progressRes);

      if (progressRes.result && progressRes.result.code === 0) {
        wx.showToast({
          title: '进度已更新',
          icon: 'success',
          duration: 2000
        });

        // 刷新目标列表
        this.getAimList();
      } else {
        console.error('更新进度失败，错误信息:', progressRes.result);
        wx.showToast({
          title: progressRes.result?.msg || '更新进度失败',
          icon: 'none',
          duration: 2000
        });
      }
    }).catch(err => {
      wx.hideLoading();
      console.error('更新目标进度失败，详细错误:', err);
      wx.showToast({
        title: '更新进度失败',
        icon: 'none',
        duration: 2000
      });
    });
  },

  // 处理复选框点击事件
  onCheckboxItemTap: function (e) {
    const id = e.currentTarget.dataset.id;
    console.log('点击了复选框项，ID:', id);

    // 获取当前选中的IDs
    let selectedTodoIds = [...this.data.selectedTodoIds];

    // 切换选中状态
    if (selectedTodoIds.includes(id)) {
      // 如果已经选中，则移除
      selectedTodoIds = selectedTodoIds.filter(item => item !== id);
    } else {
      // 如果未选中，则添加
      selectedTodoIds.push(id);
    }

    // 根据当前显示的模态框类型，更新不同的数据
    if (this.data.showAddModal) {
      // 添加目标模态框中的选择
      this.setData({
        selectedTodoIds: selectedTodoIds,
        'newAim.relatedTodos': selectedTodoIds
      });
      console.log('添加目标时选中的日程IDs:', selectedTodoIds);
    } else if (this.data.showTodoSelectModal) {
      // 关联日程模态框中的选择
      this.setData({
        selectedTodoIds: selectedTodoIds
      });
      console.log('关联日程时选中的日程IDs:', selectedTodoIds);
    }
  },

  // 处理关联日程模态框中的复选框变化事件
  handleTodoCheckboxChange: function (e) {
    const selectedIds = e.detail.value;
    console.log('关联日程复选框变化，选中的IDs:', selectedIds);

    this.setData({
      selectedTodoIds: selectedIds
    }, () => {
      console.log('更新后的selectedTodoIds:', this.data.selectedTodoIds);
    });
  },

  // 处理添加目标模态框中的复选框变化事件
  handleAddTodoCheckboxChange: function (e) {
    const selectedIds = e.detail.value;
    console.log('添加目标复选框变化，选中的IDs:', selectedIds);

    this.setData({
      selectedTodoIds: selectedIds,
      'newAim.relatedTodos': selectedIds
    }, () => {
      console.log('更新后的selectedTodoIds:', this.data.selectedTodoIds);
      console.log('更新后的newAim.relatedTodos:', this.data.newAim.relatedTodos);
    });
  },

  // 检查目标的关联日程
  checkAimRelatedTodos: function (aimId) {
    console.log('检查目标关联日程，aimId:', aimId);

    wx.showLoading({
      title: '检查中',
    });

    // 先获取目标信息
    wx.cloud.callFunction({
      name: 'todoModel',
      data: {
        type: 'getAims'
      }
    }).then(res => {
      if (res.result && res.result.code === 0) {
        const aim = res.result.data.find(a => a._id === aimId);

        if (aim) {
          console.log('目标信息:', aim);
          console.log('关联日程IDs:', aim.relatedTodos || []);

          // 如果有关联日程，检查这些日程
          if (aim.relatedTodos && aim.relatedTodos.length > 0) {
            // 获取所有日程
            this.getTodoList().then(todos => {
              console.log('所有日程:', todos);

              // 找出关联的日程
              const relatedTodos = todos.filter(todo => aim.relatedTodos.includes(todo._id));
              console.log('关联的日程:', relatedTodos);

              wx.hideLoading();
              wx.showModal({
                title: '关联日程检查结果',
                content: `目标"${aim.title}"关联了${relatedTodos.length}个日程。\n关联ID: ${aim.relatedTodos.join(', ')}`,
                showCancel: false
              });
            });
          } else {
            wx.hideLoading();
            wx.showModal({
              title: '关联日程检查结果',
              content: `目标"${aim.title}"没有关联任何日程。`,
              showCancel: false
            });
          }
        } else {
          wx.hideLoading();
          wx.showToast({
            title: '未找到目标',
            icon: 'none'
          });
        }
      } else {
        wx.hideLoading();
        wx.showToast({
          title: '获取目标失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      wx.hideLoading();
      console.error('检查关联日程失败:', err);
      wx.showToast({
        title: '检查失败',
        icon: 'none'
      });
    });
  },

  // 检查番茄钟记录
  checkTomatoRecords: function (aimId) {
    console.log('检查番茄钟记录，aimId:', aimId);

    wx.showLoading({
      title: '检查中',
    });

    // 先获取目标信息
    wx.cloud.callFunction({
      name: 'todoModel',
      data: {
        type: 'getAims'
      }
    }).then(res => {
      if (res.result && res.result.code === 0) {
        const aim = res.result.data.find(a => a._id === aimId);

        if (aim) {
          console.log('目标信息:', aim);
          console.log('关联日程IDs:', aim.relatedTodos || []);

          // 如果有关联日程，检查这些日程的番茄钟记录
          if (aim.relatedTodos && aim.relatedTodos.length > 0) {
            // 获取所有关联日程的番茄钟记录
            const todoId = aim.relatedTodos[0]; // 先检查第一个关联日程

            wx.cloud.callFunction({
              name: 'todoModel',
              data: {
                type: 'getTomatoRecords',
                todoId: todoId
              }
            }).then(recordRes => {
              wx.hideLoading();

              if (recordRes.result && recordRes.result.code === 0) {
                const records = recordRes.result.data;
                console.log(`日程 ${todoId} 的番茄钟记录:`, records);

                if (records.length > 0) {
                  let totalMinutes = 0;
                  records.forEach(record => {
                    totalMinutes += record.duration || 0;
                  });

                  wx.showModal({
                    title: '番茄钟记录检查结果',
                    content: `找到 ${records.length} 条番茄钟记录，总时长 ${totalMinutes} 分钟。`,
                    showCancel: false
                  });
                } else {
                  wx.showModal({
                    title: '番茄钟记录检查结果',
                    content: `未找到该日程的番茄钟记录。`,
                    showCancel: false
                  });
                }
              } else {
                wx.showToast({
                  title: '获取番茄钟记录失败',
                  icon: 'none'
                });
              }
            }).catch(err => {
              wx.hideLoading();
              console.error('获取番茄钟记录失败:', err);
              wx.showToast({
                title: '获取记录失败',
                icon: 'none'
              });
            });
          } else {
            wx.hideLoading();
            wx.showModal({
              title: '番茄钟记录检查结果',
              content: `目标"${aim.title}"没有关联任何日程，无法检查番茄钟记录。`,
              showCancel: false
            });
          }
        } else {
          wx.hideLoading();
          wx.showToast({
            title: '未找到目标',
            icon: 'none'
          });
        }
      } else {
        wx.hideLoading();
        wx.showToast({
          title: '获取目标失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      wx.hideLoading();
      console.error('检查番茄钟记录失败:', err);
      wx.showToast({
        title: '检查失败',
        icon: 'none'
      });
    });
  },

  // 手动设置目标进度
  setAimProgress: function (aimId, progress) {
    console.log('手动设置目标进度，aimId:', aimId, 'progress:', progress);

    wx.showLoading({
      title: '设置进度中',
    });

    wx.cloud.callFunction({
      name: 'todoModel',
      data: {
        type: 'setAimProgress',
        aimId: aimId,
        progress: progress
      }
    }).then(res => {
      wx.hideLoading();
      console.log('设置进度云函数返回结果:', res);

      if (res.result && res.result.code === 0) {
        wx.showToast({
          title: '进度已设置',
          icon: 'success',
          duration: 2000
        });

        // 刷新目标列表
        this.getAimList();
      } else {
        console.error('设置进度失败，错误信息:', res.result);
        wx.showToast({
          title: res.result?.msg || '设置进度失败',
          icon: 'none',
          duration: 2000
        });
      }
    }).catch(err => {
      wx.hideLoading();
      console.error('设置目标进度失败，详细错误:', err);
      wx.showToast({
        title: '设置进度失败',
        icon: 'none',
        duration: 2000
      });
    });
  },

  // 显示手动设置进度对话框
  showSetProgressDialog: function (e) {
    const { id } = e.currentTarget.dataset;
    const aim = this.data.aims.find(a => a._id === id);

    if (!aim) return;

    wx.showActionSheet({
      itemList: ['0%', '25%', '50%', '75%', '100%'],
      success: (res) => {
        const progressValues = [0, 25, 50, 75, 100];
        const progress = progressValues[res.tapIndex];

        this.setAimProgress(id, progress);
      }
    });
  },
}) 