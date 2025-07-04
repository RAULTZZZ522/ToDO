<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { Chart, registerables } from 'chart.js'
import { getTodos, getAims, getPomodoros, getUsers, callCloudFunction } from '../services/cloudDbService'

// 注册Chart.js组件
Chart.register(...registerables)

// 数据状态
const totalUsers = ref(0)
const totalTodos = ref(0)
const completedTodos = ref(0)
const totalPomodoros = ref(0)
const totalAims = ref(0)
const completedAims = ref(0)
const isLoading = ref(true)
const errorMessage = ref('')
const cloudFunctionResult = ref(null)

// 每日任务完成统计数据 - 初始化为空数组，将通过API获取
const dailyStats = ref([])

// 用户活跃度数据 - 初始化为空对象，将通过API获取或计算得到
const userActivityData = ref({
  weekly: {
    labels: [],
    datasets: [
      {
        label: '日活跃用户',
        data: [],
        backgroundColor: 'rgba(67, 97, 238, 0.2)',
        borderColor: 'rgba(67, 97, 238, 1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true
      },
      {
        label: '完成日程用户',
        data: [],
        backgroundColor: 'rgba(103, 194, 58, 0.2)',
        borderColor: 'rgba(103, 194, 58, 1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true
      }
    ]
  },
  monthly: {
    labels: [],
    datasets: [
      {
        label: '周活跃用户',
        data: [],
        backgroundColor: 'rgba(67, 97, 238, 0.2)',
        borderColor: 'rgba(67, 97, 238, 1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true
      },
      {
        label: '完成日程用户',
        data: [],
        backgroundColor: 'rgba(103, 194, 58, 0.2)',
        borderColor: 'rgba(103, 194, 58, 1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true
      }
    ]
  }
})

// 目标完成情况数据 - 初始化为空数组，将通过API获取
const aimsData = ref([])

// 按照目标分类的统计数据 - 初始化为空对象，将通过API获取或计算得到
const aimCategoryData = ref({
  labels: [],
  datasets: [
    {
      label: '目标数量',
      data: [],
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
})

// 当前选择的时间段
const activePeriod = ref('weekly')

// 初始化图表
let userActivityChart = null
let aimCategoryChart = null

// 趋势数据
const trend = reactive({
  users: { up: true, percent: 0 },
  aims: { up: true, percent: 0 },
  todos: { up: true, percent: 0 },
  pomodoros: { up: true, percent: 0 }
});

// 活跃用户计数
const activeUserCounts = reactive({
  today: 0,
  weekly: 0,
  monthly: 0
});

// 辅助函数：解析日期字段
const parseDate = (item, fields) => {
  for (const f of fields) {
    if (item[f]) {
      const d = new Date(item[f]);
      if (!isNaN(d)) return d;
    }
  }
  return null;
};

// 计算趋势
const calculateTrend = (array, fields) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(todayStart.getDate() - 1);

  let countToday = 0;
  let countYesterday = 0;

  array.forEach(item => {
    const d = parseDate(item, fields);
    if (!d) return;
    if (d >= todayStart) {
      countToday++;
    } else if (d >= yesterdayStart && d < todayStart) {
      countYesterday++;
    }
  });

  const diff = countToday - countYesterday;
  const up = diff >= 0;
  const percent = countYesterday === 0 ? (diff > 0 ? 100 : 0) : Math.round(Math.abs(diff) / countYesterday * 100);
  return { up, percent };
};

// 更新趋势
const updateTrendStats = () => {
  trend.users = calculateTrend(users.value, ['createTime', 'create_time', 'registrationTime', 'regTime', 'createdAt']);
  trend.aims = calculateTrend(aims.value, ['createTime', 'create_time', 'createdAt']);
  trend.todos = calculateTrend(todos.value, ['createTime', 'create_time', 'createdAt']);
  trend.pomodoros = calculateTrend(pomodoros.value, ['starttime', 'startTime', 'start', 'start_at', 'createTime']);

  // 计算活跃用户
  computeActiveUsers();

  // 准备用户活跃度折线图数据
  prepareUserActivityData();

  // 更新图表数据
  prepareDailyStatsData();
  prepareAimCategoryData();

  // 图表初始化
  createUserActivityChart();
  createAimCategoryChart();
};

// 计算活跃用户
const computeActiveUsers = () => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const weekStart = new Date(todayStart);
  weekStart.setDate(todayStart.getDate() - 6); // 包含今天，共7天

  const monthStart = new Date(todayStart);
  monthStart.setDate(todayStart.getDate() - 29); // 包含今天，共30天

  const todaySet = new Set();
  const weekSet = new Set();
  const monthSet = new Set();

  const processEvent = (openid, dateStr) => {
    if (!openid || !dateStr) return;
    const d = new Date(dateStr);
    if (isNaN(d)) return;

    if (d >= todayStart) todaySet.add(openid);
    if (d >= weekStart) weekSet.add(openid);
    if (d >= monthStart) monthSet.add(openid);
  };

  todos.value.forEach(todo => {
    processEvent(todo._openid, todo.updateTime || todo.createTime);
  });

  pomodoros.value.forEach(pomo => {
    processEvent(pomo._openid, pomo.endtime || pomo.starttime);
  });

  activeUserCounts.today = todaySet.size;
  activeUserCounts.weekly = weekSet.size;
  activeUserCounts.monthly = monthSet.size;
};

// 创建用户活跃度图表
const createUserActivityChart = () => {
  if (userActivityChart) {
    userActivityChart.destroy()
  }

  const ctx = document.getElementById('userActivityChart')
  if (!ctx) return

  userActivityChart = new Chart(ctx, {
    type: 'line',
    data: activePeriod.value === 'weekly' ? userActivityData.value.weekly : userActivityData.value.monthly,
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
    data: aimCategoryData.value,
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
const users = ref([])
const userMap = ref({})

// 准备七天的日期标签
const prepareDailyStatsData = () => {
  const result = [];
  const today = new Date();

  // 获取过去7天的日期
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(today.getDate() - i);

    // 格式化日期为 YYYY-MM-DD
    const formattedDate = date.toISOString().split('T')[0];

    // 获取当天创建和完成的任务数量
    const todayTodos = todos.value.filter(todo => {
      const todoDate = new Date(todo.createTime).toISOString().split('T')[0];
      return todoDate === formattedDate;
    });

    const completedTodayTodos = todayTodos.filter(todo => todo.completed);

    result.push({
      date: formattedDate,
      created: todayTodos.length,
      completed: completedTodayTodos.length
    });
  }

  dailyStats.value = result;
};

// 准备用户活跃度数据
const prepareUserActivityData = () => {
  // 最近7天（日活）
  const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  const weeklyActiveUsers = new Array(7).fill(0).map(() => new Set());
  const weeklyCompletedTaskUsers = new Array(7).fill(0).map(() => new Set());

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const addToBucket = (openid, eventDate, bucketSets) => {
    const diffDays = Math.floor((today - eventDate) / (1000 * 60 * 60 * 24));
    const index = 6 - diffDays; // 0表示最左(周一前6天)，6表示今天
    if (index >= 0 && index < 7) {
      bucketSets[index].add(openid);
    }
  };

  todos.value.forEach(todo => {
    const d = new Date(todo.updateTime || todo.createTime);
    if (isNaN(d)) return;
    const openid = todo._openid;
    addToBucket(openid, d, weeklyActiveUsers);
    if (todo.completed) addToBucket(openid, d, weeklyCompletedTaskUsers);
  });

  pomodoros.value.forEach(pomo => {
    const d = new Date(pomo.endtime || pomo.starttime);
    if (isNaN(d)) return;
    const openid = pomo._openid;
    addToBucket(openid, d, weeklyActiveUsers);
  });

  const weeklyActiveCounts = weeklyActiveUsers.map(set => set.size);
  const weeklyCompletedCounts = weeklyCompletedTaskUsers.map(set => set.size);

  userActivityData.value.weekly = {
    labels: weekDays,
    datasets: [
      {
        label: '日活跃用户',
        data: weeklyActiveCounts,
        backgroundColor: 'rgba(67, 97, 238, 0.2)',
        borderColor: 'rgba(67, 97, 238, 1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true
      },
      {
        label: '完成日程用户',
        data: weeklyCompletedCounts,
        backgroundColor: 'rgba(103, 194, 58, 0.2)',
        borderColor: 'rgba(103, 194, 58, 1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true
      }
    ]
  };

  // 最近4周（周活）
  const monthWeeks = ['1周', '2周', '3周', '4周'];
  const monthlyActiveBuckets = new Array(4).fill(0).map(() => new Set());

  const addToWeekBucket = (openid, d) => {
    const diffDays = Math.floor((today - d) / (1000 * 60 * 60 * 24));
    const index = Math.floor((29 - diffDays) / 7); // 0~3 对应4周
    if (index >= 0 && index < 4) {
      monthlyActiveBuckets[index].add(openid);
    }
  };

  todos.value.forEach(todo => {
    const d = new Date(todo.updateTime || todo.createTime);
    if (isNaN(d)) return;
    addToWeekBucket(todo._openid, d);
  });

  pomodoros.value.forEach(pomo => {
    const d = new Date(pomo.endtime || pomo.starttime);
    if (isNaN(d)) return;
    addToWeekBucket(pomo._openid, d);
  });

  const monthlyActiveCounts = monthlyActiveBuckets.map(set => set.size);

  userActivityData.value.monthly = {
    labels: monthWeeks,
    datasets: [
      {
        label: '周活跃用户',
        data: monthlyActiveCounts,
        backgroundColor: 'rgba(67, 97, 238, 0.2)',
        borderColor: 'rgba(67, 97, 238, 1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true
      }
    ]
  };
};

// 准备目标分类数据
const prepareAimCategoryData = () => {
  // 根据aims数据计算每个分类的数量
  const categories = {};

  console.log('准备目标分类数据，当前目标数据:', aims.value);

  if (aims.value && aims.value.length > 0) {
    aims.value.forEach(aim => {
      const category = aim.category || '未分类';
      categories[category] = (categories[category] || 0) + 1;
    });
  } else {
    // 如果没有目标数据，添加一个默认分类
    categories['暂无数据'] = 1;
  }

  // 将分类数据转换为图表格式
  const categoryLabels = Object.keys(categories);
  const categoryData = categoryLabels.map(label => categories[label]);

  console.log('生成的目标分类数据:', { labels: categoryLabels, data: categoryData });

  aimCategoryData.value = {
    labels: categoryLabels,
    datasets: [
      {
        label: '目标数量',
        data: categoryData,
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
  };
};

// 加载数据
const loadData = async () => {
  isLoading.value = true;
  errorMessage.value = '';

  try {
    console.log('开始加载仪表盘数据...');

    // 首先尝试使用云函数获取统计数据
    let statsData = null;
    try {
      console.log('尝试调用getStatistics云函数获取统计数据');
      const result = await callCloudFunction('getStatistics', {});
      statsData = result?.result?.stats;
      cloudFunctionResult.value = result;
      console.log('云函数获取的统计数据:', statsData);
    } catch (cloudFnError) {
      console.error('调用云函数失败，将尝试直接查询数据:', cloudFnError);
    }

    // 并行获取所有数据
    console.log('开始并行获取todos, aims, pomodoros数据');
    let todosData = [], aimsResult = [], pomodorosData = [], usersResult = [];

    try {
      todosData = await getTodos().catch(err => {
        console.error('获取todos数据失败:', err);
        return [];
      });
      console.log('成功获取todos数据:', todosData?.length || 0);
    } catch (todoError) {
      console.error('获取todos数据出错:', todoError);
    }

    try {
      aimsResult = await getAims().catch(err => {
        console.error('获取aims数据失败:', err);
        return [];
      });
      console.log('成功获取aims数据:', aimsResult?.length || 0);
    } catch (aimError) {
      console.error('获取aims数据出错:', aimError);
    }

    try {
      pomodorosData = await getPomodoros().catch(err => {
        console.error('获取pomodoros数据失败:', err);
        return [];
      });
      console.log('成功获取pomodoros数据:', pomodorosData?.length || 0);
    } catch (pomodoroError) {
      console.error('获取pomodoros数据出错:', pomodoroError);
    }

    try {
      usersResult = await getUsers().catch(err => {
        console.error('获取users数据失败:', err);
        return [];
      });
      console.log('成功获取users数据:', usersResult?.length || 0);
    } catch (userError) {
      console.error('获取users数据出错:', userError);
    }

    console.log('数据获取结果:', {
      todos: todosData?.length || 0,
      aims: aimsResult?.length || 0,
      pomodoros: pomodorosData?.length || 0
    });

    // 确保数据是数组类型
    todos.value = Array.isArray(todosData) ? todosData : [];
    aims.value = Array.isArray(aimsResult) ? aimsResult : [];
    pomodoros.value = Array.isArray(pomodorosData) ? pomodorosData : [];
    aimsData.value = Array.isArray(aimsResult) ? aimsResult : [];
    users.value = Array.isArray(usersResult) ? usersResult : [];

    // 构建用户映射
    userMap.value = users.value.reduce((map, user) => {
      const openid = user._openid || user.openid;
      if (openid) map[openid] = user.nickname || user.nickName || user.name || '未知用户';
      return map;
    }, {});

    // 在aims数据中附加用户昵称
    if (Array.isArray(aimsResult)) {
      aimsResult.forEach(aim => {
        const nick = userMap.value[aim._openid] || '未知用户';
        aim.userNickname = nick;
      });
    }

    // 更新用户统计
    totalUsers.value = users.value.length;

    // 更新趋势
    updateTrendStats();

    // 如果从云函数获取到了数据，使用云函数的统计结果
    if (statsData) {
      totalTodos.value = statsData.todos?.total || todosData?.length || 0;
      completedTodos.value = statsData.todos?.completed || 0;
      totalAims.value = statsData.aims?.total || aimsResult?.length || 0;
      completedAims.value = statsData.aims?.completed || 0;
      totalPomodoros.value = statsData.pomodoros?.total || pomodorosData?.length || 0;
    } else {
      // 否则使用前端计算的统计数据
      totalTodos.value = todosData?.length || 0;
      completedTodos.value = todosData?.filter(todo => todo.completed)?.length || 0;
      totalAims.value = aimsResult?.length || 0;
      completedAims.value = aimsResult?.filter(aim => aim.progress === 100)?.length || 0;
      totalPomodoros.value = pomodorosData?.length || 0;
    }

    // 更新图表数据
    prepareDailyStatsData();
    prepareUserActivityData();
    prepareAimCategoryData();

    console.log('数据统计:', {
      totalTodos: totalTodos.value,
      completedTodos: completedTodos.value,
      totalAims: totalAims.value,
      completedAims: completedAims.value,
      totalPomodoros: totalPomodoros.value
    });

    // 图表初始化
    createUserActivityChart();
    createAimCategoryChart();

    console.log('仪表盘数据加载完成');
  } catch (error) {
    console.error('加载数据失败:', error);
    errorMessage.value = `数据加载失败: ${error.message || '未知错误'}`;
  } finally {
    isLoading.value = false;
  }
};

// 调用云函数示例
const callCustomCloudFunction = async () => {
  try {
    isLoading.value = true;
    console.log('开始调用getStatistics云函数...');

    // 调用getStatistics云函数
    const result = await callCloudFunction('getStatistics', {
      // 如果需要获取特定用户的数据，可以传入userId
      // userId: 'o2ch25FQ2FpXs1fYC3JyOWo-hUKo'  
    });

    cloudFunctionResult.value = result;
    console.log('云函数调用成功:', result);

    // 如果云函数返回了统计数据，更新页面上的统计信息
    if (result?.result?.stats) {
      const stats = result.result.stats;
      totalTodos.value = stats.todos?.total || 0;
      completedTodos.value = stats.todos?.completed || 0;
      totalAims.value = stats.aims?.total || 0;
      completedAims.value = stats.aims?.completed || 0;
      totalPomodoros.value = stats.pomodoros?.total || 0;
    }
  } catch (error) {
    console.error('云函数调用失败:', error);
    errorMessage.value = `云函数调用失败: ${error.message || '未知错误'}`;
  } finally {
    isLoading.value = false;
  }
};

// 页面加载时获取数据
onMounted(() => {
  loadData();
});
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
        <div class="stat-trend" :class="trend.users.up ? 'up' : 'down'">
          <span>{{ trend.users.up ? '↑' : '↓' }} {{ trend.users.percent }}%</span>
        </div>
      </div>

      <div class="stat-card" :class="{ 'is-loading': isLoading }">
        <div class="stat-icon aims-icon">🎯</div>
        <div class="stat-info">
          <div class="stat-value">{{ isLoading ? '-' : totalAims }}</div>
          <div class="stat-label">总目标数</div>
          <div class="stat-sublabel">完成率: {{ isLoading ? '-' : Math.round(completedAims / totalAims * 100) }}%</div>
        </div>
        <div class="stat-trend" :class="trend.aims.up ? 'up' : 'down'">
          <span>{{ trend.aims.up ? '↑' : '↓' }} {{ trend.aims.percent }}%</span>
        </div>
      </div>

      <div class="stat-card" :class="{ 'is-loading': isLoading }">
        <div class="stat-icon todos-icon">📝</div>
        <div class="stat-info">
          <div class="stat-value">{{ isLoading ? '-' : totalTodos }}</div>
          <div class="stat-label">总日程数</div>
          <div class="stat-sublabel">完成率: {{ isLoading ? '-' : (totalTodos ? Math.round(completedTodos / totalTodos *
            100) : 0) }}%</div>
        </div>
        <div class="stat-trend" :class="trend.todos.up ? 'up' : 'down'">
          <span>{{ trend.todos.up ? '↑' : '↓' }} {{ trend.todos.percent }}%</span>
        </div>
      </div>

      <div class="stat-card" :class="{ 'is-loading': isLoading }">
        <div class="stat-icon pomodoro-icon">⏱️</div>
        <div class="stat-info">
          <div class="stat-value">{{ isLoading ? '-' : totalPomodoros }}</div>
          <div class="stat-label">总番茄钟数</div>
        </div>
        <div class="stat-trend" :class="trend.pomodoros.up ? 'up' : 'down'">
          <span>{{ trend.pomodoros.up ? '↑' : '↓' }} {{ trend.pomodoros.percent }}%</span>
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
                <th>用户</th>
                <th>截止日期</th>
                <th>日程完成</th>
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
                <td>{{ aim.userNickname }}</td>
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
                <div class="aim-stat-label">平均日程数</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 第三行 -->
      <div class="chart-container">
        <div class="chart-header">
          <h2>每日日程完成情况</h2>
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
                <th>新建日程</th>
                <th>完成日程</th>
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
              <div class="active-users-value">{{ activeUserCounts.today }}</div>
              <div class="active-users-label">今日活跃</div>
            </div>
            <div class="active-users-item">
              <div class="active-users-value">{{ activeUserCounts.weekly }}</div>
              <div class="active-users-label">本周活跃</div>
            </div>
            <div class="active-users-item">
              <div class="active-users-value">{{ activeUserCounts.monthly }}</div>
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
  align-items: center;
  justify-content: center;
  padding: 60px 0;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 3px solid transparent;
  border-top-color: var(--primary-color);
  border-right-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 0.8s ease-in-out infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
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

.retry-btn,
.cloud-btn {
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 20px;
  cursor: pointer;
  font-size: 14px;
}

.retry-btn:hover,
.cloud-btn:hover {
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

.aims-table-container {
  overflow-x: auto;
  max-height: 400px;
  overflow-y: auto;
}
</style>