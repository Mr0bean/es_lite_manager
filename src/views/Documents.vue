<template>
  <div class="documents-container">
    <div class="page-header">
      <div class="header-top">
        <h2>{{ $t('pages.documents.title') }}</h2>
        <RefreshTimer :on-refresh="loadDocuments" :disabled="!selectedIndex" />
      </div>
      <div class="toolbar">
        <el-select v-model="selectedIndex" :placeholder="$t('placeholders.selectIndex')" @change="loadDocuments" clearable>
          <el-option v-for="idx in indices" :key="idx.index" :label="idx.index" :value="idx.index" />
        </el-select>
        <el-button type="primary" @click="showCreateDialog = true" :disabled="!selectedIndex">
          {{ $t('pages.documents.newDocument') }}
        </el-button>
      </div>
    </div>

    <el-table :data="documents" style="width: 100%" v-loading="loading" stripe>
      <el-table-column type="expand">
        <template #default="props">
          <div class="document-detail">
            <pre>{{ JSON.stringify(props.row._source, null, 2) }}</pre>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="_id" :label="$t('pages.documents.fields.documentId')" width="250" />
      <el-table-column :label="$t('pages.documents.fields.summary')">
        <template #default="scope">
          {{ getDocumentSummary(scope.row._source) }}
        </template>
      </el-table-column>
      <el-table-column :label="$t('pages.documents.fields.operations')" width="180">
        <template #default="scope">
          <el-button size="small" @click="editDocument(scope.row)">{{ $t('actions.edit') }}</el-button>
          <el-button size="small" type="danger" @click="deleteDocument(scope.row)">{{ $t('actions.delete') }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-if="total > 0"
      v-model:current-page="pagination.page"
      v-model:page-size="pagination.size"
      :total="total"
      @current-change="loadDocuments"
      @size-change="handleSizeChange"
      layout="total, sizes, prev, pager, next"
      :page-sizes="[10, 20, 50, 100]"
    />

    <el-dialog v-model="showCreateDialog" :title="editMode ? $t('pages.documents.editDocument') : $t('pages.documents.createDocument')" width="900px">
      <el-form :model="documentForm" label-width="80px">
        <el-form-item :label="$t('pages.documents.fields.documentId')" v-if="editMode">
          <el-input v-model="documentForm.id" disabled />
        </el-form-item>
        <el-form-item :label="$t('pages.documents.fields.jsonData')" required>
          <JsonEditor 
            v-model="documentForm.content"
            :rows="20"
            @validate="handleJsonValidation"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeDialog">{{ $t('actions.cancel') }}</el-button>
        <el-button type="primary" @click="saveDocument">{{ $t('actions.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import * as api from '../api/elasticsearch'
import JsonEditor from '../components/JsonEditor.vue'
import RefreshTimer from '../components/RefreshTimer.vue'
import storageManager from '../utils/storage'

const { t } = useI18n()
const indices = ref([])
const selectedIndex = ref('')
const documents = ref([])
const loading = ref(false)
const total = ref(0)
const showCreateDialog = ref(false)
const editMode = ref(false)

const pagination = ref({
  page: 1,
  size: 20
})

const documentForm = ref({
  id: '',
  content: ''
})

const getDocumentSummary = (source) => {
  const str = JSON.stringify(source)
  return str.length > 100 ? str.substring(0, 100) + '...' : str
}

const loadDocuments = async () => {
  if (!selectedIndex.value) {
    documents.value = []
    total.value = 0
    return
  }

  loading.value = true
  try {
    const from = (pagination.value.page - 1) * pagination.value.size
    const result = await api.getDocuments(selectedIndex.value, {
      size: pagination.value.size,
      from
    })
    
    documents.value = result.hits?.hits || []
    total.value = result.hits?.total?.value || 0
  } catch (error) {
    ElMessage.error(t('errors.loadDocumentsFailed') + ': ' + error.message)
  } finally {
    loading.value = false
  }
}

const handleSizeChange = () => {
  pagination.value.page = 1
  loadDocuments()
}

const editDocument = (row) => {
  editMode.value = true
  documentForm.value = {
    id: row._id,
    content: JSON.stringify(row._source, null, 2)
  }
  showCreateDialog.value = true
}

const deleteDocument = async (row) => {
  try {
    await ElMessageBox.confirm(
      t('confirmations.deleteDocument', { id: row._id }),
      t('confirmations.title'),
      {
        confirmButtonText: t('actions.confirm'),
        cancelButtonText: t('actions.cancel'),
        type: 'warning'
      }
    )
    
    await api.deleteDocument(selectedIndex.value, row._id)
    ElMessage.success(t('success.documentDeleted'))
    loadDocuments()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(t('errors.deleteDocumentFailed') + ': ' + error.message)
    }
  }
}

const saveDocument = async () => {
  try {
    const content = JSON.parse(documentForm.value.content)
    
    if (editMode.value) {
      await api.updateDocument(selectedIndex.value, documentForm.value.id, content)
      ElMessage.success(t('success.documentUpdated'))
    } else {
      await api.createDocument(selectedIndex.value, content)
      ElMessage.success(t('success.documentCreated'))
    }
    
    closeDialog()
    loadDocuments()
  } catch (error) {
    if (error instanceof SyntaxError) {
      ElMessage.error(t('validation.jsonFormatError'))
    } else {
      ElMessage.error(t('errors.saveDocumentFailed') + ': ' + error.message)
    }
  }
}

const closeDialog = () => {
  showCreateDialog.value = false
  editMode.value = false
  documentForm.value = { id: '', content: '' }
}

const handleJsonValidation = (result) => {
  if (result.valid) {
    console.log('JSON validation passed:', result.data)
  } else {
    console.error('JSON validation failed:', result.error)
  }
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
      selectedIndex.value = lastSelectedIndex
      await loadDocuments() // 自动加载文档
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
watch(() => selectedIndex.value, (newIndex) => {
  storageManager.setLastSelectedIndex(newIndex)
})

// 监听页面大小变化，保存到本地存储
watch(() => pagination.value.size, (newSize) => {
  storageManager.setLastPageSize(newSize)
})

onMounted(() => {
  loadIndices()
})
</script>

<style scoped>
.documents-container {
  padding: 20px;
}

.toolbar {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
}

.document-detail {
  padding: 10px 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.document-detail pre {
  margin: 0;
  font-family: monospace;
  font-size: 12px;
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
  align-items: center;
}
</style>