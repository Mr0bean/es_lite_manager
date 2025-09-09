import axios from 'axios'

// 获取后端API基础URL
const getApiUrl = () => {
  const port = localStorage.getItem('backendPort') || 9021
  return `http://localhost:${port}`
}

// 创建axios实例
const createApiClient = () => {
  return axios.create({
    baseURL: getApiUrl(),
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

// 检查应用更新
export async function checkForUpdates() {
  try {
    const api = createApiClient()
    const response = await api.get('/check-update')
    return response.data
  } catch (error) {
    console.error('Failed to check for updates:', error)
    throw {
      success: false,
      error: error.message || 'Failed to check for updates'
    }
  }
}

// 清除更新缓存
export async function clearUpdateCache() {
  try {
    const api = createApiClient()
    const response = await api.post('/clear-update-cache')
    return response.data
  } catch (error) {
    console.error('Failed to clear update cache:', error)
    throw {
      success: false,
      error: error.message || 'Failed to clear update cache'
    }
  }
}

// 格式化版本信息
export function formatVersionInfo(versionData) {
  if (!versionData || !versionData.success) {
    return null
  }

  const {
    currentVersion,
    latestVersion,
    updateAvailable,
    releaseInfo,
    fromCache,
    cacheAge
  } = versionData

  return {
    current: currentVersion,
    latest: latestVersion,
    hasUpdate: updateAvailable,
    releaseName: releaseInfo?.name || latestVersion,
    releaseDate: releaseInfo?.publishedAt ? new Date(releaseInfo.publishedAt).toLocaleDateString() : null,
    releaseNotes: releaseInfo?.releaseNotes || '',
    downloadUrl: releaseInfo?.downloadUrl || '',
    assets: releaseInfo?.assets || [],
    cached: fromCache || false,
    cacheAge: cacheAge || 0
  }
}

// 获取版本状态标签
export function getVersionStatus(versionData) {
  if (!versionData) {
    return { type: 'info', text: 'Unknown' }
  }

  if (versionData.updateAvailable) {
    return { type: 'warning', text: 'Update Available' }
  }

  if (versionData.isNewer) {
    return { type: 'success', text: 'Development Version' }
  }

  if (versionData.isSame) {
    return { type: 'success', text: 'Latest Version' }
  }

  return { type: 'info', text: 'Current Version' }
}

// 比较版本号
export function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number)
  const parts2 = v2.split('.').map(Number)
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0
    const part2 = parts2[i] || 0
    
    if (part1 > part2) return 1
    if (part1 < part2) return -1
  }
  
  return 0
}