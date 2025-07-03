const cloud = require('wx-server-sdk')
const todoModel = require('./todoModel')
   
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database();
const todosCollection = db.collection('todos');
const pomodoroCollection = db.collection('pomodoro');
const aimsCollection = db.collection('aims');
const _ = db.command;

exports.main = async (event, context) => {
  console.log('todoModel function called with event:', event);
  const wxContext = cloud.getWXContext();
  const { type } = event;
  
  // 根据操作类型调用不同的方法
  try {
    if (!type) {
      console.error('缺少必要的type参数');
      return { code: -1, msg: '缺少必要的type参数' };
    }
    
    console.log(`处理操作类型: ${type}`);
    
    switch (type) {
      case 'getTodos':
        return await todoModel.getTodos(event, context);
      case 'addTodo':
        return await todoModel.addTodo(event, context);
      case 'updateTodo':
        return await todoModel.updateTodo(event, context);
      case 'deleteTodo':
        return await todoModel.deleteTodo(event, context);
      case 'getAims':
        return await todoModel.getAims(event, context);
      case 'addAim':
        return await todoModel.addAim(event, context);
      case 'updateAim':
        console.log('处理updateAim请求，参数:', event);
        const result = await todoModel.updateAim(event, context);
        console.log('updateAim处理结果:', result);
        return result;
      case 'deleteAim':
        return await todoModel.deleteAim(event, context);
      case 'linkTodosToAim':
        console.log('处理linkTodosToAim请求，参数:', event);
        try {
          const linkResult = await todoModel.linkTodosToAim(event, context);
          console.log('linkTodosToAim处理结果:', linkResult);
          return linkResult;
        } catch (error) {
          console.error('linkTodosToAim处理出错:', error);
          return { code: -1, msg: '关联日程失败', error };
        }
      case 'updateAimProgress':
        console.log('处理updateAimProgress请求，参数:', event);
        try {
          const progressResult = await todoModel.updateAimProgress(event, context);
          console.log('updateAimProgress处理结果:', progressResult);
          return progressResult;
        } catch (error) {
          console.error('updateAimProgress处理出错:', error);
          return { code: -1, msg: '更新目标进度失败', error };
        }
      case 'setAimProgress':
        console.log('处理setAimProgress请求，参数:', event);
        try {
          const setProgressResult = await todoModel.setAimProgress(event, context);
          console.log('setAimProgress处理结果:', setProgressResult);
          return setProgressResult;
        } catch (error) {
          console.error('setAimProgress处理出错:', error);
          return { code: -1, msg: '设置目标进度失败', error };
        }
      // 仍然保留其他原有的函数
      case 'getPomodoroStats':
        return await getPomodoroStats(event, context);
      case 'getDailyPomodoroStats':
        return await getDailyPomodoroStats(event, context);
      case 'getPomodoroDistribution':
        return await getPomodoroDistribution(event, context);
      case 'addTomatoRecord':
        return await addTomatoRecord(event, context);
      case 'getTomatoRecords':
        return await getTomatoRecords(event, context);
      default:
        console.error('未知的操作类型:', type);
        return { code: -1, msg: '未知的操作类型: ' + type };
    }
  } catch (err) {
    console.error('操作失败:', err);
    return { code: -1, msg: '操作失败', error: err };
  }
}

// 获取用户番茄钟统计数据
async function getPomodoroStats(event, context) {
  const wxContext = cloud.getWXContext();
  const OPENID = wxContext.OPENID;
  
  try {
    // 获取用户的所有番茄钟记录
    const result = await pomodoroCollection.where({
      _openid: OPENID
    }).get();
    
    const records = result.data;
    
    // 计算统计数据
    let totalCount = records.length;
    let totalDuration = 0;
    
    // 使用Set收集不同的日期以计算使用天数
    const usedDays = new Set();
    
    records.forEach(item => {
      // 计算总时长（分钟）
      totalDuration += item.duration || 0;
      
      // 收集使用的日期
      const date = new Date(item.startTime).toLocaleDateString();
      usedDays.add(date);
    });
    
    // 日均时长（分钟）
    const dailyAverage = usedDays.size > 0 ? Math.floor(totalDuration / usedDays.size) : 0;
    
    return {
      code: 0,
      data: {
        totalCount,
        totalMinutes: totalDuration,
        dailyAverage,
        usedDays: usedDays.size
      }
    };
  } catch (err) {
    console.error('Failed to get pomodoro stats:', err);
    return { code: -1, msg: '获取统计数据失败', error: err };
  }
}

// 获取当日番茄钟统计数据
async function getDailyPomodoroStats(event, context) {
  const wxContext = cloud.getWXContext();
  const OPENID = wxContext.OPENID;
  const { date } = event; // 格式: YYYY-MM-DD
  
  try {
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    
    const nextDay = new Date(targetDate);
    nextDay.setDate(targetDate.getDate() + 1);
    
    // 查询指定日期范围内的番茄钟记录
    const result = await pomodoroCollection.where({
      _openid: OPENID,
      startTime: _.gte(targetDate.getTime()).and(_.lt(nextDay.getTime()))
    }).get();
    
    const records = result.data;
    
    // 计算当日专注次数和总时长
    let dailyCount = records.length;
    let dailyDuration = 0;
    
    records.forEach(item => {
      dailyDuration += item.duration || 0;
    });
    
    return {
      code: 0,
      data: {
        date: targetDate.toISOString().split('T')[0],
        count: dailyCount,
        minutes: dailyDuration
      }
    };
  } catch (err) {
    console.error('Failed to get daily pomodoro stats:', err);
    return { code: -1, msg: '获取当日统计数据失败', error: err };
  }
}

// 获取番茄钟时间分布
async function getPomodoroDistribution(event, context) {
  const wxContext = cloud.getWXContext();
  const OPENID = wxContext.OPENID;
  const { type } = event; // 'day', 'week', 'month'
  
  try {
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
      
      // 查询当天的番茄钟记录
      const result = await pomodoroCollection.where({
        _openid: OPENID,
        startTime: _.gte(today.getTime()).and(_.lt(tomorrow.getTime()))
      }).get();
      
      // 按小时统计
      result.data.forEach(item => {
        const hour = new Date(item.startTime).getHours();
        const duration = item.duration || 0;
        distribution[hour].minutes += duration;
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
      
      // 查询本周的番茄钟记录
      const result = await pomodoroCollection.where({
        _openid: OPENID,
        startTime: _.gte(weekStart.getTime()).and(_.lt(weekEnd.getTime()))
      }).get();
      
      // 按日期统计
      result.data.forEach(item => {
        const day = new Date(item.startTime).getDay() || 7;
        const duration = item.duration || 0;
        distribution[day-1].minutes += duration;
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
      
      // 计算本月的起始和结束时间
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 1);
      
      // 查询本月的番茄钟记录
      const result = await pomodoroCollection.where({
        _openid: OPENID,
        startTime: _.gte(monthStart.getTime()).and(_.lt(monthEnd.getTime()))
      }).get();
      
      // 按日期统计
      result.data.forEach(item => {
        const date = new Date(item.startTime).getDate();
        const duration = item.duration || 0;
        distribution[date-1].minutes += duration;
      });
    }
    
    return {
      code: 0,
      data: distribution
    };
  } catch (err) {
    console.error('Failed to get pomodoro distribution:', err);
    return { code: -1, msg: '获取分布数据失败', error: err };
  }
}

// 添加番茄钟记录
async function addTomatoRecord(event, context) {
  const wxContext = cloud.getWXContext();
  const OPENID = wxContext.OPENID;
  const { record } = event;
  
  console.log('添加番茄钟记录，参数:', record);
  
  if (!record || !record.todoId) {
    console.error('记录数据不完整');
    return { code: -1, msg: '记录数据不完整' };
  }
  
  try {
    // 添加用户ID和创建时间
    record._openid = OPENID;
    record.createTime = db.serverDate();
    
    // 保存到番茄钟记录集合
    const result = await pomodoroCollection.add({
      data: record
    });
    
    console.log('添加番茄钟记录成功:', result);
    
    // 查找与该日程关联的所有目标
    console.log('查询与日程关联的目标，todoId:', record.todoId);
    const relatedAims = await aimsCollection.where({
      _openid: OPENID,
      relatedTodos: record.todoId
    }).get();
    
    console.log('找到关联的目标:', relatedAims.data);
    
    // 更新所有关联目标的进度
    if (relatedAims.data && relatedAims.data.length > 0) {
      console.log(`开始更新 ${relatedAims.data.length} 个关联目标的进度`);
      
      for (const aim of relatedAims.data) {
        console.log(`更新目标 ${aim._id} 的进度`);
        
        try {
          const updateResult = await todoModel.updateAimProgress({
            aimId: aim._id
          }, context);
          
          console.log(`目标 ${aim._id} 进度更新结果:`, updateResult);
        } catch (err) {
          console.error(`更新目标 ${aim._id} 进度失败:`, err);
        }
      }
      
      console.log('所有关联目标进度更新完成');
    } else {
      console.log('没有找到关联的目标，无需更新进度');
    }
    
    return { code: 0, data: { id: result._id } };
  } catch (err) {
    console.error('添加番茄钟记录失败:', err);
    return { code: -1, msg: '添加番茄钟记录失败', error: err };
  }
}

// 获取番茄钟记录
async function getTomatoRecords(event, context) {
  const wxContext = cloud.getWXContext();
  const OPENID = wxContext.OPENID;
  const { todoId, startDate, endDate, limit } = event;
  
  try {
    let query = pomodoroCollection.where({
      _openid: OPENID
    });
    
    // 如果指定了todoId，则只查询该todo的记录
    if (todoId) {
      query = query.where({
        todoId: todoId
      });
    }
    
    // 如果指定了日期范围，则按日期范围查询
    if (startDate && endDate) {
      const startTimestamp = new Date(startDate).getTime();
      const endTimestamp = new Date(endDate).getTime();
      
      query = query.where({
        startTime: _.gte(startTimestamp).and(_.lte(endTimestamp))
      });
    }
    
    // 按时间倒序排列，最新的记录在前面
    query = query.orderBy('startTime', 'desc');
    
    // 如果指定了限制数量，则限制返回的记录数
    if (limit) {
      query = query.limit(limit);
    }
    
    const result = await query.get();
    console.log('Retrieved tomato records:', result.data);
    
    return { code: 0, data: result.data };
  } catch (err) {
    console.error('Failed to get tomato records:', err);
    return { code: -1, msg: '获取番茄钟记录失败', error: err };
  }
}