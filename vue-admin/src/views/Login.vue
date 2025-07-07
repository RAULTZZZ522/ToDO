<script setup>
import { ref } from 'vue'
import { loginAdmin } from '../services/authService'
import router from '../router'

// 登录状态相关响应式数据
const openidInput = ref('')      // openid 账号
const passwordInput = ref('')    // 密码
const statusMessage = ref('')    // 状态提示

// 提交 openid 并验证是否为管理员
const handleLogin = async () => {
  if (!openidInput.value || !passwordInput.value) {
    statusMessage.value = '请输入 openid 和密码'
    return
  }
  statusMessage.value = '正在验证管理员账号...'
  const isAdmin = await loginAdmin(openidInput.value, passwordInput.value)
  if (isAdmin) {
    // 缓存登录信息
    localStorage.setItem('adminLoggedIn', 'true')
    localStorage.setItem('adminOpenId', openidInput.value)
    statusMessage.value = '登录成功，即将进入后台...'
    // 跳转到后台首页
    router.push('/dashboard')
  } else {
    statusMessage.value = '账号或密码错误，或该账号无管理员权限'
  }
}
</script>

<template>
  <div class="login-container">
    <h2 class="title">管理员登录</h2>
    <input v-model="openidInput" placeholder="请输入 openid" class="input" />
    <input v-model="passwordInput" type="password" placeholder="请输入密码" class="input" />
    <button class="login-btn" @click="handleLogin">登录</button>

    <p class="status">{{ statusMessage }}</p>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: #f0f2f5;
}

.title {
  font-size: 24px;
  margin-bottom: 24px;
}

.input {
  width: 260px;
  padding: 8px 12px;
  margin-bottom: 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  outline: none;
}

.login-btn {
  width: 260px;
  padding: 8px 0;
  background: #409eff;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.status {
  margin-top: 16px;
  color: #ff4d4f;
}
</style>