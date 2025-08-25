#!/bin/bash

# ES Manager X86/AMD64 部署脚本
# 用于在 X86/AMD64 服务器上快速部署应用

echo "=== ES Manager X86/AMD64 部署脚本 ==="

# 检查架构
ARCH=$(uname -m)
echo "检测到系统架构: $ARCH"

if [[ "$ARCH" != "x86_64" && "$ARCH" != "amd64" ]]; then
    echo "警告: 当前系统架构为 $ARCH，但此镜像专为 X86/AMD64 架构构建"
    echo "建议在 X86/AMD64 服务器上运行此部署脚本"
    read -p "是否继续? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "错误: Docker 未安装，请先安装 Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "错误: Docker Compose 未安装，请先安装 Docker Compose"
    exit 1
fi

# 停止现有服务
echo "1. 停止现有服务..."
docker-compose down

# 导入X86镜像
if [ -f "es-manager-app-x86.tar.gz" ]; then
    echo "2. 导入X86/AMD64应用镜像..."
    gunzip -c es-manager-app-x86.tar.gz | docker load
    echo "镜像导入完成: es-manager-es-app:linux-amd64"
else
    echo "警告: 未找到 es-manager-app-x86.tar.gz 镜像文件"
    echo "请确保镜像文件在当前目录"
    exit 1
fi

# 验证镜像架构
echo "3. 验证镜像架构..."
DOCKER_ARCH=$(docker inspect es-manager-es-app:linux-amd64 --format='{{.Architecture}}' 2>/dev/null)
if [ "$DOCKER_ARCH" = "amd64" ]; then
    echo "✅ 镜像架构验证通过: $DOCKER_ARCH"
else
    echo "❌ 镜像架构验证失败: $DOCKER_ARCH"
    exit 1
fi

# 启动服务
echo "4. 启动服务..."
docker-compose up -d

# 等待服务启动
echo "5. 等待服务启动..."
sleep 15

# 检查服务状态
echo "6. 检查服务状态..."
docker-compose ps

# 健康检查
echo "7. 进行健康检查..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if curl -f http://localhost:8080/api/health &> /dev/null; then
        echo "✅ 应用启动成功!"
        echo ""
        echo "=== 部署完成 ==="
        echo "系统架构: $ARCH"
        echo "镜像架构: amd64"
        echo ""
        echo "访问地址:"
        echo "- 前端界面: http://localhost:8080"
        echo "- 后端API: http://localhost:8080/api/"
        echo "- Elasticsearch: http://localhost:9200"
        echo ""
        echo "管理命令:"
        echo "- 查看日志: docker-compose logs -f"
        echo "- 停止服务: docker-compose down"
        echo "- 重启服务: docker-compose restart"
        exit 0
    fi
    
    echo "等待应用启动... ($((attempt + 1))/$max_attempts)"
    sleep 2
    attempt=$((attempt + 1))
done

echo "❌ 应用启动超时，请检查日志:"
echo "docker-compose logs"
echo ""
echo "可能的原因:"
echo "1. 系统资源不足"
echo "2. 端口被占用"
echo "3. 架构不兼容"
exit 1