<script setup>
import { ref } from 'vue'
import router from './router'

const currentPath = ref('/dashboard')

// 导航菜单项
const menuItems = [
  { path: '/dashboard', name: '数据统计', icon: 'icon-dashboard' },
  { path: '/users', name: '用户管理', icon: 'icon-user' },
  { path: '/todos', name: '日程管理', icon: 'icon-todo' },
  { path: '/pomodoros', name: '番茄钟管理', icon: 'icon-clock' }
]

// 导航到指定路由
const navigateTo = (path) => {
  currentPath.value = path
  router.push(path)
}
</script>

<template>
  <div class="admin-layout">
    <!-- 侧边栏 -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="logo">
          <span>ToDO管理系统</span>
        </div>
      </div>
      <nav class="menu">
        <div 
          v-for="item in menuItems" 
          :key="item.path" 
          class="menu-item" 
          :class="{ active: currentPath === item.path }"
          @click="navigateTo(item.path)"
        >
          <div class="menu-icon" :class="item.icon"></div>
          <span class="menu-title">{{ item.name }}</span>
        </div>
      </nav>
    </aside>
    <!-- 主内容区 -->
    <div class="main-container">
      <header class="header">
        <div class="header-left">
          <h1 class="page-title">管理后台</h1>
        </div>
        <div class="header-right">
          <div class="user-profile">
            <div class="avatar">管</div>
            <span class="username">管理员</span>
          </div>
        </div>
      </header>
      <main class="content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'Microsoft YaHei', sans-serif;
}

:root {
  --primary-color: #4361ee;
  --primary-light: #4895ef;
  --primary-dark: #3f37c9;
  --accent-color: #f72585;
  --text-color: #2b2d42;
  --text-light: #8d99ae;
  --bg-color: #f8f9fa;
  --sidebar-color: #2b2d42;
  --card-color: #ffffff;
  --border-color: #e9ecef;
  --success-color: #4cc9f0;
  --warning-color: #f8961e;
  --danger-color: #f94144;
  --shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  --border-radius: 8px;
  --transition: all 0.3s ease;
}

body {
  background-color: var(--bg-color);
  color: var(--text-color);
  line-height: 1.6;
}

.admin-layout {
  display: flex;
  min-height: 100vh;
}

/* 侧边栏样式 */
.sidebar {
  width: 240px;
  background-color: var(--sidebar-color);
  color: white;
  transition: var(--transition);
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow);
  z-index: 10;
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
}

.sidebar-header {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 0 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo {
  font-size: 18px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
}

.menu {
  padding: 16px 0;
  flex: 1;
}

.menu-item {
  padding: 12px 16px;
  margin: 4px 8px;
  border-radius: var(--border-radius);
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: var(--transition);
}

.menu-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.menu-item.active {
  background-color: var(--primary-color);
}

.menu-icon {
  width: 20px;
  height: 20px;
  margin-right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.menu-title {
  white-space: nowrap;
}

/* 主内容区样式 */
.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  transition: var(--transition);
  margin-left: 240px;
}

.header {
  height: 64px;
  background-color: var(--card-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  z-index: 5;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
}

.user-profile {
  display: flex;
  align-items: center;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: var(--primary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  margin-right: 10px;
}

.username {
  display: inline;
}

.content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  background-color: var(--bg-color);
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 模拟图标 */
.icon-dashboard::before { content: "📊"; }
.icon-user::before { content: "👥"; }
.icon-todo::before { content: "📝"; }
.icon-clock::before { content: "⏱️"; }
</style>
