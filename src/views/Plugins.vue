<template>
  <div class="plugins-container">
    <div class="page-header">
      <div class="header-top">
        <h2>插件管理</h2>
        <RefreshTimer :on-refresh="loadPluginsData" />
      </div>
      <p class="page-description">查看和管理Elasticsearch集群中已安装的插件及其版本信息</p>
    </div>

    <!-- 统计信息卡片 -->
    <el-row :gutter="20" style="margin-bottom: 24px;">
      <el-col :span="6">
        <el-card class="stats-card">
          <el-statistic title="节点数量" :value="pluginsData?.totalNodes || 0" suffix="个">
            <template #prefix>
              <el-icon color="#409EFF"><Monitor /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stats-card">
          <el-statistic title="插件总数" :value="pluginsData?.totalPlugins || 0" suffix="个">
            <template #prefix>
              <el-icon color="#67C23A"><Grid /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stats-card">
          <el-statistic title="分词器插件" :value="analyzerPluginsCount" suffix="个">
            <template #prefix>
              <el-icon color="#E6A23C"><Tools /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stats-card">
          <el-statistic title="其他插件" :value="otherPluginsCount" suffix="个">
            <template #prefix>
              <el-icon color="#F56C6C"><Box /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
    </el-row>

    <!-- 插件列表 -->
    <el-card>
      <template #header>
        <div class="card-header">
          <span>已安装插件列表</span>
          <div class="header-actions">
            <el-input
              v-model="searchText"
              placeholder="搜索插件..."
              style="width: 250px;"
              clearable
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-select v-model="filterType" placeholder="插件类型" style="width: 150px; margin-left: 12px;">
              <el-option label="全部" value="all" />
              <el-option label="分词器" value="analyzer" />
              <el-option label="安全" value="security" />
              <el-option label="监控" value="monitoring" />
              <el-option label="其他" value="other" />
            </el-select>
          </div>
        </div>
      </template>

      <el-table :data="filteredPlugins" v-loading="loading" stripe>
        <el-table-column prop="name" label="插件名称" width="200">
          <template #default="scope">
            <div class="plugin-name">
              <el-icon class="plugin-icon" :color="getPluginIconColor(scope.row)">
                <component :is="getPluginIcon(scope.row)" />
              </el-icon>
              <span>{{ scope.row.name }}</span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="version" label="版本" width="120">
          <template #default="scope">
            <el-tag size="small" type="info">{{ scope.row.version || 'N/A' }}</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="description" label="描述" min-width="300">
          <template #default="scope">
            <span class="plugin-desc">{{ scope.row.description || '暂无描述' }}</span>
          </template>
        </el-table-column>
        
        <el-table-column label="插件类型" width="120">
          <template #default="scope">
            <el-tag :type="getPluginTypeTag(scope.row)" size="small">
              {{ getPluginType(scope.row) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="安装节点" width="120">
          <template #default="scope">
            <el-tag type="success" size="small">
              {{ getInstalledNodesCount(scope.row) }} 个节点
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="150">
          <template #default="scope">
            <el-button size="small" @click="showPluginDetails(scope.row)">查看详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 插件详情对话框 -->
    <el-dialog v-model="showDetailsDialog" title="插件详情" width="700px">
      <div v-if="currentPlugin">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="插件名称">
            <div class="plugin-name">
              <el-icon class="plugin-icon" :color="getPluginIconColor(currentPlugin)">
                <component :is="getPluginIcon(currentPlugin)" />
              </el-icon>
              {{ currentPlugin.name }}
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="版本">
            <el-tag type="info">{{ currentPlugin.version || 'N/A' }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="描述">
            {{ currentPlugin.description || '暂无描述' }}
          </el-descriptions-item>
          <el-descriptions-item label="主类">
            <code>{{ currentPlugin.classname || 'N/A' }}</code>
          </el-descriptions-item>
          <el-descriptions-item label="插件类型">
            <el-tag :type="getPluginTypeTag(currentPlugin)">
              {{ getPluginType(currentPlugin) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="安装节点">
            <div class="nodes-list">
              <div v-for="nodeId in getPluginNodes(currentPlugin)" :key="nodeId" class="node-item">
                <el-tag type="success" size="small">
                  {{ pluginsData.nodes[nodeId]?.name || nodeId }}
                </el-tag>
                <span class="node-host">{{ pluginsData.nodes[nodeId]?.host }}</span>
              </div>
            </div>
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Monitor, Grid, Tools, Box, Search, Setting, Shield, DataAnalysis, Document } from '@element-plus/icons-vue'
import * as api from '../api/elasticsearch'
import RefreshTimer from '../components/RefreshTimer.vue'

const loading = ref(false)
const pluginsData = ref(null)
const searchText = ref('')
const filterType = ref('all')
const showDetailsDialog = ref(false)
const currentPlugin = ref(null)

// 计算属性
const analyzerPluginsCount = computed(() => {
  if (!pluginsData.value?.plugins) return 0
  return pluginsData.value.plugins.filter(plugin => 
    isAnalyzerPlugin(plugin)
  ).length
})

const otherPluginsCount = computed(() => {
  if (!pluginsData.value?.plugins) return 0
  return pluginsData.value.plugins.filter(plugin => 
    !isAnalyzerPlugin(plugin)
  ).length
})

const filteredPlugins = computed(() => {
  if (!pluginsData.value?.plugins) return []
  
  let filtered = pluginsData.value.plugins
  
  // 文本搜索
  if (searchText.value) {
    const search = searchText.value.toLowerCase()
    filtered = filtered.filter(plugin => 
      plugin.name.toLowerCase().includes(search) ||
      (plugin.description && plugin.description.toLowerCase().includes(search))
    )
  }
  
  // 类型过滤
  if (filterType.value !== 'all') {
    filtered = filtered.filter(plugin => {
      const type = getPluginType(plugin).toLowerCase()
      return type.includes(filterType.value)
    })
  }
  
  return filtered
})

// 工具函数
const isAnalyzerPlugin = (plugin) => {
  const analyzerKeywords = ['analysis', 'analyzer', 'tokenizer', 'ik', 'pinyin', 'smartcn']
  return analyzerKeywords.some(keyword => 
    plugin.name.toLowerCase().includes(keyword) ||
    (plugin.description && plugin.description.toLowerCase().includes(keyword))
  )
}

const getPluginType = (plugin) => {
  const name = plugin.name.toLowerCase()
  const desc = (plugin.description || '').toLowerCase()
  
  if (name.includes('analysis') || name.includes('analyzer') || name.includes('ik') || name.includes('pinyin')) {
    return '分词器'
  } else if (name.includes('security') || name.includes('xpack-security')) {
    return '安全'
  } else if (name.includes('monitoring') || name.includes('watcher')) {
    return '监控'
  } else if (name.includes('ingest')) {
    return '数据处理'
  } else {
    return '其他'
  }
}

const getPluginTypeTag = (plugin) => {
  const type = getPluginType(plugin)
  const tagMap = {
    '分词器': 'warning',
    '安全': 'danger',
    '监控': 'success',
    '数据处理': 'info',
    '其他': ''
  }
  return tagMap[type] || ''
}

const getPluginIcon = (plugin) => {
  const type = getPluginType(plugin)
  const iconMap = {
    '分词器': Tools,
    '安全': Shield,
    '监控': DataAnalysis,
    '数据处理': Document,
    '其他': Setting
  }
  return iconMap[type] || Setting
}

const getPluginIconColor = (plugin) => {
  const type = getPluginType(plugin)
  const colorMap = {
    '分词器': '#E6A23C',
    '安全': '#F56C6C',
    '监控': '#67C23A',
    '数据处理': '#409EFF',
    '其他': '#909399'
  }
  return colorMap[type] || '#909399'
}

const getInstalledNodesCount = (plugin) => {
  if (!pluginsData.value?.nodes) return 0
  
  let count = 0
  Object.values(pluginsData.value.nodes).forEach(node => {
    if (node.plugins?.some(p => p.name === plugin.name)) {
      count++
    }
  })
  return count
}

const getPluginNodes = (plugin) => {
  if (!pluginsData.value?.nodes) return []
  
  const nodeIds = []
  Object.entries(pluginsData.value.nodes).forEach(([nodeId, node]) => {
    if (node.plugins?.some(p => p.name === plugin.name)) {
      nodeIds.push(nodeId)
    }
  })
  return nodeIds
}

const showPluginDetails = (plugin) => {
  currentPlugin.value = plugin
  showDetailsDialog.value = true
}

const loadPluginsData = async () => {
  loading.value = true
  try {
    const data = await api.getPlugins()
    pluginsData.value = data
  } catch (error) {
    ElMessage.error('获取插件信息失败: ' + error.message)
    console.error('获取插件信息失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadPluginsData()
})
</script>

<style scoped>
.plugins-container {
  padding: 20px;
}

.page-header {
  margin-bottom: 24px;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.header-top h2 {
  margin: 0;
  color: #1f2937;
  font-size: 24px;
  font-weight: 600;
}

.page-description {
  color: #6b7280;
  margin: 0;
  font-size: 14px;
}

.stats-card {
  text-align: center;
}

.stats-card :deep(.el-statistic__content) {
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  align-items: center;
}

.plugin-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.plugin-icon {
  font-size: 16px;
}

.plugin-desc {
  color: #606266;
  line-height: 1.5;
}

.nodes-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.node-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.node-host {
  color: #909399;
  font-size: 12px;
}

/* 表格样式 */
:deep(.el-table--striped .el-table__body tr.el-table__row--striped td) {
  background-color: #fafbfc !important;
}

:deep(.el-table__body tr:hover > td) {
  background-color: #f0f9ff !important;
}

:deep(.el-table th.el-table__cell) {
  background-color: #f8fafc !important;
  color: #374151;
  font-weight: 600;
}

:deep(.el-table td.el-table__cell) {
  border-bottom: 1px solid #f1f5f9;
}
</style>