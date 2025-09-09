import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

jest.unstable_mockModule('../connectionManager.js', () => ({
  default: {
    getAllConnections: jest.fn(),
    addConnection: jest.fn(),
    updateConnection: jest.fn(),
    deleteConnection: jest.fn(),
    switchConnection: jest.fn(),
    checkConnectionHealth: jest.fn(),
    getClient: jest.fn()
  }
}));

const mockConnectionManager = (await import('../connectionManager.js')).default;

describe('API Endpoints', () => {
  let app;
  let mockClient;

  beforeEach(async () => {
    jest.clearAllMocks();
    
    const appModule = await import('../index.js');
    app = appModule.default || appModule.app;

    mockClient = {
      indices: {
        get: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        exists: jest.fn(),
        putMapping: jest.fn(),
        getMapping: jest.fn(),
        stats: jest.fn()
      },
      search: jest.fn(),
      index: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      get: jest.fn(),
      bulk: jest.fn(),
      cluster: {
        health: jest.fn(),
        stats: jest.fn()
      },
      nodes: {
        info: jest.fn(),
        stats: jest.fn()
      },
      cat: {
        indices: jest.fn(),
        nodes: jest.fn(),
        plugins: jest.fn()
      }
    };

    mockConnectionManager.getClient.mockReturnValue(mockClient);
  });

  describe('GET /health', () => {
    it('should return health status for valid connection', async () => {
      mockConnectionManager.checkConnectionHealth.mockResolvedValue({
        connected: true,
        cluster: { status: 'green' },
        version: '8.10.0'
      });

      const response = await request(app)
        .get('/health')
        .query({ connectionId: 'test-connection' });

      expect(response.status).toBe(200);
      expect(response.body.connected).toBe(true);
      expect(response.body.cluster.status).toBe('green');
    });

    it('should return error for failed health check', async () => {
      mockConnectionManager.checkConnectionHealth.mockRejectedValue(
        new Error('Connection failed')
      );

      const response = await request(app)
        .get('/health')
        .query({ connectionId: 'test-connection' });

      expect(response.status).toBe(500);
      expect(response.body.connected).toBe(false);
      expect(response.body.error).toBe('Connection failed');
    });
  });

  describe('Connection Management', () => {
    describe('GET /connections', () => {
      it('should return all connections', async () => {
        const mockConnections = [
          { id: '1', name: 'Connection 1', url: 'http://localhost:9200' },
          { id: '2', name: 'Connection 2', url: 'http://localhost:9201' }
        ];

        mockConnectionManager.getAllConnections.mockReturnValue(mockConnections);

        const response = await request(app).get('/connections');

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockConnections);
      });

      it('should handle errors', async () => {
        mockConnectionManager.getAllConnections.mockImplementation(() => {
          throw new Error('Database error');
        });

        const response = await request(app).get('/connections');

        expect(response.status).toBe(500);
        expect(response.body.error).toBe('Database error');
      });
    });

    describe('POST /connections', () => {
      it('should create new connection', async () => {
        const newConnection = {
          name: 'New Connection',
          url: 'http://localhost:9200',
          username: 'admin',
          password: 'password'
        };

        const createdConnection = { ...newConnection, id: 'new-id' };
        mockConnectionManager.addConnection.mockResolvedValue(createdConnection);

        const response = await request(app)
          .post('/connections')
          .send(newConnection);

        expect(response.status).toBe(200);
        expect(response.body).toEqual(createdConnection);
        expect(mockConnectionManager.addConnection).toHaveBeenCalledWith(newConnection);
      });

      it('should handle validation errors', async () => {
        mockConnectionManager.addConnection.mockRejectedValue(
          new Error('Invalid URL format')
        );

        const response = await request(app)
          .post('/connections')
          .send({ name: 'Invalid', url: 'invalid-url' });

        expect(response.status).toBe(500);
        expect(response.body.error).toBe('Invalid URL format');
      });
    });

    describe('PUT /connections/:id', () => {
      it('should update existing connection', async () => {
        const updates = { name: 'Updated Connection' };
        const updatedConnection = {
          id: 'test-id',
          name: 'Updated Connection',
          url: 'http://localhost:9200'
        };

        mockConnectionManager.updateConnection.mockResolvedValue(updatedConnection);

        const response = await request(app)
          .put('/connections/test-id')
          .send(updates);

        expect(response.status).toBe(200);
        expect(response.body).toEqual(updatedConnection);
        expect(mockConnectionManager.updateConnection).toHaveBeenCalledWith('test-id', updates);
      });

      it('should handle non-existent connection', async () => {
        mockConnectionManager.updateConnection.mockRejectedValue(
          new Error('Connection not found')
        );

        const response = await request(app)
          .put('/connections/non-existent')
          .send({ name: 'Updated' });

        expect(response.status).toBe(500);
        expect(response.body.error).toBe('Connection not found');
      });
    });

    describe('DELETE /connections/:id', () => {
      it('should delete connection', async () => {
        mockConnectionManager.deleteConnection.mockReturnValue(undefined);

        const response = await request(app).delete('/connections/test-id');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(mockConnectionManager.deleteConnection).toHaveBeenCalledWith('test-id');
      });

      it('should handle deletion errors', async () => {
        mockConnectionManager.deleteConnection.mockImplementation(() => {
          throw new Error('Cannot delete active connection');
        });

        const response = await request(app).delete('/connections/active-id');

        expect(response.status).toBe(500);
        expect(response.body.error).toBe('Cannot delete active connection');
      });
    });

    describe('POST /connections/:id/switch', () => {
      it('should switch connection', async () => {
        mockConnectionManager.switchConnection.mockReturnValue(undefined);

        const response = await request(app).post('/connections/test-id/switch');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(mockConnectionManager.switchConnection).toHaveBeenCalledWith('test-id');
      });

      it('should handle switch errors', async () => {
        mockConnectionManager.switchConnection.mockImplementation(() => {
          throw new Error('Connection not found');
        });

        const response = await request(app).post('/connections/invalid-id/switch');

        expect(response.status).toBe(500);
        expect(response.body.error).toBe('Connection not found');
      });
    });
  });

  describe('Elasticsearch Operations', () => {
    describe('GET /api/indices', () => {
      it('should return indices list', async () => {
        const mockIndices = [
          {
            health: 'green',
            status: 'open',
            index: 'test-index-1',
            pri: '5',
            rep: '1',
            'docs.count': '1000',
            'store.size': '10mb'
          }
        ];

        mockClient.cat.indices.mockResolvedValue(mockIndices);

        const response = await request(app).get('/api/indices');

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockIndices);
      });

      it('should handle errors', async () => {
        mockClient.cat.indices.mockRejectedValue(new Error('Cluster unavailable'));

        const response = await request(app).get('/api/indices');

        expect(response.status).toBe(500);
        expect(response.body.error).toBe('Cluster unavailable');
      });
    });

    describe('POST /api/indices', () => {
      it('should create new index', async () => {
        const indexConfig = {
          index: 'new-index',
          settings: {
            number_of_shards: 3,
            number_of_replicas: 1
          }
        };

        mockClient.indices.create.mockResolvedValue({ acknowledged: true });

        const response = await request(app)
          .post('/api/indices')
          .send(indexConfig);

        expect(response.status).toBe(200);
        expect(response.body.acknowledged).toBe(true);
        expect(mockClient.indices.create).toHaveBeenCalledWith(indexConfig);
      });

      it('should handle index already exists error', async () => {
        mockClient.indices.create.mockRejectedValue(
          new Error('index [test-index] already exists')
        );

        const response = await request(app)
          .post('/api/indices')
          .send({ index: 'test-index' });

        expect(response.status).toBe(500);
        expect(response.body.error).toContain('already exists');
      });
    });

    describe('DELETE /api/indices/:index', () => {
      it('should delete index', async () => {
        mockClient.indices.delete.mockResolvedValue({ acknowledged: true });

        const response = await request(app).delete('/api/indices/test-index');

        expect(response.status).toBe(200);
        expect(response.body.acknowledged).toBe(true);
        expect(mockClient.indices.delete).toHaveBeenCalledWith({ index: 'test-index' });
      });

      it('should handle non-existent index', async () => {
        mockClient.indices.delete.mockRejectedValue(
          new Error('index_not_found_exception')
        );

        const response = await request(app).delete('/api/indices/non-existent');

        expect(response.status).toBe(500);
        expect(response.body.error).toContain('index_not_found');
      });
    });
  });

  describe('Document Operations', () => {
    describe('POST /api/search', () => {
      it('should perform search', async () => {
        const searchQuery = {
          index: 'test-index',
          body: {
            query: {
              match: { title: 'test' }
            }
          }
        };

        const mockResults = {
          hits: {
            total: { value: 2 },
            hits: [
              { _id: '1', _source: { title: 'test document 1' } },
              { _id: '2', _source: { title: 'test document 2' } }
            ]
          }
        };

        mockClient.search.mockResolvedValue(mockResults);

        const response = await request(app)
          .post('/api/search')
          .send(searchQuery);

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockResults);
      });

      it('should handle search errors', async () => {
        mockClient.search.mockRejectedValue(new Error('Query parse error'));

        const response = await request(app)
          .post('/api/search')
          .send({ index: 'test-index', body: { query: {} } });

        expect(response.status).toBe(500);
        expect(response.body.error).toBe('Query parse error');
      });
    });

    describe('POST /api/documents', () => {
      it('should create document', async () => {
        const document = {
          index: 'test-index',
          body: {
            title: 'New Document',
            content: 'Document content'
          }
        };

        mockClient.index.mockResolvedValue({
          _id: 'generated-id',
          _index: 'test-index',
          result: 'created'
        });

        const response = await request(app)
          .post('/api/documents')
          .send(document);

        expect(response.status).toBe(200);
        expect(response.body.result).toBe('created');
      });

      it('should handle document creation errors', async () => {
        mockClient.index.mockRejectedValue(new Error('Mapping error'));

        const response = await request(app)
          .post('/api/documents')
          .send({ index: 'test', body: {} });

        expect(response.status).toBe(500);
        expect(response.body.error).toBe('Mapping error');
      });
    });

    describe('PUT /api/documents/:index/:id', () => {
      it('should update document', async () => {
        const updates = { title: 'Updated Title' };

        mockClient.update.mockResolvedValue({
          _id: 'doc-id',
          _index: 'test-index',
          result: 'updated'
        });

        const response = await request(app)
          .put('/api/documents/test-index/doc-id')
          .send({ doc: updates });

        expect(response.status).toBe(200);
        expect(response.body.result).toBe('updated');
        expect(mockClient.update).toHaveBeenCalledWith({
          index: 'test-index',
          id: 'doc-id',
          body: { doc: updates }
        });
      });

      it('should handle document not found', async () => {
        mockClient.update.mockRejectedValue(
          new Error('document_missing_exception')
        );

        const response = await request(app)
          .put('/api/documents/test-index/non-existent')
          .send({ doc: {} });

        expect(response.status).toBe(500);
        expect(response.body.error).toContain('document_missing');
      });
    });

    describe('DELETE /api/documents/:index/:id', () => {
      it('should delete document', async () => {
        mockClient.delete.mockResolvedValue({
          _id: 'doc-id',
          result: 'deleted'
        });

        const response = await request(app)
          .delete('/api/documents/test-index/doc-id');

        expect(response.status).toBe(200);
        expect(response.body.result).toBe('deleted');
      });

      it('should handle deletion errors', async () => {
        mockClient.delete.mockRejectedValue(new Error('not_found'));

        const response = await request(app)
          .delete('/api/documents/test-index/non-existent');

        expect(response.status).toBe(500);
        expect(response.body.error).toBe('not_found');
      });
    });
  });

  describe('Statistics and Monitoring', () => {
    describe('GET /api/stats', () => {
      it('should return cluster statistics', async () => {
        const mockStats = {
          cluster_name: 'test-cluster',
          status: 'green',
          indices: { count: 10, docs: { count: 10000 } }
        };

        mockClient.cluster.stats.mockResolvedValue(mockStats);

        const response = await request(app).get('/api/stats');

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockStats);
      });

      it('should handle stats errors', async () => {
        mockClient.cluster.stats.mockRejectedValue(new Error('Timeout'));

        const response = await request(app).get('/api/stats');

        expect(response.status).toBe(500);
        expect(response.body.error).toBe('Timeout');
      });
    });

    describe('GET /api/nodes', () => {
      it('should return nodes information', async () => {
        const mockNodes = {
          nodes: {
            'node-1': { name: 'Node 1', roles: ['master', 'data'] },
            'node-2': { name: 'Node 2', roles: ['data'] }
          }
        };

        mockClient.nodes.info.mockResolvedValue(mockNodes);

        const response = await request(app).get('/api/nodes');

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockNodes);
      });
    });
  });

  describe('Mapping Operations', () => {
    describe('GET /api/mappings/:index', () => {
      it('should return index mappings', async () => {
        const mockMappings = {
          'test-index': {
            mappings: {
              properties: {
                title: { type: 'text' },
                created_at: { type: 'date' }
              }
            }
          }
        };

        mockClient.indices.getMapping.mockResolvedValue(mockMappings);

        const response = await request(app).get('/api/mappings/test-index');

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockMappings);
      });

      it('should handle mapping errors', async () => {
        mockClient.indices.getMapping.mockRejectedValue(
          new Error('index_not_found_exception')
        );

        const response = await request(app).get('/api/mappings/non-existent');

        expect(response.status).toBe(500);
        expect(response.body.error).toContain('index_not_found');
      });
    });

    describe('PUT /api/mappings/:index', () => {
      it('should update index mappings', async () => {
        const newMapping = {
          properties: {
            new_field: { type: 'keyword' }
          }
        };

        mockClient.indices.putMapping.mockResolvedValue({ acknowledged: true });

        const response = await request(app)
          .put('/api/mappings/test-index')
          .send(newMapping);

        expect(response.status).toBe(200);
        expect(response.body.acknowledged).toBe(true);
      });
    });
  });

  describe('Bulk Operations', () => {
    describe('POST /api/bulk', () => {
      it('should perform bulk operations', async () => {
        const bulkBody = [
          { index: { _index: 'test-index', _id: '1' } },
          { title: 'Document 1' },
          { index: { _index: 'test-index', _id: '2' } },
          { title: 'Document 2' }
        ];

        mockClient.bulk.mockResolvedValue({
          errors: false,
          items: [
            { index: { _id: '1', result: 'created' } },
            { index: { _id: '2', result: 'created' } }
          ]
        });

        const response = await request(app)
          .post('/api/bulk')
          .send({ body: bulkBody });

        expect(response.status).toBe(200);
        expect(response.body.errors).toBe(false);
      });

      it('should handle bulk operation errors', async () => {
        mockClient.bulk.mockResolvedValue({
          errors: true,
          items: [
            { index: { _id: '1', error: { type: 'version_conflict' } } }
          ]
        });

        const response = await request(app)
          .post('/api/bulk')
          .send({ body: [] });

        expect(response.status).toBe(200);
        expect(response.body.errors).toBe(true);
      });
    });
  });

  describe('Plugin Management', () => {
    describe('GET /api/plugins', () => {
      it('should return installed plugins', async () => {
        const mockPlugins = [
          { name: 'analysis-icu', component: 'analysis-icu', version: '8.10.0' },
          { name: 'repository-s3', component: 'repository-s3', version: '8.10.0' }
        ];

        mockClient.cat.plugins.mockResolvedValue(mockPlugins);

        const response = await request(app).get('/api/plugins');

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockPlugins);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for unknown routes', async () => {
      const response = await request(app).get('/unknown-route');

      expect(response.status).toBe(404);
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/documents')
        .set('Content-Type', 'application/json')
        .send('{ invalid json');

      expect(response.status).toBe(400);
    });
  });
});