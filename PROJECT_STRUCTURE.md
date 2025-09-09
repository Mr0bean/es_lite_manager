# 项目结构说明

## 目录结构

```
es_manager/
├── src/                      # 前端源代码
│   ├── api/                 # API 接口封装
│   │   ├── elasticsearch.js # ES API 客户端
│   │   └── __tests__/      # API 单元测试
│   ├── components/          # Vue 组件
│   │   ├── DocumentEditor.vue
│   │   ├── IndexCard.vue
│   │   ├── SearchForm.vue
│   │   └── __tests__/      # 组件测试
│   ├── views/              # 页面视图
│   │   ├── Search.vue      # 搜索界面
│   │   ├── Indices.vue     # 索引管理
│   │   ├── Documents.vue   # 文档管理
│   │   ├── Stats.vue       # 统计仪表板
│   │   ├── Strategy.vue    # 策略管理
│   │   ├── Analyzer.vue    # 分析器工具
│   │   ├── Mapping.vue     # 映射管理
│   │   └── Plugin.vue      # 插件管理
│   ├── router/             # 路由配置
│   ├── i18n/               # 国际化
│   ├── config/             # 前端配置
│   ├── utils/              # 工具函数
│   │   └── __tests__/      # 工具函数测试
│   ├── App.vue             # 根组件
│   └── main.js             # 入口文件
│
├── server/                  # 后端服务
│   ├── index.js            # Express 服务器
│   ├── config.js           # 服务器配置
│   ├── connectionManager.js # 连接管理
│   ├── data/               # 数据存储
│   └── __tests__/          # 后端测试
│
├── src-electron/           # Electron 主进程
│   └── main.js            # Electron 入口
│
├── docs/                   # 文档目录
│   ├── deployment/        # 部署文档
│   ├── testing/          # 测试文档
│   └── development/      # 开发文档
│
├── config/                # 配置文件
│   ├── electron-builder.json
│   ├── electron-builder.dev.json
│   ├── electron-builder.prod.json
│   └── electron-builder.staging.json
│
├── test/                  # 测试相关
│   ├── jest.backend.config.js
│   ├── vitest.config.js
│   ├── test-report.json
│   └── benchmark/        # 性能测试
│
├── scripts/              # 脚本工具
│   └── test-summary.js  # 测试报告生成
│
├── .github/              # GitHub 配置
│   └── workflows/       # CI/CD 工作流
│       ├── build.yml
│       ├── test.yml
│       └── coverage.yml
│
├── android/             # Android 平台支持
├── assets/              # 静态资源
├── images/              # 图片资源
├── logs/                # 日志目录
│
├── package.json         # 项目依赖
├── vite.config.js      # Vite 配置
├── docker-compose.yml  # Docker 编排
├── README.md           # 项目说明
└── CLAUDE.md           # 开发指南
```

## 核心模块说明

### 前端架构 (Vue 3 + Vite)
- **框架**: Vue 3 Composition API
- **UI 库**: Element Plus
- **路由**: Vue Router 4
- **构建工具**: Vite
- **图表**: Chart.js

### 后端架构 (Node.js + Express)
- **框架**: Express 4
- **ES 客户端**: @elastic/elasticsearch
- **认证**: 基础认证支持
- **CORS**: 跨域资源共享

### Electron 桌面应用
- **主进程**: src-electron/main.js
- **渲染进程**: Vue 应用
- **打包工具**: electron-builder

## 开发工作流

1. **本地开发**
   ```bash
   npm run dev      # 启动前端
   npm run server   # 启动后端
   ```

2. **测试**
   ```bash
   npm test         # 运行所有测试
   npm run test:unit # 单元测试
   npm run test:e2e  # 端到端测试
   ```

3. **构建**
   ```bash
   npm run build    # 构建 Web 版本
   npm run dist     # 构建桌面应用
   ```

4. **部署**
   - Docker 部署: 见 `docs/deployment/`
   - 手动部署: 见部署文档

## 代码规范

- ES6+ 语法
- Vue 3 Composition API
- 模块化设计
- RESTful API
- 统一错误处理
- 国际化支持