<script setup>
import { ref, onMounted, computed, onUnmounted, watch } from 'vue'
import { getTodos, addTodo, updateTodo, deleteTodo } from '../services/cloudDbService'
import { startWatching, stopWatching } from '../services/realtimeService'

// 待办事项数据
const todos = ref([])
const isInitialized = ref(false)
const isRealtime = ref(false) // 是否开启实时更新

// 搜索和筛选
const searchKeyword = ref('')
const statusFilter = ref('all') // all, completed, uncompleted
const importanceFilter = ref(0) // 0: 所有, 1-3: 重要性级别
const searchField = ref('all') // 搜索字段：all, title, description, user
const userFilter = ref('all') // 用户筛选
const isLoading = ref(false)
const advancedSearch = ref(false) // 是否显示高级搜索

// 分页相关
const currentPage = ref(1)
const pageSize = ref(10)
const pageSizeOptions = [10, 20, 50, 100]

// 排序
const sortField = ref('createTime')
const sortOrder = ref('desc')

// 新增任务相关
const showAddForm = ref(false)
const newTodo = ref({
  title: '',
  description: '',
  importance: 1,
  completed: false,
  userNickname: '管理员'
})

// 添加任务
const handleAddTodo = () => {
  if (!newTodo.value.title.trim()) {
    alert('标题不能为空！');
    return;
  }

  isLoading.value = true;
  addTodo(newTodo.value)
    .then(res => {
      // 如果没有开启实时监听，则需要手动刷新数据
      if (!isRealtime.value) {
        fetchTodos();
      }
      showAddForm.value = false;
      // 重置表单
      newTodo.value = {
        title: '',
        description: '',
        importance: 1,
        completed: false,
        userNickname: '管理员'
      };
    })
    .catch(err => {
      console.error('添加任务失败:', err);
      alert('添加任务失败: ' + (err.message || '未知错误'));
    })
    .finally(() => {
      isLoading.value = false;
    });
};

// 获取所有用户列表（去重）
const uniqueUsers = computed(() => {
  const userSet = new Set();
  todos.value.forEach(todo => {
    if (todo.userNickname) {
      userSet.add(todo.userNickname);
    }
  });
  return ['all', ...Array.from(userSet)];
});

// 筛选后的任务列表
const filteredTodos = computed(() => {
  let result = todos.value

  // 关键词筛选
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase();

    if (searchField.value === 'all') {
      result = result.filter(todo =>
        todo.title?.toLowerCase().includes(keyword) ||
        todo.description?.toLowerCase().includes(keyword) ||
        todo.userNickname?.toLowerCase().includes(keyword)
      )
    } else if (searchField.value === 'title') {
      result = result.filter(todo => todo.title?.toLowerCase().includes(keyword))
    } else if (searchField.value === 'description') {
      result = result.filter(todo => todo.description?.toLowerCase().includes(keyword))
    } else if (searchField.value === 'user') {
      result = result.filter(todo => todo.userNickname?.toLowerCase().includes(keyword))
    }
  }

  // 状态筛选
  if (statusFilter.value !== 'all') {
    const isCompleted = statusFilter.value === 'completed'
    result = result.filter(todo => todo.completed === isCompleted)
  }

  // 重要性筛选
  if (importanceFilter.value > 0) {
    result = result.filter(todo => todo.importance === importanceFilter.value)
  }

  // 用户筛选
  if (userFilter.value !== 'all') {
    result = result.filter(todo => todo.userNickname === userFilter.value)
  }

  // 排序
  result = [...result].sort((a, b) => {
    let valA = a[sortField.value];
    let valB = b[sortField.value];

    // 处理日期类型
    if (sortField.value === 'createTime' || sortField.value === 'updateTime') {
      valA = valA ? new Date(valA).getTime() : 0;
      valB = valB ? new Date(valB).getTime() : 0;
    }

    if (sortOrder.value === 'asc') {
      return valA > valB ? 1 : -1;
    } else {
      return valA < valB ? 1 : -1;
    }
  });

  return result;
});

// 分页后的任务
const paginatedTodos = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize.value;
  return filteredTodos.value.slice(startIndex, startIndex + pageSize.value);
});

// 总页数
const totalPages = computed(() => {
  return Math.ceil(filteredTodos.value.length / pageSize.value);
});

// 分页页码数组
const pageNumbers = computed(() => {
  const pages = [];
  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage.value - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages.value, startPage + maxVisiblePages - 1);

  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return pages;
});

// 监听筛选变化，重置到第一页
watch([searchKeyword, statusFilter, importanceFilter, searchField, userFilter, pageSize, sortField, sortOrder], () => {
  currentPage.value = 1;
});

// 当前选中的任务
const currentTodo = ref(null)
const editMode = ref(false)
const editTodo = ref(null)

// 查看任务详情
const viewTodoDetail = (todo) => {
  currentTodo.value = { ...todo }
  editMode.value = false
}

// 编辑任务
const startEditTodo = () => {
  editTodo.value = { ...currentTodo.value }
  editMode.value = true
}

// 保存编辑的任务
const saveTodoChanges = () => {
  if (!editTodo.value.title.trim()) {
    alert('标题不能为空！');
    return;
  }

  isLoading.value = true;
  updateTodo(editTodo.value._id, editTodo.value)
    .then(res => {
      // 如果没有开启实时监听，则需要手动更新本地数据
      if (!isRealtime.value) {
        // 更新本地数据
        const index = todos.value.findIndex(t => t._id === editTodo.value._id);
        if (index !== -1) {
          todos.value[index] = { ...editTodo.value, updateTime: new Date().toString() };
        }
      }
      currentTodo.value = { ...editTodo.value, updateTime: new Date().toString() };
      editMode.value = false;
    })
    .catch(err => {
      console.error('更新任务失败:', err);
      alert('更新任务失败: ' + (err.message || '未知错误'));
    })
    .finally(() => {
      isLoading.value = false;
    });
};

// 删除任务
const handleDeleteTodo = (todoId) => {
  if (!confirm('确定要删除这个任务吗？')) {
    return;
  }

  isLoading.value = true;
  deleteTodo(todoId)
    .then(() => {
      // 如果没有开启实时监听，则需要手动更新本地数据
      if (!isRealtime.value) {
        todos.value = todos.value.filter(t => t._id !== todoId);
      }
      if (currentTodo.value && currentTodo.value._id === todoId) {
        currentTodo.value = null;
      }
    })
    .catch(err => {
      console.error('删除任务失败:', err);
      alert('删除任务失败: ' + (err.message || '未知错误'));
    })
    .finally(() => {
      isLoading.value = false;
    });
};

// 重要性映射
const importanceText = {
  1: '低',
  2: '中',
  3: '高'
}

// 重要性对应的颜色
const importanceColor = {
  1: 'var(--text-light)',
  2: 'var(--warning-color)',
  3: 'var(--danger-color)'
}

// 切换高级搜索
const toggleAdvancedSearch = () => {
  advancedSearch.value = !advancedSearch.value;
}

// 搜索任务
const searchTodos = () => {
  // 如果开启了实时监听，筛选已经通过computed实现
  // 如果没有开启实时监听，则需要从服务器重新获取数据
  if (!isRealtime.value) {
    fetchTodos();
  }
}

// 清空筛选
const clearFilters = () => {
  searchKeyword.value = ''
  statusFilter.value = 'all'
  importanceFilter.value = 0
  searchField.value = 'all'
  userFilter.value = 'all'
  sortField.value = 'createTime'
  sortOrder.value = 'desc'
  searchTodos()
}

// 分页导航
const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '未知时间';

  try {
    const date = new Date(dateString)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  } catch (error) {
    return dateString;
  }
}

// 修改任务状态
const toggleTaskStatus = (todo) => {
  const newStatus = !todo.completed;

  isLoading.value = true;
  updateTodo(todo._id, { completed: newStatus })
    .then(() => {
      // 如果没有开启实时监听，则需要手动更新本地数据
      if (!isRealtime.value) {
        todo.completed = newStatus;
        todo.updateTime = new Date().toString();
      }
    })
    .catch(err => {
      console.error('更新任务状态失败:', err);
      alert('更新任务状态失败: ' + (err.message || '未知错误'));
    })
    .finally(() => {
      isLoading.value = false;
    });
}

// 从云数据库获取任务
const fetchTodos = () => {
  isLoading.value = true;
  getTodos()
    .then(data => {
      todos.value = data || [];
      isInitialized.value = true;
    })
    .catch(err => {
      console.error('获取待办事项失败:', err);
      alert('获取待办事项失败: ' + (err.message || '未知错误'));
      isInitialized.value = true;
    })
    .finally(() => {
      isLoading.value = false;
    });
};

// 处理实时数据变化
const handleRealtimeChange = (snapshot) => {
  if (!snapshot || !snapshot.docChanges) {
    return;
  }

  const changes = snapshot.docChanges;

  // 处理每个变更
  changes.forEach(change => {
    const doc = change.doc;
    const id = doc._id;

    if (change.dataType === 'add') {
      // 新增数据
      // 检查是否已存在（避免重复添加）
      const exists = todos.value.some(item => item._id === id);
      if (!exists) {
        todos.value.push(doc);
      }
    } else if (change.dataType === 'update') {
      // 更新数据
      const index = todos.value.findIndex(item => item._id === id);
      if (index > -1) {
        todos.value[index] = doc;

        // 如果正在查看的是被更新的任务，同步更新
        if (currentTodo.value && currentTodo.value._id === id) {
          currentTodo.value = { ...doc };
        }
      }
    } else if (change.dataType === 'remove') {
      // 删除数据
      todos.value = todos.value.filter(item => item._id !== id);

      // 如果正在查看的是被删除的任务，关闭详情面板
      if (currentTodo.value && currentTodo.value._id === id) {
        currentTodo.value = null;
      }
    }
  });
};

// 切换实时监听状态
const toggleRealtime = async () => {
  isRealtime.value = !isRealtime.value;

  if (isRealtime.value) {
    // 开启实时监听
    try {
      await startWatching('todos', handleRealtimeChange);
      console.log('已开启实时数据监听');
    } catch (error) {
      console.error('开启实时监听失败:', error);
      alert('开启实时监听失败: ' + (error.message || '未知错误'));
      isRealtime.value = false;
    }
  } else {
    // 关闭实时监听
    try {
      await stopWatching('todos');
      console.log('已关闭实时数据监听');
    } catch (error) {
      console.error('关闭实时监听失败:', error);
    }
  }
};

// 刷新数据
const refreshTodos = () => {
  fetchTodos();
}

// 初始化数据
onMounted(() => {
  fetchTodos();
  // 默认自动开启实时监听
  toggleRealtime();
})

// 组件卸载时清理监听器
onUnmounted(() => {
  if (isRealtime.value) {
    stopWatching('todos').catch(console.error);
  }
})

// 获取随机颜色（但为特定用户保持一致）
const getRandomColor = (username) => {
  // 为用户名生成一个哈希值
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }

  // 转换为颜色
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).substr(-2);
  }

  return color;
}
</script>

<template>
  <div class="todo-management">
    <div class="page-header">
      <h1>任务管理</h1>
      <div class="header-actions">
        <button class="realtime-btn" :class="{ active: isRealtime }" @click="toggleRealtime" :disabled="isLoading">
          {{ isRealtime ? '实时监听已开启' : '实时监听已关闭' }}
        </button>
        <button class="refresh-btn" @click="refreshTodos" :disabled="isLoading">
          {{ isLoading ? '加载中...' : '刷新' }}
        </button>
      </div>
    </div>

    <div class="content-panel">
      <div class="search-panel">
        <div class="search-form">
          <div class="search-box">
            <input type="text" v-model="searchKeyword" @keyup.enter="searchTodos" placeholder="搜索任务..." />
            <button class="search-btn" @click="searchTodos" :disabled="isLoading">
              <span v-if="!isLoading">搜索</span>
              <span v-else>搜索中...</span>
            </button>
            <button class="advanced-search-btn" @click="toggleAdvancedSearch">
              {{ advancedSearch ? '收起' : '高级搜索' }}
            </button>
          </div>

          <div v-if="advancedSearch" class="advanced-search-panel">
            <div class="filter-row">
              <div class="filter-group">
                <label>搜索字段:</label>
                <select v-model="searchField">
                  <option value="all">全部字段</option>
                  <option value="title">仅标题</option>
                  <option value="description">仅描述</option>
                  <option value="user">仅用户</option>
                </select>
              </div>

              <div class="filter-group">
                <label>状态:</label>
                <select v-model="statusFilter">
                  <option value="all">全部</option>
                  <option value="completed">已完成</option>
                  <option value="uncompleted">未完成</option>
                </select>
              </div>

              <div class="filter-group">
                <label>重要性:</label>
                <select v-model="importanceFilter">
                  <option :value="0">全部</option>
                  <option :value="1">低</option>
                  <option :value="2">中</option>
                  <option :value="3">高</option>
                </select>
              </div>

              <div class="filter-group">
                <label>用户:</label>
                <select v-model="userFilter">
                  <option value="all">全部用户</option>
                  <option v-for="user in uniqueUsers.filter(u => u !== 'all')" :key="user" :value="user">
                    {{ user }}
                  </option>
                </select>
              </div>
            </div>

            <div class="filter-row">
              <div class="filter-group">
                <label>排序字段:</label>
                <select v-model="sortField">
                  <option value="title">标题</option>
                  <option value="importance">重要性</option>
                  <option value="createTime">创建时间</option>
                  <option value="updateTime">更新时间</option>
                </select>
              </div>

              <div class="filter-group">
                <label>排序方式:</label>
                <select v-model="sortOrder">
                  <option value="asc">升序</option>
                  <option value="desc">降序</option>
                </select>
              </div>

              <div class="filter-group">
                <label>每页显示:</label>
                <select v-model="pageSize">
                  <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }}</option>
                </select>
              </div>
            </div>

            <div class="filter-actions">
              <button class="clear-btn" @click="clearFilters">重置筛选</button>
              <button class="add-btn" @click="showAddForm = true">新增任务</button>
            </div>
          </div>

          <div v-else class="filters">
            <div class="filter-group">
              <label>状态:</label>
              <select v-model="statusFilter">
                <option value="all">全部</option>
                <option value="completed">已完成</option>
                <option value="uncompleted">未完成</option>
              </select>
            </div>

            <div class="filter-group">
              <label>重要性:</label>
              <select v-model="importanceFilter">
                <option :value="0">全部</option>
                <option :value="1">低</option>
                <option :value="2">中</option>
                <option :value="3">高</option>
              </select>
            </div>

            <div class="filter-group">
              <label>用户:</label>
              <select v-model="userFilter">
                <option value="all">全部用户</option>
                <option v-for="user in uniqueUsers.filter(u => u !== 'all')" :key="user" :value="user">
                  {{ user }}
                </option>
              </select>
            </div>

            <button class="clear-btn" @click="clearFilters">重置</button>
            <button class="add-btn" @click="showAddForm = true">新增任务</button>
          </div>
        </div>

        <div class="summary">
          <div class="summary-item">
            <span class="summary-label">总任务:</span>
            <span class="summary-value">{{ todos.length }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">已完成:</span>
            <span class="summary-value">{{todos.filter(t => t.completed).length}}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">筛选结果:</span>
            <span class="summary-value">{{ filteredTodos.length }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">当前显示:</span>
            <span class="summary-value">{{ paginatedTodos.length }}</span>
          </div>
        </div>

        <!-- 用户筛选器 -->
        <div class="user-filter-container" v-if="uniqueUsers.length > 2">
          <div class="user-filter-title">按用户筛选:</div>
          <div class="user-filter-tags">
            <div v-for="user in uniqueUsers" :key="user" class="user-tag" :class="{ active: userFilter === user }"
              @click="userFilter = user">
              {{ user === 'all' ? '全部用户' : user }}
              <span class="user-count" v-if="user === 'all'">
                ({{ todos.length }})
              </span>
              <span class="user-count" v-else>
                ({{todos.filter(t => t.userNickname === user).length}})
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="!isInitialized" class="loading-container">
        <div class="loading-spinner"></div>
        <p>正在加载数据...</p>
      </div>

      <!-- 添加任务表单 -->
      <div class="add-todo-form" v-if="showAddForm">
        <div class="form-header">
          <h2>添加新任务</h2>
          <button class="close-btn" @click="showAddForm = false">×</button>
        </div>

        <div class="form-body">
          <div class="form-group">
            <label>标题:</label>
            <input type="text" v-model="newTodo.title" placeholder="输入任务标题" />
          </div>

          <div class="form-group">
            <label>描述:</label>
            <textarea v-model="newTodo.description" placeholder="输入任务描述"></textarea>
          </div>

          <div class="form-group">
            <label>重要性:</label>
            <select v-model="newTodo.importance">
              <option :value="1">低</option>
              <option :value="2">中</option>
              <option :value="3">高</option>
            </select>
          </div>

          <div class="form-group">
            <label>用户:</label>
            <input type="text" v-model="newTodo.userNickname" placeholder="用户名称" />
          </div>

          <div class="form-actions">
            <button class="cancel-btn" @click="showAddForm = false">取消</button>
            <button class="submit-btn" @click="handleAddTodo" :disabled="isLoading">
              {{ isLoading ? '提交中...' : '提交' }}
            </button>
          </div>
        </div>
      </div>

      <div v-else class="result-panel">
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th class="id-col">ID</th>
                <th>标题</th>
                <th>状态</th>
                <th>重要性</th>
                <th>用户</th>
                <th>用户ID</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="todo in paginatedTodos" :key="todo._id" :class="{ 'completed-task': todo.completed }">
                <td class="id-col">{{ todo._id.substring(0, 8) }}...</td>
                <td class="title-col">{{ todo.title }}</td>
                <td>
                  <span class="status-badge" :class="{ 'status-completed': todo.completed }"
                    @click="toggleTaskStatus(todo)">
                    {{ todo.completed ? '已完成' : '未完成' }}
                  </span>
                </td>
                <td>
                  <span class="importance-badge" :style="{ backgroundColor: importanceColor[todo.importance] }">
                    {{ importanceText[todo.importance] }}
                  </span>
                </td>
                <td>{{ todo.userNickname }}</td>
                <td>{{ todo._openid || '无' }}</td>
                <td>{{ formatDate(todo.createTime) }}</td>
                <td>
                  <div class="action-buttons">
                    <button class="action-btn view-btn" @click="viewTodoDetail(todo)">详情</button>
                    <button class="action-btn delete-btn" @click="handleDeleteTodo(todo._id)">删除</button>
                  </div>
                </td>
              </tr>
              <tr v-if="paginatedTodos.length === 0">
                <td colspan="8" class="empty-state">
                  <div class="empty-state-content">
                    <i class="empty-icon">📝</i>
                    <p class="empty-text">没有找到匹配的任务</p>
                    <button class="clear-btn" @click="clearFilters">清除所有筛选条件</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 任务统计图表 -->
        <div class="task-stats" v-if="filteredTodos.length > 10 && userFilter === 'all'">
          <div class="stats-header">
            <h3>任务统计</h3>
          </div>
          <div class="stats-content">
            <div class="stats-item">
              <div class="stats-label">用户任务分布</div>
              <div class="stats-chart">
                <div class="user-bar-chart">
                  <div v-for="user in uniqueUsers.filter(u => u !== 'all')" :key="user" class="user-bar-container">
                    <div class="user-bar-label">{{ user }}</div>
                    <div class="user-bar-wrapper">
                      <div class="user-bar" :style="{
                        width: `${(todos.filter(t => t.userNickname === user).length / todos.length) * 100}%`,
                        backgroundColor: getRandomColor(user)
                      }"></div>
                      <span class="user-bar-value">{{todos.filter(t => t.userNickname === user).length}}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="stats-item">
              <div class="stats-label">任务完成状态</div>
              <div class="stats-chart">
                <div class="completion-donut">
                  <div class="donut-chart"
                    :style="{ backgroundImage: `conic-gradient(var(--success-color) 0% ${(todos.filter(t => t.completed).length / todos.length) * 100}%, #e0e0e0 ${(todos.filter(t => t.completed).length / todos.length) * 100}% 100%)` }">
                    <div class="donut-inner">{{Math.round((todos.filter(t => t.completed).length / todos.length) * 100)
                      }}%</div>
                  </div>
                  <div class="donut-legend">
                    <div class="legend-item">
                      <div class="legend-color" style="background-color: var(--success-color)"></div>
                      <div class="legend-text">已完成: {{todos.filter(t => t.completed).length}}</div>
                    </div>
                    <div class="legend-item">
                      <div class="legend-color" style="background-color: #e0e0e0"></div>
                      <div class="legend-text">未完成: {{todos.filter(t => !t.completed).length}}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 分页导航 -->
        <div class="pagination" v-if="filteredTodos.length > 0">
          <button class="page-btn" @click="goToPage(1)" :disabled="currentPage === 1">首页</button>
          <button class="page-btn" @click="goToPage(currentPage - 1)" :disabled="currentPage === 1">上一页</button>

          <button v-for="page in pageNumbers" :key="page" class="page-btn" :class="{ active: page === currentPage }"
            @click="goToPage(page)">
            {{ page }}
          </button>

          <button class="page-btn" @click="goToPage(currentPage + 1)"
            :disabled="currentPage === totalPages">下一页</button>
          <button class="page-btn" @click="goToPage(totalPages)" :disabled="currentPage === totalPages">末页</button>

          <span class="page-info">{{ currentPage }} / {{ totalPages }} 页</span>
        </div>

        <div class="task-detail" v-if="currentTodo">
          <div class="detail-header">
            <h2>任务详情</h2>
            <div class="detail-actions">
              <button v-if="!editMode" class="edit-btn" @click="startEditTodo">编辑</button>
              <button class="close-btn" @click="currentTodo = null">×</button>
            </div>
          </div>

          <!-- 查看模式 -->
          <div v-if="!editMode" class="detail-body">
            <div class="detail-row">
              <span class="detail-label">ID:</span>
              <span class="detail-value">{{ currentTodo._id }}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">用户ID:</span>
              <span class="detail-value">{{ currentTodo._openid || '无用户ID' }}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">标题:</span>
              <span class="detail-value">{{ currentTodo.title }}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">描述:</span>
              <p class="detail-value description">{{ currentTodo.description || '无描述' }}</p>
            </div>

            <div class="detail-row">
              <span class="detail-label">状态:</span>
              <span class="status-badge detail-value" :class="{ 'status-completed': currentTodo.completed }">
                {{ currentTodo.completed ? '已完成' : '未完成' }}
              </span>
            </div>

            <div class="detail-row">
              <span class="detail-label">重要性:</span>
              <span class="importance-badge detail-value"
                :style="{ backgroundColor: importanceColor[currentTodo.importance] }">
                {{ importanceText[currentTodo.importance] }}
              </span>
            </div>

            <div class="detail-row">
              <span class="detail-label">用户:</span>
              <span class="detail-value">{{ currentTodo.userNickname }}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">创建时间:</span>
              <span class="detail-value">{{ formatDate(currentTodo.createTime) }}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">更新时间:</span>
              <span class="detail-value">{{ formatDate(currentTodo.updateTime) }}</span>
            </div>
          </div>

          <!-- 编辑模式 -->
          <div v-else class="edit-form">
            <div class="form-group">
              <label>标题:</label>
              <input type="text" v-model="editTodo.title" placeholder="输入任务标题" />
            </div>

            <div class="form-group">
              <label>描述:</label>
              <textarea v-model="editTodo.description" placeholder="输入任务描述"></textarea>
            </div>

            <div class="form-group">
              <label>状态:</label>
              <select v-model="editTodo.completed">
                <option :value="false">未完成</option>
                <option :value="true">已完成</option>
              </select>
            </div>

            <div class="form-group">
              <label>重要性:</label>
              <select v-model="editTodo.importance">
                <option :value="1">低</option>
                <option :value="2">中</option>
                <option :value="3">高</option>
              </select>
            </div>

            <div class="form-group">
              <label>用户:</label>
              <input type="text" v-model="editTodo.userNickname" placeholder="用户名称" />
            </div>

            <div class="edit-actions">
              <button class="cancel-btn" @click="editMode = false">取消</button>
              <button class="save-btn" @click="saveTodoChanges" :disabled="isLoading">
                {{ isLoading ? '保存中...' : '保存' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
}

.loading-spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top: 4px solid #3498db;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.add-btn {
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 12px;
  cursor: pointer;
  margin-left: 10px;
}

.add-todo-form,
.edit-form {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 20px;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.form-group textarea {
  min-height: 100px;
  resize: vertical;
}

.form-actions,
.edit-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
  gap: 10px;
}

.submit-btn,
.save-btn {
  background-color: var(--primary-color);
  color: white;
}

.cancel-btn {
  background-color: #f1f1f1;
  color: #333;
}

.edit-btn {
  background-color: var(--secondary-color);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  cursor: pointer;
  margin-right: 10px;
}

.delete-btn {
  background-color: var(--danger-color);
}

.action-buttons {
  display: flex;
  gap: 5px;
}

.action-btn {
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s ease;
  color: white;
}

.view-btn {
  background-color: #3498db;
}

.view-btn:hover {
  background-color: #2980b9;
}

.delete-btn {
  background-color: #e74c3c;
}

.delete-btn:hover {
  background-color: #c0392b;
}

.detail-actions {
  display: flex;
  align-items: center;
}

.todo-management {
  height: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.refresh-btn {
  background-color: transparent;
  color: var(--primary-color);
  border: none;
  padding: 8px 12px;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-size: 14px;
}

.refresh-btn:hover {
  background-color: rgba(67, 97, 238, 0.1);
}

.content-panel {
  background-color: var(--card-color);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  overflow: hidden;
}

.search-panel {
  padding: 20px;
  background-color: var(--bg-color);
  border-bottom: 1px solid var(--border-color);
}

.search-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 16px;
}

.search-box {
  display: flex;
  max-width: 100%;
  flex: 1;
}

.search-box input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-right: none;
  border-radius: var(--border-radius) 0 0 var(--border-radius);
  font-size: 14px;
  outline: none;
  transition: var(--transition);
}

.search-box input:focus {
  border-color: var(--primary-color);
}

.search-btn {
  padding: 0 16px;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 0 var(--border-radius) var(--border-radius) 0;
  cursor: pointer;
  transition: var(--transition);
}

.search-btn:hover {
  background-color: var(--primary-dark);
}

.advanced-search-btn {
  padding: 0 16px;
  background-color: var(--secondary-color);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: var(--transition);
  margin-left: 10px;
}

.advanced-search-btn:hover {
  background-color: var(--secondary-dark);
}

.advanced-search-panel {
  background-color: #f9f9f9;
  border-radius: var(--border-radius);
  padding: 15px;
  margin-top: 10px;
  border: 1px solid var(--border-color);
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 15px;
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-group label {
  font-size: 14px;
  color: var(--text-light);
}

.filter-group select {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: 14px;
  outline: none;
  background-color: white;
}

.clear-btn {
  padding: 8px 12px;
  background-color: transparent;
  color: var(--text-light);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-size: 14px;
  transition: var(--transition);
}

.clear-btn:hover {
  background-color: white;
  color: var(--text-color);
}

.summary {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.summary-label {
  font-size: 14px;
  color: var(--text-light);
}

.summary-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
}

.result-panel {
  display: flex;
  flex-direction: column;
  min-height: 500px;
}

.table-wrapper {
  flex: 1;
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 16px;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
}

.data-table th {
  font-weight: 600;
  color: var(--text-light);
  font-size: 13px;
  background-color: var(--bg-color);
}

.data-table tr.completed-task {
  background-color: rgba(103, 194, 58, 0.05);
}

.id-col {
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.title-col {
  font-weight: 500;
}

.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  background-color: var(--text-light);
  color: white;
  cursor: pointer;
}

.status-badge.status-completed {
  background-color: var(--success-color);
}

.importance-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  color: white;
}

.empty-state {
  text-align: center;
  color: var(--text-light);
  padding: 40px !important;
}

.task-detail {
  width: 400px;
  border-left: 1px solid var(--border-color);
}

.detail-header {
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
}

.detail-header h2 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: var(--text-light);
  cursor: pointer;
}

.detail-body {
  padding: 20px;
}

.detail-row {
  margin-bottom: 12px;
}

.detail-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-light);
  margin-right: 10px;
}

.detail-value {
  font-size: 14px;
  color: var(--text-color);
}

.description {
  margin-top: 10px;
}

.edit-form {
  padding: 20px;
}

.edit-actions {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.edit-btn {
  background-color: var(--secondary-color);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  cursor: pointer;
}

/* 分页样式 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  gap: 8px;
  border-top: 1px solid var(--border-color);
}

.page-btn {
  padding: 6px 12px;
  border: 1px solid var(--border-color);
  background-color: white;
  border-radius: 4px;
  cursor: pointer;
  transition: var(--transition);
}

.page-btn:hover:not(:disabled) {
  background-color: var(--primary-color);
  color: white;
}

.page-btn.active {
  background-color: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  margin-left: 10px;
  color: var(--text-light);
}

@media (max-width: 1200px) {
  .result-panel {
    flex-direction: column;
  }

  .task-detail {
    width: 100%;
    border-left: none;
    border-top: 1px solid var(--border-color);
  }
}

@media (max-width: 768px) {
  .filter-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .filters {
    flex-direction: column;
    align-items: flex-start;
  }

  .filter-group {
    width: 100%;
  }

  .summary {
    flex-direction: column;
    gap: 8px;
    margin-top: 16px;
  }

  .pagination {
    flex-wrap: wrap;
  }
}

.header-actions {
  display: flex;
  gap: 10px;
}

.realtime-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  background-color: #95a5a6;
  color: white;
  transition: background-color 0.3s;
}

.realtime-btn.active {
  background-color: #2ecc71;
}

.realtime-btn:hover {
  opacity: 0.9;
}

.user-filter-container {
  margin-top: 20px;
  padding: 10px;
  background-color: var(--bg-color);
  border-radius: var(--border-radius);
}

.user-filter-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 10px;
}

.user-filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.user-tag {
  padding: 6px 12px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.user-tag.active {
  background-color: var(--primary-color);
  color: white;
}

.user-tag:hover {
  background-color: rgba(67, 97, 238, 0.1);
}

.user-count {
  font-size: 12px;
  color: var(--text-light);
}

.empty-state-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px 0;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 16px;
  color: var(--text-light);
  margin-bottom: 16px;
}

.task-stats {
  margin-top: 20px;
  background-color: white;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  overflow: hidden;
}

.stats-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
}

.stats-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.stats-content {
  display: flex;
  flex-wrap: wrap;
  padding: 20px;
  gap: 20px;
}

.stats-item {
  flex: 1;
  min-width: 300px;
}

.stats-label {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 16px;
}

.user-bar-chart {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.user-bar-container {
  display: flex;
  align-items: center;
}

.user-bar-label {
  width: 80px;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-bar-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  height: 24px;
  background-color: #f1f1f1;
  border-radius: 4px;
  overflow: hidden;
}

.user-bar {
  height: 100%;
  min-width: 2%;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.user-bar-value {
  margin-left: 8px;
  font-size: 12px;
  font-weight: 500;
}

.completion-donut {
  display: flex;
  align-items: center;
  justify-content: space-around;
  flex-wrap: wrap;
}

.donut-chart {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.donut-inner {
  width: 70%;
  height: 70%;
  background-color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 600;
}

.donut-legend {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
}

.legend-text {
  font-size: 14px;
}

@media (max-width: 768px) {
  .stats-content {
    flex-direction: column;
  }

  .completion-donut {
    flex-direction: column;
    gap: 20px;
  }
}
</style>