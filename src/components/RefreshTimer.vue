<template>
  <div class="refresh-timer">
    <div class="header-actions">
      <el-button 
        type="primary" 
        :icon="Refresh" 
        @click="handleRefresh"
        :loading="refreshing"
        :disabled="disabled"
        size="small"
      >
        {{ $t('actions.refresh') }}
      </el-button>
      <el-dropdown @command="handleAutoRefresh" :disabled="disabled">
        <el-button size="small" type="info" :disabled="disabled">
          {{ $t('pages.search.autoRefresh') }} <el-icon><ArrowDown /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item :command="0" :class="{ 'is-active': autoRefreshInterval === 0 }">
              <el-icon><Close /></el-icon> {{ $t('pages.search.autoRefreshIntervals.disable') }}
            </el-dropdown-item>
            <el-dropdown-item :command="5000" :class="{ 'is-active': autoRefreshInterval === 5000 }">
              {{ $t('pages.search.autoRefreshIntervals.5s') }}
            </el-dropdown-item>
            <el-dropdown-item :command="10000" :class="{ 'is-active': autoRefreshInterval === 10000 }">
              {{ $t('pages.search.autoRefreshIntervals.10s') }}
            </el-dropdown-item>
            <el-dropdown-item :command="30000" :class="{ 'is-active': autoRefreshInterval === 30000 }">
              {{ $t('pages.search.autoRefreshIntervals.30s') }}
            </el-dropdown-item>
            <el-dropdown-item :command="60000" :class="{ 'is-active': autoRefreshInterval === 60000 }">
              {{ $t('pages.search.autoRefreshIntervals.1m') }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <span v-if="autoRefreshInterval > 0" class="refresh-status">
        {{ $t('pages.search.nextRefresh') }}: {{ nextRefreshCountdown }}s
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'
import { Refresh, ArrowDown, Close } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// 定义 props
const props = defineProps({
  onRefresh: {
    type: Function,
    required: true
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

// 响应式数据
const refreshing = ref(false)
const autoRefreshInterval = ref(0)
const nextRefreshCountdown = ref(0)
let autoRefreshTimer = null
let countdownTimer = null

// 手动刷新
const handleRefresh = async () => {
  if (props.disabled) {
    ElMessage.warning(t('warnings.pleaseCompleteConfig'))
    return
  }
  
  refreshing.value = true
  try {
    await props.onRefresh()
    ElMessage.success(t('messages.refreshSuccess'))
  } catch (error) {
    ElMessage.error(t('errors.refreshFailed') + ': ' + error.message)
  } finally {
    refreshing.value = false
  }
}

// 处理自动刷新
const handleAutoRefresh = (interval) => {
  autoRefreshInterval.value = interval
  
  // 清除现有定时器
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer)
    autoRefreshTimer = null
  }
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
  
  if (interval > 0) {
    if (props.disabled) {
      ElMessage.warning(t('warnings.pleaseCompleteConfigForAutoRefresh'))
      autoRefreshInterval.value = 0
      return
    }
    
    // 设置倒计时
    nextRefreshCountdown.value = Math.floor(interval / 1000)
    
    // 倒计时定时器
    countdownTimer = setInterval(() => {
      nextRefreshCountdown.value--
      if (nextRefreshCountdown.value <= 0) {
        nextRefreshCountdown.value = Math.floor(interval / 1000)
      }
    }, 1000)
    
    // 自动刷新定时器
    autoRefreshTimer = setInterval(() => {
      if (!props.disabled) {
        handleRefresh()
      }
    }, interval)
    
    ElMessage.success(t('success.autoRefreshEnabled', { interval: interval / 1000 }))
  } else {
    nextRefreshCountdown.value = 0
    ElMessage.info(t('success.autoRefreshDisabled'))
  }
}

// 组件卸载时清理定时器
onUnmounted(() => {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer)
  }
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
})

// 暴露方法给父组件
defineExpose({
  stopAutoRefresh: () => handleAutoRefresh(0)
})
</script>

<style scoped>
.refresh-timer {
  display: inline-block;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.refresh-status {
  font-size: 12px;
  color: #909399;
  background: #f5f7fa;
  padding: 4px 8px;
  border-radius: 4px;
}

.is-active {
  background-color: #ecf5ff;
  color: #409eff;
}
</style>