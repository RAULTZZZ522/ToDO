<script setup>
import { ref, onMounted } from 'vue'

// 模拟数据
const totalUsers = ref(0)
const totalTodos = ref(0)
const completedTodos = ref(0)
const totalPomodoros = ref(0)
const isLoading = ref(true)

// 每日任务完成统计数据
const dailyStats = ref([
  { date: '2025-06-25', completed: 5, created: 8 },
  { date: '2025-06-26', completed: 7, created: 6 },
  { date: '2025-06-27', completed: 3, created: 4 },
  { date: '2025-06-28', completed: 8, created: 9 },
  { date: '2025-06-29', completed: 6, created: 5 },
  { date: '2025-06-30', completed: 9, created: 7 },
  { date: '2025-07-01', completed: 12, created: 10 }
])

// 模拟数据加载
onMounted(() => {
  // 模拟API请求延迟
  setTimeout(() => {
    totalUsers.value = 158
    totalTodos.value = 467
    completedTodos.value = 312
    totalPomodoros.value = 1289
    isLoading.value = false
  }, 800)
})
</script>

<template>
  <div class="dashboard">
    <div class="page-header">
      <h1>数据统计</h1>
      <span class="refresh-btn">刷新</span>
    </div>
    
    <div class="stat-cards">
      <div class="stat-card" :class="{ 'is-loading': isLoading }">
        <div class="stat-icon users-icon">👥</div>
        <div class="stat-info">
          <div class="stat-value">{{ isLoading ? '-' : totalUsers }}</div>
          <div class="stat-label">总用户数</div>
        </div>
        <div class="stat-trend up">
          <span>↑ 12%</span>
        </div>
      </div>
      
      <div class="stat-card" :class="{ 'is-loading': isLoading }">
        <div class="stat-icon todos-icon">📝</div>
        <div class="stat-info">
          <div class="stat-value">{{ isLoading ? '-' : totalTodos }}</div>
          <div class="stat-label">总任务数</div>
        </div>
        <div class="stat-trend up">
          <span>↑ 8%</span>
        </div>
      </div>
      
      <div class="stat-card" :class="{ 'is-loading': isLoading }">
        <div class="stat-icon completed-icon">✅</div>
        <div class="stat-info">
          <div class="stat-value">{{ isLoading ? '-' : completedTodos }}</div>
          <div class="stat-label">已完成任务</div>
          <div class="stat-sublabel">完成率: {{ isLoading ? '-' : (totalTodos ? Math.round(completedTodos / totalTodos * 100) : 0) }}%</div>
        </div>
        <div class="stat-trend up">
          <span>↑ 5%</span>
        </div>
      </div>
      
      <div class="stat-card" :class="{ 'is-loading': isLoading }">
        <div class="stat-icon pomodoro-icon">⏱️</div>
        <div class="stat-info">
          <div class="stat-value">{{ isLoading ? '-' : totalPomodoros }}</div>
          <div class="stat-label">总番茄钟数</div>
        </div>
        <div class="stat-trend up">
          <span>↑ 15%</span>
        </div>
      </div>
    </div>
    
    <div class="dashboard-content">
      <div class="chart-container">
        <div class="chart-header">
          <h2>每日任务完成情况</h2>
          <div class="chart-actions">
            <span class="chart-period active">周</span>
            <span class="chart-period">月</span>
            <span class="chart-period">年</span>
          </div>
        </div>
        
        <div class="table-container">
          <table class="stats-table">
            <thead>
              <tr>
                <th>日期</th>
                <th>新建任务</th>
                <th>完成任务</th>
                <th>完成率</th>
                <th>趋势</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in dailyStats" :key="item.date">
                <td>{{ item.date }}</td>
                <td>{{ item.created }}</td>
                <td>{{ item.completed }}</td>
                <td>
                  <span class="completion-rate" :style="{
                    '--rate': Math.round(item.completed / item.created * 100) + '%'
                  }">
                    {{ Math.round(item.completed / item.created * 100) }}%
                  </span>
                </td>
                <td>
                  <span 
                    class="trend-indicator" 
                    :class="item.completed >= item.created * 0.7 ? 'up' : 'down'"
                  >
                    {{ item.completed >= item.created * 0.7 ? '↑' : '↓' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <div class="chart-container">
        <div class="chart-header">
          <h2>用户活跃度分析</h2>
          <div class="chart-actions">
            <span class="chart-period active">周</span>
            <span class="chart-period">月</span>
          </div>
        </div>
        
        <div class="chart-placeholder">
          <div class="active-users-display">
            <div class="active-users-item">
              <div class="active-users-value">42</div>
              <div class="active-users-label">今日活跃</div>
            </div>
            <div class="active-users-item">
              <div class="active-users-value">128</div>
              <div class="active-users-label">本周活跃</div>
            </div>
            <div class="active-users-item">
              <div class="active-users-value">324</div>
              <div class="active-users-label">本月活跃</div>
            </div>
          </div>
          
          <div class="placeholder-message">
            此处将显示用户活跃度图表
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
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
  color: var(--primary-color);
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
}

.refresh-btn:hover {
  text-decoration: underline;
}

/* 统计卡片 */
.stat-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background-color: var(--card-color);
  border-radius: var(--border-radius);
  padding: 20px;
  display: flex;
  align-items: center;
  position: relative;
  box-shadow: var(--shadow);
  transition: var(--transition);
  overflow: hidden;
}

.stat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
}

.stat-card.is-loading {
  opacity: 0.7;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background-color: var(--primary-color);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: rgba(67, 97, 238, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-right: 16px;
  flex-shrink: 0;
}

.users-icon {
  background-color: rgba(67, 97, 238, 0.1);
}

.todos-icon {
  background-color: rgba(76, 201, 240, 0.1);
}

.completed-icon {
  background-color: rgba(103, 194, 58, 0.1);
}

.pomodoro-icon {
  background-color: rgba(247, 37, 133, 0.1);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-color);
  line-height: 1.2;
}

.stat-label {
  font-size: 14px;
  color: var(--text-light);
  margin-top: 4px;
}

.stat-sublabel {
  font-size: 12px;
  color: var(--success-color);
  margin-top: 2px;
}

.stat-trend {
  position: absolute;
  top: 12px;
  right: 12px;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 12px;
}

.stat-trend.up {
  color: var(--success-color);
  background-color: rgba(103, 194, 58, 0.1);
}

.stat-trend.down {
  color: var(--danger-color);
  background-color: rgba(249, 65, 68, 0.1);
}

/* 图表区域 */
.dashboard-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.chart-container {
  background-color: var(--card-color);
  border-radius: var(--border-radius);
  padding: 20px;
  box-shadow: var(--shadow);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.chart-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.chart-actions {
  display: flex;
  gap: 8px;
}

.chart-period {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  color: var(--text-light);
}

.chart-period.active {
  background-color: var(--primary-color);
  color: white;
}

/* 表格样式 */
.table-container {
  overflow-x: auto;
}

.stats-table {
  width: 100%;
  border-collapse: collapse;
}

.stats-table th, 
.stats-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
}

.stats-table th {
  font-weight: 600;
  color: var(--text-light);
  font-size: 13px;
}

.stats-table td {
  font-size: 14px;
}

.completion-rate {
  position: relative;
  display: inline-block;
  width: 70px;
  height: 6px;
  background-color: #e9ecef;
  border-radius: 3px;
  overflow: hidden;
}

.completion-rate::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: var(--rate);
  background-color: var(--primary-color);
  border-radius: 3px;
}

.completion-rate::after {
  content: attr(data-rate);
  position: absolute;
  right: -30px;
  font-size: 12px;
}

.trend-indicator {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: bold;
}

.trend-indicator.up {
  color: var(--success-color);
  background-color: rgba(103, 194, 58, 0.1);
}

.trend-indicator.down {
  color: var(--danger-color);
  background-color: rgba(249, 65, 68, 0.1);
}

/* 占位图表 */
.chart-placeholder {
  height: 300px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: var(--bg-color);
  border-radius: var(--border-radius);
}

.active-users-display {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.active-users-item {
  text-align: center;
  padding: 16px 24px;
  background-color: white;
  border-radius: var(--border-radius);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.active-users-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--primary-color);
}

.active-users-label {
  font-size: 12px;
  color: var(--text-light);
  margin-top: 4px;
}

.placeholder-message {
  color: var(--text-light);
  font-size: 14px;
  text-align: center;
}

@media (max-width: 1200px) {
  .stat-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .dashboard-content {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .stat-cards {
    grid-template-columns: 1fr;
  }
}
</style> 