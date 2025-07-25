// 云数据库服务 - 用于与微信小程序云数据库进行交互
// 使用 identityless 模式初始化云开发 SDK
import { initCloud } from './cloudService';

// 存储成功的集合名称
let successfulCollections = {
  todos: 'todos',
  pomodoro: 'pomodoro',
  aim: null,
  users: null
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
    console.log('开始获取番茄钟数据');
    const cloud = await initCloud();
    if (!cloud) {
      console.error('云环境未初始化');
      return Promise.reject(new Error('云环境未初始化'));
    }

    console.log('云环境初始化成功，准备查询番茄钟数据');
    const db = cloud.database();

    // 如果之前已经找到了有效的集合名称，直接使用
    if (successfulCollections.pomodoro) {
      console.log(`使用已知有效的番茄钟集合: ${successfulCollections.pomodoro}`);
      try {
        const pomodoroCollection = db.collection(successfulCollections.pomodoro);
        let query = pomodoroCollection;

        // 添加查询条件
        if (options.where) query = query.where(options.where);
        if (options.skip) query = query.skip(options.skip);
        if (options.limit) query = query.limit(options.limit);

        const result = await query.get();
        console.log(`从集合 ${successfulCollections.pomodoro} 获取番茄钟数据成功:`, result);
        return result.data || [];
      } catch (error) {
        console.error(`从已知集合 ${successfulCollections.pomodoro} 获取数据失败，将尝试其他集合:`, error);
        // 重置集合名称，将尝试其他集合
        successfulCollections.pomodoro = null;
      }
    }

    // 尝试不同的集合名称
    // 在微信云开发中，集合名称可能是大小写敏感的
    const possibleCollectionNames = ['pomodoro', 'Pomodoro', 'POMODORO', 'pomodoroList', 'PomodoroList', 'pomodoros', 'Pomodoros'];

    // 尝试列出所有集合（某些 SDK 版本不支持 getCollectionList）
    if (typeof db.getCollectionList === 'function') {
      try {
        console.log('尝试获取所有集合名称');
        const collections = await db.getCollectionList();
        console.log('可用的集合列表:', collections);
        // 如果返回值是数组，将其添加到待尝试的集合名称中
        if (Array.isArray(collections)) {
          collections.forEach(c => {
            if (typeof c === 'string' && !possibleCollectionNames.includes(c)) {
              possibleCollectionNames.push(c);
            } else if (c && c.name && !possibleCollectionNames.includes(c.name)) {
              possibleCollectionNames.push(c.name);
            }
          });
        }
      } catch (listError) {
        console.warn('获取集合列表失败，将使用预定义集合名称:', listError);
      }
    } else {
      console.log('当前 SDK 不支持 db.getCollectionList，跳过列表获取');
    }

    // 尝试从每个可能的集合中获取数据
    let result = [];
    let successCollection = '';

    for (const collectionName of possibleCollectionNames) {
      try {
        console.log(`尝试从集合 ${collectionName} 获取数据`);
        const pomodoroCollection = db.collection(collectionName);

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

        // 尝试获取一条记录以验证集合是否存在且可访问
        const testResult = await query.limit(1).get();
        console.log(`集合 ${collectionName} 测试结果:`, testResult);

        if (testResult && testResult.data && testResult.data.length > 0) {
          // 找到有效集合，执行完整查询
          const fullResult = await query.get();
          result = fullResult.data || [];
          successCollection = collectionName;
          // 存储成功的集合名称以供后续使用
          successfulCollections.pomodoro = collectionName;
          console.log(`成功从集合 ${collectionName} 获取番茄钟数据:`, result);
          break;
        }
      } catch (collectionError) {
        console.warn(`从集合 ${collectionName} 获取数据失败:`, collectionError);
      }
    }

    if (result.length > 0) {
      console.log(`最终从集合 ${successCollection} 获取了 ${result.length} 条番茄钟数据`);
      return result;
    } else {
      console.warn('所有尝试的集合都没有返回番茄钟数据');
      return [];
    }
  } catch (error) {
    console.error('查询番茄钟时发生异常:', error);
    return [];
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
    // 使用找到的有效集合名称
    const collectionName = successfulCollections.pomodoro || 'pomodoro';
    console.log(`获取番茄钟记录，使用集合: ${collectionName}`);

    const pomodoroCollection = db.collection(collectionName);

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
    // 使用找到的有效集合名称
    const collectionName = successfulCollections.pomodoro || 'pomodoro';
    console.log(`添加番茄钟记录，使用集合: ${collectionName}`);

    const pomodoroCollection = db.collection(collectionName);

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
    // 使用找到的有效集合名称
    const collectionName = successfulCollections.pomodoro || 'pomodoro';
    console.log(`更新番茄钟记录，使用集合: ${collectionName}`);

    const pomodoroCollection = db.collection(collectionName);

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
    // 使用找到的有效集合名称
    const collectionName = successfulCollections.pomodoro || 'pomodoro';
    console.log(`删除番茄钟记录，使用集合: ${collectionName}`);

    const pomodoroCollection = db.collection(collectionName);

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
    console.log('开始获取目标数据');
    const cloud = await initCloud();
    if (!cloud) {
      console.error('云环境未初始化');
      return Promise.reject(new Error('云环境未初始化'));
    }

    console.log('云环境初始化成功，准备查询目标数据');
    const db = cloud.database();

    // 如果之前已经找到了有效的集合名称，直接使用
    if (successfulCollections.aim) {
      console.log(`使用已知有效的目标集合: ${successfulCollections.aim}`);
      try {
        const aimCollection = db.collection(successfulCollections.aim);
        let query = aimCollection;

        // 添加查询条件
        if (options.where) query = query.where(options.where);
        if (options.skip) query = query.skip(options.skip);
        if (options.limit) query = query.limit(options.limit);

        const result = await query.get();
        console.log(`从集合 ${successfulCollections.aim} 获取目标数据成功:`, result);
        return result.data || [];
      } catch (error) {
        console.error(`从已知集合 ${successfulCollections.aim} 获取数据失败，将尝试其他集合:`, error);
        // 重置集合名称，将尝试其他集合
        successfulCollections.aim = null;
      }
    }

    // 尝试不同的集合名称
    // 在微信云开发中，集合名称可能是大小写敏感的
    const possibleCollectionNames = ['aim', 'Aim', 'AIM', 'aims', 'Aims', 'AIMS', 'aimList', 'AimList', 'goal', 'goals', 'Goals'];

    // 尝试从每个可能的集合中获取数据
    let result = [];
    let successCollection = '';

    for (const collectionName of possibleCollectionNames) {
      try {
        console.log(`尝试从集合 ${collectionName} 获取数据`);
        const aimCollection = db.collection(collectionName);

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

        // 尝试获取一条记录以验证集合是否存在且可访问
        const testResult = await query.limit(1).get();
        console.log(`集合 ${collectionName} 测试结果:`, testResult);

        if (testResult && testResult.data && testResult.data.length > 0) {
          // 找到有效集合，执行完整查询
          const fullResult = await query.get();
          result = fullResult.data || [];
          successCollection = collectionName;
          // 存储成功的集合名称以供后续使用
          successfulCollections.aim = collectionName;
          console.log(`成功从集合 ${collectionName} 获取目标数据:`, result);
          break;
        }
      } catch (collectionError) {
        console.warn(`从集合 ${collectionName} 获取数据失败:`, collectionError);
      }
    }

    if (result.length > 0) {
      console.log(`最终从集合 ${successCollection} 获取了 ${result.length} 条目标数据`);
      return result;
    } else {
      console.warn('所有尝试的集合都没有返回目标数据');
      return [];
    }
  } catch (error) {
    console.error('查询目标时发生异常:', error);
    return [];
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
    // 使用找到的有效集合名称
    const collectionName = successfulCollections.aim || 'aim';
    console.log(`获取目标记录，使用集合: ${collectionName}`);

    const aimCollection = db.collection(collectionName);

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
    // 使用找到的有效集合名称
    const collectionName = successfulCollections.aim || 'aim';
    console.log(`添加目标，使用集合: ${collectionName}`);

    const aimCollection = db.collection(collectionName);

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
    // 使用找到的有效集合名称
    const collectionName = successfulCollections.aim || 'aim';
    console.log(`更新目标，使用集合: ${collectionName}`);

    const aimCollection = db.collection(collectionName);

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
    // 使用找到的有效集合名称
    const collectionName = successfulCollections.aim || 'aim';
    console.log(`删除目标，使用集合: ${collectionName}`);

    const aimCollection = db.collection(collectionName);

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

// =========== 用户(users)相关操作 ===========

/**
 * 获取用户列表
 * @param {Object} options 查询选项 {limit, skip, where}
 * @returns {Promise} 返回用户列表
 */
export const getUsers = async (options = {}) => {
  try {
    console.log('开始获取用户数据');
    const cloud = await initCloud();
    if (!cloud) {
      console.error('云环境未初始化');
      return Promise.reject(new Error('云环境未初始化'));
    }

    console.log('云环境初始化成功，准备查询用户数据');
    const db = cloud.database();

    // 如果之前已经找到了有效的集合名称，直接使用
    if (successfulCollections.users) {
      console.log(`使用已知有效的用户集合: ${successfulCollections.users}`);
      try {
        const userCollection = db.collection(successfulCollections.users);
        let query = userCollection;

        // 添加查询条件
        if (options.where) query = query.where(options.where);
        if (options.skip) query = query.skip(options.skip);
        if (options.limit) query = query.limit(options.limit);

        const result = await query.get();
        console.log(`从集合 ${successfulCollections.users} 获取用户数据成功:`, result);
        return result.data || [];
      } catch (error) {
        console.error(`从已知集合 ${successfulCollections.users} 获取数据失败，将尝试其他集合:`, error);
        // 重置集合名称，将尝试其他集合
        successfulCollections.users = null;
      }
    }

    // 尝试不同的集合名称
    // 在微信云开发中，集合名称可能是大小写敏感的
    const possibleCollectionNames = ['users', 'Users', 'USERS', 'user', 'User', 'USER', 'userProfile', 'UserProfile', 'wxuser'];

    // 尝试从每个可能的集合中获取数据
    let result = [];
    let successCollection = '';

    for (const collectionName of possibleCollectionNames) {
      try {
        console.log(`尝试从集合 ${collectionName} 获取数据`);
        const userCollection = db.collection(collectionName);

        let query = userCollection;

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

        // 尝试获取一条记录以验证集合是否存在且可访问
        const testResult = await query.limit(1).get();
        console.log(`集合 ${collectionName} 测试结果:`, testResult);

        if (testResult && testResult.data && testResult.data.length > 0) {
          // 找到有效集合，执行完整查询
          const fullResult = await query.get();
          result = fullResult.data || [];
          successCollection = collectionName;
          // 存储成功的集合名称以供后续使用
          successfulCollections.users = collectionName;
          console.log(`成功从集合 ${collectionName} 获取用户数据:`, result);
          break;
        }
      } catch (collectionError) {
        console.warn(`从集合 ${collectionName} 获取数据失败:`, collectionError);
      }
    }

    if (result.length > 0) {
      console.log(`最终从集合 ${successCollection} 获取了 ${result.length} 条用户数据`);
      return result;
    } else {
      // 在用户集合不存在的情况下，尝试从todos和pomodoro集合中提取用户信息
      console.log('尝试从todos和pomodoro集合中提取用户信息');
      try {
        // 确保我们能获取到这些集合的数据
        const todos = await getTodos().catch(() => []);
        const pomodoros = await getPomodoros().catch(() => []);

        // 提取唯一的_openid并构建用户对象
        const userMap = new Map();

        // 从todos中提取
        todos.forEach(todo => {
          if (todo._openid && !userMap.has(todo._openid)) {
            userMap.set(todo._openid, {
              _openid: todo._openid,
              nickname: todo.userNickname || '未知用户',
              avatarUrl: '',
              taskCount: 0,
              completedCount: 0,
              pomodoroCount: 0,
              lastActive: todo.updateTime || todo.createTime || new Date().toString(),
              createTime: todo.createTime || new Date().toString()
            });
          }

          // 更新任务计数
          if (todo._openid && userMap.has(todo._openid)) {
            const user = userMap.get(todo._openid);
            user.taskCount++;
            if (todo.completed) {
              user.completedCount++;
            }

            // 更新最后活跃时间
            const updateTime = new Date(todo.updateTime || todo.createTime);
            const lastActive = new Date(user.lastActive);
            if (updateTime > lastActive) {
              user.lastActive = updateTime.toString();
            }
          }
        });

        // 从pomodoros中提取
        pomodoros.forEach(pomo => {
          if (pomo._openid && !userMap.has(pomo._openid)) {
            userMap.set(pomo._openid, {
              _openid: pomo._openid,
              nickname: pomo.userNickname || '未知用户',
              avatarUrl: '',
              taskCount: 0,
              completedCount: 0,
              pomodoroCount: 0,
              lastActive: pomo.endtime || pomo.starttime || new Date().toString(),
              createTime: pomo.starttime || new Date().toString()
            });
          }

          // 更新番茄钟计数
          if (pomo._openid && userMap.has(pomo._openid)) {
            const user = userMap.get(pomo._openid);
            user.pomodoroCount++;

            // 更新最后活跃时间
            const endTime = new Date(pomo.endtime || pomo.starttime);
            const lastActive = new Date(user.lastActive);
            if (endTime > lastActive) {
              user.lastActive = endTime.toString();
            }
          }
        });

        // 转换为数组
        result = Array.from(userMap.values());
        console.log('从todos和pomodoro集合中提取了用户信息:', result.length);
        return result;
      } catch (extractError) {
        console.error('从其他集合提取用户信息失败:', extractError);
        return [];
      }
    }
  } catch (error) {
    console.error('查询用户时发生异常:', error);
    return [];
  }
}; 