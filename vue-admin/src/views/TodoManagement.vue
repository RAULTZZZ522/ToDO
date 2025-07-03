<script setup>
import { ref, onMounted, computed, onBeforeUnmount } from 'vue'
import { getTodos, addTodo, updateTodo, deleteTodo, watchCollection, unwatchCollection } from '../services/cloudDbService'

// 待办事项数据
const todos = ref([])
const isInitialized = ref(false)

// 搜索和筛选
const searchKeyword = ref('')
const statusFilter = ref('all') // all, completed, uncompleted
const importanceFilter = ref(0) // 0: 所有, 1-3: 重要性级别
const isLoading = ref(false)

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
      // 成功添加后不需要手动刷新，实时监听会自动更新
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

// 筛选后的任务列表
const filteredTodos = computed(() => {
  let result = todos.value

  // 关键词筛选
  if (searchKeyword.value) {
    result = result.filter(todo =>
      todo.title.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      todo.description.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      (todo.userNickname && todo.userNickname.toLowerCase().includes(searchKeyword.value.toLowerCase()))
    )
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

  return result
})

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
      // 更新本地数据（实际上实时监听会自动更新，这里是为了立即更新UI）
      const index = todos.value.findIndex(t => t._id === editTodo.value._id);
      if (index !== -1) {
        todos.value[index] = { ...editTodo.value, updateTime: new Date().toString() };
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
      // 从本地数据中删除（实际上实时监听会自动更新，这里是为了立即更新UI）
      todos.value = todos.value.filter(t => t._id !== todoId);
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

// 搜索任务
const searchTodos = () => {
  fetchTodos();
}

// 清空筛选
const clearFilters = () => {
  searchKeyword.value = ''
  statusFilter.value = 'all'
  importanceFilter.value = 0
  searchTodos()
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
      // 更新本地数据（实际上实时监听会自动更新，这里是为了立即更新UI）
      todo.completed = newStatus;
      todo.updateTime = new Date().toString();
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

// 处理数据变化
const handleDataChange = (snapshot) => {
  console.log('待办事项数据变化:', snapshot);

  // 刷新数据列表
  fetchTodos();
};

// 设置实时数据监听
const setupRealTimeWatcher = async () => {
  try {
    await watchCollection('todos', handleDataChange);
    console.log('已设置待办事项实时监听');
  } catch (error) {
    console.error('设置实时监听失败:', error);
  }
};

// 刷新数据
const refreshTodos = () => {
  fetchTodos();
}

// 初始化数据和实时监听
onMounted(() => {
  fetchTodos();
  setupRealTimeWatcher();
})

// 在组件销毁前取消监听
onBeforeUnmount(() => {
  unwatchCollection('todos');
})
</script>

<template>
  <div class="todo-management">
    <div class="page-header">
      <h1>任务管理</h1>
      <button class="refresh-btn" @click="refreshTodos" :disabled="isLoading">
        {{ isLoading ? '加载中...' : '刷新' }}
      </button>
    </div>

    <div class="content-panel">
      <div class="search-panel">
        <div class="search-form">
          <div class="search-box">
            <input type="text" v-model="searchKeyword" @keyup.enter="searchTodos" placeholder="搜索任务标题、描述或用户" />
            <button class="search-btn" @click="searchTodos" :disabled="isLoading">
              <span v-if="!isLoading">搜索</span>
              <span v-else>搜索中...</span>
            </button>
          </div>

          <div class="filters">
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
              <tr v-for="todo in filteredTodos" :key="todo._id" :class="{ 'completed-task': todo.completed }">
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
                <td>{{ todo.userNickname || '未知用户' }}</td>
                <td class="openid-col">{{ todo._openid || '无ID' }}</td>
                <td>{{ formatDate(todo.createTime) }}</td>
                <td>
                  <div class="action-buttons">
                    <button class="action-btn view-btn" @click="viewTodoDetail(todo)">详情</button>
                    <button class="action-btn delete-btn" @click="handleDeleteTodo(todo._id)">删除</button>
                  </div>
                </td>
              </tr>
              <tr v-if="filteredTodos.length === 0">
                <td colspan="8" class="empty-state">没有找到匹配的任务</td>
              </tr>
            </tbody>
          </table>
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
              <span class="detail-value">{{ currentTodo.userNickname || '未知用户' }}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">用户ID:</span>
              <span class="detail-value">{{ currentTodo._openid || '无ID' }}</span>
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

.action-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.3s ease;
  color: white;
}

.view-btn {
  background-color: var(--primary-color);
}

.delete-btn {
  background-color: var(--danger-color);
}

.action-buttons {
  display: flex;
  gap: 5px;
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
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 16px;
}

.search-box {
  display: flex;
  max-width: 400px;
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

@media (max-width: 1200px) {
  .search-form {
    flex-direction: column;
  }

  .search-box {
    max-width: 100%;
  }

  .filters {
    margin-top: 12px;
  }

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
  .filters {
    flex-direction: column;
    align-items: flex-start;
  }

  .summary {
    flex-direction: column;
    gap: 8px;
    margin-top: 16px;
  }
}
</style>