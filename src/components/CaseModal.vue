<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  visible: Boolean,
  mode: String,
  caseData: Object,
  isAdmin: Boolean,
  originRect: Object
})

const emit = defineEmits(['close', 'submit', 'update', 'delete'])

// 1. 基础状态
const form = ref({
  title: '',
  category: 'Linux',
  priority: 'Medium',
  description: '',
  resolution: ''
})

const isEditing = ref(false)
const isShaking = ref(false)
const titleWarning = ref(false)
const showDeleteConfirm = ref(false)
const showAnimation = ref(false)

// --- 重置表单 ---
const resetForm = () => {
  form.value = { 
    title: '', 
    category: 'Linux', 
    priority: 'Medium', 
    description: '', 
    resolution: '' 
  }
  titleWarning.value = false
  showDeleteConfirm.value = false
  isShaking.value = false
}

// 2. 监听器
watch(() => props.visible, (val) => {
  if (val) {
    showAnimation.value = false
    setTimeout(() => { showAnimation.value = true }, 50)

    if (props.mode === 'create') {
      resetForm()
      isEditing.value = true
    } else if (props.caseData) {
      form.value = { ...props.caseData }
      isEditing.value = false
    }
  } else {
    showAnimation.value = false
    titleWarning.value = false
    isShaking.value = false
    showDeleteConfirm.value = false
  }
})

watch(() => props.mode, (newMode) => {
  if (props.visible) {
    isEditing.value = newMode === 'create'
    if (newMode === 'create') resetForm()
  }
})

// 3. 交互逻辑
const triggerShake = () => {
  isShaking.value = true
  setTimeout(() => { isShaking.value = false }, 500)
}

const handleSubmit = () => {
  if (!form.value.title.trim()) {
    titleWarning.value = true
    triggerShake()
    return
  }
  if (props.mode === 'create') {
    emit('submit', { ...form.value, created_at: new Date().toLocaleString() })
  } else {
    emit('update', { ...form.value })
    isEditing.value = false
  }
}

const toggleEdit = () => { isEditing.value = true }

const cancelEdit = () => {
  isEditing.value = false
  if (props.caseData) form.value = { ...props.caseData }
  titleWarning.value = false
}

const handleDeleteClick = () => {
  triggerShake()
  showDeleteConfirm.value = true
}

const confirmDelete = () => {
  emit('delete', form.value.id)
  showDeleteConfirm.value = false
}

const cancelDelete = () => { showDeleteConfirm.value = false }

const handleDownload = () => {
  const mdContent = `# Case: ${form.value.title}\n\n**Category:** ${form.value.category}\n**Priority:** ${form.value.priority}\n**Created At:** ${form.value.created_at || new Date().toLocaleString()}\n\n## Description\n${form.value.description || 'No description.'}\n\n## Resolution\n${form.value.resolution || 'No resolution provided.'}`
  const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `Case_${form.value.title.replace(/\s+/g, '_')}.md`
  link.click()
  URL.revokeObjectURL(link.href)
}
</script>

<template>
  <div class="case-modal-overlay" :class="{ visible: visible }">
    
    <div class="glass-card modal-card" :class="{ shake: isShaking, 'animate-drop': showAnimation }">
      
      <div class="modal-header drop-item" style="--delay: 0s">
        <h2>{{ mode === 'create' ? 'New Case' : (isEditing ? 'Edit Case' : 'Case Detail') }}</h2>
        <span class="status-badge" :class="form.priority.toLowerCase()">{{ form.priority }}</span>
      </div>

      <div class="modal-body">
        <div class="form-group drop-item" style="--delay: 0.1s">
          <label>Title <span style="color: #ff3b30" v-if="titleWarning">* Required</span></label>
          <input 
            type="text" class="modal-input" :class="{ 'input-warning': titleWarning }"
            v-model="form.title" :readonly="!isEditing" placeholder="Enter issue title" @input="titleWarning = false"
          >
        </div>

        <div class="form-row drop-item" style="--delay: 0.2s">
          <div class="form-group">
            <label>Category</label>
            <select class="modal-input" v-model="form.category" :disabled="!isEditing">
              <option>MySQL</option><option>Linux</option><option>Network</option><option>Vue</option><option>Other</option>
            </select>
          </div>
          <div class="form-group">
            <label>Priority</label>
            <select class="modal-input" v-model="form.priority" :disabled="!isEditing">
              <option>Low</option><option>Medium</option><option>High</option>
            </select>
          </div>
        </div>

        <div class="form-group drop-item" style="--delay: 0.3s">
          <label>Description</label>
          <textarea 
            v-if="isEditing" class="modal-input textarea" 
            v-model="form.description" placeholder="Describe the issue..."
          ></textarea>
          <div v-else class="modal-input read-only-content">
            {{ form.description || 'No description provided.' }}
          </div>
        </div>

        <div class="form-group drop-item" style="--delay: 0.4s">
          <label>Resolution</label>
          <textarea 
            v-if="isEditing" class="modal-input textarea" 
            v-model="form.resolution" placeholder="Document the solution..."
          ></textarea>
          <div v-else class="modal-input read-only-content">
             {{ form.resolution || 'No resolution yet.' }}
          </div>
        </div>
        
        <div class="meta-info drop-item" style="--delay: 0.5s" v-if="mode === 'view'">
          Created at: {{ form.created_at }}
        </div>
      </div>

      <div class="modal-footer drop-item" style="--delay: 0.5s">
        <template v-if="mode === 'create'">
          <button class="btn-secondary" @click="$emit('close')">Cancel</button>
          <button class="btn-primary" @click="handleSubmit">Submit Ticket</button>
        </template>

        <template v-else-if="!isEditing">
          <template v-if="isAdmin">
            <button class="btn-danger" @click="handleDeleteClick">Delete</button>
            <div class="right-actions">
              <button class="btn-secondary" @click="handleDownload">Download</button>
              <button class="btn-secondary" @click="$emit('close')">Exit</button>
              <button class="btn-primary" @click="toggleEdit">Modify</button>
            </div>
          </template>
          <template v-else>
             <div style="width: 100%; display: flex; justify-content: space-between;">
               <button class="btn-secondary" @click="$emit('close')">Exit</button>
               <button class="btn-primary" @click="handleDownload">Download MD</button>
             </div>
          </template>
        </template>

        <template v-else>
          <button class="btn-secondary" @click="cancelEdit">Cancel Edit</button>
          <button class="btn-primary" @click="handleSubmit">Confirm</button>
        </template>
      </div>

      <transition name="fade">
        <div class="delete-confirm-overlay" v-if="showDeleteConfirm">
          <div class="confirm-box">
            <h3>Are you sure?</h3>
            <p>This action cannot be undone.</p>
            <div class="confirm-actions">
              <button class="btn-secondary" @click="cancelDelete">Cancel</button>
              <button class="btn-danger" @click="confirmDelete">Delete</button>
            </div>
          </div>
        </div>
      </transition>

    </div>
  </div>
</template>

<style scoped>
/* 1. 基础弹窗布局 */
.modal-card {
  width: 600px; max-width: 90vw;
  height: 92vh; 
  padding: 40px;
  margin-left: auto; margin-right: auto;
  
  transform: scale(0.98) translateY(10px); 
  opacity: 0;
  transition: opacity 0.3s ease, transform 0.3s ease;
  position: relative; overflow: hidden;
  display: flex; flex-direction: column;
}

.case-modal-overlay.visible .modal-card { 
  transform: scale(1) translateY(0); 
  opacity: 1; 
}

.case-modal-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: var(--modal-overlay, rgba(240, 242, 245, 0.6)); 
  backdrop-filter: blur(20px);
  z-index: 1000; display: flex; align-items: center; justify-content: center;
  opacity: 0; pointer-events: none; transition: opacity 0.3s;
}
.case-modal-overlay.visible { opacity: 1; pointer-events: auto; }

/* 掉落动画 */
.drop-item { opacity: 0; transform: translateY(-20px); transition: none; }
.modal-card.animate-drop .drop-item { animation: dropIn 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; animation-delay: var(--delay); }
@keyframes dropIn { from { opacity: 0; transform: translateY(-25px); } to { opacity: 1; transform: translateY(0); } }

/* 2. 内容区域 */
.modal-header { flex-shrink: 0; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; position: relative; }
.modal-header h2 { font-size: 1.8rem; font-weight: 700; color: var(--text-main); }

.modal-body { 
  flex: 1; 
  overflow-y: auto; 
  display: flex; flex-direction: column; gap: 20px; 
  padding-right: 10px; margin-bottom: 20px;
}
.modal-body::-webkit-scrollbar { width: 0; background: transparent; }

.modal-footer { flex-shrink: 0; display: flex; justify-content: space-between; align-items: center; }

/* 3. 表单样式 */
.form-group label { display: flex; justify-content: space-between; font-size: 0.9rem; color: var(--text-sec); margin-bottom: 8px; font-weight: 600; }
.form-row { display: flex; gap: 20px; }
.form-row .form-group { flex: 1; }

.modal-input {
  width: 100%; padding: 12px 16px; border-radius: 12px;
  border: 1px solid var(--glass-border, rgba(0,0,0,0.1)); 
  background: var(--input-bg, rgba(255,255,255,0.5));
  font-size: 1rem; outline: none; transition: all 0.3s; font-family: inherit; color: var(--text-main);
}
.modal-input:focus:not(:read-only) { background: #fff; border-color: #007aff; box-shadow: 0 0 0 4px rgba(0,122,255,0.1); }
.modal-input:read-only:not(select) { background: transparent; border: none; padding: 12px 0; font-weight: 500; color: var(--text-main); resize: none; }
.modal-input:disabled { background: transparent; border: none; color: var(--text-main); opacity: 1; padding-left: 0; }
.input-warning { border-color: #ff3b30 !important; background-color: rgba(255, 59, 48, 0.05) !important; box-shadow: 0 0 0 4px rgba(255, 59, 48, 0.1) !important; }

.textarea { min-height: 120px; line-height: 1.5; resize: vertical; }

.read-only-content { min-height: 60px; height: auto; white-space: pre-wrap; line-height: 1.6; color: var(--text-main); padding: 12px 16px; }
.meta-info { font-size: 0.85rem; color: var(--text-sec); text-align: right; margin-top: 10px; }

/* 4. 按钮风格 */
.right-actions { display: flex; gap: 12px; }
.btn-primary { background: #007aff; color: #fff; border: none; padding: 10px 24px; border-radius: 20px; font-weight: 600; cursor: pointer; transition: transform 0.2s; }
.btn-primary:hover { transform: scale(1.05); }
.btn-secondary { background: rgba(120, 120, 128, 0.12); color: var(--text-main); border: none; padding: 10px 24px; border-radius: 20px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.btn-secondary:hover { background: rgba(120, 120, 128, 0.2); transform: scale(1.05); }
.btn-danger { background: #ff3b30; color: #fff; border: none; padding: 10px 24px; border-radius: 20px; font-weight: 600; cursor: pointer; transition: transform 0.2s; }
.btn-danger:hover { transform: scale(1.05); background: #ff1f1f; }

/* 5. 状态与动画 */
.status-badge { padding: 4px 12px; border-radius: 8px; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; margin-right: 10px; }
.status-badge.high { color: #ff3b30; background: rgba(255, 59, 48, 0.1); }
.status-badge.medium { color: #ff9500; background: rgba(255, 149, 0, 0.1); }
.status-badge.low { color: #34c759; background: rgba(52, 199, 89, 0.1); }
.shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
@keyframes shake { 10%, 90% { transform: translate3d(-1px, 0, 0); } 20%, 80% { transform: translate3d(2px, 0, 0); } 30%, 50%, 70% { transform: translate3d(-4px, 0, 0); } 40%, 60% { transform: translate3d(4px, 0, 0); } }

/* 6. 删除确认 */
.delete-confirm-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: var(--glass-bg, rgba(255, 255, 255, 0.85)); backdrop-filter: blur(10px); z-index: 10; display: flex; align-items: center; justify-content: center; border-radius: 35px; color: var(--text-main); }
.confirm-box { text-align: center; animation: popIn 0.3s; }
.confirm-box h3 { font-size: 1.5rem; margin-bottom: 8px; }
.confirm-box p { color: var(--text-sec); margin-bottom: 24px; }
.confirm-actions { display: flex; gap: 16px; justify-content: center; }
@keyframes popIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* --- [重要] 手机端适配 --- */
@media (max-width: 768px) {
  .modal-card {
    /* 强制全屏 */
    width: 100% !important; height: 100% !important;
    max-width: none !important; max-height: none !important;
    margin: 0 !important; border-radius: 0 !important;
    position: fixed; top: 0; left: 0;
  }
  .modal-body {
    padding: 20px !important;
    height: calc(100% - 130px); /* 留出底部操作栏位置 */
  }
  /* 表单行在手机上垂直排列，不挤压 */
  .form-row { flex-direction: column; gap: 16px; }
  
  .form-group { margin-bottom: 16px; }
  
  /* 底部固定，按钮更大 */
  .modal-footer {
    padding: 16px 20px !important;
    position: absolute; bottom: 0; width: 100%;
    background: var(--glass-bg, rgba(255, 255, 255, 0.95));
    border-top: 1px solid rgba(0,0,0,0.05);
    display: flex; gap: 12px;
  }
  .right-actions { flex: 1; justify-content: flex-end; }
  .btn-primary, .btn-secondary, .btn-danger {
    padding: 12px 16px !important;
    font-size: 15px !important;
    flex: 1; text-align: center;
  }
}
</style>
