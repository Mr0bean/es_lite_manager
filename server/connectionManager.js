import { Client } from '@elastic/elasticsearch'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const CONNECTIONS_FILE = path.join(__dirname, 'data', 'connections.json')
const ENCRYPTION_KEY = 'es-manager-secret-key-2024'

class ConnectionManager {
  constructor() {
    this.clients = new Map()
    this.connections = new Map()
    this.currentConnectionId = null
    this.loadConnections()
  }

  // 加载连接配置
  loadConnections() {
    try {
      // 确保data目录存在
      const dataDir = path.dirname(CONNECTIONS_FILE)
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true })
      }

      if (fs.existsSync(CONNECTIONS_FILE)) {
        const data = JSON.parse(fs.readFileSync(CONNECTIONS_FILE, 'utf8'))
        
        // 加载连接配置
        if (data.connections) {
          data.connections.forEach(conn => {
            // 解密密码
            if (conn.password) {
              conn.password = this.decrypt(conn.password)
            }
            this.connections.set(conn.id, conn)
          })
        }
        
        // 设置当前连接
        this.currentConnectionId = data.currentConnection || null
        
        // 如果没有当前连接，设置第一个为当前连接
        if (!this.currentConnectionId && this.connections.size > 0) {
          const firstConnection = this.connections.values().next().value
          this.currentConnectionId = firstConnection.id
          this.saveConnections()
        }
      } else {
        // 创建默认连接配置
        this.createDefaultConnection()
      }
    } catch (error) {
      console.error('加载连接配置失败:', error)
      this.createDefaultConnection()
    }
  }

  // 创建默认连接
  createDefaultConnection() {
    const defaultConnection = {
      id: 'default',
      name: '默认连接',
      host: 'localhost',
      port: 9200,
      protocol: 'http',
      username: 'elastic',
      password: 'your_password_here',
      isDefault: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    this.connections.set(defaultConnection.id, defaultConnection)
    this.currentConnectionId = defaultConnection.id
    this.saveConnections()
    
    console.log('创建默认连接配置')
  }

  // 保存连接配置
  saveConnections() {
    try {
      const connectionsArray = Array.from(this.connections.values()).map(conn => ({
        ...conn,
        // 加密密码
        password: conn.password ? this.encrypt(conn.password) : undefined
      }))

      const data = {
        connections: connectionsArray,
        currentConnection: this.currentConnectionId,
        updatedAt: new Date().toISOString()
      }

      fs.writeFileSync(CONNECTIONS_FILE, JSON.stringify(data, null, 2))
    } catch (error) {
      console.error('保存连接配置失败:', error)
      throw new Error('保存连接配置失败')
    }
  }

  // 简单加密（使用base64编码）
  encrypt(text) {
    try {
      return Buffer.from(text, 'utf8').toString('base64')
    } catch (error) {
      console.warn('加密失败，使用明文存储:', error)
      return text
    }
  }

  // 简单解密（使用base64解码）
  decrypt(encryptedText) {
    try {
      return Buffer.from(encryptedText, 'base64').toString('utf8')
    } catch (error) {
      console.warn('解密失败，可能是明文密码:', error)
      return encryptedText // 兼容明文密码
    }
  }

  // 获取ES客户端
  getClient(connectionId = null) {
    const connId = connectionId || this.currentConnectionId
    
    if (!connId || !this.connections.has(connId)) {
      throw new Error(`连接不存在: ${connId}`)
    }

    // 如果客户端已缓存，直接返回
    if (this.clients.has(connId)) {
      return this.clients.get(connId)
    }

    // 创建新的客户端
    const connection = this.connections.get(connId)
    const client = this.createClient(connection)
    this.clients.set(connId, client)
    
    return client
  }

  // 创建ES客户端
  createClient(connection) {
    const config = {
      node: `${connection.protocol}://${connection.host}:${connection.port}`,
      requestTimeout: 30000,
      pingTimeout: 3000,
      maxRetries: 3
    }

    if (connection.username && connection.password) {
      config.auth = {
        username: connection.username,
        password: connection.password
      }
    }

    return new Client(config)
  }

  // 测试连接
  async testConnection(connectionData) {
    try {
      const tempClient = this.createClient(connectionData)
      const [health, info] = await Promise.all([
        tempClient.cluster.health(),
        tempClient.info()
      ])
      return { 
        success: true, 
        health, 
        info: {
          name: info.name,
          cluster_name: info.cluster_name,
          version: info.version
        }
      }
    } catch (error) {
      return { 
        success: false, 
        error: error.message 
      }
    }
  }

  // 添加连接
  async addConnection(connectionData) {
    // 验证连接数据
    const requiredFields = ['name', 'host', 'port']
    for (const field of requiredFields) {
      if (!connectionData[field]) {
        throw new Error(`缺少必需字段: ${field}`)
      }
    }

    // 生成连接ID
    const id = connectionData.id || `conn_${Date.now()}`
    
    // 检查ID是否已存在
    if (this.connections.has(id)) {
      throw new Error(`连接ID已存在: ${id}`)
    }

    // 测试连接
    const testResult = await this.testConnection(connectionData)
    if (!testResult.success) {
      throw new Error(`连接测试失败: ${testResult.error}`)
    }

    // 添加连接
    const connection = {
      ...connectionData,
      id,
      protocol: connectionData.protocol || 'http',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    this.connections.set(id, connection)
    
    // 如果是第一个连接，设为当前连接
    if (this.connections.size === 1) {
      this.currentConnectionId = id
    }

    this.saveConnections()
    
    return connection
  }

  // 更新连接
  async updateConnection(id, connectionData) {
    if (!this.connections.has(id)) {
      throw new Error(`连接不存在: ${id}`)
    }

    // 测试连接
    const testResult = await this.testConnection(connectionData)
    if (!testResult.success) {
      throw new Error(`连接测试失败: ${testResult.error}`)
    }

    const existingConnection = this.connections.get(id)
    const updatedConnection = {
      ...existingConnection,
      ...connectionData,
      id, // 保持ID不变
      updatedAt: new Date().toISOString()
    }

    this.connections.set(id, updatedConnection)
    
    // 清除缓存的客户端
    if (this.clients.has(id)) {
      this.clients.delete(id)
    }

    this.saveConnections()
    
    return updatedConnection
  }

  // 删除连接
  deleteConnection(id) {
    if (!this.connections.has(id)) {
      throw new Error(`连接不存在: ${id}`)
    }

    // 不能删除当前活跃连接
    if (id === this.currentConnectionId) {
      throw new Error('不能删除当前活跃连接，请先切换到其他连接')
    }

    this.connections.delete(id)
    
    // 清除缓存的客户端
    if (this.clients.has(id)) {
      this.clients.delete(id)
    }

    this.saveConnections()
  }

  // 切换当前连接
  switchConnection(connectionId) {
    if (!this.connections.has(connectionId)) {
      throw new Error(`连接不存在: ${connectionId}`)
    }

    this.currentConnectionId = connectionId
    this.saveConnections()
  }

  // 获取所有连接
  getAllConnections() {
    return Array.from(this.connections.values()).map(conn => ({
      ...conn,
      password: conn.password ? '******' : undefined, // 隐藏密码
      isCurrent: conn.id === this.currentConnectionId
    }))
  }

  // 获取当前连接
  getCurrentConnection() {
    if (!this.currentConnectionId || !this.connections.has(this.currentConnectionId)) {
      return null
    }

    const conn = this.connections.get(this.currentConnectionId)
    return {
      ...conn,
      password: conn.password ? '******' : undefined,
      isCurrent: true
    }
  }

  // 获取连接详情（用于编辑）
  getConnectionDetails(id) {
    if (!this.connections.has(id)) {
      throw new Error(`连接不存在: ${id}`)
    }

    return this.connections.get(id)
  }

  // 检查连接健康状态
  async checkConnectionHealth(connectionId = null) {
    try {
      const client = this.getClient(connectionId)
      const [health, info] = await Promise.all([
        client.cluster.health(),
        client.info()
      ])
      
      return {
        connected: true,
        health,
        info: {
          name: info.name,
          cluster_name: info.cluster_name,
          cluster_uuid: info.cluster_uuid,
          version: info.version,
          tagline: info.tagline
        }
      }
    } catch (error) {
      return {
        connected: false,
        error: error.message
      }
    }
  }
}

// 创建全局连接管理器实例
const connectionManager = new ConnectionManager()

export default connectionManager