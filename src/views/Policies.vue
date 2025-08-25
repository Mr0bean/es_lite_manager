<template>
  <div class="policies-container">
    <div class="page-header">
      <div class="header-top">
        <h2>ILM策略管理</h2>
        <RefreshTimer :on-refresh="refreshPolicies" />
      </div>
    </div>

    <el-table :data="policiesList" style="width: 100%" v-loading="loading">
      <el-table-column prop="name" label="策略名称" />
      <el-table-column label="阶段" width="200">
        <template #default="scope">
          <el-tag v-for="phase in getPhases(scope.row.policy)" :key="phase" size="small" style="margin-right: 5px;">
            {{ phase }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150">
        <template #default="scope">
          <el-button size="small" @click="viewPolicyDetails(scope.row)">查看详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 策略详情对话框 -->
    <el-dialog v-model="showDetailsDialog" title="ILM策略详情" width="800px">
      <div v-if="currentPolicy">
        <h3>策略名称: {{ currentPolicy.name }}</h3>
        <el-divider />
        
        <el-tabs v-model="activeTab">
          <el-tab-pane label="策略概览" name="overview">
            <el-descriptions :column="1" border>
              <el-descriptions-item label="策略名称">{{ currentPolicy.name }}</el-descriptions-item>
              <el-descriptions-item label="版本">{{ currentPolicy.policy.version || 'N/A' }}</el-descriptions-item>
              <el-descriptions-item label="修改时间">{{ currentPolicy.policy.modified_date || 'N/A' }}</el-descriptions-item>
              <el-descriptions-item label="包含阶段">
                <el-tag v-for="phase in getPhases(currentPolicy.policy)" :key="phase" style="margin-right: 5px;">
                  {{ phase }}
                </el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>
          
          <el-tab-pane label="策略配置" name="config">
            <pre style="background: #f5f5f5; padding: 15px; border-radius: 4px; overflow-x: auto; max-height: 400px;">{{ JSON.stringify(currentPolicy.policy, null, 2) }}</pre>
          </el-tab-pane>
          
          <el-tab-pane label="阶段详情" name="phases" v-if="currentPolicy.policy.policy?.phases">
            <div v-for="(phase, phaseName) in currentPolicy.policy.policy.phases" :key="phaseName" style="margin-bottom: 20px;">
              <h4>{{ phaseName.toUpperCase() }} 阶段</h4>
              <el-card>
                <div v-if="phase.min_age">
                  <strong>最小年龄:</strong> {{ phase.min_age }}
                </div>
                <div v-if="phase.actions">
                  <strong>操作:</strong>
                  <ul>
                    <li v-for="(action, actionName) in phase.actions" :key="actionName">
                      <strong>{{ actionName }}:</strong> {{ JSON.stringify(action) }}
                    </li>
                  </ul>
                </div>
              </el-card>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import * as api from '../api/elasticsearch'
import RefreshTimer from '../components/RefreshTimer.vue'

const policiesList = ref([])
const loading = ref(false)
const showDetailsDialog = ref(false)
const currentPolicy = ref(null)
const activeTab = ref('overview')

const getPhases = (policy) => {
  if (!policy?.policy?.phases) return []
  return Object.keys(policy.policy.phases)
}

const refreshPolicies = async () => {
  loading.value = true
  try {
    const data = await api.getPolicies()
    policiesList.value = Object.entries(data).map(([name, policy]) => ({
      name,
      policy
    }))
  } catch (error) {
    ElMessage.error('获取策略列表失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

const viewPolicyDetails = (policy) => {
  currentPolicy.value = policy
  activeTab.value = 'overview'
  showDetailsDialog.value = true
}

onMounted(() => {
  refreshPolicies()
})
</script>

<style scoped>
.policies-container {
  padding: 20px;
}

.toolbar {
  margin-bottom: 20px;
}

pre {
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.el-card {
  margin-top: 10px;
}

ul {
  margin: 10px 0;
  padding-left: 20px;
}

li {
  margin: 5px 0;
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
</style>