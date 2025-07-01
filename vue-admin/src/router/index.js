import { createRouter, createWebHistory } from 'vue-router'

// 导入页面组件
import Dashboard from '../views/Dashboard.vue'
import UserManagement from '../views/UserManagement.vue'
import TodoManagement from '../views/TodoManagement.vue'
import PomodoroManagement from '../views/PomodoroManagement.vue'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: Dashboard
  },
  {
    path: '/users',
    name: 'users',
    component: UserManagement
  },
  {
    path: '/todos',
    name: 'todos',
    component: TodoManagement
  },
  {
    path: '/pomodoros',
    name: 'pomodoros',
    component: PomodoroManagement
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router 