const cloud = require('wx-server-sdk')
const todoModel = require('./todoModel')
   
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database();
const todosCollection = db.collection('todos');
const pomodoroCollection = db.collection('pomodoro');
const aimsCollection = db.collection('aims');
const _ = db.command;

// 确保必要的集合存在
async function ensureCollectionsExist() {
  try {
    console.log('开始检查集合是否存在');
    
    // 尝试获取集合列表
    let collections;
    try {
      collections = await db.listCollections().get();
      console.log('成功获取集合列表');
    } catch (listErr) {
      console.error('获取集合列表失败:', listErr);
      // 如果无法获取列表，假设集合不存在并尝试创建
      collections = { data: [] };
    }
    
    const collectionNames = collections.data.map(col => col.name);
    
    console.log('现有集合:', collectionNames);
    
    // 检查pomodoro集合是否存在，如果不存在则创建
    if (!collectionNames.includes('pomodoro')) {
      console.log('pomodoro集合不存在，尝试创建');
      try {
        await db.createCollection('pomodoro');
        console.log('pomodoro集合创建成功');
      } catch (createErr) {
        // 如果创建失败，可能是因为集合已经存在
        console.error('创建pomodoro集合失败:', createErr);
        
        // 尝试直接使用集合，看是否可以访问
        try {
          const testQuery = await pomodoroCollection.limit(1).get();
          console.log('尽管创建失败，但pomodoro集合可以访问');
          return true;
        } catch (accessErr) {
          console.error('无法访问pomodoro集合:', accessErr);
          return false;
        }
      }
    } else {
      console.log('pomodoro集合已存在');
    }
    
    return true;
  } catch (err) {
    console.error('检查或创建集合失败，详细错误:', err);
    // 即使检查失败，也尝试继续执行，因为集合可能已经存在
    return true;
  }
}

exports.main = async (event, context) => {
  console.log('todoModel function called with event:', event);
  const wxContext = cloud.getWXContext();
  const { type } = event;
  
  // 确保必要的集合存在
  await ensureCollectionsExist();
  
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
      case 'updateTomatoRecord':
        return await updateTomatoRecord(event, context);
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
  console.log('用户OpenID:', OPENID);
  
  if (!OPENID) {
    console.error('未获取到用户OpenID');
    return { code: -1, msg: '未获取到用户OpenID' };
  }
  
  if (!record || !record.todoId) {
    console.error('记录数据不完整');
    return { code: -1, msg: '记录数据不完整' };
  }
  
  try {
    // 确保pomodoro集合存在
    const collectionsExist = await ensureCollectionsExist();
    console.log('集合检查结果:', collectionsExist);
    
    // 添加用户ID
    record._openid = OPENID;
    
    // 确保开始时间存在
    if (!record.startTime) {
      console.error('缺少开始时间');
      return { code: -1, msg: '缺少开始时间' };
    }
    
    // 如果endTime存在且有startTime，计算duration
    if (record.startTime && record.endTime) {
      if (!record.duration) {
        record.duration = Math.round((record.endTime - record.startTime) / (1000 * 60));
        console.log('根据时间计算的持续时间:', record.duration, '分钟');
      }
    } else if (!record.endTime && record.inProgress) {
      // 如果是进行中的记录，endTime可以为null
      console.log('创建进行中的番茄钟记录，endTime为null');
    }
    
    // 检查记录是否已存在（避免重复保存）
    let query = pomodoroCollection.where({
      _openid: OPENID,
      todoId: record.todoId,
      startTime: record.startTime
    });
    
    // 如果有结束时间，也加入查询条件
    if (record.endTime) {
      query = query.where({
        endTime: record.endTime
      });
    } else if (record.inProgress) {
      // 如果没有结束时间，查找inProgress为true的记录
      query = query.where({
        inProgress: true
      });
    }
    
    console.log('执行查询检查是否有重复记录');
    let existingRecords;
    try {
      existingRecords = await query.get();
      console.log('查询成功，结果:', existingRecords.data);
    } catch (queryErr) {
      console.error('查询失败:', queryErr);
      // 继续执行，不阻止创建记录
      existingRecords = { data: [] };
    }
    
    if (existingRecords.data && existingRecords.data.length > 0) {
      console.log('记录已存在，不重复保存');
      return { code: 0, data: { id: existingRecords.data[0]._id, existing: true } };
    }
    
    // 添加创建时间
    const recordWithCreateTime = {
      ...record,
      createTime: db.serverDate()
    };
    
    // 确保必要字段有默认值
    if (record.inProgress && !record.endTime) {
      recordWithCreateTime.endTime = null;
    }
    
    if (!recordWithCreateTime.duration && record.inProgress) {
      // 如果是进行中的记录，使用预计时长
      recordWithCreateTime.duration = record.duration || 25; // 默认25分钟
    }
    
    console.log('准备添加到pomodoro集合的记录:', recordWithCreateTime);
    
    // 保存到番茄钟记录集合
    console.log('开始添加记录到数据库');
    const result = await pomodoroCollection.add({
      data: recordWithCreateTime
    });
    
    console.log('添加番茄钟记录成功:', result);
    
    // 如果是已完成的记录，才更新todo的番茄钟计数
    if (record.todoId && record.duration && record.completed) {
      console.log('更新todo番茄钟计数');
      try {
        const todoUpdateResult = await todosCollection.doc(record.todoId).update({
          data: {
            tomatoCount: _.inc(1),
            tomatoTotalTime: _.inc(record.duration),
            updateTime: db.serverDate()
          }
        });
        console.log('更新todo番茄钟计数结果:', todoUpdateResult);
      } catch (todoErr) {
        console.error('更新todo番茄钟计数失败:', todoErr);
        // 不影响主流程，继续执行
      }
    }
    
    // 如果是已完成的记录，才更新关联目标的进度
    if (record.completed) {
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
    }
    
    return { code: 0, data: { id: result._id } };
  } catch (err) {
    console.error('添加番茄钟记录失败，详细错误:', err);
    return { code: -1, msg: '添加番茄钟记录失败: ' + (err.message || JSON.stringify(err)) };
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

// 更新番茄钟记录
async function updateTomatoRecord(event, context) {
  const wxContext = cloud.getWXContext();
  const OPENID = wxContext.OPENID;
  const { recordId, updateData } = event;
  
  console.log('更新番茄钟记录，参数:', { recordId, updateData });
  
  if (!recordId) {
    console.error('记录ID不能为空');
    return { code: -1, msg: '记录ID不能为空' };
  }
  
  if (!updateData) {
    console.error('更新数据不能为空');
    return { code: -1, msg: '更新数据不能为空' };
  }
  
  try {
    // 检查记录是否存在
    const recordCheck = await pomodoroCollection.doc(recordId).get();
    
    if (!recordCheck.data) {
      console.error('番茄钟记录不存在:', recordId);
      return { code: -1, msg: '番茄钟记录不存在' };
    }
    
    // 确保只能更新自己的记录
    if (recordCheck.data._openid !== OPENID) {
      console.error('无权更新此番茄钟记录');
      return { code: -1, msg: '无权更新此番茄钟记录' };
    }
    
    // 更新记录
    const result = await pomodoroCollection.doc(recordId).update({
      data: updateData
    });
    
    console.log('更新番茄钟记录成功:', result);
    
    return {
      code: 0,
      msg: '更新成功',
      data: {
        updated: true
      }
    };
  } catch (err) {
    console.error('更新番茄钟记录失败:', err);
    return { code: -1, msg: '更新番茄钟记录失败', error: err };
  }
}