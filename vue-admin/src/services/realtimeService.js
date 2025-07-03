// 实时数据监听服务
import { initCloud } from './cloudService';

// 存储所有活跃的监听器
const activeWatchers = new Map();

/**
 * 开始监听集合的变更
 * @param {String} collectionName 集合名称
 * @param {Function} onChange 数据变更回调
 * @param {Object} options 监听选项
 * @returns {Promise<Object>} 返回监听器对象
 */
export const startWatching = async (collectionName, onChange, options = {}) => {
  try {
    // 获取云实例
    const cloud = await initCloud();
    if (!cloud) {
      return Promise.reject(new Error('云环境未初始化，无法开始监听'));
    }

    // 如果已有监听器，先关闭
    if (activeWatchers.has(collectionName)) {
      await stopWatching(collectionName);
    }

    // 创建数据库引用
    const db = cloud.database();
    const collection = db.collection(collectionName);

    // 准备查询条件
    let query = collection;

    // 添加过滤条件
    if (options.where) {
      query = query.where(options.where);
    }

    // 限制返回数量
    if (options.limit) {
      query = query.limit(options.limit);
    }

    // 排序
    if (options.orderBy) {
      query = query.orderBy(options.orderBy.field, options.orderBy.direction || 'desc');
    }

    console.log(`开始监听集合: ${collectionName}`);

    // 开始监听
    const watcher = query.watch({
      // 数据变更时触发
      onChange: function (snapshot) {
        console.log(`集合 ${collectionName} 数据变更:`, snapshot);

        if (typeof onChange === 'function') {
          // 将变更传递给回调函数
          onChange(snapshot);
        }
      },
      // 监听开始事件
      onOpen: function () {
        console.log(`集合 ${collectionName} 监听开始`);
      },
      // 错误处理
      onError: function (error) {
        console.error(`集合 ${collectionName} 监听错误:`, error);
      }
    });

    // 保存监听器引用
    activeWatchers.set(collectionName, watcher);

    return watcher;
  } catch (error) {
    console.error(`创建集合 ${collectionName} 监听失败:`, error);
    return Promise.reject(error);
  }
};

/**
 * 停止监听集合变更
 * @param {String} collectionName 集合名称
 * @returns {Promise<boolean>} 是否成功停止监听
 */
export const stopWatching = async (collectionName) => {
  // 获取监听器
  const watcher = activeWatchers.get(collectionName);

  if (!watcher) {
    console.warn(`未找到集合 ${collectionName} 的监听器`);
    return true;
  }

  try {
    // 关闭监听
    await watcher.close();
    console.log(`集合 ${collectionName} 监听已停止`);

    // 从活跃监听器列表中移除
    activeWatchers.delete(collectionName);

    return true;
  } catch (error) {
    console.error(`停止集合 ${collectionName} 监听失败:`, error);
    return false;
  }
};

/**
 * 关闭所有活跃的监听
 * @returns {Promise<boolean>} 是否成功关闭所有监听
 */
export const stopAllWatchers = async () => {
  try {
    // 获取所有集合名称
    const collections = [...activeWatchers.keys()];

    // 依次关闭每个监听器
    for (const collectionName of collections) {
      await stopWatching(collectionName);
    }

    return true;
  } catch (error) {
    console.error('关闭所有监听失败:', error);
    return false;
  }
}; 