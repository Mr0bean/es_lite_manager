<template>
  <div class="connections-container">
    <div class="page-header">
      <h2>连接管理</h2>
      <el-button type="primary" @click="showAddDialog = true" :icon="Plus">
        添加连接
      </el-button>
    </div>

    <!-- 连接列表 -->
    <el-card class="connections-card">
      <template #header>
        <div class="card-header">
          <span>连接列表</span>
          <el-button text @click="refreshConnections" :icon="Refresh">刷新</el-button>
        </div>
      </template>

      <el-table :data="connections" v-loading="loading" stripe>
        <el-table-column label="连接名称" prop="name" min-width="150">
          <template #default="{ row }">
            <div class="connection-name">
              <el-icon v-if="row.isCurrent" class="current-icon" color="#67c23a">
                <CircleCheckFilled />
              </el-icon>
              {{ row.name }}
              <el-tag v-if="row.isCurrent" type="success" size="small">当前</el-tag>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="连接地址" min-width="200">
          <template #default="{ row }">
            {{ row.protocol }}://{{ row.host }}:{{ row.port }}
          </template>
        </el-table-column>
        
        <el-table-column label="用户名" prop="username" min-width="120" />
        
        <el-table-column label="状态" min-width="100">
          <template #default="{ row }">
            <el-button
              text
              :loading="testingConnections.has(row.id)"
              @click="testSingleConnection(row)"
            >
              <template v-if="connectionStatus[row.id] === true">
                <el-tag type="success" size="small">已连接</el-tag>
              </template>
              <template v-else-if="connectionStatus[row.id] === false">
                <el-tag type="danger" size="small">连接失败</el-tag>
              </template>
              <template v-else>
                <el-tag type="info" size="small">未测试</el-tag>
              </template>
            </el-button>
          </template>
        </el-table-column>
        
        <el-table-column label="创建时间" min-width="150">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button 
              v-if="!row.isCurrent" 
              type="primary" 
              size="small" 
              @click="switchToConnection(row.id)"
              :loading="switchingConnection === row.id"
            >
              切换
            </el-button>
            <el-button size="small" @click="editConnection(row)">
              编辑
            </el-button>
            <el-button 
              v-if="!row.isCurrent" 
              size="small" 
              type="danger" 
              @click="confirmDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 添加/编辑连接对话框 -->
    <el-dialog 
      :title="isEditing ? '编辑连接' : '添加连接'" 
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
        <el-form-item label="连接名称" prop="name">
          <el-input v-model="connectionForm.name" placeholder="请输入连接名称" />
        </el-form-item>
        
        <el-form-item label="协议" prop="protocol">
          <el-select v-model="connectionForm.protocol" style="width: 100%">
            <el-option label="HTTP" value="http" />
            <el-option label="HTTPS" value="https" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="主机地址" prop="host">
          <el-input v-model="connectionForm.host" placeholder="请输入主机地址" />
        </el-form-item>
        
        <el-form-item label="端口" prop="port">
          <el-input-number 
            v-model="connectionForm.port" 
            :min="1" 
            :max="65535" 
            style="width: 100%" 
          />
        </el-form-item>
        
        <el-form-item label="用户名" prop="username">
          <el-input v-model="connectionForm.username" placeholder="请输入用户名（可选）" />
        </el-form-item>
        
        <el-form-item label="密码" prop="password">
          <el-input 
            type="password" 
            v-model="connectionForm.password" 
            placeholder="请输入密码（可选）"
            show-password
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancelEdit">取消</el-button>
          <el-button type="info" @click="testCurrentConnection" :loading="testingForm">
            测试连接
          </el-button>
          <el-button 
            type="primary" 
            @click="saveConnection" 
            :loading="saving"
          >
            {{ isEditing ? '更新' : '添加' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
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

// 响应式数据
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

// 表单数据
const connectionForm = reactive({
  name: '',
  protocol: 'http',
  host: '',
  port: 9200,
  username: '',
  password: ''
})

// 表单验证规则
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

// 格式化时间
const formatTime = (time) => {
  if (!time) return 'N/A'
  return new Date(time).toLocaleString('zh-CN')
}

// 获取连接列表
const refreshConnections = async () => {
  loading.value = true
  try {
    connections.value = await getConnections()
  } catch (error) {
    ElMessage.error('获取连接列表失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

// 测试单个连接
const testSingleConnection = async (connection) => {
  testingConnections.value.add(connection.id)
  try {
    const result = await testConnection(connection)
    connectionStatus.value[connection.id] = result.success
    
    if (result.success) {
      ElMessage.success(`连接 ${connection.name} 测试成功`)
    } else {
      ElMessage.error(`连接 ${connection.name} 测试失败: ${result.error}`)
    }
  } catch (error) {
    connectionStatus.value[connection.id] = false
    ElMessage.error(`连接 ${connection.name} 测试失败: ${error.message}`)
  } finally {
    testingConnections.value.delete(connection.id)
  }
}

// 切换连接
const switchToConnection = async (connectionId) => {
  switchingConnection.value = connectionId
  try {
    await switchConnection(connectionId)
    ElMessage.success('连接切换成功')
    await refreshConnections()
    
    // 通知父组件刷新连接状态
    window.dispatchEvent(new CustomEvent('connectionChanged'))
  } catch (error) {
    ElMessage.error('连接切换失败: ' + error.message)
  } finally {
    switchingConnection.value = null
  }
}

// 编辑连接
const editConnection = async (connection) => {
  try {
    // 获取连接详情（包含密码）
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
    ElMessage.error('获取连接详情失败: ' + error.message)
  }
}

// 测试当前表单连接
const testCurrentConnection = async () => {
  testingForm.value = true
  try {
    const result = await testConnection(connectionForm)
    if (result.success) {
      ElMessage.success('连接测试成功！')
    } else {
      ElMessage.error('连接测试失败: ' + result.error)
    }
  } catch (error) {
    ElMessage.error('连接测试失败: ' + error.message)
  } finally {
    testingForm.value = false
  }
}

// 保存连接
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
      ElMessage.success('连接更新成功')
    } else {
      await addConnection(connectionForm)
      ElMessage.success('连接添加成功')
    }
    
    showAddDialog.value = false
    await refreshConnections()
  } catch (error) {
    ElMessage.error((isEditing.value ? '更新' : '添加') + '连接失败: ' + error.message)
  } finally {
    saving.value = false
  }
}

// 取消编辑
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

// 确认删除
const confirmDelete = async (connection) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除连接 "${connection.name}" 吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    await deleteConnection(connection.id)
    ElMessage.success('连接删除成功')
    await refreshConnections()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除连接失败: ' + error.message)
    }
  }
}


// 组件挂载时获取连接列表
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