/**
 * 测试数据工厂
 * 用于生成各种测试数据
 */

// 索引数据工厂
export const createMockIndex = (overrides = {}) => ({
  index: overrides.index || 'test-index-' + Math.random().toString(36).substr(2, 9),
  health: overrides.health || 'green',
  status: overrides.status || 'open',
  uuid: overrides.uuid || 'uuid-' + Math.random().toString(36).substr(2, 9),
  pri: overrides.pri || '5',
  rep: overrides.rep || '1',
  'docs.count': overrides['docs.count'] || '1000',
  'docs.deleted': overrides['docs.deleted'] || '0',
  'store.size': overrides['store.size'] || '10mb',
  'pri.store.size': overrides['pri.store.size'] || '10mb',
  ...overrides
});

// 文档数据工厂
export const createMockDocument = (overrides = {}) => ({
  _id: overrides._id || 'doc-' + Math.random().toString(36).substr(2, 9),
  _index: overrides._index || 'test-index',
  _type: overrides._type || '_doc',
  _score: overrides._score || 1.0,
  _source: {
    title: 'Test Document',
    content: 'This is a test document content',
    created_at: new Date().toISOString(),
    author: 'Test Author',
    tags: ['test', 'mock'],
    status: 'published',
    views: Math.floor(Math.random() * 1000),
    ...overrides._source
  }
});

// 连接配置工厂
export const createMockConnection = (overrides = {}) => ({
  id: overrides.id || 'conn-' + Math.random().toString(36).substr(2, 9),
  name: overrides.name || 'Test Connection',
  url: overrides.url || 'http://localhost:9200',
  username: overrides.username || 'elastic',
  password: overrides.password || 'password123',
  isActive: overrides.isActive !== undefined ? overrides.isActive : false,
  createdAt: overrides.createdAt || new Date().toISOString(),
  ...overrides
});

// 搜索结果工厂
export const createMockSearchResult = (numHits = 10, overrides = {}) => ({
  took: overrides.took || 5,
  timed_out: overrides.timed_out || false,
  _shards: {
    total: 5,
    successful: 5,
    skipped: 0,
    failed: 0,
    ...overrides._shards
  },
  hits: {
    total: {
      value: numHits,
      relation: 'eq'
    },
    max_score: 1.0,
    hits: Array.from({ length: numHits }, (_, i) => 
      createMockDocument({ 
        _id: `doc-${i}`,
        _score: 1.0 - (i * 0.1)
      })
    ),
    ...overrides.hits
  },
  aggregations: overrides.aggregations || {}
});

// 集群健康数据工厂
export const createMockClusterHealth = (overrides = {}) => ({
  cluster_name: overrides.cluster_name || 'test-cluster',
  status: overrides.status || 'green',
  timed_out: overrides.timed_out || false,
  number_of_nodes: overrides.number_of_nodes || 3,
  number_of_data_nodes: overrides.number_of_data_nodes || 3,
  active_primary_shards: overrides.active_primary_shards || 10,
  active_shards: overrides.active_shards || 20,
  relocating_shards: overrides.relocating_shards || 0,
  initializing_shards: overrides.initializing_shards || 0,
  unassigned_shards: overrides.unassigned_shards || 0,
  delayed_unassigned_shards: overrides.delayed_unassigned_shards || 0,
  number_of_pending_tasks: overrides.number_of_pending_tasks || 0,
  number_of_in_flight_fetch: overrides.number_of_in_flight_fetch || 0,
  task_max_waiting_in_queue_millis: overrides.task_max_waiting_in_queue_millis || 0,
  active_shards_percent_as_number: overrides.active_shards_percent_as_number || 100.0,
  ...overrides
});

// 节点信息工厂
export const createMockNodeInfo = (overrides = {}) => ({
  name: overrides.name || 'node-' + Math.random().toString(36).substr(2, 9),
  transport_address: overrides.transport_address || '127.0.0.1:9300',
  host: overrides.host || '127.0.0.1',
  ip: overrides.ip || '127.0.0.1',
  version: overrides.version || '8.10.0',
  build_flavor: overrides.build_flavor || 'default',
  build_type: overrides.build_type || 'docker',
  build_hash: overrides.build_hash || 'hash123',
  roles: overrides.roles || ['master', 'data', 'ingest'],
  attributes: overrides.attributes || {},
  ...overrides
});

// 映射数据工厂
export const createMockMapping = (overrides = {}) => ({
  properties: {
    title: {
      type: 'text',
      analyzer: 'standard'
    },
    content: {
      type: 'text',
      analyzer: 'standard'
    },
    created_at: {
      type: 'date'
    },
    author: {
      type: 'keyword'
    },
    tags: {
      type: 'keyword'
    },
    status: {
      type: 'keyword'
    },
    views: {
      type: 'long'
    },
    ...overrides.properties
  },
  ...overrides
});

// 统计数据工厂
export const createMockStats = (overrides = {}) => ({
  indices: {
    count: overrides.indices?.count || 10,
    shards: {
      total: 50,
      primaries: 25,
      replication: 1.0,
      ...overrides.indices?.shards
    },
    docs: {
      count: 100000,
      deleted: 1000,
      ...overrides.indices?.docs
    },
    store: {
      size_in_bytes: 1073741824, // 1GB
      ...overrides.indices?.store
    },
    ...overrides.indices
  },
  nodes: {
    count: {
      total: 3,
      successful: 3,
      failed: 0,
      ...overrides.nodes?.count
    },
    versions: ['8.10.0'],
    ...overrides.nodes
  },
  ...overrides
});

// 批量操作结果工厂
export const createMockBulkResult = (items = [], overrides = {}) => ({
  took: overrides.took || 30,
  errors: overrides.errors || false,
  items: items.length > 0 ? items : [
    {
      index: {
        _index: 'test-index',
        _id: '1',
        _version: 1,
        result: 'created',
        _shards: { total: 2, successful: 1, failed: 0 },
        status: 201
      }
    },
    {
      index: {
        _index: 'test-index',
        _id: '2',
        _version: 1,
        result: 'created',
        _shards: { total: 2, successful: 1, failed: 0 },
        status: 201
      }
    }
  ],
  ...overrides
});

// 错误响应工厂
export const createMockError = (type = 'index_not_found_exception', overrides = {}) => ({
  error: {
    type: type,
    reason: overrides.reason || `Index not found: test-index`,
    index: overrides.index || 'test-index',
    index_uuid: overrides.index_uuid || '_na_',
    resource: {
      type: 'index_or_alias',
      id: overrides.index || 'test-index'
    },
    ...overrides.error
  },
  status: overrides.status || 404
});

// 插件信息工厂
export const createMockPlugin = (overrides = {}) => ({
  name: overrides.name || 'analysis-icu',
  component: overrides.component || 'analysis-icu',
  version: overrides.version || '8.10.0',
  elasticsearch_version: overrides.elasticsearch_version || '8.10.0',
  java_version: overrides.java_version || '17',
  description: overrides.description || 'The ICU Analysis plugin integrates the Lucene ICU module into Elasticsearch',
  classname: overrides.classname || 'org.elasticsearch.plugin.analysis.icu.AnalysisICUPlugin',
  ...overrides
});

// 分析器结果工厂
export const createMockAnalyzeResult = (text = 'test text', overrides = {}) => ({
  tokens: overrides.tokens || text.split(' ').map((token, i) => ({
    token: token.toLowerCase(),
    start_offset: i * (token.length + 1),
    end_offset: (i * (token.length + 1)) + token.length,
    type: '<ALPHANUM>',
    position: i
  })),
  ...overrides
});

// 创建测试用的ES客户端Mock
export const createMockESClient = () => ({
  ping: jest.fn().mockResolvedValue(true),
  info: jest.fn().mockResolvedValue({
    name: 'test-node',
    cluster_name: 'test-cluster',
    version: { number: '8.10.0' }
  }),
  cluster: {
    health: jest.fn().mockResolvedValue(createMockClusterHealth()),
    stats: jest.fn().mockResolvedValue(createMockStats())
  },
  indices: {
    create: jest.fn().mockResolvedValue({ acknowledged: true }),
    delete: jest.fn().mockResolvedValue({ acknowledged: true }),
    exists: jest.fn().mockResolvedValue(true),
    get: jest.fn().mockResolvedValue({}),
    getMapping: jest.fn().mockResolvedValue({ 'test-index': { mappings: createMockMapping() } }),
    putMapping: jest.fn().mockResolvedValue({ acknowledged: true }),
    stats: jest.fn().mockResolvedValue(createMockStats()),
    analyze: jest.fn().mockResolvedValue(createMockAnalyzeResult())
  },
  search: jest.fn().mockResolvedValue(createMockSearchResult()),
  index: jest.fn().mockResolvedValue({
    _index: 'test-index',
    _id: 'new-doc-id',
    _version: 1,
    result: 'created'
  }),
  get: jest.fn().mockResolvedValue(createMockDocument()),
  update: jest.fn().mockResolvedValue({
    _index: 'test-index',
    _id: 'doc-id',
    _version: 2,
    result: 'updated'
  }),
  delete: jest.fn().mockResolvedValue({
    _index: 'test-index',
    _id: 'doc-id',
    _version: 2,
    result: 'deleted'
  }),
  bulk: jest.fn().mockResolvedValue(createMockBulkResult()),
  cat: {
    indices: jest.fn().mockResolvedValue([createMockIndex()]),
    nodes: jest.fn().mockResolvedValue([createMockNodeInfo()]),
    plugins: jest.fn().mockResolvedValue([createMockPlugin()])
  },
  nodes: {
    info: jest.fn().mockResolvedValue({
      nodes: {
        'node-1': createMockNodeInfo()
      }
    }),
    stats: jest.fn().mockResolvedValue({
      nodes: {
        'node-1': {
          jvm: { mem: { heap_used_percent: 45 } }
        }
      }
    })
  },
  close: jest.fn().mockResolvedValue()
});

export default {
  createMockIndex,
  createMockDocument,
  createMockConnection,
  createMockSearchResult,
  createMockClusterHealth,
  createMockNodeInfo,
  createMockMapping,
  createMockStats,
  createMockBulkResult,
  createMockError,
  createMockPlugin,
  createMockAnalyzeResult,
  createMockESClient
};