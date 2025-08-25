# 服务器配置说明

## 配置文件结构

### config.js
主配置文件，包含Elasticsearch连接配置和服务器配置。支持环境变量和默认值。

### .env (可选)
环境变量配置文件，用于覆盖默认配置。

## 配置方式

### 方法1：使用环境变量文件

1. 复制示例配置文件：
```bash
cp .env.example .env
```

2. 编辑 `.env` 文件，修改相应配置：
```env
# Elasticsearch 连接配置
ES_NODE=http://your-es-host:9200
ES_USERNAME=your-username
ES_PASSWORD=your-password

# 服务器配置
SERVER_PORT=9022
```

### 方法2：直接修改config.js

直接编辑 `config.js` 文件中的默认值。

### 方法3：使用系统环境变量

```bash
export ES_NODE=http://your-es-host:9200
export ES_USERNAME=your-username
export ES_PASSWORD=your-password
node index.js
```

## 配置项说明

### Elasticsearch 配置

| 环境变量 | 默认值 | 说明 |
|---------|--------|------|
| ES_NODE | http://localhost:9200 | Elasticsearch节点地址 |
| ES_USERNAME | elastic | 用户名 |
| ES_PASSWORD | your_password_here | 密码 |
| ES_REQUEST_TIMEOUT | 30000 | 请求超时时间(ms) |
| ES_PING_TIMEOUT | 3000 | Ping超时时间(ms) |
| ES_MAX_RETRIES | 3 | 最大重试次数 |

### 服务器配置

| 环境变量 | 默认值 | 说明 |
|---------|--------|------|
| SERVER_PORT | 9022 | 服务器端口 |
| CORS_ORIGIN | * | CORS允许的源 |

## 安全建议

1. **不要将 `.env` 文件提交到版本控制系统**
2. **生产环境建议使用环境变量而不是配置文件**
3. **定期更换密码**
4. **限制CORS_ORIGIN到具体域名**

## 启动服务器

```bash
node index.js
```

启动时会显示当前使用的配置信息。