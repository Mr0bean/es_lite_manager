<template>
  <div class="json-editor-container">
    <div class="json-editor-header">
      <div class="json-editor-actions">
        <el-button size="small" @click="formatJson" type="primary" :icon="Document">
          {{ $t('jsonEditor.format') }}
        </el-button>
        <el-button size="small" @click="validateJson" :icon="CircleCheck">
          {{ $t('jsonEditor.validate') }}
        </el-button>
        <el-button size="small" @click="compressJson" :icon="Minus">
          {{ $t('jsonEditor.compress') }}
        </el-button>
        <el-button size="small" @click="clearContent" :icon="Delete">
          {{ $t('jsonEditor.clear') }}
        </el-button>
        <el-button size="small" @click="toggleWordWrap" :type="wordWrapEnabled ? 'primary' : ''">
          {{ wordWrapEnabled ? $t('jsonEditor.disableWordWrap') : $t('jsonEditor.enableWordWrap') }}
        </el-button>
      </div>
      <div class="json-editor-status">
        <el-tag v-if="validationStatus === 'valid'" type="success" size="small">
          {{ $t('jsonEditor.validJson') }}
        </el-tag>
        <el-tag v-else-if="validationStatus === 'invalid'" type="danger" size="small">
          {{ $t('jsonEditor.invalidJson') }}
        </el-tag>
        <el-tag v-if="characterCount > 0" type="info" size="small">
          {{ characterCount }} {{ $t('jsonEditor.characters') }}
        </el-tag>
      </div>
    </div>
    <div class="json-editor-content">
      <textarea
        ref="editorRef"
        v-model="localContent"
        :class="['json-textarea', { 'word-wrap-enabled': wordWrapEnabled }]"
        :placeholder="placeholder || $t('jsonEditor.placeholder')"
        :rows="rows"
        @input="handleInput"
        @blur="handleBlur"
      ></textarea>
      <div v-if="showLineNumbers" class="line-numbers">
        <div 
          v-for="n in lineCount" 
          :key="n" 
          class="line-number"
        >
          {{ n }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Document, CircleCheck, Minus, Delete } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: ''
  },
  rows: {
    type: Number,
    default: 15
  },
  showLineNumbers: {
    type: Boolean,
    default: true
  },
  autoValidate: {
    type: Boolean,
    default: true
  },
  wordWrap: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'validate'])

const editorRef = ref(null)
const localContent = ref(props.modelValue)
const validationStatus = ref('')
const validationTimer = ref(null)
const wordWrapEnabled = ref(props.wordWrap)

// 字符数统计
const characterCount = computed(() => localContent.value.length)

// 行数统计
const lineCount = computed(() => {
  return localContent.value.split('\n').length
})

// 监听外部值变化
watch(() => props.modelValue, (newVal) => {
  if (newVal !== localContent.value) {
    localContent.value = newVal
    if (props.autoValidate) {
      validateJsonSilent()
    }
  }
})

// 监听wordWrap属性变化
watch(() => props.wordWrap, (newVal) => {
  wordWrapEnabled.value = newVal
})

// 监听本地内容变化
watch(localContent, (newVal) => {
  emit('update:modelValue', newVal)
})

// 输入处理
const handleInput = () => {
  if (props.autoValidate) {
    // 防抖验证
    if (validationTimer.value) {
      clearTimeout(validationTimer.value)
    }
    validationTimer.value = setTimeout(() => {
      validateJsonSilent()
    }, 500)
  }
}

// 失焦处理
const handleBlur = () => {
  if (props.autoValidate) {
    validateJsonSilent()
  }
}

// 格式化JSON
const formatJson = () => {
  try {
    const parsed = JSON.parse(localContent.value)
    localContent.value = JSON.stringify(parsed, null, 2)
    validationStatus.value = 'valid'
    ElMessage.success(t('jsonEditor.formatSuccess'))
    
    // 自动调整textarea高度
    nextTick(() => {
      adjustTextareaHeight()
    })
  } catch (error) {
    validationStatus.value = 'invalid'
    ElMessage.error(t('jsonEditor.formatError') + ': ' + error.message)
  }
}

// 验证JSON
const validateJson = () => {
  try {
    JSON.parse(localContent.value)
    validationStatus.value = 'valid'
    ElMessage.success(t('jsonEditor.validateSuccess'))
    emit('validate', { valid: true, data: JSON.parse(localContent.value) })
  } catch (error) {
    validationStatus.value = 'invalid'
    ElMessage.error(t('jsonEditor.validateError') + ': ' + error.message)
    emit('validate', { valid: false, error: error.message })
  }
}

// 静默验证（不显示消息）
const validateJsonSilent = () => {
  try {
    JSON.parse(localContent.value)
    validationStatus.value = 'valid'
  } catch {
    validationStatus.value = 'invalid'
  }
}

// 压缩JSON
const compressJson = () => {
  try {
    const parsed = JSON.parse(localContent.value)
    localContent.value = JSON.stringify(parsed)
    validationStatus.value = 'valid'
    ElMessage.success(t('jsonEditor.compressSuccess'))
  } catch (error) {
    validationStatus.value = 'invalid'
    ElMessage.error(t('jsonEditor.formatError') + ': ' + error.message)
  }
}

// 清空内容
const clearContent = () => {
  localContent.value = ''
  validationStatus.value = ''
  ElMessage.success(t('jsonEditor.clearSuccess'))
}

// 调整textarea高度
const adjustTextareaHeight = () => {
  if (editorRef.value) {
    editorRef.value.style.height = 'auto'
    editorRef.value.style.height = editorRef.value.scrollHeight + 'px'
  }
}

// 切换自动换行
const toggleWordWrap = () => {
  wordWrapEnabled.value = !wordWrapEnabled.value
  ElMessage.success(wordWrapEnabled.value ? t('jsonEditor.wordWrapEnabled') : t('jsonEditor.wordWrapDisabled'))
}

// 初始化验证
if (props.autoValidate && localContent.value) {
  validateJsonSilent()
}
</script>

<style scoped>
.json-editor-container {
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  overflow: hidden;
  background: #ffffff;
  width: 100%;
  max-width: 100%;
}

.json-editor-header {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 12px 16px;
  border-bottom: 1px solid #dcdfe6;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.json-editor-actions {
  display: flex;
  gap: 8px;
}

.json-editor-status {
  display: flex;
  gap: 8px;
  align-items: center;
}

.json-editor-content {
  position: relative;
  display: flex;
  flex-direction: row;
}

.json-textarea {
  flex: 1;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
  font-size: 14px;
  line-height: 1.6;
  padding: 16px;
  border: none;
  outline: none;
  resize: vertical;
  background: #fafbfc;
  color: #2c3e50;
  min-height: 400px;
  tab-size: 2;
  white-space: pre;
  overflow-wrap: normal;
  overflow-x: auto;
  width: 100%;
  box-sizing: border-box;
  order: 2;
}

.json-textarea.word-wrap-enabled {
  white-space: pre-wrap;
  overflow-wrap: break-word;
  overflow-x: hidden;
}

.json-textarea:focus {
  background: #ffffff;
  box-shadow: inset 0 0 0 1px #409eff;
}

.json-textarea::placeholder {
  color: #a8abb2;
  font-style: italic;
}

.line-numbers {
  background: #f8f9fa;
  border-right: 1px solid #e9ecef;
  padding: 16px 8px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
  font-size: 14px;
  line-height: 1.6;
  color: #6c757d;
  user-select: none;
  min-width: 50px;
  text-align: right;
  order: 1;
  flex-shrink: 0;
}

.line-number {
  height: 1.6em;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

/* 滚动条样式 */
.json-textarea::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.json-textarea::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.json-textarea::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.json-textarea::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .json-editor-header {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }
  
  .json-editor-actions {
    justify-content: center;
  }
  
  .json-editor-status {
    justify-content: center;
  }
  
  .line-numbers {
    display: none;
  }
}
</style>