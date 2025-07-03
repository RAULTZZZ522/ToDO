// 云数据库服务 - 用于与微信小程序云数据库进行交互
// 使用 identityless 模式初始化云开发 SDK

/**
 * 初始化云开发环境
 * @returns {Object} cloud 实例
 */
const initCloud = () => {
  if (typeof window.cloud !== 'undefined') {
    try {
      // 替换为你的小程序 appid 和云环境 id
      const config = {
        resourceAppid: 'wxd98a8015b096ab89', // 替换为实际的小程序 AppID
        resourceEnv: 'cloud1-6gwfqapn723448f9', // 替换为实际的云环境 ID
      };

      // 初始化云
      window.cloud.init(config);
      console.log('云开发环境初始化成功');

      return window.cloud;
    } catch (error) {
      console.error('云开发环境初始化失败:', error);
      return null;
    }
  } else {
    console.error('未检测到云开发 SDK，请确保已引入 cloud.js');
    return null;
  }
};

// 获取初始化好的云对象
export const getCloud = (() => {
  let cloudInstance = null;

  return () => {
    if (!cloudInstance) {
      cloudInstance = initCloud();
    }
    return cloudInstance;
  };
})();

// =========== 待办事项(todos)相关操作 ===========

/**
 * 获取待办事项列表
 * @param {Object} options 查询选项 {limit, skip, where}
 * @returns {Promise} 返回待办事项列表
 */
export const getTodos = (options = {}) => {
  const cloud = getCloud();
  if (!cloud) return Promise.reject(new Error('云环境未初始化'));

  const db = cloud.database();
  const todoCollection = db.collection('todos');

  try {
    let query = todoCollection;

    // 添加查询条件
    if (options.where) {
      query = query.where(options.where);
    }

    // 分页
    if (options.skip) {
      query = query.skip(options.skip);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    // 执行查询
    return query.get()
      .then(res => {
        return res.data;
      })
      .catch(err => {
        console.error('获取待办事项失败:', err);
        throw err;
      });
  } catch (error) {
    console.error('查询待办事项时发生错误:', error);
    return Promise.reject(error);
  }
};

/**
 * 通过ID获取单个待办事项
 * @param {String} id 待办事项ID
 * @returns {Promise} 返回待办事项
 */
export const getTodoById = (id) => {
  const cloud = getCloud();
  if (!cloud) return Promise.reject(new Error('云环境未初始化'));

  const db = cloud.database();
  const todoCollection = db.collection('todos');

  try {
    return todoCollection.doc(id).get()
      .then(res => {
        if (res.data) {
          return res.data;
        } else {
          throw new Error('未找到该待办事项');
        }
      })
      .catch(err => {
        console.error('获取待办事项失败:', err);
        throw err;
      });
  } catch (error) {
    console.error('获取待办事项时发生错误:', error);
    return Promise.reject(error);
  }
};

/**
 * 添加待办事项
 * @param {Object} todo 待办事项数据
 * @returns {Promise} 返回添加结果
 */
export const addTodo = (todo) => {
  const cloud = getCloud();
  if (!cloud) return Promise.reject(new Error('云环境未初始化'));

  const db = cloud.database();
  const todoCollection = db.collection('todos');

  // 添加创建时间和更新时间
  const todoData = {
    ...todo,
    createTime: new Date().toString(),
    updateTime: new Date().toString(),
    completed: todo.completed || false
  };

  try {
    return todoCollection.add({
      data: todoData
    })
      .then(res => {
        console.log('添加待办事项成功', res);
        return res;
      })
      .catch(err => {
        console.error('添加待办事项失败:', err);
        throw err;
      });
  } catch (error) {
    console.error('添加待办事项时发生错误:', error);
    return Promise.reject(error);
  }
};

/**
 * 更新待办事项
 * @param {String} id 待办事项ID
 * @param {Object} data 待更新的数据
 * @returns {Promise} 返回更新结果
 */
export const updateTodo = (id, data) => {
  const cloud = getCloud();
  if (!cloud) return Promise.reject(new Error('云环境未初始化'));

  const db = cloud.database();
  const todoCollection = db.collection('todos');

  // 更新时间
  const updateData = {
    ...data,
    updateTime: new Date().toString()
  };

  try {
    return todoCollection.doc(id).update({
      data: updateData
    })
      .then(res => {
        console.log('更新待办事项成功', res);
        return res;
      })
      .catch(err => {
        console.error('更新待办事项失败:', err);
        throw err;
      });
  } catch (error) {
    console.error('更新待办事项时发生错误:', error);
    return Promise.reject(error);
  }
};

/**
 * 删除待办事项
 * @param {String} id 待办事项ID
 * @returns {Promise} 返回删除结果
 */
export const deleteTodo = (id) => {
  const cloud = getCloud();
  if (!cloud) return Promise.reject(new Error('云环境未初始化'));

  const db = cloud.database();
  const todoCollection = db.collection('todos');

  try {
    return todoCollection.doc(id).remove()
      .then(res => {
        console.log('删除待办事项成功', res);
        return res;
      })
      .catch(err => {
        console.error('删除待办事项失败:', err);
        throw err;
      });
  } catch (error) {
    console.error('删除待办事项时发生错误:', error);
    return Promise.reject(error);
  }
};

// =========== 番茄钟(pomodoro)相关操作 ===========

/**
 * 获取番茄钟列表
 * @param {Object} options 查询选项 {limit, skip, where}
 * @returns {Promise} 返回番茄钟列表
 */
export const getPomodoros = (options = {}) => {
  const cloud = getCloud();
  if (!cloud) return Promise.reject(new Error('云环境未初始化'));

  const db = cloud.database();
  const pomodoroCollection = db.collection('pomodoro');

  try {
    let query = pomodoroCollection;

    // 添加查询条件
    if (options.where) {
      query = query.where(options.where);
    }

    // 分页
    if (options.skip) {
      query = query.skip(options.skip);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    // 执行查询
    return query.get()
      .then(res => {
        return res.data;
      })
      .catch(err => {
        console.error('获取番茄钟记录失败:', err);
        throw err;
      });
  } catch (error) {
    console.error('查询番茄钟记录时发生错误:', error);
    return Promise.reject(error);
  }
};

/**
 * 通过ID获取单个番茄钟记录
 * @param {String} id 番茄钟ID
 * @returns {Promise} 返回番茄钟记录
 */
export const getPomodoroById = (id) => {
  const cloud = getCloud();
  if (!cloud) return Promise.reject(new Error('云环境未初始化'));

  const db = cloud.database();
  const pomodoroCollection = db.collection('pomodoro');

  try {
    return pomodoroCollection.doc(id).get()
      .then(res => {
        if (res.data) {
          return res.data;
        } else {
          throw new Error('未找到该番茄钟记录');
        }
      })
      .catch(err => {
        console.error('获取番茄钟记录失败:', err);
        throw err;
      });
  } catch (error) {
    console.error('获取番茄钟记录时发生错误:', error);
    return Promise.reject(error);
  }
};

/**
 * 添加番茄钟记录
 * @param {Object} pomodoro 番茄钟数据
 * @returns {Promise} 返回添加结果
 */
export const addPomodoro = (pomodoro) => {
  const cloud = getCloud();
  if (!cloud) return Promise.reject(new Error('云环境未初始化'));

  const db = cloud.database();
  const pomodoroCollection = db.collection('pomodoro');

  // 补充必要字段
  const pomodoroData = {
    ...pomodoro,
    starttime: pomodoro.starttime || new Date().toString()
  };

  try {
    return pomodoroCollection.add({
      data: pomodoroData
    })
      .then(res => {
        console.log('添加番茄钟记录成功', res);
        return res;
      })
      .catch(err => {
        console.error('添加番茄钟记录失败:', err);
        throw err;
      });
  } catch (error) {
    console.error('添加番茄钟记录时发生错误:', error);
    return Promise.reject(error);
  }
};

/**
 * 更新番茄钟记录
 * @param {String} id 番茄钟ID
 * @param {Object} data 待更新的数据
 * @returns {Promise} 返回更新结果
 */
export const updatePomodoro = (id, data) => {
  const cloud = getCloud();
  if (!cloud) return Promise.reject(new Error('云环境未初始化'));

  const db = cloud.database();
  const pomodoroCollection = db.collection('pomodoro');

  try {
    return pomodoroCollection.doc(id).update({
      data: data
    })
      .then(res => {
        console.log('更新番茄钟记录成功', res);
        return res;
      })
      .catch(err => {
        console.error('更新番茄钟记录失败:', err);
        throw err;
      });
  } catch (error) {
    console.error('更新番茄钟记录时发生错误:', error);
    return Promise.reject(error);
  }
};

/**
 * 删除番茄钟记录
 * @param {String} id 番茄钟ID
 * @returns {Promise} 返回删除结果
 */
export const deletePomodoro = (id) => {
  const cloud = getCloud();
  if (!cloud) return Promise.reject(new Error('云环境未初始化'));

  const db = cloud.database();
  const pomodoroCollection = db.collection('pomodoro');

  try {
    return pomodoroCollection.doc(id).remove()
      .then(res => {
        console.log('删除番茄钟记录成功', res);
        return res;
      })
      .catch(err => {
        console.error('删除番茄钟记录失败:', err);
        throw err;
      });
  } catch (error) {
    console.error('删除番茄钟记录时发生错误:', error);
    return Promise.reject(error);
  }
};

/**
 * 获取待办事项相关的番茄钟记录
 * @param {String} todoId 待办事项ID
 * @returns {Promise} 返回与待办事项关联的番茄钟列表
 */
export const getPomodorosByTodoId = (todoId) => {
  return getPomodoros({
    where: {
      todo_id: todoId
    }
  });
};

// =========== 目标(aim)相关操作 ===========

/**
 * 获取目标列表
 * @param {Object} options 查询选项 {limit, skip, where}
 * @returns {Promise} 返回目标列表
 */
export const getAims = (options = {}) => {
  const cloud = getCloud();
  if (!cloud) return Promise.reject(new Error('云环境未初始化'));

  const db = cloud.database();
  const aimCollection = db.collection('aims');

  try {
    let query = aimCollection;

    // 添加查询条件
    if (options.where) {
      query = query.where(options.where);
    }

    // 分页
    if (options.skip) {
      query = query.skip(options.skip);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    // 执行查询
    return query.get()
      .then(res => {
        return res.data;
      })
      .catch(err => {
        console.error('获取目标失败:', err);
        throw err;
      });
  } catch (error) {
    console.error('查询目标时发生错误:', error);
    return Promise.reject(error);
  }
};

/**
 * 通过ID获取单个目标
 * @param {String} id 目标ID
 * @returns {Promise} 返回目标
 */
export const getAimById = (id) => {
  const cloud = getCloud();
  if (!cloud) return Promise.reject(new Error('云环境未初始化'));

  const db = cloud.database();
  const aimCollection = db.collection('aims');

  try {
    return aimCollection.doc(id).get()
      .then(res => {
        if (res.data) {
          return res.data;
        } else {
          throw new Error('未找到该目标');
        }
      })
      .catch(err => {
        console.error('获取目标失败:', err);
        throw err;
      });
  } catch (error) {
    console.error('获取目标时发生错误:', error);
    return Promise.reject(error);
  }
};

/**
 * 添加目标
 * @param {Object} aim 目标数据
 * @returns {Promise} 返回添加结果
 */
export const addAim = (aim) => {
  const cloud = getCloud();
  if (!cloud) return Promise.reject(new Error('云环境未初始化'));

  const db = cloud.database();
  const aimCollection = db.collection('aims');

  // 添加创建时间和初始进度
  const aimData = {
    ...aim,
    createTime: aim.createTime || new Date().toString(),
    progress: aim.progress || 0,
    relatedTodos: aim.relatedTodos || []
  };

  try {
    return aimCollection.add({
      data: aimData
    })
      .then(res => {
        console.log('添加目标成功', res);
        return res;
      })
      .catch(err => {
        console.error('添加目标失败:', err);
        throw err;
      });
  } catch (error) {
    console.error('添加目标时发生错误:', error);
    return Promise.reject(error);
  }
};

/**
 * 更新目标
 * @param {String} id 目标ID
 * @param {Object} data 待更新的数据
 * @returns {Promise} 返回更新结果
 */
export const updateAim = (id, data) => {
  const cloud = getCloud();
  if (!cloud) return Promise.reject(new Error('云环境未初始化'));

  const db = cloud.database();
  const aimCollection = db.collection('aims');

  try {
    return aimCollection.doc(id).update({
      data: data
    })
      .then(res => {
        console.log('更新目标成功', res);
        return res;
      })
      .catch(err => {
        console.error('更新目标失败:', err);
        throw err;
      });
  } catch (error) {
    console.error('更新目标时发生错误:', error);
    return Promise.reject(error);
  }
};

/**
 * 删除目标
 * @param {String} id 目标ID
 * @returns {Promise} 返回删除结果
 */
export const deleteAim = (id) => {
  const cloud = getCloud();
  if (!cloud) return Promise.reject(new Error('云环境未初始化'));

  const db = cloud.database();
  const aimCollection = db.collection('aims');

  try {
    return aimCollection.doc(id).remove()
      .then(res => {
        console.log('删除目标成功', res);
        return res;
      })
      .catch(err => {
        console.error('删除目标失败:', err);
        throw err;
      });
  } catch (error) {
    console.error('删除目标时发生错误:', error);
    return Promise.reject(error);
  }
};

/**
 * 为目标添加关联的待办事项
 * @param {String} aimId 目标ID
 * @param {String} todoId 待办事项ID
 * @returns {Promise} 返回更新结果
 */
export const addTodoToAim = async (aimId, todoId) => {
  const cloud = getCloud();
  if (!cloud) return Promise.reject(new Error('云环境未初始化'));

  const db = cloud.database();
  const _ = db.command;
  const aimCollection = db.collection('aims');

  try {
    // 先获取当前目标
    const aim = await getAimById(aimId);

    // 检查todoId是否已存在
    if (aim.relatedTodos && aim.relatedTodos.includes(todoId)) {
      return {
        success: true,
        message: '该待办事项已关联到此目标'
      };
    }

    // 添加todoId到relatedTodos数组
    return aimCollection.doc(aimId).update({
      data: {
        relatedTodos: _.push(todoId)
      }
    })
      .then(res => {
        console.log('添加关联待办事项成功', res);
        return res;
      })
      .catch(err => {
        console.error('添加关联待办事项失败:', err);
        throw err;
      });
  } catch (error) {
    console.error('添加关联待办事项时发生错误:', error);
    return Promise.reject(error);
  }
};

/**
 * 从目标中移除关联的待办事项
 * @param {String} aimId 目标ID
 * @param {String} todoId 待办事项ID
 * @returns {Promise} 返回更新结果
 */
export const removeTodoFromAim = async (aimId, todoId) => {
  const cloud = getCloud();
  if (!cloud) return Promise.reject(new Error('云环境未初始化'));

  const db = cloud.database();
  const aimCollection = db.collection('aims');

  try {
    // 先获取当前目标
    const aim = await getAimById(aimId);

    // 确保relatedTodos存在且是数组
    if (!aim.relatedTodos || !Array.isArray(aim.relatedTodos)) {
      return {
        success: true,
        message: '该目标没有关联的待办事项'
      };
    }

    // 过滤掉要移除的todoId
    const updatedRelatedTodos = aim.relatedTodos.filter(id => id !== todoId);

    // 更新目标的relatedTodos数组
    return aimCollection.doc(aimId).update({
      data: {
        relatedTodos: updatedRelatedTodos
      }
    })
      .then(res => {
        console.log('移除关联待办事项成功', res);
        return res;
      })
      .catch(err => {
        console.error('移除关联待办事项失败:', err);
        throw err;
      });
  } catch (error) {
    console.error('移除关联待办事项时发生错误:', error);
    return Promise.reject(error);
  }
};