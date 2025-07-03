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
    // 确保SDK已加载
    const sdkLoaded = await waitForCloudSdk();
    if (!sdkLoaded) {
      // 尝试动态加载SDK
      const scriptLoaded = await loadCloudScript();
      if (!scriptLoaded) {
        console.error('云开发SDK加载失败，无法初始化云环境');
        return null;
      }

      // 等待SDK完全加载
      await waitForCloudSdk();
    }

    // 如果已存在cloud实例，则直接返回
    if (cloudInstance) {
      return cloudInstance;
    }

    // 创建新的cloud实例
    cloudInstance = new window.cloud.Cloud({
      // 必填，表示是未登录模式
      identityless: true,
      // 资源方 AppID
      resourceAppid: 'wxd98a8015b096ab89', // 替换为实际的小程序 AppID
      resourceEnv: 'cloud1-6gwfqapn723448f9', // 替换为实际的云环境 ID
    });

    // 初始化云环境，必须等待init完成
    await cloudInstance.init();
    console.log('云开发环境初始化成功');

    return cloudInstance;
  } catch (error) {
    console.error('云开发环境初始化失败:', error);
    cloudInstance = null;
    return null;
  }
}; 