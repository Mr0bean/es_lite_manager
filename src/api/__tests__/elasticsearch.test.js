import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';
import api from '../elasticsearch';

vi.mock('axios');

describe('Elasticsearch API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    axios.create = vi.fn(() => ({
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() }
      }
    }));
  });

  describe('API initialization', () => {
    it('should create axios instance with correct config', () => {
      expect(axios.create).toHaveBeenCalledWith({
        baseURL: '/api',
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    });
  });

  describe('Connection Management', () => {
    let mockAxios;

    beforeEach(() => {
      mockAxios = {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn()
      };
      axios.create = vi.fn(() => mockAxios);
    });

    describe('getConnections', () => {
      it('should fetch all connections', async () => {
        const mockConnections = [
          { id: '1', name: 'Connection 1' },
          { id: '2', name: 'Connection 2' }
        ];
        mockAxios.get.mockResolvedValue({ data: mockConnections });

        const result = await api.getConnections();

        expect(mockAxios.get).toHaveBeenCalledWith('/connections');
        expect(result).toEqual(mockConnections);
      });

      it('should handle errors', async () => {
        const error = new Error('Network error');
        mockAxios.get.mockRejectedValue(error);

        await expect(api.getConnections()).rejects.toThrow('Network error');
      });
    });

    describe('addConnection', () => {
      it('should create new connection', async () => {
        const newConnection = {
          name: 'New Connection',
          url: 'http://localhost:9200',
          username: 'admin',
          password: 'password'
        };
        const createdConnection = { ...newConnection, id: 'new-id' };
        mockAxios.post.mockResolvedValue({ data: createdConnection });

        const result = await api.addConnection(newConnection);

        expect(mockAxios.post).toHaveBeenCalledWith('/connections', newConnection);
        expect(result).toEqual(createdConnection);
      });
    });

    describe('updateConnection', () => {
      it('should update existing connection', async () => {
        const connectionId = 'test-id';
        const updates = { name: 'Updated Name' };
        const updatedConnection = { id: connectionId, ...updates };
        mockAxios.put.mockResolvedValue({ data: updatedConnection });

        const result = await api.updateConnection(connectionId, updates);

        expect(mockAxios.put).toHaveBeenCalledWith(`/connections/${connectionId}`, updates);
        expect(result).toEqual(updatedConnection);
      });
    });

    describe('deleteConnection', () => {
      it('should delete connection', async () => {
        const connectionId = 'test-id';
        mockAxios.delete.mockResolvedValue({ data: { success: true } });

        const result = await api.deleteConnection(connectionId);

        expect(mockAxios.delete).toHaveBeenCalledWith(`/connections/${connectionId}`);
        expect(result).toEqual({ success: true });
      });
    });

    describe('switchConnection', () => {
      it('should switch active connection', async () => {
        const connectionId = 'test-id';
        mockAxios.post.mockResolvedValue({ data: { success: true } });

        const result = await api.switchConnection(connectionId);

        expect(mockAxios.post).toHaveBeenCalledWith(`/connections/${connectionId}/switch`);
        expect(result).toEqual({ success: true });
      });
    });
  });

  describe('Index Operations', () => {
    let mockAxios;

    beforeEach(() => {
      mockAxios = {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn()
      };
      axios.create = vi.fn(() => mockAxios);
    });

    describe('getIndices', () => {
      it('should fetch indices list', async () => {
        const mockIndices = [
          { index: 'test-index-1', health: 'green' },
          { index: 'test-index-2', health: 'yellow' }
        ];
        mockAxios.get.mockResolvedValue({ data: mockIndices });

        const result = await api.getIndices();

        expect(mockAxios.get).toHaveBeenCalledWith('/indices');
        expect(result).toEqual(mockIndices);
      });

      it('should handle empty indices', async () => {
        mockAxios.get.mockResolvedValue({ data: [] });

        const result = await api.getIndices();

        expect(result).toEqual([]);
      });
    });

    describe('createIndex', () => {
      it('should create new index with settings', async () => {
        const indexConfig = {
          index: 'new-index',
          settings: {
            number_of_shards: 3,
            number_of_replicas: 1
          },
          mappings: {
            properties: {
              title: { type: 'text' }
            }
          }
        };
        mockAxios.post.mockResolvedValue({ data: { acknowledged: true } });

        const result = await api.createIndex(indexConfig);

        expect(mockAxios.post).toHaveBeenCalledWith('/indices', indexConfig);
        expect(result).toEqual({ acknowledged: true });
      });
    });

    describe('deleteIndex', () => {
      it('should delete index', async () => {
        const indexName = 'test-index';
        mockAxios.delete.mockResolvedValue({ data: { acknowledged: true } });

        const result = await api.deleteIndex(indexName);

        expect(mockAxios.delete).toHaveBeenCalledWith(`/indices/${indexName}`);
        expect(result).toEqual({ acknowledged: true });
      });
    });

    describe('getIndexSettings', () => {
      it('should fetch index settings', async () => {
        const indexName = 'test-index';
        const mockSettings = {
          'test-index': {
            settings: {
              index: {
                number_of_shards: '5',
                number_of_replicas: '1'
              }
            }
          }
        };
        mockAxios.get.mockResolvedValue({ data: mockSettings });

        const result = await api.getIndexSettings(indexName);

        expect(mockAxios.get).toHaveBeenCalledWith(`/indices/${indexName}/settings`);
        expect(result).toEqual(mockSettings);
      });
    });
  });

  describe('Document Operations', () => {
    let mockAxios;

    beforeEach(() => {
      mockAxios = {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn()
      };
      axios.create = vi.fn(() => mockAxios);
    });

    describe('search', () => {
      it('should perform search query', async () => {
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
              { _id: '1', _source: { title: 'test 1' } },
              { _id: '2', _source: { title: 'test 2' } }
            ]
          }
        };
        mockAxios.post.mockResolvedValue({ data: mockResults });

        const result = await api.search(searchQuery);

        expect(mockAxios.post).toHaveBeenCalledWith('/search', searchQuery);
        expect(result).toEqual(mockResults);
      });

      it('should handle empty search results', async () => {
        const searchQuery = { index: 'test-index', body: { query: { match_all: {} } } };
        const emptyResults = { hits: { total: { value: 0 }, hits: [] } };
        mockAxios.post.mockResolvedValue({ data: emptyResults });

        const result = await api.search(searchQuery);

        expect(result.hits.hits).toHaveLength(0);
      });
    });

    describe('getDocument', () => {
      it('should fetch single document', async () => {
        const index = 'test-index';
        const id = 'doc-id';
        const mockDocument = {
          _id: id,
          _index: index,
          _source: { title: 'Test Document' }
        };
        mockAxios.get.mockResolvedValue({ data: mockDocument });

        const result = await api.getDocument(index, id);

        expect(mockAxios.get).toHaveBeenCalledWith(`/documents/${index}/${id}`);
        expect(result).toEqual(mockDocument);
      });
    });

    describe('createDocument', () => {
      it('should create new document', async () => {
        const document = {
          index: 'test-index',
          body: {
            title: 'New Document',
            content: 'Content'
          }
        };
        const mockResponse = {
          _id: 'generated-id',
          result: 'created'
        };
        mockAxios.post.mockResolvedValue({ data: mockResponse });

        const result = await api.createDocument(document);

        expect(mockAxios.post).toHaveBeenCalledWith('/documents', document);
        expect(result).toEqual(mockResponse);
      });
    });

    describe('updateDocument', () => {
      it('should update existing document', async () => {
        const index = 'test-index';
        const id = 'doc-id';
        const updates = { title: 'Updated Title' };
        const mockResponse = { result: 'updated' };
        mockAxios.put.mockResolvedValue({ data: mockResponse });

        const result = await api.updateDocument(index, id, updates);

        expect(mockAxios.put).toHaveBeenCalledWith(
          `/documents/${index}/${id}`,
          { doc: updates }
        );
        expect(result).toEqual(mockResponse);
      });
    });

    describe('deleteDocument', () => {
      it('should delete document', async () => {
        const index = 'test-index';
        const id = 'doc-id';
        const mockResponse = { result: 'deleted' };
        mockAxios.delete.mockResolvedValue({ data: mockResponse });

        const result = await api.deleteDocument(index, id);

        expect(mockAxios.delete).toHaveBeenCalledWith(`/documents/${index}/${id}`);
        expect(result).toEqual(mockResponse);
      });
    });
  });

  describe('Bulk Operations', () => {
    let mockAxios;

    beforeEach(() => {
      mockAxios = {
        post: vi.fn()
      };
      axios.create = vi.fn(() => mockAxios);
    });

    describe('bulk', () => {
      it('should perform bulk operations', async () => {
        const bulkBody = [
          { index: { _index: 'test-index', _id: '1' } },
          { title: 'Document 1' },
          { index: { _index: 'test-index', _id: '2' } },
          { title: 'Document 2' }
        ];
        const mockResponse = {
          errors: false,
          items: [
            { index: { result: 'created' } },
            { index: { result: 'created' } }
          ]
        };
        mockAxios.post.mockResolvedValue({ data: mockResponse });

        const result = await api.bulk({ body: bulkBody });

        expect(mockAxios.post).toHaveBeenCalledWith('/bulk', { body: bulkBody });
        expect(result).toEqual(mockResponse);
      });

      it('should handle bulk errors', async () => {
        const bulkBody = [];
        const mockResponse = {
          errors: true,
          items: [
            { index: { error: { type: 'version_conflict' } } }
          ]
        };
        mockAxios.post.mockResolvedValue({ data: mockResponse });

        const result = await api.bulk({ body: bulkBody });

        expect(result.errors).toBe(true);
      });
    });
  });

  describe('Statistics and Monitoring', () => {
    let mockAxios;

    beforeEach(() => {
      mockAxios = {
        get: vi.fn()
      };
      axios.create = vi.fn(() => mockAxios);
    });

    describe('getClusterHealth', () => {
      it('should fetch cluster health', async () => {
        const mockHealth = {
          cluster_name: 'test-cluster',
          status: 'green',
          number_of_nodes: 3
        };
        mockAxios.get.mockResolvedValue({ data: mockHealth });

        const result = await api.getClusterHealth();

        expect(mockAxios.get).toHaveBeenCalledWith('/cluster/health');
        expect(result).toEqual(mockHealth);
      });
    });

    describe('getClusterStats', () => {
      it('should fetch cluster statistics', async () => {
        const mockStats = {
          indices: { count: 10, docs: { count: 10000 } },
          nodes: { count: { total: 3 } }
        };
        mockAxios.get.mockResolvedValue({ data: mockStats });

        const result = await api.getClusterStats();

        expect(mockAxios.get).toHaveBeenCalledWith('/stats');
        expect(result).toEqual(mockStats);
      });
    });

    describe('getNodeStats', () => {
      it('should fetch node statistics', async () => {
        const mockNodeStats = {
          nodes: {
            'node-1': { name: 'Node 1', jvm: { mem: { heap_used_percent: 45 } } }
          }
        };
        mockAxios.get.mockResolvedValue({ data: mockNodeStats });

        const result = await api.getNodeStats();

        expect(mockAxios.get).toHaveBeenCalledWith('/nodes/stats');
        expect(result).toEqual(mockNodeStats);
      });
    });
  });

  describe('Mapping Operations', () => {
    let mockAxios;

    beforeEach(() => {
      mockAxios = {
        get: vi.fn(),
        put: vi.fn()
      };
      axios.create = vi.fn(() => mockAxios);
    });

    describe('getMapping', () => {
      it('should fetch index mappings', async () => {
        const indexName = 'test-index';
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
        mockAxios.get.mockResolvedValue({ data: mockMappings });

        const result = await api.getMapping(indexName);

        expect(mockAxios.get).toHaveBeenCalledWith(`/mappings/${indexName}`);
        expect(result).toEqual(mockMappings);
      });
    });

    describe('updateMapping', () => {
      it('should update index mappings', async () => {
        const indexName = 'test-index';
        const newMapping = {
          properties: {
            new_field: { type: 'keyword' }
          }
        };
        mockAxios.put.mockResolvedValue({ data: { acknowledged: true } });

        const result = await api.updateMapping(indexName, newMapping);

        expect(mockAxios.put).toHaveBeenCalledWith(`/mappings/${indexName}`, newMapping);
        expect(result).toEqual({ acknowledged: true });
      });
    });
  });

  describe('Error Handling', () => {
    let mockAxios;

    beforeEach(() => {
      mockAxios = {
        get: vi.fn(),
        post: vi.fn()
      };
      axios.create = vi.fn(() => mockAxios);
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network Error');
      networkError.code = 'ECONNREFUSED';
      mockAxios.get.mockRejectedValue(networkError);

      await expect(api.getIndices()).rejects.toThrow('Network Error');
    });

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('Timeout');
      timeoutError.code = 'ECONNABORTED';
      mockAxios.get.mockRejectedValue(timeoutError);

      await expect(api.getIndices()).rejects.toThrow('Timeout');
    });

    it('should handle 404 errors', async () => {
      const notFoundError = {
        response: {
          status: 404,
          data: { error: 'Index not found' }
        }
      };
      mockAxios.get.mockRejectedValue(notFoundError);

      await expect(api.getIndices()).rejects.toMatchObject({
        response: { status: 404 }
      });
    });

    it('should handle 500 errors', async () => {
      const serverError = {
        response: {
          status: 500,
          data: { error: 'Internal Server Error' }
        }
      };
      mockAxios.post.mockRejectedValue(serverError);

      await expect(api.search({})).rejects.toMatchObject({
        response: { status: 500 }
      });
    });
  });
});