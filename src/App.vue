<template>
  <el-container class="app-container">
    <el-header class="app-header">
      <div class="header-content">
        <h1>{{ $t('app.title') }}</h1>
        <div class="header-right">
          <!-- 语言切换器 -->
          <LanguageSwitcher />
          
          <!-- 连接状态 -->
          <div class="connection-status">
          <!-- 连接切换器 -->
          <el-dropdown @command="handleConnectionCommand" trigger="click" class="connection-dropdown">
            <el-tag 
              :type="connectionStatus ? 'success' : 'danger'"
              size="large"
              class="connection-tag"
            >
              <el-icon class="connection-icon">
                <component :is="connectionStatus ? 'CircleCheckFilled' : 'CircleCloseFilled'" />
              </el-icon>
              <span class="connection-text">
                {{ currentConnectionName || $t('connection.notConnected') }}
              </span>
              <el-icon class="arrow-icon"><ArrowDown /></el-icon>
            </el-tag>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item disabled>
                  <strong>{{ $t('connection.switchConnection') }}</strong>
                </el-dropdown-item>
                <el-dropdown-item divided v-for="conn in availableConnections" :key="conn.id" :command="conn.id" :disabled="conn.isCurrent">
                  <div class="dropdown-connection-item">
                    <el-icon v-if="conn.isCurrent" color="#67c23a"><CircleCheckFilled /></el-icon>
                    <span>{{ conn.name }}</span>
                    <small class="connection-url">{{ conn.protocol }}://{{ conn.host }}:{{ conn.port }}</small>
                  </div>
                </el-dropdown-item>
                <el-dropdown-item divided command="manage">
                  <el-icon><Setting /></el-icon>
                  {{ $t('connection.manageConnections') }}
                </el-dropdown-item>
                <el-dropdown-item command="refresh">
                  <el-icon><Refresh /></el-icon>
                  {{ $t('connection.refreshStatus') }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          
          <!-- 连接信息显示 -->
          <el-popover
            v-if="connectionStatus && connectionInfo"
            placement="bottom-end"
            :width="320"
            trigger="hover"
            popper-class="connection-info-popover"
          >
            <template #reference>
              <el-button text class="info-btn">
                <el-icon><InfoFilled /></el-icon>
              </el-button>
            </template>
            <div class="connection-info">
              <div class="info-item">
                <span class="info-label">{{ $t('connection.currentConnection') }}:</span>
                <span class="info-value">{{ currentConnectionName }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{ $t('connection.clusterName') }}:</span>
                <span class="info-value">{{ connectionInfo.cluster_name || 'N/A' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{ $t('connection.nodeName') }}:</span>
                <span class="info-value">{{ connectionInfo.name || 'N/A' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{ $t('connection.version') }}:</span>
                <span class="info-value">{{ connectionInfo.version?.number || 'N/A' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{ $t('connection.status') }}:</span>
                <el-tag size="small" type="success">{{ $t('connection.running') }}</el-tag>
              </div>
              <div class="info-item">
                <span class="info-label">{{ $t('connection.connectionTime') }}:</span>
                <span class="info-value">{{ formatTime(connectionTime) }}</span>
              </div>
            </div>
          </el-popover>
          </div>
        </div>
      </div>
    </el-header>
    
    <el-container>
      <el-aside width="260px" class="app-aside">
        <div class="aside-content">
          <el-menu :default-active="$route.path" router>
            <el-menu-item index="/">
              <el-icon><Search /></el-icon>
              <span>{{ $t('menu.search') }}</span>
            </el-menu-item>
            <el-menu-item index="/indices">
              <el-icon><Files /></el-icon>
              <span>{{ $t('menu.indices') }}</span>
            </el-menu-item>
            <el-menu-item index="/documents">
              <el-icon><Document /></el-icon>
              <span>{{ $t('menu.documents') }}</span>
            </el-menu-item>
            <el-menu-item index="/stats">
              <el-icon><DataAnalysis /></el-icon>
              <span>{{ $t('menu.stats') }}</span>
            </el-menu-item>
            <el-menu-item index="/policies">
              <el-icon><Setting /></el-icon>
              <span>{{ $t('menu.policies') }}</span>
            </el-menu-item>
            <el-menu-item index="/analyzers">
              <el-icon><Tools /></el-icon>
              <span>{{ $t('menu.analyzers') }}</span>
            </el-menu-item>
            <el-menu-item index="/mappings">
              <el-icon><Grid /></el-icon>
              <span>{{ $t('menu.mappings') }}</span>
            </el-menu-item>
            <el-menu-item index="/plugins">
              <el-icon><Box /></el-icon>
              <span>{{ $t('menu.plugins') }}</span>
            </el-menu-item>
            <el-menu-item index="/connections">
              <el-icon><Link /></el-icon>
              <span>{{ $t('menu.connections') }}</span>
            </el-menu-item>
            <el-menu-item index="/settings">
              <el-icon><Setting /></el-icon>
              <span>{{ $t('menu.settings') }}</span>
            </el-menu-item>
          </el-menu>
          
          <!-- 广告展示区域 -->
          <div class="ads-wrapper">
            <AdsDisplay 
              position="sidebar"
              :show-header="true"
              :show-refresh="true"
              :auto-rotate="true"
            />
          </div>
        </div>
      </el-aside>
      
      <el-main class="app-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
  
  <!-- 全局反馈对话框 -->
  <FeedbackDialog
    v-model="feedbackVisible"
    :initial-type="feedbackType"
    :initial-data="feedbackData"
    @submitted="(data) => console.log('Feedback submitted:', data)"
  />
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Search, Files, Document, DataAnalysis, Setting, Tools, Grid, Box, CircleCheckFilled, CircleCloseFilled, ArrowDown, InfoFilled, Refresh, Link } from '@element-plus/icons-vue'
import { checkConnection, getConnections, getCurrentConnection, switchConnection } from './api/elasticsearch'
import { ElMessage } from 'element-plus'
import LanguageSwitcher from './components/LanguageSwitcher.vue'
import AdsDisplay from './components/AdsDisplay.vue'
import FeedbackDialog from './components/FeedbackDialog.vue'
import { useKeyboardShortcuts } from './composables/useKeyboardShortcuts'

const router = useRouter()
const { t } = useI18n()
const connectionStatus = ref(false)
const connectionInfo = ref(null)
const connectionTime = ref(null)
const currentConnectionName = ref('')
const availableConnections = ref([])
const switchingConnection = ref(false)

// 反馈对话框
const feedbackVisible = ref(false)
const feedbackType = ref('bug')
const feedbackData = ref({})

// 启用快捷键
useKeyboardShortcuts()

// 格式化时间显示
const formatTime = (time) => {
  if (!time) return 'N/A'
  return new Date(time).toLocaleString('zh-CN')
}

// 检查连接状态
const checkESConnection = async () => {
  try {
    const result = await checkConnection()
    connectionStatus.value = result.connected
    if (result.connected && result.info) {
      connectionInfo.value = result.info
      connectionTime.value = new Date()
    }
  } catch (error) {
    connectionStatus.value = false
    connectionInfo.value = null
  }
}

// 加载当前连接和可用连接
const loadConnections = async () => {
  try {
    // 获取当前连接
    const currentConn = await getCurrentConnection()
    if (currentConn) {
      currentConnectionName.value = currentConn.name
    }
    
    // 获取所有连接
    const connections = await getConnections()
    availableConnections.value = connections
  } catch (error) {
    console.error('加载连接列表失败:', error)
  }
}

// 处理连接命令
const handleConnectionCommand = async (command) => {
  if (command === 'manage') {
    // 跳转到连接管理页面
    router.push('/connections')
    return
  }
  
  if (command === 'refresh') {
    // 刷新连接状态
    await Promise.all([checkESConnection(), loadConnections()])
    ElMessage.success(t('messages.refreshSuccess'))
    return
  }
  
  // 切换连接
  if (command && !switchingConnection.value) {
    switchingConnection.value = true
    try {
      await switchConnection(command)
      ElMessage.success(t('messages.switchConnectionSuccess'))
      // 刷新状态
      await Promise.all([checkESConnection(), loadConnections()])
    } catch (error) {
      ElMessage.error(t('messages.switchConnectionFailed') + ': ' + error.message)
    } finally {
      switchingConnection.value = false
    }
  }
}

// 监听自定义事件
const handleOpenFeedback = (event) => {
  feedbackType.value = event.detail?.type || 'bug'
  feedbackData.value = event.detail?.data || {}
  feedbackVisible.value = true
}

const handleCloseDialog = () => {
  feedbackVisible.value = false
}

const handleConnectionChanged = async () => {
  await Promise.all([checkESConnection(), loadConnections()])
}

onMounted(async () => {
  await Promise.all([checkESConnection(), loadConnections()])
  
  // 定期检查连接状态
  setInterval(checkESConnection, 30000) // 每30秒检查一次
  
  // 监听各种事件
  window.addEventListener('connectionChanged', handleConnectionChanged)
  window.addEventListener('open-feedback', handleOpenFeedback)
  window.addEventListener('close-dialog', handleCloseDialog)
})

onUnmounted(() => {
  window.removeEventListener('connectionChanged', handleConnectionChanged)
  window.removeEventListener('open-feedback', handleOpenFeedback)
  window.removeEventListener('close-dialog', handleCloseDialog)
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.app-container {
  height: 100vh;
}

.app-header {
  background: linear-gradient(135deg, #409EFF 0%, #67C23A 100%);
  color: white;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.3);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.app-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  animation: shimmer 3s infinite;
}

.app-header:hover {
  box-shadow: 0 4px 20px rgba(64, 158, 255, 0.4);
  transform: translateY(-1px);
}

.header-content {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  position: relative;
  z-index: 1;
}

.header-content h1 {
  font-size: 24px;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  animation: fadeInLeft 0.8s ease-out;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
  animation: fadeInRight 0.8s ease-out;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 10px;
}

.connection-dropdown .connection-tag {
  font-weight: 500;
  padding: 10px 20px;
  border-radius: 25px;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  max-width: 300px;
}

.connection-dropdown {
  margin-right: 10px;
}

.arrow-icon {
  font-size: 12px;
  transition: transform 0.3s ease;
}

.connection-dropdown:hover .arrow-icon {
  transform: rotate(180deg);
}

.dropdown-connection-item {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 250px;
}

.connection-url {
  color: #909399;
  font-size: 12px;
  margin-left: auto;
}

.info-btn {
  padding: 8px;
  color: rgba(255, 255, 255, 0.8);
}

.info-btn:hover {
  color: white;
  background: rgba(255, 255, 255, 0.1);
}

.connection-dropdown .connection-tag:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
}

.connection-dropdown .connection-tag.el-tag--success {
  background: linear-gradient(135deg, #67C23A, #85CE61);
  border: none;
  color: white;
  animation: pulse 2s infinite;
}

.connection-dropdown .connection-tag.el-tag--danger {
  background: linear-gradient(135deg, #F56C6C, #F78989);
  border: none;
  color: white;
  animation: shake 0.5s ease-in-out;
}

.connection-icon {
  font-size: 16px;
}

.connection-text {
  font-weight: 600;
}

.connection-info {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #e9ecef;
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-weight: 600;
  color: #495057;
  font-size: 13px;
}

.info-value {
  color: #212529;
  font-size: 13px;
  font-family: 'Monaco', 'Menlo', monospace;
  background: #e9ecef;
  padding: 2px 8px;
  border-radius: 4px;
}

/* 浮窗层级样式 */
:deep(.connection-info-popover) {
  z-index: 99999 !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15) !important;
  border: 1px solid #e4e7ed !important;
  border-radius: 8px !important;
  background: white !important;
}

:deep(.connection-info-popover .el-popover__content) {
  padding: 0 !important;
}

/* 下拉菜单样式 */
:deep(.el-dropdown-menu) {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15) !important;
  border: 1px solid #e4e7ed !important;
  border-radius: 8px !important;
}

:deep(.el-dropdown-menu .el-dropdown-menu__item) {
  padding: 12px 16px;
}

:deep(.el-dropdown-menu .el-dropdown-menu__item:hover) {
  background: #f5f7fa;
}

@keyframes shimmer {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}

@keyframes fadeInLeft {
  0% {
    opacity: 0;
    transform: translateX(-30px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes fadeInRight {
  0% {
    opacity: 0;
    transform: translateX(30px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

@keyframes shake {
  0%, 100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-5px);
  }
  75% {
    transform: translateX(5px);
  }
}

.app-aside {
  background-color: #f5f7fa;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
}

.aside-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.el-menu {
  flex: 1;
  overflow-y: auto;
  border-right: none;
}

.ads-wrapper {
  padding: 10px;
  border-top: 1px solid #e4e7ed;
  background: #fff;
}

.app-main {
  background-color: #fff;
}
</style>