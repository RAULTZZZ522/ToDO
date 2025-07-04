// 云开发服务 - 处理云开发SDK的初始化

// 云实例
let cloudInstance = null;

/**
 * 检查云开发SDK是否已加载
 * @returns {boolean} SDK是否已加载
 */
const isCloudSdkLoaded = () => {
  return typeof window !== 'undefined' && window.cloud !== undefined;
};

/**
 * 等待云开发SDK加载
 * @param {number} timeout 超时时间（毫秒）
 * @returns {Promise<boolean>} SDK是否已加载
 */
const waitForCloudSdk = (timeout = 5000) => {
  return new Promise(resolve => {
    // 如果SDK已加载，立即返回
    if (isCloudSdkLoaded()) {
      return resolve(true);
    }

    // 设置检查间隔
    const startTime = Date.now();
    const interval = setInterval(() => {
      // 检查SDK是否已加载
      if (isCloudSdkLoaded()) {
        clearInterval(interval);
        return resolve(true);
      }

      // 检查是否超时
      if (Date.now() - startTime > timeout) {
        clearInterval(interval);
        console.error('等待云开发SDK加载超时，请检查是否正确引入cloud.js');
        return resolve(false);
      }
    }, 100);
  });
};

/**
 * 动态加载云开发SDK脚本
 * @returns {Promise<boolean>} 加载是否成功
 */
export const loadCloudScript = () => {
  return new Promise((resolve) => {
    // 如果已加载，直接返回成功
    if (isCloudSdkLoaded()) {
      return resolve(true);
    }

    // 创建script标签
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://web-9gikcbug35bad3a8-1304825656.tcloudbaseapp.com/sdk/1.3.0/cloud.js';

    // 成功加载回调
    script.onload = () => {
      console.log('云开发SDK加载成功');
      resolve(true);
    };

    // 加载失败回调
    script.onerror = () => {
      console.error('云开发SDK加载失败');

      // 尝试使用备用链接
      const backupScript = document.createElement('script');
      backupScript.type = 'text/javascript';
      backupScript.src = 'https://cdn.jsdelivr.net/npm/tcb-js-sdk@latest';

      backupScript.onload = () => {
        console.log('云开发SDK备用链接加载成功');
        resolve(true);
      };

      backupScript.onerror = () => {
        console.error('云开发SDK备用链接加载失败');
        resolve(false);
      };

      document.head.appendChild(backupScript);
    };

    // 添加script标签到页面
    document.head.appendChild(script);
  });
};

/**
 * 初始化云开发环境
 * @returns {Promise<Object>} 返回初始化后的cloud实例
 */
export const initCloud = async () => {
  try {
    console.log('开始初始化云环境...');

    // 确保SDK已加载
    const sdkLoaded = await waitForCloudSdk();
    if (!sdkLoaded) {
      console.log('SDK未加载，尝试动态加载');
      // 尝试动态加载SDK
      const scriptLoaded = await loadCloudScript();
      if (!scriptLoaded) {
        console.error('云开发SDK加载失败，无法初始化云环境');
        return null;
      }

      // 等待SDK完全加载
      const waitResult = await waitForCloudSdk();
      if (!waitResult) {
        console.error('等待SDK加载超时');
        return null;
      }
      console.log('SDK加载成功');
    } else {
      console.log('SDK已加载');
    }

    // 如果已存在cloud实例，则直接返回
    if (cloudInstance) {
      console.log('云环境已初始化，直接返回实例');
      return cloudInstance;
    }

    console.log('创建新的cloud实例');
    // 创建新的cloud实例
    cloudInstance = new window.cloud.Cloud({
      // 必填，表示是未登录模式
      identityless: true,
      // 资源方 AppID
      resourceAppid: 'wxd98a8015b096ab89', // 替换为实际的小程序 AppID
      resourceEnv: 'cloud1-6gwfqapn723448f9', // 替换为实际的云环境 ID
    });

    // 初始化云环境，必须等待init完成
    console.log('开始初始化云实例...');
    await cloudInstance.init();
    console.log('云开发环境初始化成功');

    // 检查云实例状态
    if (!cloudInstance) {
      console.error('云实例初始化后为空');
      return null;
    }

    try {
      // 测试数据库连接
      console.log('测试数据库连接...');
      const db = cloudInstance.database();

      // 尝试一个简单的查询以验证连接
      const testResult = await db.collection('todos').limit(1).get();
      console.log('数据库连接测试成功:', testResult);
    } catch (dbError) {
      console.warn('数据库连接测试失败，但继续使用云实例:', dbError);
      // 即使测试失败也返回云实例，不中断流程
    }

    return cloudInstance;
  } catch (error) {
    console.error('云开发环境初始化失败，详细错误:', error);
    // 如果初始化失败，尝试重置云实例
    cloudInstance = null;

    // 重试一次初始化
    try {
      console.log('尝试重新初始化云环境...');
      cloudInstance = new window.cloud.Cloud({
        identityless: true,
        resourceAppid: 'wxd98a8015b096ab89',
        resourceEnv: 'cloud1-6gwfqapn723448f9',
      });

      await cloudInstance.init();
      console.log('云环境重新初始化成功');
      return cloudInstance;
    } catch (retryError) {
      console.error('云环境重新初始化也失败:', retryError);
      cloudInstance = null;
      return null;
    }
  }
}; 