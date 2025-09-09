# Docker 部署文档

本文档说明如何使用 Docker 打包和部署 Elasticsearch 管理应用（前后端一体化）。

## 镜像信息

- **镜像名称**: `es-manager-es-app`
- **容器名称**: `es-app`
- **项目名称**: `es-manager`

## 文件结构

```
├── Dockerfile              # 应用镜像构建文件
├── docker-compose.yml      # 编排配置文件
├── nginx.conf              # Nginx配置文件
├── .dockerignore           # Docker忽略文件
└── package.json            # 包含Docker相关脚本
```

## 快速部署

### 1. 构建并启动服务

```bash
# 方式一：使用npm脚本（推荐）
npm run docker:up

# 方式二：直接使用docker-compose
docker-compose up -d
```

### 2. 查看服务状态

```bash
# 查看容器状态
docker-compose ps

# 查看实时日志
npm run docker:logs
# 或
docker-compose logs -f
```

### 3. 访问应用

- **前端界面**: http://localhost:8080
- **后端API**: http://localhost:8080/api/*
- **Elasticsearch**: http://localhost:9200

## Docker 配置详解

### Dockerfile 说明

```dockerfile
FROM node:18-alpine                    # 基础镜像
WORKDIR /app                          # 工作目录
COPY package*.json ./                 # 复制依赖文件
RUN npm install                       # 安装依赖
COPY . .                             # 复制源代码
RUN npm run build                    # 构建前端
EXPOSE 3000 9021                     # 暴露端口
```

### docker-compose.yml 配置

#### Elasticsearch 服务
```yaml
elasticsearch:
  image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
  ports: ["9200:9200", "9300:9300"]
  environment:
    - discovery.type=single-node
    - xpack.security.enabled=false
```

#### 应用服务
```yaml
es-app:
  build: .
  ports: 
    - "8080:80"    # 前端端口（通过nginx）
    - "9021:9021"  # 后端API端口
  environment:
    - NODE_ENV=production
    - ES_HOST=elasticsearch
```

### nginx.conf 配置

- **静态文件服务**: 前端构建文件托管在 `/usr/share/nginx/html`
- **API代理**: `/api/*` 请求转发到后端 `localhost:9021`
- **路径重写**: `rewrite ^/api/(.*)$ /$1 break`

## 常用命令

### 构建相关

```bash
# 仅构建镜像
npm run docker:build
# 或
docker-compose build

# 强制重新构建
docker-compose build --no-cache
```

### 服务管理

```bash
# 启动服务
npm run docker:up

# 停止服务
npm run docker:down

# 重启应用容器
npm run docker:restart

# 查看日志
npm run docker:logs
```

### 调试命令

```bash
# 进入应用容器
docker-compose exec es-app sh

# 查看容器内进程
docker-compose exec es-app ps aux

# 测试API连接
docker-compose exec es-app curl http://localhost:9021/health
```

## 环境变量配置

可以通过环境变量自定义配置：

```bash
# 设置端口
export PORT=3000
export BACKEND_PORT=9021

# 设置ES连接
export ES_HOST=elasticsearch
export ES_PORT=9200
export ES_PROTOCOL=http

# 启动服务
docker-compose up -d
```

## 数据持久化

### 日志持久化
```yaml
volumes:
  - ./logs:/app/logs  # 应用日志映射到本地
```

### ES数据持久化
```yaml
volumes:
  - es_data:/usr/share/elasticsearch/data
```

## 健康检查

### 应用健康检查
- **检查地址**: `http://localhost:8080/api/health`
- **检查间隔**: 30秒
- **超时时间**: 10秒
- **重试次数**: 3次

### ES健康检查
- **检查命令**: `curl -f http://localhost:9200/_cluster/health`
- **检查间隔**: 30秒

## 故障排除

### 常见问题

1. **API 404错误**
   - 检查nginx配置中的proxy_pass设置
   - 确认路径重写规则正确

2. **容器启动失败**
   ```bash
   # 查看详细日志
   docker-compose logs es-app
   
   # 检查端口占用
   netstat -tulpn | grep :8080
   ```

3. **ES连接失败**
   ```bash
   # 检查ES容器状态
   docker-compose ps elasticsearch
   
   # 测试ES连接
   curl http://localhost:9200/_cluster/health
   ```

### 完全重置

```bash
# 停止并删除所有容器
docker-compose down

# 删除镜像
docker rmi es-manager-es-app

# 重新构建和启动
npm run docker:build
npm run docker:up
```

## 生产环境注意事项

1. **安全配置**
   - 启用ES安全认证
   - 配置HTTPS
   - 设置防火墙规则

2. **性能优化**
   - 调整ES内存设置
   - 配置nginx缓存
   - 启用gzip压缩

3. **监控和日志**
   - 配置日志轮转
   - 设置监控报警
   - 备份重要数据

## 更新升级

```bash
# 拉取最新代码
git pull

# 重新构建镜像
docker-compose build --no-cache

# 重启服务
docker-compose up -d
```