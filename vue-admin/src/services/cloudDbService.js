// 云数据库服务 - 用于与微信小程序云数据库进行交互
// 使用 identityless 模式初始化云开发 SDK
import { initCloud } from './cloudService';

// 保存watcher引用，方便后续管理
const watchers = {
  todos: null,
  pomodoro: null,
  aim: null
};

/**
 * 监听数据库集合的变化
 * @param {String} collectionName 集合名称
 * @param {Function} onChange 数据变化时的回调函数
 * @returns {Promise<Object>} 返回watcher对象，可用于取消监听
 */
export const watchCollection = async (collectionName, onChange) => {
  try {
    const cloud = await initCloud();
    if (!cloud) {
      return Promise.reject(new Error('云环境未初始化'));
    }

    const db = cloud.database();

    // 如果已有watcher，先关闭
    if (watchers[collectionName]) {
      await watchers[collectionName].close();
    }

    // 创建新的watcher
    const watcher = db.collection(collectionName).watch({
      onChange: (snapshot) => {
        console.log(`${collectionName}集合数据变化:`, snapshot);
        if (typeof onChange === 'function') {
          onChange(snapshot);
        }
      },
      onError: (err) => {
        console.error(`监听${collectionName}集合失败:`, err);
      }
    });

    // 保存watcher引用
    watchers[collectionName] = watcher;

    return watcher;
  } catch (error) {
    console.error(`设置${collectionName}集合监听时发生错误:`, error);
    return Promise.reject(error);
  }
};

/**
 * 取消监听数据库集合
 * @param {String} collectionName 集合名称
 */
export const unwatchCollection = async (collectionName) => {
  if (watchers[collectionName]) {
    try {
      await watchers[collectionName].close();
      watchers[collectionName] = null;
      console.log(`已取消对${collectionName}集合的监听`);
    } catch (error) {
      console.error(`取消${collectionName}集合监听时发生错误:`, error);
    }
  }
};

/**
 * 调用云函数
 * @param {String} name 云函数名称
 * @param {Object} data 传递给云函数的参数
 * @returns {Promise} 返回云函数执行结果
 */
export const callCloudFunction = async (name, data = {}) => {
  try {
    const cloud = await initCloud();
    if (!cloud) {
      return Promise.reject(new Error('云环境未初始化'));
    }

    return cloud.callFunction({
      name,
      data
    }).then(res => {
      console.log(`云函数 ${name} 调用成功:`, res);
      return res;
    }).catch(err => {
      console.error(`云函数 ${name} 调用失败:`, err);
      throw err;
    });
  } catch (error) {
    console.error(`调用云函数 ${name} 时发生错误:`, error);
    return Promise.reject(error);
  }
};

// =========== 待办事项(todos)相关操作 ===========

/**
 * 获取待办事项列表
 * @param {Object} options 查询选项 {limit, skip, where}
 * @returns {Promise} 返回待办事项列表
 */
export const getTodos = async (options = {}) => {
  try {
    const cloud = await initCloud();
    if (!cloud) {
      return Promise.reject(new Error('云环境未初始化'));
    }

    const db = cloud.database();
    const todoCollection = db.collection('todos');

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
export const getTodoById = async (id) => {
  try {
    const cloud = await initCloud();
    if (!cloud) {
      return Promise.reject(new Error('云环境未初始化'));
    }

    const db = cloud.database();
    const todoCollection = db.collection('todos');

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
export const addTodo = async (todo) => {
  try {
    const cloud = await initCloud();
    if (!cloud) {
      return Promise.reject(new Error('云环境未初始化'));
    }

    const db = cloud.database();
    const todoCollection = db.collection('todos');

    // 添加创建时间和更新时间
    const todoData = {
      ...todo,
      createTime: new Date().toString(),
      updateTime: new Date().toString(),
      completed: todo.completed || false
    };

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
export const updateTodo = async (id, data) => {
  try {
    const cloud = await initCloud();
    if (!cloud) {
      return Promise.reject(new Error('云环境未初始化'));
    }

    const db = cloud.database();
    const todoCollection = db.collection('todos');

    // 更新时间
    const updateData = {
      ...data,
      updateTime: new Date().toString()
    };

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
export const deleteTodo = async (id) => {
  try {
    const cloud = await initCloud();
    if (!cloud) {
      return Promise.reject(new Error('云环境未初始化'));
    }

    const db = cloud.database();
    const todoCollection = db.collection('todos');

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
export const getPomodoros = async (options = {}) => {
  try {
    const cloud = await initCloud();
    if (!cloud) {
      return Promise.reject(new Error('云环境未初始化'));
    }

    const db = cloud.database();
    const pomodoroCollection = db.collection('pomodoro');

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
export const getPomodoroById = async (id) => {
  try {
    const cloud = await initCloud();
    if (!cloud) {
      return Promise.reject(new Error('云环境未初始化'));
    }

    const db = cloud.database();
    const pomodoroCollection = db.collection('pomodoro');

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
export const addPomodoro = async (pomodoro) => {
  try {
    const cloud = await initCloud();
    if (!cloud) {
      return Promise.reject(new Error('云环境未初始化'));
    }

    const db = cloud.database();
    const pomodoroCollection = db.collection('pomodoro');

    // 补充必要字段
    const pomodoroData = {
      ...pomodoro,
      starttime: pomodoro.starttime || new Date().toString()
    };

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
export const updatePomodoro = async (id, data) => {
  try {
    const cloud = await initCloud();
    if (!cloud) {
      return Promise.reject(new Error('云环境未初始化'));
    }

    const db = cloud.database();
    const pomodoroCollection = db.collection('pomodoro');

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
export const deletePomodoro = async (id) => {
  try {
    const cloud = await initCloud();
    if (!cloud) {
      return Promise.reject(new Error('云环境未初始化'));
    }

    const db = cloud.database();
    const pomodoroCollection = db.collection('pomodoro');

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
export const getAims = async (options = {}) => {
  try {
    const cloud = await initCloud();
    if (!cloud) {
      return Promise.reject(new Error('云环境未初始化'));
    }

    const db = cloud.database();
    const aimCollection = db.collection('aim');

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
export const getAimById = async (id) => {
  try {
    const cloud = await initCloud();
    if (!cloud) {
      return Promise.reject(new Error('云环境未初始化'));
    }

    const db = cloud.database();
    const aimCollection = db.collection('aim');

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
export const addAim = async (aim) => {
  try {
    const cloud = await initCloud();
    if (!cloud) {
      return Promise.reject(new Error('云环境未初始化'));
    }

    const db = cloud.database();
    const aimCollection = db.collection('aim');

    // 添加创建时间和初始进度
    const aimData = {
      ...aim,
      createTime: aim.createTime || new Date().toString(),
      progress: aim.progress || 0,
      relatedTodos: aim.relatedTodos || []
    };

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
export const updateAim = async (id, data) => {
  try {
    const cloud = await initCloud();
    if (!cloud) {
      return Promise.reject(new Error('云环境未初始化'));
    }

    const db = cloud.database();
    const aimCollection = db.collection('aim');

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
export const deleteAim = async (id) => {
  try {
    const cloud = await initCloud();
    if (!cloud) {
      return Promise.reject(new Error('云环境未初始化'));
    }

    const db = cloud.database();
    const aimCollection = db.collection('aim');

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
  try {
    const cloud = await initCloud();
    if (!cloud) {
      return Promise.reject(new Error('云环境未初始化'));
    }

    const db = cloud.database();
    const _ = db.command;
    const aimCollection = db.collection('aim');

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
  try {
    const cloud = await initCloud();
    if (!cloud) {
      return Promise.reject(new Error('云环境未初始化'));
    }

    const db = cloud.database();
    const aimCollection = db.collection('aim');

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