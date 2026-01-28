<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import AuthOverlay from './components/AuthOverlay.vue'
import UserProfile from './components/UserProfile.vue'
import BasicsCard from './components/BasicsCard.vue'
import CasesCard from './components/CasesCard.vue'
import CaseModal from './components/CaseModal.vue'
import ThemeToggle from './components/ThemeToggle.vue'
import KnowledgeCard from './components/KnowledgeCard.vue' 

const authMode = ref('locked')
const showOverlay = ref(true)
const currentTab = ref('basics') 
const navIndicatorStyle = ref({ width: '0px', left: '0px' })
const isJelly = ref(false)
const isDark = ref(false)

const cardOriginRect = ref(null)      
const caseModalOriginRect = ref(null) 

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

// --- [修改 1] 数据源现在默认为空，等待 API 加载 ---
const casesData = ref([])

// --- [修改 2] 从后端 API 加载 Cases 数据 ---
const loadCases = async () => {
  try {
    // 这里的 /api 在生产环境会通过 Nginx 转发到 Node 后端
    const res = await fetch('/api/cases')
    if (res.ok) {
      casesData.value = await res.json()
    } else {
      console.error('加载工单失败:', res.status)
    }
  } catch (e) {
    console.error('无法连接到服务器:', e)
  }
}

const showCaseModal = ref(false)
const modalMode = ref('view')
const currentCase = ref(null) 
const showKnowledge = ref(false)
const currentKnowledgeItem = ref({})

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
    navIndicatorStyle.value = { width: `${target.offsetWidth}px`, left: `${target.offsetLeft}px` }
  }
}

const openKnowledgeCard = ({ item, rect }) => {
  currentKnowledgeItem.value = item
  cardOriginRect.value = rect 
  showKnowledge.value = true
}

const switchKnowledgeItem = (newItem) => { currentKnowledgeItem.value = newItem }

const openCreateModal = (event) => {
  if (event && event.currentTarget) {
    caseModalOriginRect.value = event.currentTarget.getBoundingClientRect()
  }
  modalMode.value = 'create'
  currentCase.value = null
  showCaseModal.value = true
}

const openViewModal = ({ item, rect }) => {
  caseModalOriginRect.value = rect
  modalMode.value = 'view'
  currentCase.value = item
  showCaseModal.value = true
}

// --- [修改 3] 新增工单：同时更新 UI 和 后端 ---
const handleCreateSubmit = async (newItem) => { 
  // 提取 created_at 中的所有数字作为 ID
  const timeStr = newItem.created_at || ''
  const newId = Number(timeStr.replace(/\D/g, '')) || Date.now()
  const payload = { ...newItem, id: newId }
  
  // 乐观更新 UI
  casesData.value.unshift(payload)
  showCaseModal.value = false

  // 发送给后端
  try {
    await fetch('/api/cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
  } catch (e) {
    console.error('保存工单失败', e)
    alert('Failed to save to server')
  }
}

// --- [修改 4] 更新工单：同时更新 UI 和 后端 ---
const handleUpdateSubmit = async (updatedItem) => { 
  const index = casesData.value.findIndex(c => c.id === updatedItem.id)
  if (index !== -1) casesData.value[index] = updatedItem // UI 更新
  
  try {
    await fetch(`/api/cases/${updatedItem.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedItem)
    })
  } catch (e) {
    console.error('更新工单失败', e)
  }
}

// --- [修改 5] 删除工单：同时更新 UI 和 后端 ---
const handleDeleteCase = async (id) => { 
  casesData.value = casesData.value.filter(c => c.id !== id) // UI 更新
  showCaseModal.value = false 
  
  try {
    await fetch(`/api/cases/${id}`, { method: 'DELETE' })
  } catch (e) {
    console.error('删除工单失败', e)
  }
}

const handleAction = (action) => { if (action === 'switch-case') switchTab('cases') }

const startX = ref(0)
const onPointerDown = (e) => { startX.value = e.clientX }
const onPointerUp = (e) => {
  const diff = e.clientX - startX.value
  if (diff < -80) switchTab('cases') 
  if (diff > 80) switchTab('basics') 
}

onMounted(() => {
  loadCases() // 启动时加载数据
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
    :allCases="casesData"
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
.page-mask { width: 100vw; height: 100vh; overflow: hidden; position: relative; z-index: 10; }
.page-track { display: flex; width: 200vw; height: 100%; transition: transform 0.6s cubic-bezier(0.32, 0.725, 0, 1); }
.page-section { width: 100vw; height: 100%; flex-shrink: 0; display: flex; justify-content: center; align-items: center; padding-top: 80px; padding-bottom: 90px; }
.section-container { width: 95%; max-width: 1400px; height: 100%; position: relative; }

.fab-add {
  position: fixed; right: 30px; bottom: 120px;
  width: 56px; height: 56px;
  background: var(--ios-blue); color: white;
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  font-size: 32px; cursor: pointer;
  box-shadow: 0 8px 24px rgba(0, 122, 255, 0.4);
  z-index: 100; transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.fab-add:hover { transform: scale(1.1) rotate(90deg); box-shadow: 0 12px 32px rgba(0, 122, 255, 0.5); }
.fab-hidden { transform: scale(0) rotate(-180deg); opacity: 0; pointer-events: none; }

@media (max-width: 768px) {
  .section-container { width: 100%; padding: 0 10px; }
  .fab-add { right: 20px; bottom: 100px; width: 50px; height: 50px; }
}
</style>
