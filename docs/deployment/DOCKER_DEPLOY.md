# Docker 部署指南

本项目已经完全容器化，支持通过 Docker 和 Docker Compose 进行部署。

## 快速开始

### 1. 使用 Docker Compose（推荐）

```bash
# 克隆项目
git clone git@github.com:Mr0bean/es_lite_manager.git
cd es_lite_manager

# 复制环境变量配置文件
cp .env.example .env

# 编辑环境变量（可选）
vim .env

# 启动所有服务（包含 Elasticsearch 和前端应用）
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 2. 仅构建应用镜像

```bash
# 构建镜像
docker build -t es-manager .

# 运行容器（需要外部 Elasticsearch）
docker run -d \
  --name es-manager \
  -p 3000:3000 \
  -p 9021:4173 \
  -e HOST=0.0.0.0 \
  -e PORT=3000 \
  -e FRONTEND_PORT=4173 \
  -e ES_HOST=your-es-host \
  -e ES_PORT=9200 \
  -e ES_PROTOCOL=http \
  es-manager
```

## 环境变量配置

### 服务器配置
- `HOST`: 服务器绑定地址（默认: 0.0.0.0）
- `PORT`: 后端 API 端口（默认: 3000）
- `FRONTEND_PORT`: 前端服务端口（默认: 4173）
- `NODE_ENV`: 运行环境（默认: production）

### Elasticsearch 配置
- `ES_HOST`: Elasticsearch 主机地址（默认: localhost）
- `ES_PORT`: Elasticsearch 端口（默认: 9200）
- `ES_PROTOCOL`: 连接协议（默认: http）
- `ES_USERNAME`: 用户名（可选，用于认证）
- `ES_PASSWORD`: 密码（可选，用于认证）

### CORS 配置
- `CORS_ORIGIN`: 允许的跨域来源（默认: *）

## 服务访问

启动成功后，可以通过以下地址访问服务：

- **前端界面**: http://localhost:4173
- **后端 API**: http://localhost:3000
- **健康检查**: http://localhost:3000/health
- **Elasticsearch**: http://localhost:9200（如果使用 docker-compose）

## 常用命令

```bash
# 停止服务
docker-compose down

# 重新构建并启动
docker-compose up --build -d

# 查看容器日志
docker-compose logs es-frontend
docker-compose logs elasticsearch

# 进入容器
docker-compose exec es-frontend sh

# 清理所有数据
docker-compose down -v
```

## 生产环境部署建议

1. **安全配置**
   - 设置强密码和用户认证
   - 限制 CORS 来源
   - 使用 HTTPS

2. **性能优化**
   - 调整 Elasticsearch JVM 内存
   - 配置适当的资源限制
   - 使用外部数据卷

3. **监控和日志**
   - 配置日志收集
   - 设置健康检查
   - 监控资源使用情况

## 故障排除

### 常见问题

1. **容器启动失败**
   ```bash
   # 查看详细日志
   docker-compose logs es-frontend
   ```

2. **无法连接 Elasticsearch**
   - 检查 ES_HOST 配置
   - 确认 Elasticsearch 服务正常运行
   - 检查网络连接

3. **前端无法访问**
   - 检查端口映射
   - 确认防火墙设置
   - 查看容器状态

### 健康检查

```bash
# 检查后端 API
curl http://localhost:3000/health

# 检查 Elasticsearch
curl http://localhost:9200/_cluster/health
```

## 开发环境

如果需要在开发环境中使用 Docker：

```bash
# 仅启动 Elasticsearch
docker-compose up elasticsearch -d

# 本地运行前端和后端
npm run dev
node server/index.js
```
