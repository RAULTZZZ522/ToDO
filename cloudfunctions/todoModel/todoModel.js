// todo对象（日程）
// {
//   _id: String,           // 唯一标识（数据库自动生成）
//   _openid: String,       // 用户的openid
//   title: String,         // 日程标题
//   description: String,   // 日程描述
//   importance: Number,    // 重要程度（1-5）
//   createTime: Date,      // 创建时间
//   updateTime: Date,      // 更新时间
//   completed: Boolean,    // 是否完成
//   category: String,      // 类别
//   tomatoDuration: Number // 番茄钟时长（分钟）
//   tomatoCount: Number,   // 已完成的番茄钟数量
//   tomatoTotalTime: Number // 总番茄钟时间（分钟）
// }

// aim对象（目标）
// {
//   _id: String,           // 唯一标识（数据库自动生成）
//   _openid: String,       // 用户的openid
//   title: String,         // 目标标题
//   description: String,   // 目标描述
//   category: String,      // 类别（与日程一致）
//   totalTime: Number,     // 总需要时间（分钟）
//   relatedTodos: Array,   // 相关日程IDs
//   createTime: Date,      // 创建时间
//   deadline: Date,        // 完成时限
//   progress: Number       // 完成进度（0-100）
// }

const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();
const todosCollection = db.collection('todos');
const aimsCollection = db.collection('aims');
const _ = db.command;

// 获取用户的所有日程
exports.getTodos = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  
  try {
    const result = await todosCollection.where({
      _openid: OPENID
    }).get();
    
    return {
      code: 0,
      data: result.data
    };
  } catch (err) {
    return {
      code: -1,
      msg: '获取日程失败',
      err
    };
  }
};

// 添加新日程
exports.addTodo = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const { 
    title, 
    description, 
    importance, 
    category, 
    tomatoDuration 
  } = event;
  
  if (!title) {
    return {
      code: -1,
      msg: '标题不能为空'
    };
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
        category: category || '学习',
        tomatoDuration: tomatoDuration || 25,
        tomatoCount: 0, // 初始化为0
        tomatoTotalTime: 0 // 初始化为0
      }
    });
    
    return {
      code: 0,
      data: {
        id: result._id
      }
    };
  } catch (err) {
    return {
      code: -1,
      msg: '添加日程失败',
      err
    };
  }
};

// 更新日程
exports.updateTodo = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const { 
    id, 
    title, 
    description, 
    importance, 
    completed, 
    category,
    tomatoDuration,
    tomatoCount,
    tomatoTotalTime
  } = event;
  
  if (!id) {
    return {
      code: -1,
      msg: 'ID不能为空'
    };
  }
  
  try {
    const updateData = {};
    
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (importance !== undefined) updateData.importance = importance;
    if (completed !== undefined) updateData.completed = completed;
    if (category !== undefined) updateData.category = category;
    if (tomatoDuration !== undefined) updateData.tomatoDuration = tomatoDuration;
    
    // 处理番茄钟计数和总时长
    if (tomatoCount !== undefined) {
      if (typeof tomatoCount === 'object' && tomatoCount._inc) {
        // 如果是增量操作
        updateData.tomatoCount = _.inc(tomatoCount._inc);
      } else {
        // 如果是直接设置值
        updateData.tomatoCount = tomatoCount;
      }
    }
    
    if (tomatoTotalTime !== undefined) {
      if (typeof tomatoTotalTime === 'object' && tomatoTotalTime._inc) {
        // 如果是增量操作
        updateData.tomatoTotalTime = _.inc(tomatoTotalTime._inc);
      } else {
        // 如果是直接设置值
        updateData.tomatoTotalTime = tomatoTotalTime;
      }
    }
    
    updateData.updateTime = db.serverDate();
    
    await todosCollection.doc(id).update({
      data: updateData
    });
    
    return {
      code: 0,
      msg: '更新成功'
    };
  } catch (err) {
    return {
      code: -1,
      msg: '更新日程失败',
      err
    };
  }
};

// 删除日程
exports.deleteTodo = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const { id } = event;
  
  if (!id) {
    return {
      code: -1,
      msg: 'ID不能为空'
    };
  }
  
  try {
    await todosCollection.doc(id).remove();
    
    return {
      code: 0,
      msg: '删除成功'
    };
  } catch (err) {
    return {
      code: -1,
      msg: '删除日程失败',
      err
    };
  }
};

// 获取用户的所有目标
exports.getAims = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  
  try {
    const result = await aimsCollection.where({
      _openid: OPENID
    }).get();
    
    return {
      code: 0,
      data: result.data
    };
  } catch (err) {
    return {
      code: -1,
      msg: '获取目标失败',
      err
    };
  }
};

// 添加新目标
exports.addAim = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const { 
    title, 
    description, 
    category, 
    totalTime,
    relatedTodos,
    deadline 
  } = event;
  
  if (!title) {
    return {
      code: -1,
      msg: '标题不能为空'
    };
  }
  
  try {
    const now = db.serverDate();
    const result = await aimsCollection.add({
      data: {
        _openid: OPENID,
        title,
        description: description || '',
        category: category || '学习',
        totalTime: totalTime || 0,
        relatedTodos: relatedTodos || [],
        createTime: now,
        deadline: deadline ? new Date(deadline) : null,
        progress: 0
      }
    });
    
    return {
      code: 0,
      data: {
        id: result._id
      }
    };
  } catch (err) {
    return {
      code: -1,
      msg: '添加目标失败',
      err
    };
  }
};

// 更新目标
exports.updateAim = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const { 
    id, 
    title, 
    description, 
    category,
    totalTime,
    relatedTodos,
    deadline,
    progress
  } = event;
  
  console.log('更新目标，参数:', event);
  
  if (!id) {
    console.error('ID为空');
    return {
      code: -1,
      msg: 'ID不能为空'
    };
  }
  
  try {
    // 先获取当前目标的信息
    const currentAim = await aimsCollection.doc(id).get();
    console.log('当前目标信息:', currentAim.data);
    
    if (!currentAim.data) {
      console.error('目标不存在:', id);
      return {
        code: -1,
        msg: '目标不存在'
      };
    }
    
    const updateData = {};
    
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (totalTime !== undefined) updateData.totalTime = totalTime;
    
    // 特殊处理relatedTodos数组
    if (relatedTodos !== undefined) {
      // 确保relatedTodos是数组
      let safeRelatedTodos = [];
      
      if (Array.isArray(relatedTodos)) {
        safeRelatedTodos = relatedTodos;
      } else if (typeof relatedTodos === 'string') {
        // 尝试解析JSON字符串
        try {
          const parsed = JSON.parse(relatedTodos);
          safeRelatedTodos = Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          console.error('解析relatedTodos字符串失败:', e);
          // 如果是单个ID，尝试作为单元素数组处理
          if (relatedTodos.trim() !== '') {
            safeRelatedTodos = [relatedTodos];
          }
        }
      }
      
      console.log('处理后的relatedTodos:', safeRelatedTodos);
      updateData.relatedTodos = safeRelatedTodos;
    }
    
    if (deadline !== undefined) {
      if (deadline) {
        updateData.deadline = new Date(deadline);
      } else {
        updateData.deadline = null;
      }
    }
    
    if (progress !== undefined) updateData.progress = progress;
    
    console.log('最终更新数据:', updateData);
    
    // 执行更新操作
    await aimsCollection.doc(id).update({
      data: updateData
    });
    
    console.log('更新目标成功');
    return {
      code: 0,
      msg: '更新成功'
    };
  } catch (err) {
    console.error('更新目标失败:', err);
    return {
      code: -1,
      msg: '更新目标失败',
      err
    };
  }
};

// 删除目标
exports.deleteAim = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const { id } = event;
  
  if (!id) {
    return {
      code: -1,
      msg: 'ID不能为空'
    };
  }
  
  try {
    await aimsCollection.doc(id).remove();
    
    return {
      code: 0,
      msg: '删除成功'
    };
  } catch (err) {
    return {
      code: -1,
      msg: '删除目标失败',
      err
    };
  }
};

// 根据关联的日程番茄钟记录自动计算目标进度
exports.updateAimProgress = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const { aimId } = event;
  
  console.log('开始计算目标进度，aimId:', aimId, 'OPENID:', OPENID);
  
  if (!aimId) {
    console.error('目标ID为空');
    return {
      code: -1,
      msg: '目标ID不能为空'
    };
  }
  
  try {
    // 1. 获取目标信息
    console.log('正在获取目标信息...');
    const aimResult = await aimsCollection.doc(aimId).get();
    const aim = aimResult.data;
    
    console.log('目标完整信息:', JSON.stringify(aim));
    
    if (!aim) {
      console.error('目标不存在:', aimId);
      return {
        code: -1,
        msg: '目标不存在'
      };
    }
    
    // 确保 relatedTodos 是有效数组
    let relatedTodos = [];
    
    if (aim.relatedTodos) {
      if (Array.isArray(aim.relatedTodos)) {
        relatedTodos = aim.relatedTodos;
      } else if (typeof aim.relatedTodos === 'string') {
        try {
          // 尝试解析JSON字符串
          const parsed = JSON.parse(aim.relatedTodos);
          relatedTodos = Array.isArray(parsed) ? parsed : [aim.relatedTodos];
        } catch (e) {
          // 解析失败，可能是单个ID字符串
          relatedTodos = [aim.relatedTodos];
        }
      }
    }
    
    console.log('处理后的目标关联日程IDs:', relatedTodos);
    
    // 如果目标没有关联日程，直接返回
    if (relatedTodos.length === 0) {
      console.log('目标没有关联日程，不需要更新进度');
      return {
        code: 0,
        msg: '目标没有关联日程',
        data: {
          progress: aim.progress || 0
        }
      };
    }
    
    // 2. 获取所有关联日程的番茄钟记录
    const pomodoroCollection = db.collection('pomodoro');
    
    console.log('正在查询关联日程的番茄钟记录...');
    
    // 直接循环查询每个日程的番茄钟记录，避免_.in操作可能的问题
    let allRecords = [];
    for (const todoId of relatedTodos) {
      if (!todoId) continue; // 跳过空ID
      
      console.log(`查询日程ID: ${todoId} 的番茄钟记录`);
      try {
        const result = await pomodoroCollection.where({
          _openid: OPENID,
          todoId: todoId
        }).get();
        
        console.log(`日程ID: ${todoId} 的番茄钟记录数量:`, result.data.length);
        allRecords = allRecords.concat(result.data);
      } catch (err) {
        console.error(`查询日程ID: ${todoId} 的番茄钟记录失败:`, err);
      }
    }
    
    console.log('查询到的所有番茄钟记录数量:', allRecords.length);
    
    // 3. 计算总时长
    let totalMinutes = 0;
    allRecords.forEach(record => {
      if (record.duration) {
        const duration = parseInt(record.duration) || 0;
        totalMinutes += duration;
        console.log(`记录ID ${record._id} 持续时间: ${duration}分钟`);
      } else if (record.startTime && record.endTime) {
        // 如果有开始和结束时间，但没有持续时间，则计算持续时间（分钟）
        const duration = Math.round((record.endTime - record.startTime) / (1000 * 60));
        totalMinutes += duration;
        console.log(`记录ID ${record._id} 计算持续时间: ${duration}分钟 (${new Date(record.startTime)} - ${new Date(record.endTime)})`);
      }
    });
    
    console.log('番茄钟总时长:', totalMinutes, '分钟');
    console.log('目标总时间:', aim.totalTime);
    
    // 4. 计算进度百分比
    let progress = 0;
    const totalTimeNumber = parseInt(aim.totalTime) || 1; // 避免除以零
    
    if (totalTimeNumber > 0) {
      progress = Math.min(Math.round((totalMinutes / totalTimeNumber) * 100), 100);
      console.log(`进度计算: ${totalMinutes} / ${totalTimeNumber} * 100 = ${progress}%`);
    } else {
      console.log('目标总时长为0或未设置，进度为0%');
    }
    
    // 5. 更新目标进度
    console.log('正在更新目标进度...');
    await aimsCollection.doc(aimId).update({
      data: {
        progress: progress
      }
    });
    
    console.log('目标进度更新成功');
    return {
      code: 0,
      msg: '更新进度成功',
      data: {
        progress: progress,
        totalMinutes: totalMinutes
      }
    };
  } catch (err) {
    console.error('更新目标进度失败:', err);
    return {
      code: -1,
      msg: '更新目标进度失败',
      err
    };
  }
};

// 手动设置目标进度
exports.setAimProgress = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const { aimId, progress } = event;
  
  console.log('手动设置目标进度，aimId:', aimId, 'progress:', progress);
  
  if (!aimId) {
    return {
      code: -1,
      msg: '目标ID不能为空'
    };
  }
  
  if (progress === undefined || progress < 0 || progress > 100) {
    return {
      code: -1,
      msg: '进度值无效，应为0-100之间的数字'
    };
  }
  
  try {
    // 直接更新目标进度
    await aimsCollection.doc(aimId).update({
      data: {
        progress: progress
      }
    });
    
    console.log('手动设置目标进度成功');
    return {
      code: 0,
      msg: '设置进度成功',
      data: {
        progress: progress
      }
    };
  } catch (err) {
    console.error('设置目标进度失败:', err);
    return {
      code: -1,
      msg: '设置目标进度失败',
      err
    };
  }
};

// 专门用于关联日程到目标的函数
exports.linkTodosToAim = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const { aimId, todoIds } = event;
  
  console.log('关联日程到目标，参数:', event);
  
  if (!aimId) {
    console.error('目标ID为空');
    return {
      code: -1,
      msg: '目标ID不能为空'
    };
  }
  
  // 确保todoIds是数组
  let validTodoIds = [];
  
  if (Array.isArray(todoIds)) {
    validTodoIds = todoIds.filter(id => id && typeof id === 'string');
  } else if (typeof todoIds === 'string') {
    try {
      const parsed = JSON.parse(todoIds);
      validTodoIds = Array.isArray(parsed) ? parsed.filter(id => id && typeof id === 'string') : [];
    } catch (e) {
      // 如果不是JSON，可能是单个ID
      if (todoIds.trim()) {
        validTodoIds = [todoIds.trim()];
      }
    }
  }
  
  console.log('处理后的todoIds:', validTodoIds);
  
  try {
    // 获取目标信息
    const aimResult = await aimsCollection.doc(aimId).get();
    const aim = aimResult.data;
    
    if (!aim) {
      console.error('目标不存在:', aimId);
      return {
        code: -1,
        msg: '目标不存在'
      };
    }
    
    console.log('目标信息:', aim);
    
    // 直接更新目标的relatedTodos字段
    await aimsCollection.doc(aimId).update({
      data: {
        relatedTodos: validTodoIds
      }
    });
    
    console.log('关联日程成功');
    
    return {
      code: 0,
      msg: '关联日程成功',
      data: {
        relatedTodos: validTodoIds
      }
    };
  } catch (err) {
    console.error('关联日程失败:', err);
    return {
      code: -1,
      msg: '关联日程失败',
      error: err
    };
  }
}; 