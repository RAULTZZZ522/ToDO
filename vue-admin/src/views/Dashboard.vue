<script setup>
import { ref, onMounted, computed } from 'vue'
import { Chart, registerables } from 'chart.js'
import { getTodos, getAims, getPomodoros, callCloudFunction } from '../services/cloudDbService'

// 注册Chart.js组件
Chart.register(...registerables)

// 模拟数据
const totalUsers = ref(0)
const totalTodos = ref(0)
const completedTodos = ref(0)
const totalPomodoros = ref(0)
const totalAims = ref(0)
const completedAims = ref(0)
const isLoading = ref(true)
const errorMessage = ref('')
const cloudFunctionResult = ref(null)

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

// 用户活跃度数据（静态数据）
const userActivityData = {
  weekly: {
    labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    datasets: [
      {
        label: '日活跃用户',
        data: [32, 45, 39, 28, 52, 38, 42],
        backgroundColor: 'rgba(67, 97, 238, 0.2)',
        borderColor: 'rgba(67, 97, 238, 1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true
      },
      {
        label: '完成任务用户',
        data: [18, 25, 22, 16, 28, 20, 24],
        backgroundColor: 'rgba(103, 194, 58, 0.2)',
        borderColor: 'rgba(103, 194, 58, 1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true
      }
    ]
  },
  monthly: {
    labels: ['1周', '2周', '3周', '4周'],
    datasets: [
      {
        label: '周活跃用户',
        data: [85, 102, 128, 96],
        backgroundColor: 'rgba(67, 97, 238, 0.2)',
        borderColor: 'rgba(67, 97, 238, 1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true
      },
      {
        label: '完成任务用户',
        data: [42, 58, 74, 51],
        backgroundColor: 'rgba(103, 194, 58, 0.2)',
        borderColor: 'rgba(103, 194, 58, 1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true
      }
    ]
  }
}

// 目标完成情况数据（静态数据）
const aimsData = ref([
  {
    id: '6149379668864a17a044c65903cdc2f93',
    title: '考研第二阶段',
    category: '学习',
    progress: 45,
    deadline: '2025-07-15 08:00:00',
    description: '完成数学的一轮复习',
    todoCount: 5,
    completedTodoCount: 2,
    totalTime: 1000
  },
  {
    id: '7a8b6c5d4e3f2g1h0i9j8k7l6m5n4o3p',
    title: '健身计划',
    category: '健康',
    progress: 70,
    deadline: '2025-07-30 08:00:00',
    description: '坚持每周健身三次',
    todoCount: 8,
    completedTodoCount: 5,
    totalTime: 720
  },
  {
    id: '1q2w3e4r5t6y7u8i9o0p1a2s3d4f5g6h',
    title: '学习Vue.js',
    category: '技术',
    progress: 30,
    deadline: '2025-08-15 08:00:00',
    description: '完成Vue.js入门到精通',
    todoCount: 10,
    completedTodoCount: 3,
    totalTime: 1500
  },
  {
    id: '7j8k9l0m1n2b3v4c5x6z7a8s9d0f1g2h',
    title: '阅读计划',
    category: '阅读',
    progress: 85,
    deadline: '2025-07-10 08:00:00',
    description: '每月阅读两本书',
    todoCount: 6,
    completedTodoCount: 5,
    totalTime: 500
  }
])

// 按照目标分类的统计数据
const aimCategoryData = {
  labels: ['学习', '健康', '技术', '阅读', '工作', '生活'],
  datasets: [
    {
      label: '目标数量',
      data: [8, 5, 7, 4, 6, 3],
      backgroundColor: [
        'rgba(67, 97, 238, 0.7)',
        'rgba(76, 201, 240, 0.7)',
        'rgba(103, 194, 58, 0.7)',
        'rgba(247, 37, 133, 0.7)',
        'rgba(255, 173, 13, 0.7)',
        'rgba(58, 134, 255, 0.7)'
      ],
      borderWidth: 0
    }
  ]
}

// 当前选择的时间段
const activePeriod = ref('weekly')

// 初始化图表
let userActivityChart = null
let aimCategoryChart = null

// 创建用户活跃度图表
const createUserActivityChart = () => {
  if (userActivityChart) {
    userActivityChart.destroy()
  }

  const ctx = document.getElementById('userActivityChart')
  if (!ctx) return

  userActivityChart = new Chart(ctx, {
    type: 'line',
    data: activePeriod.value === 'weekly' ? userActivityData.weekly : userActivityData.monthly,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
            boxWidth: 6
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            drawBorder: false
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      }
    }
  })
}

// 创建目标分类图表
const createAimCategoryChart = () => {
  if (aimCategoryChart) {
    aimCategoryChart.destroy()
  }

  const ctx = document.getElementById('aimCategoryChart')
  if (!ctx) return

  aimCategoryChart = new Chart(ctx, {
    type: 'pie',
    data: aimCategoryData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            usePointStyle: true,
            boxWidth: 10,
            font: {
              size: 12
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return `${context.label}: ${context.raw}个目标`;
            }
          }
        }
      }
    }
  })
}

// 切换时间段
const changePeriod = (period) => {
  activePeriod.value = period
  createUserActivityChart()
}

// 计算总目标数
const totalAimCount = computed(() => aimsData.value.length)

// 计算目标完成率
const aimCompletionRate = computed(() => {
  if (!aimsData.value.length) return 0

  const totalProgress = aimsData.value.reduce((sum, aim) => sum + aim.progress, 0)
  return Math.round(totalProgress / aimsData.value.length)
})

// 按截止日期排序的目标
const sortedAimsByDeadline = computed(() => {
  return [...aimsData.value].sort((a, b) => {
    return new Date(a.deadline) - new Date(b.deadline)
  })
})

// 数据状态
const todos = ref([])
const aims = ref([])
const pomodoros = ref([])

// 加载数据
const loadData = async () => {
  isLoading.value = true
  errorMessage.value = ''
  
  try {
    // 并行获取所有数据
    const [todosData, aimsData, pomodorosData] = await Promise.all([
      getTodos(),
      getAims(),
      getPomodoros()
    ])
    
    todos.value = todosData
    aims.value = aimsData
    pomodoros.value = pomodorosData
    
    console.log('所有数据加载成功', {
      todos: todos.value.length,
      aims: aims.value.length,
      pomodoros: pomodoros.value.length
    })

    totalUsers.value = 158
    totalTodos.value = 467
    completedTodos.value = 312
    totalPomodoros.value = 1289
    totalAims.value = 33
    completedAims.value = 18

    // 图表初始化
    createUserActivityChart()
    createAimCategoryChart()
  } catch (error) {
    console.error('加载数据失败:', error)
    errorMessage.value = `数据加载失败: ${error.message || '未知错误'}`
  } finally {
    isLoading.value = false
  }
}

// 调用云函数示例
const callCustomCloudFunction = async () => {
  try {
    // 假设您已经创建了一个名为'getStatistics'的云函数
    // 用于获取用户待办事项和番茄钟的统计数据
    const result = await callCloudFunction('getStatistics', {
      userId: 'o2ch25FQ2FpXs1fYC3JyOWo-hUKo'  // 可以传递参数给云函数
    })
    
    cloudFunctionResult.value = result
    console.log('云函数调用成功:', result)
  } catch (error) {
    console.error('云函数调用失败:', error)
    errorMessage.value = `云函数调用失败: ${error.message || '未知错误'}`
  }
}

// 页面加载时获取数据
onMounted(() => {
  loadData()
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
        <div class="stat-icon aims-icon">🎯</div>
        <div class="stat-info">
          <div class="stat-value">{{ isLoading ? '-' : totalAims }}</div>
          <div class="stat-label">总目标数</div>
          <div class="stat-sublabel">完成率: {{ isLoading ? '-' : Math.round(completedAims / totalAims * 100) }}%</div>
        </div>
        <div class="stat-trend up">
          <span>↑ 10%</span>
        </div>
      </div>

      <div class="stat-card" :class="{ 'is-loading': isLoading }">
        <div class="stat-icon todos-icon">📝</div>
        <div class="stat-info">
          <div class="stat-value">{{ isLoading ? '-' : totalTodos }}</div>
          <div class="stat-label">总任务数</div>
          <div class="stat-sublabel">完成率: {{ isLoading ? '-' : (totalTodos ? Math.round(completedTodos / totalTodos *
            100) : 0) }}%</div>
        </div>
        <div class="stat-trend up">
          <span>↑ 8%</span>
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
      <!-- 第一行 -->
      <div class="chart-container">
        <div class="chart-header">
          <h2>目标完成情况</h2>
          <div class="chart-actions">
            <span class="chart-filter active">全部</span>
            <span class="chart-filter">进行中</span>
            <span class="chart-filter">已完成</span>
          </div>
        </div>

        <div class="aims-table-container">
          <table class="stats-table aims-table">
            <thead>
              <tr>
                <th>目标名称</th>
                <th>分类</th>
                <th>截止日期</th>
                <th>任务完成</th>
                <th>进度</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="aim in sortedAimsByDeadline" :key="aim.id" class="aim-row">
                <td>
                  <div class="aim-title">{{ aim.title }}</div>
                  <div class="aim-description">{{ aim.description }}</div>
                </td>
                <td><span class="aim-category">{{ aim.category }}</span></td>
                <td>{{ new Date(aim.deadline).toLocaleDateString() }}</td>
                <td>{{ aim.completedTodoCount }}/{{ aim.todoCount }}</td>
                <td>
                  <div class="aim-progress-wrapper">
                    <div class="aim-progress">
                      <div class="aim-progress-bar" :style="{ width: aim.progress + '%' }"></div>
                    </div>
                    <span class="aim-progress-text">{{ aim.progress }}%</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 第二行 -->
      <div class="charts-row">
        <div class="chart-container aim-categories-chart">
          <div class="chart-header">
            <h2>目标分类分布</h2>
          </div>
          <div class="chart-wrapper">
            <canvas id="aimCategoryChart"></canvas>
          </div>
        </div>

        <div class="chart-container aim-stats">
          <div class="chart-header">
            <h2>目标统计</h2>
          </div>
          <div class="aim-stats-content">
            <div class="aim-stat-item">
              <div class="aim-stat-icon">📊</div>
              <div class="aim-stat-info">
                <div class="aim-stat-value">{{ totalAimCount }}</div>
                <div class="aim-stat-label">总目标数</div>
              </div>
            </div>
            <div class="aim-stat-item">
              <div class="aim-stat-icon">✅</div>
              <div class="aim-stat-info">
                <div class="aim-stat-value">{{ completedAims }}</div>
                <div class="aim-stat-label">已完成目标</div>
              </div>
            </div>
            <div class="aim-stat-item">
              <div class="aim-stat-icon">⏳</div>
              <div class="aim-stat-info">
                <div class="aim-stat-value">{{ aimCompletionRate }}%</div>
                <div class="aim-stat-label">平均完成度</div>
              </div>
            </div>
            <div class="aim-stat-item">
              <div class="aim-stat-icon">⚡</div>
              <div class="aim-stat-info">
                <div class="aim-stat-value">{{ Math.round(totalTodos / totalAimCount) }}</div>
                <div class="aim-stat-label">平均任务数</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 第三行 -->
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
                  <span class="trend-indicator" :class="item.completed >= item.created * 0.7 ? 'up' : 'down'">
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
            <span class="chart-period" :class="{ active: activePeriod === 'weekly' }"
              @click="changePeriod('weekly')">周</span>
            <span class="chart-period" :class="{ active: activePeriod === 'monthly' }"
              @click="changePeriod('monthly')">月</span>
          </div>
        </div>

        <div class="chart-content">
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

          <div class="chart-wrapper">
            <canvas id="userActivityChart"></canvas>
          </div>
        </div>
      </div>

      <div v-if="isLoading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>加载数据中，请稍候...</p>
      </div>
      
      <div v-else-if="errorMessage" class="error-container">
        <p class="error-message">{{ errorMessage }}</p>
        <button @click="loadData" class="retry-btn">重试</button>
      </div>
      
      <div v-else class="cloud-function-section">
        <h2>云函数调用示例</h2>
        <button @click="callCustomCloudFunction" class="cloud-btn">调用统计云函数</button>
        
        <div v-if="cloudFunctionResult" class="result-container">
          <pre>{{ JSON.stringify(cloudFunctionResult, null, 2) }}</pre>
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
  gap: a0px;
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

.aims-icon {
  background-color: rgba(255, 159, 28, 0.1);
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
  grid-template-columns: 1fr;
  gap: 24px;
}

.charts-row {
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

.chart-period,
.chart-filter {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  color: var(--text-light);
}

.chart-period.active,
.chart-filter.active {
  background-color: var(--primary-color);
  color: white;
}

/* 表格样式 */
.table-container,
.aims-table-container {
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

.aims-table td {
  vertical-align: middle;
}

.aim-title {
  font-weight: 600;
  color: var(--text-color);
}

.aim-description {
  font-size: 12px;
  color: var(--text-light);
  margin-top: 4px;
}

.aim-category {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 12px;
  background-color: rgba(67, 97, 238, 0.1);
  color: var(--primary-color);
}

.aim-progress-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
}

.aim-progress {
  width: 100px;
  height: 6px;
  background-color: #e9ecef;
  border-radius: 3px;
  overflow: hidden;
}

.aim-progress-bar {
  height: 100%;
  background-color: var(--primary-color);
  border-radius: 3px;
}

.aim-progress-text {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-color);
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

/* 图表内容 */
.chart-content {
  height: 300px;
  display: flex;
  flex-direction: column;
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

.chart-wrapper {
  flex: 1;
  position: relative;
  min-height: 200px;
}

/* 目标统计卡片 */
.aim-stats-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  padding: 10px;
}

.aim-stat-item {
  display: flex;
  align-items: center;
  background-color: white;
  padding: 16px;
  border-radius: var(--border-radius);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.aim-stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background-color: rgba(67, 97, 238, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  margin-right: 12px;
}

.aim-stat-info {
  flex: 1;
}

.aim-stat-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-color);
}

.aim-stat-label {
  font-size: 12px;
  color: var(--text-light);
  margin-top: 2px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
}

.loading-spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top: 4px solid #3498db;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-container {
  text-align: center;
  margin: 50px 0;
}

.error-message {
  color: #e74c3c;
  font-size: 16px;
  margin-bottom: 20px;
}

.retry-btn, .cloud-btn {
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 20px;
  cursor: pointer;
  font-size: 14px;
}

.retry-btn:hover, .cloud-btn:hover {
  background-color: #2980b9;
}

.cloud-function-section {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 30px;
}

.cloud-function-section h2 {
  margin-top: 0;
  font-size: 18px;
  margin-bottom: 20px;
}

.result-container {
  margin-top: 20px;
  background-color: #f9f9f9;
  border-radius: 4px;
  padding: 15px;
  overflow: auto;
  max-height: 300px;
}

pre {
  margin: 0;
  white-space: pre-wrap;
}

@media (max-width: 1200px) {
  .stat-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .charts-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .stat-cards {
    grid-template-columns: 1fr;
  }

  .aim-stats-content {
    grid-template-columns: 1fr;
  }
}
</style>