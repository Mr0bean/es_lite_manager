# Docker 构建与部署指南

本文档详细描述了 ES Lite Manager 的 Docker 镜像构建和部署过程。

## 概述

ES Lite Manager 是一个基于 Vue 3 和 Express 的 Elasticsearch 管理 Web 应用，支持 Docker 容器化部署。

## 构建步骤

### 1. 环境准备

确保系统中已安装：
- Docker Desktop (推荐版本 >= 20.0)
- Node.js >= 16.0 (用于本地开发)

### 2. 项目结构

```
es_lite_manager/
├── Dockerfile                # Docker 构建文件
├── docker-compose.yml        # Docker Compose 配置
├── nginx.conf                # Nginx 配置文件
├── server/                   # 后端服务
│   ├── .env                  # 环境变量配置
│   ├── config.js             # 服务器配置
│   └── index.js              # 后端入口
├── src/                      # 前端源码
└── package.json              # 项目依赖
```

### 3. 配置 Elasticsearch 连接

修改 `server/.env` 文件配置 ES 连接参数：

```bash
# Elasticsearch 连接配置
ES_PROTOCOL=http
ES_HOST=host.docker.internal
ES_PORT=3402
ES_USERNAME=elastic
ES_PASSWORD=your_password_here

# 服务器配置
PORT=9022
```

**重要说明**：
- `ES_HOST=host.docker.internal` 用于从容器内访问宿主机的其他容器
- `ES_PORT=3402` 修改为目标 ES 服务的端口
- 如果 ES 服务在 Docker 网络中，使用容器名或服务名替代 `host.docker.internal`

### 4. 构建 Docker 镜像

#### 清理旧镜像（可选）

```bash
# 清理悬空镜像
docker image prune -f

# 清理停止的容器
docker container prune -f

# 删除特定镜像
docker rmi es-manager:latest
```

#### 构建新镜像

```bash
# 构建镜像
docker build -t es-manager:latest .

# 或无缓存构建（确保获取最新更改）
docker build --no-cache -t es-manager:latest .
```

### 5. 运行容器

```bash
# 运行容器
docker run -d \
  -p 8080:80 \
  -p 9021:9021 \
  --name es-manager-app \
  es-manager:latest
```

**端口映射说明**：
- `8080:80` - 前端 Web 界面
- `9021:9021` - 后端 API 服务

### 6. 验证部署

#### 检查容器状态
```bash
docker ps
```

#### 查看容器日志
```bash
docker logs es-manager-app
```

期望输出：
```
Starting ES Manager Application...
Backend API will be available on port 9021
Frontend will be available on port 80
配置加载完成:
- 服务器地址: 0.0.0.0:9021
- ES节点: http://host.docker.internal:3402
- ES认证: 已启用
ES Manager Server running at http://0.0.0.0:9021
```

#### 访问应用
- **前端界面**: http://localhost:8080
- **后端 API**: http://localhost:9021
- **健康检查**: http://localhost:9021/health

## Docker 镜像详情

### 多阶段构建

Dockerfile 采用多阶段构建优化镜像大小：

1. **前端构建阶段** (`frontend-builder`)
   - 基于 `node:18-alpine`
   - 安装依赖并构建 Vue.js 应用
   - 生成静态文件到 `dist/` 目录

2. **运行时阶段** (`node:18-alpine`)
   - 安装 Nginx 和 curl
   - 复制后端代码并安装生产依赖
   - 复制前端构建文件到 Nginx 目录
   - 配置启动脚本

### 镜像大小
- 最终镜像大小约 **260MB**
- 包含完整的前后端应用和 Nginx 代理

## 配置自定义

### 环境变量

支持的环境变量：

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `ES_PROTOCOL` | `http` | ES 协议 |
| `ES_HOST` | `localhost` | ES 主机地址 |
| `ES_PORT` | `9200` | ES 端口 |
| `ES_USERNAME` | `elastic` | ES 用户名 |
| `ES_PASSWORD` | `your_password_here` | ES 密码 |
| `PORT` | `9022` | 后端服务端口 |

### 网络配置

#### 连接宿主机服务
```bash
ES_HOST=host.docker.internal
```

#### 连接同 Docker 网络服务
```bash
ES_HOST=elasticsearch-container
```

#### 连接外部服务
```bash
ES_HOST=your-es-server.com
```

## 故障排除

### 1. Docker 连接问题
```bash
# 检查 Docker 状态
docker info

# 重启 Docker Desktop
killall Docker && open -a Docker
```

### 2. 容器无法连接 ES
- 检查 ES 服务是否运行在指定端口
- 验证网络连接：`docker exec es-manager-app curl http://host.docker.internal:3402`
- 查看容器日志确认配置

### 3. 前端无法访问
- 确认端口映射正确：`-p 8080:80`
- 检查 Nginx 配置和进程状态

### 4. 构建失败
- 清理 Docker 缓存：`docker system prune -a`
- 检查网络连接和 npm 镜像源
- 确保 package.json 文件完整

## 开发模式 vs 生产模式

### 开发模式（推荐用于测试）
```bash
# 使用快速启动脚本
./quick-start.sh

# 或手动启动
npm install
npm run server &
npm run dev
```

### 生产模式（Docker 部署）
```bash
# 构建并运行容器
docker build -t es-manager:latest .
docker run -d -p 8080:80 -p 9021:9021 --name es-manager-app es-manager:latest
```

## 更新部署

```bash
# 停止并删除旧容器
docker stop es-manager-app && docker rm es-manager-app

# 重新构建镜像
docker build -t es-manager:latest .

# 运行新容器
docker run -d -p 8080:80 -p 9021:9021 --name es-manager-app es-manager:latest
```

## 最佳实践

1. **版本管理**：为镜像打标签 `es-manager:v1.0.0`
2. **配置外部化**：使用 Docker volumes 挂载配置文件
3. **日志管理**：配置日志驱动和轮转
4. **健康检查**：利用内置的健康检查端点
5. **安全性**：不在镜像中硬编码敏感信息

## 相关文档

- [快速开始指南](./quick-start.sh)
- [部署指南](./DEPLOY-GUIDE.md)
- [Docker 配置](./DOCKER.md)
- [本地部署教程](./LOCAL_DEPLOYMENT_TUTORIAL.md)