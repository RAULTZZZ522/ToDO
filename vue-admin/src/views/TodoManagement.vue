<script setup>
import { ref, onMounted, computed } from 'vue'

// 模拟任务数据
const todos = ref([
  {
    _id: '82bba80968633a930435705a3d6207f1',
    _openid: 'o2ch25FQ2FpXs1fYC3JyOWo-hUKo',
    completed: false,
    createTime: 'Tue Jul 01 2025 09:32:03 GMT+0800 (中国标准时间)',
    description: '1',
    importance: 3,
    title: '1',
    updateTime: 'Tue Jul 01 2025 11:47:45 GMT+0800 (中国标准时间)',
    userNickname: '用户1'
  },
  {
    _id: 'todo123456789',
    _openid: 'user123456789',
    completed: true,
    createTime: 'Tue Jun 28 2025 10:15:22 GMT+0800 (中国标准时间)',
    description: '完成项目报告',
    importance: 2,
    title: '项目报告',
    updateTime: 'Tue Jun 30 2025 16:20:35 GMT+0800 (中国标准时间)',
    userNickname: '用户2'
  },
  {
    _id: 'todo987654321',
    _openid: 'user987654321',
    completed: false,
    createTime: 'Tue Jun 29 2025 08:45:11 GMT+0800 (中国标准时间)',
    description: '准备会议材料',
    importance: 1,
    title: '会议准备',
    updateTime: 'Tue Jun 29 2025 14:30:25 GMT+0800 (中国标准时间)',
    userNickname: '用户3'
  }
])

// 搜索和筛选
const searchKeyword = ref('')
const statusFilter = ref('all') // all, completed, uncompleted
const importanceFilter = ref(0) // 0: 所有, 1-3: 重要性级别
const isLoading = ref(false)

// 筛选后的任务列表
const filteredTodos = computed(() => {
  let result = todos.value
  
  // 关键词筛选
  if (searchKeyword.value) {
    result = result.filter(todo => 
      todo.title.toLowerCase().includes(searchKeyword.value.toLowerCase()) || 
      todo.description.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      todo.userNickname.toLowerCase().includes(searchKeyword.value.toLowerCase())
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

// 查看任务详情
const viewTodoDetail = (todo) => {
  currentTodo.value = todo
}

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
  isLoading.value = true
  setTimeout(() => {
    isLoading.value = false
  }, 300)
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
  const date = new Date(dateString)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 修改任务状态
const toggleTaskStatus = (todo) => {
  // 在实际应用中，这里会调用API
  todo.completed = !todo.completed
  todo.updateTime = new Date().toString()
}

// 初始化数据
onMounted(() => {
  // 在真实环境中可以从API获取数据
})
</script>

<template>
  <div class="todo-management">
    <div class="page-header">
      <h1>任务管理</h1>
      <button class="refresh-btn">刷新</button>
    </div>
    
    <div class="content-panel">
      <div class="search-panel">
        <div class="search-form">
          <div class="search-box">
            <input 
              type="text" 
              v-model="searchKeyword" 
              @keyup.enter="searchTodos"
              placeholder="搜索任务标题、描述或用户" 
            />
            <button class="search-btn" @click="searchTodos">
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
          </div>
        </div>
        
        <div class="summary">
          <div class="summary-item">
            <span class="summary-label">总任务:</span>
            <span class="summary-value">{{ todos.length }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">已完成:</span>
            <span class="summary-value">{{ todos.filter(t => t.completed).length }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">筛选结果:</span>
            <span class="summary-value">{{ filteredTodos.length }}</span>
          </div>
        </div>
      </div>
      
      <div class="result-panel">
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th class="id-col">ID</th>
                <th>标题</th>
                <th>状态</th>
                <th>重要性</th>
                <th>用户</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="todo in filteredTodos" :key="todo._id" :class="{ 'completed-task': todo.completed }">
                <td class="id-col">{{ todo._id.substring(0, 8) }}...</td>
                <td class="title-col">{{ todo.title }}</td>
                <td>
                  <span 
                    class="status-badge" 
                    :class="{ 'status-completed': todo.completed }"
                    @click="toggleTaskStatus(todo)"
                  >
                    {{ todo.completed ? '已完成' : '未完成' }}
                  </span>
                </td>
                <td>
                  <span 
                    class="importance-badge" 
                    :style="{ backgroundColor: importanceColor[todo.importance] }"
                  >
                    {{ importanceText[todo.importance] }}
                  </span>
                </td>
                <td>{{ todo.userNickname }}</td>
                <td>{{ formatDate(todo.createTime) }}</td>
                <td>
                  <div class="action-buttons">
                    <button class="action-btn view-btn" @click="viewTodoDetail(todo)">详情</button>
                  </div>
                </td>
              </tr>
              <tr v-if="filteredTodos.length === 0">
                <td colspan="7" class="empty-state">没有找到匹配的任务</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="task-detail" v-if="currentTodo">
          <div class="detail-header">
            <h2>任务详情</h2>
            <button class="close-btn" @click="currentTodo = null">×</button>
          </div>
          
          <div class="detail-body">
            <div class="detail-section">
              <div class="section-title">基本信息</div>
              <div class="detail-item">
                <div class="detail-label">任务ID:</div>
                <div class="detail-value">{{ currentTodo._id }}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">标题:</div>
                <div class="detail-value title-value">{{ currentTodo.title }}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">描述:</div>
                <div class="detail-value">{{ currentTodo.description || '无描述' }}</div>
              </div>
            </div>
            
            <div class="detail-section">
              <div class="section-title">属性</div>
              <div class="detail-item">
                <div class="detail-label">状态:</div>
                <div class="detail-value">
                  <span 
                    class="status-badge"
                    :class="{ 'status-completed': currentTodo.completed }"
                  >
                    {{ currentTodo.completed ? '已完成' : '未完成' }}
                  </span>
                </div>
              </div>
              <div class="detail-item">
                <div class="detail-label">重要性:</div>
                <div class="detail-value">
                  <span 
                    class="importance-badge" 
                    :style="{ backgroundColor: importanceColor[currentTodo.importance] }"
                  >
                    {{ importanceText[currentTodo.importance] }}
                  </span>
                </div>
              </div>
              <div class="detail-item">
                <div class="detail-label">所属用户:</div>
                <div class="detail-value">{{ currentTodo.userNickname }}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">用户ID:</div>
                <div class="detail-value">{{ currentTodo._openid }}</div>
              </div>
            </div>
            
            <div class="detail-section">
              <div class="section-title">时间信息</div>
              <div class="detail-item">
                <div class="detail-label">创建时间:</div>
                <div class="detail-value">{{ formatDate(currentTodo.createTime) }}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">更新时间:</div>
                <div class="detail-value">{{ formatDate(currentTodo.updateTime) }}</div>
              </div>
            </div>
            
            <div class="detail-actions">
              <button 
                class="detail-btn" 
                :class="currentTodo.completed ? 'warning' : 'success'"
                @click="toggleTaskStatus(currentTodo)"
              >
                {{ currentTodo.completed ? '标记为未完成' : '标记为已完成' }}
              </button>
              <button class="detail-btn danger">删除任务</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
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

.action-buttons {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 6px 12px;
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-size: 13px;
  transition: var(--transition);
}

.view-btn {
  background-color: var(--primary-color);
  color: white;
}

.view-btn:hover {
  background-color: var(--primary-dark);
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

.detail-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-light);
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
}

.detail-item {
  margin-bottom: 12px;
  display: flex;
}

.detail-label {
  width: 80px;
  font-size: 14px;
  color: var(--text-light);
  flex-shrink: 0;
}

.detail-value {
  flex: 1;
  font-size: 14px;
  color: var(--text-color);
}

.title-value {
  font-weight: 600;
}

.detail-actions {
  display: flex;
  gap: 12px;
}

.detail-btn {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-size: 14px;
  transition: var(--transition);
  color: white;
}

.detail-btn.success {
  background-color: var(--success-color);
}

.detail-btn.warning {
  background-color: var(--warning-color);
}

.detail-btn.danger {
  background-color: var(--danger-color);
}

.detail-btn:hover {
  opacity: 0.9;
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