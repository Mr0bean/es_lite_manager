# ES Manager 多平台构建指南

## 支持平台

ES Manager 支持以下平台的构建：

1. **桌面端**: Windows, macOS, Linux (基于 Electron)
2. **移动端**: Android (基于 Capacitor)
3. **Web 端**: 现代浏览器 (基于 Vue 3)
4. **容器**: Docker 部署

## 环境说明

ES Manager 支持三种环境的打包：

1. **开发环境 (Development)** - 用于开发测试，包含调试工具
2. **测试环境 (Staging)** - 用于预发布测试
3. **生产环境 (Production)** - 最终用户使用的正式版本

## 环境配置文件

- `.env.development.example` - 开发环境配置模板
- `.env.staging.example` - 测试环境配置模板
- `.env.production.example` - 生产环境配置模板

## 构建命令

### 1. Web 应用构建

```bash
# 开发环境
npm run build:dev

# 测试环境  
npm run build:staging

# 生产环境
npm run build:prod
```

### 2. Electron 桌面应用构建

#### 开发环境打包
```bash
# macOS
npm run dist:mac:dev

# Windows
npm run dist:win:dev

# Linux
npm run dist:linux:dev

# 所有平台
npm run dist:all:dev
```

#### 测试环境打包
```bash
# macOS
npm run dist:mac:staging

# Windows
npm run dist:win:staging

# Linux
npm run dist:linux:staging

# 所有平台
npm run dist:all:staging
```

#### 生产环境打包
```bash
# macOS
npm run dist:mac:prod

# Windows
npm run dist:win:prod

# Linux
npm run dist:linux:prod

# 所有平台
npm run dist:all:prod
```

#### 快速打包（默认生产环境）
```bash
# macOS
npm run dist:mac

# Windows
npm run dist:win

# Linux
npm run dist:linux

# 所有平台
npm run dist:all
```

### 3. Android 应用构建

#### 初始化（仅首次需要）
```bash
# 初始化 Capacitor
npm run cap:init

# 添加 Android 平台
npm run cap:add:android
```

#### 构建 APK
```bash
# 构建 Web 应用并同步到 Android
npm run cap:build:android

# 打开 Android Studio
npm run cap:open:android

# 仅同步（修改代码后）
npm run cap:sync
```

#### 手动 Android 构建
```bash
cd android

# 构建调试版本
./gradlew assembleDebug

# 构建发布版本
./gradlew assembleRelease
```

### 4. Docker 构建

```bash
# 构建镜像
npm run docker:build

# 启动服务
npm run docker:up

# 查看日志
npm run docker:logs

# 停止服务
npm run docker:down
```

## 使用批量构建脚本

提供了一个交互式的批量构建脚本 `build-all.sh`：

```bash
# 运行构建脚本
./build-all.sh
```

脚本功能：
- 交互式选择环境和平台
- 批量构建所有环境
- 清理构建目录
- 彩色输出显示构建状态

## 输出目录

### Web 应用
- 输出目录: `dist/`
- 内容: HTML、CSS、JavaScript 和静态资源

### Electron 应用
不同环境的构建输出在不同目录：

- **开发环境**: `dist-electron-dev/`
- **测试环境**: `dist-electron-staging/`
- **生产环境**: `dist-electron-prod/`

### Android 应用
- 输出目录: `android/app/build/outputs/apk/`
- **调试版**: `debug/app-debug.apk`
- **发布版**: `release/app-release.apk`

### Docker 镜像
- 镜像名: `es-manager`
- 端口: 9020 (前端), 9021 (后端)

## 环境特征

### 开发环境特点
- 应用标题显示 "ES Manager (Dev)"
- 启用开发者工具
- 详细的日志输出 (debug级别)
- Bundle ID: `com.elasticsearch.manager.dev`

### 测试环境特点
- 应用标题显示 "ES Manager (Staging)"
- 启用开发者工具
- 标准日志输出 (info级别)
- Bundle ID: `com.elasticsearch.manager.staging`

### 生产环境特点
- 应用标题显示 "ES Manager"
- 禁用开发者工具
- 最少日志输出 (error级别)
- Bundle ID: `com.elasticsearch.manager`

## 配置自定义环境

### 1. 创建环境配置文件

创建 `.env.custom` 文件：

```env
VITE_ENV=custom
VITE_APP_TITLE=ES Manager (Custom)
VITE_API_BASE_URL=http://localhost:9021
VITE_ENABLE_DEVTOOLS=true
VITE_LOG_LEVEL=info
```

### 2. 创建构建配置

创建 `electron-builder.custom.json`：

```json
{
  "extends": "./electron-builder.json",
  "productName": "ES Manager (Custom)",
  "directories": {
    "output": "dist-electron-custom"
  }
}
```

### 3. 添加打包脚本

在 `package.json` 中添加：

```json
{
  "scripts": {
    "build:custom": "vite build --mode custom",
    "dist:mac:custom": "npm run build:custom && cross-env NODE_ENV=custom electron-builder --mac --config electron-builder.custom.json"
  }
}
```

## 注意事项

1. **首次打包前**：确保已安装所有依赖
   ```bash
   npm install
   ```

2. **Windows 打包**：在 macOS/Linux 上打包 Windows 版本需要 Wine
   ```bash
   brew install --cask wine-stable  # macOS
   ```

3. **Linux 打包**：在 macOS/Windows 上打包 Linux 版本可能需要额外工具

4. **代码签名**：生产环境打包建议配置代码签名证书

5. **环境隔离**：不同环境的应用可以同时安装在同一台机器上

## 故障排除

### 问题：打包失败提示缺少模块
```bash
npm install
npm run build
```

### 问题：macOS 提示应用已损坏
```bash
xattr -cr "ES Manager.app"
```

### 问题：Windows 安全警告
需要在 Windows 安全中心添加例外或使用代码签名证书

## 发布流程建议

1. **开发阶段**：使用 dev 环境进行日常开发
2. **测试阶段**：使用 staging 环境进行测试
3. **发布阶段**：使用 prod 环境构建正式版本
4. **版本管理**：在 package.json 中更新版本号
5. **自动更新**：配置 electron-updater 实现自动更新