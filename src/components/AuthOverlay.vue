<script setup>
import { ref } from 'vue'

const emit = defineEmits(['unlock'])

const password = ref('')
const isShaking = ref(false)
const SECRET_KEY = "123456"

const handleConfirm = () => {
  if (password.value === SECRET_KEY) {
    // 密码正确，发送解锁信号
    emit('unlock', 'admin')
  } else {
    // 密码错误，抖动
    triggerShake()
  }
}

const handleGuest = () => {
  emit('unlock', 'guest')
}

const triggerShake = () => {
  isShaking.value = true
  password.value = ''
  setTimeout(() => {
    isShaking.value = false
  }, 500)
}
</script>

<template>
  <div class="auth-overlay">
    <div class="auth-card" :class="{ shake: isShaking }">
      <div class="auth-title">Hello</div>
      
      <div class="auth-identity">
        <div class="avatar"><img src="/img/head.JPG" alt="Me"></div>
        <div class="name">Stephen</div>
      </div>
      
      <input 
        type="password" 
        v-model="password"
        class="auth-input" 
        placeholder="Enter Key" 
        @keyup.enter="handleConfirm"
      />
      
      <div class="auth-actions">
        <button class="btn-link" @click="handleGuest">I'm not Stephen</button>
        <button class="btn-confirm" @click="handleConfirm">Confirm</button>
      </div>
    </div>
  </div>
</template>