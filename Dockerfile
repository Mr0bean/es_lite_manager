# 多阶段构建：第一阶段构建前端
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# 复制前端相关文件
COPY package*.json ./
COPY vite.config.js ./
COPY index.html ./
COPY src/ ./src/

# 安装依赖并构建前端
RUN npm config set registry https://registry.npmmirror.com/ && \
    npm install --production=false && \
    npm run build

# 第二阶段：运行时镜像
FROM node:18-alpine

# 安装nginx和必要的系统依赖
RUN apk add --no-cache nginx curl

# 设置工作目录
WORKDIR /app

# 复制后端相关文件
COPY package*.json ./
COPY server/ ./server/

# 安装后端依赖（仅生产环境）
RUN npm ci --only=production

# 从构建阶段复制前端构建文件
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

# 复制nginx配置
RUN mkdir -p /etc/nginx/conf.d
COPY nginx.conf /etc/nginx/nginx.conf

# 创建日志目录
RUN mkdir -p /app/logs /var/log/nginx

# 暴露端口 (nginx前端80, 后端API 3501)
EXPOSE 80 3501

# 设置环境变量
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3501

# 创建启动脚本
RUN printf '#!/bin/sh\n\
echo "Starting ES Manager Application..."\n\
echo "Backend API will be available on port $PORT"\n\
echo "Frontend will be available on port 80"\n\
echo "Nginx proxy will handle API requests at /api/*"\n\
\n\
# 启动nginx\n\
nginx &\n\
\n\
# 启动后端API服务器\n\
cd /app\n\
node server/index.js &\n\
\n\
# 等待所有后台进程\n\
wait\n' > /app/start.sh && chmod +x /app/start.sh

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/health && curl -f http://localhost:3501/health || exit 1

# 启动应用
ENTRYPOINT ["/app/start.sh"]