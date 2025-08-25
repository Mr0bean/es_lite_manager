#!/bin/bash

# ES Manager 部署脚本

set -e

echo "🚀 ES Manager 部署脚本"
echo "========================"

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，请先安装 Docker"
    exit 1
fi

# 检查 Docker Compose 是否安装
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose 未安装，请先安装 Docker Compose"
    exit 1
fi

echo "✅ Docker 环境检查通过"

# 创建 .env 文件（如果不存在）
if [ ! -f ".env" ]; then
    echo "📝 创建环境配置文件..."
    cp .env.example .env
    echo "✅ 已创建 .env 文件，您可以根据需要修改配置"
else
    echo "✅ 环境配置文件已存在"
fi

# 显示当前配置
echo ""
echo "📋 当前配置:"
echo "   前端地址: http://localhost:$(grep FRONTEND_PORT .env | cut -d'=' -f2 || echo '9021')"
echo "   后端API: http://localhost:$(grep PORT .env | cut -d'=' -f2 || echo '3000')"
echo "   Elasticsearch: http://localhost:9200"
echo ""

# 询问用户是否继续
read -p "🤔 是否继续部署？(y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ 部署已取消"
    exit 1
fi

echo "🔨 开始构建和部署..."

# 停止现有服务
echo "🛑 停止现有服务..."
docker-compose down 2>/dev/null || true

# 构建并启动服务
echo "🏗️  构建镜像..."
docker-compose build

echo "🚀 启动服务..."
docker-compose up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
echo "🔍 检查服务状态..."
docker-compose ps

echo ""
echo "🎉 部署完成！"
echo "========================"
echo "📱 前端界面: http://localhost:$(grep FRONTEND_PORT .env | cut -d'=' -f2 || echo '9021')"
echo "🔧 后端API: http://localhost:$(grep PORT .env | cut -d'=' -f2 || echo '3000')"
echo "🔍 Elasticsearch: http://localhost:9200"
echo ""
echo "📝 常用命令:"
echo "   查看日志: docker-compose logs -f"
echo "   停止服务: docker-compose down"
echo "   重启服务: docker-compose restart"
echo ""
echo "📖 更多信息请查看 DOCKER_DEPLOY.md"