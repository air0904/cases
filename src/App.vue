<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import AuthOverlay from './components/AuthOverlay.vue'
import UserProfile from './components/UserProfile.vue'
import BasicsCard from './components/BasicsCard.vue'
import CasesCard from './components/CasesCard.vue'
import CaseModal from './components/CaseModal.vue'
import ThemeToggle from './components/ThemeToggle.vue'

// --- 状态 ---
const authMode = ref('locked')
const showOverlay = ref(true)
const currentTab = ref('basics')
const navIndicatorStyle = ref({ width: '0px', left: '0px' })
const isJelly = ref(false)

// --- 主题状态 ---
const isDark = ref(false)
const toggleTheme = () => { isDark.value = !isDark.value }
watch(isDark, (val) => {
  if (val) document.body.setAttribute('data-theme', 'dark')
  else document.body.removeAttribute('data-theme')
})

// DOM Refs
const navRefBasics = ref(null)
const navRefCases = ref(null)

// --- 数据源 ---
const casesData = ref([
  { 
    id: 1, 
    title: 'Server Down', 
    category: 'Linux', 
    priority: 'High', 
    description: 'Main production server is not responding to SSH requests.', 
    resolution: 'Rebooted the instance via AWS console and checked logs. Fixed.',
    created_at: '1/24/2026, 10:00:00 AM' 
  },
  { 
    id: 2, 
    title: 'SQL Injection', 
    category: 'MySQL', 
    priority: 'Medium', 
    description: 'Found potential vulnerability in the login form.', 
    resolution: 'Sanitized all inputs using prepared statements.',
    created_at: '1/23/2026, 2:30:00 PM' 
  },
  { 
    id: 3, 
    title: 'Vue Router Bug', 
    category: 'Vue', 
    priority: 'Low', 
    description: 'Navigation guard is not redirecting correctly on mobile.', 
    resolution: '',
    created_at: '1/20/2026, 9:15:00 AM' 
  }
])

// --- Modal 状态 ---
const showCaseModal = ref(false)
const modalMode = ref('view')
const currentCase = ref(null)

// --- 业务逻辑 ---
const openCreateModal = () => {
  modalMode.value = 'create'
  currentCase.value = null
  showCaseModal.value = true
}

const openViewModal = (item) => {
  modalMode.value = 'view'
  currentCase.value = item
  showCaseModal.value = true
}

const handleCreateSubmit = (newItem) => {
  const newId = casesData.value.length + 1
  casesData.value.unshift({ ...newItem, id: newId })
  showCaseModal.value = false
}

const handleUpdateSubmit = (updatedItem) => {
  const index = casesData.value.findIndex(c => c.id === updatedItem.id)
  if (index !== -1) {
    casesData.value[index] = updatedItem
  }
}

const handleDeleteCase = (id) => {
  casesData.value = casesData.value.filter(c => c.id !== id)
  showCaseModal.value = false
}

const handleUnlock = (mode) => {
  authMode.value = mode
  showOverlay.value = false
  if (mode === 'guest') switchTab('basics')
  else if (mode === 'admin') switchTab('cases')
}

const switchTab = (tab) => {
  currentTab.value = tab
  isJelly.value = false
  nextTick(() => {
    isJelly.value = true
    setTimeout(() => isJelly.value = false, 500)
    updateNavIndicator()
  })
}

const updateNavIndicator = () => {
  const target = currentTab.value === 'basics' ? navRefBasics.value : navRefCases.value
  if (target) {
    navIndicatorStyle.value = {
      width: `${target.offsetWidth}px`,
      left: `${target.offsetLeft}px`
    }
  }
}

const getTrackStyle = () => {
  const cardWidth = 700 
  const gap = 60    
  if (currentTab.value === 'basics') {
    return { transform: `translateX(calc(50vw - ${cardWidth/2}px))` }
  } else {
    return { transform: `translateX(calc(50vw - ${cardWidth/2}px - ${cardWidth + gap}px))` }
  }
}

const handleAction = (action) => {
  if (action === 'switch-case') switchTab('cases')
}

const startX = ref(0)
const onPointerDown = (e) => { startX.value = e.clientX }
const onPointerUp = (e) => {
  const diff = e.clientX - startX.value
  if (diff < -50) switchTab('cases') 
  if (diff > 50) switchTab('basics') 
}

onMounted(() => {
  nextTick(() => updateNavIndicator())
  window.addEventListener('resize', updateNavIndicator)
})
</script>

<template>
  <div class="ambient-light"></div>
  <div class="ambient-light-2"></div>

  <AuthOverlay :class="{ hidden: !showOverlay }" @unlock="handleUnlock" />

  <div class="header-bar">
    <UserProfile :mode="authMode" />
    <ThemeToggle :isDark="isDark" @toggle="toggleTheme" />
  </div>

  <div class="page-mask" @pointerdown="onPointerDown" @pointerup="onPointerUp">
    <div class="page-track" :style="getTrackStyle()">
      <div class="page-section" :class="{ inactive: currentTab !== 'basics' }">
        <BasicsCard @action="handleAction" />
      </div>
      <div class="page-section" :class="{ inactive: currentTab !== 'cases' }">
        <CasesCard 
          :cases="casesData" 
          :isAdmin="authMode === 'admin'"
          @create="openCreateModal"
          @view="openViewModal"
        />
      </div>
    </div>
  </div>

  <nav class="bottom-nav" :class="{ visible: !showOverlay }">
    <div class="nav-indicator" :class="{ 'animate-jelly': isJelly }" :style="navIndicatorStyle"></div>
    <div class="nav-item" :class="{ active: currentTab === 'basics' }" ref="navRefBasics" @click="switchTab('basics')">Basics</div>
    <div class="nav-item" :class="{ active: currentTab === 'cases' }" ref="navRefCases" @click="switchTab('cases')">Cases</div>
  </nav>

  <div 
    class="fab-add" 
    :style="{ display: authMode === 'admin' ? 'flex' : 'none' }"
    @click="openCreateModal"
  >+</div>

  <CaseModal 
    :visible="showCaseModal"
    :mode="modalMode"
    :caseData="currentCase"
    :isAdmin="authMode === 'admin'"
    @close="showCaseModal = false"
    @submit="handleCreateSubmit"
    @update="handleUpdateSubmit"
    @delete="handleDeleteCase"
  />
</template>