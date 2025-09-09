<template>
  <div class="analyzers-container">
    <div class="page-header">
      <div class="header-top">
        <h2>{{ $t('analyzers.title') }}</h2>
        <div class="header-actions">
          <el-button type="warning" @click="clearCache" style="margin-right: 8px;">
            <el-icon><Delete /></el-icon>
            {{ $t('analyzers.clearCache') }}
          </el-button>
          <RefreshTimer :on-refresh="refreshData" />
        </div>
      </div>
      <p class="page-description">{{ $t('analyzers.description') }}</p>
    </div>

    <el-row :gutter="20">
      <!-- 左侧：索引分词器配置 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>{{ $t('analyzers.indexAnalyzerConfig') }}</span>
              <el-select 
                v-model="selectedIndex" 
                :placeholder="$t('analyzers.placeholders.selectIndex')" 
                @change="loadIndexAnalyzers"
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
          
          <div v-if="loadingAnalyzers" class="loading-container">
            <el-icon class="is-loading"><Loading /></el-icon>
            <span>{{ $t('analyzers.loading') }}</span>
          </div>
          
          <div v-else-if="indexAnalyzers">
            <!-- 默认分词器 -->
            <el-descriptions :title="$t('analyzers.defaultAnalyzer')" :column="1" border>
              <el-descriptions-item :label="$t('analyzers.fields.analyzer')">
                <el-tag>{{ indexAnalyzers.default_analyzer }}</el-tag>
              </el-descriptions-item>
            </el-descriptions>
            
            <!-- 自定义分词器 -->
            <el-descriptions :title="$t('analyzers.customAnalyzers')" :column="1" border style="margin-top: 20px">
              <el-descriptions-item 
                v-for="(config, name) in indexAnalyzers.custom_analyzers" 
                :key="name"
                :label="name"
              >
                <div class="analyzer-grid">
                  <el-tooltip 
                    :content="`${$t('analyzers.customAnalyzers')}: ${name}\n${$t('analyzers.fields.type')}: ${config.type || $t('common.unknown')}\n${getAnalyzerDescription(name) || $t('analyzers.noDescriptionAvailable')}`"
                    placement="top"
                    effect="dark"
                  >
                    <el-tag 
                      class="analyzer-tag custom-analyzer" 
                      type="success"
                      @click="quickTest(name)"
                    >
                      {{ name }}
                    </el-tag>
                  </el-tooltip>
                </div>
                <el-button 
                  type="text" 
                  @click="viewAnalyzerConfig(name, config)"
                  style="margin-left: 10px;"
                >
                  {{ $t('analyzers.viewConfig') }}
                </el-button>
              </el-descriptions-item>
              <el-descriptions-item v-if="Object.keys(indexAnalyzers.custom_analyzers).length === 0">
                <span class="text-muted">{{ $t('analyzers.noCustomAnalyzers') }}</span>
              </el-descriptions-item>
            </el-descriptions>
            
            <!-- 字段分词器 -->
            <el-descriptions :title="$t('analyzers.fieldAnalyzers')" :column="1" border style="margin-top: 20px">
              <el-descriptions-item 
                v-for="(analyzer, field) in indexAnalyzers.field_analyzers" 
                :key="field"
                :label="field"
              >
                <el-tag>{{ analyzer }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item v-if="Object.keys(indexAnalyzers.field_analyzers).length === 0">
                <span class="text-muted">{{ $t('analyzers.allFieldsUseDefault') }}</span>
              </el-descriptions-item>
            </el-descriptions>
          </div>
          
          <div v-else-if="selectedIndex">
            <el-empty :description="$t('analyzers.selectIndexToView')" />
          </div>
          
          <div v-else>
            <el-empty :description="$t('analyzers.selectIndex')" />
          </div>
        </el-card>
      </el-col>
      
      <!-- 右侧：分词器测试 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>{{ $t('analyzers.analyzerTest') }}</span>
          </template>
          
          <el-form :model="analyzeForm" label-width="80px">
            <el-form-item :label="$t('analyzers.fields.index')">
              <el-select v-model="analyzeForm.index" :placeholder="$t('analyzers.placeholders.selectIndexOptional')">
                <el-option :label="$t('analyzers.placeholders.noIndexSpecified')" value="" />
                <el-option
                  v-for="index in indices"
                  :key="index.index"
                  :label="index.index"
                  :value="index.index"
                />
              </el-select>
            </el-form-item>
            
            <el-form-item :label="$t('analyzers.fields.analyzer')">
              <el-select v-model="analyzeForm.analyzer" :placeholder="$t('analyzers.placeholders.selectAnalyzer')">
                <el-option-group 
                  v-if="indexAnalyzers && Object.keys(indexAnalyzers.custom_analyzers).length > 0" 
                  :label="$t('analyzers.customAnalyzers')"
                >
                  <el-option
                    v-for="(config, analyzer) in indexAnalyzers.custom_analyzers"
                    :key="analyzer"
                    :label="analyzer"
                    :value="analyzer"
                  />
                </el-option-group>
                <el-option-group :label="$t('analyzers.generalAnalyzers')">
                  <el-option
                    v-for="analyzer in builtinAnalyzers.general_analyzers"
                    :key="analyzer"
                    :label="analyzer"
                    :value="analyzer"
                  />
                </el-option-group>
                <el-option-group :label="$t('analyzers.languageAnalyzers')">
                  <el-option
                    v-for="analyzer in builtinAnalyzers.language_analyzers"
                    :key="analyzer"
                    :label="analyzer"
                    :value="analyzer"
                  />
                </el-option-group>
                <el-option-group 
                  v-if="indexAnalyzers && Object.keys(indexAnalyzers.field_analyzers).length > 0" 
                  :label="$t('analyzers.fieldAnalyzers')"
                >
                  <el-option
                    v-for="(config, field) in indexAnalyzers.field_analyzers"
                    :key="field"
                    :label="`${field} (${config.analyzer})`"
                    :value="config.analyzer"
                  />
                </el-option-group>
              </el-select>
            </el-form-item>
            
            <el-form-item :label="$t('analyzers.fields.testText')">
              <el-input
                v-model="analyzeForm.text"
                type="textarea"
                :rows="3"
                :placeholder="$t('analyzers.placeholders.enterTestText')"
              />
            </el-form-item>
            
            <el-form-item>
              <el-button 
                type="primary" 
                @click="testAnalyzer" 
                :loading="analyzingText"
                :disabled="!analyzeForm.text || !analyzeForm.analyzer"
              >
                {{ $t('analyzers.testText') }}
              </el-button>
            </el-form-item>
          </el-form>
          
          <!-- 分词结果 -->
          <div v-if="analyzeResult" style="margin-top: 20px">
            <el-divider>{{ $t('analyzers.testResult') }}</el-divider>
            <div class="analyze-result">
              <div class="tokens">
                <el-tag 
                  v-for="(token, index) in analyzeResult.tokens" 
                  :key="index"
                  class="token-tag"
                  :title="`${$t('analyzers.fields.position')}: ${token.start_offset}-${token.end_offset}, ${$t('analyzers.fields.type')}: ${token.type}`"
                >
                  {{ token.token }}
                </el-tag>
              </div>
              <div class="token-details" style="margin-top: 15px">
                <el-table :data="analyzeResult.tokens" size="small" max-height="300" stripe>
                  <el-table-column prop="token" :label="$t('analyzers.fields.token')" width="120" />
                  <el-table-column prop="type" :label="$t('analyzers.fields.type')" width="100" />
                  <el-table-column prop="position" :label="$t('analyzers.fields.position')" width="60" />
                  <el-table-column prop="start_offset" :label="$t('analyzers.fields.startOffset')" width="60" />
                  <el-table-column prop="end_offset" :label="$t('analyzers.fields.endOffset')" width="60" />
                </el-table>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 内置分词器列表 -->
    <el-card style="margin-top: 20px">
      <template #header>
        <span>{{ $t('analyzers.builtinAnalyzers') }}</span>
      </template>
      
      <el-tabs v-model="activeTab">
        <el-tab-pane :label="$t('analyzers.generalAnalyzers')" name="general">
          <div class="analyzer-grid">
            <el-tooltip 
              v-for="analyzer in builtinAnalyzers.general_analyzers" 
              :key="analyzer"
              :content="getAnalyzerDescription(analyzer)"
              placement="top"
              effect="dark"
            >
              <el-tag 
                class="analyzer-tag"
                @click="quickTest(analyzer)"
              >
                {{ analyzer }}
              </el-tag>
            </el-tooltip>
          </div>
        </el-tab-pane>
        
        <el-tab-pane :label="$t('analyzers.languageAnalyzers')" name="language">
          <div class="analyzer-grid">
            <el-tooltip 
              v-for="analyzer in builtinAnalyzers.language_analyzers" 
              :key="analyzer"
              :content="getAnalyzerDescription(analyzer)"
              placement="top"
              effect="dark"
            >
              <el-tag 
                class="analyzer-tag"
                @click="quickTest(analyzer)"
              >
                {{ analyzer }}
              </el-tag>
            </el-tooltip>
          </div>
        </el-tab-pane>
        
        <el-tab-pane :label="$t('analyzers.tokenizers')" name="tokenizers">
          <div class="analyzer-grid">
            <el-tooltip 
              v-for="tokenizer in builtinAnalyzers.tokenizers" 
              :key="tokenizer"
              :content="getAnalyzerDescription(tokenizer)"
              placement="top"
              effect="dark"
            >
              <el-tag 
                class="analyzer-tag"
              >
                {{ tokenizer }}
              </el-tag>
            </el-tooltip>
          </div>
        </el-tab-pane>
        
        <el-tab-pane :label="$t('analyzers.tokenFilters')" name="filters">
          <div class="analyzer-grid">
            <el-tooltip 
              v-for="filter in builtinAnalyzers.token_filters" 
              :key="filter"
              :content="getAnalyzerDescription(filter)"
              placement="top"
              effect="dark"
            >
              <el-tag 
                class="analyzer-tag"
              >
                {{ filter }}
              </el-tag>
            </el-tooltip>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
    
    <!-- 分词器配置详情对话框 -->
    <el-dialog 
      v-model="showConfigDialog" 
      :title="`${$t('analyzers.analyzerConfig')}: ${currentAnalyzerName}`"
      width="600px"
    >
      <pre class="config-json">{{ JSON.stringify(currentAnalyzerConfig, null, 2) }}</pre>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Loading, Delete } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
import { 
  getIndices, 
  getIndexAnalyzers, 
  analyzeText, 
  getBuiltinAnalyzers 
} from '../api/elasticsearch'
import RefreshTimer from '../components/RefreshTimer.vue'

// 本地存储键名
const STORAGE_KEYS = {
  SELECTED_INDEX: 'analyzer_selected_index',
  ANALYZE_FORM: 'analyzer_form_data'
}

// Get analyzer description from i18n
const getAnalyzerDescription = (name) => {
  try {
    const description = t(`analyzers.descriptions.${name}`)
    // If translation key not found, it returns the key itself
    if (description === `analyzers.descriptions.${name}`) {
      return ''
    }
    return description
  } catch {
    return ''
  }
}

// 本地存储工具函数
const saveToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.warn('Failed to save to localStorage:', error)
  }
}

const loadFromStorage = (key, defaultValue = null) => {
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : defaultValue
  } catch (error) {
    console.warn('Failed to read from localStorage:', error)
    return defaultValue
  }
}

// Analyzer descriptions removed - now in i18n files
// See src/i18n/locales/*/common.json under analyzers.descriptions
const analyzerDescriptions_DEPRECATED = {
  // 通用分词器
  standard: '标准分词器，使用Unicode文本分割算法，适用于大多数语言',
  simple: '简单分词器，按非字母字符分割文本，并转换为小写',
  whitespace: '空白字符分词器，按空白字符分割文本，不转换大小写',
  stop: '停用词分词器，类似simple分词器但会过滤停用词',
  keyword: '关键词分词器，将整个输入作为单个词元输出',
  pattern: '正则表达式分词器，使用正则表达式分割文本',
  fingerprint: '指纹分词器，用于去重和标准化文本',
  
  // 语言分词器
  arabic: '阿拉伯语分词器，针对阿拉伯语文本优化',
  armenian: '亚美尼亚语分词器，针对亚美尼亚语文本优化',
  basque: '巴斯克语分词器，针对巴斯克语文本优化',
  bengali: '孟加拉语分词器，针对孟加拉语文本优化',
  brazilian: '巴西葡萄牙语分词器，针对巴西葡萄牙语优化',
  bulgarian: '保加利亚语分词器，针对保加利亚语文本优化',
  catalan: '加泰罗尼亚语分词器，针对加泰罗尼亚语文本优化',
  chinese: '中文分词器，针对中文文本优化',
  cjk: 'CJK分词器，针对中日韩文本优化',
  czech: '捷克语分词器，针对捷克语文本优化',
  danish: '丹麦语分词器，针对丹麦语文本优化',
  dutch: '荷兰语分词器，针对荷兰语文本优化',
  english: '英语分词器，针对英语文本优化，包含词干提取',
  estonian: '爱沙尼亚语分词器，针对爱沙尼亚语文本优化',
  finnish: '芬兰语分词器，针对芬兰语文本优化',
  french: '法语分词器，针对法语文本优化',
  galician: '加利西亚语分词器，针对加利西亚语文本优化',
  german: '德语分词器，针对德语文本优化',
  greek: '希腊语分词器，针对希腊语文本优化',
  hindi: '印地语分词器，针对印地语文本优化',
  hungarian: '匈牙利语分词器，针对匈牙利语文本优化',
  indonesian: '印尼语分词器，针对印尼语文本优化',
  irish: '爱尔兰语分词器，针对爱尔兰语文本优化',
  italian: '意大利语分词器，针对意大利语文本优化',
  latvian: '拉脱维亚语分词器，针对拉脱维亚语文本优化',
  lithuanian: '立陶宛语分词器，针对立陶宛语文本优化',
  norwegian: '挪威语分词器，针对挪威语文本优化',
  persian: '波斯语分词器，针对波斯语文本优化',
  portuguese: '葡萄牙语分词器，针对葡萄牙语文本优化',
  romanian: '罗马尼亚语分词器，针对罗马尼亚语文本优化',
  russian: '俄语分词器，针对俄语文本优化',
  sorani: '索拉尼库尔德语分词器，针对索拉尼库尔德语优化',
  spanish: '西班牙语分词器，针对西班牙语文本优化',
  swedish: '瑞典语分词器，针对瑞典语文本优化',
  turkish: '土耳其语分词器，针对土耳其语文本优化',
  thai: '泰语分词器，针对泰语文本优化',
  
  // 分词器(Tokenizers)
  letter: '字母分词器，按非字母字符分割文本',
  lowercase: '小写分词器，按非字母字符分割并转换为小写',
  uax_url_email: 'URL和邮箱分词器，识别URL和邮箱地址',
  classic: '经典分词器，基于语法的英语分词器',
  ngram: 'N-gram分词器，生成指定长度的字符序列',
  edge_ngram: '边缘N-gram分词器，从词的开头生成N-gram',
  simple_pattern: '简单模式分词器，使用正则表达式匹配词元',
  char_group: '字符组分词器，按字符组分割文本',
  simple_pattern_split: '简单模式分割分词器，使用正则表达式分割',
  path_hierarchy: '路径层次分词器，用于文件路径分析',
  
  // 词元过滤器(Token Filters)
  ascii_folding: 'ASCII折叠过滤器，将非ASCII字符转换为ASCII等价字符',
  length: '长度过滤器，过滤指定长度范围外的词元',
  uppercase: '大写过滤器，将词元转换为大写',
  nGram: 'N-gram过滤器，将词元分解为N-gram',
  edge_nGram: '边缘N-gram过滤器，从词元开头生成N-gram',
  porter_stem: 'Porter词干提取器，英语词干提取算法',
  shingle: 'Shingle过滤器，生成词元的组合',
  word_delimiter: '单词分隔符过滤器，按分隔符分割复合词',
  stemmer: '词干提取器，多语言词干提取',
  synonym: '同义词过滤器，替换或添加同义词',
  trim: '修剪过滤器，去除词元前后的空白字符',
  truncate: '截断过滤器，截断超过指定长度的词元',
  unique: '唯一过滤器，去除重复的词元',
  pattern_replace: '模式替换过滤器，使用正则表达式替换文本',
  snowball: 'Snowball词干提取器，多语言词干提取算法',
  kstem: 'KStem词干提取器，较温和的英语词干提取',
  phonetic: '语音过滤器，生成词的语音编码'
} // This object is deprecated and should not be used

// 响应式数据
const indices = ref([])
const selectedIndex = ref(loadFromStorage(STORAGE_KEYS.SELECTED_INDEX, ''))
const indexAnalyzers = ref(null)
const loadingAnalyzers = ref(false)
const builtinAnalyzers = ref({
  general_analyzers: [],
  language_analyzers: [],
  tokenizers: [],
  token_filters: []
})

// 从本地存储恢复分词器测试表单数据
const savedFormData = loadFromStorage(STORAGE_KEYS.ANALYZE_FORM, {
  index: '',
  analyzer: 'standard',
  text: ''
})

const analyzeForm = reactive({
  index: savedFormData.index,
  analyzer: savedFormData.analyzer,
  text: savedFormData.text
})

const analyzeResult = ref(null)
const analyzingText = ref(false)
const activeTab = ref('general')

// 配置对话框
const showConfigDialog = ref(false)
const currentAnalyzerName = ref('')
const currentAnalyzerConfig = ref({})

// 方法
const loadIndices = async () => {
  try {
    indices.value = await getIndices()
  } catch (error) {
    ElMessage.error(t('errors.loadIndicesFailed') + ': ' + error.message)
  }
}

const loadIndexAnalyzers = async () => {
  if (!selectedIndex.value) return
  
  loadingAnalyzers.value = true
  try {
    indexAnalyzers.value = await getIndexAnalyzers(selectedIndex.value)
  } catch (error) {
    ElMessage.error(t('errors.loadAnalyzersFailed') + ': ' + error.message)
    indexAnalyzers.value = null
  } finally {
    loadingAnalyzers.value = false
  }
}

const loadBuiltinAnalyzers = async () => {
  try {
    builtinAnalyzers.value = await getBuiltinAnalyzers()
  } catch (error) {
    ElMessage.error(t('errors.loadBuiltinAnalyzersFailed') + ': ' + error.message)
  }
}

const quickTest = (analyzerName) => {
  analyzeForm.analyzer = analyzerName
  if (!analyzeForm.text.trim()) {
    analyzeForm.text = t('analyzers.testSamples.defaultText')
  }
  testAnalyzer()
}

const testAnalyzer = async () => {
  analyzingText.value = true
  try {
    analyzeResult.value = await analyzeText({
      index: analyzeForm.index || undefined,
      analyzer: analyzeForm.analyzer,
      text: analyzeForm.text
    })
  } catch (error) {
    ElMessage.error(t('errors.analyzeTestFailed') + ': ' + error.message)
  } finally {
    analyzingText.value = false
  }
}

const viewAnalyzerConfig = (name, config) => {
  currentAnalyzerName.value = name
  currentAnalyzerConfig.value = config
  showConfigDialog.value = true
}

// 验证缓存数据有效性
const validateCachedData = async () => {
  // 验证选中的索引是否仍然存在
  if (selectedIndex.value) {
    const indexExists = indices.value.some(index => index.index === selectedIndex.value)
    if (!indexExists) {
      console.log(`Cached index '${selectedIndex.value}' no longer exists, cleared selection`)
      selectedIndex.value = ''
      saveToStorage(STORAGE_KEYS.SELECTED_INDEX, '')
    }
  }
  
  // 验证分词器测试表单中的索引是否仍然存在
  if (analyzeForm.index) {
    const indexExists = indices.value.some(index => index.index === analyzeForm.index)
    if (!indexExists) {
      console.log(`Analyzer test index '${analyzeForm.index}' no longer exists, cleared selection`)
      analyzeForm.index = ''
    }
  }
}

// 清除缓存数据
const clearCache = () => {
  try {
    // 清除本地存储
    localStorage.removeItem(STORAGE_KEYS.SELECTED_INDEX)
    localStorage.removeItem(STORAGE_KEYS.ANALYZE_FORM)
    
    // 重置界面状态
    selectedIndex.value = ''
    analyzeForm.index = ''
    analyzeForm.analyzer = 'standard'
    analyzeForm.text = ''
    analyzeResult.value = null
    indexAnalyzers.value = null
    
    ElMessage.success(t('analyzers.cacheCleared'))
  } catch (error) {
    ElMessage.error(t('errors.clearCacheFailed') + ': ' + error.message)
  }
}

const refreshData = async () => {
  await Promise.all([
    loadIndices(),
    loadBuiltinAnalyzers()
  ])
  
  // 验证缓存数据的有效性
  await validateCachedData()
  
  if (selectedIndex.value) {
    await loadIndexAnalyzers()
  }
}

// 监听器
watch(() => analyzeForm.index, async (newIndex) => {
  if (newIndex) {
    // 当选择索引时，加载该索引的分词器配置
    try {
      const analyzers = await getIndexAnalyzers(newIndex)
      // 临时存储用于分词器测试的分词器配置
      if (!indexAnalyzers.value || selectedIndex.value !== newIndex) {
        indexAnalyzers.value = analyzers
      }
    } catch (error) {
      console.warn('Failed to get index analyzer config:', error.message)
    }
  }
})

// 监听selectedIndex变化并保存到本地存储
watch(selectedIndex, (newValue) => {
  saveToStorage(STORAGE_KEYS.SELECTED_INDEX, newValue)
})

// 监听analyzeForm变化并保存到本地存储
watch(analyzeForm, (newValue) => {
  saveToStorage(STORAGE_KEYS.ANALYZE_FORM, {
    index: newValue.index,
    analyzer: newValue.analyzer,
    text: newValue.text
  })
}, { deep: true })

// 生命周期
onMounted(() => {
  refreshData()
})
</script>

<style scoped>
.analyzers-container {
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
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #909399;
}

.loading-container .el-icon {
  margin-right: 8px;
  font-size: 18px;
}

.text-muted {
  color: #909399;
  font-style: italic;
}

.analyze-result {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
}

.tokens {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.token-tag {
  cursor: pointer;
  margin: 2px;
}

.analyzer-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.analyzer-tag {
  cursor: pointer;
  margin: 4px;
  transition: all 0.3s;
}

.analyzer-tag:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.custom-analyzer {
  background: linear-gradient(45deg, #67c23a, #85ce61);
  border: none;
  color: white;
  font-weight: bold;
}

.custom-analyzer:hover {
  background: linear-gradient(45deg, #85ce61, #67c23a);
}

.config-json {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.5;
  max-height: 400px;
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

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-description {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}
</style>