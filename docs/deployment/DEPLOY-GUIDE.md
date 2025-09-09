# 服务器部署指南

## 导出的文件

### 1. Docker镜像
- **文件**: `es-manager-app.tar.gz` (83MB)
- **镜像名**: `es-manager-es-app:latest`
- **用途**: 包含前后端一体化应用

### 2. 部署包
- **文件**: `es-manager-deploy.tar.gz` (82MB)
- **内容**: 完整的服务器部署包

## 部署包内容

```
deploy-package/
├── es-manager-app.tar.gz     # Docker镜像文件
├── docker-compose.yml        # 服务编排配置
├── nginx.conf               # Nginx配置文件
├── deploy.sh               # 自动部署脚本
├── .env.example           # 环境变量示例
└── README.md             # 详细部署说明
```

## 服务器部署步骤

### 方式一：自动部署（推荐）

1. **上传部署包到服务器**
```bash
scp es-manager-deploy.tar.gz user@server:/opt/
```

2. **解压并部署**
```bash
cd /opt
tar -xzf es-manager-deploy.tar.gz
cd deploy-package
chmod +x deploy.sh
./deploy.sh
```

### 方式二：手动部署

1. **上传文件**
```bash
# 上传镜像文件
scp es-manager-app.tar.gz user@server:/opt/

# 上传配置文件
scp docker-compose.yml nginx.conf user@server:/opt/
```

2. **导入镜像**
```bash
gunzip -c es-manager-app.tar.gz | docker load
```

3. **启动服务**
```bash
docker-compose up -d
```

## 验证部署

部署完成后，访问以下地址验证：

- **前端界面**: http://服务器IP:8080
- **API健康检查**: http://服务器IP:8080/api/health
- **ES集群状态**: http://服务器IP:9200/_cluster/health

## 端口说明

| 服务 | 内部端口 | 外部端口 | 说明 |
|------|----------|----------|------|
| 前端 | 80 | 8080 | Web界面访问 |
| 后端API | 9021 | 9021 | API接口 |
| Elasticsearch | 9200 | 9200 | ES服务 |

## 服务管理命令

```bash
# 启动服务
docker-compose up -d

# 停止服务  
docker-compose down

# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 重启应用
docker-compose restart es-app
```

## 注意事项

1. **系统要求**
   - Linux服务器 (Ubuntu 18.04+ / CentOS 7+)
   - Docker 20.10+
   - Docker Compose 1.29+
   - 至少2GB内存

2. **防火墙配置**
```bash
# Ubuntu
sudo ufw allow 8080
sudo ufw allow 9200

# CentOS
sudo firewall-cmd --permanent --add-port=8080/tcp
sudo firewall-cmd --permanent --add-port=9200/tcp
sudo firewall-cmd --reload
```

3. **生产环境建议**
   - 启用ES安全认证
   - 配置HTTPS证书
   - 设置资源限制
   - 配置日志轮转

## 故障排除

如果遇到问题，请检查：

1. **查看服务状态**
```bash
docker-compose ps
```

2. **查看日志**
```bash
docker-compose logs es-app
docker-compose logs elasticsearch
```

3. **检查端口占用**
```bash
netstat -tulpn | grep :8080
netstat -tulpn | grep :9200
```

4. **重新部署**
```bash
docker-compose down
docker-compose up -d
```