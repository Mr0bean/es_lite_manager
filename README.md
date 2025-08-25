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

#### Prerequisites
- **Node.js** >= 16.0.0 
- **npm** >= 7.0.0
- **Elasticsearch** >= 7.0.0

#### 📦 Installation

```bash
# Clone the repository
git clone https://github.com/username/es-lite-manager.git
cd es-lite-manager

# Install dependencies
npm install

# Configure environment
cp .env.example .env
cp server/.env.example server/.env
```

#### ⚡ Development

```bash
# Start backend server (Terminal 1)
npm run server

# Start frontend dev server (Terminal 2) 
npm run dev

# Open browser: http://localhost:3420
```

#### 🐳 Production Deployment

```bash
# Using Docker Compose (Recommended)
docker-compose up -d

# Or build and run manually
npm run build
npm run server
```

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

# 编辑配置文件，设置你的 Elasticsearch 连接信息
```

#### ⚡ 开发运行

```bash
# 启动后端服务（终端1）
npm run server

# 启动前端开发服务（终端2）
npm run dev

# 浏览器访问：http://localhost:3420
```

#### 🐳 生产部署

```bash
# 使用 Docker Compose（推荐）
docker-compose up -d

# 或手动构建运行
npm run build
npm run server
```

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