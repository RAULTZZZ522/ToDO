// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  // 环境 ID
  env: "cloud1-6gwfqapn723448f9"
})

// 云函数入口函数
exports.main = async (event, context) => {
  const db = cloud.database()
  const _ = db.command

  // 获取用户ID，如果没有传入，则使用默认值（不限制用户）
  const userId = event.userId || null

  try {
    // 准备查询条件
    const condition = userId ? { _openid: userId } : {}

    // 并行查询各个集合的数据
    const [todos, aims, pomodoros] = await Promise.all([
      db.collection('todos').where(condition).get(),
      db.collection('aim').where(condition).get(),
      db.collection('pomodoro').where(condition).get()
    ])

    // 待办事项统计
    const todoStats = {
      total: todos.data.length,
      completed: todos.data.filter(todo => todo.completed).length,
      incomplete: todos.data.filter(todo => !todo.completed).length,
      importanceDistribution: {
        high: todos.data.filter(todo => todo.importance === 3).length,
        medium: todos.data.filter(todo => todo.importance === 2).length,
        low: todos.data.filter(todo => todo.importance === 1).length
      }
    }

    // 目标统计
    const aimStats = {
      total: aims.data.length,
      inProgress: aims.data.filter(aim => aim.progress < 100).length,
      completed: aims.data.filter(aim => aim.progress === 100).length,
      categoryDistribution: {}
    }

    // 计算每个分类的数量
    aims.data.forEach(aim => {
      const category = aim.category || '未分类'
      aimStats.categoryDistribution[category] = (aimStats.categoryDistribution[category] || 0) + 1
    })

    // 番茄钟统计
    const pomodoroStats = {
      total: pomodoros.data.length,
      totalMinutes: 0,
      averageDuration: 0
    }

    // 计算总时长和平均时长
    if (pomodoros.data.length > 0) {
      let totalMinutes = 0

      pomodoros.data.forEach(pomodoro => {
        const startTime = pomodoro.starttime ? new Date(pomodoro.starttime) : null
        const endTime = pomodoro.endtime ? new Date(pomodoro.endtime) : null

        if (startTime && endTime) {
          const durationMinutes = (endTime - startTime) / (1000 * 60)
          totalMinutes += durationMinutes
        }
      })

      pomodoroStats.totalMinutes = Math.round(totalMinutes)
      pomodoroStats.averageDuration = Math.round(totalMinutes / pomodoros.data.length)
    }

    // 返回统计数据
    return {
      success: true,
      userId: userId || 'all',
      stats: {
        todos: todoStats,
        aims: aimStats,
        pomodoros: pomodoroStats,
        timestamp: new Date().toISOString()
      }
    }

  } catch (error) {
    console.error('统计数据生成失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
} 