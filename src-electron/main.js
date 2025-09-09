import { app, BrowserWindow, Menu, ipcMain, dialog } from 'electron'
import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// HTTP 请求辅助函数
async function checkServerHealth(url) {
  try {
    const http = await import('http')
    return new Promise((resolve) => {
      const request = http.get(url + '/health', (res) => {
        resolve(res.statusCode === 200)
      })
      request.on('error', () => resolve(false))
      request.setTimeout(1000, () => {
        request.destroy()
        resolve(false)
      })
    })
  } catch {
    return false
  }
}

// 等待服务器启动
async function waitForServer(url, maxAttempts = 30, interval = 1000) {
  log('INFO', `Waiting for server at ${url}...`)
  for (let i = 0; i < maxAttempts; i++) {
    const isHealthy = await checkServerHealth(url)
    if (isHealthy) {
      log('INFO', `Server is ready after ${i + 1} attempts`)
      return true
    }
    log('DEBUG', `Server not ready yet, attempt ${i + 1}/${maxAttempts}`)
    await new Promise(resolve => setTimeout(resolve, interval))
  }
  throw new Error(`Server failed to start after ${maxAttempts} attempts`)
}

// 全局变量
let mainWindow = null
let serverProcess = null
let appState = {
  serverStarted: false,
  serverPort: 9021,
  frontendReady: false,
  errors: [],
  logs: []
}

// 环境检测
const environment = process.env.NODE_ENV || 'production'
const isDev = environment === 'development' || !app.isPackaged
const isStaging = environment === 'staging'
const isProd = environment === 'production' && app.isPackaged

// 日志函数
function log(level, message, details = null) {
  const timestamp = new Date().toISOString()
  const logEntry = { timestamp, level, message, details }
  
  appState.logs.push(logEntry)
  console.log(`[${timestamp}] [${level}] ${message}`, details || '')
  
  // 发送日志到渲染进程
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('message', { type: 'log', data: logEntry })
  }
}

// 错误处理
function handleError(error, context) {
  const errorInfo = {
    context,
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  }
  
  appState.errors.push(errorInfo)
  log('ERROR', `Error in ${context}`, errorInfo)
  
  // 在生产环境显示错误对话框
  if (!isDev && mainWindow) {
    dialog.showErrorBox('应用错误', `${context}: ${error.message}`)
  }
}

// 创建加载窗口
function createLoadingWindow() {
  const loadingWindow = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  })
  
  const loadingHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
        }
        .loading-container {
          text-align: center;
          color: white;
        }
        .spinner {
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top: 3px solid white;
          width: 50px;
          height: 50px;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        h2 { margin: 10px 0; }
        p { margin: 5px 0; opacity: 0.9; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="loading-container">
        <div class="spinner"></div>
        <h2>ES Manager${isDev ? ' (Dev)' : isStaging ? ' (Staging)' : ''}</h2>
        <p id="status">正在启动后端服务...</p>
        <p style="margin-top: 20px; font-size: 12px; opacity: 0.7;">请稍候，首次启动可能需要几秒钟</p>
      </div>
    </body>
    </html>
  `
  
  loadingWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(loadingHTML)}`)
  
  return loadingWindow
}

// 创建主窗口
async function createMainWindow() {
  log('INFO', 'Creating main window...')
  
  // 显示加载窗口
  const loadingWindow = createLoadingWindow()
  
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: !isDev
    },
    titleBarStyle: 'default',
    title: `ES Manager${isDev ? ' (Dev)' : isStaging ? ' (Staging)' : ''}`
  })
  
  // 设置窗口事件
  mainWindow.once('ready-to-show', () => {
    log('INFO', 'Main window ready to show')
    loadingWindow.close()
    mainWindow.show()
    
    // 开发模式自动打开开发者工具
    if (isDev) {
      mainWindow.webContents.openDevTools()
    }
  })
  
  mainWindow.on('closed', () => {
    log('INFO', 'Main window closed')
    mainWindow = null
  })
  
  // 错误处理
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    handleError(new Error(errorDescription), `Failed to load: ${validatedURL}`)
    
    // 显示错误页面
    const errorHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: #f5f5f5;
          }
          .error-container {
            text-align: center;
            padding: 40px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            max-width: 500px;
          }
          h1 { color: #e74c3c; margin-bottom: 20px; }
          p { color: #666; margin: 10px 0; }
          button {
            background: #3498db;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin: 10px 5px;
          }
          button:hover { background: #2980b9; }
          .details {
            text-align: left;
            background: #f8f8f8;
            padding: 10px;
            border-radius: 5px;
            margin-top: 20px;
            font-size: 12px;
            color: #555;
          }
        </style>
      </head>
      <body>
        <div class="error-container">
          <h1>加载失败</h1>
          <p>应用程序遇到了问题，无法正常加载。</p>
          <div class="details">
            <strong>错误代码:</strong> ${errorCode}<br>
            <strong>错误描述:</strong> ${errorDescription}<br>
            <strong>URL:</strong> ${validatedURL}
          </div>
          <button onclick="window.location.reload()">重试</button>
          <button onclick="window.electronAPI && window.electronAPI.openDevTools()">打开开发者工具</button>
        </div>
      </body>
      </html>
    `
    mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(errorHTML)}`)
  })
  
  mainWindow.webContents.on('crashed', () => {
    handleError(new Error('Renderer process crashed'), 'Renderer crash')
  })
  
  mainWindow.webContents.on('dom-ready', () => {
    log('INFO', 'DOM ready')
    appState.frontendReady = true
  })
  
  // 加载应用
  try {
    if (isDev && process.env.USE_EXTERNAL_SERVER === 'true') {
      log('INFO', 'Loading development server at http://localhost:9020')
      await mainWindow.loadURL('http://localhost:9020')
    } else {
      log('INFO', 'Waiting for embedded server to be ready...')
      // 等待服务器健康检查通过
      const serverReady = await waitForServer('http://localhost:9021', 30, 1000)
      if (serverReady) {
        log('INFO', 'Server is ready, loading application')
        await mainWindow.loadURL('http://localhost:9021')
      } else {
        throw new Error('Server failed to start')
      }
    }
  } catch (error) {
    handleError(error, 'Loading application')
  }
}

// 启动后端服务器
function startBackendServer() {
  // 总是启动内置的后端服务器，除非在开发模式下已经有独立的服务器在运行
  if (isDev && process.env.USE_EXTERNAL_SERVER === 'true') {
    log('INFO', 'Development mode - using external backend server')
    appState.serverStarted = true
    return
  }
  
  log('INFO', 'Starting embedded backend server...')
  
  try {
    // 修复打包后的路径问题
    // 打包后 server 和 node_modules 都在 app.asar.unpacked 中
    const serverPath = app.isPackaged
      ? path.join(process.resourcesPath, 'app.asar.unpacked', 'server', 'index.js')
      : path.join(__dirname, '../server/index.js')
    
    const workingDir = app.isPackaged
      ? path.join(process.resourcesPath, 'app.asar.unpacked')  // 在 unpacked 目录下，这里有 node_modules
      : path.join(__dirname, '..')
    
    log('INFO', `Server path: ${serverPath}`)
    log('INFO', `Working directory: ${workingDir}`)
    
    // 检查服务器文件是否存在
    if (!fs.existsSync(serverPath)) {
      throw new Error(`Server file not found at: ${serverPath}`)
    }
    
    // 设置环境变量
    const serverEnv = {
      ...process.env,
      NODE_ENV: environment,
      PORT: '9021',
      // 添加静态文件路径 - app.asar.unpacked 里有 dist
      DIST_PATH: app.isPackaged 
        ? path.join(process.resourcesPath, 'app.asar.unpacked', 'dist')
        : path.join(__dirname, '../dist')
    }
    
    serverProcess = spawn('node', [serverPath], {
      cwd: workingDir,
      env: serverEnv,
      stdio: 'pipe'
    })
    
    serverProcess.stdout.on('data', (data) => {
      const message = data.toString().trim()
      log('SERVER', message)
      
      // 检测服务器启动成功
      if (message.includes('ES Manager Server running')) {
        appState.serverStarted = true
        log('INFO', 'Backend server started successfully')
      }
    })
    
    serverProcess.stderr.on('data', (data) => {
      log('SERVER-ERROR', data.toString().trim())
    })
    
    serverProcess.on('error', (error) => {
      handleError(error, 'Backend server process')
      appState.serverStarted = false
    })
    
    serverProcess.on('close', (code) => {
      log('INFO', `Backend server exited with code ${code}`)
      appState.serverStarted = false
      serverProcess = null
    })
    
  } catch (error) {
    handleError(error, 'Starting backend server')
    appState.serverStarted = false
  }
}

// IPC 处理器
function setupIpcHandlers() {
  // 获取系统信息
  ipcMain.handle('get-system-info', () => ({
    platform: process.platform,
    arch: process.arch,
    version: app.getVersion(),
    electron: process.versions.electron,
    node: process.versions.node,
    chrome: process.versions.chrome
  }))
  
  // 获取应用状态
  ipcMain.handle('get-app-state', () => appState)
  
  // 获取环境信息
  ipcMain.handle('get-env', () => ({
    isDev,
    isPackaged: app.isPackaged,
    appPath: app.getAppPath(),
    resourcesPath: process.resourcesPath,
    __dirname
  }))
  
  // 日志处理
  ipcMain.on('log', (event, { level, message }) => {
    log(level, `[Renderer] ${message}`)
  })
  
  // 打开开发者工具
  ipcMain.on('open-dev-tools', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.openDevTools()
    }
  })
  
  // 重新加载应用
  ipcMain.on('reload-app', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.reload()
    }
  })
  
  // 在系统浏览器中打开外部链接
  ipcMain.handle('open-external', async (event, url) => {
    const { shell } = await import('electron')
    await shell.openExternal(url)
  })
}

// 应用就绪
app.whenReady().then(async () => {
  log('INFO', 'Application ready')
  log('INFO', `Environment: ${environment}`)
  log('INFO', `Packaged: ${app.isPackaged}`)
  log('INFO', `Version: ${app.getVersion()}`)
  
  // 设置 IPC 处理器
  setupIpcHandlers()
  
  // 启动后端服务器
  startBackendServer()
  
  // 创建主窗口
  // 总是等待一段时间让服务器启动
  setTimeout(async () => {
    await createMainWindow()
  }, 3000) // 给服务器3秒启动时间
  
  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createMainWindow()
    }
  })
})

// 窗口全部关闭
app.on('window-all-closed', () => {
  log('INFO', 'All windows closed')
  
  if (serverProcess) {
    log('INFO', 'Terminating backend server...')
    serverProcess.kill('SIGTERM')
  }
  
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// 应用退出前
app.on('before-quit', () => {
  log('INFO', 'Application quitting...')
  
  if (serverProcess) {
    serverProcess.kill('SIGTERM')
  }
})

// 全局错误处理
process.on('uncaughtException', (error) => {
  handleError(error, 'Uncaught exception')
})

process.on('unhandledRejection', (reason, promise) => {
  handleError(new Error(String(reason)), 'Unhandled rejection')
})

// 生产环境隐藏菜单栏（可选）
if (!isDev) {
  Menu.setApplicationMenu(null)
}

log('INFO', 'Main process initialized')