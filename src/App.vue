<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch, computed } from 'vue'
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
const currentTab = ref('basics') // 内部 ID 保持 'basics'，界面显示为 'Library'
const navIndicatorStyle = ref({ width: '0px', left: '0px' })
const isJelly = ref(false)
const isDark = ref(false)
// [新增] 动画起始位置数据
const cardOriginRect = ref(null)


// --- 响应式布局状态 [新增] ---
const cardWidth = ref(700) // 默认桌面宽度
const cardGap = ref(60)    // 默认间距

// --- 核心数据源 ---
const knowledgeItems = ref([
  { title: 'Linux', img: '/img/linux.png' },
  { title: 'MySQL', img: '/img/mysql.png' },
  { title: 'VUE', img: '/img/vue.png' },
  { title: 'Node.js', img: '/img/nodejs.png' },
  { title: 'Shell', img: '/img/shell.png' },
  { title: 'Python', img: '/img/python.png' },
  { title: 'Docker', img: '/img/docker.png' },
  { title: 'ITIL', img: '/img/people.png' },
])

const casesData = ref([
  { 
    id: 1, 
    title: 'Server Down', 
    category: 'Linux', 
    priority: 'High', 
    description: 'Main production server is not responding.', 
    resolution: 'Rebooted instance via AWS console.',
    created_at: '2026/1/24 10:00:00' 
  },
  { id: 2, title: 'SQL Injection', category: 'MySQL', priority: 'Medium', description: 'Login form vulnerability found.', resolution: 'Applied prepared statements.', created_at: '2026/1/23 14:30:00' },
  { id: 3, title: 'Vue Bug', category: 'Vue', priority: 'Low', description: 'Router not redirecting on mobile.', resolution: '', created_at: '2026/1/20 09:15:00' }
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

// --- [修改] 响应式布局计算 ---
const updateLayout = () => {
  const w = window.innerWidth
  if (w < 768) {
    // 手机端：卡片宽度占屏幕 85%，间距 20px
    cardWidth.value = w * 0.85
    cardGap.value = 20
  } else {
    // 桌面端：固定 700px，间距 60px
    cardWidth.value = 700
    cardGap.value = 60
  }
  // 重新计算导航条位置
  updateNavIndicator()
}

// --- [修改] 轨道偏移计算 ---
const getTrackStyle = () => {
  // 动态使用 cardWidth 进行计算，确保居中
  // 偏移量 = 屏幕中心 - 卡片一半 - (当前卡片索引 * (卡宽 + 间距))
  // 这里 Tab 0 是 Basics, Tab 1 是 Cases
  const tabIndex = currentTab.value === 'basics' ? 0 : 1
  
  // 基础偏移：让第一个卡片居中
  const centerOffset = `calc(50vw - ${cardWidth.value / 2}px)`
  
  // 移动距离：根据当前 Tab 移动 N 个卡片位
  const moveDistance = `${tabIndex * (cardWidth.value + cardGap.value)}px`
  
  return { transform: `translateX(calc(${centerOffset} - ${moveDistance}))` }
}

// --- 交互逻辑 ---
// [修改] 接收 payload 对象
const openKnowledgeCard = ({ item, rect }) => {
  currentKnowledgeItem.value = item
  // 保存点击元素的位置
  cardOriginRect.value = rect
  showKnowledge.value = true
}

const switchKnowledgeItem = (newItem) => {
  currentKnowledgeItem.value = newItem
}

// Cases 逻辑
const openCreateModal = () => { modalMode.value = 'create'; currentCase.value = null; showCaseModal.value = true }
const openViewModal = (item) => { modalMode.value = 'view'; currentCase.value = item; showCaseModal.value = true }
const handleCreateSubmit = (newItem) => { const newId = casesData.value.length + 1; casesData.value.unshift({ ...newItem, id: newId }); showCaseModal.value = false }
const handleUpdateSubmit = (updatedItem) => { const index = casesData.value.findIndex(c => c.id === updatedItem.id); if (index !== -1) casesData.value[index] = updatedItem; showCaseModal.value = false }
const handleDeleteCase = (id) => { casesData.value = casesData.value.filter(c => c.id !== id); showCaseModal.value = false }
const handleAction = (action) => { if (action === 'switch-case') switchTab('cases') }

const startX = ref(0)
const onPointerDown = (e) => { startX.value = e.clientX }
const onPointerUp = (e) => {
  const diff = e.clientX - startX.value
  if (diff < -50) switchTab('cases') 
  if (diff > 50) switchTab('basics') 
}

onMounted(() => {
  updateLayout() // 初始化布局参数
  nextTick(() => updateNavIndicator())
  window.addEventListener('resize', () => {
    updateLayout()
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', updateLayout)
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
    <div class="page-track" :style="[getTrackStyle(), { gap: cardGap + 'px' }]">
      
     <div 
        class="page-section" 
        :class="{ inactive: currentTab !== 'basics' }"
        :style="{ width: cardWidth + 'px' }"
      >
        <BasicsCard 
          :items="knowledgeItems"
          @action="handleAction" 
          @open-knowledge="openKnowledgeCard" 
        />
      </div>

      <div 
        class="page-section" 
        :class="{ inactive: currentTab !== 'cases' }"
        :style="{ width: cardWidth + 'px' }"
      >
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
    <div class="nav-item" :class="{ active: currentTab === 'basics' }" ref="navRefBasics" @click="switchTab('basics')">Library</div>
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

<style>
/* 确保 CSS 中的样式也能适配 JS 计算的宽度 */
.page-track {
  display: flex;
  height: 100%;
  align-items: center;
  transition: transform 0.5s cubic-bezier(0.32, 0.725, 0, 1);
  /* gap 由内联样式控制 */
}

.page-section {
  height: 80vh; /* 或根据需要调整 */
  flex-shrink: 0;
  transition: opacity 0.4s, transform 0.4s;
  /* width 由内联样式控制 */
}

/* 手机端适配补充 */
@media (max-width: 768px) {
  /* 强制覆盖子组件可能写死的宽度 */
  .glass-card {
    width: 100% !important; 
    max-width: none !important;
  }
}
</style>
