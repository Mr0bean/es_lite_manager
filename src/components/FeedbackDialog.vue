<template>
  <el-dialog
    v-model="visible"
    :title="$t('feedback.title', 'Feedback & Support')"
    width="650px"
    :before-close="handleClose"
    class="feedback-dialog"
    destroy-on-close
  >
    <!-- 反馈类型选择 -->
    <div class="feedback-type-selector">
      <el-radio-group v-model="feedbackType" size="large">
        <el-radio-button 
          v-for="type in issueTypes" 
          :key="type.value"
          :value="type.value"
        >
          <el-icon><component :is="type.icon" /></el-icon>
          {{ type.label }}
        </el-radio-button>
      </el-radio-group>
    </div>

    <!-- 表单内容 -->
    <el-form
      ref="feedbackForm"
      :model="formData"
      :rules="rules"
      label-width="100px"
      class="feedback-form"
    >
      <!-- Bug Report -->
      <template v-if="feedbackType === 'bug'">
        <el-form-item :label="$t('feedback.title', 'Title')" prop="title">
          <el-input 
            v-model="formData.title" 
            :placeholder="$t('feedback.bugTitlePlaceholder', 'Brief description of the bug')"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item :label="$t('feedback.description', 'Description')" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="4"
            :placeholder="$t('feedback.bugDescPlaceholder', 'Describe what happened')"
          />
        </el-form-item>
        
        <el-form-item :label="$t('feedback.steps', 'Steps')">
          <div class="steps-list">
            <el-input
              v-for="(step, index) in formData.steps"
              :key="index"
              v-model="formData.steps[index]"
              :placeholder="`Step ${index + 1}`"
              class="step-input"
            >
              <template #append>
                <el-button
                  v-if="formData.steps.length > 1"
                  @click="removeStep(index)"
                  :icon="Minus"
                  circle
                  size="small"
                />
              </template>
            </el-input>
            <el-button
              @click="addStep"
              :icon="Plus"
              type="primary"
              text
              size="small"
            >
              Add Step
            </el-button>
          </div>
        </el-form-item>
        
        <el-form-item :label="$t('feedback.expected', 'Expected')">
          <el-input
            v-model="formData.expected"
            type="textarea"
            :rows="2"
            :placeholder="$t('feedback.expectedPlaceholder', 'What should happen')"
          />
        </el-form-item>
        
        <el-form-item :label="$t('feedback.actual', 'Actual')">
          <el-input
            v-model="formData.actual"
            type="textarea"
            :rows="2"
            :placeholder="$t('feedback.actualPlaceholder', 'What actually happened')"
          />
        </el-form-item>
        
        <el-form-item :label="$t('feedback.errorLog', 'Error Log')">
          <el-input
            v-model="formData.errorLog"
            type="textarea"
            :rows="3"
            :placeholder="$t('feedback.errorLogPlaceholder', 'Paste any error messages from console')"
            class="code-input"
          />
        </el-form-item>
      </template>

      <!-- Feature Request -->
      <template v-if="feedbackType === 'feature'">
        <el-form-item :label="$t('feedback.title', 'Title')" prop="title">
          <el-input 
            v-model="formData.title" 
            :placeholder="$t('feedback.featureTitlePlaceholder', 'Brief description of the feature')"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item :label="$t('feedback.description', 'Description')" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="4"
            :placeholder="$t('feedback.featureDescPlaceholder', 'Describe the feature you would like')"
          />
        </el-form-item>
        
        <el-form-item :label="$t('feedback.problem', 'Problem')">
          <el-input
            v-model="formData.problem"
            type="textarea"
            :rows="3"
            :placeholder="$t('feedback.problemPlaceholder', 'What problem does this solve?')"
          />
        </el-form-item>
        
        <el-form-item :label="$t('feedback.solution', 'Solution')">
          <el-input
            v-model="formData.solution"
            type="textarea"
            :rows="3"
            :placeholder="$t('feedback.solutionPlaceholder', 'How should this work?')"
          />
        </el-form-item>
        
        <el-form-item :label="$t('feedback.priority', 'Priority')">
          <el-radio-group v-model="formData.priority">
            <el-radio value="critical">Critical</el-radio>
            <el-radio value="nice">Nice to have</el-radio>
            <el-radio value="low">Low priority</el-radio>
          </el-radio-group>
        </el-form-item>
      </template>

      <!-- Improvement -->
      <template v-if="feedbackType === 'improvement'">
        <el-form-item :label="$t('feedback.title', 'Title')" prop="title">
          <el-input 
            v-model="formData.title" 
            :placeholder="$t('feedback.improvementTitlePlaceholder', 'What would you like to improve?')"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item :label="$t('feedback.current', 'Current')" prop="current">
          <el-input
            v-model="formData.current"
            type="textarea"
            :rows="3"
            :placeholder="$t('feedback.currentPlaceholder', 'Describe current behavior')"
          />
        </el-form-item>
        
        <el-form-item :label="$t('feedback.suggestion', 'Suggestion')" prop="suggestion">
          <el-input
            v-model="formData.suggestion"
            type="textarea"
            :rows="4"
            :placeholder="$t('feedback.suggestionPlaceholder', 'Your improvement suggestion')"
          />
        </el-form-item>
        
        <el-form-item :label="$t('feedback.benefits', 'Benefits')">
          <el-input
            v-model="formData.benefitsText"
            type="textarea"
            :rows="3"
            :placeholder="$t('feedback.benefitsPlaceholder', 'List the benefits of this improvement')"
          />
        </el-form-item>
      </template>

      <!-- Question -->
      <template v-if="feedbackType === 'question'">
        <el-form-item :label="$t('feedback.question', 'Question')" prop="question">
          <el-input
            v-model="formData.question"
            type="textarea"
            :rows="3"
            :placeholder="$t('feedback.questionPlaceholder', 'What would you like to know?')"
          />
        </el-form-item>
        
        <el-form-item :label="$t('feedback.context', 'Context')">
          <el-input
            v-model="formData.context"
            type="textarea"
            :rows="3"
            :placeholder="$t('feedback.contextPlaceholder', 'Provide some context')"
          />
        </el-form-item>
        
        <el-form-item :label="$t('feedback.tried', 'Tried')">
          <el-input
            v-model="formData.tried"
            type="textarea"
            :rows="3"
            :placeholder="$t('feedback.triedPlaceholder', 'What have you already tried?')"
          />
        </el-form-item>
      </template>

      <!-- 通用字段 -->
      <el-form-item :label="$t('feedback.attachInfo', 'Attach Info')">
        <el-checkbox-group v-model="formData.attachments">
          <el-checkbox label="systemInfo">Include System Information</el-checkbox>
          <el-checkbox label="screenshot">I will attach screenshots</el-checkbox>
          <el-checkbox label="logs">Include console logs</el-checkbox>
        </el-checkbox-group>
      </el-form-item>
    </el-form>

    <!-- 系统信息预览 -->
    <el-collapse v-if="formData.attachments.includes('systemInfo')" class="system-info-preview">
      <el-collapse-item title="System Information Preview" name="systemInfo">
        <pre class="info-preview">{{ systemInfoText }}</pre>
      </el-collapse-item>
    </el-collapse>

    <!-- 按钮 -->
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">Cancel</el-button>
        <el-button @click="handlePreview" type="info">
          <el-icon><View /></el-icon>
          Preview
        </el-button>
        <el-button @click="handleSubmit" type="primary" :loading="submitting">
          <el-icon><Promotion /></el-icon>
          Create Issue
        </el-button>
      </div>
    </template>
  </el-dialog>

  <!-- 预览对话框 -->
  <el-dialog
    v-model="previewVisible"
    title="Issue Preview"
    width="700px"
    class="preview-dialog"
  >
    <div class="preview-content">
      <h3>{{ previewData.title }}</h3>
      <div class="preview-labels">
        <el-tag v-for="label in previewData.labels" :key="label" size="small">
          {{ label }}
        </el-tag>
      </div>
      <pre class="preview-body">{{ previewData.body }}</pre>
    </div>
    <template #footer>
      <el-button @click="previewVisible = false">Close</el-button>
      <el-button type="primary" @click="handleSubmitFromPreview">
        <el-icon><Promotion /></el-icon>
        Submit Issue
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  CircleCloseFilled,
  Star,
  QuestionFilled,
  Document,
  Tools,
  View,
  Promotion,
  Plus,
  Minus
} from '@element-plus/icons-vue'
import { 
  ISSUE_TYPES,
  quickCreateIssue,
  getSystemInfo,
  openIssueCreator
} from '../utils/issueHelper'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  initialType: {
    type: String,
    default: 'bug'
  },
  initialData: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:modelValue', 'submitted'])

// 状态
const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const feedbackType = ref(props.initialType)
const submitting = ref(false)
const previewVisible = ref(false)
const previewData = ref({})

// Issue类型配置
const issueTypes = [
  { value: 'bug', label: 'Bug Report', icon: CircleCloseFilled },
  { value: 'feature', label: 'Feature Request', icon: Star },
  { value: 'improvement', label: 'Improvement', icon: Tools },
  { value: 'question', label: 'Question', icon: QuestionFilled }
]

// 表单数据
const formData = reactive({
  title: '',
  description: '',
  steps: [''],
  expected: '',
  actual: '',
  errorLog: '',
  problem: '',
  solution: '',
  priority: 'nice',
  current: '',
  suggestion: '',
  benefitsText: '',
  question: '',
  context: '',
  tried: '',
  attachments: ['systemInfo']
})

// 表单验证规则
const rules = {
  title: [
    { required: true, message: 'Please enter a title', trigger: 'blur' },
    { min: 5, max: 100, message: 'Title should be 5-100 characters', trigger: 'blur' }
  ],
  description: [
    { required: true, message: 'Please enter a description', trigger: 'blur' },
    { min: 10, message: 'Description should be at least 10 characters', trigger: 'blur' }
  ],
  current: [
    { required: true, message: 'Please describe current situation', trigger: 'blur' }
  ],
  suggestion: [
    { required: true, message: 'Please provide your suggestion', trigger: 'blur' }
  ],
  question: [
    { required: true, message: 'Please enter your question', trigger: 'blur' }
  ]
}

// 系统信息文本
const systemInfoText = computed(() => {
  const info = getSystemInfo()
  return Object.entries(info)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n')
})

// 监听类型变化，重置表单
watch(feedbackType, () => {
  resetForm()
})

// 重置表单
const resetForm = () => {
  Object.keys(formData).forEach(key => {
    if (key === 'steps') {
      formData[key] = ['']
    } else if (key === 'priority') {
      formData[key] = 'nice'
    } else if (key === 'attachments') {
      formData[key] = ['systemInfo']
    } else {
      formData[key] = ''
    }
  })
}

// 添加步骤
const addStep = () => {
  formData.steps.push('')
}

// 移除步骤
const removeStep = (index) => {
  formData.steps.splice(index, 1)
}

// 处理关闭
const handleClose = () => {
  visible.value = false
  resetForm()
}

// 预览Issue
const handlePreview = async () => {
  const form = await validateForm()
  if (!form) return
  
  const data = prepareIssueData()
  const issue = quickCreateIssue(feedbackType.value, data)
  
  previewData.value = issue
  previewVisible.value = true
}

// 验证表单
const validateForm = () => {
  return new Promise((resolve) => {
    const formRef = document.querySelector('.feedback-form')
    if (!formRef) {
      resolve(true)
      return
    }
    
    // 简单验证必填字段
    let isValid = true
    
    if (feedbackType.value === 'bug' && !formData.title) {
      ElMessage.error('Please enter a title')
      isValid = false
    }
    
    if (feedbackType.value === 'bug' && !formData.description) {
      ElMessage.error('Please enter a description')
      isValid = false
    }
    
    resolve(isValid)
  })
}

// 准备Issue数据
const prepareIssueData = () => {
  const data = {
    title: formData.title,
    description: formData.description,
    steps: formData.steps.filter(s => s.trim()),
    expected: formData.expected,
    actual: formData.actual,
    errorLog: formData.errorLog,
    problem: formData.problem,
    solution: formData.solution,
    priority: formData.priority,
    current: formData.current,
    suggestion: formData.suggestion,
    benefits: formData.benefitsText ? formData.benefitsText.split('\n').filter(b => b.trim()) : [],
    question: formData.question,
    context: formData.context,
    tried: formData.tried
  }
  
  // 添加系统信息
  if (formData.attachments.includes('systemInfo')) {
    data.includeSystemInfo = true
  }
  
  return data
}

// 提交Issue
const handleSubmit = async () => {
  const form = await validateForm()
  if (!form) return
  
  submitting.value = true
  
  try {
    const data = prepareIssueData()
    const issue = openIssueCreator(feedbackType.value, data)
    
    ElMessage.success('Opening GitHub to create issue...')
    
    emit('submitted', {
      type: feedbackType.value,
      data: issue
    })
    
    handleClose()
  } catch (error) {
    console.error('Error creating issue:', error)
    ElMessage.error('Failed to create issue: ' + error.message)
  } finally {
    submitting.value = false
  }
}

// 从预览提交
const handleSubmitFromPreview = () => {
  previewVisible.value = false
  handleSubmit()
}
</script>

<style scoped>
.feedback-dialog {
  --el-dialog-padding-primary: 20px;
}

.feedback-type-selector {
  margin-bottom: 20px;
  text-align: center;
}

.feedback-type-selector :deep(.el-radio-button__inner) {
  padding: 12px 20px;
}

.feedback-form {
  margin-top: 20px;
}

.steps-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.step-input {
  margin-bottom: 5px;
}

.code-input {
  font-family: 'Monaco', 'Courier New', monospace;
}

.system-info-preview {
  margin-top: 15px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
}

.info-preview {
  background: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.5;
  max-height: 150px;
  overflow-y: auto;
  margin: 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.preview-dialog .preview-content {
  padding: 10px;
}

.preview-content h3 {
  margin: 0 0 15px;
  color: #303133;
}

.preview-labels {
  margin-bottom: 15px;
  display: flex;
  gap: 8px;
}

.preview-body {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-size: 13px;
  line-height: 1.6;
  max-height: 400px;
  overflow-y: auto;
  margin: 0;
}
</style>