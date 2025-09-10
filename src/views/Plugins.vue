<template>
  <div class="plugins-container">
    <div class="page-header">
      <div class="header-top">
        <h2>{{ $t('pages.plugins.title') }}</h2>
        <RefreshTimer :on-refresh="loadPluginsData" />
      </div>
      <p class="page-description">{{ $t('pages.plugins.description') }}</p>
    </div>

    <!-- Statistics Cards -->
    <el-row :gutter="20" style="margin-bottom: 24px;">
      <el-col :span="6">
        <el-card class="stats-card">
          <el-statistic :title="$t('pages.plugins.stats.nodes')" :value="pluginsData?.totalNodes || 0" :suffix="$t('common.units.count')">
            <template #prefix>
              <el-icon color="#409EFF"><Monitor /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stats-card">
          <el-statistic :title="$t('pages.plugins.stats.total')" :value="pluginsData?.totalPlugins || 0" :suffix="$t('common.units.count')">
            <template #prefix>
              <el-icon color="#67C23A"><Grid /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stats-card">
          <el-statistic :title="$t('pages.plugins.stats.analyzers')" :value="analyzerPluginsCount" :suffix="$t('common.units.count')">
            <template #prefix>
              <el-icon color="#E6A23C"><Tools /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stats-card">
          <el-statistic :title="$t('pages.plugins.stats.others')" :value="otherPluginsCount" :suffix="$t('common.units.count')">
            <template #prefix>
              <el-icon color="#F56C6C"><Box /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
    </el-row>

    <!-- Plugin List -->
    <el-card>
      <template #header>
        <div class="card-header">
          <span>{{ $t('pages.plugins.installedList') }}</span>
          <div class="header-actions">
            <el-input
              v-model="searchText"
              :placeholder="$t('pages.plugins.searchPlaceholder')"
              style="width: 250px;"
              clearable
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-select v-model="filterType" :placeholder="$t('pages.plugins.typePlaceholder')" style="width: 150px; margin-left: 12px;">
              <el-option :label="$t('pages.plugins.types.all')" value="all" />
              <el-option :label="$t('pages.plugins.types.analyzer')" value="analyzer" />
              <el-option :label="$t('pages.plugins.types.security')" value="security" />
              <el-option :label="$t('pages.plugins.types.monitoring')" value="monitoring" />
              <el-option :label="$t('pages.plugins.types.other')" value="other" />
            </el-select>
          </div>
        </div>
      </template>

      <el-table :data="filteredPlugins" v-loading="loading" stripe>
        <el-table-column prop="name" :label="$t('pages.plugins.fields.name')" width="200">
          <template #default="scope">
            <div class="plugin-name">
              <el-icon class="plugin-icon" :color="getPluginIconColor(scope.row)">
                <component :is="getPluginIcon(scope.row)" />
              </el-icon>
              <span>{{ scope.row.name }}</span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="version" :label="$t('pages.plugins.fields.version')" width="120">
          <template #default="scope">
            <el-tag size="small" type="info">{{ scope.row.version || 'N/A' }}</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="description" :label="$t('pages.plugins.fields.description')" min-width="300">
          <template #default="scope">
            <span class="plugin-desc">{{ scope.row.description || $t('pages.plugins.noDescription') }}</span>
          </template>
        </el-table-column>
        
        <el-table-column :label="$t('pages.plugins.fields.type')" width="120">
          <template #default="scope">
            <el-tag :type="getPluginTypeTag(scope.row)" size="small">
              {{ getPluginType(scope.row) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column :label="$t('pages.plugins.fields.installedNodes')" width="120">
          <template #default="scope">
            <el-tag type="success" size="small">
              {{ getInstalledNodesCount(scope.row) }} {{ $t('pages.plugins.nodeUnit') }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column :label="$t('pages.plugins.fields.actions')" width="150">
          <template #default="scope">
            <el-button size="small" @click="showPluginDetails(scope.row)">{{ $t('pages.plugins.viewDetails') }}</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Plugin Details Dialog -->
    <el-dialog v-model="showDetailsDialog" :title="$t('pages.plugins.detailsTitle')" width="700px">
      <div v-if="currentPlugin">
        <el-descriptions :column="1" border>
          <el-descriptions-item :label="$t('pages.plugins.fields.name')">
            <div class="plugin-name">
              <el-icon class="plugin-icon" :color="getPluginIconColor(currentPlugin)">
                <component :is="getPluginIcon(currentPlugin)" />
              </el-icon>
              {{ currentPlugin.name }}
            </div>
          </el-descriptions-item>
          <el-descriptions-item :label="$t('pages.plugins.fields.version')">
            <el-tag type="info">{{ currentPlugin.version || 'N/A' }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item :label="$t('pages.plugins.fields.description')">
            {{ currentPlugin.description || $t('pages.plugins.noDescription') }}
          </el-descriptions-item>
          <el-descriptions-item :label="$t('pages.plugins.fields.mainClass')">
            <code>{{ currentPlugin.classname || 'N/A' }}</code>
          </el-descriptions-item>
          <el-descriptions-item :label="$t('pages.plugins.fields.type')">
            <el-tag :type="getPluginTypeTag(currentPlugin)">
              {{ getPluginType(currentPlugin) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item :label="$t('pages.plugins.fields.installedNodes')">
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
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { Monitor, Grid, Tools, Box, Search, Setting, Lock, TrendCharts, Document } from '@element-plus/icons-vue'
import * as api from '../api/elasticsearch'
import RefreshTimer from '../components/RefreshTimer.vue'

const { t } = useI18n()

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
    return t('pages.plugins.types.analyzer')
  } else if (name.includes('security') || name.includes('xpack-security')) {
    return t('pages.plugins.types.security')
  } else if (name.includes('monitoring') || name.includes('watcher')) {
    return t('pages.plugins.types.monitoring')
  } else if (name.includes('ingest')) {
    return t('pages.plugins.types.dataProcessing')
  } else {
    return t('pages.plugins.types.other')
  }
}

const getPluginTypeTag = (plugin) => {
  const name = plugin.name.toLowerCase()
  
  if (name.includes('analysis') || name.includes('analyzer') || name.includes('ik') || name.includes('pinyin')) {
    return 'warning'
  } else if (name.includes('security') || name.includes('xpack-security')) {
    return 'danger'
  } else if (name.includes('monitoring') || name.includes('watcher')) {
    return 'success'
  } else if (name.includes('ingest')) {
    return 'info'
  } else {
    return ''
  }
}

const getPluginIcon = (plugin) => {
  const name = plugin.name.toLowerCase()
  
  if (name.includes('analysis') || name.includes('analyzer') || name.includes('ik') || name.includes('pinyin')) {
    return Tools
  } else if (name.includes('security') || name.includes('xpack-security')) {
    return Lock
  } else if (name.includes('monitoring') || name.includes('watcher')) {
    return TrendCharts
  } else if (name.includes('ingest')) {
    return Document
  } else {
    return Setting
  }
}

const getPluginIconColor = (plugin) => {
  const name = plugin.name.toLowerCase()
  
  if (name.includes('analysis') || name.includes('analyzer') || name.includes('ik') || name.includes('pinyin')) {
    return '#E6A23C'
  } else if (name.includes('security') || name.includes('xpack-security')) {
    return '#F56C6C'
  } else if (name.includes('monitoring') || name.includes('watcher')) {
    return '#67C23A'
  } else if (name.includes('ingest')) {
    return '#409EFF'
  } else {
    return '#909399'
  }
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
    ElMessage.error(t('pages.plugins.messages.loadFailed') + ': ' + error.message)
    console.error('Failed to load plugins:', error)
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