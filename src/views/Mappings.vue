<template>
  <div class="mappings-container">
    <div class="page-header">
      <div class="header-top">
        <h2>{{ $t('mappings.title') }}</h2>
        <RefreshTimer :on-refresh="refreshData" />
      </div>
      <p class="page-description">{{ $t('mappings.description') }}</p>
    </div>

    <el-row :gutter="20">
      <!-- 左侧：索引选择和映射概览 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>{{ $t('mappings.indexMappingOverview') }}</span>
              <el-select 
                v-model="selectedIndex" 
                :placeholder="$t('mappings.placeholders.selectIndex')" 
                @change="loadIndexMapping"
                style="width: 200px"
              >
                <el-option
                  v-for="index in indices"
                  :key="index.index"
                  :label="index.index"
                  :value="index.index"
                />
              </el-select>
            </div>
          </template>
          
          <div v-if="loadingMapping" class="loading-container">
            <el-icon class="is-loading"><Loading /></el-icon>
            <span>{{ $t('mappings.loadingMapping') }}</span>
          </div>
          
          <div v-else-if="indexMapping && selectedIndex">
            <el-descriptions :column="1" border>
              <el-descriptions-item :label="$t('mappings.fields.indexName')">{{ selectedIndex }}</el-descriptions-item>
              <el-descriptions-item :label="$t('mappings.fields.fieldCount')">{{ fieldCount }}</el-descriptions-item>
              <el-descriptions-item :label="$t('mappings.fields.mappingVersion')">{{ mappingVersion || 'N/A' }}</el-descriptions-item>
            </el-descriptions>
            
            <div style="margin-top: 20px">
              <h4>{{ $t('mappings.fieldTypeStats') }}</h4>
              <div class="field-stats">
                <el-tag 
                  v-for="(count, type) in fieldTypeStats" 
                  :key="type"
                  class="stat-tag"
                  :type="getFieldTypeColor(type)"
                >
                  {{ type }}: {{ count }}
                </el-tag>
              </div>
            </div>
          </div>
          
          <div v-else-if="selectedIndex">
            <el-empty :description="$t('mappings.placeholders.cannotGetMapping')" />
          </div>
          
          <div v-else>
            <el-empty :description="$t('mappings.placeholders.selectIndexFirst')" />
          </div>
        </el-card>
      </el-col>
      
      <!-- 右侧：字段详情 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>{{ $t('mappings.fieldDetails') }}</span>
          </template>
          
          <div v-if="indexMapping && selectedIndex">
            <el-input
              v-model="fieldSearchText"
              :placeholder="$t('mappings.placeholders.searchFieldName')"
              prefix-icon="Search"
              style="margin-bottom: 15px"
            />
            
            <el-table 
              :data="filteredFields" 
              style="width: 100%" 
              stripe
              max-height="500"
              size="small"
            >
              <el-table-column prop="name" :label="$t('mappings.fields.fieldName')" width="150" />
              <el-table-column prop="type" :label="$t('mappings.fields.fieldType')" width="120">
              <template #default="scope">
                <el-tooltip :content="getFieldTypeDescription(scope.row.type)" placement="top">
                  <el-tag :type="getFieldTypeColor(scope.row.type)" size="small">
                    {{ scope.row.type }}
                  </el-tag>
                </el-tooltip>
              </template>
            </el-table-column>
              <el-table-column prop="properties" :label="$t('mappings.fields.properties')" min-width="200">
                <template #default="scope">
                  <div class="field-properties">
                    <el-tooltip 
                      v-for="(value, key) in scope.row.properties" 
                      :key="key"
                      :content="getPropertyDescription(key, value)"
                      placement="top"
                    >
                      <el-tag 
                        size="small" 
                        class="property-tag"
                      >
                        {{ key }}: {{ value }}
                      </el-tag>
                    </el-tooltip>
                  </div>
                </template>
              </el-table-column>
              <el-table-column :label="$t('mappings.fields.operations')" width="100">
                <template #default="scope">
                  <el-button size="small" @click="viewFieldDetail(scope.row)">{{ $t('mappings.details') }}</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
          
          <div v-else>
            <el-empty :description="$t('mappings.placeholders.selectIndexToViewFields')" />
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 完整映射JSON -->
    <el-card style="margin-top: 20px" v-if="indexMapping && selectedIndex">
      <template #header>
        <div class="card-header">
          <span>{{ $t('mappings.fullMappingJson') }}</span>
          <el-button size="small" @click="copyMapping">
            <el-icon><CopyDocument /></el-icon>
            {{ $t('mappings.copy') }}
          </el-button>
        </div>
      </template>
      
      <div class="mapping-json">
        <pre>{{ JSON.stringify(indexMapping, null, 2) }}</pre>
      </div>
    </el-card>
    
    <!-- 字段详情对话框 -->
    <el-dialog v-model="showFieldDialog" :title="$t('mappings.fields.fieldDetails')" width="600px">
      <div v-if="currentField">
        <el-descriptions :column="1" border>
          <el-descriptions-item :label="$t('mappings.fields.fieldName')">{{ currentField.name }}</el-descriptions-item>
          <el-descriptions-item :label="$t('mappings.fields.fieldType')">{{ currentField.type }}</el-descriptions-item>
        </el-descriptions>
        
        <div style="margin-top: 20px">
          <h4>{{ $t('mappings.fieldConfig') }}</h4>
          <div class="field-config">
            <pre>{{ JSON.stringify(currentField.config, null, 2) }}</pre>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Loading, Search, CopyDocument } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
import * as api from '../api/elasticsearch'
import RefreshTimer from '../components/RefreshTimer.vue'
import storageManager from '../utils/storage'

const indices = ref([])
const selectedIndex = ref('')
const indexMapping = ref(null)
const loadingMapping = ref(false)
const fieldSearchText = ref('')
const showFieldDialog = ref(false)
const currentField = ref(null)

// 计算属性
const fieldCount = computed(() => {
  if (!indexMapping.value) return 0
  return Object.keys(getAllFields(indexMapping.value)).length
})

const mappingVersion = computed(() => {
  return indexMapping.value?._meta?.version || indexMapping.value?.version
})

const fieldTypeStats = computed(() => {
  if (!indexMapping.value) return {}
  
  const fields = getAllFields(indexMapping.value)
  const stats = {}
  
  Object.values(fields).forEach(field => {
    const type = field.type || 'object'
    stats[type] = (stats[type] || 0) + 1
  })
  
  return stats
})

const filteredFields = computed(() => {
  if (!indexMapping.value) return []
  
  const fields = getAllFields(indexMapping.value)
  const fieldList = Object.entries(fields).map(([name, config]) => ({
    name,
    type: config.type || 'object',
    config,
    properties: getFieldProperties(config)
  }))
  
  if (!fieldSearchText.value) return fieldList
  
  return fieldList.filter(field => 
    field.name.toLowerCase().includes(fieldSearchText.value.toLowerCase())
  )
})

// 递归获取所有字段
const getAllFields = (mapping, prefix = '') => {
  const fields = {}
  
  const processProperties = (properties, currentPrefix) => {
    if (!properties) return
    
    Object.entries(properties).forEach(([fieldName, fieldConfig]) => {
      const fullName = currentPrefix ? `${currentPrefix}.${fieldName}` : fieldName
      fields[fullName] = fieldConfig
      
      // 递归处理嵌套字段
      if (fieldConfig.properties) {
        processProperties(fieldConfig.properties, fullName)
      }
      
      // 处理fields属性（多字段映射）
      if (fieldConfig.fields) {
        Object.entries(fieldConfig.fields).forEach(([subFieldName, subFieldConfig]) => {
          const subFullName = `${fullName}.${subFieldName}`
          fields[subFullName] = subFieldConfig
        })
      }
    })
  }
  
  // 处理映射的properties
  if (mapping.mappings?.properties) {
    processProperties(mapping.mappings.properties, prefix)
  } else if (mapping.properties) {
    processProperties(mapping.properties, prefix)
  } else {
    // 直接是properties对象
    processProperties(mapping, prefix)
  }
  
  return fields
}

// 获取字段属性
const getFieldProperties = (config) => {
  const properties = {}
  const excludeKeys = ['type', 'properties', 'fields']
  
  Object.entries(config).forEach(([key, value]) => {
    if (!excludeKeys.includes(key)) {
      properties[key] = typeof value === 'object' ? JSON.stringify(value) : value
    }
  })
  
  return properties
}

// 获取字段类型颜色
const getFieldTypeColor = (type) => {
  const colorMap = {
    'text': 'primary',
    'keyword': 'success',
    'long': 'warning',
    'integer': 'warning',
    'short': 'warning',
    'byte': 'warning',
    'double': 'warning',
    'float': 'warning',
    'date': 'info',
    'boolean': 'danger',
    'object': '',
    'nested': 'primary'
  }
  return colorMap[type] || ''
}

// 获取字段类型描述
const getFieldTypeDescription = (type) => {
  const descriptions = {
    'text': '全文搜索字段类型，支持分词和全文检索，适用于文章内容、描述等需要搜索的文本',
    'keyword': '精确匹配字段类型，不分词，适用于标签、状态、ID等需要精确匹配和聚合的字段',
    'long': '64位有符号整数类型，范围：-2^63 到 2^63-1',
    'integer': '32位有符号整数类型，范围：-2^31 到 2^31-1',
    'short': '16位有符号整数类型，范围：-32,768 到 32,767',
    'byte': '8位有符号整数类型，范围：-128 到 127',
    'double': '64位双精度浮点数类型',
    'float': '32位单精度浮点数类型',
    'half_float': '16位半精度浮点数类型',
    'scaled_float': '缩放浮点数类型，通过scaling_factor参数控制精度',
    'date': '日期时间类型，支持多种日期格式',
    'date_nanos': '纳秒精度的日期时间类型',
    'boolean': '布尔类型，存储true/false值',
    'binary': '二进制数据类型，Base64编码存储',
    'object': '对象类型，可包含嵌套字段',
    'nested': '嵌套对象类型，保持对象数组中每个对象的独立性',
    'geo_point': '地理坐标点类型，存储经纬度信息',
    'geo_shape': '地理形状类型，存储复杂的地理几何图形',
    'ip': 'IP地址类型，支持IPv4和IPv6',
    'completion': '自动补全类型，用于搜索建议功能',
    'token_count': '词元计数类型，存储分析后的词元数量',
    'murmur3': 'Murmur3哈希值类型',
    'annotated-text': '带注释的文本类型',
    'percolator': '查询存储类型，用于反向搜索',
    'join': '父子关系类型，建立文档间的关联',
    'rank_feature': '排名特征类型，用于提升搜索相关性',
    'rank_features': '多个排名特征类型',
    'dense_vector': '密集向量类型，用于向量搜索',
    'sparse_vector': '稀疏向量类型（已废弃）',
    'search_as_you_type': '搜索即输入类型，优化前缀搜索',
    'alias': '字段别名类型',
    'flattened': '扁平化对象类型，将整个对象作为单个字段索引',
    'shape': '几何形状类型',
    'histogram': '直方图类型，用于预聚合数值数据',
    'constant_keyword': '常量关键字类型，所有文档共享相同值'
  }
  return descriptions[type] || `${type} 类型字段`
}

// 获取属性描述
const getPropertyDescription = (key, value) => {
  const descriptions = {
    'analyzer': `分析器：${value} - 用于索引时对文本进行分词和处理`,
    'search_analyzer': `搜索分析器：${value} - 用于搜索时对查询文本进行分词和处理`,
    'normalizer': `标准化器：${value} - 用于keyword字段的标准化处理`,
    'boost': `权重提升：${value} - 字段在搜索时的相关性权重倍数`,
    'coerce': `类型强制转换：${value} - 是否尝试将字符串转换为数字`,
    'copy_to': `复制到：${value} - 将字段值复制到指定字段`,
    'doc_values': `文档值：${value} - 是否存储用于排序、聚合和脚本的列式存储`,
    'dynamic': `动态映射：${value} - 如何处理新字段（true/false/strict）`,
    'eager_global_ordinals': `预加载全局序数：${value} - 是否在刷新时预加载全局序数`,
    'enabled': `启用状态：${value} - 字段是否被索引和存储`,
    'fielddata': `字段数据：${value} - 是否在内存中加载字段数据用于聚合`,
    'format': `日期格式：${value} - 日期字段的格式模式`,
    'ignore_above': `忽略长度：${value} - 超过此长度的字符串将不被索引`,
    'ignore_malformed': `忽略格式错误：${value} - 是否忽略格式错误的值`,
    'include_in_all': `包含在_all：${value} - 是否包含在_all字段中（已废弃）`,
    'index': `索引状态：${value} - 字段是否被索引（true/false）`,
    'index_options': `索引选项：${value} - 控制索引中存储的信息量`,
    'index_phrases': `索引短语：${value} - 是否索引2-shingle用于精确短语查询`,
    'index_prefixes': `索引前缀：${value} - 为前缀搜索创建单独的字段`,
    'meta': `元数据：${value} - 字段的元数据信息`,
    'norms': `标准化因子：${value} - 是否存储用于评分的标准化因子`,
    'null_value': `空值替换：${value} - 用于替换null值的默认值`,
    'position_increment_gap': `位置增量间隔：${value} - 数组元素间的位置间隔`,
    'properties': `子属性：包含 ${Object.keys(value || {}).length} 个子字段`,
    'search_quote_analyzer': `引号搜索分析器：${value} - 处理带引号查询的分析器`,
    'similarity': `相似度算法：${value} - 用于评分的相似度算法`,
    'store': `存储原值：${value} - 是否单独存储字段原始值`,
    'term_vector': `词项向量：${value} - 是否存储词项向量信息`,
    'fields': `多字段映射：包含 ${Object.keys(value || {}).length} 个子字段映射`,
    'scaling_factor': `缩放因子：${value} - scaled_float类型的缩放倍数`,
    'locale': `区域设置：${value} - ICU分析器的区域设置`,
    'max_input_length': `最大输入长度：${value} - completion字段的最大输入长度`,
    'preserve_separators': `保留分隔符：${value} - completion字段是否保留分隔符`,
    'preserve_position_increments': `保留位置增量：${value} - completion字段是否保留位置增量`,
    'max_shingle_size': `最大shingle大小：${value} - search_as_you_type字段的最大shingle大小`,
    'split_queries_on_whitespace': `空白符分割查询：${value} - 是否在空白符处分割查询`,
    'time_zone': `时区：${value} - 日期字段的时区设置`,
    'path': `路径：${value} - 别名字段指向的实际字段路径`,
    'depth_limit': `深度限制：${value} - flattened字段的最大嵌套深度`,
    'dims': `维度：${value} - dense_vector字段的向量维度`,
    'relations': `关系：${JSON.stringify(value)} - join字段定义的父子关系`,
    'positive_score_impact': `正向评分影响：${value} - rank_feature字段是否对评分产生正向影响`
  }
  
  return descriptions[key] || `${key}: ${value} - 字段配置属性`
}

// 加载索引列表
const loadIndices = async () => {
  try {
    indices.value = await api.getIndices()
    
    // 恢复上次选择的索引
    const lastSelectedIndex = storageManager.getLastSelectedIndex(indices.value)
    if (lastSelectedIndex) {
      selectedIndex.value = lastSelectedIndex
      await loadIndexMapping()
    }
  } catch (error) {
    console.error('Failed to load indices:', error)
    ElMessage.error(t('errors.loadIndicesFailed') + ': ' + error.message)
  }
}

// 加载索引映射
const loadIndexMapping = async () => {
  if (!selectedIndex.value) {
    indexMapping.value = null
    return
  }
  
  loadingMapping.value = true
  try {
    const result = await api.getIndexMapping(selectedIndex.value)
    indexMapping.value = result
    console.log('Loaded mapping:', result)
  } catch (error) {
    console.error('Failed to load mapping:', error)
    ElMessage.error(t('errors.loadMappingsFailed') + ': ' + error.message)
    indexMapping.value = null
  } finally {
    loadingMapping.value = false
  }
}

// 查看字段详情
const viewFieldDetail = (field) => {
  currentField.value = field
  showFieldDialog.value = true
}

// 复制映射JSON
const copyMapping = async () => {
  try {
    await navigator.clipboard.writeText(JSON.stringify(indexMapping.value, null, 2))
    ElMessage.success(t('success.mappingCopied'))
  } catch (error) {
    ElMessage.error(t('errors.copyFailed'))
  }
}

// 刷新数据
const refreshData = () => {
  loadIndices()
  if (selectedIndex.value) {
    loadIndexMapping()
  }
}

// 监听索引选择变化
watch(() => selectedIndex.value, (newIndex) => {
  storageManager.setLastSelectedIndex(newIndex)
})

onMounted(() => {
  loadIndices()
})
</script>

<style scoped>
.mappings-container {
  padding: 20px;
}

.header-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #909399;
}

.loading-container .el-icon {
  margin-bottom: 8px;
  font-size: 18px;
}

.field-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.stat-tag {
  margin: 2px;
}

.field-properties {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.property-tag {
  margin: 1px;
  font-size: 11px;
}

.mapping-json {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.5;
  max-height: 500px;
  overflow-y: auto;
}

.field-config {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.5;
  max-height: 300px;
  overflow-y: auto;
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

.page-description {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}
</style>