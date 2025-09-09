# ES Manager 测试方案

## 测试目标
- 单元测试代码覆盖率 > 90%
- 遵循测试最佳实践
- 确保代码质量和稳定性

## 测试架构

### 1. 后端测试 (Express + Elasticsearch)

#### 测试框架
- **Jest**: 主测试框架
- **Supertest**: API端点测试
- **@elastic/elasticsearch-mock**: ES客户端模拟

#### 测试范围
1. **API端点测试** (`server/__tests__/api.test.js`)
   - 连接管理 CRUD操作
   - 索引管理操作
   - 文档操作 (增删改查)
   - 搜索功能
   - 统计数据获取
   - 错误处理

2. **连接管理器测试** (`server/__tests__/connectionManager.test.js`)
   - 连接创建/更新/删除
   - 连接切换
   - 健康检查
   - 多连接管理

3. **配置模块测试** (`server/__tests__/config.test.js`)
   - 环境变量验证
   - 配置合并
   - 默认值处理

### 2. 前端测试 (Vue 3 + Element Plus)

#### 测试框架
- **Vitest**: Vue 3推荐的测试框架
- **@vue/test-utils**: Vue组件测试工具
- **@testing-library/vue**: 用户交互测试
- **happy-dom**: DOM模拟环境

#### 测试范围
1. **组件单元测试**
   - RefreshTimer组件
   - JsonEditor组件
   - JsonViewer组件
   - LanguageSwitcher组件

2. **页面组件测试**
   - Search.vue - 搜索功能
   - Indices.vue - 索引管理
   - Documents.vue - 文档CRUD
   - Stats.vue - 统计图表
   - Connections.vue - 连接管理
   - Settings.vue - 设置页面

3. **API客户端测试** (`src/api/__tests__/elasticsearch.test.js`)
   - HTTP请求封装
   - 错误处理
   - 响应数据处理

4. **工具函数测试**
   - storage.js - 本地存储
   - i18n - 国际化

### 3. 集成测试

#### E2E测试 (可选)
- **Playwright**: 端到端测试
- 测试用户完整流程

## 测试最佳实践

### 1. 测试命名规范
```javascript
describe('ComponentName', () => {
  describe('methodName', () => {
    it('should do something when condition is met', () => {
      // Test implementation
    });
  });
});
```

### 2. AAA模式
```javascript
it('should return user data', () => {
  // Arrange
  const userId = '123';
  const expectedUser = { id: '123', name: 'Test User' };
  
  // Act
  const result = getUserById(userId);
  
  // Assert
  expect(result).toEqual(expectedUser);
});
```

### 3. 测试隔离
- 每个测试独立运行
- 使用 `beforeEach` 和 `afterEach` 重置状态
- Mock外部依赖

### 4. Mock策略
```javascript
// Mock ES客户端
jest.mock('@elastic/elasticsearch');

// Mock API调用
vi.mock('axios');

// Mock组件依赖
const mockRouter = {
  push: vi.fn()
};
```

### 5. 覆盖率要求
- 语句覆盖率: > 90%
- 分支覆盖率: > 85%
- 函数覆盖率: > 90%
- 行覆盖率: > 90%

## 测试脚本配置

### package.json 新增脚本
```json
{
  "scripts": {
    "test": "npm run test:backend && npm run test:frontend",
    "test:backend": "jest --config jest.backend.config.js",
    "test:frontend": "vitest",
    "test:backend:watch": "jest --config jest.backend.config.js --watch",
    "test:frontend:watch": "vitest --watch",
    "test:backend:coverage": "jest --config jest.backend.config.js --coverage",
    "test:frontend:coverage": "vitest --coverage",
    "test:coverage": "npm run test:backend:coverage && npm run test:frontend:coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

## 测试数据管理

### 1. 测试数据工厂
```javascript
// test/factories/index.js
export const createMockIndex = (overrides = {}) => ({
  index: 'test-index',
  health: 'green',
  status: 'open',
  pri: '5',
  rep: '1',
  ...overrides
});

export const createMockDocument = (overrides = {}) => ({
  _id: 'doc-1',
  _index: 'test-index',
  _source: {
    title: 'Test Document',
    content: 'Test content',
    ...overrides
  }
});
```

### 2. 测试环境配置
```javascript
// .env.test
NODE_ENV=test
ES_HOST=http://localhost:9200
ES_USERNAME=test
ES_PASSWORD=test
```

## 质量保证

### 1. 代码审查检查项
- [ ] 测试覆盖所有关键路径
- [ ] 测试包含正常和异常场景
- [ ] Mock使用合理
- [ ] 测试命名清晰
- [ ] 无硬编码测试数据

### 2. CI/CD集成
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v2
```

### 3. 测试报告
- 使用 jest-html-reporter 生成HTML报告
- 使用 @vitest/ui 查看测试结果
- 集成 codecov 显示覆盖率徽章

## 性能测试考虑

### 1. 响应时间测试
```javascript
it('should respond within 200ms', async () => {
  const start = Date.now();
  await request(app).get('/api/indices');
  const duration = Date.now() - start;
  expect(duration).toBeLessThan(200);
});
```

### 2. 并发测试
```javascript
it('should handle concurrent requests', async () => {
  const requests = Array(10).fill(null).map(() => 
    request(app).get('/api/health')
  );
  const responses = await Promise.all(requests);
  responses.forEach(res => {
    expect(res.status).toBe(200);
  });
});
```

## 安全测试

### 1. 输入验证测试
- SQL注入防护
- XSS防护
- CSRF防护

### 2. 认证授权测试
- 未授权访问测试
- 权限边界测试

## 测试执行计划

### 第一阶段：基础设施搭建
1. 安装测试依赖
2. 配置测试框架
3. 创建测试目录结构

### 第二阶段：单元测试实现
1. 后端API测试
2. 前端组件测试
3. 工具函数测试

### 第三阶段：集成测试
1. API集成测试
2. 组件集成测试

### 第四阶段：优化和报告
1. 提高测试覆盖率
2. 优化测试性能
3. 生成测试报告

## 维护和更新

### 1. 测试维护原则
- 代码变更同步更新测试
- 定期审查测试有效性
- 删除过时的测试

### 2. 测试文档
- 维护测试用例文档
- 记录特殊测试场景
- 更新测试最佳实践