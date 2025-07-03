import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { initCloud, loadCloudScript } from './services/cloudService'

// 确保云开发SDK已加载，然后初始化云环境
const initApp = async () => {
  // 先尝试加载云开发SDK
  await loadCloudScript();

  // 初始化云环境
  const cloud = await initCloud();
  if (cloud) {
    console.log('云环境初始化成功，应用启动');
  } else {
    console.error('云环境初始化失败，应用可能无法正常工作');
  }

  // 创建并挂载Vue应用
  const app = createApp(App);
  app.use(router);
  app.mount('#app');
};

// 启动应用
initApp();
