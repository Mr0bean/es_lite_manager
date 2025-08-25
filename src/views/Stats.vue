<template>
  <div class="stats-container">
    <div class="page-header">
      <div class="header-top">
        <h2>统计信息</h2>
        <RefreshTimer :on-refresh="loadStats" :disabled="!selectedIndex" />
      </div>
      <div class="stats-header">
        <el-select v-model="selectedIndex" placeholder="选择索引" @change="loadStats">
          <el-option v-for="idx in indices" :key="idx.index" :label="idx.index" :value="idx.index" />
        </el-select>
      </div>
    </div>

    <div v-if="stats" class="stats-content">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card>
            <el-statistic title="文档总数" :value="stats._all?.primaries?.docs?.count || 0" />
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card>
            <el-statistic title="存储大小" :value="formatBytes(stats._all?.primaries?.store?.size_in_bytes || 0)" />
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card>
            <el-statistic title="段数量" :value="stats._all?.primaries?.segments?.count || 0" />
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card>
            <el-statistic title="索引次数" :value="stats._all?.primaries?.indexing?.index_total || 0" />
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" style="margin-top: 20px">
        <el-col :span="12">
          <el-card>
            <template #header>索引性能</template>
            <canvas ref="indexingChart"></canvas>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card>
            <template #header>查询性能</template>
            <canvas ref="searchChart"></canvas>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" style="margin-top: 20px">
        <el-col :span="24">
          <el-card>
            <template #header>详细统计</template>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="查询总数">
                {{ stats._all?.primaries?.search?.query_total || 0 }}
              </el-descriptions-item>
              <el-descriptions-item label="查询耗时">
                {{ stats._all?.primaries?.search?.query_time_in_millis || 0 }}ms
              </el-descriptions-item>
              <el-descriptions-item label="获取总数">
                {{ stats._all?.primaries?.get?.total || 0 }}
              </el-descriptions-item>
              <el-descriptions-item label="获取耗时">
                {{ stats._all?.primaries?.get?.time_in_millis || 0 }}ms
              </el-descriptions-item>
              <el-descriptions-item label="索引总数">
                {{ stats._all?.primaries?.indexing?.index_total || 0 }}
              </el-descriptions-item>
              <el-descriptions-item label="索引耗时">
                {{ stats._all?.primaries?.indexing?.index_time_in_millis || 0 }}ms
              </el-descriptions-item>
              <el-descriptions-item label="删除总数">
                {{ stats._all?.primaries?.indexing?.delete_total || 0 }}
              </el-descriptions-item>
              <el-descriptions-item label="刷新次数">
                {{ stats._all?.primaries?.refresh?.total || 0 }}
              </el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <el-empty v-else description="请选择索引查看统计信息" />
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Chart, registerables } from 'chart.js'
import * as api from '../api/elasticsearch'
import RefreshTimer from '../components/RefreshTimer.vue'
import storageManager from '../utils/storage'

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
    ElMessage.error('获取统计信息失败: ' + error.message)
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
        labels: ['索引操作', '删除操作', '更新操作'],
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
        labels: ['查询', '获取', '建议', '滚动'],
        datasets: [{
          label: '操作次数',
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
    
    // 更新可用索引列表到存储
    storageManager.updateAvailableIndices(indices.value)
    
    // 恢复上次选择的索引
    const lastSelectedIndex = storageManager.getLastSelectedIndex(indices.value)
    if (lastSelectedIndex) {
      selectedIndex.value = lastSelectedIndex
      await loadStats() // 自动加载统计信息
    }
  } catch (error) {
    console.error('Failed to load indices:', error)
    ElMessage.error('加载索引失败: ' + error.message)
  }
}

// 监听索引选择变化，保存到本地存储
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