# 🔍 Elasticsearch Manager

一个现代化的 Elasticsearch 管理平台，提供直观的 Web 界面来管理和操作 Elasticsearch 集群。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16-brightgreen.svg)](https://nodejs.org/)
[![Vue.js](https://img.shields.io/badge/vue-3.x-brightgreen.svg)](https://vuejs.org/)

## ✨ 功能特性

### 🌟 多连接管理
- 支持管理多个 Elasticsearch 集群连接
- 实时连接状态监控和快速切换
- 连接配置的安全存储和管理

### 📊 数据管理
- **索引管理**: 创建、删除、查看索引信息和统计
- **文档搜索**: 支持多种查询类型（match、term、range、bool等）
- **文档操作**: 完整的 CRUD 操作，支持批量处理
- **映射管理**: 查看和修改索引映射结构

### 🔧 高级功能
- **分词器管理**: 查看和测试内置及自定义分词器
- **策略管理**: ILM（索引生命周期管理）策略配置
- **统计分析**: 可视化展示集群和索引统计信息
- **聚合查询**: 支持复杂聚合查询和结果可视化

### 🎨 用户体验
- 现代化响应式界面设计
- 实时数据更新和状态反馈
- JSON 格式数据的美化显示
- 深色/浅色主题支持

## 🚀 快速开始

### 环境要求

- Node.js >= 16.0.0
- npm >= 7.0.0
- Elasticsearch >= 7.0

### 📦 安装和运行

1. **克隆项目**
```bash
git clone https://github.com/yourusername/elasticsearch-manager.git
cd elasticsearch-manager
```

2. **安装依赖**
```bash
npm install
```

3. **配置环境**
```bash
cp .env.example .env
# 编辑 .env 文件，配置你的 Elasticsearch 连接信息
```

4. **启动应用**
```bash
# 启动后端服务
npm run server

# 新终端启动前端服务
npm run dev
```

5. **访问应用**
- 前端界面: http://localhost:3420
- 后端API: http://localhost:3002

### 🐳 Docker 部署

```bash
# 使用 Docker Compose 一键部署
docker-compose up -d

# 访问应用
# http://localhost:3420
```

## 📁 项目结构

```
elasticsearch-manager/
├── src/                    # 前端源码 (Vue 3)
│   ├── api/               # API 接口封装
│   ├── components/        # 公共组件
│   ├── views/            # 页面组件
│   │   ├── Search.vue         # 搜索管理
│   │   ├── Indices.vue        # 索引管理
│   │   ├── Documents.vue      # 文档管理
│   │   ├── Stats.vue          # 统计分析
│   │   ├── Connections.vue    # 连接管理
│   │   ├── Policies.vue       # 策略管理
│   │   ├── Analyzers.vue      # 分词器管理
│   │   └── Mappings.vue       # 映射管理
│   ├── router/           # 路由配置
│   └── utils/            # 工具函数
├── server/               # 后端服务 (Express)
│   ├── config.js         # 配置管理
│   ├── connectionManager.js  # 连接管理器
│   └── index.js          # 服务器入口
├── .env.example         # 环境变量模板
├── docker-compose.yml   # Docker 配置
└── README.md
```

## ⚙️ 配置说明

### 环境变量配置

复制 `.env.example` 到 `.env` 并根据需要修改：

```bash
# Elasticsearch 配置
ES_HOST=localhost
ES_PORT=9200
ES_PROTOCOL=http
ES_USERNAME=elastic
ES_PASSWORD=your_password_here

# 服务器配置
PORT=3002                    # 后端API端口
FRONTEND_PORT=3420           # 前端开发服务器端口

# CORS 配置
CORS_ORIGIN=http://localhost:3420
```

### 多连接配置

应用启动后，可通过连接管理界面添加多个 Elasticsearch 连接：

1. 访问"连接管理"页面
2. 点击"添加连接"
3. 填写连接信息并测试连接
4. 保存后可在头部快速切换连接

## 🛠️ 技术栈

### 前端技术
- **Vue 3**: 使用 Composition API
- **Element Plus**: 现代化 UI 组件库
- **Vue Router**: 单页应用路由
- **Chart.js**: 数据可视化
- **Axios**: HTTP 客户端
- **Vite**: 构建工具

### 后端技术
- **Express.js**: Web 应用框架
- **@elastic/elasticsearch**: 官方 ES 客户端
- **CORS**: 跨域资源共享
- **dotenv**: 环境变量管理

### 开发工具
- **Docker**: 容器化部署
- **ESLint**: 代码质量检查
- **Git**: 版本控制

## 📱 界面截图

### 主页面
- 实时连接状态显示
- 快速连接切换
- 响应式侧边导航

### 连接管理
- 多连接配置和管理
- 连接测试和状态监控
- 安全的密码存储

### 搜索功能
- 多种查询类型支持
- 聚合查询构建器
- 结果可视化展示

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 开源协议

本项目采用 MIT 协议 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- [Elasticsearch](https://www.elastic.co/) - 强大的搜索引擎
- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
- [Element Plus](https://element-plus.org/) - Vue 3 组件库

## 📮 联系方式

如有问题或建议，请提交 Issue 或联系维护者。

---

⭐ 如果这个项目对你有帮助，请给个 Star！