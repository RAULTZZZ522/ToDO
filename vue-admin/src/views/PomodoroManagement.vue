<script setup>
import { ref, onMounted, computed } from 'vue'

// 模拟番茄钟数据
const pomodoros = ref([
  {
    _id: '8524406c686331450439691954bc4bb',
    _openid: 'o2ch25FQ2FpXs1fYC3JyOWo-hUKo',
    endtime: 'Tue Jul 01 2025 08:53:28 GMT+0800 (中国标准时间)',
    pomodoro_id: 1,
    starttime: 'Tue Jul 01 2025 08:52:59 GMT+0800 (中国标准时间)',
    todo_id: '82bba80968633a930435705a3d6207f1',
    todo_title: '1',
    userNickname: '用户1'
  },
  {
    _id: 'pomo123456789',
    _openid: 'user123456789',
    endtime: 'Tue Jun 30 2025 14:25:00 GMT+0800 (中国标准时间)',
    pomodoro_id: 2,
    starttime: 'Tue Jun 30 2025 14:00:00 GMT+0800 (中国标准时间)',
    todo_id: 'todo123456789',
    todo_title: '项目报告',
    userNickname: '用户2'
  },
  {
    _id: 'pomo987654321',
    _openid: 'user987654321',
    endtime: 'Tue Jun 29 2025 10:30:00 GMT+0800 (中国标准时间)',
    pomodoro_id: 3,
    starttime: 'Tue Jun 29 2025 10:05:00 GMT+0800 (中国标准时间)',
    todo_id: 'todo987654321',
    todo_title: '会议准备',
    userNickname: '用户3'
  }
])

// 搜索关键词
const searchKeyword = ref('')
const dateRange = ref({
  start: '',
  end: ''
})
const isLoading = ref(false)
const selectedUser = ref('all')

// 用户列表，实际应用中可能从API获取
const userOptions = computed(() => {
  const uniqueUsers = [...new Set(pomodoros.value.map(p => p.userNickname))];
  return [
    { value: 'all', label: '全部用户' },
    ...uniqueUsers.map(name => ({ value: name, label: name }))
  ]
})

// 筛选后的番茄钟列表
const filteredPomodoros = computed(() => {
  let result = pomodoros.value
  
  // 关键词筛选
  if (searchKeyword.value) {
    result = result.filter(pomo => 
      pomo.todo_title.toLowerCase().includes(searchKeyword.value.toLowerCase()) || 
      pomo.userNickname.toLowerCase().includes(searchKeyword.value.toLowerCase())
    )
  }
  
  // 日期范围筛选
  if (dateRange.value.start && dateRange.value.end) {
    const startDate = new Date(dateRange.value.start)
    const endDate = new Date(dateRange.value.end)
    
    result = result.filter(pomo => {
      const pomoDate = new Date(pomo.starttime)
      return pomoDate >= startDate && pomoDate <= endDate
    })
  }
  
  // 用户筛选
  if (selectedUser.value !== 'all') {
    result = result.filter(pomo => pomo.userNickname === selectedUser.value)
  }
  
  return result
})

// 当前选中的番茄钟
const currentPomodoro = ref(null)

// 查看番茄钟详情
const viewPomodoroDetail = (pomo) => {
  currentPomodoro.value = pomo
}

// 搜索番茄钟
const searchPomodoros = () => {
  isLoading.value = true
  setTimeout(() => {
    isLoading.value = false
  }, 300)
}

// 清空筛选
const clearFilters = () => {
  searchKeyword.value = ''
  dateRange.value.start = ''
  dateRange.value.end = ''
  selectedUser.value = 'all'
  searchPomodoros()
}

// 格式化日期
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 计算持续时间（分钟）
const calculateDuration = (startTime, endTime) => {
  const start = new Date(startTime)
  const end = new Date(endTime)
  const durationMs = end - start
  return Math.round(durationMs / 60000) // 转换为分钟
}

// 统计数据
const stats = computed(() => {
  const totalPomodoros = filteredPomodoros.value.length
  const totalDuration = filteredPomodoros.value.reduce((sum, pomo) => 
    sum + calculateDuration(pomo.starttime, pomo.endtime), 0)
  
  const avgDuration = totalPomodoros ? Math.round(totalDuration / totalPomodoros) : 0
  
  const durations = filteredPomodoros.value.map(pomo => 
    calculateDuration(pomo.starttime, pomo.endtime))
  const maxDuration = durations.length ? Math.max(...durations) : 0
  
  return {
    totalPomodoros,
    totalDuration,
    avgDuration,
    maxDuration
  }
})

// 初始化数据
onMounted(() => {
  // 在真实环境中可以从API获取数据
})
</script>

<template>
  <div class="pomodoro-management">
    <div class="page-header">
      <h1>番茄钟管理</h1>
      <button class="refresh-btn">刷新</button>
    </div>
    
    <div class="content-panel">
      <div class="search-panel">
        <div class="search-form">
          <div class="search-row">
            <div class="search-box">
              <input 
                type="text" 
                v-model="searchKeyword" 
                @keyup.enter="searchPomodoros"
                placeholder="搜索任务或用户" 
              />
              <button class="search-btn" @click="searchPomodoros">
                <span v-if="!isLoading">搜索</span>
                <span v-else>搜索中...</span>
              </button>
            </div>
            
            <div class="user-filter">
              <label>用户:</label>
              <select v-model="selectedUser" @change="searchPomodoros">
                <option v-for="option in userOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </div>
          </div>
          
          <div class="date-filter-row">
            <div class="date-filter">
              <label>开始日期:</label>
              <input 
                type="date" 
                v-model="dateRange.start" 
                @change="searchPomodoros" 
              />
            </div>
            
            <div class="date-filter">
              <label>结束日期:</label>
              <input 
                type="date" 
                v-model="dateRange.end" 
                @change="searchPomodoros" 
              />
            </div>
            
            <button class="clear-btn" @click="clearFilters">重置筛选</button>
          </div>
        </div>
      </div>
      
      <div class="stats-panel">
        <div class="stat-card">
          <div class="stat-value">{{ stats.totalPomodoros }}</div>
          <div class="stat-label">番茄钟数</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-value">{{ stats.totalDuration }}分钟</div>
          <div class="stat-label">总专注时长</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-value">{{ stats.avgDuration }}分钟</div>
          <div class="stat-label">平均时长</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-value">{{ stats.maxDuration }}分钟</div>
          <div class="stat-label">最长时长</div>
        </div>
      </div>
      
      <div class="result-panel">
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>关联任务</th>
                <th>用户</th>
                <th>开始时间</th>
                <th>结束时间</th>
                <th>持续时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="pomo in filteredPomodoros" :key="pomo._id">
                <td>{{ pomo._id.substring(0, 8) }}...</td>
                <td class="task-title">{{ pomo.todo_title }}</td>
                <td>{{ pomo.userNickname }}</td>
                <td>{{ formatDate(pomo.starttime) }}</td>
                <td>{{ formatDate(pomo.endtime) }}</td>
                <td>
                  <span class="duration-badge">
                    {{ calculateDuration(pomo.starttime, pomo.endtime) }}分钟
                  </span>
                </td>
                <td>
                  <button class="action-btn view-btn" @click="viewPomodoroDetail(pomo)">
                    详情
                  </button>
                </td>
              </tr>
              <tr v-if="filteredPomodoros.length === 0">
                <td colspan="7" class="empty-state">没有找到匹配的番茄钟记录</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="pomodoro-detail" v-if="currentPomodoro">
          <div class="detail-header">
            <h2>番茄钟详情</h2>
            <button class="close-btn" @click="currentPomodoro = null">×</button>
          </div>
          
          <div class="detail-body">
            <div class="detail-section">
              <div class="section-title">基本信息</div>
              <div class="detail-item">
                <div class="detail-label">ID:</div>
                <div class="detail-value">{{ currentPomodoro._id }}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">番茄钟编号:</div>
                <div class="detail-value">{{ currentPomodoro.pomodoro_id }}</div>
              </div>
            </div>
            
            <div class="detail-section">
              <div class="section-title">时间信息</div>
              <div class="detail-item">
                <div class="detail-label">开始时间:</div>
                <div class="detail-value">{{ formatDate(currentPomodoro.starttime) }}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">结束时间:</div>
                <div class="detail-value">{{ formatDate(currentPomodoro.endtime) }}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">持续时间:</div>
                <div class="detail-value highlight">
                  {{ calculateDuration(currentPomodoro.starttime, currentPomodoro.endtime) }}分钟
                </div>
              </div>
            </div>
            
            <div class="detail-section">
              <div class="section-title">关联信息</div>
              <div class="detail-item">
                <div class="detail-label">关联任务:</div>
                <div class="detail-value">{{ currentPomodoro.todo_title }}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">任务ID:</div>
                <div class="detail-value">{{ currentPomodoro.todo_id }}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">用户:</div>
                <div class="detail-value">{{ currentPomodoro.userNickname }}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">用户ID:</div>
                <div class="detail-value">{{ currentPomodoro._openid }}</div>
              </div>
            </div>
            
            <div class="detail-actions">
              <button class="detail-btn danger">删除记录</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pomodoro-management {
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
}

.search-row, .date-filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
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

.user-filter, .date-filter {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-filter label, .date-filter label {
  font-size: 14px;
  color: var(--text-light);
  white-space: nowrap;
}

.user-filter select {
  min-width: 120px;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: 14px;
  outline: none;
  background-color: white;
}

.date-filter input {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: 14px;
  outline: none;
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
  margin-left: auto;
}

.clear-btn:hover {
  background-color: white;
  color: var(--text-color);
}

.stats-panel {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  padding: 20px;
  background-color: white;
  border-bottom: 1px solid var(--border-color);
}

.stat-card {
  background-color: var(--bg-color);
  border-radius: var(--border-radius);
  padding: 16px;
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--primary-color);
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: var(--text-light);
}

.result-panel {
  display: flex;
  min-height: 400px;
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

.task-title {
  font-weight: 500;
}

.duration-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  background-color: var(--primary-color);
  color: white;
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

.pomodoro-detail {
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
  width: 90px;
  font-size: 14px;
  color: var(--text-light);
  flex-shrink: 0;
}

.detail-value {
  flex: 1;
  font-size: 14px;
  color: var(--text-color);
  word-break: break-all;
}

.detail-value.highlight {
  font-weight: 600;
  color: var(--primary-color);
}

.detail-actions {
  display: flex;
  justify-content: flex-end;
}

.detail-btn {
  padding: 10px 20px;
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-size: 14px;
  transition: var(--transition);
  color: white;
}

.detail-btn.danger {
  background-color: var(--danger-color);
}

.detail-btn:hover {
  opacity: 0.9;
}

@media (max-width: 1200px) {
  .stats-panel {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .result-panel {
    flex-direction: column;
  }
  
  .pomodoro-detail {
    width: 100%;
    border-left: none;
    border-top: 1px solid var(--border-color);
  }
}

@media (max-width: 768px) {
  .search-row, .date-filter-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-box {
    max-width: 100%;
  }
  
  .user-filter, .date-filter {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .clear-btn {
    margin-left: 0;
    width: 100%;
  }
  
  .stats-panel {
    grid-template-columns: 1fr;
  }
}
</style> 