<template>
  <el-container class="app-container">
    <el-header class="app-header">
      <div class="header-content">
        <h1>Elasticsearch Manager</h1>
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
                {{ currentConnectionName || 'ES 未连接' }}
              </span>
              <el-icon class="arrow-icon"><ArrowDown /></el-icon>
            </el-tag>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item disabled>
                  <strong>切换连接</strong>
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
                  管理连接
                </el-dropdown-item>
                <el-dropdown-item command="refresh">
                  <el-icon><Refresh /></el-icon>
                  刷新状态
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
                <span class="info-label">当前连接:</span>
                <span class="info-value">{{ currentConnectionName }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">集群名称:</span>
                <span class="info-value">{{ connectionInfo.cluster_name || 'N/A' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">节点名称:</span>
                <span class="info-value">{{ connectionInfo.name || 'N/A' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">版本:</span>
                <span class="info-value">{{ connectionInfo.version?.number || 'N/A' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">状态:</span>
                <el-tag size="small" type="success">运行中</el-tag>
              </div>
              <div class="info-item">
                <span class="info-label">连接时间:</span>
                <span class="info-value">{{ formatTime(connectionTime) }}</span>
              </div>
            </div>
          </el-popover>
        </div>
      </div>
    </el-header>
    
    <el-container>
      <el-aside width="200px" class="app-aside">
        <el-menu :default-active="$route.path" router>
          <el-menu-item index="/">
            <el-icon><Search /></el-icon>
            <span>搜索</span>
          </el-menu-item>
          <el-menu-item index="/indices">
            <el-icon><Files /></el-icon>
            <span>索引管理</span>
          </el-menu-item>
          <el-menu-item index="/documents">
            <el-icon><Document /></el-icon>
            <span>文档管理</span>
          </el-menu-item>
          <el-menu-item index="/stats">
            <el-icon><DataAnalysis /></el-icon>
            <span>统计分析</span>
          </el-menu-item>
          <el-menu-item index="/policies">
            <el-icon><Setting /></el-icon>
            <span>策略管理</span>
          </el-menu-item>
          <el-menu-item index="/analyzers">
            <el-icon><Tools /></el-icon>
            <span>分词器管理</span>
          </el-menu-item>
          <el-menu-item index="/mappings">
            <el-icon><Grid /></el-icon>
            <span>映射管理</span>
          </el-menu-item>
          <el-menu-item index="/plugins">
            <el-icon><Box /></el-icon>
            <span>插件管理</span>
          </el-menu-item>
          <el-menu-item index="/connections">
            <el-icon><Link /></el-icon>
            <span>连接管理</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      
      <el-main class="app-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Search, Files, Document, DataAnalysis, Setting, Tools, Grid, Box, CircleCheckFilled, CircleCloseFilled, ArrowDown, InfoFilled, Refresh, Link } from '@element-plus/icons-vue'
import { checkConnection, getConnections, getCurrentConnection, switchConnection } from './api/elasticsearch'
import { ElMessage } from 'element-plus'

const connectionStatus = ref(false)
const connectionInfo = ref(null)
const connectionTime = ref(null)
const currentConnectionName = ref('')
const availableConnections = ref([])
const switchingConnection = ref(false)

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
    window.location.href = '/connections'
    return
  }
  
  if (command === 'refresh') {
    // 刷新连接状态
    await Promise.all([checkESConnection(), loadConnections()])
    ElMessage.success('刷新成功')
    return
  }
  
  // 切换连接
  if (command && !switchingConnection.value) {
    switchingConnection.value = true
    try {
      await switchConnection(command)
      ElMessage.success('连接切换成功')
      // 刷新状态
      await Promise.all([checkESConnection(), loadConnections()])
    } catch (error) {
      ElMessage.error('连接切换失败: ' + error.message)
    } finally {
      switchingConnection.value = false
    }
  }
}

onMounted(async () => {
  await Promise.all([checkESConnection(), loadConnections()])
  
  // 定期检查连接状态
  setInterval(checkESConnection, 30000) // 每30秒检查一次
  
  // 监听连接变更事件
  window.addEventListener('connectionChanged', async () => {
    await Promise.all([checkESConnection(), loadConnections()])
  })
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

.connection-status {
  animation: fadeInRight 0.8s ease-out;
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
}

.app-main {
  background-color: #fff;
}
</style>