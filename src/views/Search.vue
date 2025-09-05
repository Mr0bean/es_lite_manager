<template>
  <div class="search-container">
    <div class="search-header">
      <div class="header-top">
        <h2>{{ $t('pages.search.title') }}</h2>
        <div class="header-actions">
          <el-button 
            type="primary" 
            :icon="Refresh" 
            @click="refreshSearch"
            :loading="refreshing"
            size="small"
          >
            {{ $t('actions.refresh') }}
          </el-button>
          <el-dropdown @command="handleAutoRefresh">
            <el-button size="small" type="info">
              {{ $t('pages.search.autoRefresh') }} <el-icon><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item :command="0" :class="{ 'is-active': autoRefreshInterval === 0 }">
                  <el-icon><Close /></el-icon> {{ $t('pages.search.autoRefreshIntervals.disable') }}
                </el-dropdown-item>
                <el-dropdown-item :command="5000" :class="{ 'is-active': autoRefreshInterval === 5000 }">
                  {{ $t('pages.search.autoRefreshIntervals.5s') }}
                </el-dropdown-item>
                <el-dropdown-item :command="10000" :class="{ 'is-active': autoRefreshInterval === 10000 }">
                  {{ $t('pages.search.autoRefreshIntervals.10s') }}
                </el-dropdown-item>
                <el-dropdown-item :command="30000" :class="{ 'is-active': autoRefreshInterval === 30000 }">
                  {{ $t('pages.search.autoRefreshIntervals.30s') }}
                </el-dropdown-item>
                <el-dropdown-item :command="60000" :class="{ 'is-active': autoRefreshInterval === 60000 }">
                  {{ $t('pages.search.autoRefreshIntervals.1m') }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <span v-if="autoRefreshInterval > 0" class="refresh-status">
            {{ $t('pages.search.nextRefresh') }}: {{ nextRefreshCountdown }}s
          </span>
        </div>
      </div>
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item :label="$t('pages.search.fields.index')">
          <el-select v-model="searchForm.index" :placeholder="$t('placeholders.selectIndex')" clearable style="width: 200px">
            <el-option v-for="idx in indices" :key="idx.index" :label="idx.index" :value="idx.index" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('pages.search.fields.queryType')">
          <el-select v-model="searchForm.queryType" :placeholder="$t('placeholders.selectQueryType')" style="width: 200px">
            <el-option label="Match All" value="match_all" />
            <el-option label="Match" value="match" />
            <el-option label="Term" value="term" />
            <el-option label="Range" value="range" />
            <el-option label="Bool" value="bool" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="searchForm.enableAggs" @change="onAggsToggle">{{ $t('pages.search.enableAggs') }}</el-checkbox>
        </el-form-item>
      </el-form>
    </div>

    <div class="query-builder">
      <el-card>
        <template #header>
          <span>{{ $t('pages.search.queryBuilder') }}</span>
        </template>
        
        <div v-if="searchForm.queryType === 'match_all'">
          <p>{{ $t('pages.search.queryTypes.matchAll') }}</p>
        </div>
        
        <div v-else-if="searchForm.queryType === 'match'">
          <el-form :model="matchQuery" label-width="80px">
            <el-form-item :label="$t('pages.search.fields.field')">
              <el-input v-model="matchQuery.field" :placeholder="$t('placeholders.enterFieldName')" />
            </el-form-item>
            <el-form-item :label="$t('pages.search.fields.value')">
              <el-input v-model="matchQuery.value" :placeholder="$t('placeholders.enterSearchValue')" />
            </el-form-item>
          </el-form>
        </div>

        <div v-else-if="searchForm.queryType === 'term'">
          <el-form :model="termQuery" label-width="80px">
            <el-form-item :label="$t('pages.search.fields.field')">
              <el-input v-model="termQuery.field" :placeholder="$t('placeholders.enterFieldName')" />
            </el-form-item>
            <el-form-item :label="$t('pages.search.fields.value')">
              <el-input v-model="termQuery.value" :placeholder="$t('placeholders.enterExactValue')" />
            </el-form-item>
          </el-form>
        </div>

        <div v-else-if="searchForm.queryType === 'range'">
          <el-form :model="rangeQuery" label-width="80px">
            <el-form-item :label="$t('pages.search.fields.field')">
              <el-input v-model="rangeQuery.field" :placeholder="$t('placeholders.enterFieldName')" />
            </el-form-item>
            <el-form-item :label="$t('pages.search.fields.minValue')">
              <el-input v-model="rangeQuery.gte" :placeholder="$t('placeholders.enterGreaterEqual')" />
            </el-form-item>
            <el-form-item :label="$t('pages.search.fields.maxValue')">
              <el-input v-model="rangeQuery.lte" :placeholder="$t('placeholders.enterLessEqual')" />
            </el-form-item>
          </el-form>
        </div>

        <!-- 聚合查询构建器 -->
        <div v-if="searchForm.enableAggs" class="aggs-builder">
          <el-divider content-position="left">{{ $t('pages.search.aggregations.title') }}</el-divider>
          
          <div v-for="(agg, index) in aggregations" :key="index" class="agg-item">
            <el-card shadow="never" class="agg-card">
              <template #header>
                <div class="agg-header">
                  <span>{{ $t('pages.search.aggregations.aggregation') }} {{ index + 1 }}</span>
                  <el-button 
                    type="danger" 
                    size="small" 
                    @click="removeAggregation(index)"
                    :icon="Delete"
                  >
                    {{ $t('actions.delete') }}
                  </el-button>
                </div>
              </template>
              
              <el-form :model="agg" label-width="100px">
                <el-form-item :label="$t('pages.search.aggregations.name')">
                  <el-input v-model="agg.name" :placeholder="$t('placeholders.enterAggName')" />
                </el-form-item>
                <el-form-item :label="$t('pages.search.aggregations.type')">
                  <el-select v-model="agg.type" :placeholder="$t('placeholders.selectAggType')" style="width: 200px">
                    <el-option-group :label="$t('pages.search.aggregations.metricAggs')">
                      <el-option :label="$t('pages.search.aggregations.types.avg')" value="avg" />
                      <el-option :label="$t('pages.search.aggregations.types.max')" value="max" />
                      <el-option :label="$t('pages.search.aggregations.types.min')" value="min" />
                      <el-option :label="$t('pages.search.aggregations.types.sum')" value="sum" />
                      <el-option :label="$t('pages.search.aggregations.types.valueCount')" value="value_count" />
                      <el-option :label="$t('pages.search.aggregations.types.stats')" value="stats" />
                    </el-option-group>
                    <el-option-group :label="$t('pages.search.aggregations.bucketAggs')">
                      <el-option :label="$t('pages.search.aggregations.types.terms')" value="terms" />
                      <el-option :label="$t('pages.search.aggregations.types.range')" value="range" />
                      <el-option :label="$t('pages.search.aggregations.types.dateHistogram')" value="date_histogram" />
                      <el-option :label="$t('pages.search.aggregations.types.histogram')" value="histogram" />
                    </el-option-group>
                  </el-select>
                </el-form-item>
                
                <!-- 指标聚合字段 -->
                <el-form-item 
                  v-if="['avg', 'max', 'min', 'sum', 'value_count', 'stats'].includes(agg.type)" 
                  :label="$t('pages.search.fields.field')"
                >
                  <el-input v-model="agg.field" :placeholder="$t('placeholders.enterFieldName')" />
                </el-form-item>
                
                <!-- Terms聚合配置 -->
                <template v-if="agg.type === 'terms'">
                  <el-form-item :label="$t('pages.search.fields.field')">
                    <el-input v-model="agg.field" :placeholder="$t('placeholders.enterFieldName')" />
                  </el-form-item>
                  <el-form-item :label="$t('pages.search.aggregations.returnCount')">
                    <el-input-number v-model="agg.size" :min="1" :max="1000" :placeholder="$t('placeholders.enterReturnCount')" />
                  </el-form-item>
                </template>
                
                <!-- Range聚合配置 -->
                <template v-if="agg.type === 'range'">
                  <el-form-item :label="$t('pages.search.fields.field')">
                    <el-input v-model="agg.field" :placeholder="$t('placeholders.enterFieldName')" />
                  </el-form-item>
                  <el-form-item :label="$t('pages.search.aggregations.rangeConfig')">
                    <div v-for="(range, rIndex) in agg.ranges" :key="rIndex" class="range-item">
                      <el-input v-model="range.from" :placeholder="$t('placeholders.enterStartValue')" style="width: 100px" />
                      <span style="margin: 0 10px">{{ $t('pages.search.aggregations.to') }}</span>
                      <el-input v-model="range.to" :placeholder="$t('placeholders.enterEndValue')" style="width: 100px" />
                      <el-button 
                        type="danger" 
                        size="small" 
                        @click="removeRange(index, rIndex)"
                        style="margin-left: 10px"
                      >
                        {{ $t('actions.delete') }}
                      </el-button>
                    </div>
                    <el-button type="primary" size="small" @click="addRange(index)">{{ $t('pages.search.aggregations.addRange') }}</el-button>
                  </el-form-item>
                </template>
                
                <!-- Date Histogram聚合配置 -->
                <template v-if="agg.type === 'date_histogram'">
                  <el-form-item :label="$t('pages.search.fields.field')">
                    <el-input v-model="agg.field" :placeholder="$t('placeholders.enterDateField')" />
                  </el-form-item>
                  <el-form-item :label="$t('pages.search.aggregations.timeInterval')">
                    <el-select v-model="agg.calendar_interval" :placeholder="$t('placeholders.selectTimeInterval')">
                      <el-option :label="$t('pages.search.aggregations.timeIntervals.1m')" value="1m" />
                      <el-option :label="$t('pages.search.aggregations.timeIntervals.1h')" value="1h" />
                      <el-option :label="$t('pages.search.aggregations.timeIntervals.1d')" value="1d" />
                      <el-option :label="$t('pages.search.aggregations.timeIntervals.1w')" value="1w" />
                      <el-option :label="$t('pages.search.aggregations.timeIntervals.1M')" value="1M" />
                      <el-option :label="$t('pages.search.aggregations.timeIntervals.1y')" value="1y" />
                    </el-select>
                  </el-form-item>
                </template>
                
                <!-- Histogram聚合配置 -->
                <template v-if="agg.type === 'histogram'">
                  <el-form-item :label="$t('pages.search.fields.field')">
                    <el-input v-model="agg.field" :placeholder="$t('placeholders.enterNumericField')" />
                  </el-form-item>
                  <el-form-item :label="$t('pages.search.aggregations.interval')">
                    <el-input-number v-model="agg.interval" :min="1" :placeholder="$t('placeholders.enterIntervalValue')" />
                  </el-form-item>
                </template>
              </el-form>
            </el-card>
          </div>
          
          <el-button type="primary" @click="addAggregation" class="add-agg-btn">
            {{ $t('pages.search.aggregations.addAggregation') }}
          </el-button>
        </div>

        <div class="query-actions">
          <el-button type="primary" @click="executeSearch">{{ $t('pages.search.executeQuery') }}</el-button>
          <el-button @click="clearSearch">{{ $t('pages.search.clearSearch') }}</el-button>
        </div>
        
        <!-- 查询语句显示区域 -->
        <div class="query-display" v-if="currentQuery">
          <el-divider content-position="left">{{ $t('pages.search.generatedQuery') }}</el-divider>
          <div class="query-json">
            <pre>{{ JSON.stringify(currentQuery, null, 2) }}</pre>
          </div>
        </div>
      </el-card>
    </div>

    <div class="search-results" v-if="searchResults">
      <el-card>
        <template #header>
          <div class="results-header">
            <span>{{ $t('pages.search.queryResults') }}</span>
            <el-tag>{{ $t('pages.search.hitCount') }}: {{ searchResults.hits?.total?.value || 0 }}</el-tag>
            <el-tag type="info">{{ $t('pages.search.timeCost') }}: {{ searchResults.took }}ms</el-tag>
          </div>
        </template>
        
        <!-- 聚合结果 -->
        <div v-if="searchResults.aggregations" class="aggregation-results">
          <el-divider content-position="left">{{ $t('pages.search.aggregationResults') }}</el-divider>
          <el-card v-for="(aggResult, aggName) in searchResults.aggregations" :key="aggName" class="agg-card">
            <template #header>
              <span class="agg-name">{{ aggName }}</span>
            </template>
            
            <!-- Terms 聚合结果 -->
            <div v-if="aggResult.buckets" class="buckets-result">
              <el-table :data="aggResult.buckets" size="small">
                <el-table-column prop="key" :label="$t('pages.search.aggregations.statsLabels.value')" />
                <el-table-column prop="doc_count" :label="$t('pages.search.aggregations.statsLabels.docCount')" />
              </el-table>
            </div>
            
            <!-- 指标聚合结果 -->
            <div v-else-if="aggResult.value !== undefined" class="metric-result">
              <el-descriptions :column="1" size="small">
                <el-descriptions-item :label="$t('pages.search.aggregations.statsLabels.value')">{{ aggResult.value }}</el-descriptions-item>
              </el-descriptions>
            </div>
            
            <!-- Stats 聚合结果 -->
            <div v-else-if="aggResult.count !== undefined" class="stats-result">
              <el-descriptions :column="2" size="small">
                <el-descriptions-item :label="$t('pages.search.aggregations.statsLabels.count')">{{ aggResult.count }}</el-descriptions-item>
                <el-descriptions-item :label="$t('pages.search.aggregations.statsLabels.min')">{{ aggResult.min }}</el-descriptions-item>
                <el-descriptions-item :label="$t('pages.search.aggregations.statsLabels.max')">{{ aggResult.max }}</el-descriptions-item>
                <el-descriptions-item :label="$t('pages.search.aggregations.statsLabels.avg')">{{ aggResult.avg }}</el-descriptions-item>
                <el-descriptions-item :label="$t('pages.search.aggregations.statsLabels.sum')">{{ aggResult.sum }}</el-descriptions-item>
              </el-descriptions>
            </div>
            
            <!-- Range 聚合结果 -->
            <div v-else-if="aggResult.buckets" class="range-result">
              <el-table :data="aggResult.buckets" size="small">
                <el-table-column prop="key" :label="$t('pages.search.aggregations.statsLabels.range')" />
                <el-table-column prop="doc_count" :label="$t('pages.search.aggregations.statsLabels.docCount')" />
              </el-table>
            </div>
          </el-card>
        </div>

        <el-table :data="searchResults.hits?.hits" style="width: 100%" stripe>
          <el-table-column prop="_index" :label="$t('pages.search.fields.index')" width="150" />
          <el-table-column prop="_id" label="ID" width="200" />
          <el-table-column prop="_score" label="Score" width="100" />
          <el-table-column :label="$t('pages.documents.fields.summary')">
            <template #default="scope">
              <el-button size="small" @click="viewDocument(scope.row)">{{ $t('actions.view') }}</el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-pagination
          v-if="searchResults.hits?.total?.value > 0"
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :total="searchResults.hits.total.value"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
          layout="total, sizes, prev, pager, next"
          :page-sizes="[10, 20, 50, 100]"
        />
      </el-card>
    </div>

    <el-dialog v-model="showDocumentDialog" :title="$t('pages.documents.documentDetails')" width="800px">
      <JsonViewer :data="documentData" height="500px" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { Refresh, ArrowDown, Close, Delete } from '@element-plus/icons-vue'
import * as api from '../api/elasticsearch'
import JsonViewer from '../components/JsonViewer.vue'
import storageManager from '../utils/storage'

const { t } = useI18n()

// 刷新功能相关的响应式数据
const refreshing = ref(false)
const autoRefreshInterval = ref(0)
const nextRefreshCountdown = ref(0)
let autoRefreshTimer = null
let countdownTimer = null

const indices = ref([])
const searchForm = ref({
  index: '',
  queryType: 'match_all',
  enableAggs: false
})

const matchQuery = ref({ field: '', value: '' })
const termQuery = ref({ field: '', value: '' })
const rangeQuery = ref({ field: '', gte: '', lte: '' })

// 聚合查询相关
const aggregations = ref([])

const searchResults = ref(null)
const showDocumentDialog = ref(false)
const documentData = ref(null)

const pagination = ref({
  page: 1,
  size: 10
})

// 计算属性：当前查询语句
const currentQuery = computed(() => {
  const query = buildQuery()
  const aggs = buildAggregations()
  
  if (searchForm.value.enableAggs && Object.keys(aggs).length > 0) {
    return {
      query,
      aggs
    }
  }
  
  return { query }
})

const buildQuery = () => {
  let query = {}
  
  switch (searchForm.value.queryType) {
    case 'match_all':
      query = { match_all: {} }
      break
    case 'match':
      if (matchQuery.value.field && matchQuery.value.value) {
        query = { match: { [matchQuery.value.field]: matchQuery.value.value } }
      }
      break
    case 'term':
      if (termQuery.value.field && termQuery.value.value) {
        query = { term: { [termQuery.value.field]: termQuery.value.value } }
      }
      break
    case 'range':
      if (rangeQuery.value.field) {
        const rangeConditions = {}
        if (rangeQuery.value.gte) rangeConditions.gte = rangeQuery.value.gte
        if (rangeQuery.value.lte) rangeConditions.lte = rangeQuery.value.lte
        query = { range: { [rangeQuery.value.field]: rangeConditions } }
      }
      break
  }
  
  return query
}

// 构建聚合查询
const buildAggregations = () => {
  const aggs = {}
  
  aggregations.value.forEach(agg => {
    if (!agg.name || !agg.type) return
    
    const aggConfig = {}
    
    switch (agg.type) {
      case 'avg':
      case 'max':
      case 'min':
      case 'sum':
      case 'value_count':
      case 'stats':
        if (agg.field) {
          aggConfig[agg.type] = { field: agg.field }
        }
        break
      case 'terms':
        if (agg.field) {
          aggConfig.terms = {
            field: agg.field,
            size: agg.size || 10
          }
        }
        break
      case 'range':
        if (agg.field && agg.ranges && agg.ranges.length > 0) {
          aggConfig.range = {
            field: agg.field,
            ranges: agg.ranges.filter(r => r.from !== undefined || r.to !== undefined)
          }
        }
        break
      case 'date_histogram':
        if (agg.field && agg.calendar_interval) {
          aggConfig.date_histogram = {
            field: agg.field,
            calendar_interval: agg.calendar_interval
          }
        }
        break
      case 'histogram':
        if (agg.field && agg.interval) {
          aggConfig.histogram = {
            field: agg.field,
            interval: agg.interval
          }
        }
        break
    }
    
    if (Object.keys(aggConfig).length > 0) {
      aggs[agg.name] = aggConfig
    }
  })
  
  return aggs
}

const executeSearch = async () => {
  if (!searchForm.value.index) {
    ElMessage.warning(t('validation.indexRequired'))
    return
  }

  try {
    const query = buildQuery()
    const aggs = buildAggregations()
    const from = (pagination.value.page - 1) * pagination.value.size
    
    const searchParams = {
      index: searchForm.value.index,
      query,
      size: pagination.value.size,
      from
    }
    
    // 如果启用了聚合查询且有聚合配置，添加到搜索参数中
    if (searchForm.value.enableAggs && Object.keys(aggs).length > 0) {
      searchParams.aggs = aggs
    }
    
    const result = await api.searchDocuments(searchParams)
    
    searchResults.value = result
    ElMessage.success(t('success.querySuccess'))
  } catch (error) {
    ElMessage.error(t('errors.queryFailed') + ': ' + error.message)
  }
}

const clearSearch = () => {
  searchForm.value.queryType = 'match_all'
  searchForm.value.enableAggs = false
  matchQuery.value = { field: '', value: '' }
  termQuery.value = { field: '', value: '' }
  rangeQuery.value = { field: '', gte: '', lte: '' }
  aggregations.value = []
  searchResults.value = null
  pagination.value = { page: 1, size: 10 }
}

// 聚合查询操作方法
const onAggsToggle = (enabled) => {
  if (!enabled) {
    aggregations.value = []
  }
}

const addAggregation = () => {
  aggregations.value.push({
    name: `agg_${aggregations.value.length + 1}`,
    type: '',
    field: '',
    size: 10,
    ranges: [],
    calendar_interval: '',
    interval: 1
  })
}

const removeAggregation = (index) => {
  aggregations.value.splice(index, 1)
}

const addRange = (aggIndex) => {
  if (!aggregations.value[aggIndex].ranges) {
    aggregations.value[aggIndex].ranges = []
  }
  aggregations.value[aggIndex].ranges.push({ from: '', to: '' })
}

const removeRange = (aggIndex, rangeIndex) => {
  aggregations.value[aggIndex].ranges.splice(rangeIndex, 1)
}

// 刷新功能方法
const refreshSearch = async () => {
  if (!searchForm.value.index) {
    ElMessage.warning(t('validation.firstSelectIndex'))
    return
  }
  
  refreshing.value = true
  try {
    await executeSearch()
    ElMessage.success(t('messages.refreshSuccess'))
  } catch (error) {
    ElMessage.error(t('errors.refreshFailed') + ': ' + error.message)
  } finally {
    refreshing.value = false
  }
}

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
      if (searchForm.value.index && searchResults.value) {
        refreshSearch()
      }
    }, interval)
    
    ElMessage.success(t('success.autoRefreshEnabled', { interval: interval / 1000 }))
  } else {
    nextRefreshCountdown.value = 0
    ElMessage.info(t('success.autoRefreshDisabled'))
  }
}

const viewDocument = (row) => {
  documentData.value = row._source
  showDocumentDialog.value = true
}

const handlePageChange = () => {
  executeSearch()
}

const handleSizeChange = () => {
  pagination.value.page = 1
  executeSearch()
}

const loadIndices = async () => {
  try {
    indices.value = await api.getIndices()
    console.log('Loaded indices:', indices.value)
    
    // 更新可用索引列表到存储
    storageManager.updateAvailableIndices(indices.value)
    
    // 恢复上次选择的索引
    const lastSelectedIndex = storageManager.getLastSelectedIndex(indices.value)
    if (lastSelectedIndex) {
      searchForm.value.index = lastSelectedIndex
    }
    
    // 恢复上次选择的查询类型
    const lastQueryType = storageManager.getLastQueryType()
    if (lastQueryType) {
      searchForm.value.queryType = lastQueryType
    }
    
    // 恢复上次选择的页面大小
    const lastPageSize = storageManager.getLastPageSize()
    if (lastPageSize) {
      pagination.value.size = lastPageSize
    }
  } catch (error) {
    console.error('Failed to load indices:', error)
    ElMessage.error(t('errors.loadIndicesFailed') + ': ' + error.message)
  }
}

// 监听索引选择变化，保存到本地存储
watch(() => searchForm.value.index, (newIndex) => {
  storageManager.setLastSelectedIndex(newIndex)
})

// 监听查询类型变化，保存到本地存储
watch(() => searchForm.value.queryType, (newType) => {
  storageManager.setLastQueryType(newType)
})

// 监听页面大小变化，保存到本地存储
watch(() => pagination.value.size, (newSize) => {
  storageManager.setLastPageSize(newSize)
})

onMounted(() => {
  loadIndices()
})

// 组件卸载时清理定时器
onUnmounted(() => {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer)
  }
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
})
</script>

<style scoped>
.search-container {
  padding: 20px;
}

.search-header {
  margin-bottom: 20px;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
}

.header-top h2 {
  margin: 0;
  color: #303133;
  font-size: 20px;
  font-weight: 500;
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

.search-form {
  width: 100%;
}

.query-builder {
  margin-bottom: 20px;
}

.query-actions {
  margin-top: 20px;
  text-align: center;
}

.results-header {
  display: flex;
  align-items: center;
  gap: 10px;
}



.search-results {
  margin-top: 20px;
}

.query-display {
  margin-top: 20px;
}

.query-json {
  background-color: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 15px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.5;
  color: #2c3e50;
  overflow-x: auto;
}

.aggregation-results {
  margin: 20px 0;
}

.agg-card {
  margin-bottom: 16px;
}

.agg-name {
  font-weight: bold;
  color: #409eff;
}

.buckets-result,
.metric-result,
.stats-result,
.range-result {
  margin-top: 8px;
}

.query-json pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
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
</style>