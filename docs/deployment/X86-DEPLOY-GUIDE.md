# X86/AMD64 架构部署指南

## ✅ X86架构镜像已构建完成

### 镜像信息
- **架构**: X86_64 / AMD64
- **镜像名**: `es-manager-es-app:linux-amd64`
- **镜像大小**: 262MB (原始) / 83MB (压缩)
- **适用系统**: Linux X86_64 服务器

### 导出的文件

1. **X86 Docker镜像** (83MB)
   - `es-manager-app-x86.tar.gz` - X86/AMD64架构镜像文件

2. **X86 完整部署包** (83MB)
   - `es-manager-deploy-x86.tar.gz` - X86架构专用部署包

## X86部署包内容

```
deploy-package-x86/
├── es-manager-app-x86.tar.gz     # X86/AMD64 Docker镜像
├── docker-compose.yml            # 指定amd64镜像的编排配置
├── nginx.conf                   # Nginx配置文件
├── deploy.sh                   # X86架构自动部署脚本
├── .env.example               # 环境变量示例
└── README.md                 # X86架构部署说明
```

## X86服务器部署步骤

### 方式一：自动部署（推荐）

1. **上传X86部署包到服务器**
```bash
scp es-manager-deploy-x86.tar.gz user@server:/opt/
```

2. **解压并自动部署**
```bash
cd /opt
tar -xzf es-manager-deploy-x86.tar.gz
cd deploy-package-x86
chmod +x deploy.sh
./deploy.sh
```

部署脚本会自动：
- ✅ 检测系统架构 (验证为x86_64)
- ✅ 导入X86镜像 (`es-manager-es-app:linux-amd64`)
- ✅ 验证镜像架构匹配
- ✅ 启动服务并进行健康检查

### 方式二：手动部署

1. **导入X86镜像**
```bash
gunzip -c es-manager-app-x86.tar.gz | docker load
```

2. **验证架构**
```bash
docker inspect es-manager-es-app:linux-amd64 --format='{{.Architecture}}'
# 输出: amd64
```

3. **启动服务**
```bash
docker-compose up -d
```

## 架构兼容性

### ✅ 支持的系统
- Ubuntu 18.04+ (x86_64)
- CentOS 7+ (x86_64)
- RHEL 7+ (x86_64)
- Debian 9+ (x86_64)
- Amazon Linux 2 (x86_64)

### ❌ 不支持的架构
- ARM64 / AArch64
- ARM32
- MIPS
- PowerPC

## 验证部署

部署完成后验证：

```bash
# 1. 检查系统架构
uname -m
# 输出: x86_64

# 2. 验证镜像架构
docker inspect es-manager-es-app:linux-amd64 --format='{{.Architecture}}'
# 输出: amd64

# 3. 访问应用
curl http://localhost:8080/api/health
# 应返回健康状态JSON
```

## 访问地址

- **前端界面**: http://服务器IP:8080
- **API接口**: http://服务器IP:8080/api/*
- **ES集群**: http://服务器IP:9200

## 性能特点

### X86架构优势
- ✅ 成熟稳定的架构支持
- ✅ 广泛的软件兼容性
- ✅ 优化的性能表现
- ✅ 丰富的工具生态

### 推荐配置
- **CPU**: 2+ cores x86_64
- **内存**: 4GB+ RAM
- **存储**: 20GB+ SSD
- **网络**: 100Mbps+

## 故障排除

### 架构不匹配
如果遇到 "exec format error"：

```bash
# 检查系统架构
uname -m
# 如果不是 x86_64，需要使用对应架构的镜像
```

### 性能优化
```bash
# CPU亲和性设置
docker-compose down
# 编辑 docker-compose.yml 添加 cpuset 配置

# 内存优化
vim docker-compose.yml
# 调整 ES_JAVA_OPTS 内存设置
```

## 生产环境建议

1. **硬件要求**
   - 使用SSD存储提升I/O性能
   - 配置足够的内存避免swap
   - 确保网络带宽充足

2. **系统优化**
   - 调整Linux内核参数
   - 配置防火墙规则
   - 设置定时备份

3. **监控告警**
   - 配置资源监控
   - 设置健康检查
   - 建立日志收集

## 升级和维护

```bash
# 备份当前版本
docker save es-manager-es-app:linux-amd64 | gzip > backup.tar.gz

# 导入新版本
gunzip -c new-es-manager-app-x86.tar.gz | docker load

# 滚动更新
docker-compose up -d
```

此X86版本已针对AMD64架构优化，确保在X86_64服务器上获得最佳性能和兼容性。