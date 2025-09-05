// 环境配置管理
const env = import.meta.env

// 获取当前环境
export const ENV = env.VITE_ENV || 'development'

// 是否为开发环境
export const isDev = ENV === 'development'

// 是否为生产环境
export const isProd = ENV === 'production'

// 是否为测试环境
export const isStaging = ENV === 'staging'

// 是否在 Electron 环境中运行
export const isElectron = () => {
  // 检查 electronAPI
  if (typeof window !== 'undefined' && window.electronAPI) {
    return true
  }
  // 检查 user agent
  if (typeof navigator !== 'undefined' && navigator.userAgent.indexOf('Electron') >= 0) {
    return true
  }
  // 检查 process.versions.electron
  if (typeof process !== 'undefined' && process.versions && process.versions.electron) {
    return true
  }
  return false
}

// 获取保存的后端端口
const getSavedBackendPort = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const savedPort = localStorage.getItem('backendPort')
    if (savedPort) {
      return parseInt(savedPort)
    }
  }
  return parseInt(env.VITE_BACKEND_PORT) || 9021
}

// 应用配置
export const config = {
  // 应用标题
  appTitle: env.VITE_APP_TITLE || 'ES Manager',
  
  // API 配置
  api: {
    baseUrl: isElectron() 
      ? env.VITE_API_BASE_URL || `http://localhost:${getSavedBackendPort()}`
      : '/api',
    timeout: 10000
  },
  
  // 端口配置
  ports: {
    frontend: parseInt(env.VITE_FRONTEND_PORT) || 9020,
    backend: parseInt(env.VITE_BACKEND_PORT) || 9021
  },
  
  // Elasticsearch 默认配置
  elasticsearch: {
    host: env.VITE_ES_HOST || 'localhost',
    port: parseInt(env.VITE_ES_PORT) || 9200,
    protocol: env.VITE_ES_PROTOCOL || 'http',
    username: env.VITE_ES_USERNAME || '',
    password: env.VITE_ES_PASSWORD || ''
  },
  
  // 调试配置
  debug: {
    enableDevTools: env.VITE_ENABLE_DEVTOOLS === 'true',
    logLevel: env.VITE_LOG_LEVEL || 'info'
  }
}

// 日志级别
export const LogLevel = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error'
}

// 日志函数
export const log = (level, message, ...args) => {
  const levels = ['debug', 'info', 'warn', 'error']
  const currentLevelIndex = levels.indexOf(config.debug.logLevel)
  const messageLevelIndex = levels.indexOf(level)
  
  if (messageLevelIndex >= currentLevelIndex) {
    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [${level.toUpperCase()}] [${ENV}]`
    
    switch (level) {
      case 'debug':
        console.debug(prefix, message, ...args)
        break
      case 'info':
        console.info(prefix, message, ...args)
        break
      case 'warn':
        console.warn(prefix, message, ...args)
        break
      case 'error':
        console.error(prefix, message, ...args)
        break
      default:
        console.log(prefix, message, ...args)
    }
  }
}

// 导出默认配置
export default config