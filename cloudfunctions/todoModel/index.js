const cloud = require('wx-server-sdk')
   
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database();
const todosCollection = db.collection('todos');
const pomodoroCollection = db.collection('pomodoro');
const _ = db.command;

exports.main = async (event, context) => {
  console.log('todoModel function called with event:', event);
  const wxContext = cloud.getWXContext();
  const { type } = event;
  
  // 根据操作类型调用不同的方法
  try {
    switch (type) {
      case 'getTodos':
        return await getTodos(event, context, wxContext);
      case 'addTodo':
        return await addTodo(event, context, wxContext);
      case 'updateTodo':
        return await updateTodo(event, context, wxContext);
      case 'deleteTodo':
        return await deleteTodo(event, context, wxContext);
      case 'getPomodoroStats':
        return await getPomodoroStats(event, context, wxContext);
      case 'getDailyPomodoroStats':
        return await getDailyPomodoroStats(event, context, wxContext);
      case 'getPomodoroDistribution':
        return await getPomodoroDistribution(event, context, wxContext);
      default:
        return { code: -1, msg: '未知的操作类型: ' + type };
    }
  } catch (err) {
    return { code: -1, msg: '操作失败', error: err };
  }
}

// 获取用户的所有日程
async function getTodos(event, context, wxContext) {
  const OPENID = wxContext.OPENID;
  try {
    console.log('Getting todos for OPENID:', OPENID);
    const result = await todosCollection.where({
      _openid: OPENID
    }).get();
    
    // 确保所有记录都有tomatoCount字段
    const data = result.data.map(item => {
      if (item.tomatoCount === undefined) {
        item.tomatoCount = 0;
      }
      return item;
    });
    
    console.log('Todos retrieved:', data);
    return { code: 0, data: data };
  } catch (err) {
    console.error('Error getting todos:', err);
    return { code: -1, msg: '获取日程失败', error: err };
  }
}

// 添加新日程
async function addTodo(event, context, wxContext) {
  const OPENID = wxContext.OPENID;
  const { title, description, importance, tomatoDuration, tomatoCount, tomatoTotalTime, category } = event;
  
  if (!title) {
    return { code: -1, msg: '标题不能为空' };
  }
  
  try {
    const now = db.serverDate();
    const result = await todosCollection.add({
      data: {
        _openid: OPENID,
        title,
        description: description || '',
        importance: importance || 3,
        createTime: now,
        updateTime: now,
        completed: false,
        tomatoDuration: tomatoDuration || 25,
        tomatoCount: tomatoCount || 0,
        tomatoTotalTime: tomatoTotalTime || 0,
        category: category || '学习'
      }
    });
    
    return { code: 0, data: { id: result._id } };
  } catch (err) {
    return { code: -1, msg: '添加日程失败', error: err };
  }
}

// 更新日程
async function updateTodo(event, context, wxContext) {
  const { id, title, description, importance, completed, tomatoDuration, tomatoCount, tomatoTotalTime, category } = event;
  if (!id) return { code: -1, msg: 'ID不能为空' };
  
  try {
    console.log('Updating todo with ID:', id);
    console.log('Update data:', event);
    
    // 检查是否存在要更新的记录
    const checkResult = await todosCollection.doc(id).get();
    if (!checkResult.data) {
      return { code: -1, msg: '找不到要更新的记录' };
    }
    
    console.log('Found existing todo:', checkResult.data);
    
    // 只更新提供的字段
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (importance !== undefined) updateData.importance = importance;
    if (completed !== undefined) updateData.completed = completed;
    if (tomatoDuration !== undefined) updateData.tomatoDuration = tomatoDuration;
    if (tomatoCount !== undefined) updateData.tomatoCount = tomatoCount;
    if (tomatoTotalTime !== undefined) updateData.tomatoTotalTime = tomatoTotalTime;
    if (category !== undefined) updateData.category = category;
    updateData.updateTime = db.serverDate();
    
    console.log('Fields to update:', updateData);
    
    await todosCollection.doc(id).update({ data: updateData });
    console.log('Update successful');
    return { code: 0, msg: '更新成功' };
  } catch (err) {
    console.error('Update failed:', err);
    return { code: -1, msg: '更新日程失败', error: err };
  }
}

// 删除日程
async function deleteTodo(event, context, wxContext) {
  const { id } = event;
  if (!id) return { code: -1, msg: 'ID不能为空' };
  
  try {
    await todosCollection.doc(id).remove();
    return { code: 0, msg: '删除成功' };
  } catch (err) {
    return { code: -1, msg: '删除日程失败', error: err };
  }
}

// 获取用户番茄钟统计数据
async function getPomodoroStats(event, context, wxContext) {
  const OPENID = wxContext.OPENID;
  try {
    // 获取模拟数据
    const pomodoroData = await generateMockPomodoroData(OPENID);
    
    // 计算统计数据
    let totalCount = pomodoroData.length;
    let totalDuration = 0;
    
    // 使用Set收集不同的日期以计算使用天数
    const usedDays = new Set();
    
    pomodoroData.forEach(item => {
      // 计算总时长（毫秒）
      const duration = item.endTime - item.startTime;
      totalDuration += duration;
      
      // 收集使用的日期
      const date = new Date(item.startTime).toLocaleDateString();
      usedDays.add(date);
    });
    
    // 转换为分钟
    const totalMinutes = Math.floor(totalDuration / 60000);
    // 日均时长（分钟）
    const dailyAverage = usedDays.size > 0 ? Math.floor(totalMinutes / usedDays.size) : 0;
    
    return {
      code: 0,
      data: {
        totalCount,
        totalMinutes,
        dailyAverage,
        usedDays: usedDays.size
      }
    };
  } catch (err) {
    return { code: -1, msg: '获取统计数据失败', error: err };
  }
}

// 获取当日番茄钟统计数据
async function getDailyPomodoroStats(event, context, wxContext) {
  const OPENID = wxContext.OPENID;
  const { date } = event; // 格式: YYYY-MM-DD
  
  try {
    // 获取模拟数据
    const pomodoroData = await generateMockPomodoroData(OPENID);
    
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    
    const nextDay = new Date(targetDate);
    nextDay.setDate(targetDate.getDate() + 1);
    
    // 过滤当日数据
    const dailyData = pomodoroData.filter(item => {
      const itemDate = new Date(item.startTime);
      return itemDate >= targetDate && itemDate < nextDay;
    });
    
    // 计算当日专注次数和总时长
    let dailyCount = dailyData.length;
    let dailyDuration = 0;
    
    dailyData.forEach(item => {
      const duration = item.endTime - item.startTime;
      dailyDuration += duration;
    });
    
    // 转换为分钟
    const dailyMinutes = Math.floor(dailyDuration / 60000);
    
    return {
      code: 0,
      data: {
        date: targetDate.toISOString().split('T')[0],
        count: dailyCount,
        minutes: dailyMinutes
      }
    };
  } catch (err) {
    return { code: -1, msg: '获取当日统计数据失败', error: err };
  }
}

// 获取番茄钟时间分布
async function getPomodoroDistribution(event, context, wxContext) {
  const OPENID = wxContext.OPENID;
  const { type } = event; // 'day', 'week', 'month'
  
  try {
    // 获取模拟数据
    const pomodoroData = await generateMockPomodoroData(OPENID);
    
    let distribution = [];
    const now = new Date();
    
    if (type === 'day') {
      // 按小时统计当天数据
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      
      // 初始化24小时的数据
      for (let i = 0; i < 24; i++) {
        distribution.push({
          label: `${i}时`,
          minutes: 0
        });
      }
      
      // 过滤当天数据并按小时统计
      pomodoroData.filter(item => {
        const itemDate = new Date(item.startTime);
        return itemDate >= today && itemDate < tomorrow;
      }).forEach(item => {
        const hour = new Date(item.startTime).getHours();
        const duration = (item.endTime - item.startTime) / 60000; // 转为分钟
        distribution[hour].minutes += Math.floor(duration);
      });
    } else if (type === 'week') {
      // 计算本周的起始日期（周一为起始）
      const dayOfWeek = now.getDay() || 7; // 将0（周日）转换为7
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - dayOfWeek + 1);
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      
      // 初始化周一到周日的数据
      const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
      for (let i = 0; i < 7; i++) {
        distribution.push({
          label: dayNames[i],
          minutes: 0
        });
      }
      
      // 过滤本周数据并按日期统计
      pomodoroData.filter(item => {
        const itemDate = new Date(item.startTime);
        return itemDate >= weekStart && itemDate < weekEnd;
      }).forEach(item => {
        const day = new Date(item.startTime).getDay() || 7;
        const duration = (item.endTime - item.startTime) / 60000;
        distribution[day-1].minutes += Math.floor(duration);
      });
    } else if (type === 'month') {
      // 计算本月的天数
      const year = now.getFullYear();
      const month = now.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      // 初始化本月每一天的数据
      for (let i = 1; i <= daysInMonth; i++) {
        distribution.push({
          label: `${i}日`,
          minutes: 0
        });
      }
      
      // 过滤本月数据并按日期统计
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 1);
      
      pomodoroData.filter(item => {
        const itemDate = new Date(item.startTime);
        return itemDate >= monthStart && itemDate < monthEnd;
      }).forEach(item => {
        const date = new Date(item.startTime).getDate();
        const duration = (item.endTime - item.startTime) / 60000;
        distribution[date-1].minutes += Math.floor(duration);
      });
    }
    
    return {
      code: 0,
      data: distribution
    };
  } catch (err) {
    return { code: -1, msg: '获取分布数据失败', error: err };
  }
}

// 生成模拟的番茄钟数据
async function generateMockPomodoroData(openid) {
  // 生成过去30天内的随机番茄钟数据
  const mockData = [];
  const now = new Date();
  
  // 每天生成1-5个番茄钟记录
  for (let i = 0; i < 30; i++) {
    const day = new Date(now);
    day.setDate(now.getDate() - i);
    day.setHours(0, 0, 0, 0);
    
    const recordCount = Math.floor(Math.random() * 5) + 1;
    
    for (let j = 0; j < recordCount; j++) {
      // 随机时间（8:00-22:00之间）
      const hour = Math.floor(Math.random() * 14) + 8;
      const minute = Math.floor(Math.random() * 60);
      
      const startTime = new Date(day);
      startTime.setHours(hour, minute, 0, 0);
      
      // 随机时长（15-45分钟）
      const durationMinutes = Math.floor(Math.random() * 31) + 15;
      const endTime = new Date(startTime);
      endTime.setMinutes(startTime.getMinutes() + durationMinutes);
      
      // 随机任务名称
      const tasks = ['学习', '工作', '阅读', '写作', '思考', '规划'];
      const taskIndex = Math.floor(Math.random() * tasks.length);
      
      mockData.push({
        _openid: openid,
        startTime: startTime.getTime(),
        endTime: endTime.getTime(),
        task: tasks[taskIndex],
        completed: true
      });
    }
  }
  
  return mockData;
}