<template>
  <div class="policies-container">
    <div class="page-header">
      <div class="header-top">
        <h2>{{ $t('pages.policies.title') }}</h2>
        <RefreshTimer :on-refresh="refreshPolicies" />
      </div>
    </div>

    <el-table :data="policiesList" style="width: 100%" v-loading="loading">
      <el-table-column prop="name" :label="$t('pages.policies.fields.name')" />
      <el-table-column :label="$t('pages.policies.fields.phases')" width="200">
        <template #default="scope">
          <el-tag v-for="phase in getPhases(scope.row.policy)" :key="phase" size="small" style="margin-right: 5px;">
            {{ phase }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="$t('pages.policies.fields.actions')" width="150">
        <template #default="scope">
          <el-button size="small" @click="viewPolicyDetails(scope.row)">{{ $t('pages.policies.viewDetails') }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- Policy Details Dialog -->
    <el-dialog v-model="showDetailsDialog" :title="$t('pages.policies.detailsTitle')" width="800px">
      <div v-if="currentPolicy">
        <h3>{{ $t('pages.policies.fields.name') }}: {{ currentPolicy.name }}</h3>
        <el-divider />
        
        <el-tabs v-model="activeTab">
          <el-tab-pane :label="$t('pages.policies.tabs.overview')" name="overview">
            <el-descriptions :column="1" border>
              <el-descriptions-item :label="$t('pages.policies.fields.name')">{{ currentPolicy.name }}</el-descriptions-item>
              <el-descriptions-item :label="$t('pages.policies.fields.version')">{{ currentPolicy.policy.version || 'N/A' }}</el-descriptions-item>
              <el-descriptions-item :label="$t('pages.policies.fields.modifiedDate')">{{ currentPolicy.policy.modified_date || 'N/A' }}</el-descriptions-item>
              <el-descriptions-item :label="$t('pages.policies.fields.phases')">
                <el-tag v-for="phase in getPhases(currentPolicy.policy)" :key="phase" style="margin-right: 5px;">
                  {{ phase }}
                </el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>
          
          <el-tab-pane :label="$t('pages.policies.tabs.config')" name="config">
            <pre style="background: #f5f5f5; padding: 15px; border-radius: 4px; overflow-x: auto; max-height: 400px;">{{ JSON.stringify(currentPolicy.policy, null, 2) }}</pre>
          </el-tab-pane>
          
          <el-tab-pane :label="$t('pages.policies.tabs.phaseDetails')" name="phases" v-if="currentPolicy.policy.policy?.phases">
            <div v-for="(phase, phaseName) in currentPolicy.policy.policy.phases" :key="phaseName" style="margin-bottom: 20px;">
              <h4>{{ phaseName.toUpperCase() }} {{ $t('pages.policies.phase') }}</h4>
              <el-card>
                <div v-if="phase.min_age">
                  <strong>{{ $t('pages.policies.fields.minAge') }}:</strong> {{ phase.min_age }}
                </div>
                <div v-if="phase.actions">
                  <strong>{{ $t('pages.policies.fields.actions') }}:</strong>
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
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import * as api from '../api/elasticsearch'
import RefreshTimer from '../components/RefreshTimer.vue'

const { t } = useI18n()

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
    ElMessage.error(t('pages.policies.messages.loadFailed') + ': ' + error.message)
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