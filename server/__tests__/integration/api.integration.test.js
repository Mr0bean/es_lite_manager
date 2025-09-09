import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('API Integration Tests', () => {
  let app;
  let server;

  beforeAll(() => {
    // 创建Express应用
    app = express();
    app.use(express.json());

    // 健康检查端点
    app.get('/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        service: 'es-manager'
      });
    });

    // 连接管理端点
    const connections = new Map();
    let currentConnectionId = null;

    app.get('/connections', (req, res) => {
      const connList = Array.from(connections.values());
      res.json(connList.map(conn => ({
        ...conn,
        isCurrent: conn.id === currentConnectionId
      })));
    });

    app.post('/connections', (req, res) => {
      const conn = {
        id: `conn-${Date.now()}`,
        ...req.body,
        createdAt: new Date().toISOString()
      };
      connections.set(conn.id, conn);
      if (!currentConnectionId) {
        currentConnectionId = conn.id;
      }
      res.status(201).json(conn);
    });

    app.put('/connections/:id', (req, res) => {
      const { id } = req.params;
      if (!connections.has(id)) {
        return res.status(404).json({ error: 'Connection not found' });
      }
      const updated = { ...connections.get(id), ...req.body };
      connections.set(id, updated);
      res.json(updated);
    });

    app.delete('/connections/:id', (req, res) => {
      const { id } = req.params;
      if (!connections.has(id)) {
        return res.status(404).json({ error: 'Connection not found' });
      }
      connections.delete(id);
      if (currentConnectionId === id) {
        currentConnectionId = connections.size > 0 
          ? connections.values().next().value.id 
          : null;
      }
      res.status(204).send();
    });

    app.post('/connections/:id/switch', (req, res) => {
      const { id } = req.params;
      if (!connections.has(id)) {
        return res.status(404).json({ error: 'Connection not found' });
      }
      currentConnectionId = id;
      res.json({ success: true, currentConnectionId });
    });

    // 索引管理端点
    const indices = new Map();

    app.get('/api/indices', (req, res) => {
      res.json(Array.from(indices.values()));
    });

    app.post('/api/indices', (req, res) => {
      const { index, settings = {} } = req.body;
      if (!index) {
        return res.status(400).json({ error: 'Index name is required' });
      }
      if (indices.has(index)) {
        return res.status(409).json({ error: 'Index already exists' });
      }
      const indexData = {
        index,
        health: 'green',
        status: 'open',
        uuid: `uuid-${Date.now()}`,
        pri: settings.number_of_shards || '5',
        rep: settings.number_of_replicas || '1',
        'docs.count': '0',
        'store.size': '0b',
        createdAt: new Date().toISOString()
      };
      indices.set(index, indexData);
      res.status(201).json({ acknowledged: true, index });
    });

    app.delete('/api/indices/:index', (req, res) => {
      const { index } = req.params;
      if (!indices.has(index)) {
        return res.status(404).json({ error: 'Index not found' });
      }
      indices.delete(index);
      res.json({ acknowledged: true });
    });

    // 文档操作端点
    const documents = new Map();

    app.post('/api/search', (req, res) => {
      const { index, body = {} } = req.body;
      const docs = Array.from(documents.values())
        .filter(doc => !index || doc._index === index);
      
      res.json({
        took: 5,
        timed_out: false,
        hits: {
          total: { value: docs.length, relation: 'eq' },
          hits: docs.slice(0, body.size || 10)
        }
      });
    });

    app.post('/api/documents', (req, res) => {
      const { index, body } = req.body;
      if (!index || !body) {
        return res.status(400).json({ error: 'Index and body are required' });
      }
      const doc = {
        _id: `doc-${Date.now()}`,
        _index: index,
        _source: body,
        _version: 1
      };
      documents.set(doc._id, doc);
      res.status(201).json({
        _id: doc._id,
        _index: index,
        result: 'created'
      });
    });

    app.get('/api/documents/:index/:id', (req, res) => {
      const { id } = req.params;
      if (!documents.has(id)) {
        return res.status(404).json({ error: 'Document not found' });
      }
      res.json(documents.get(id));
    });

    app.delete('/api/documents/:index/:id', (req, res) => {
      const { id } = req.params;
      if (!documents.has(id)) {
        return res.status(404).json({ error: 'Document not found' });
      }
      documents.delete(id);
      res.json({ result: 'deleted' });
    });

    // 统计端点
    app.get('/api/stats', (req, res) => {
      res.json({
        cluster_name: 'test-cluster',
        status: 'green',
        indices: {
          count: indices.size,
          docs: { count: documents.size }
        },
        nodes: { count: { total: 1 } }
      });
    });

    // 错误处理
    app.use((err, req, res, next) => {
      res.status(err.status || 500).json({
        error: err.message || 'Internal server error'
      });
    });
  });

  beforeEach(() => {
    // 每个测试前可以重置数据
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const res = await request(app)
        .get('/health')
        .expect(200);

      expect(res.body).toHaveProperty('status', 'ok');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('service', 'es-manager');
    });
  });

  describe('Connection Management', () => {
    it('should create a new connection', async () => {
      const connection = {
        name: 'Test Connection',
        url: 'http://localhost:9200',
        username: 'admin',
        password: 'password'
      };

      const res = await request(app)
        .post('/connections')
        .send(connection)
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe(connection.name);
      expect(res.body.url).toBe(connection.url);
    });

    it('should list all connections', async () => {
      // 先创建一个连接
      await request(app)
        .post('/connections')
        .send({ name: 'Connection 1', url: 'http://localhost:9200' });

      const res = await request(app)
        .get('/connections')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should update a connection', async () => {
      // 创建连接
      const createRes = await request(app)
        .post('/connections')
        .send({ name: 'Original', url: 'http://localhost:9200' });

      const connectionId = createRes.body.id;

      // 更新连接
      const res = await request(app)
        .put(`/connections/${connectionId}`)
        .send({ name: 'Updated' })
        .expect(200);

      expect(res.body.name).toBe('Updated');
    });

    it('should delete a connection', async () => {
      // 创建连接
      const createRes = await request(app)
        .post('/connections')
        .send({ name: 'To Delete', url: 'http://localhost:9200' });

      const connectionId = createRes.body.id;

      // 删除连接
      await request(app)
        .delete(`/connections/${connectionId}`)
        .expect(204);

      // 验证已删除
      await request(app)
        .put(`/connections/${connectionId}`)
        .send({ name: 'Test' })
        .expect(404);
    });

    it('should switch active connection', async () => {
      // 创建两个连接
      const conn1 = await request(app)
        .post('/connections')
        .send({ name: 'Connection 1', url: 'http://localhost:9200' });

      const conn2 = await request(app)
        .post('/connections')
        .send({ name: 'Connection 2', url: 'http://localhost:9201' });

      // 切换到第二个连接
      const res = await request(app)
        .post(`/connections/${conn2.body.id}/switch`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.currentConnectionId).toBe(conn2.body.id);
    });
  });

  describe('Index Management', () => {
    it('should create an index', async () => {
      const res = await request(app)
        .post('/api/indices')
        .send({
          index: 'test-index',
          settings: {
            number_of_shards: 3,
            number_of_replicas: 1
          }
        })
        .expect(201);

      expect(res.body.acknowledged).toBe(true);
      expect(res.body.index).toBe('test-index');
    });

    it('should list indices', async () => {
      // 创建索引
      await request(app)
        .post('/api/indices')
        .send({ index: 'test-index-1' });

      const res = await request(app)
        .get('/api/indices')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should delete an index', async () => {
      // 创建索引
      await request(app)
        .post('/api/indices')
        .send({ index: 'to-delete' });

      // 删除索引
      const res = await request(app)
        .delete('/api/indices/to-delete')
        .expect(200);

      expect(res.body.acknowledged).toBe(true);
    });

    it('should return 404 for non-existent index', async () => {
      await request(app)
        .delete('/api/indices/non-existent')
        .expect(404);
    });

    it('should prevent duplicate index creation', async () => {
      // 创建索引
      await request(app)
        .post('/api/indices')
        .send({ index: 'duplicate-test' })
        .expect(201);

      // 尝试创建重复索引
      await request(app)
        .post('/api/indices')
        .send({ index: 'duplicate-test' })
        .expect(409);
    });
  });

  describe('Document Operations', () => {
    beforeEach(async () => {
      // 创建测试索引
      await request(app)
        .post('/api/indices')
        .send({ index: 'test-docs' });
    });

    it('should create a document', async () => {
      const res = await request(app)
        .post('/api/documents')
        .send({
          index: 'test-docs',
          body: {
            title: 'Test Document',
            content: 'Test content'
          }
        })
        .expect(201);

      expect(res.body.result).toBe('created');
      expect(res.body._id).toBeDefined();
    });

    it('should search documents', async () => {
      // 创建文档
      await request(app)
        .post('/api/documents')
        .send({
          index: 'test-docs',
          body: { title: 'Document 1' }
        });

      await request(app)
        .post('/api/documents')
        .send({
          index: 'test-docs',
          body: { title: 'Document 2' }
        });

      // 搜索
      const res = await request(app)
        .post('/api/search')
        .send({
          index: 'test-docs',
          body: { size: 10 }
        })
        .expect(200);

      expect(res.body.hits).toBeDefined();
      expect(res.body.hits.total.value).toBeGreaterThanOrEqual(2);
    });

    it('should get a document by ID', async () => {
      // 创建文档
      const createRes = await request(app)
        .post('/api/documents')
        .send({
          index: 'test-docs',
          body: { title: 'To Retrieve' }
        });

      const docId = createRes.body._id;

      // 获取文档
      const res = await request(app)
        .get(`/api/documents/test-docs/${docId}`)
        .expect(200);

      expect(res.body._id).toBe(docId);
      expect(res.body._source.title).toBe('To Retrieve');
    });

    it('should delete a document', async () => {
      // 创建文档
      const createRes = await request(app)
        .post('/api/documents')
        .send({
          index: 'test-docs',
          body: { title: 'To Delete' }
        });

      const docId = createRes.body._id;

      // 删除文档
      const res = await request(app)
        .delete(`/api/documents/test-docs/${docId}`)
        .expect(200);

      expect(res.body.result).toBe('deleted');

      // 验证已删除
      await request(app)
        .get(`/api/documents/test-docs/${docId}`)
        .expect(404);
    });
  });

  describe('Statistics', () => {
    it('should return cluster statistics', async () => {
      const res = await request(app)
        .get('/api/stats')
        .expect(200);

      expect(res.body).toHaveProperty('cluster_name');
      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('indices');
      expect(res.body).toHaveProperty('nodes');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid JSON', async () => {
      await request(app)
        .post('/api/documents')
        .set('Content-Type', 'application/json')
        .send('{ invalid json')
        .expect(400);
    });

    it('should return 404 for unknown endpoints', async () => {
      await request(app)
        .get('/unknown-endpoint')
        .expect(404);
    });

    it('should validate required fields', async () => {
      await request(app)
        .post('/api/indices')
        .send({})
        .expect(400);
    });
  });
});