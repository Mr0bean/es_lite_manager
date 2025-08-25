import express from 'express'
import cors from 'cors'
import { serverConfig, validateConfig } from './config.js'
import connectionManager from './connectionManager.js'

// 验证和显示配置
validateConfig()

const app = express()
const { host, port } = serverConfig

app.use(cors(serverConfig.cors))
app.use(express.json())

app.get('/health', async (req, res) => {
  try {
    const { connectionId } = req.query
    const result = await connectionManager.checkConnectionHealth(connectionId)
    res.json(result)
  } catch (error) {
    res.status(500).json({ connected: false, error: error.message })
  }
})

// 连接管理API
app.get('/connections', async (req, res) => {
  try {
    const connections = connectionManager.getAllConnections()
    res.json(connections)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/connections', async (req, res) => {
  try {
    const connection = await connectionManager.addConnection(req.body)
    res.json(connection)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.put('/connections/:id', async (req, res) => {
  try {
    const { id } = req.params
    const connection = await connectionManager.updateConnection(id, req.body)
    res.json(connection)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.delete('/connections/:id', async (req, res) => {
  try {
    const { id } = req.params
    connectionManager.deleteConnection(id)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/connections/:id/switch', async (req, res) => {
  try {
    const { id } = req.params
    connectionManager.switchConnection(id)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.get('/connections/current', async (req, res) => {
  try {
    const connection = connectionManager.getCurrentConnection()
    res.json(connection)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.get('/connections/:id/details', async (req, res) => {
  try {
    const { id } = req.params
    const connection = connectionManager.getConnectionDetails(id)
    res.json(connection)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/connections/test', async (req, res) => {
  try {
    const result = await connectionManager.testConnection(req.body)
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 原有API - 支持connectionId参数
app.get('/indices', async (req, res) => {
  try {
    const { connectionId } = req.query
    const client = connectionManager.getClient(connectionId)
    const indices = await client.cat.indices({ format: 'json' })
    
    // 过滤系统索引（以点开头的索引）
    const filteredIndices = indices.filter(index => 
      !index.index.startsWith('.') || index.index === '.kibana'
    )
    
    res.json(filteredIndices)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/indices/:index', async (req, res) => {
  try {
    const { index } = req.params
    const { connectionId } = req.query
    const client = connectionManager.getClient(connectionId)
    const result = await client.indices.create({
      index,
      body: req.body
    })
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.delete('/indices/:index', async (req, res) => {
  try {
    const { index } = req.params
    const { connectionId } = req.query
    
    // 禁止删除系统索引
    if (index.startsWith('.')) {
      return res.status(400).json({ 
        error: `索引 ${index} 是系统保留索引，禁止删除` 
      })
    }
    
    const client = connectionManager.getClient(connectionId)
    const result = await client.indices.delete({ index })
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/search', async (req, res) => {
  try {
    const { index, query, size = 10, from = 0, aggs, connectionId } = req.body
    const client = connectionManager.getClient(connectionId)
    const searchBody = {
      query,
      size,
      from
    }
    
    // 如果有聚合查询，添加到搜索体中
    if (aggs && Object.keys(aggs).length > 0) {
      searchBody.aggs = aggs
    }
    
    const result = await client.search({
      index,
      body: searchBody
    })
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.get('/documents/:index', async (req, res) => {
  try {
    const { index } = req.params
    const { size = 20, from = 0, connectionId } = req.query
    const client = connectionManager.getClient(connectionId)
    const result = await client.search({
      index,
      body: {
        query: { match_all: {} },
        size: parseInt(size),
        from: parseInt(from)
      }
    })
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/documents/:index', async (req, res) => {
  try {
    const { index } = req.params
    const { connectionId } = req.query
    const client = connectionManager.getClient(connectionId)
    const result = await client.index({
      index,
      body: req.body
    })
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.put('/documents/:index/:id', async (req, res) => {
  try {
    const { index, id } = req.params
    const { connectionId } = req.query
    const client = connectionManager.getClient(connectionId)
    const result = await client.update({
      index,
      id,
      body: {
        doc: req.body
      }
    })
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.delete('/documents/:index/:id', async (req, res) => {
  try {
    const { index, id } = req.params
    const { connectionId } = req.query
    const client = connectionManager.getClient(connectionId)
    const result = await client.delete({
      index,
      id
    })
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.get('/stats/:index', async (req, res) => {
  try {
    const { index } = req.params
    const { connectionId } = req.query
    const client = connectionManager.getClient(connectionId)
    const stats = await client.indices.stats({ index })
    res.json(stats)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 获取所有ILM策略
app.get('/policies', async (req, res) => {
  try {
    const { connectionId } = req.query
    const client = connectionManager.getClient(connectionId)
    const policies = await client.ilm.getLifecycle()
    res.json(policies)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 获取索引的ILM策略
app.get('/indices/:index/policy', async (req, res) => {
  try {
    const { index } = req.params
    const { connectionId } = req.query
    
    // 检查是否为系统保留索引
    if (index.startsWith('.') && index !== '.kibana') {
      return res.status(400).json({ 
        error: `索引 ${index} 是系统保留索引，无法访问其策略信息` 
      })
    }
    
    const client = connectionManager.getClient(connectionId)
    const settings = await client.indices.getSettings({ index })
    const indexSettings = settings[index]?.settings?.index
    const policyName = indexSettings?.lifecycle?.name
    
    if (policyName) {
      const policy = await client.ilm.getLifecycle({ name: policyName })
      res.json({ policyName, policy: policy[policyName] })
    } else {
      res.json({ policyName: null, policy: null })
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 获取索引的分词器配置
app.get('/indices/:index/analyzers', async (req, res) => {
  try {
    const { index } = req.params
    const { connectionId } = req.query
    
    // 检查是否为系统保留索引
    if (index.startsWith('.') && index !== '.kibana') {
      return res.status(400).json({ 
        error: `索引 ${index} 是系统保留索引，无法访问其分词器信息` 
      })
    }
    
    const client = connectionManager.getClient(connectionId)
    const mapping = await client.indices.getMapping({ index })
    const settings = await client.indices.getSettings({ index })
    
    const indexMapping = mapping[index]?.mappings
    const indexSettings = settings[index]?.settings?.index
    
    // 提取分词器信息
    const analyzers = {
      // 从设置中获取自定义分词器
      custom_analyzers: indexSettings?.analysis?.analyzer || {},
      // 从映射中获取字段使用的分词器
      field_analyzers: {},
      // 默认分词器
      default_analyzer: indexSettings?.analysis?.analyzer?.default || 'standard'
    }
    
    // 递归提取字段分词器
    const extractFieldAnalyzers = (properties, path = '') => {
      if (!properties) return
      
      Object.keys(properties).forEach(field => {
        const fieldPath = path ? `${path}.${field}` : field
        const fieldConfig = properties[field]
        
        if (fieldConfig.analyzer) {
          analyzers.field_analyzers[fieldPath] = fieldConfig.analyzer
        }
        
        if (fieldConfig.properties) {
          extractFieldAnalyzers(fieldConfig.properties, fieldPath)
        }
      })
    }
    
    extractFieldAnalyzers(indexMapping?.properties)
    
    res.json(analyzers)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 测试分词器效果
app.post('/analyze', async (req, res) => {
  try {
    const { index, analyzer, text, connectionId } = req.body
    const client = connectionManager.getClient(connectionId)
    
    const params = {
      body: {
        text: text
      }
    }
    
    if (index) {
      params.index = index
    }
    
    if (analyzer) {
      params.body.analyzer = analyzer
    } else {
      params.body.analyzer = 'standard' // 默认分词器
    }
    
    const result = await client.indices.analyze(params)
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 获取内置分词器列表
app.get('/analyzers/builtin', async (req, res) => {
  try {
    // Elasticsearch内置分词器列表
    const builtinAnalyzers = {
      language_analyzers: [
        'arabic', 'armenian', 'basque', 'bengali', 'brazilian', 'bulgarian',
        'catalan', 'chinese', 'cjk', 'czech', 'danish', 'dutch', 'english',
        'estonian', 'finnish', 'french', 'galician', 'german', 'greek',
        'hindi', 'hungarian', 'indonesian', 'irish', 'italian', 'latvian',
        'lithuanian', 'norwegian', 'persian', 'portuguese', 'romanian',
        'russian', 'sorani', 'spanish', 'swedish', 'turkish', 'thai'
      ],
      general_analyzers: [
        'standard', 'simple', 'whitespace', 'stop', 'keyword', 'pattern',
        'fingerprint'
      ],
      tokenizers: [
        'standard', 'letter', 'lowercase', 'whitespace', 'uax_url_email',
        'classic', 'thai', 'ngram', 'edge_ngram', 'keyword', 'pattern',
        'simple_pattern', 'char_group', 'simple_pattern_split', 'path_hierarchy'
      ],
      token_filters: [
        'standard', 'ascii_folding', 'length', 'lowercase', 'uppercase',
        'nGram', 'edge_nGram', 'porter_stem', 'shingle', 'stop',
        'word_delimiter', 'stemmer', 'synonym', 'trim', 'truncate',
        'unique', 'pattern_replace', 'snowball', 'kstem', 'phonetic'
      ]
    }
    
    res.json(builtinAnalyzers)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 获取索引映射
app.get('/indices/:index/mapping', async (req, res) => {
  try {
    const { index } = req.params
    const { connectionId } = req.query
    
    // 检查是否为系统保留索引  
    if (index.startsWith('.') && index !== '.kibana') {
      return res.status(400).json({ 
        error: `索引 ${index} 是系统保留索引，无法访问其映射信息` 
      })
    }
    
    const client = connectionManager.getClient(connectionId)
    const mapping = await client.indices.getMapping({ index })
    res.json(mapping[index])
  } catch (error) {
    console.error('Get mapping error:', error)
    res.status(500).json({ error: error.message })
  }
})

// 更新索引映射
app.put('/indices/:index/mapping', async (req, res) => {
  try {
    const { index } = req.params
    const { connectionId } = req.query
    
    // 禁止修改系统索引映射
    if (index.startsWith('.')) {
      return res.status(400).json({ 
        error: `索引 ${index} 是系统保留索引，禁止修改其映射` 
      })
    }
    
    const { properties } = req.body
    const client = connectionManager.getClient(connectionId)
    
    const result = await client.indices.putMapping({
      index,
      body: {
        properties
      }
    })
    
    res.json(result)
  } catch (error) {
    console.error('Update mapping error:', error)
    res.status(500).json({ error: error.message })
  }
})

app.listen(port, host, () => {
  console.log(`ES Manager Server running at http://${host}:${port}`)
})