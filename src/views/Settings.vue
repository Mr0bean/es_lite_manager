<template>
  <div class="settings-page">
    <el-card class="settings-card">
      <template #header>
        <div class="card-header">
          <span class="title">
            <el-icon><Setting /></el-icon>
            {{ $t('pages.settings.title') }}
          </span>
        </div>
      </template>

      <el-tabs v-model="activeTab" class="settings-tabs">
        <!-- 基本设置 -->
        <el-tab-pane :label="$t('pages.settings.tabs.basic')" name="basic">
          <el-form :model="settings" label-width="120px" class="settings-form">
            <el-divider content-position="left">{{ $t('pages.settings.sections.appConfig') }}</el-divider>
            
            <el-form-item :label="$t('pages.settings.fields.appTitle')">
              <el-input v-model="settings.appTitle" placeholder="ES Manager" />
            </el-form-item>

            <el-divider content-position="left">{{ $t('pages.settings.sections.portConfig') }}</el-divider>
            
            <el-form-item :label="$t('pages.settings.fields.backendPort')">
              <el-input-number 
                v-model="settings.backendPort" 
                :min="1" 
                :max="65535"
                placeholder="9021"
              />
              <el-text type="info" class="port-hint">
                {{ $t('pages.settings.hints.defaultBackendPort') }}
              </el-text>
            </el-form-item>

            <el-form-item :label="$t('pages.settings.fields.frontendPort')">
              <el-input-number 
                v-model="settings.frontendPort" 
                :min="1" 
                :max="65535"
                placeholder="9020"
                disabled
              />
              <el-text type="info" class="port-hint">
                {{ $t('pages.settings.hints.defaultFrontendPort') }}
              </el-text>
            </el-form-item>

            <el-divider content-position="left">{{ $t('pages.settings.sections.apiConfig') }}</el-divider>
            
            <el-form-item :label="$t('pages.settings.fields.apiTimeout')">
              <el-input-number 
                v-model="settings.apiTimeout" 
                :min="1000" 
                :max="60000"
                :step="1000"
                placeholder="10000"
              />
              <el-text type="info" class="port-hint">
                {{ $t('pages.settings.hints.timeoutUnit') }}
              </el-text>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 高级设置 -->
        <el-tab-pane :label="$t('pages.settings.tabs.advanced')" name="advanced">
          <el-form :model="settings" label-width="120px" class="settings-form">
            <el-divider content-position="left">{{ $t('pages.settings.sections.debugOptions') }}</el-divider>
            
            <el-form-item :label="$t('pages.settings.fields.enableDevTools')">
              <el-switch v-model="settings.enableDevTools" />
            </el-form-item>

            <el-form-item :label="$t('pages.settings.fields.logLevel')">
              <el-select v-model="settings.logLevel" :placeholder="$t('placeholders.selectLogLevel')">
                <el-option label="Debug" value="debug" />
                <el-option label="Info" value="info" />
                <el-option label="Warn" value="warn" />
                <el-option label="Error" value="error" />
              </el-select>
            </el-form-item>

            <el-divider content-position="left">{{ $t('pages.settings.sections.cacheSettings') }}</el-divider>
            
            <el-form-item :label="$t('pages.settings.fields.clearCache')">
              <el-button type="warning" @click="clearCache">
                <el-icon><Delete /></el-icon>
                {{ $t('pages.settings.fields.clearAllCache') }}
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 关于 -->
        <el-tab-pane :label="$t('pages.settings.tabs.about')" name="about">
          <div class="about-content">
            <div class="logo-section">
              <el-icon :size="80" color="#409EFF"><Platform /></el-icon>
              <h2>ES Manager</h2>
              <p class="version">{{ $t('pages.settings.about.version') }}</p>
            </div>
            
            <el-descriptions :column="1" border class="info-table">
              <el-descriptions-item :label="$t('pages.settings.about.appName')">
                {{ $t('app.title') }}
              </el-descriptions-item>
              <el-descriptions-item :label="$t('pages.settings.about.currentEnv')">
                {{ currentEnv }}
              </el-descriptions-item>
              <el-descriptions-item :label="$t('pages.settings.about.runMode')">
                {{ isElectronApp ? $t('pages.settings.about.electronApp') : $t('pages.settings.about.webApp') }}
              </el-descriptions-item>
              <el-descriptions-item :label="$t('pages.settings.about.backendUrl')">
                {{ currentBackendUrl }}
              </el-descriptions-item>
              <el-descriptions-item :label="$t('pages.settings.fields.frontendPort')">
                {{ settings.frontendPort }}
              </el-descriptions-item>
              <el-descriptions-item :label="$t('pages.settings.fields.backendPort')">
                {{ settings.backendPort }}
              </el-descriptions-item>
            </el-descriptions>

            <div class="links-section">
              <el-button text type="primary" @click="openGithub">
                <el-icon><Link /></el-icon>
                GitHub
              </el-button>
              <el-button text type="primary" @click="checkUpdate">
                <el-icon><Download /></el-icon>
                {{ $t('pages.settings.about.checkUpdate') }}
              </el-button>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>

      <div class="settings-footer">
        <el-button @click="resetSettings">{{ $t('pages.settings.about.resetDefault') }}</el-button>
        <el-button type="primary" @click="saveSettings">
          <el-icon><Check /></el-icon>
          {{ $t('pages.settings.about.saveSettings') }}
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { Setting, Delete, Platform, Link, Download, Check } from '@element-plus/icons-vue'
import { config, ENV, isElectron } from '../config/env'
import { getSettings, saveSettings as saveSettingsToStorage, defaultSettings } from '../config/settings'
import { updateApiBaseUrl } from '../api/elasticsearch'

const { t } = useI18n()
const activeTab = ref('basic')

// 设置数据
const settings = reactive({
  appTitle: '',
  backendPort: 9021,
  frontendPort: 9020,
  apiTimeout: 10000,
  enableDevTools: false,
  logLevel: 'info'
})

// 计算属性
const currentEnv = computed(() => ENV)
const isElectronApp = computed(() => isElectron())
const currentBackendUrl = computed(() => {
  const port = localStorage.getItem('backendPort') || settings.backendPort
  return `http://localhost:${port}`
})

// 加载设置
const loadSettings = () => {
  const savedSettings = getSettings()
  Object.assign(settings, savedSettings)
}

// 保存设置
const saveSettings = async () => {
  try {
    // 保存到存储
    saveSettingsToStorage(settings)
    
    // 更新配置
    config.appTitle = settings.appTitle
    config.ports.backend = settings.backendPort
    config.api.timeout = settings.apiTimeout
    config.debug.enableDevTools = settings.enableDevTools
    config.debug.logLevel = settings.logLevel

    // 更新API基础URL
    updateApiBaseUrl()

    ElMessage.success(t('success.settingsSaved'))

    // 提示用户刷新页面
    const result = await ElMessageBox.confirm(
      'Some settings require a page refresh to take effect. Refresh now?',
      'Notice',
      {
        confirmButtonText: 'Refresh Now',
        cancelButtonText: 'Manual Refresh Later',
        type: 'info'
      }
    ).catch(() => false)

    if (result) {
      window.location.reload()
    }
  } catch (error) {
    ElMessage.error(t('errors.saveSettingsFailed') + ': ' + error.message)
  }
}

// 重置设置
const resetSettings = async () => {
  try {
    await ElMessageBox.confirm(
      'Are you sure you want to reset all settings to default values?',
      'Confirm Reset',
      {
        confirmButtonText: t('actions.confirm'),
        cancelButtonText: t('actions.cancel'),
        type: 'warning'
      }
    )

    // 清除localStorage
    localStorage.removeItem('appSettings')
    localStorage.removeItem('backendPort')

    // 重新加载默认设置
    Object.assign(settings, defaultSettings)

    ElMessage.success(t('success.settingsReset'))
  } catch {
    // 用户取消
  }
}

// 清除缓存
const clearCache = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清除所有缓存数据吗？这将清除所有本地存储的数据。',
      '确认清除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    // 保存设置相关的数据
    const savedSettings = localStorage.getItem('appSettings')
    const savedPort = localStorage.getItem('backendPort')

    // 清除所有localStorage
    localStorage.clear()

    // 恢复设置数据
    if (savedSettings) {
      localStorage.setItem('appSettings', savedSettings)
    }
    if (savedPort) {
      localStorage.setItem('backendPort', savedPort)
    }

    ElMessage.success(t('success.cacheCleared'))
  } catch {
    // 用户取消
  }
}

// 打开GitHub
const openGithub = () => {
  window.open('https://github.com/your-repo/es-manager', '_blank')
}

// 检查更新
const checkUpdate = () => {
  ElMessage.info(t('info.currentLatestVersion'))
}

onMounted(() => {
  loadSettings()
})
</script>

<style scoped>
.settings-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.settings-card {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.card-header .title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
}

.settings-tabs {
  min-height: 400px;
}

.settings-form {
  padding: 20px;
  max-width: 800px;
}

.port-hint {
  display: block;
  margin-top: 5px;
  font-size: 12px;
  color: #909399;
}

.settings-footer {
  padding: 20px;
  text-align: right;
  border-top: 1px solid #ebeef5;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.about-content {
  padding: 30px;
  text-align: center;
}

.logo-section {
  margin-bottom: 40px;
}

.logo-section h2 {
  margin: 15px 0 10px;
  font-size: 28px;
  color: #303133;
}

.logo-section .version {
  color: #909399;
  font-size: 14px;
}

.info-table {
  max-width: 600px;
  margin: 0 auto 30px;
}

.links-section {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 30px;
}

:deep(.el-divider__text) {
  background-color: #fff;
  font-weight: 600;
}

:deep(.el-input-number) {
  width: 200px;
}

:deep(.el-select) {
  width: 200px;
}
</style>