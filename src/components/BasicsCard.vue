<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['open-knowledge', 'action'])

// --- 状态 ---
const searchQuery = ref('')
const isSearchFocused = ref(false)

// --- 计算属性：搜索过滤 ---
const filteredItems = computed(() => {
  if (!searchQuery.value.trim()) return props.items
  const query = searchQuery.value.toLowerCase()
  return props.items.filter(item => item.title.toLowerCase().includes(query))
})

// 获取点击元素的位置信息（用于 FLIP 动画）
const handleClick = (item, event) => {
  const target = event.currentTarget
  const rect = target.getBoundingClientRect()
  emit('open-knowledge', { item, rect })
}
</script>

<template>
  <div class="library-container">
    
    <div class="section-header">
      <div class="header-left">
        <h2 class="section-title">Library</h2>
      </div>
      
      <div class="search-container" :class="{ 'focused': isSearchFocused }">
        <div class="search-input-wrapper">
          <span class="search-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </span>
          
          <input 
            v-model="searchQuery" 
            placeholder="Search topics..." 
            class="library-search-input"
            @focus="isSearchFocused = true"
            @blur="isSearchFocused = false"
          />
          
          <button v-show="searchQuery" class="clear-btn" @click="searchQuery = ''">×</button>
        </div>
      </div>
    </div>

    <div class="library-grid-wrapper">
      
      <div v-if="filteredItems.length === 0" class="empty-state">
        <div class="empty-icon">🔍</div>
        <p>No topics found.</p>
      </div>

      <transition-group name="list" tag="section" class="gallery-grid">
        <article 
          class="gallery-item glass-panel" 
          v-for="item in filteredItems" 
          :key="item.title"
          @click="(e) => handleClick(item, e)" 
        >
          <div class="image-wrapper">
            <img :src="item.img" :alt="item.title">
          </div>
          
          <div class="item-footer">
            <h3 class="item-title">{{ item.title }}</h3>
            <span class="action-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </span>
          </div>
        </article>
      </transition-group>

    </div>
  </div>
</template>

<style scoped>
/* --- 容器布局 --- */
.library-container {
  width: 100%; height: 100%;
  padding: 20px 40px;
  display: flex; flex-direction: column;
}

/* --- 顶部栏 --- */
.section-header {
  margin-bottom: 30px;
  display: flex; justify-content: space-between; align-items: center;
  gap: 20px;
  height: 60px;
}
.header-left { display: flex; align-items: center; }
.section-title {
  font-size: 2.2rem; font-weight: 800;
  background: linear-gradient(135deg, var(--text-main) 0%, var(--text-sec) 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  letter-spacing: -0.5px;
}

/* --- [修复] 搜索框样式 --- */
.search-container {
  width: 260px;
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}
.search-container.focused {
  width: 320px;
}

.search-input-wrapper {
  position: relative; /* 关键：为子元素的绝对定位提供锚点 */
  width: 100%; height: 50px;
  background: var(--glass-bg); 
  backdrop-filter: blur(30px);
  border: 1px solid var(--glass-border);
  border-radius: 25px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  transition: all 0.3s;
}

.search-container.focused .search-input-wrapper {
  background: var(--input-bg);
  border-color: #007aff;
  box-shadow: 0 8px 24px rgba(0, 122, 255, 0.15);
}

/* 图标固定在左侧 */
.search-icon {
  position: absolute; left: 16px; top: 50%; transform: translateY(-50%);
  color: var(--text-sec); opacity: 0.6; pointer-events: none;
  display: flex; align-items: center;
}

/* 输入框：通过 padding 避开图标和清除按钮 */
.library-search-input {
  width: 100%; height: 100%;
  background: transparent; border: none; outline: none;
  font-size: 1rem; color: var(--text-main);
  padding-left: 44px; /* 避开左侧图标 */
  padding-right: 36px; /* 避开右侧 X 按钮 */
}

/* 清除按钮固定在右侧 */
.clear-btn {
  position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
  width: 20px; height: 20px; border-radius: 50%;
  background: rgba(0,0,0,0.1); color: var(--text-sec);
  font-size: 14px; line-height: 1; border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
}
.clear-btn:hover { background: rgba(0,0,0,0.2); color: var(--text-main); }


/* --- 滚动区域 --- */
.library-grid-wrapper {
  flex: 1; overflow-y: auto;
  padding: 10px; margin: -10px;
  scrollbar-width: none;
}
.library-grid-wrapper::-webkit-scrollbar { display: none; }

/* --- 网格布局 --- */
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 24px;
  padding-bottom: 80px;
}

/* --- 卡片样式 --- */
.gallery-item {
  position: relative;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 24px;
  
  display: flex; flex-direction: column; align-items: center; gap: 20px;
  cursor: pointer;
  
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.3s ease;
  transform: scale(1);
}

/* [修复 1] 悬停效果：移除 border-color 变化，仅保留放大和背景加深 */
.gallery-item:hover {
  transform: scale(1.04);
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.06) 100%);
  /* 删除了 border-color: #007aff; */
  z-index: 1;
}

/* 图片区域 */
.image-wrapper {
  width: 80px; height: 80px;
  border-radius: 20px;
  background: rgba(0, 0, 0, 0.03);
  display: flex; align-items: center; justify-content: center;
  transition: transform 0.4s ease;
}

.image-wrapper img {
  width: 60%; height: 60%; object-fit: contain;
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.1));
  transition: transform 0.4s ease;
}

.gallery-item:hover img {
  transform: scale(1.1);
}

/* 底部信息 */
.item-footer {
  width: 100%;
  display: flex; justify-content: space-between; align-items: center;
}

.item-title {
  font-size: 1.1rem; font-weight: 700;
  color: var(--text-main);
  opacity: 0.9;
}

.action-icon {
  color: var(--text-sec); opacity: 0.5;
  transition: all 0.3s ease;
  transform: translateX(0);
}

.gallery-item:hover .action-icon {
  opacity: 1; color: #007aff;
  transform: translateX(4px);
}

/* 空状态 */
.empty-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  height: 60%; color: var(--text-sec); text-align: center; margin-top: 60px;
}
.empty-icon { font-size: 3rem; margin-bottom: 15px; opacity: 0.3; }

/* 列表动画 */
.list-enter-active, .list-leave-active { transition: all 0.4s ease; }
.list-enter-from, .list-leave-to { opacity: 0; transform: translateY(20px) scale(0.95); }

@media (max-width: 768px) {
  .library-container { padding: 20px; }
  .gallery-grid { grid-template-columns: repeat(2, 1fr); gap: 16px; }
  .section-title { font-size: 1.8rem; }
  .search-container { width: 100%; }
  .search-container.focused { width: 100%; }
}
</style>
