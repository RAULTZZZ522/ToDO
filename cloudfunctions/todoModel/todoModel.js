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
        tomatoDuration: tomatoDuration || 25
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
    tomatoDuration
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
    if (category !== undefined) updateData.category = category;
    if (totalTime !== undefined) updateData.totalTime = totalTime;
    if (relatedTodos !== undefined) updateData.relatedTodos = relatedTodos;
    if (deadline !== undefined) updateData.deadline = new Date(deadline);
    if (progress !== undefined) updateData.progress = progress;
    
    await aimsCollection.doc(id).update({
      data: updateData
    });
    
    return {
      code: 0,
      msg: '更新成功'
    };
  } catch (err) {
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