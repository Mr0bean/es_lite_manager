<template>
  <div class="stats-container">
    <div class="page-header">
      <div class="header-top">
        <h2>{{ $t('pages.stats.title') }}</h2>
        <RefreshTimer :on-refresh="loadStats" :disabled="!selectedIndex" />
      </div>
      <div class="stats-header">
        <el-select v-model="selectedIndex" :placeholder="$t('pages.stats.selectIndex')" @change="loadStats">
          <el-option v-for="idx in indices" :key="idx.index" :label="idx.index" :value="idx.index" />
        </el-select>
      </div>
    </div>

    <div v-if="stats" class="stats-content">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card>
            <el-statistic :title="$t('pages.stats.metrics.totalDocs')" :value="stats._all?.primaries?.docs?.count || 0" />
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card>
            <el-statistic :title="$t('pages.stats.metrics.storageSize')" :value="formatBytes(stats._all?.primaries?.store?.size_in_bytes || 0)" />
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card>
            <el-statistic :title="$t('pages.stats.metrics.segments')" :value="stats._all?.primaries?.segments?.count || 0" />
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card>
            <el-statistic :title="$t('pages.stats.metrics.indexingTotal')" :value="stats._all?.primaries?.indexing?.index_total || 0" />
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" style="margin-top: 20px">
        <el-col :span="12">
          <el-card>
            <template #header>{{ $t('pages.stats.charts.indexingPerformance') }}</template>
            <canvas ref="indexingChart"></canvas>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card>
            <template #header>{{ $t('pages.stats.charts.queryPerformance') }}</template>
            <canvas ref="searchChart"></canvas>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" style="margin-top: 20px">
        <el-col :span="24">
          <el-card>
            <template #header>{{ $t('pages.stats.detailedStats') }}</template>
            <el-descriptions :column="2" border>
              <el-descriptions-item :label="$t('pages.stats.fields.queryTotal')">
                {{ stats._all?.primaries?.search?.query_total || 0 }}
              </el-descriptions-item>
              <el-descriptions-item :label="$t('pages.stats.fields.queryTime')">
                {{ stats._all?.primaries?.search?.query_time_in_millis || 0 }}ms
              </el-descriptions-item>
              <el-descriptions-item :label="$t('pages.stats.fields.getTotal')">
                {{ stats._all?.primaries?.get?.total || 0 }}
              </el-descriptions-item>
              <el-descriptions-item :label="$t('pages.stats.fields.getTime')">
                {{ stats._all?.primaries?.get?.time_in_millis || 0 }}ms
              </el-descriptions-item>
              <el-descriptions-item :label="$t('pages.stats.fields.indexTotal')">
                {{ stats._all?.primaries?.indexing?.index_total || 0 }}
              </el-descriptions-item>
              <el-descriptions-item :label="$t('pages.stats.fields.indexTime')">
                {{ stats._all?.primaries?.indexing?.index_time_in_millis || 0 }}ms
              </el-descriptions-item>
              <el-descriptions-item :label="$t('pages.stats.fields.deleteTotal')">
                {{ stats._all?.primaries?.indexing?.delete_total || 0 }}
              </el-descriptions-item>
              <el-descriptions-item :label="$t('pages.stats.fields.refreshTotal')">
                {{ stats._all?.primaries?.refresh?.total || 0 }}
              </el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <el-empty v-else :description="$t('pages.stats.emptyDescription')" />
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { Chart, registerables } from 'chart.js'
import * as api from '../api/elasticsearch'
import RefreshTimer from '../components/RefreshTimer.vue'
import storageManager from '../utils/storage'

const { t } = useI18n()

Chart.register(...registerables)

const indices = ref([])
const selectedIndex = ref('')
const stats = ref(null)
const indexingChart = ref(null)
const searchChart = ref(null)

let indexingChartInstance = null
let searchChartInstance = null

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const loadStats = async () => {
  if (!selectedIndex.value) return

  try {
    const data = await api.getIndexStats(selectedIndex.value)
    stats.value = data
    await nextTick()
    drawCharts()
  } catch (error) {
    ElMessage.error(t('pages.stats.messages.loadFailed') + ': ' + error.message)
  }
}

const drawCharts = () => {
  const primaries = stats.value?._all?.primaries

  if (indexingChartInstance) {
    indexingChartInstance.destroy()
  }
  if (searchChartInstance) {
    searchChartInstance.destroy()
  }

  if (indexingChart.value) {
    indexingChartInstance = new Chart(indexingChart.value, {
      type: 'doughnut',
      data: {
        labels: [t('pages.stats.operations.index'), t('pages.stats.operations.delete'), t('pages.stats.operations.update')],
        datasets: [{
          data: [
            primaries?.indexing?.index_total || 0,
            primaries?.indexing?.delete_total || 0,
            primaries?.indexing?.update_total || 0
          ],
          backgroundColor: ['#409EFF', '#F56C6C', '#E6A23C']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    })
  }

  if (searchChart.value) {
    searchChartInstance = new Chart(searchChart.value, {
      type: 'bar',
      data: {
        labels: [t('pages.stats.operations.query'), t('pages.stats.operations.get'), t('pages.stats.operations.suggest'), t('pages.stats.operations.scroll')],
        datasets: [{
          label: t('pages.stats.operationCount'),
          data: [
            primaries?.search?.query_total || 0,
            primaries?.get?.total || 0,
            primaries?.suggest?.total || 0,
            primaries?.search?.scroll_total || 0
          ],
          backgroundColor: '#409EFF'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    })
  }
}

const loadIndices = async () => {
  try {
    indices.value = await api.getIndices()
    
    // Update available indices to storage
    storageManager.updateAvailableIndices(indices.value)
    
    // Restore last selected index
    const lastSelectedIndex = storageManager.getLastSelectedIndex(indices.value)
    if (lastSelectedIndex) {
      selectedIndex.value = lastSelectedIndex
      await loadStats() // Auto load stats
    }
  } catch (error) {
    console.error('Failed to load indices:', error)
    ElMessage.error(t('pages.stats.messages.loadIndicesFailed') + ': ' + error.message)
  }
}

// Watch index selection changes, save to local storage
watch(() => selectedIndex.value, (newIndex) => {
  storageManager.setLastSelectedIndex(newIndex)
})

onMounted(() => {
  loadIndices()
})
</script>

<style scoped>
.stats-container {
  padding: 20px;
}

.stats-header {
  margin-bottom: 20px;
}

.stats-content {
  width: 100%;
}

canvas {
  max-height: 300px;
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