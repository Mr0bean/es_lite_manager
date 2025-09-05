<template>
  <div class="json-viewer-container">
    <div class="json-viewer-header">
      <div class="json-viewer-actions">
        <el-button size="small" @click="copyToClipboard" :icon="CopyDocument">
          {{ $t('jsonViewer.copy') }}
        </el-button>
        <el-button size="small" @click="toggleFormat" :icon="Document">
          {{ isFormatted ? $t('jsonViewer.compress') : $t('jsonViewer.format') }}
        </el-button>
        <el-button size="small" @click="toggleCollapse" :icon="Fold">
          {{ isCollapsed ? $t('jsonViewer.expand') : $t('jsonViewer.collapse') }}
        </el-button>
      </div>
    </div>
    <div class="json-viewer-content">
      <pre 
        ref="jsonContainer"
        class="json-content"
        :class="{ 'collapsed': isCollapsed }"
        v-html="highlightedJson"
      ></pre>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { CopyDocument, Document, Fold } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  data: {
    type: [Object, Array, String],
    required: true
  },
  height: {
    type: String,
    default: '400px'
  },
  readonly: {
    type: Boolean,
    default: true
  }
})

const jsonContainer = ref(null)
const isFormatted = ref(true)
const isCollapsed = ref(false)

// 解析JSON数据
const parsedData = computed(() => {
  if (typeof props.data === 'string') {
    try {
      return JSON.parse(props.data)
    } catch {
      return props.data
    }
  }
  return props.data
})

// 格式化JSON
const formattedJson = computed(() => {
  try {
    if (isFormatted.value) {
      return JSON.stringify(parsedData.value, null, 2)
    } else {
      return JSON.stringify(parsedData.value)
    }
  } catch {
    return String(props.data)
  }
})

// JSON语法高亮
const highlightedJson = computed(() => {
  let json = formattedJson.value
  
  if (isCollapsed.value) {
    // 折叠模式：只显示第一层
    try {
      const data = parsedData.value
      if (typeof data === 'object' && data !== null) {
        if (Array.isArray(data)) {
          json = `[...] (${data.length} ${t('jsonViewer.items')})`
        } else {
          const keys = Object.keys(data)
          json = `{...} (${keys.length} ${t('jsonViewer.keys')}: ${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '...' : ''})`
        }
      }
    } catch {
      json = formattedJson.value.substring(0, 100) + '...'
    }
  }
  
  // 语法高亮
  return json
    .replace(/"([^"]+)":/g, '<span class="json-key">"$1":</span>')
    .replace(/: "([^"]*)"/g, ': <span class="json-string">"$1"</span>')
    .replace(/: (true|false)/g, ': <span class="json-boolean">$1</span>')
    .replace(/: (null)/g, ': <span class="json-null">$1</span>')
    .replace(/: (-?\d+\.?\d*)/g, ': <span class="json-number">$1</span>')
    .replace(/([{}\[\]])/g, '<span class="json-bracket">$1</span>')
})

// 复制到剪贴板
const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(formattedJson.value)
    ElMessage.success(t('jsonViewer.copiedToClipboard'))
  } catch {
    // 降级方案
    const textArea = document.createElement('textarea')
    textArea.value = formattedJson.value
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    ElMessage.success(t('jsonViewer.copiedToClipboard'))
  }
}

// 切换格式化
const toggleFormat = () => {
  isFormatted.value = !isFormatted.value
}

// 切换折叠
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}
</script>

<style scoped>
.json-viewer-container {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #fafafa;
}

.json-viewer-header {
  padding: 8px 12px;
  background: #f5f7fa;
  border-bottom: 1px solid #dcdfe6;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.json-viewer-actions {
  display: flex;
  gap: 8px;
}

.json-viewer-content {
  position: relative;
  max-height: v-bind(height);
  overflow: auto;
}

.json-content {
  margin: 0;
  padding: 16px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.5;
  background: #ffffff;
  color: #2c3e50;
  white-space: pre-wrap;
  word-wrap: break-word;
  transition: all 0.3s ease;
}

.json-content.collapsed {
  max-height: 60px;
  overflow: hidden;
}

/* JSON语法高亮样式 */
:deep(.json-key) {
  color: #e74c3c;
  font-weight: bold;
}

:deep(.json-string) {
  color: #27ae60;
}

:deep(.json-number) {
  color: #3498db;
}

:deep(.json-boolean) {
  color: #9b59b6;
  font-weight: bold;
}

:deep(.json-null) {
  color: #95a5a6;
  font-style: italic;
}

:deep(.json-bracket) {
  color: #34495e;
  font-weight: bold;
}

/* 滚动条样式 */
.json-viewer-content::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.json-viewer-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.json-viewer-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.json-viewer-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>