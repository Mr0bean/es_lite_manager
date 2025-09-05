# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Elasticsearch management web application built with Vue 3 and Express, providing a comprehensive interface for managing and visualizing Elasticsearch data.

## Service Configuration

### Elasticsearch Configuration
- Service URL: configurable via environment variables
- Authentication: configurable username/password authentication
- Client library: @elastic/elasticsearch

### Port Configuration
- Frontend: Port 9020 (Vite dev server)
- Backend API: Port 9021 (Express server)

## Architecture

### Frontend (Vue 3 + Vite)
- **Framework**: Vue 3 with Composition API
- **UI Library**: Element Plus
- **Router**: Vue Router for SPA navigation
- **Charts**: Chart.js with vue-chartjs
- **Build Tool**: Vite

### Backend (Express + Elasticsearch Client)
- **server/index.js**: Express API server with Elasticsearch client
- **CORS enabled** for frontend communication
- **RESTful endpoints** for all ES operations

### Key Features
1. **Index Management**: Create, delete, view indices
2. **Document Search**: Multiple query types (match, term, range, bool)
3. **Document CRUD**: Create, read, update, delete documents
4. **Statistics**: Visual charts and detailed metrics
5. **Real-time Status**: Connection status monitoring

## Commands

```bash
# Install dependencies
npm install

# Run backend server (port 9021)
npm run server

# Run frontend dev server (port 9020)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
├── src/
│   ├── api/elasticsearch.js    # API client wrapper
│   ├── views/                  # Page components
│   │   ├── Search.vue          # Search interface
│   │   ├── Indices.vue         # Index management
│   │   ├── Documents.vue       # Document CRUD
│   │   └── Stats.vue           # Statistics dashboard
│   ├── router/index.js         # Route definitions
│   ├── App.vue                 # Main app component
│   └── main.js                 # App entry point
├── server/
│   └── index.js                # Express backend API
└── vite.config.js              # Vite configuration with proxy
```

## Development Notes

- API calls are proxied through Vite dev server (configured in vite.config.js)
- All ES operations go through the Express backend for security
- Frontend uses `/api` prefix which is proxied to `localhost:9021`
- Error handling is implemented at both frontend and backend levels

## Electron Packaging Rules (重要！)

### 打包配置检查清单
1. **asarUnpack必须包含所有运行时依赖**：
   ```json
   "asarUnpack": [
     "server/**/*",
     "dist/**/*", 
     "node_modules/**/*"  // 关键：必须解包node_modules
   ]
   ```

2. **路径配置必须正确**：
   - 打包后server路径：`app.asar.unpacked/server/index.js`
   - 工作目录：`app.asar.unpacked`（包含node_modules）
   - 静态文件：`app.asar.unpacked/dist`

3. **每次修改后必须验证**：
   ```bash
   # 1. 打包
   npm run dist:mac:prod
   
   # 2. 检查unpacked目录结构
   ls -la "dist-electron/mac-arm64/ES Manager.app/Contents/Resources/app.asar.unpacked/"
   # 必须包含: dist/, node_modules/, server/
   
   # 3. 测试运行
   open "dist-electron/mac-arm64/ES Manager.app"
   
   # 4. 如果失败，查看错误
   "/dist-electron/mac-arm64/ES Manager.app/Contents/MacOS/ES Manager" 2>&1 | head -50
   ```

### 常见问题及解决方案

#### 问题1：应用打不开/启动失败
**原因**：`app.asar.unpacked`缺少必要文件
**解决**：
1. 检查`package.json`的`asarUnpack`配置
2. 确保包含`node_modules/**/*`
3. 重新打包

#### 问题2：ERR_MODULE_NOT_FOUND
**原因**：服务器找不到依赖模块
**解决**：
1. 确保`node_modules`在`asarUnpack`中
2. 检查`main.js`中的`workingDir`路径设置

#### 问题3：旧版本缓存问题
**解决**：
```bash
# 删除旧版本
rm -rf "/Applications/ES Manager.app"
# 安装新版本
cp -R "dist-electron/mac-arm64/ES Manager.app" /Applications/
```

### 自动验证流程
每次涉及Electron打包的修改后，必须：
1. 先本地打包测试
2. 验证unpacked目录结构完整
3. 实际运行应用确认能启动
4. 只有验证通过才能交付

### 关键文件路径映射
- 开发环境：
  - server: `__dirname/../server/index.js`
  - dist: `__dirname/../dist`
  - node_modules: `__dirname/../node_modules`

- 生产环境（打包后）：
  - server: `resourcesPath/app.asar.unpacked/server/index.js`  
  - dist: `resourcesPath/app.asar.unpacked/dist`
  - node_modules: `resourcesPath/app.asar.unpacked/node_modules`