#!/bin/bash

# ES Lite Manager 远程部署脚本
# 用于将最新版本部署到远程服务器

set -e

echo "🚀 ES Lite Manager 远程部署开始..."

# 配置变量
DOCKER_IMAGE_NAME="es-lite-manager"
DOCKER_TAG="latest"
CONTAINER_NAME="es-manager"
REMOTE_HOST=${REMOTE_HOST:-"your-server-ip"}
REMOTE_USER=${REMOTE_USER:-"root"}
REMOTE_PATH=${REMOTE_PATH:-"/opt/es-manager"}

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查必要的工具
check_requirements() {
    print_status "检查部署环境..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi
    
    print_success "环境检查通过"
}

# 构建本地镜像
build_image() {
    print_status "构建Docker镜像..."
    
    # 停止本地开发服务器
    print_status "停止本地开发服务器..."
    pkill -f "npm run server" || true
    pkill -f "npm run dev" || true
    
    # 构建镜像
    docker-compose build --no-cache
    
    # 标记镜像
    docker tag es-manager-es-app $DOCKER_IMAGE_NAME:$DOCKER_TAG
    
    print_success "镜像构建完成: $DOCKER_IMAGE_NAME:$DOCKER_TAG"
}

# 保存镜像为tar文件
save_image() {
    print_status "导出Docker镜像..."
    
    IMAGE_FILE="es-lite-manager-latest.tar"
    docker save -o $IMAGE_FILE $DOCKER_IMAGE_NAME:$DOCKER_TAG
    
    print_success "镜像已导出: $IMAGE_FILE"
    echo "镜像大小: $(du -h $IMAGE_FILE | cut -f1)"
}

# 创建部署配置
create_deployment_files() {
    print_status "准备部署文件..."
    
    # 创建临时目录
    TEMP_DIR="./deploy-temp"
    rm -rf $TEMP_DIR
    mkdir -p $TEMP_DIR
    
    # 复制必要文件
    cp docker-compose.yml $TEMP_DIR/
    cp .env.example $TEMP_DIR/
    cp -r deploy-package-x86/* $TEMP_DIR/ 2>/dev/null || true
    
    # 创建生产环境的docker-compose.yml
    cat > $TEMP_DIR/docker-compose.prod.yml << 'EOF'
name: es-manager-prod

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    container_name: es-cluster-prod
    environment:
      - node.name=es-node-1
      - cluster.name=es-prod-cluster
      - discovery.type=single-node
      - bootstrap.memory_lock=true
      - "ES_JAVA_OPTS=-Xms1g -Xmx1g"
      - xpack.security.enabled=false
      - xpack.security.enrollment.enabled=false
    ulimits:
      memlock:
        soft: -1
        hard: -1
    volumes:
      - es_data:/usr/share/elasticsearch/data
    ports:
      - "9200:9200"
      - "9300:9300"
    networks:
      - es-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:9200/_cluster/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 5

  es-app:
    image: es-lite-manager:latest
    container_name: es-app-prod
    environment:
      - NODE_ENV=production
      - HOST=0.0.0.0
      - PORT=3002
      - ES_HOST=elasticsearch
      - ES_PORT=9200
      - ES_PROTOCOL=http
      - CORS_ORIGIN=*
      - SERVER_PORT=3002
    ports:
      - "80:80"        # 前端nginx端口
      - "3002:3002"    # 后端API端口
    depends_on:
      elasticsearch:
        condition: service_healthy
    networks:
      - es-network
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3002/health"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  es_data:
    driver: local

networks:
  es-network:
    driver: bridge
EOF
    
    # 创建远程部署脚本
    cat > $TEMP_DIR/remote-deploy.sh << 'EOF'
#!/bin/bash

set -e

echo "🚀 在远程服务器上部署 ES Lite Manager..."

# 加载镜像
echo "📦 加载Docker镜像..."
docker load -i es-lite-manager-latest.tar

# 停止旧版本
echo "🔄 停止旧版本容器..."
docker-compose -f docker-compose.prod.yml down || true

# 清理旧镜像（可选）
# docker image prune -f

# 启动新版本
echo "🚀 启动新版本..."
docker-compose -f docker-compose.prod.yml up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 30

# 检查服务状态
echo "🔍 检查服务状态..."
docker-compose -f docker-compose.prod.yml ps

# 健康检查
echo "🏥 执行健康检查..."
if curl -f http://localhost/api/health &> /dev/null; then
    echo "✅ 服务部署成功！"
    echo "🌐 前端访问地址: http://your-server-ip"
    echo "🔧 后端API地址: http://your-server-ip:3002"
else
    echo "❌ 服务启动失败，请检查日志"
    docker-compose -f docker-compose.prod.yml logs
fi

echo "📊 查看运行状态:"
docker-compose -f docker-compose.prod.yml ps
EOF
    
    chmod +x $TEMP_DIR/remote-deploy.sh
    
    print_success "部署文件准备完成: $TEMP_DIR/"
}

# 打包部署文件
package_deployment() {
    print_status "打包部署文件..."
    
    DEPLOY_PACKAGE="es-manager-deploy-$(date +%Y%m%d-%H%M%S).tar.gz"
    
    tar -czf $DEPLOY_PACKAGE -C deploy-temp .
    tar -rf ${DEPLOY_PACKAGE%.gz} es-lite-manager-latest.tar
    gzip ${DEPLOY_PACKAGE%.gz}
    
    print_success "部署包创建完成: $DEPLOY_PACKAGE"
    echo "部署包大小: $(du -h $DEPLOY_PACKAGE | cut -f1)"
}

# 显示部署说明
show_deployment_instructions() {
    echo
    print_success "🎉 部署包准备完成！"
    echo
    echo "📋 部署说明:"
    echo "1. 将部署包上传到远程服务器:"
    echo "   scp $DEPLOY_PACKAGE $REMOTE_USER@$REMOTE_HOST:/tmp/"
    echo
    echo "2. 在远程服务器上解压并部署:"
    echo "   ssh $REMOTE_USER@$REMOTE_HOST"
    echo "   cd /tmp && tar -xzf $DEPLOY_PACKAGE"
    echo "   sudo ./remote-deploy.sh"
    echo
    echo "3. 服务地址:"
    echo "   前端: http://$REMOTE_HOST"
    echo "   API:  http://$REMOTE_HOST:3002"
    echo
    echo "🔧 管理命令:"
    echo "   查看状态: docker-compose -f docker-compose.prod.yml ps"
    echo "   查看日志: docker-compose -f docker-compose.prod.yml logs"
    echo "   重启服务: docker-compose -f docker-compose.prod.yml restart"
    echo "   停止服务: docker-compose -f docker-compose.prod.yml down"
    echo
}

# 清理临时文件
cleanup() {
    print_status "清理临时文件..."
    rm -rf deploy-temp
    rm -f es-lite-manager-latest.tar
    print_success "清理完成"
}

# 主函数
main() {
    echo "🔍 ES Lite Manager - Docker 远程部署工具"
    echo "=================================="
    
    check_requirements
    build_image
    save_image
    create_deployment_files
    package_deployment
    show_deployment_instructions
    
    read -p "是否清理临时文件？(y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cleanup
    fi
    
    print_success "✨ 部署准备完成！"
}

# 执行主函数
main "$@"