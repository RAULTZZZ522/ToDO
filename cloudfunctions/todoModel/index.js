const cloud = require('wx-server-sdk')
   
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database();
const todosCollection = db.collection('todos');

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
    const result = await todosCollection.where({
      _openid: OPENID
    }).get();
    return { code: 0, data: result.data };
  } catch (err) {
    return { code: -1, msg: '获取日程失败', error: err };
  }
}

// 添加新日程
async function addTodo(event, context, wxContext) {
  const OPENID = wxContext.OPENID;
  const { title, description, importance } = event;
  
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
        completed: false
      }
    });
    
    return { code: 0, data: { id: result._id } };
  } catch (err) {
    return { code: -1, msg: '添加日程失败', error: err };
  }
}

// 更新日程
async function updateTodo(event, context, wxContext) {
  const { id, title, description, importance, completed } = event;
  if (!id) return { code: -1, msg: 'ID不能为空' };
  
  try {
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (importance !== undefined) updateData.importance = importance;
    if (completed !== undefined) updateData.completed = completed;
    updateData.updateTime = db.serverDate();
    
    await todosCollection.doc(id).update({ data: updateData });
    return { code: 0, msg: '更新成功' };
  } catch (err) {
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