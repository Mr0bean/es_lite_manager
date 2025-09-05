// 设置管理模块
// 用于管理应用的全局设置

// 默认设置
export const defaultSettings = {
  appTitle: 'ES Manager',
  backendPort: 9021,
  frontendPort: 9020,
  apiTimeout: 10000,
  enableDevTools: false,
  logLevel: 'info'
}

// 获取设置
export const getSettings = () => {
  if (typeof window === 'undefined') {
    return defaultSettings
  }
  
  const savedSettings = localStorage.getItem('appSettings')
  if (savedSettings) {
    try {
      return { ...defaultSettings, ...JSON.parse(savedSettings) }
    } catch (e) {
      console.error('Failed to parse saved settings:', e)
    }
  }
  return defaultSettings
}

// 保存设置
export const saveSettings = (settings) => {
  if (typeof window === 'undefined') {
    return
  }
  
  localStorage.setItem('appSettings', JSON.stringify(settings))
  // 单独保存后端端口以便快速访问
  if (settings.backendPort) {
    localStorage.setItem('backendPort', settings.backendPort.toString())
  }
}

// 获取后端端口
export const getBackendPort = () => {
  if (typeof window === 'undefined') {
    return defaultSettings.backendPort
  }
  
  const savedPort = localStorage.getItem('backendPort')
  if (savedPort) {
    return parseInt(savedPort)
  }
  
  const settings = getSettings()
  return settings.backendPort || defaultSettings.backendPort
}

// 获取API基础URL
export const getApiBaseUrl = (isElectronEnv = false) => {
  if (isElectronEnv) {
    const port = getBackendPort()
    return `http://localhost:${port}`
  }
  return '/api'
}

// 监听设置变化
export const onSettingsChange = (callback) => {
  if (typeof window === 'undefined') {
    return () => {}
  }
  
  const handleStorageChange = (e) => {
    if (e.key === 'appSettings' || e.key === 'backendPort') {
      callback(getSettings())
    }
  }
  
  window.addEventListener('storage', handleStorageChange)
  
  // 返回清理函数
  return () => {
    window.removeEventListener('storage', handleStorageChange)
  }
}

export default {
  defaultSettings,
  getSettings,
  saveSettings,
  getBackendPort,
  getApiBaseUrl,
  onSettingsChange
}