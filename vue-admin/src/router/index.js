import { createRouter, createWebHistory } from 'vue-router'

// 导入页面组件
import Dashboard from '../views/Dashboard.vue'
import UserManagement from '../views/UserManagement.vue'
import TodoManagement from '../views/TodoManagement.vue'
import PomodoroManagement from '../views/PomodoroManagement.vue'
import Login from '../views/Login.vue'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: Login
  },
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  {
    path: '/users',
    name: 'users',
    component: UserManagement,
    meta: { requiresAuth: true }
  },
  {
    path: '/todos',
    name: 'todos',
    component: TodoManagement,
    meta: { requiresAuth: true }
  },
  {
    path: '/pomodoros',
    name: 'pomodoros',
    component: PomodoroManagement,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 全局导航守卫：未登录管理员则重定向至登录页
router.beforeEach((to, from, next) => {
  if (to.path === '/login') return next()

  const loggedIn = localStorage.getItem('adminLoggedIn') === 'true'
  if (to.meta && to.meta.requiresAuth && !loggedIn) {
    return next({ path: '/login' })
  }
  next()
})

export default router 