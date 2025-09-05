import axios from 'axios'
import { config, log, LogLevel, isElectron } from '../config/env'

// 动态获取API基础URL
const getApiBaseUrl = () => {
  if (isElectron()) {
    const savedPort = localStorage.getItem('backendPort')
    const port = savedPort ? parseInt(savedPort) : config.ports.backend
    return `http://localhost:${port}`
  }
  return '/api'
}

// 创建 axios 实例
const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: config.api.timeout
})

// 更新API基础URL的方法
export const updateApiBaseUrl = () => {
  api.defaults.baseURL = getApiBaseUrl()
  log(LogLevel.INFO, 'API Base URL updated to:', api.defaults.baseURL)
}

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    log(LogLevel.DEBUG, 'API Request:', config.method?.toUpperCase(), config.url)
    return config
  },
  (error) => {
    log(LogLevel.ERROR, 'API Request Error:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    log(LogLevel.DEBUG, 'API Response:', response.status, response.config.url)
    return response
  },
  (error) => {
    log(LogLevel.ERROR, 'API Response Error:', error.response?.status, error.config?.url, error.message)
    return Promise.reject(error)
  }
)

// 连接管理API
export const getConnections = () => api.get('/connections').then(res => res.data)

export const addConnection = (connectionData) => 
  api.post('/connections', connectionData).then(res => res.data)

export const updateConnection = (id, connectionData) => 
  api.put(`/connections/${id}`, connectionData).then(res => res.data)

export const deleteConnection = (id) => 
  api.delete(`/connections/${id}`).then(res => res.data)

export const switchConnection = (id) => 
  api.post(`/connections/${id}/switch`).then(res => res.data)

export const getCurrentConnection = () => 
  api.get('/connections/current').then(res => res.data)

export const getConnectionDetails = (id) => 
  api.get(`/connections/${id}/details`).then(res => res.data)

export const testConnection = (connectionData) => 
  api.post('/connections/test', connectionData).then(res => res.data)

// 原有API - 支持连接ID参数
export const checkConnection = (connectionId = null) => {
  const params = connectionId ? { connectionId } : {}
  return api.get('/health', { params }).then(res => res.data)
}

export const getIndices = (connectionId = null) => {
  const params = connectionId ? { connectionId } : {}
  return api.get('/indices', { params }).then(res => res.data)
}

export const createIndex = (indexName, settings = {}, connectionId = null) => {
  const params = connectionId ? { connectionId } : {}
  return api.post(`/indices/${encodeURIComponent(indexName)}`, settings, { params }).then(res => res.data)
}

export const deleteIndex = (indexName, connectionId = null) => {
  const params = connectionId ? { connectionId } : {}
  return api.delete(`/indices/${encodeURIComponent(indexName)}`, { params }).then(res => res.data)
}

export const searchDocuments = (params) => 
  api.post('/search', params).then(res => res.data)

export const getDocuments = (index, params = {}) => 
  api.get(`/documents/${encodeURIComponent(index)}`, { params }).then(res => res.data)

export const createDocument = (index, document, connectionId = null) => {
  const params = connectionId ? { connectionId } : {}
  return api.post(`/documents/${encodeURIComponent(index)}`, document, { params }).then(res => res.data)
}

export const updateDocument = (index, id, document, connectionId = null) => {
  const params = connectionId ? { connectionId } : {}
  return api.put(`/documents/${encodeURIComponent(index)}/${encodeURIComponent(id)}`, document, { params }).then(res => res.data)
}

export const deleteDocument = (index, id, connectionId = null) => {
  const params = connectionId ? { connectionId } : {}
  return api.delete(`/documents/${encodeURIComponent(index)}/${encodeURIComponent(id)}`, { params }).then(res => res.data)
}

export const getIndexStats = (index, connectionId = null) => {
  const params = connectionId ? { connectionId } : {}
  return api.get(`/stats/${encodeURIComponent(index)}`, { params }).then(res => res.data)
}

export const getPolicies = (connectionId = null) => {
  const params = connectionId ? { connectionId } : {}
  return api.get('/policies', { params }).then(res => res.data)
}

export const getIndexPolicy = (index, connectionId = null) => {
  const params = connectionId ? { connectionId } : {}
  return api.get(`/indices/${encodeURIComponent(index)}/policy`, { params }).then(res => res.data)
}

// 分词器相关API
export const getIndexAnalyzers = (index, connectionId = null) => {
  const params = connectionId ? { connectionId } : {}
  return api.get(`/indices/${encodeURIComponent(index)}/analyzers`, { params }).then(res => res.data)
}

export const analyzeText = (params) => 
  api.post('/analyze', params).then(res => res.data)

export const getBuiltinAnalyzers = () => 
  api.get('/analyzers/builtin').then(res => res.data)

// Mapping相关API
export const getIndexMapping = (index, connectionId = null) => {
  const params = connectionId ? { connectionId } : {}
  return api.get(`/indices/${encodeURIComponent(index)}/mapping`, { params }).then(res => res.data)
}

export const updateIndexMapping = (index, mapping, connectionId = null) => {
  const params = connectionId ? { connectionId } : {}
  return api.put(`/indices/${encodeURIComponent(index)}/mapping`, mapping, { params }).then(res => res.data)
}

// 插件管理API
export const getPlugins = (connectionId = null) => {
  const params = connectionId ? { connectionId } : {}
  return api.get('/plugins', { params }).then(res => res.data)
}

export const getNodesStats = (connectionId = null) => {
  const params = connectionId ? { connectionId } : {}
  return api.get('/nodes/stats', { params }).then(res => res.data)
}