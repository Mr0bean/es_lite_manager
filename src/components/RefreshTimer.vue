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
        刷新
      </el-button>
      <el-dropdown @command="handleAutoRefresh" :disabled="disabled">
        <el-button size="small" type="info" :disabled="disabled">
          定时刷新 <el-icon><ArrowDown /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item :command="0" :class="{ 'is-active': autoRefreshInterval === 0 }">
              <el-icon><Close /></el-icon> 关闭
            </el-dropdown-item>
            <el-dropdown-item :command="5000" :class="{ 'is-active': autoRefreshInterval === 5000 }">
              5秒
            </el-dropdown-item>
            <el-dropdown-item :command="10000" :class="{ 'is-active': autoRefreshInterval === 10000 }">
              10秒
            </el-dropdown-item>
            <el-dropdown-item :command="30000" :class="{ 'is-active': autoRefreshInterval === 30000 }">
              30秒
            </el-dropdown-item>
            <el-dropdown-item :command="60000" :class="{ 'is-active': autoRefreshInterval === 60000 }">
              1分钟
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <span v-if="autoRefreshInterval > 0" class="refresh-status">
        下次刷新: {{ nextRefreshCountdown }}s
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'
import { Refresh, ArrowDown, Close } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

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
    ElMessage.warning('请先完成必要的配置')
    return
  }
  
  refreshing.value = true
  try {
    await props.onRefresh()
    ElMessage.success('刷新成功')
  } catch (error) {
    ElMessage.error('刷新失败: ' + error.message)
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
      ElMessage.warning('请先完成必要的配置再启用定时刷新')
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
    
    ElMessage.success(`已启用定时刷新，间隔 ${interval / 1000} 秒`)
  } else {
    nextRefreshCountdown.value = 0
    ElMessage.info('已关闭定时刷新')
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