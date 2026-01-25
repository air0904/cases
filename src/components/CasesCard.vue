<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  cases: { type: Array, default: () => [] },
  isAdmin: Boolean
})

const emit = defineEmits(['create', 'view'])

const searchQuery = ref('')

const filteredItems = computed(() => {
  if (!searchQuery.value) return props.cases
  const query = searchQuery.value.toLowerCase()
  return props.cases.filter(item => 
    item.title.toLowerCase().includes(query) || 
    item.description.toLowerCase().includes(query) ||
    (item.resolution && item.resolution.toLowerCase().includes(query))
  )
})

const handleCreateClick = () => { emit('create') }
const handleItemClick = (item) => { emit('view', item) }

// 新增：清除搜索
const clearSearch = () => {
  searchQuery.value = ''
}
</script>

<template>
  <div class="glass-card cases-card">
    <div class="cases-layout">
      
      <div class="cases-header-fixed">
        <h1>my cases</h1>
        <div class="search-bar">
          <span class="search-icon">🔍</span>
          <input 
            type="text" 
            class="search-input" 
            placeholder="search your case"
            v-model="searchQuery"
          >
          <span 
            v-if="searchQuery" 
            class="clear-icon" 
            @click="clearSearch"
          >✕</span>
        </div>
      </div>

      <div class="cases-scroll-area">
        
        <div class="edit-section" v-if="isAdmin && !searchQuery" @click="handleCreateClick">
          <h3 class="section-title">Edit (Create New)</h3>
          <div class="highlight-card">
            <div class="highlight-bg"></div>
            <div class="card-top">
              <span class="card-h1">New Ticket +</span>
              <span class="card-time">Now</span>
            </div>
            <p class="card-desc">
              Tap here to create a new support ticket form. 
              Fill in the details for database or server issues.
            </p>
          </div>
        </div>

        <div class="recent-section">
          <h3 class="section-title" v-if="!searchQuery">recent</h3>
          
          <ul class="recent-list" v-if="filteredItems.length > 0">
            <li 
              class="list-item" 
              v-for="item in filteredItems" 
              :key="item.id"
              @click="handleItemClick(item)"
            >
              <div class="list-info">
                <h4>{{ item.title }}</h4>
                <p class="truncate-text">
                  <span v-if="item.resolution" style="color: var(--ios-blue)">✔ {{ item.resolution }}</span>
                  <span v-else>{{ item.description }}</span>
                </p>
              </div>
              <div class="list-meta">
                <span class="meta-time">{{ item.created_at.split(',')[0] }}</span> 
                <span class="arrow-icon">›</span>
              </div>
            </li>
          </ul>

          <div class="no-results" v-else>
            <p>No results found</p>
          </div>
          
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.truncate-text {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 280px;
}

/* 搜索框相关样式 */
.search-bar {
  position: relative; width: 100%;
  background: var(--input-bg);
  border-radius: 16px; padding: 12px 40px 12px 46px; /* 右侧 padding 增加，给 x 留位 */
  display: flex; align-items: center;
  border: 1px solid var(--glass-border); transition: background 0.3s;
}
.search-bar:focus-within { background: rgba(255,255,255,0.1); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }

.search-icon { position: absolute; left: 16px; opacity: 0.4; font-size: 1.1rem; color: var(--text-main); }

.search-input { background: transparent; border: none; outline: none; width: 100%; font-size: 1rem; color: var(--text-main); }

/* 新增：清除图标样式 */
.clear-icon {
  position: absolute; right: 16px;
  width: 20px; height: 20px;
  background: rgba(120, 120, 128, 0.2);
  border-radius: 50%;
  color: var(--text-sec);
  font-size: 0.7rem; font-weight: bold;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.2s;
}
.clear-icon:hover {
  background: rgba(120, 120, 128, 0.4);
  color: var(--text-main);
}
</style>