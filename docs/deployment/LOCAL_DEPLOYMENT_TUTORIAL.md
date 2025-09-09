# 🚀 ES Lite Manager 本地部署完整教程

> 一份详细的本地部署指南，包含常见问题解决方案

## 📋 目录

1. [环境准备](#环境准备)
2. [项目安装](#项目安装)
3. [配置文件设置](#配置文件设置)
4. [服务启动](#服务启动)
5. [验证部署](#验证部署)
6. [常见问题解决](#常见问题解决)
7. [进阶配置](#进阶配置)

---

## 🔧 环境准备

### 必需软件版本
- **Node.js** >= 16.0.0 (推荐 18.x 或更高)
- **npm** >= 7.0.0
- **Elasticsearch** >= 7.0.0 (可选，用于实际功能测试)

### 验证环境
```bash
# 检查 Node.js 版本
node --version
# 输出示例: v24.4.1

# 检查 npm 版本
npm --version
# 输出示例: 11.4.2

# 检查 Elasticsearch (如果本地安装)
curl -X GET "localhost:9200/"
# 如果未安装会显示连接错误，这是正常的
```

---

## 📦 项目安装

### 1. 进入项目目录
```bash
cd /path/to/es-lite-manager
```

### 2. 安装依赖
```bash
npm install
```
**说明**: 此命令会安装所有前后端依赖，包括：
- Vue 3 前端框架
- Express 后端框架  
- Elasticsearch 官方客户端
- Element Plus UI 组件库
- Chart.js 图表库等

### 3. 检查安装结果
```bash
# 查看已安装的包
npm list --depth=0
```

---

## ⚙️ 配置文件设置

### 1. 检查现有配置文件
```bash
# 查看配置文件状态
ls -la .env* && ls -la server/.env*
```

### 2. 前端配置 (.env)
编辑 `.env` 文件中的关键配置：

```bash
# Elasticsearch 连接信息
ES_HOST=localhost
ES_PORT=9200
ES_PROTOCOL=http
ES_USERNAME=elastic # ⚠️ 没有就不填
ES_PASSWORD=your_actual_password  # ⚠️ 替换为实际密码 没有就不填

# 服务端口配置
PORT=3002
BACKEND_PORT=3002
FRONTEND_PORT=3420

# API 基础 URL - ⚠️ 重要：确保与后端端口一致 默认不改
API_BASE_URL=http://localhost:9022

# CORS 跨域配置
CORS_ORIGIN=http://localhost:3420
```

### 3. 后端配置 (server/.env)
编辑 `server/.env` 文件：

```bash
# Elasticsearch 节点地址
ES_NODE=http://localhost:9200
ES_USERNAME=elastic # ⚠️ 没有就不填
ES_PASSWORD=your_actual_password  # ⚠️ 替换为实际密码

# 服务器端口 - ⚠️ 注意：使用 PORT 而不是 SERVER_PORT
PORT=9022

# 连接参数
ES_REQUEST_TIMEOUT=30000
ES_PING_TIMEOUT=3000
ES_MAX_RETRIES=3
```

### 4. Vite 代理配置 默认不用动
检查 `vite.config.js` 确保代理目标正确：

```javascript
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3420,
    proxy: {
      '/api': {
        target: 'http://localhost:9022',  // ⚠️ 确保与后端端口一致
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
```

---

## 🚀 服务启动

### 方法一：分别启动（推荐开发环境）

**步骤1: 启动后端服务器**
```bash
# 打开第一个终端窗口
npm run server
```

**成功启动标志**：
```
配置加载完成:
- 服务器地址: 0.0.0.0:9022
- ES节点: http://localhost:9200
- ES认证: 已启用
- CORS来源: *
- 服务端口: 9022
ES Manager Server running at http://0.0.0.0:9022
```

**步骤2: 启动前端开发服务器**
```bash
# 打开第二个终端窗口
npm run dev
```

**成功启动标志**：
```
VITE v5.4.19  ready in 443 ms

➜  Local:   http://localhost:3420/
➜  Network: use --host to expose
```

### 方法二：生产模式部署
```bash
# 构建前端应用
npm run build

# 启动后端服务器（会服务静态文件）
npm run server
```

---

## ✅ 验证部署

### 1. 检查后端服务
```bash
# 健康检查
curl http://localhost:9022/health

# 预期输出：
{"connected":false,"error":""}
# connected:false 是正常的，因为还没有配置有效的 Elasticsearch 连接
```

### 2. 检查前端服务
```bash
# 访问前端页面
curl -s http://localhost:3420/ | head -5

# 预期输出：HTML 内容
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <script type="module" src="/@vite/client"></script>
```

### 3. 浏览器验证
**访问地址**: http://localhost:3420

**预期看到**：
- ES Lite Manager 主界面
- 左侧导航菜单
- 顶部连接状态指示器
- 响应式布局

---

## 🐛 常见问题解决

### 问题1: 端口占用错误
**症状**：
```
Error: listen EADDRINUSE :::3420
```

**解决方案**：
```bash
# 查看端口占用
lsof -i :3420
lsof -i :9022

# 杀掉占用进程
kill -9 <PID>

# 或者修改配置使用其他端口
```

### 问题2: 后端启动但端口不正确
**症状**：后端显示运行在端口 3000 而不是 9022

**原因**：`server/.env` 中使用了 `SERVER_PORT` 而不是 `PORT`

**解决方案**：
```bash
# 编辑 server/.env
# 将 SERVER_PORT=9022 改为 PORT=9022
sed -i '' 's/SERVER_PORT/PORT/g' server/.env

# 重启服务
```

### 问题3: 前端无法连接后端 API
**症状**：前端界面加载但数据请求失败

**排查步骤**：
```bash
# 1. 检查后端是否运行
curl http://localhost:9022/health

# 2. 检查 Vite 代理配置
cat vite.config.js | grep -A 5 proxy

# 3. 检查前端配置
grep API_BASE_URL .env
```

**解决方案**：
- 确保 `.env` 中 `API_BASE_URL=http://localhost:9022`
- 确保 `vite.config.js` 中代理目标为 `http://localhost:9022`

### 问题4: Elasticsearch 连接失败
**症状**：应用启动成功但无法连接 ES

**解决方案**：
```bash
# 选项1: 启动本地 Elasticsearch
docker run -d --name elasticsearch-test \
  -p 9200:9200 -p 9300:9300 \
  -e "discovery.type=single-node" \
  -e "xpack.security.enabled=false" \
  elasticsearch:8.10.0

# 选项2: 使用应用内连接管理
# 访问 http://localhost:3420/#/connections
# 添加远程 Elasticsearch 集群连接
```

### 问题5: 依赖安装失败
**症状**：`npm install` 报错

**解决方案**：
```bash
# 清理缓存
npm cache clean --force

# 删除 node_modules 重新安装
rm -rf node_modules package-lock.json
npm install

# 或使用 yarn
yarn install
```

---

## 🔧 进阶配置

### Docker 部署
```bash
# 使用项目提供的 Docker Compose
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 环境变量详解

#### 前端环境变量 (.env)
| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `ES_HOST` | localhost | ES 服务器地址 |
| `ES_PORT` | 9200 | ES 端口 |
| `ES_PROTOCOL` | http | 连接协议 |
| `API_BASE_URL` | http://localhost:9022 | 后端 API 地址 |
| `FRONTEND_PORT` | 3420 | 前端服务端口 |

#### 后端环境变量 (server/.env)
| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `PORT` | 9022 | 后端服务端口 |
| `ES_NODE` | http://localhost:9200 | ES 节点地址 |
| `ES_USERNAME` | elastic | ES 用户名 |
| `ES_PASSWORD` | your_password_here | ES 密码 |
| `ES_REQUEST_TIMEOUT` | 30000 | 请求超时(毫秒) |

### 多集群配置
1. 访问 http://localhost:3420/#/connections
2. 点击"添加新连接"
3. 配置多个 Elasticsearch 集群
4. 在顶部导航切换集群上下文

### 安全配置
```bash
# 生产环境建议
# 1. 启用 HTTPS
ES_PROTOCOL=https

# 2. 配置 CORS
CORS_ORIGIN=https://yourdomain.com

# 3. 使用环境特定的密码
ES_PASSWORD=${ES_PRODUCTION_PASSWORD}
```

---

## 📝 部署检查清单

### 启动前检查
- [ ] Node.js >= 16.0.0
- [ ] npm >= 7.0.0  
- [ ] 项目依赖已安装
- [ ] 端口 3420 和 9022 可用
- [ ] 环境配置文件正确设置

### 启动后验证
- [ ] 后端服务运行在 http://localhost:9022
- [ ] 前端服务运行在 http://localhost:3420
- [ ] 健康检查接口可访问
- [ ] 前端页面正常加载
- [ ] API 代理配置正常工作

### 功能验证
- [ ] 连接管理页面可访问
- [ ] 索引列表可查看（如果有 ES 连接）
- [ ] 搜索功能正常
- [ ] 统计图表显示正常

---

## 🎯 快速启动命令

```bash
# 一键部署脚本
#!/bin/bash
echo "🚀 ES Lite Manager 快速部署"

# 1. 安装依赖
echo "📦 安装依赖..."
npm install

# 2. 检查配置
echo "⚙️  检查配置..."
if [ ! -f ".env" ]; then
  cp .env.example .env
  echo "✅ 创建前端配置文件"
fi

if [ ! -f "server/.env" ]; then
  cp server/.env.example server/.env
  echo "✅ 创建后端配置文件"
fi

# 3. 启动服务
echo "🌟 启动后端服务..."
npm run server &
BACKEND_PID=$!

echo "🎨 启动前端服务..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "🎉 部署完成!"
echo "📱 前端: http://localhost:3420"
echo "🔧 后端: http://localhost:9022"
echo ""
echo "按 Ctrl+C 停止服务"

# 等待用户中断
wait
```

保存为 `quick-start.sh` 并执行：
```bash
chmod +x quick-start.sh
./quick-start.sh
```

---

## 📞 获取帮助

如果遇到问题，可以：

1. **检查日志**: 查看终端输出的错误信息
2. **查看文档**: 阅读项目的 README.md 和 CLAUDE.md
3. **重置环境**: 删除 node_modules 重新安装
4. **端口冲突**: 使用 `lsof -i :端口号` 查找占用进程

---

*最后更新：2025-08-25*
