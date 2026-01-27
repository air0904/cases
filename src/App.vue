<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import AuthOverlay from './components/AuthOverlay.vue'
import UserProfile from './components/UserProfile.vue'
import BasicsCard from './components/BasicsCard.vue'
import CasesCard from './components/CasesCard.vue'
import CaseModal from './components/CaseModal.vue'
import ThemeToggle from './components/ThemeToggle.vue'
import KnowledgeCard from './components/KnowledgeCard.vue' 

// --- 基础状态 ---
const authMode = ref('locked')
const showOverlay = ref(true)
const currentTab = ref('basics') // 'basics' = Library, 'cases' = Cases
const navIndicatorStyle = ref({ width: '0px', left: '0px' })
const isJelly = ref(false)
const isDark = ref(false)

// --- 动画起始位置数据 (FLIP 核心) ---
const cardOriginRect = ref(null)      // 用于 Library -> Knowledge
const caseModalOriginRect = ref(null) // 用于 CaseCard/+ -> CaseModal

// --- 核心数据源 ---
const knowledgeItems = ref([
  { title: 'Linux', img: '/img/linux.png' },
  { title: 'MySQL', img: '/img/mysql.png' },
  { title: 'VUE', img: '/img/vue.png' },
  { title: 'Node.js', img: '/img/nodejs.png' },
  { title: 'Shell', img: '/img/shell.png' },
  { title: 'Python', img: '/img/python.png' },
  { title: 'Docker', img: '/img/docker.png' },
  { title: 'ITIL', img: '/img/people.png' }
])

const casesData = ref([
  { id: 1, title: 'Server Down', category: 'Linux', priority: 'High', description: 'Main production server is not responding.', resolution: 'Rebooted instance via AWS console.', created_at: '2026/1/24 10:00:00' },
  { id: 2, title: 'SQL Injection', category: 'MySQL', priority: 'Medium', description: 'Login form vulnerability found.', resolution: 'Applied prepared statements.', created_at: '2026/1/23 14:30:00' },
  { id: 3, title: 'Vue Bug', category: 'Vue', priority: 'Low', description: 'Router not redirecting on mobile.', resolution: '', created_at: '2026/1/20 09:15:00' },
  { id: 4, title: 'API Timeout', category: 'Node.js', priority: 'High', description: 'Legacy API endpoints are timing out under load.', resolution: '', created_at: '2026/1/25 11:20:00' },
  { id: 5, title: 'CSS Layout', category: 'Vue', priority: 'Low', description: 'Footer misalignment on Safari.', resolution: 'Fixed flexbox gap.', created_at: '2026/1/26 15:00:00' }
])

const showCaseModal = ref(false)
const modalMode = ref('view')
const currentCase = ref(null)
const showKnowledge = ref(false)
const currentKnowledgeItem = ref({})

// --- 导航逻辑 ---
const navRefBasics = ref(null)
const navRefCases = ref(null)

const toggleTheme = () => { isDark.value = !isDark.value }
watch(isDark, (val) => {
  if (val) document.body.setAttribute('data-theme', 'dark')
  else document.body.removeAttribute('data-theme')
})

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

// --- 弹窗触发逻辑 (带坐标捕获) ---

// 打开知识库卡片
const openKnowledgeCard = ({ item, rect }) => {
  currentKnowledgeItem.value = item
  cardOriginRect.value = rect // 保存图标位置用于动画
  showKnowledge.value = true
}

const switchKnowledgeItem = (newItem) => { currentKnowledgeItem.value = newItem }

// 打开新建工单
const openCreateModal = (event) => {
  // 捕获点击 '+' 按钮的位置
  if (event && event.currentTarget) {
    caseModalOriginRect.value = event.currentTarget.getBoundingClientRect()
  }
  modalMode.value = 'create'
  currentCase.value = null
  showCaseModal.value = true
}

// 打开查看工单
const openViewModal = ({ item, rect }) => {
  // 接收 CasesCard 传来的卡片位置
  caseModalOriginRect.value = rect
  modalMode.value = 'view'
  currentCase.value = item
  showCaseModal.value = true
}

// 工单操作处理
const handleCreateSubmit = (newItem) => { 
  const newId = Date.now()
  casesData.value.unshift({ ...newItem, id: newId })
  showCaseModal.value = false 
}
const handleUpdateSubmit = (updatedItem) => { 
 const index = casesData.value.findIndex(c => c.id === updatedItem.id)
  if (index !== -1) casesData.value[index] = updatedItem
}
const handleDeleteCase = (id) => { 
  casesData.value = casesData.value.filter(c => c.id !== id)
  showCaseModal.value = false 
}
const handleAction = (action) => { if (action === 'switch-case') switchTab('cases') }

// 左右手势滑动
const startX = ref(0)
const onPointerDown = (e) => { startX.value = e.clientX }
const onPointerUp = (e) => {
  const diff = e.clientX - startX.value
  if (diff < -80) switchTab('cases') 
  if (diff > 80) switchTab('basics') 
}

onMounted(() => {
  nextTick(() => updateNavIndicator())
  window.addEventListener('resize', updateNavIndicator)
})
onUnmounted(() => {
  window.removeEventListener('resize', updateNavIndicator)
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
    <div class="page-track" :style="{ transform: currentTab === 'basics' ? 'translateX(0)' : 'translateX(-100vw)' }">
      
      <div class="page-section">
        <div class="section-container">
          <BasicsCard 
            :items="knowledgeItems"
            @action="handleAction" 
            @open-knowledge="openKnowledgeCard" 
          />
        </div>
      </div>

      <div class="page-section">
        <div class="section-container">
          <CasesCard 
            :cases="casesData" 
            :isAdmin="authMode === 'admin'"
            @view="openViewModal"
          />
        </div>
      </div>

    </div>
  </div>

  <nav class="bottom-nav" :class="{ visible: !showOverlay }">
    <div class="nav-indicator" :class="{ 'animate-jelly': isJelly }" :style="navIndicatorStyle"></div>
    <div class="nav-item" :class="{ active: currentTab === 'basics' }" ref="navRefBasics" @click="switchTab('basics')">Library</div>
    <div class="nav-item" :class="{ active: currentTab === 'cases' }" ref="navRefCases" @click="switchTab('cases')">Cases</div>
  </nav>

  <div 
    v-if="authMode === 'admin'"
    class="fab-add" 
    :class="{ 'fab-hidden': currentTab !== 'cases' }"
    @click="(e) => openCreateModal(e)"
  >+</div>

  <CaseModal 
    :visible="showCaseModal"
    :mode="modalMode"
    :caseData="currentCase"
    :isAdmin="authMode === 'admin'"
    :originRect="caseModalOriginRect"
    @close="showCaseModal = false"
    @submit="handleCreateSubmit"
    @update="handleUpdateSubmit"
    @delete="handleDeleteCase"
  />

  <KnowledgeCard 
    :visible="showKnowledge"
    :data="currentKnowledgeItem"
    :allItems="knowledgeItems"
    :isAdmin="authMode === 'admin'"
    :originRect="cardOriginRect" 
    @close="showKnowledge = false"
    @switch="switchKnowledgeItem"
  />
</template>

<style scoped>
/* --- 全屏滑轨布局样式 --- */
.page-mask {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: relative;
  z-index: 10;
}

.page-track {
  display: flex;
  width: 200vw; /* 两倍视口宽度 */
  height: 100%;
  /* 使用 iOS 风格的弹性曲线 */
  transition: transform 0.6s cubic-bezier(0.32, 0.725, 0, 1);
}

.page-section {
  width: 100vw;
  height: 100%;
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  padding-top: 80px; /* 避开头部 */
  padding-bottom: 90px; /* 避开底部导航 */
}

.section-container {
  width: 95%; /* 容器宽最大化 */
  max-width: 1400px;
  height: 100%;
  position: relative;
}

/* --- 悬浮按钮 (FAB) 增强 --- */
.fab-add {
  position: fixed;
  right: 30px;
  bottom: 120px;
  width: 56px;
  height: 56px;
  background: var(--ios-blue);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(0, 122, 255, 0.4);
  z-index: 100;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.fab-add:hover {
  transform: scale(1.1) rotate(90deg);
  box-shadow: 0 12px 32px rgba(0, 122, 255, 0.5);
}
.fab-hidden {
  transform: scale(0) rotate(-180deg);
  opacity: 0;
  pointer-events: none;
}

/* 手机适配 */
@media (max-width: 768px) {
  .section-container {
    width: 100%;
    padding: 0 10px;
  }
  .fab-add {
    right: 20px;
    bottom: 100px;
    width: 50px;
    height: 50px;
  }
}
</style>
