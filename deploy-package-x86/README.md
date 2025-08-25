# ES Manager X86/AMD64 服务器部署包

## 架构说明

此部署包专门为 **X86/AMD64** 架构的服务器构建，包含针对该架构优化的Docker镜像。

- **支持架构**: X86_64 / AMD64
- **镜像名称**: `es-manager-es-app:linux-amd64`
- **镜像大小**: 83MB (压缩后)

## 部署包内容

- `es-manager-app-x86.tar.gz` - X86/AMD64 架构应用镜像
- `docker-compose.yml` - Docker编排配置 (指定amd64镜像)
- `nginx.conf` - Nginx配置文件
- `deploy.sh` - X86架构自动部署脚本
- `.env.example` - 环境变量示例
- `README.md` - 部署说明

## 系统要求

- **操作系统**: Linux (Ubuntu 18.04+ / CentOS 7+ / RHEL 7+)
- **架构**: X86_64 / AMD64
- **Docker**: 20.10+
- **Docker Compose**: 1.29+
- **内存**: 最少 2GB RAM
- **端口**: 8080, 9021, 9200 可用

## 快速部署

### 1. 验证系统架构

```bash
# 检查系统架构
uname -m
# 应该输出: x86_64
```

### 2. 上传部署包到服务器

```bash
# 上传到服务器
scp es-manager-deploy-x86.tar.gz user@server:/opt/

# 登录服务器
ssh user@server
cd /opt
```

### 3. 解压并部署

```bash
# 解压部署包
tar -xzf es-manager-deploy-x86.tar.gz
cd deploy-package-x86

# 执行自动部署（推荐）
chmod +x deploy.sh
./deploy.sh
```

## 手动部署

如果自动部署脚本失败，可以手动执行：

### 1. 导入X86镜像

```bash
# 导入应用镜像
gunzip -c es-manager-app-x86.tar.gz | docker load

# 验证镜像
docker images | grep es-manager
docker inspect es-manager-es-app:linux-amd64 --format='{{.Architecture}}'
# 应该输出: amd64
```

### 2. 启动服务

```bash
# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

## 访问应用

部署成功后，通过以下地址访问：

- **前端界面**: http://服务器IP:8080
- **后端API**: http://服务器IP:8080/api/
- **ES管理**: http://服务器IP:9200

## 架构验证

部署后可以验证架构匹配：

```bash
# 检查容器架构
docker inspect es-app --format='{{.Platform}}'

# 检查镜像架构
docker inspect es-manager-es-app:linux-amd64 --format='{{.Architecture}}'

# 检查系统架构
uname -m
```

## 性能优化 (X86/AMD64)

针对X86架构的优化建议：

### 1. CPU优化
```bash
# 检查CPU信息
lscpu

# 设置CPU亲和性（可选）
docker-compose down
# 编辑 docker-compose.yml 添加:
# cpuset: "0,1"  # 绑定到特定CPU核心
```

### 2. 内存优化
```bash
# 调整ES内存设置
vim docker-compose.yml
# 修改: "ES_JAVA_OPTS=-Xms1g -Xmx1g"  # 根据服务器内存调整
```

### 3. 存储优化
```bash
# 使用SSD存储（如果可用）
# 修改 docker-compose.yml 中的volumes配置
```

## 故障排除

### 1. 架构不匹配错误

如果遇到架构相关错误：

```bash
# 检查系统架构
uname -m

# 检查Docker架构支持
docker version --format '{{.Server.Arch}}'

# 如果是ARM架构，需要使用ARM版本的部署包
```

### 2. 性能问题

```bash
# 检查系统资源
htop
df -h
free -h

# 检查Docker资源使用
docker stats

# 调整资源限制
vim docker-compose.yml
# 添加资源限制配置
```

### 3. 网络问题

```bash
# 检查端口占用
netstat -tulpn | grep :8080
netstat -tulpn | grep :9200

# 检查防火墙
systemctl status firewalld  # CentOS/RHEL
systemctl status ufw        # Ubuntu

# 开放端口
firewall-cmd --permanent --add-port=8080/tcp  # CentOS/RHEL
ufw allow 8080                                 # Ubuntu
```

## 服务管理

### 常用命令

```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 查看日志
docker-compose logs -f es-app

# 更新应用
docker-compose pull  # 如果使用远程镜像
docker-compose up -d
```

### 备份和恢复

```bash
# 备份ES数据
docker-compose exec elasticsearch curl -X PUT "localhost:9200/_snapshot/backup" -H 'Content-Type: application/json'

# 备份配置
tar -czf config-backup.tar.gz docker-compose.yml nginx.conf .env
```

## 生产环境建议

### 1. 安全配置

```bash
# 启用ES安全认证
# 修改 docker-compose.yml:
# - xpack.security.enabled=true

# 配置HTTPS
# 添加SSL证书和nginx HTTPS配置
```

### 2. 监控配置

```bash
# 添加监控容器（可选）
# 如: Prometheus + Grafana
```

### 3. 日志管理

```bash
# 配置日志轮转
vim /etc/docker/daemon.json
# 添加:
# {
#   "log-driver": "json-file",
#   "log-opts": {
#     "max-size": "10m",
#     "max-file": "3"
#   }
# }
```

## 技术支持

如遇X86架构相关问题，请检查：

1. **系统架构**: 确认为x86_64
2. **Docker版本**: 支持多架构
3. **镜像架构**: 使用正确的amd64镜像
4. **资源配置**: 满足最低要求

更多问题请参考通用部署文档或联系技术支持。