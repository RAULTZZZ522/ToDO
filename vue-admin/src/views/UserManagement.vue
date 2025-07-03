<script setup>
import { ref, onMounted, computed } from 'vue'

// 模拟用户数据
const users = ref([
  {
    _openid: 'o2ch25FQ2FpXs1fYC3JyOWo-hUKo',
    nickname: '用户1',
    avatarUrl: '',
    taskCount: 12,
    completedCount: 8,
    pomodoroCount: 25,
    lastActive: '2025-07-01 08:53:28',
    createTime: '2025-06-15 14:22:45'
  },
  {
    _openid: 'user123456789',
    nickname: '用户2',
    avatarUrl: '',
    taskCount: 8,
    completedCount: 3,
    pomodoroCount: 12,
    lastActive: '2025-06-30 18:21:07',
    createTime: '2025-06-12 09:15:33'
  },
  {
    _openid: 'user987654321',
    nickname: '用户3',
    avatarUrl: '',
    taskCount: 20,
    completedCount: 15,
    pomodoroCount: 42,
    lastActive: '2025-07-01 12:30:45',
    createTime: '2025-06-10 15:45:12'
  }
])

// 搜索关键词
const searchKeyword = ref('')
const isLoading = ref(false)
const selectedStatus = ref('all')

// 状态选项
const statusOptions = [
  { value: 'all', label: '全部' },
  { value: 'active', label: '活跃' },
  { value: 'inactive', label: '不活跃' }
]

// 筛选后的用户列表
const filteredUsers = computed(() => {
  if (!searchKeyword.value && selectedStatus.value === 'all') {
    return users.value
  }
  
  return users.value.filter(user => {
    // 关键词筛选
    const matchKeyword = !searchKeyword.value || 
      user.nickname.toLowerCase().includes(searchKeyword.value.toLowerCase()) || 
      user._openid.includes(searchKeyword.value)
    
    // 状态筛选
    let matchStatus = true
    if (selectedStatus.value !== 'all') {
      const lastActiveDate = new Date(user.lastActive)
      const now = new Date()
      const daysDiff = Math.floor((now - lastActiveDate) / (1000 * 60 * 60 * 24))
      
      if (selectedStatus.value === 'active') {
        matchStatus = daysDiff < 7 // 7天内活跃
      } else if (selectedStatus.value === 'inactive') {
        matchStatus = daysDiff >= 7
      }
    }
    
    return matchKeyword && matchStatus
  })
})

// 当前选中的用户
const currentUser = ref(null)

// 查看用户详情
const viewUserDetail = (user) => {
  currentUser.value = user
}

// 搜索用户
const searchUsers = () => {
  isLoading.value = true
  setTimeout(() => {
    isLoading.value = false
  }, 300)
}

// 计算完成率
const getCompletionRate = (user) => {
  if (!user.taskCount) return 0
  return Math.round(user.completedCount / user.taskCount * 100)
}

// 清空搜索
const clearSearch = () => {
  searchKeyword.value = ''
  selectedStatus.value = 'all'
  searchUsers()
}

// 初始化数据
onMounted(() => {
  // 模拟数据已加载
})
</script>

<template>
  <div class="user-management">
    <div class="page-header">
      <h1>用户管理</h1>
      <div class="actions">
        <button class="refresh-btn">刷新</button>
      </div>
    </div>
    
    <div class="content-panel">
      <div class="search-panel">
        <div class="search-box">
          <input 
            type="text" 
            v-model="searchKeyword" 
            @keyup.enter="searchUsers"
            placeholder="搜索用户名或ID" 
          />
          <button class="search-btn" @click="searchUsers">
            <span v-if="!isLoading">搜索</span>
            <span v-else>搜索中...</span>
          </button>
        </div>
        
        <div class="filter-box">
          <div class="filter-item">
            <label>状态:</label>
            <select v-model="selectedStatus" @change="searchUsers">
              <option v-for="option in statusOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>
          
          <button class="clear-btn" @click="clearSearch">重置</button>
        </div>
      </div>
      
      <div class="result-panel">
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>用户</th>
                <th>任务</th>
                <th>完成率</th>
                <th>番茄钟</th>
                <th>最后活跃</th>
                <th>注册时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in filteredUsers" :key="user._openid">
                <td class="user-cell">
                  <div class="user-avatar">{{ user.nickname.charAt(0) }}</div>
                  <div class="user-info">
                    <div class="user-name">{{ user.nickname }}</div>
                    <div class="user-id">{{ user._openid.substring(0, 8) }}...</div>
                  </div>
                </td>
                <td>{{ user.taskCount }}</td>
                <td>
                  <div class="completion-wrapper">
                    <div class="completion-bar" :style="{width: getCompletionRate(user) + '%'}"></div>
                    <span class="completion-text">{{ getCompletionRate(user) }}%</span>
                  </div>
                </td>
                <td>{{ user.pomodoroCount }}</td>
                <td>{{ user.lastActive }}</td>
                <td>{{ user.createTime }}</td>
                <td>
                  <button class="action-btn view-btn" @click="viewUserDetail(user)">详情</button>
                </td>
              </tr>
              <tr v-if="filteredUsers.length === 0">
                <td colspan="7" class="empty-state">没有找到匹配的用户</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="user-detail" v-if="currentUser">
          <div class="detail-header">
            <h2>用户详情</h2>
            <button class="close-btn" @click="currentUser = null">×</button>
          </div>
          
          <div class="detail-body">
            <div class="detail-profile">
              <div class="user-avatar large">
                {{ currentUser.nickname.charAt(0) }}
              </div>
              <div class="user-profile-info">
                <h3>{{ currentUser.nickname }}</h3>
                <div class="user-id">ID: {{ currentUser._openid }}</div>
              </div>
            </div>
            
            <div class="detail-stats">
              <div class="stat-item">
                <div class="stat-value">{{ currentUser.taskCount }}</div>
                <div class="stat-label">任务数</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ currentUser.completedCount }}</div>
                <div class="stat-label">已完成</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ getCompletionRate(currentUser) }}%</div>
                <div class="stat-label">完成率</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ currentUser.pomodoroCount }}</div>
                <div class="stat-label">番茄钟</div>
              </div>
            </div>
            
            <div class="detail-section">
              <h4>用户信息</h4>
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">注册时间</div>
                  <div class="info-value">{{ currentUser.createTime }}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">最后活跃</div>
                  <div class="info-value">{{ currentUser.lastActive }}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">任务完成率</div>
                  <div class="info-value">
                    <div class="completion-wrapper">
                      <div class="completion-bar" :style="{width: getCompletionRate(currentUser) + '%'}"></div>
                      <span class="completion-text">{{ getCompletionRate(currentUser) }}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="detail-actions">
              <button class="detail-action-btn primary">查看任务</button>
              <button class="detail-action-btn danger">禁用账户</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.user-management {
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
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 16px;
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

.filter-box {
  display: flex;
  align-items: center;
  gap: 16px;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-item label {
  font-size: 14px;
  color: var(--text-light);
}

.filter-item select {
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
  background-color: var(--bg-color);
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

.user-cell {
  display: flex;
  align-items: center;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: var(--primary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  margin-right: 12px;
}

.user-avatar.large {
  width: 80px;
  height: 80px;
  font-size: 32px;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 500;
  margin-bottom: 4px;
}

.user-id {
  font-size: 12px;
  color: var(--text-light);
}

.completion-wrapper {
  width: 100px;
  height: 6px;
  background-color: #e9ecef;
  border-radius: 3px;
  position: relative;
  overflow: hidden;
}

.completion-bar {
  height: 100%;
  background-color: var(--primary-color);
  border-radius: 3px;
}

.completion-text {
  position: absolute;
  font-size: 12px;
  color: var(--text-color);
  left: 105px;
  top: -5px;
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

.user-detail {
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

.detail-profile {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
}

.user-profile-info {
  margin-left: 16px;
}

.user-profile-info h3 {
  font-size: 18px;
  margin: 0 0 4px 0;
}

.detail-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 24px;
}

.stat-item {
  padding: 12px;
  text-align: center;
  background-color: var(--bg-color);
  border-radius: var(--border-radius);
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--primary-color);
}

.stat-label {
  font-size: 12px;
  color: var(--text-light);
  margin-top: 4px;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section h4 {
  font-size: 16px;
  margin: 0 0 16px 0;
  color: var(--text-color);
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.info-item {
  margin-bottom: 12px;
}

.info-label {
  font-size: 12px;
  color: var(--text-light);
  margin-bottom: 4px;
}

.info-value {
  font-size: 14px;
  color: var(--text-color);
}

.detail-actions {
  display: flex;
  gap: 12px;
}

.detail-action-btn {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-size: 14px;
  transition: var(--transition);
}

.detail-action-btn.primary {
  background-color: var(--primary-color);
  color: white;
}

.detail-action-btn.primary:hover {
  background-color: var(--primary-dark);
}

.detail-action-btn.danger {
  background-color: var(--danger-color);
  color: white;
}

.detail-action-btn.danger:hover {
  opacity: 0.9;
}

@media (max-width: 1200px) {
  .result-panel {
    flex-direction: column;
  }
  
  .user-detail {
    width: 100%;
    border-left: none;
    border-top: 1px solid var(--border-color);
  }
  
  .detail-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .search-panel {
    flex-direction: column;
  }
  
  .search-box {
    max-width: 100%;
  }
  
  .filter-box {
    flex-wrap: wrap;
  }
}
</style> 