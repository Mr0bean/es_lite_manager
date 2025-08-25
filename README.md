# 🔍 ES Lite Manager

[**English**](#english) | [**中文**](#中文)

---

## English

> A modern, intuitive web-based management platform for Elasticsearch clusters

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D16-green.svg)](https://nodejs.org/)
[![Vue.js](https://img.shields.io/badge/Vue.js-3.x-4FC08D.svg)](https://vuejs.org/)
[![Elasticsearch](https://img.shields.io/badge/Elasticsearch-%3E%3D7.0-005571.svg)](https://www.elastic.co/)

<div align="center">
  <img src="https://via.placeholder.com/800x400/1f2937/ffffff?text=ES+Lite+Manager" alt="ES Lite Manager" />
</div>

### ✨ Key Features

#### 🌐 Multi-Cluster Management
- **Dynamic Connections**: Seamlessly manage multiple Elasticsearch clusters
- **Real-time Status**: Live connection monitoring with automatic failover detection  
- **Secure Storage**: Encrypted credential management with base64 encoding
- **Quick Switch**: One-click cluster switching in the navigation bar

#### 📊 Comprehensive Data Operations
- **Index Management**: Full lifecycle management - create, configure, monitor, and delete indices
- **Advanced Search**: Multi-query support (match, term, range, bool, wildcard, fuzzy)
- **Document CRUD**: Complete document operations with bulk processing capabilities
- **Schema Management**: Interactive mapping editor with field type validation

#### 🔧 Advanced Analytics & Tools
- **Query Builder**: Visual query constructor with preview and optimization suggestions
- **Analyzer Toolkit**: Test and debug built-in and custom text analyzers
- **ILM Policies**: Index Lifecycle Management policy configuration and monitoring
- **Statistics Dashboard**: Rich visualizations for cluster health, performance metrics, and usage analytics
- **Aggregation Engine**: Complex aggregation queries with chart-based result visualization

#### 🎨 Modern User Experience
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Dark/Light Themes**: Automatic theme switching based on system preferences
- **Real-time Updates**: Live data synchronization with WebSocket connections
- **JSON Beautification**: Syntax highlighting and collapsible JSON viewer
- **Keyboard Shortcuts**: Power-user shortcuts for common operations

### 🚀 Quick Start

#### 🐳 Docker (Recommended)

```bash
# Pull and run - No configuration needed!
docker run -d \
  -p 8080:80 \
  -p 9021:9021 \
  --name es-manager-app \
  19963666/es_lite_manager:latest

# Access: http://localhost:8080
```

#### 📦 Manual Installation

Prerequisites: **Node.js** >= 16.0.0, **npm** >= 7.0.0

```bash
# Clone and install
git clone https://github.com/username/es-lite-manager.git
cd es-lite-manager
npm install

# Quick setup (uses defaults)
cp .env.example .env
cp server/.env.example server/.env

# Start services
npm run server &
npm run dev

# Access: http://localhost:3420
```

#### ⚙️ Detailed Setup (Optional)

<details>
<summary>Click to expand detailed configuration and troubleshooting</summary>

##### Configuration Files

**Important**: Before starting the application, you need to configure the environment files properly.

##### Frontend Configuration (`.env`)
```bash
# API Configuration - ⚠️ IMPORTANT: Must match backend port
API_BASE_URL=http://localhost:9022

# Frontend server port
FRONTEND_PORT=3420

# Elasticsearch connection (for reference only)
ES_HOST=localhost
ES_PORT=9200
ES_USERNAME=elastic
ES_PASSWORD=your_actual_password  # Replace with actual password
```

##### Backend Configuration (`server/.env`)
```bash
# Server port - ⚠️ IMPORTANT: Use PORT not SERVER_PORT  
PORT=9022

# Elasticsearch connection
ES_NODE=http://localhost:9200
ES_USERNAME=elastic
ES_PASSWORD=your_actual_password  # Replace with actual password

# Connection settings
ES_REQUEST_TIMEOUT=30000
ES_PING_TIMEOUT=3000
ES_MAX_RETRIES=3
```

##### Vite Proxy Configuration
Ensure `vite.config.js` has the correct proxy target:
```javascript
proxy: {
  '/api': {
    target: 'http://localhost:9022',  // Must match backend PORT
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, '')
  }
}
```

#### ⚡ Development

```bash
# Step 1: Start backend server (Terminal 1)
npm run server
# Expected output: 
# ES Manager Server running at http://0.0.0.0:9022

# Step 2: Start frontend dev server (Terminal 2) 
npm run dev
# Expected output:
# ➜  Local:   http://localhost:3420/

# Step 3: Open browser and access the application
# Frontend: http://localhost:3420
# Backend API: http://localhost:9022
```

##### ✅ Verification Steps
```bash
# Check backend health
curl http://localhost:9022/health
# Expected: {"connected":false,"error":""}

# Check frontend loading
curl -s http://localhost:3420/ | head -5
# Expected: HTML content with Vite dev server
```

##### 🔧 Common Issues & Solutions

**Port Conflict Error**
```bash
# If you see: Error: listen EADDRINUSE :::3420 or :::9022
# Find and kill the process using the port
lsof -i :3420
lsof -i :9022
kill -9 <PID>
```

**Backend Running on Wrong Port**
```bash
# If backend shows port 3000 instead of 9022
# Edit server/.env and ensure:
PORT=9022  # Not SERVER_PORT=9022
```

**Frontend Can't Connect to Backend**
```bash
# Check these files match:
# .env: API_BASE_URL=http://localhost:9022
# vite.config.js: target: 'http://localhost:9022'
# server/.env: PORT=9022
```

**Elasticsearch Connection Issues**
- The app will start successfully even without Elasticsearch
- Use the "Connection Management" page to configure ES clusters
- Or start a test ES instance:
```bash
docker run -d --name elasticsearch-test \
  -p 9200:9200 \
  -e "discovery.type=single-node" \
  -e "xpack.security.enabled=false" \
  elasticsearch:8.10.0
```

##### 🚀 Quick Start Script
Create a `quick-start.sh` file for easy deployment:
```bash
#!/bin/bash
echo "🚀 ES Lite Manager Quick Deployment"

# Install dependencies
npm install

# Setup environment files if they don't exist
[ ! -f ".env" ] && cp .env.example .env && echo "✅ Frontend config created"
[ ! -f "server/.env" ] && cp server/.env.example server/.env && echo "✅ Backend config created"

# Start services
echo "🌟 Starting backend server..."
npm run server &

echo "🎨 Starting frontend server..."
npm run dev &

echo "🎉 Deployment complete!"
echo "📱 Frontend: http://localhost:3420"
echo "🔧 Backend: http://localhost:9022"
echo "Press Ctrl+C to stop services"
wait
```

Usage: `chmod +x quick-start.sh && ./quick-start.sh`

#### 🐳 Docker Deployment

##### Option 1: Pull from Docker Hub (Recommended)

```bash
# Pull and run the latest image
docker run -d \
  -p 8080:80 \
  -p 9021:9021 \
  --name es-manager-app \
  19963666/es_lite_manager:latest

# Access the application
# Frontend: http://localhost:8080
# Backend API: http://localhost:9021
```

##### Option 2: Build locally and run

```bash
# Build Docker image
docker build -t es-manager:latest .

# Run container
docker run -d \
  -p 8080:80 \
  -p 9021:9021 \
  --name es-manager-app \
  es-manager:latest
```

##### Option 3: Using Docker Compose

```bash
# Using Docker Compose (includes all services)
docker-compose up -d
```

##### Configure Elasticsearch Connection

The container connects to `http://host.docker.internal:3402` by default. To connect to a different Elasticsearch instance:

```bash
# Run with custom ES configuration
docker run -d \
  -p 8080:80 \
  -p 9021:9021 \
  -e ES_HOST=your-es-server.com \
  -e ES_PORT=9200 \
  -e ES_USERNAME=elastic \
  -e ES_PASSWORD=your_password \
  --name es-manager-app \
  19963666/es_lite_manager:latest
```

##### Container Management

```bash
# View logs
docker logs es-manager-app

# Stop container
docker stop es-manager-app

# Remove container
docker rm es-manager-app

# Update to latest version
docker pull 19963666/es_lite_manager:latest
docker stop es-manager-app && docker rm es-manager-app
docker run -d -p 8080:80 -p 9021:9021 --name es-manager-app 19963666/es_lite_manager:latest
```

**📖 For detailed Docker deployment instructions, see: [Docker Build & Deployment Guide](./DOCKER_BUILD_GUIDE.md)**

### 🏗️ Architecture

#### Frontend Stack
- **Vue 3** with Composition API
- **Element Plus** for enterprise-grade UI components  
- **Vue Router** with route-level code splitting
- **Chart.js + Vue-Chartjs** for data visualization
- **Axios** with request/response interceptors
- **Vite** for lightning-fast development

#### Backend Stack  
- **Express.js** with middleware for security and CORS
- **@elastic/elasticsearch** official client v8.10.0
- **Custom Connection Pool** for optimized cluster management
- **Environment-based Config** for deployment flexibility

### 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 中文

> 现代化、直观的 Elasticsearch 集群管理平台

### ✨ 功能特性

#### 🌐 多集群管理
- **动态连接管理**: 无缝管理多个 Elasticsearch 集群
- **实时状态监控**: 实时连接状态监控和自动故障转移检测
- **安全存储**: 使用 base64 编码的加密凭据管理
- **快速切换**: 导航栏中一键切换集群

#### 📊 全面数据操作
- **索引管理**: 完整的生命周期管理 - 创建、配置、监控和删除索引
- **高级搜索**: 多查询类型支持（match、term、range、bool、wildcard、fuzzy）
- **文档 CRUD**: 完整的文档操作，支持批量处理
- **模式管理**: 交互式映射编辑器，支持字段类型验证

#### 🔧 高级分析和工具
- **查询构建器**: 可视化查询构造器，提供预览和优化建议
- **分析器工具包**: 测试和调试内置及自定义文本分析器
- **ILM 策略**: 索引生命周期管理策略配置和监控
- **统计仪表板**: 集群健康状况、性能指标和使用分析的丰富可视化
- **聚合引擎**: 复杂聚合查询，支持基于图表的结果可视化

#### 🎨 现代用户体验
- **响应式设计**: 针对桌面、平板和移动设备优化
- **深色/浅色主题**: 基于系统偏好的自动主题切换
- **实时更新**: WebSocket 连接的实时数据同步
- **JSON 美化**: 语法高亮和可折叠的 JSON 查看器
- **键盘快捷键**: 常用操作的用户快捷键

### 🚀 快速开始

#### 环境要求
- **Node.js** >= 16.0.0
- **npm** >= 7.0.0
- **Elasticsearch** >= 7.0.0

#### 📦 安装配置

```bash
# 克隆仓库
git clone https://github.com/username/es-lite-manager.git
cd es-lite-manager

# 安装依赖
npm install

# 配置环境
cp .env.example .env
cp server/.env.example server/.env
```

#### ⚙️ 重要配置说明

**关键提醒**: 启动前必须正确配置环境文件，特别注意端口配置的一致性。

##### 前端配置 (`.env`)
```bash
# API 配置 - ⚠️ 重要：必须与后端端口一致
API_BASE_URL=http://localhost:9022

# 前端服务端口
FRONTEND_PORT=3420

# Elasticsearch 连接配置（仅作参考）
ES_HOST=localhost
ES_PORT=9200
ES_USERNAME=elastic
ES_PASSWORD=your_actual_password  # 请替换为实际密码
```

##### 后端配置 (`server/.env`)
```bash
# 服务器端口 - ⚠️ 重要：使用 PORT 而不是 SERVER_PORT
PORT=9022

# Elasticsearch 连接
ES_NODE=http://localhost:9200
ES_USERNAME=elastic
ES_PASSWORD=your_actual_password  # 请替换为实际密码

# 连接参数
ES_REQUEST_TIMEOUT=30000
ES_PING_TIMEOUT=3000
ES_MAX_RETRIES=3
```

##### Vite 代理配置检查
确保 `vite.config.js` 中的代理目标正确：
```javascript
proxy: {
  '/api': {
    target: 'http://localhost:9022',  // 必须与后端 PORT 一致
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, '')
  }
}
```

#### ⚡ 开发运行

```bash
# 步骤1：启动后端服务（终端1）
npm run server
# 预期输出：ES Manager Server running at http://0.0.0.0:9022

# 步骤2：启动前端开发服务（终端2）
npm run dev
# 预期输出：➜  Local:   http://localhost:3420/

# 步骤3：在浏览器中访问应用
# 前端地址：http://localhost:3420
# 后端 API：http://localhost:9022
```

##### ✅ 部署验证步骤
```bash
# 检查后端健康状态
curl http://localhost:9022/health
# 预期输出：{"connected":false,"error":""}

# 检查前端页面加载
curl -s http://localhost:3420/ | head -5
# 预期输出：HTML 内容
```

##### 🔧 常见问题解决

**端口占用错误**
```bash
# 如果看到：Error: listen EADDRINUSE :::3420 或 :::9022
# 查找并终止占用端口的进程
lsof -i :3420
lsof -i :9022
kill -9 <进程ID>
```

**后端运行在错误端口**
```bash
# 如果后端显示运行在端口 3000 而不是 9022
# 编辑 server/.env 确保使用：
PORT=9022  # 不是 SERVER_PORT=9022
```

**前端无法连接后端**
```bash
# 检查以下文件中的端口配置是否一致：
# .env: API_BASE_URL=http://localhost:9022
# vite.config.js: target: 'http://localhost:9022'
# server/.env: PORT=9022
```

**Elasticsearch 连接问题**
- 应用可以在没有 Elasticsearch 的情况下正常启动
- 使用"连接管理"页面配置 ES 集群连接
- 或启动测试 ES 实例：
```bash
docker run -d --name elasticsearch-test \
  -p 9200:9200 \
  -e "discovery.type=single-node" \
  -e "xpack.security.enabled=false" \
  elasticsearch:8.10.0
```

##### 🚀 一键启动脚本
创建 `quick-start.sh` 脚本快速部署：
```bash
#!/bin/bash
echo "🚀 ES Lite Manager 快速部署"

npm install

[ ! -f ".env" ] && cp .env.example .env && echo "✅ 前端配置已创建"
[ ! -f "server/.env" ] && cp server/.env.example server/.env && echo "✅ 后端配置已创建"

echo "🌟 启动后端服务..."
npm run server &

echo "🎨 启动前端服务..."
npm run dev &

echo "🎉 部署完成！"
echo "📱 前端：http://localhost:3420"
echo "🔧 后端：http://localhost:9022"
echo "按 Ctrl+C 停止服务"
wait
```

使用方法：`chmod +x quick-start.sh && ./quick-start.sh`

#### 🐳 Docker 部署

##### 方式一：从 Docker Hub 拉取（推荐）

```bash
# 拉取并运行最新镜像
docker run -d \
  -p 8080:80 \
  -p 9021:9021 \
  --name es-manager-app \
  19963666/es_lite_manager:latest

# 访问应用
# 前端界面: http://localhost:8080
# 后端 API: http://localhost:9021
```

##### 方式二：本地构建运行

```bash
# 构建 Docker 镜像
docker build -t es-manager:latest .

# 运行容器
docker run -d \
  -p 8080:80 \
  -p 9021:9021 \
  --name es-manager-app \
  es-manager:latest
```

##### 方式三：使用 Docker Compose

```bash
# 使用 Docker Compose（包含所有服务）
docker-compose up -d
```

##### 配置 Elasticsearch 连接

容器默认连接到 `http://host.docker.internal:3402`。如需连接不同的 Elasticsearch 实例：

```bash
# 使用自定义 ES 配置运行
docker run -d \
  -p 8080:80 \
  -p 9021:9021 \
  -e ES_HOST=your-es-server.com \
  -e ES_PORT=9200 \
  -e ES_USERNAME=elastic \
  -e ES_PASSWORD=your_password \
  --name es-manager-app \
  19963666/es_lite_manager:latest
```

##### 容器管理

```bash
# 查看日志
docker logs es-manager-app

# 停止容器
docker stop es-manager-app

# 删除容器
docker rm es-manager-app

# 更新到最新版本
docker pull 19963666/es_lite_manager:latest
docker stop es-manager-app && docker rm es-manager-app
docker run -d -p 8080:80 -p 9021:9021 --name es-manager-app 19963666/es_lite_manager:latest
```

**📖 详细的 Docker 部署说明请参考: [Docker 构建与部署指南](./DOCKER_BUILD_GUIDE.md)**

### 📁 项目结构

```
es-lite-manager/
├── 🎨 src/                      # 前端应用
│   ├── 📡 api/                  # API 客户端和服务
│   ├── 🧩 components/           # 可复用 Vue 组件
│   │   ├── JsonViewer.vue       # 语法高亮 JSON 显示
│   │   ├── JsonEditor.vue       # 交互式 JSON 编辑器
│   │   └── RefreshTimer.vue     # 自动刷新功能
│   ├── 📄 views/                # 页面组件
│   │   ├── 🔍 Search.vue        # 高级搜索界面
│   │   ├── 📚 Indices.vue       # 索引管理
│   │   ├── 📝 Documents.vue     # 文档 CRUD 操作
│   │   ├── 📊 Stats.vue         # 分析仪表板
│   │   ├── 🔌 Connections.vue   # 连接管理
│   │   ├── 📋 Policies.vue      # ILM 策略管理
│   │   ├── 🔤 Analyzers.vue     # 文本分析器测试
│   │   └── 🗂️ Mappings.vue      # 模式管理
│   ├── 🧭 router/               # Vue Router 配置
│   └── 🛠️ utils/                # 帮助函数和工具
├── ⚙️ server/                   # 后端 API 服务
│   ├── config.js               # 配置管理
│   ├── connectionManager.js    # 多集群连接处理程序
│   └── index.js               # Express 服务器和 API 路由
├── 🐳 docker-compose.yml       # 容器编排
└── 📋 .env.example             # 环境变量模板
```

### ⚙️ 配置说明

#### 环境变量配置

从模板创建 `.env` 和 `server/.env`：

```bash
# 前端配置 (.env)
VITE_API_BASE_URL=http://localhost:3002
VITE_APP_TITLE=ES Lite Manager

# 后端配置 (server/.env)
ES_NODE=http://localhost:9200
ES_USERNAME=elastic  
ES_PASSWORD=your_secure_password
SERVER_PORT=3002
CORS_ORIGIN=http://localhost:3420
```

#### 多集群设置

1. 在侧边栏导航到 **连接管理**
2. 点击 **添加新连接**
3. 配置集群详细信息：
   - **名称**: 友好的集群名称
   - **主机**: Elasticsearch 主机地址
   - **端口**: 通常为 9200 或云端 9243
   - **协议**: HTTP 或 HTTPS
   - **认证**: 用户名/密码或 API 密钥
4. 保存前 **测试连接**
5. 使用顶部导航中的集群选择器切换上下文

### 🛡️ 安全特性

- **凭据加密**: 使用 base64 编码在静态状态下加密密码
- **连接验证**: 自动 SSL 证书验证
- **CORS 保护**: 可配置的来源限制
- **输入清理**: 所有用户输入的 XSS 防护
- **速率限制**: API 端点防滥用保护
- **审计日志**: 跟踪所有管理操作

### 📊 监控和分析

#### 内置仪表板
- **集群健康状况**: 节点状态、磁盘使用率、内存利用率
- **索引统计**: 文档计数、存储大小、搜索性能
- **查询性能**: 响应时间、查询模式、错误率
- **实时指标**: 实时更新的图表和仪表

### 🤝 贡献指南

欢迎贡献！请查看我们的[贡献指南](CONTRIBUTING.md)了解详情。

#### 开发工作流程
1. **Fork** 仓库
2. **创建** 功能分支: `git checkout -b feature/amazing-feature`
3. **提交** 你的更改: `git commit -m 'feat: add amazing feature'`
4. **推送** 到你的分支: `git push origin feature/amazing-feature`
5. **提交** Pull Request

#### 代码标准
- 遵循 [Vue 3 风格指南](https://v3.vuejs.org/style-guide/)
- 使用 [约定式提交](https://conventionalcommits.org/)
- 保持测试覆盖率 80% 以上
- 为新功能和 API 编写文档

### 📈 发展路线图

- [ ] **多租户** 支持 SaaS 部署
- [ ] **高级安全** RBAC 和 OAuth 集成
- [ ] **机器学习** 异常检测集成
- [ ] **自定义插件** 系统扩展性
- [ ] **移动应用** 集群监控移动端
- [ ] **企业功能** 备份管理和合规报告

### 📄 开源协议

本项目采用 MIT 协议 - 查看 [LICENSE](LICENSE) 文件了解详情。

### 🙏 致谢

使用以下优秀技术构建 ❤️：

- [**Elasticsearch**](https://www.elastic.co/) - 搜索和分析的核心
- [**Vue.js**](https://vuejs.org/) - 渐进式 JavaScript 框架
- [**Element Plus**](https://element-plus.org/) - 企业级 UI 组件
- [**Chart.js**](https://www.chartjs.org/) - 美观、响应式图表
- [**Express.js**](https://expressjs.com/) - 快速、极简的 web 框架

### 📞 支持

- 📫 **问题反馈**: [GitHub Issues](https://github.com/username/es-lite-manager/issues)
- 💬 **讨论**: [GitHub Discussions](https://github.com/username/es-lite-manager/discussions)
- 📧 **邮箱**: support@eslitemanager.com
- 📚 **文档**: [官方文档](https://docs.eslitemanager.com)

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给个 Star! ⭐**

Made with 💙 by the ES Lite Manager Team

</div>