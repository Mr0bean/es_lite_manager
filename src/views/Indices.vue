<template>
  <div class="indices-container">
    <div class="page-header">
      <div class="header-top">
        <h2>索引管理</h2>
        <RefreshTimer :on-refresh="refreshIndices" />
      </div>
      <div class="toolbar">
        <el-button type="primary" @click="showCreateDialog = true">创建索引</el-button>
      </div>
    </div>

    <el-table :data="indices" style="width: 100%" v-loading="loading" stripe>
      <el-table-column prop="index" label="索引名称" />
      <el-table-column prop="health" label="健康状态">
        <template #default="scope">
          <el-tag :type="getHealthType(scope.row.health)">
            {{ scope.row.health }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" />
      <el-table-column prop="pri" label="主分片" />
      <el-table-column prop="rep" label="副本" />
      <el-table-column prop="docs.count" label="文档数" />
      <el-table-column prop="store.size" label="存储大小" />
      <el-table-column label="操作" width="200">
        <template #default="scope">
          <el-button size="small" @click="viewDetails(scope.row)">详情</el-button>
          <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="showCreateDialog" title="创建索引" width="500px">
      <el-form :model="newIndex" label-width="100px">
        <el-form-item label="索引名称" required>
          <el-input v-model="newIndex.name" placeholder="请输入索引名称" />
        </el-form-item>
        <el-form-item label="分片数">
          <el-input-number v-model="newIndex.shards" :min="1" :max="10" />
        </el-form-item>
        <el-form-item label="副本数">
          <el-input-number v-model="newIndex.replicas" :min="0" :max="5" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="createIndex">创建</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showDetailsDialog" title="索引详情" width="900px">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="索引名称">{{ currentIndex?.index }}</el-descriptions-item>
        <el-descriptions-item label="健康状态">{{ currentIndex?.health }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ currentIndex?.status }}</el-descriptions-item>
        <el-descriptions-item label="主分片">{{ currentIndex?.pri }}</el-descriptions-item>
        <el-descriptions-item label="副本">{{ currentIndex?.rep }}</el-descriptions-item>
        <el-descriptions-item label="文档数">{{ currentIndex?.['docs.count'] }}</el-descriptions-item>
        <el-descriptions-item label="删除文档数">{{ currentIndex?.['docs.deleted'] }}</el-descriptions-item>
        <el-descriptions-item label="存储大小">{{ currentIndex?.['store.size'] }}</el-descriptions-item>
        <el-descriptions-item label="ILM策略">
          <div v-if="indexPolicy.loading">加载中...</div>
          <div v-else-if="indexPolicy.policyName">
            <el-tag type="success">{{ indexPolicy.policyName }}</el-tag>
            <el-button size="small" type="text" @click="showPolicyDetails = true" style="margin-left: 10px;">查看详情</el-button>
          </div>
          <div v-else>
            <el-tag type="info">未设置策略</el-tag>
          </div>
        </el-descriptions-item>
      </el-descriptions>
      
      <!-- 快捷操作按钮区域 -->
      <el-divider content-position="left">
        <span style="color: #606266; font-size: 14px;">快捷操作</span>
      </el-divider>
      <div class="quick-actions">
        <el-row :gutter="12">
          <el-col :span="6">
            <el-card class="action-card" shadow="hover" @click="navigateToDocuments">
              <div class="action-content">
                <el-icon class="action-icon" color="#409EFF"><Document /></el-icon>
                <div class="action-info">
                  <div class="action-title">文档管理</div>
                  <div class="action-desc">管理索引中的文档</div>
                </div>
              </div>
            </el-card>
          </el-col>
          
          <el-col :span="6">
            <el-card class="action-card" shadow="hover" @click="navigateToStats">
              <div class="action-content">
                <el-icon class="action-icon" color="#67C23A"><TrendCharts /></el-icon>
                <div class="action-info">
                  <div class="action-title">统计分析</div>
                  <div class="action-desc">查看索引统计信息</div>
                </div>
              </div>
            </el-card>
          </el-col>
          
          <el-col :span="6">
            <el-card class="action-card" shadow="hover" @click="navigateToAnalyzers">
              <div class="action-content">
                <el-icon class="action-icon" color="#E6A23C"><Tools /></el-icon>
                <div class="action-info">
                  <div class="action-title">分词器管理</div>
                  <div class="action-desc">测试分词器效果</div>
                </div>
              </div>
            </el-card>
          </el-col>
          
          <el-col :span="6">
            <el-card class="action-card" shadow="hover" @click="navigateToMappings">
              <div class="action-content">
                <el-icon class="action-icon" color="#F56C6C"><Grid /></el-icon>
                <div class="action-info">
                  <div class="action-title">映射管理</div>
                  <div class="action-desc">查看和编辑映射</div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
      
      <!-- 策略详情对话框 -->
      <el-dialog v-model="showPolicyDetails" title="ILM策略详情" width="700px" append-to-body>
        <div v-if="indexPolicy.policy">
          <h4>策略名称: {{ indexPolicy.policyName }}</h4>
          <el-divider />
          <pre style="background: #f5f5f5; padding: 15px; border-radius: 4px; overflow-x: auto;">{{ JSON.stringify(indexPolicy.policy, null, 2) }}</pre>
        </div>
      </el-dialog>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Document, TrendCharts, Tools, Grid } from '@element-plus/icons-vue'
import * as api from '../api/elasticsearch'
import RefreshTimer from '../components/RefreshTimer.vue'
import storageManager from '../utils/storage'

const router = useRouter()

const indices = ref([])
const loading = ref(false)
const showCreateDialog = ref(false)
const showDetailsDialog = ref(false)
const showPolicyDetails = ref(false)
const currentIndex = ref(null)
const indexPolicy = ref({
  loading: false,
  policyName: null,
  policy: null
})

const newIndex = ref({
  name: '',
  shards: 1,
  replicas: 0
})

const getHealthType = (health) => {
  const types = {
    green: 'success',
    yellow: 'warning',
    red: 'danger'
  }
  return types[health] || 'info'
}

const refreshIndices = async () => {
  loading.value = true
  try {
    const data = await api.getIndices()
    indices.value = data
  } catch (error) {
    ElMessage.error('获取索引列表失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

const createIndex = async () => {
  if (!newIndex.value.name) {
    ElMessage.warning('请输入索引名称')
    return
  }

  try {
    await api.createIndex(newIndex.value.name, {
      settings: {
        number_of_shards: newIndex.value.shards,
        number_of_replicas: newIndex.value.replicas
      }
    })
    ElMessage.success('索引创建成功')
    showCreateDialog.value = false
    newIndex.value = { name: '', shards: 1, replicas: 0 }
    refreshIndices()
  } catch (error) {
    ElMessage.error('创建索引失败: ' + error.message)
  }
}

const viewDetails = async (row) => {
  currentIndex.value = row
  showDetailsDialog.value = true
  
  // 加载索引策略信息
  indexPolicy.value.loading = true
  indexPolicy.value.policyName = null
  indexPolicy.value.policy = null
  
  try {
    const policyData = await api.getIndexPolicy(row.index)
    indexPolicy.value.policyName = policyData.policyName
    indexPolicy.value.policy = policyData.policy
  } catch (error) {
    console.error('获取索引策略失败:', error)
    ElMessage.warning('获取索引策略失败: ' + error.message)
  } finally {
    indexPolicy.value.loading = false
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除索引 ${row.index} 吗？此操作不可恢复！`,
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await api.deleteIndex(row.index)
    
    // 清除被删除索引相关的选择记录
    storageManager.clearIndexSelections(row.index)
    
    ElMessage.success('索引删除成功')
    refreshIndices()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除索引失败: ' + error.message)
    }
  }
}

// 导航方法
const navigateToDocuments = () => {
  showDetailsDialog.value = false
  storageManager.setLastSelectedIndex(currentIndex.value.index)
  router.push('/documents')
}

const navigateToStats = () => {
  showDetailsDialog.value = false
  storageManager.setLastSelectedIndex(currentIndex.value.index)
  router.push('/stats')
}

const navigateToAnalyzers = () => {
  showDetailsDialog.value = false
  router.push('/analyzers')
}

const navigateToMappings = () => {
  showDetailsDialog.value = false
  storageManager.setLastSelectedIndex(currentIndex.value.index)
  router.push('/mappings')
}

onMounted(() => {
  refreshIndices()
})
</script>

<style scoped>
.indices-container {
  padding: 20px;
}

.toolbar {
  margin-bottom: 20px;
}

/* 自定义表格斑马纹样式 */
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

.page-header {
  margin-bottom: 20px;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.header-top h2 {
  margin: 0;
  color: #1f2937;
  font-size: 24px;
  font-weight: 600;
}

.toolbar {
  display: flex;
  gap: 12px;
}

/* 快捷操作区域样式 */
.quick-actions {
  margin-top: 16px;
}

.action-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #e4e7ed;
}

.action-card:hover {
  transform: translateY(-2px);
  border-color: #409EFF;
  box-shadow: 0 6px 20px rgba(64, 158, 255, 0.15);
}

.action-content {
  display: flex;
  align-items: center;
  padding: 8px;
}

.action-icon {
  font-size: 24px;
  margin-right: 12px;
  flex-shrink: 0;
}

.action-info {
  flex: 1;
  min-width: 0;
}

.action-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.action-desc {
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
}
</style>