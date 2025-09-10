// GitHub仓库配置
export const GITHUB_CONFIG = {
  owner: 'Mr0bean',
  repo: 'es_lite_manager',
  baseUrl: 'https://github.com/Mr0bean/es_lite_manager',
  apiUrl: 'https://api.github.com'
}

// 获取GitHub仓库URL
export function getGitHubUrl() {
  return GITHUB_CONFIG.baseUrl
}

// 获取Issue创建URL
export function getNewIssueUrl(params = {}) {
  const url = new URL(`${GITHUB_CONFIG.baseUrl}/issues/new`)
  
  // 添加查询参数
  Object.keys(params).forEach(key => {
    if (params[key]) {
      url.searchParams.append(key, params[key])
    }
  })
  
  return url.toString()
}

// 获取Release页面URL
export function getReleasesUrl() {
  return `${GITHUB_CONFIG.baseUrl}/releases`
}

// 获取最新Release URL
export function getLatestReleaseUrl() {
  return `${GITHUB_CONFIG.baseUrl}/releases/latest`
}

// 在用户默认浏览器中打开URL
export function openInBrowser(url) {
  console.log('Attempting to open URL:', url)
  
  // 验证URL
  if (!url || typeof url !== 'string') {
    console.error('Invalid URL provided:', url)
    return
  }
  
  // 在Electron环境中使用IPC通信打开默认浏览器
  if (window.electron && typeof window.electron.openExternal === 'function') {
    console.log('Using Electron shell.openExternal')
    try {
      window.electron.openExternal(url)
      console.log('Successfully called electron.openExternal')
      return
    } catch (error) {
      console.error('Error with electron.openExternal:', error)
    }
  }
  
  // 备用方案：如果有electronAPI
  if (window.electronAPI && window.electronAPI.openExternal) {
    console.log('Using electronAPI.openExternal')
    try {
      window.electronAPI.openExternal(url)
      return
    } catch (error) {
      console.error('Error with electronAPI.openExternal:', error)
    }
  }
  
  // Web环境或Electron失败时的备用方案
  console.log('Falling back to window.open')
  try {
    const opened = window.open(url, '_blank', 'noopener,noreferrer')
    if (!opened) {
      console.error('window.open was blocked or failed')
    }
  } catch (error) {
    console.error('Error with window.open:', error)
  }
}

// 打开GitHub仓库主页
export function openGitHubRepo() {
  openInBrowser(getGitHubUrl())
}

// 打开Issue创建页面
export function openNewIssue(params) {
  openInBrowser(getNewIssueUrl(params))
}

// 打开Releases页面
export function openReleases() {
  openInBrowser(getReleasesUrl())
}