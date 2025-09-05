import { contextBridge, ipcRenderer } from 'electron'

// 暴露安全的 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 系统信息
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  
  // 日志
  log: (level, message) => ipcRenderer.send('log', { level, message }),
  
  // 应用状态
  getAppState: () => ipcRenderer.invoke('get-app-state'),
  
  // 监听主进程消息
  onMessage: (callback) => {
    ipcRenderer.on('message', (event, data) => callback(data))
  },
  
  // 获取环境信息
  getEnv: () => ipcRenderer.invoke('get-env'),
  
  // 打开开发者工具
  openDevTools: () => ipcRenderer.send('open-dev-tools'),
  
  // 重新加载
  reload: () => ipcRenderer.send('reload-app'),
  
  // 平台信息
  platform: process.platform,
  versions: process.versions
})