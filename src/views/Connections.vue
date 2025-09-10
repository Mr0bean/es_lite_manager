<template>
  <div class="connections-container">
    <div class="page-header">
      <h2>{{ $t('pages.connections.title') }}</h2>
      <el-button type="primary" @click="showAddDialog = true" :icon="Plus">
        {{ $t('pages.connections.addConnection') }}
      </el-button>
    </div>

    <!-- Connection List -->
    <el-card class="connections-card">
      <template #header>
        <div class="card-header">
          <span>{{ $t('pages.connections.connectionList') }}</span>
          <el-button text @click="refreshConnections" :icon="Refresh">{{ $t('actions.refresh') }}</el-button>
        </div>
      </template>

      <el-table :data="connections" v-loading="loading" stripe>
        <el-table-column :label="$t('pages.connections.fields.name')" prop="name" min-width="150">
          <template #default="{ row }">
            <div class="connection-name">
              <el-icon v-if="row.isCurrent" class="current-icon" color="#67c23a">
                <CircleCheckFilled />
              </el-icon>
              {{ row.name }}
              <el-tag v-if="row.isCurrent" type="success" size="small">{{ $t('pages.connections.current') }}</el-tag>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column :label="$t('pages.connections.fields.address')" min-width="200">
          <template #default="{ row }">
            {{ row.protocol }}://{{ row.host }}:{{ row.port }}
          </template>
        </el-table-column>
        
        <el-table-column :label="$t('pages.connections.fields.username')" prop="username" min-width="120" />
        
        <el-table-column :label="$t('pages.connections.fields.status')" min-width="100">
          <template #default="{ row }">
            <el-button
              text
              :loading="testingConnections.has(row.id)"
              @click="testSingleConnection(row)"
            >
              <template v-if="connectionStatus[row.id] === true">
                <el-tag type="success" size="small">{{ $t('pages.connections.connected') }}</el-tag>
              </template>
              <template v-else-if="connectionStatus[row.id] === false">
                <el-tag type="danger" size="small">{{ $t('pages.connections.disconnected') }}</el-tag>
              </template>
              <template v-else>
                <el-tag type="info" size="small">{{ $t('pages.connections.untested') }}</el-tag>
              </template>
            </el-button>
          </template>
        </el-table-column>
        
        <el-table-column :label="$t('pages.connections.fields.createdAt')" min-width="150">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        
        <el-table-column :label="$t('pages.connections.fields.actions')" width="200" fixed="right">
          <template #default="{ row }">
            <el-button 
              v-if="!row.isCurrent" 
              type="primary" 
              size="small" 
              @click="switchToConnection(row.id)"
              :loading="switchingConnection === row.id"
            >
              {{ $t('pages.connections.switchTo') }}
            </el-button>
            <el-button size="small" @click="editConnection(row)">
              {{ $t('actions.edit') }}
            </el-button>
            <el-button 
              v-if="!row.isCurrent" 
              size="small" 
              type="danger" 
              @click="confirmDelete(row)"
            >
              {{ $t('actions.delete') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Add/Edit Connection Dialog -->
    <el-dialog 
      :title="isEditing ? $t('pages.connections.editConnection') : $t('pages.connections.addConnection')" 
      v-model="showAddDialog"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form 
        ref="connectionFormRef" 
        :model="connectionForm" 
        :rules="connectionRules" 
        label-width="100px"
      >
        <el-form-item :label="$t('pages.connections.fields.name')" prop="name">
          <el-input v-model="connectionForm.name" :placeholder="$t('pages.connections.placeholders.name')" />
        </el-form-item>
        
        <el-form-item :label="$t('pages.connections.fields.protocol')" prop="protocol">
          <el-select v-model="connectionForm.protocol" style="width: 100%">
            <el-option label="HTTP" value="http" />
            <el-option label="HTTPS" value="https" />
          </el-select>
        </el-form-item>
        
        <el-form-item :label="$t('pages.connections.fields.host')" prop="host">
          <el-input v-model="connectionForm.host" :placeholder="$t('pages.connections.placeholders.host')" />
        </el-form-item>
        
        <el-form-item :label="$t('pages.connections.fields.port')" prop="port">
          <el-input-number 
            v-model="connectionForm.port" 
            :min="1" 
            :max="65535" 
            style="width: 100%" 
          />
        </el-form-item>
        
        <el-form-item :label="$t('pages.connections.fields.username')" prop="username">
          <el-input v-model="connectionForm.username" :placeholder="$t('pages.connections.placeholders.username')" />
        </el-form-item>
        
        <el-form-item :label="$t('pages.connections.fields.password')" prop="password">
          <el-input 
            type="password" 
            v-model="connectionForm.password" 
            :placeholder="$t('pages.connections.placeholders.password')"
            show-password
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancelEdit">{{ $t('actions.cancel') }}</el-button>
          <el-button type="info" @click="testCurrentConnection" :loading="testingForm">
            {{ $t('pages.connections.testConnection') }}
          </el-button>
          <el-button 
            type="primary" 
            @click="saveConnection" 
            :loading="saving"
          >
            {{ isEditing ? $t('actions.update') : $t('actions.add') }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, CircleCheckFilled } from '@element-plus/icons-vue'
import { 
  getConnections, 
  addConnection, 
  updateConnection, 
  deleteConnection,
  switchConnection,
  testConnection,
  getConnectionDetails
} from '../api/elasticsearch'

const { t } = useI18n()

// Reactive Data
const connections = ref([])
const loading = ref(false)
const showAddDialog = ref(false)
const isEditing = ref(false)
const editingId = ref(null)
const saving = ref(false)
const testingForm = ref(false)
const testingConnections = ref(new Set())
const connectionStatus = ref({})
const switchingConnection = ref(null)

// Form Data
const connectionForm = reactive({
  name: '',
  protocol: 'http',
  host: '',
  port: 9200,
  username: '',
  password: ''
})

// Form Validation Rules
const connectionRules = {
  name: [
    { required: true, message: '请输入连接名称', trigger: 'blur' },
    { min: 2, max: 50, message: '连接名称长度应在2-50个字符', trigger: 'blur' }
  ],
  host: [
    { required: true, message: '请输入主机地址', trigger: 'blur' },
    { 
      pattern: /^(\d{1,3}\.){3}\d{1,3}$|^[a-zA-Z0-9.-]+$/,
      message: '请输入有效的IP地址或主机名', 
      trigger: 'blur' 
    }
  ],
  port: [
    { required: true, message: '请输入端口号', trigger: 'blur' },
    { type: 'number', min: 1, max: 65535, message: '端口号应在1-65535之间', trigger: 'blur' }
  ]
}

const connectionFormRef = ref(null)

// Format Time
const formatTime = (time) => {
  if (!time) return 'N/A'
  return new Date(time).toLocaleString('zh-CN')
}

// Get Connection List
const refreshConnections = async () => {
  loading.value = true
  try {
    connections.value = await getConnections()
  } catch (error) {
    ElMessage.error(t('pages.connections.messages.getListFailed') + ': ' + error.message)
  } finally {
    loading.value = false
  }
}

// Test Single Connection
const testSingleConnection = async (connection) => {
  testingConnections.value.add(connection.id)
  try {
    const result = await testConnection(connection)
    connectionStatus.value[connection.id] = result.success
    
    if (result.success) {
      ElMessage.success(t('pages.connections.messages.testSuccess', { name: connection.name }))
    } else {
      ElMessage.error(t('pages.connections.messages.testFailed', { name: connection.name, error: result.error }))
    }
  } catch (error) {
    connectionStatus.value[connection.id] = false
    ElMessage.error(t('pages.connections.messages.testFailed', { name: connection.name, error: error.message }))
  } finally {
    testingConnections.value.delete(connection.id)
  }
}

// Switch Connection
const switchToConnection = async (connectionId) => {
  switchingConnection.value = connectionId
  try {
    await switchConnection(connectionId)
    ElMessage.success(t('pages.connections.messages.switchSuccess'))
    await refreshConnections()
    
    // Notify parent component to refresh connection status
    window.dispatchEvent(new CustomEvent('connectionChanged'))
  } catch (error) {
    ElMessage.error(t('pages.connections.messages.switchFailed') + ': ' + error.message)
  } finally {
    switchingConnection.value = null
  }
}

// Edit Connection
const editConnection = async (connection) => {
  try {
    // Get connection details (including password)
    const details = await getConnectionDetails(connection.id)
    
    isEditing.value = true
    editingId.value = connection.id
    Object.assign(connectionForm, {
      name: details.name,
      protocol: details.protocol,
      host: details.host,
      port: details.port,
      username: details.username || '',
      password: details.password || ''
    })
    showAddDialog.value = true
  } catch (error) {
    ElMessage.error(t('pages.connections.messages.getDetailsFailed') + ': ' + error.message)
  }
}

// Test Current Form Connection
const testCurrentConnection = async () => {
  testingForm.value = true
  try {
    const result = await testConnection(connectionForm)
    if (result.success) {
      ElMessage.success(t('pages.connections.messages.testFormSuccess'))
    } else {
      ElMessage.error(t('pages.connections.messages.testFormFailed') + ': ' + result.error)
    }
  } catch (error) {
    ElMessage.error(t('pages.connections.messages.testFormFailed') + ': ' + error.message)
  } finally {
    testingForm.value = false
  }
}

// Save Connection
const saveConnection = async () => {
  if (!connectionFormRef.value) return
  
  try {
    await connectionFormRef.value.validate()
  } catch {
    return
  }

  saving.value = true
  try {
    if (isEditing.value) {
      await updateConnection(editingId.value, connectionForm)
      ElMessage.success(t('pages.connections.messages.updateSuccess'))
    } else {
      await addConnection(connectionForm)
      ElMessage.success(t('pages.connections.messages.addSuccess'))
    }
    
    showAddDialog.value = false
    await refreshConnections()
  } catch (error) {
    ElMessage.error((isEditing.value ? t('pages.connections.messages.updateFailed') : t('pages.connections.messages.addFailed')) + ': ' + error.message)
  } finally {
    saving.value = false
  }
}

// Cancel Edit
const cancelEdit = () => {
  showAddDialog.value = false
  isEditing.value = false
  editingId.value = null
  Object.assign(connectionForm, {
    name: '',
    protocol: 'http',
    host: '',
    port: 9200,
    username: '',
    password: ''
  })
  
  if (connectionFormRef.value) {
    connectionFormRef.value.resetFields()
  }
}

// Confirm Delete
const confirmDelete = async (connection) => {
  try {
    await ElMessageBox.confirm(
      t('pages.connections.messages.deleteConfirm', { name: connection.name }),
      t('pages.connections.deleteTitle'),
      {
        confirmButtonText: t('actions.delete'),
        cancelButtonText: t('actions.cancel'),
        type: 'warning',
      }
    )
    
    await deleteConnection(connection.id)
    ElMessage.success(t('pages.connections.messages.deleteSuccess'))
    await refreshConnections()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(t('pages.connections.messages.deleteFailed') + ': ' + error.message)
    }
  }
}


// Get connection list on mount
onMounted(() => {
  refreshConnections()
})
</script>

<style scoped>
.connections-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.connections-card {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.connection-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.current-icon {
  font-size: 16px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

:deep(.el-table .el-table__cell) {
  padding: 12px 0;
}

:deep(.el-form-item) {
  margin-bottom: 18px;
}

:deep(.el-dialog__body) {
  padding: 20px 20px 10px 20px;
}
</style>