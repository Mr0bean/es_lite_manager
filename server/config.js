import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 加载环境变量 - 优先加载本地配置
dotenv.config({ path: path.join(__dirname, '.env.local') })
dotenv.config({ path: path.join(__dirname, '.env') })

// Elasticsearch 连接配置
export const esConfig = {
  node: `${process.env.ES_PROTOCOL || 'http'}://${process.env.ES_HOST || 'localhost'}:${process.env.ES_PORT || '9200'}`,
  auth: process.env.ES_USERNAME && process.env.ES_PASSWORD ? {
    username: process.env.ES_USERNAME,
    password: process.env.ES_PASSWORD
  } : undefined,
  // 可选配置
  requestTimeout: parseInt(process.env.ES_REQUEST_TIMEOUT) || 30000,
  pingTimeout: parseInt(process.env.ES_PING_TIMEOUT) || 3000,
  sniffOnStart: false,
  sniffInterval: false,
  sniffOnConnectionFault: false,
  maxRetries: parseInt(process.env.ES_MAX_RETRIES) || 3,
  resurrectStrategy: 'ping'
}

// 服务器配置
export const serverConfig = {
  host: process.env.HOST || '0.0.0.0',
  port: parseInt(process.env.PORT) || 3000,
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }
}

// 配置验证
export const validateConfig = () => {
  console.log('配置加载完成:')
  console.log(`- 服务器地址: ${serverConfig.host}:${serverConfig.port}`)
  console.log(`- ES节点: ${esConfig.node}`)
  console.log(`- ES认证: ${esConfig.auth ? '已启用' : '未启用'}`)
  console.log(`- CORS来源: ${serverConfig.cors.origin}`)
  console.log(`- 服务端口: ${serverConfig.port}`)
}

function getDefaultValue(varName) {
  const defaults = {
    'ES_NODE': 'http://localhost:9200',
    'ES_USERNAME': 'elastic',
    'ES_PASSWORD': 'your_password_here'
  }
  return defaults[varName]
}