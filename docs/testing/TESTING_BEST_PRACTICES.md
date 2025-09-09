# 测试最佳实践指南

## 概述
本文档定义了ES Manager项目的测试标准和最佳实践，确保代码质量和测试覆盖率达到90%以上。

## 测试原则

### 1. 测试金字塔
```
         /\
        /E2E\      (5%)  - 端到端测试
       /------\
      /集成测试\    (20%) - API和组件集成
     /----------\
    /  单元测试   \  (75%) - 函数和组件单元测试
   /--------------\
```

### 2. 测试覆盖率要求
- **总体覆盖率**: ≥ 90%
- **语句覆盖率**: ≥ 90%
- **分支覆盖率**: ≥ 85%
- **函数覆盖率**: ≥ 90%
- **行覆盖率**: ≥ 90%

## 测试编写规范

### 1. 测试文件组织
```
src/
├── components/
│   ├── RefreshTimer.vue
│   └── __tests__/
│       └── RefreshTimer.test.js
├── api/
│   ├── elasticsearch.js
│   └── __tests__/
│       └── elasticsearch.test.js
server/
├── index.js
├── connectionManager.js
└── __tests__/
    ├── api.test.js
    ├── connectionManager.test.js
    └── setup.js
```

### 2. 测试命名规范

#### 文件命名
- 单元测试: `[ComponentName].test.js`
- 集成测试: `[Feature].integration.test.js`
- E2E测试: `[UserFlow].e2e.test.js`

#### 测试用例命名
```javascript
describe('ComponentName', () => {
  describe('methodName', () => {
    it('should [expected behavior] when [condition]', () => {
      // 测试实现
    });
    
    it('should handle [error case] gracefully', () => {
      // 错误处理测试
    });
  });
});
```

### 3. AAA模式 (Arrange-Act-Assert)
```javascript
it('should calculate total price with tax', () => {
  // Arrange - 准备测试数据
  const items = [
    { price: 100, quantity: 2 },
    { price: 50, quantity: 1 }
  ];
  const taxRate = 0.1;
  
  // Act - 执行被测试的功能
  const total = calculateTotal(items, taxRate);
  
  // Assert - 断言结果
  expect(total).toBe(275); // (200 + 50) * 1.1
});
```

## 后端测试最佳实践

### 1. API端点测试
```javascript
import request from 'supertest';
import app from '../app';

describe('POST /api/indices', () => {
  it('should create index with valid configuration', async () => {
    // Arrange
    const indexConfig = {
      index: 'test-index',
      settings: { number_of_shards: 3 }
    };
    
    // Act
    const response = await request(app)
      .post('/api/indices')
      .send(indexConfig)
      .expect('Content-Type', /json/)
      .expect(200);
    
    // Assert
    expect(response.body.acknowledged).toBe(true);
  });
  
  it('should return 400 for invalid index name', async () => {
    const response = await request(app)
      .post('/api/indices')
      .send({ index: 'INVALID INDEX' })
      .expect(400);
    
    expect(response.body.error).toContain('Invalid index name');
  });
});
```

### 2. Mock策略
```javascript
// Mock ES客户端
jest.mock('@elastic/elasticsearch');

beforeEach(() => {
  const mockClient = {
    indices: {
      create: jest.fn().mockResolvedValue({ acknowledged: true }),
      delete: jest.fn().mockResolvedValue({ acknowledged: true })
    }
  };
  
  Client.mockImplementation(() => mockClient);
});
```

### 3. 数据库事务测试
```javascript
describe('Transaction Tests', () => {
  beforeEach(async () => {
    await startTransaction();
  });
  
  afterEach(async () => {
    await rollbackTransaction();
  });
  
  it('should rollback on error', async () => {
    // 测试事务回滚
  });
});
```

## 前端测试最佳实践

### 1. Vue组件测试
```javascript
import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import MyComponent from '../MyComponent.vue';

describe('MyComponent', () => {
  it('should render correctly', () => {
    const wrapper = mount(MyComponent, {
      props: {
        title: 'Test Title'
      }
    });
    
    expect(wrapper.text()).toContain('Test Title');
  });
  
  it('should emit event on button click', async () => {
    const wrapper = mount(MyComponent);
    
    await wrapper.find('button').trigger('click');
    
    expect(wrapper.emitted('update')).toHaveLength(1);
    expect(wrapper.emitted('update')[0]).toEqual(['clicked']);
  });
});
```

### 2. 异步组件测试
```javascript
it('should load data on mount', async () => {
  const mockData = { items: ['item1', 'item2'] };
  vi.spyOn(api, 'fetchData').mockResolvedValue(mockData);
  
  const wrapper = mount(AsyncComponent);
  
  // 等待异步操作完成
  await wrapper.vm.$nextTick();
  await flushPromises();
  
  expect(wrapper.findAll('.item')).toHaveLength(2);
});
```

### 3. Vuex/Pinia Store测试
```javascript
import { setActivePinia, createPinia } from 'pinia';
import { useUserStore } from '../stores/user';

describe('User Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });
  
  it('should update user profile', () => {
    const store = useUserStore();
    
    store.updateProfile({ name: 'John Doe' });
    
    expect(store.user.name).toBe('John Doe');
  });
});
```

## Mock最佳实践

### 1. 模块Mock
```javascript
// 完整模块mock
vi.mock('@/api/elasticsearch', () => ({
  default: {
    getIndices: vi.fn(),
    createIndex: vi.fn(),
    deleteIndex: vi.fn()
  }
}));

// 部分mock
vi.mock('@/utils/helpers', async () => {
  const actual = await vi.importActual('@/utils/helpers');
  return {
    ...actual,
    formatDate: vi.fn(date => '2024-01-01')
  };
});
```

### 2. 定时器Mock
```javascript
describe('Timer Tests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  
  afterEach(() => {
    vi.useRealTimers();
  });
  
  it('should refresh after interval', () => {
    const callback = vi.fn();
    startAutoRefresh(callback, 5000);
    
    expect(callback).not.toHaveBeenCalled();
    
    vi.advanceTimersByTime(5000);
    expect(callback).toHaveBeenCalledTimes(1);
    
    vi.advanceTimersByTime(5000);
    expect(callback).toHaveBeenCalledTimes(2);
  });
});
```

### 3. 网络请求Mock
```javascript
// 使用MSW (Mock Service Worker)
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.get('/api/indices', (req, res, ctx) => {
    return res(ctx.json([
      { index: 'test-index-1' },
      { index: 'test-index-2' }
    ]));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
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
  'docs.count': '1000',
  'store.size': '10mb',
  ...overrides
});

export const createMockDocument = (overrides = {}) => ({
  _id: faker.datatype.uuid(),
  _index: 'test-index',
  _source: {
    title: faker.lorem.sentence(),
    content: faker.lorem.paragraph(),
    created_at: faker.date.past(),
    ...overrides
  }
});

// 使用
it('should display index info', () => {
  const index = createMockIndex({ health: 'yellow' });
  // 测试代码
});
```

### 2. 测试数据清理
```javascript
describe('Data Cleanup', () => {
  const testData = [];
  
  afterEach(async () => {
    // 清理测试创建的数据
    for (const item of testData) {
      await api.delete(item.id);
    }
    testData.length = 0;
  });
  
  it('should create and clean data', async () => {
    const result = await api.create({ name: 'test' });
    testData.push(result);
    
    expect(result).toBeDefined();
  });
});
```

## 性能测试

### 1. 响应时间测试
```javascript
it('should respond within acceptable time', async () => {
  const start = performance.now();
  
  await api.search({ query: 'test' });
  
  const duration = performance.now() - start;
  expect(duration).toBeLessThan(200); // 200ms内响应
});
```

### 2. 内存泄漏测试
```javascript
it('should not have memory leaks', () => {
  const initialMemory = process.memoryUsage().heapUsed;
  
  // 执行大量操作
  for (let i = 0; i < 1000; i++) {
    const component = mount(HeavyComponent);
    component.unmount();
  }
  
  global.gc(); // 需要 --expose-gc flag
  const finalMemory = process.memoryUsage().heapUsed;
  
  expect(finalMemory - initialMemory).toBeLessThan(10 * 1024 * 1024); // 10MB
});
```

## 集成测试

### 1. 数据库集成
```javascript
describe('Database Integration', () => {
  let client;
  
  beforeAll(async () => {
    client = new Client({
      node: process.env.TEST_ES_HOST || 'http://localhost:9200'
    });
  });
  
  afterAll(async () => {
    await client.close();
  });
  
  it('should perform CRUD operations', async () => {
    // 创建
    const createResponse = await client.index({
      index: 'test-index',
      body: { title: 'Test' }
    });
    
    // 读取
    const getResponse = await client.get({
      index: 'test-index',
      id: createResponse._id
    });
    
    // 更新
    const updateResponse = await client.update({
      index: 'test-index',
      id: createResponse._id,
      body: { doc: { title: 'Updated' } }
    });
    
    // 删除
    const deleteResponse = await client.delete({
      index: 'test-index',
      id: createResponse._id
    });
    
    expect(deleteResponse.result).toBe('deleted');
  });
});
```

## E2E测试

### 1. Playwright配置
```javascript
// playwright.config.js
export default {
  testDir: './e2e',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:9020',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', use: { browserName: 'firefox' } },
    { name: 'webkit', use: { browserName: 'webkit' } }
  ]
};
```

### 2. E2E测试示例
```javascript
import { test, expect } from '@playwright/test';

test.describe('Index Management', () => {
  test('should create and delete index', async ({ page }) => {
    await page.goto('/indices');
    
    // 创建索引
    await page.click('button:has-text("Create Index")');
    await page.fill('input[name="indexName"]', 'test-e2e-index');
    await page.click('button:has-text("Submit")');
    
    // 验证创建成功
    await expect(page.locator('text=test-e2e-index')).toBeVisible();
    
    // 删除索引
    await page.click('button[aria-label="Delete test-e2e-index"]');
    await page.click('button:has-text("Confirm")');
    
    // 验证删除成功
    await expect(page.locator('text=test-e2e-index')).not.toBeVisible();
  });
});
```

## 测试运行和报告

### 1. 运行测试
```bash
# 运行所有测试
npm test

# 运行后端测试
npm run test:backend

# 运行前端测试
npm run test:frontend

# 监听模式
npm run test:backend:watch
npm run test:frontend:watch

# 生成覆盖率报告
npm run test:coverage
```

### 2. 查看覆盖率报告
```bash
# 后端覆盖率
open coverage/backend/index.html

# 前端覆盖率
open coverage/frontend/index.html
```

### 3. CI/CD集成
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      elasticsearch:
        image: elasticsearch:8.10.0
        options: >-
          --health-cmd "curl -f http://localhost:9200/_cluster/health || exit 1"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 9200:9200
    
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      
      - name: Run tests with coverage
        run: npm run test:coverage
        env:
          ES_HOST: http://localhost:9200
      
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/backend/lcov.info,./coverage/frontend/lcov.info
```

## 测试调试技巧

### 1. 调试单个测试
```javascript
// 只运行特定测试
it.only('should focus on this test', () => {
  // 测试代码
});

// 跳过测试
it.skip('should skip this test', () => {
  // 测试代码
});
```

### 2. 快照测试
```javascript
it('should match snapshot', () => {
  const wrapper = mount(Component);
  expect(wrapper.html()).toMatchSnapshot();
});

// 更新快照
// npm run test -- -u
```

### 3. 调试输出
```javascript
it('should debug test', () => {
  const wrapper = mount(Component);
  
  // 打印HTML
  console.log(wrapper.html());
  
  // 打印组件状态
  console.log(wrapper.vm.$data);
  
  // 使用debug工具
  wrapper.debug();
});
```

## 常见问题和解决方案

### 1. 异步测试超时
```javascript
// 增加超时时间
it('should handle long operation', async () => {
  // 测试代码
}, 10000); // 10秒超时
```

### 2. 组件找不到元素
```javascript
// 等待元素出现
await waitFor(() => {
  expect(wrapper.find('.loaded-content').exists()).toBe(true);
});
```

### 3. Mock未生效
```javascript
// 确保mock在import之前
vi.mock('./module');
const { myFunction } = await import('./module');
```

## 测试检查清单

### 新功能测试清单
- [ ] 单元测试编写完成
- [ ] 集成测试编写完成
- [ ] 边界条件测试
- [ ] 错误处理测试
- [ ] 性能测试（如需要）
- [ ] 覆盖率达到90%
- [ ] 测试命名规范
- [ ] 测试数据清理

### Code Review检查项
- [ ] 测试覆盖所有public方法
- [ ] Mock使用合理
- [ ] 无硬编码测试数据
- [ ] 测试独立可重复运行
- [ ] 异步操作正确处理
- [ ] 资源正确清理

## 持续改进

1. **定期审查测试**
   - 删除过时的测试
   - 更新测试以反映新需求
   - 优化慢速测试

2. **测试文档维护**
   - 保持测试文档更新
   - 记录特殊测试场景
   - 分享测试经验

3. **工具升级**
   - 定期更新测试框架
   - 评估新的测试工具
   - 优化测试配置

## 相关资源

- [Jest Documentation](https://jestjs.io/)
- [Vitest Documentation](https://vitest.dev/)
- [Vue Test Utils](https://test-utils.vuejs.org/)
- [Testing Library](https://testing-library.com/)
- [Playwright Documentation](https://playwright.dev/)