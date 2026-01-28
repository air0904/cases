<script setup>
import { ref, watch, nextTick, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  visible: Boolean,
  data: Object, 
  allItems: { type: Array, default: () => [] },
  isAdmin: Boolean,
  originRect: Object
})

const emit = defineEmits(['close', 'switch'])

// --- 状态管理 ---
const notesCache = ref({}) 
const isAdding = ref(false)
const newContent = ref('')
const editingNoteId = ref(null)
const editingContent = ref('')
const isModifyMode = ref(false) 
const searchQuery = ref('')
const isSearching = ref(false)
const highlightedNoteId = ref(null)

const startX = ref(0)
const startY = ref(0)
const isDragging = ref(false)
const ignoreClick = ref(false)

const cardWidth = ref(900)
const cardGap = ref(40)
const isAnimating = ref(false)
const contentOpacity = ref(1)

// --- 计算属性 ---
const currentIndex = computed(() => {
  if (!props.allItems || !props.data) return 0
  return props.allItems.findIndex(item => item.title === props.data.title)
})

const totalNotesCount = computed(() => {
  let count = 0
  for (const key in notesCache.value) {
    if (notesCache.value[key]) {
      count += notesCache.value[key].length
    }
  }
  return count
})

const trackStyle = computed(() => {
  const offset = `calc(50vw - ${cardWidth.value / 2}px - ${currentIndex.value * (cardWidth.value + cardGap.value)}px)`
  return { transform: `translateX(${offset})` }
})

const filteredResults = computed(() => {
  if (!searchQuery.value.trim()) return []
  const query = searchQuery.value.toLowerCase()
  const results = []
  for (const [title, notes] of Object.entries(notesCache.value)) {
    notes.forEach(note => {
      if (note.content.toLowerCase().includes(query)) {
        const item = props.allItems.find(i => i.title === title)
        if (item) results.push({ id: note.id, title, content: note.content, item })
      }
    })
  }
  return results
})

const handleCardClick = (item) => {
  if (ignoreClick.value || item.title === props.data?.title) return
  emit('switch', item)
}

// --- FLIP 动画 ---
const performEnterAnimation = async () => {
  if (!props.originRect) return
  isAnimating.value = true
  contentOpacity.value = 0
  await nextTick()
  const activeCard = document.querySelector('.card-wrapper.active .knowledge-card')
  if (!activeCard) return
  const targetRect = activeCard.getBoundingClientRect()
  const scaleX = props.originRect.width / targetRect.width
  const scaleY = props.originRect.height / targetRect.height
  const translateX = props.originRect.left - targetRect.left + (props.originRect.width - targetRect.width) / 2
  const translateY = props.originRect.top - targetRect.top + (props.originRect.height - targetRect.height) / 2
  const wrapper = activeCard.parentElement
  wrapper.style.transition = 'none'
  wrapper.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scaleX}, ${scaleY})`
  activeCard.style.borderRadius = `${24 / Math.min(scaleX, scaleY)}px`
  wrapper.offsetHeight 
  requestAnimationFrame(() => {
    wrapper.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
    wrapper.style.transform = ''
    activeCard.style.transition = 'border-radius 0.5s'
    activeCard.style.borderRadius = '24px'
    setTimeout(() => { isAnimating.value = false; contentOpacity.value = 1 }, 400)
  })
}

// --- [修改 1] 数据加载：从 API 获取 ---
const loadAllNotes = async () => {
  try {
    const res = await fetch('/api/notes')
    if (res.ok) {
      const allNotes = await res.json()
      // 将扁平数组按 category (title) 分组
      const newCache = {}
      props.allItems.forEach(item => { newCache[item.title] = [] }) // 初始化
      
      allNotes.forEach(note => {
        if (newCache[note.category]) {
          newCache[note.category].push(note)
        }
      })
      notesCache.value = newCache
    }
  } catch (e) {
    console.error('加载笔记失败', e)
  }
}

const getCurrentNotes = (title) => notesCache.value[title] || []
const updateLayout = () => { const w = window.innerWidth; if (w < 768) { cardWidth.value = w * 0.92; cardGap.value = 16 } else { cardWidth.value = 900; cardGap.value = 40 } }
onMounted(() => { updateLayout(); window.addEventListener('resize', updateLayout) })
onUnmounted(() => { window.removeEventListener('resize', updateLayout) })

watch(() => props.visible, (val) => {
  if (val) {
    isAdding.value = false; newContent.value = ''; editingNoteId.value = null; isModifyMode.value = false; searchQuery.value = ''; isSearching.value = false; highlightedNoteId.value = null;
    loadAllNotes(); // 打开时加载数据
    updateLayout(); performEnterAnimation()
  } else { contentOpacity.value = 1 }
})

// --- [修改 2] CRUD 操作：对接后端 ---
const activeTitle = computed(() => props.data?.title)
const startAdd = () => { if (!activeTitle.value) return; cancelEdit(); isAdding.value = true; nextTick(() => { scrollToBottom(); const t = document.querySelector('#new-note-textarea'); if(t) t.focus(); }) }

const confirmInput = async () => { 
  if (!newContent.value.trim() || !activeTitle.value) return
  
  const payload = { category: activeTitle.value, content: newContent.value }
  
  try {
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const savedNote = await res.json()

    // UI 更新
    if (!notesCache.value[activeTitle.value]) notesCache.value[activeTitle.value] = []
    notesCache.value[activeTitle.value].push(savedNote)
    
    newContent.value = ''
    isAdding.value = false
    nextTick(scrollToBottom)
  } catch (e) {
    console.error('添加笔记失败', e)
  }
}

const startEdit = (note) => { if (props.data.title !== activeTitle.value) return; if (isAdding.value) isAdding.value = false; editingNoteId.value = note.id; editingContent.value = note.content; nextTick(() => { const t = document.querySelector(`#edit-textarea-${note.id}`); if(t){ autoResize({target:t}); t.focus(); } }) }

const updateNote = async () => { 
  if (!editingContent.value.trim() || !activeTitle.value) return
  
  // UI 乐观更新
  const list = notesCache.value[activeTitle.value]
  const index = list.findIndex(n => n.id === editingNoteId.value)
  if (index !== -1) list[index].content = editingContent.value
  
  try {
    await fetch(`/api/notes/${editingNoteId.value}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: editingContent.value })
    })
  } catch (e) {
    console.error('更新笔记失败', e)
  }
  cancelEdit() 
}

const deleteNote = async (id) => { 
  if (!activeTitle.value) return
  
  // UI 乐观更新
  notesCache.value[activeTitle.value] = notesCache.value[activeTitle.value].filter(n => n.id !== id)
  
  try {
    await fetch(`/api/notes/${id}`, { method: 'DELETE' })
  } catch (e) {
    console.error('删除笔记失败', e)
  }
}

const cancelEdit = () => { editingNoteId.value = null; editingContent.value = '' }
const toggleModify = () => { isModifyMode.value = !isModifyMode.value; cancelEdit(); isAdding.value = false }
const handleDownload = () => { if (!activeTitle.value) return; let text = `# ${activeTitle.value}\n\n`; const list = notesCache.value[activeTitle.value] || []; list.forEach((note, i) => { text += `### Note ${i+1}\n${note.content}\n\n` }); const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `${activeTitle.value}_Notes.md`; link.click(); }
const enterSearchMode = () => { isSearching.value = true }; const exitSearchMode = () => { isSearching.value = false; searchQuery.value = '' }
const handleSearchResultClick = (result) => { emit('switch', result.item); exitSearchMode(); highlightedNoteId.value = result.id; nextTick(() => { setTimeout(() => { const noteElement = document.getElementById(`note-${result.id}`); if (noteElement) noteElement.scrollIntoView({ behavior: 'smooth', block: 'center' }) }, 300); setTimeout(() => { highlightedNoteId.value = null }, 2000) }) }
const scrollToBottom = () => { const ac = document.querySelector('.card-wrapper.active .notes-scroll-area'); if(ac) ac.scrollTop = ac.scrollHeight; }
const autoResize = (e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }
const formatIndex = (i) => (i + 1).toString().padStart(2, '0')

const onTouchStart = (e) => {
  if (e.target.tagName.toLowerCase() === 'textarea' || e.target.closest('button') || e.target.closest('.global-search-container')) return
  if (e.changedTouches) { startX.value = e.changedTouches[0].clientX; startY.value = e.changedTouches[0].clientY } else { startX.value = e.clientX; startY.value = e.clientY }
  isDragging.value = true
}
const onTouchEnd = (e) => {
  if (!isDragging.value) return; isDragging.value = false
  const endX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX; const endY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY
  const diffX = endX - startX.value; const diffY = endY - startY.value
  if (!isSearching.value) {
    if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY)) { if (diffX < 0) switchItem('next'); else switchItem('prev'); ignoreClick.value = true; setTimeout(() => { ignoreClick.value = false }, 100); return }
    if (diffY > 100 && Math.abs(diffY) > Math.abs(diffX)) { if (!isModifyMode.value && !isAdding.value && editingNoteId.value === null) { emit('close'); return } }
  }
  if (Math.abs(diffX) < 10 && Math.abs(diffY) < 10) {
    const isClickOnCard = e.target.closest('.knowledge-card'); const isClickOnSearch = e.target.closest('.global-search-container'); const isClickOnResults = e.target.closest('.search-results-list')
    if (!isClickOnCard && !isClickOnSearch && !isClickOnResults) { if (isSearching.value) { exitSearchMode() } else { if (!isModifyMode.value && !isAdding.value && editingNoteId.value === null) { emit('close') } } }
  }
}
const switchItem = (direction) => { if (!props.allItems.length) return; let nextIdx; if (direction === 'next') nextIdx = (currentIndex.value + 1) % props.allItems.length; else nextIdx = (currentIndex.value - 1 + props.allItems.length) % props.allItems.length; emit('switch', props.allItems[nextIdx]) }
</script>

<template>
  <div 
    class="knowledge-overlay" 
    :class="{ visible: visible }"
    @mousedown="onTouchStart" @mouseup="onTouchEnd"
    @touchstart="onTouchStart" @touchend="onTouchEnd"
  >
    <div class="global-search-container" :class="{ 'search-active': isSearching }" :style="{ opacity: contentOpacity, transition: 'opacity 0.3s' }" @mousedown.stop @touchstart.stop>
      <div class="search-input-wrapper">
        <span class="search-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg></span>
        <input 
          v-model="searchQuery" 
          class="global-search-input" 
          :placeholder="`Search ${totalNotesCount} notes...`" 
          @focus="enterSearchMode" 
        />
        <button v-if="isSearching" class="close-search-btn" @click="exitSearchMode">{{ searchQuery ? 'Clear' : 'Cancel' }}</button>
      </div>
    </div>

    <transition name="fade-up">
      <div class="search-results-layer" v-if="isSearching" @mousedown.stop @touchstart.stop>
        <div class="search-results-list" v-if="searchQuery">
          <div v-if="filteredResults.length > 0">
            <div class="search-result-item" v-for="res in filteredResults" :key="res.id" @click="handleSearchResultClick(res)">
              <div class="res-header"><span class="res-badge">{{ res.title }}</span><span class="res-arrow">→</span></div>
              <div class="res-content">{{ res.content }}</div>
            </div>
          </div>
          <div v-else class="no-results"><span class="no-res-icon">🔍</span><p
