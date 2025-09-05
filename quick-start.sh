#!/bin/bash

# ES Lite Manager 快速启动脚本
# Quick Start Script for ES Lite Manager

# 创建日志目录
LOG_DIR="logs"
[ ! -d "$LOG_DIR" ] && mkdir -p "$LOG_DIR"

# 日志文件
LOG_FILE="$LOG_DIR/deployment-$(date +%Y%m%d-%H%M%S).log"

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

echo "🚀 ES Lite Manager 快速部署 / Quick Deployment"
echo "=================================================="

# 检查 Node.js 和 npm
echo "📋 检查环境 / Checking environment..."
node --version >/dev/null 2>&1 || { echo "❌ 请安装 Node.js >= 16.0.0 / Please install Node.js >= 16.0.0"; exit 1; }
npm --version >/dev/null 2>&1 || { echo "❌ 请安装 npm >= 7.0.0 / Please install npm >= 7.0.0"; exit 1; }

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js 版本过低，需要 >= 16.0.0 / Node.js version too low, require >= 16.0.0"
    exit 1
fi

echo "✅ Node.js $(node --version) 和 npm $(npm --version) 检查通过 / Node.js and npm check passed"

# 安装依赖
echo ""
echo "📦 安装依赖 / Installing dependencies..."
npm install

# 设置环境配置文件
echo ""
echo "⚙️  配置环境文件 / Setting up environment files..."

if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "✅ 前端配置文件已创建 / Frontend config created (.env)"
else
    echo "ℹ️  前端配置文件已存在 / Frontend config exists (.env)"
fi

if [ ! -f "server/.env" ]; then
    cp server/.env.example server/.env
    echo "✅ 后端配置文件已创建 / Backend config created (server/.env)"
else
    echo "ℹ️  后端配置文件已存在 / Backend config exists (server/.env)"
fi

# 检查端口占用
echo ""
echo "🔍 检查端口占用 / Checking port usage..."

check_port() {
    local port=$1
    local service=$2
    if lsof -i :$port >/dev/null 2>&1; then
        echo "⚠️  端口 $port 被占用 / Port $port is in use ($service)"
        echo "   使用以下命令查看占用进程 / Use this command to check the process:"
        echo "   lsof -i :$port"
        return 1
    else
        echo "✅ 端口 $port 可用 / Port $port is available ($service)"
        return 0
    fi
}

PORT_3420_OK=true
PORT_9022_OK=true

check_port 3420 "前端/Frontend" || PORT_3420_OK=false
check_port 9022 "后端/Backend" || PORT_9022_OK=false

if [ "$PORT_3420_OK" = false ] || [ "$PORT_9022_OK" = false ]; then
    echo ""
    echo "⚠️  请先解决端口冲突，然后重新运行此脚本"
    echo "⚠️  Please resolve port conflicts first, then run this script again"
    echo ""
    echo "💡 解决方案 / Solutions:"
    echo "   1. 终止占用进程 / Kill the process: kill -9 <PID>"
    echo "   2. 或修改配置使用其他端口 / Or modify config to use different ports"
    exit 1
fi

# 启动服务
echo ""
echo "🚀 启动服务 / Starting services..."
echo "=================================================="

# 启动后端服务
echo "🌟 启动后端服务 / Starting backend server..."
echo "   端口 / Port: 9022"
echo "   日志 / Logs: 后端服务器输出将显示在下方 / Backend server output will be shown below"
npm run server &
BACKEND_PID=$!

# 等待后端启动
echo "⏳ 等待后端启动 / Waiting for backend to start..."
sleep 3

# 检查后端是否成功启动
if kill -0 $BACKEND_PID 2>/dev/null; then
    echo "✅ 后端服务已启动 / Backend server started (PID: $BACKEND_PID)"
else
    echo "❌ 后端服务启动失败 / Backend server failed to start"
    exit 1
fi

# 启动前端服务
echo ""
echo "🎨 启动前端开发服务 / Starting frontend dev server..."
echo "   端口 / Port: 3420"
echo "   日志 / Logs: 前端服务器输出将显示在下方 / Frontend server output will be shown below"
npm run dev &
FRONTEND_PID=$!

# 等待前端启动
echo "⏳ 等待前端启动 / Waiting for frontend to start..."
sleep 5

# 检查前端是否成功启动
if kill -0 $FRONTEND_PID 2>/dev/null; then
    echo "✅ 前端服务已启动 / Frontend server started (PID: $FRONTEND_PID)"
else
    echo "❌ 前端服务启动失败 / Frontend server failed to start"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# 验证服务连通性
echo ""
echo "🔍 验证服务连通性 / Verifying service connectivity..."
sleep 2

# 检查后端健康状态
if curl -s http://localhost:9022/health >/dev/null 2>&1; then
    echo "✅ 后端 API 连通性正常 / Backend API connectivity OK"
else
    echo "⚠️  后端 API 可能还在启动中 / Backend API may still be starting up"
fi

# 检查前端页面
if curl -s http://localhost:3420/ >/dev/null 2>&1; then
    echo "✅ 前端页面连通性正常 / Frontend page connectivity OK"
else
    echo "⚠️  前端页面可能还在启动中 / Frontend page may still be starting up"
fi

# 显示成功信息
echo ""
echo "🎉 部署完成！/ Deployment complete!"
echo "=================================================="
echo "📱 前端应用 / Frontend:  http://localhost:3420"
echo "🔧 后端 API / Backend:   http://localhost:9022"
echo "🏥 健康检查 / Health:     http://localhost:9022/health"
echo ""
echo "💡 提示 / Tips:"
echo "   • 在浏览器中打开 http://localhost:3420 开始使用"
echo "   • Open http://localhost:3420 in your browser to start using"
echo "   • 如果需要配置 Elasticsearch，请访问连接管理页面"
echo "   • To configure Elasticsearch, visit the Connection Management page"
echo ""

# 询问是否自动打开浏览器
echo "🌐 是否自动打开浏览器？/ Open browser automatically? (y/n)"
read -t 10 -n 1 open_browser
echo ""

if [[ $open_browser == "y" || $open_browser == "Y" ]]; then
    echo "🚀 正在打开浏览器... / Opening browser..."
    if command -v open >/dev/null 2>&1; then
        # macOS
        open http://localhost:3420
    elif command -v xdg-open >/dev/null 2>&1; then
        # Linux
        xdg-open http://localhost:3420
    elif command -v start >/dev/null 2>&1; then
        # Windows
        start http://localhost:3420
    else
        echo "⚠️  无法自动打开浏览器，请手动访问 / Cannot auto-open browser, please visit manually"
    fi
fi

echo ""
echo "⏹️  按 Ctrl+C 停止所有服务 / Press Ctrl+C to stop all services"

# 设置信号处理
cleanup() {
    echo ""
    log "🛑 正在停止服务 / Stopping services..."
    kill $BACKEND_PID 2>/dev/null && log "✅ 后端服务已停止 / Backend stopped"
    kill $FRONTEND_PID 2>/dev/null && log "✅ 前端服务已停止 / Frontend stopped"
    log "📄 日志已保存到 / Log saved to: $LOG_FILE"
    echo "👋 再见！/ Goodbye!"
    exit 0
}

trap cleanup SIGINT SIGTERM

# 等待用户中断
wait