import { jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { Client } from '@elastic/elasticsearch';

jest.unstable_mockModule('fs', () => ({
  default: {
    existsSync: jest.fn(),
    mkdirSync: jest.fn(),
    readFileSync: jest.fn(),
    writeFileSync: jest.fn()
  }
}));

jest.unstable_mockModule('@elastic/elasticsearch', () => ({
  Client: jest.fn()
}));

const mockFs = await import('fs');
const { default: ConnectionManager } = await import('../connectionManager.js');

describe('ConnectionManager', () => {
  let connectionManager;
  let mockClient;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockClient = {
      ping: jest.fn().mockResolvedValue(true),
      cluster: {
        health: jest.fn().mockResolvedValue({
          status: 'green',
          cluster_name: 'test-cluster',
          number_of_nodes: 3,
          number_of_data_nodes: 3,
          active_primary_shards: 10,
          active_shards: 20,
          unassigned_shards: 0,
          timed_out: false
        })
      },
      info: jest.fn().mockResolvedValue({
        version: { number: '8.10.0' }
      }),
      close: jest.fn().mockResolvedValue()
    };

    Client.mockImplementation(() => mockClient);
  });

  describe('constructor and initialization', () => {
    it('should initialize with empty connections when no file exists', () => {
      mockFs.default.existsSync.mockReturnValue(false);
      
      connectionManager = new ConnectionManager();
      
      expect(connectionManager.connections.size).toBe(0);
      expect(connectionManager.currentConnectionId).toBeNull();
    });

    it('should load connections from file when it exists', () => {
      const mockConnections = {
        connections: [
          {
            id: 'conn1',
            name: 'Test Connection 1',
            url: 'http://localhost:9200',
            username: 'admin',
            password: 'encrypted_password'
          }
        ],
        currentConnection: 'conn1'
      };

      mockFs.default.existsSync.mockReturnValue(true);
      mockFs.default.readFileSync.mockReturnValue(JSON.stringify(mockConnections));

      connectionManager = new ConnectionManager();
      
      expect(connectionManager.connections.size).toBe(1);
      expect(connectionManager.currentConnectionId).toBe('conn1');
    });

    it('should create data directory if it does not exist', () => {
      mockFs.default.existsSync
        .mockReturnValueOnce(false)  // data directory doesn't exist
        .mockReturnValueOnce(false); // connections file doesn't exist
      
      connectionManager = new ConnectionManager();
      
      expect(mockFs.default.mkdirSync).toHaveBeenCalledWith(
        expect.stringContaining('data'),
        { recursive: true }
      );
    });
  });

  describe('addConnection', () => {
    beforeEach(() => {
      mockFs.default.existsSync.mockReturnValue(false);
      connectionManager = new ConnectionManager();
    });

    it('should add a new connection successfully', async () => {
      const newConnection = {
        name: 'Test Connection',
        url: 'http://localhost:9200',
        username: 'admin',
        password: 'password123'
      };

      const result = await connectionManager.addConnection(newConnection);

      expect(result).toHaveProperty('id');
      expect(result.name).toBe('Test Connection');
      expect(connectionManager.connections.size).toBe(1);
    });

    it('should validate connection before adding', async () => {
      const invalidConnection = {
        name: 'Invalid Connection',
        url: 'invalid-url',
        username: 'admin',
        password: 'password123'
      };

      mockClient.ping.mockRejectedValue(new Error('Connection failed'));

      await expect(connectionManager.addConnection(invalidConnection))
        .rejects.toThrow();
    });

    it('should encrypt password before saving', async () => {
      const connection = {
        name: 'Secure Connection',
        url: 'http://localhost:9200',
        username: 'admin',
        password: 'plaintext_password'
      };

      await connectionManager.addConnection(connection);

      const savedConnection = connectionManager.connections.values().next().value;
      expect(savedConnection.password).not.toBe('plaintext_password');
    });
  });

  describe('updateConnection', () => {
    beforeEach(() => {
      mockFs.default.existsSync.mockReturnValue(false);
      connectionManager = new ConnectionManager();
    });

    it('should update existing connection', async () => {
      const connection = {
        name: 'Original Connection',
        url: 'http://localhost:9200',
        username: 'admin',
        password: 'password123'
      };

      const added = await connectionManager.addConnection(connection);
      
      const updated = await connectionManager.updateConnection(added.id, {
        name: 'Updated Connection',
        url: 'http://localhost:9201'
      });

      expect(updated.name).toBe('Updated Connection');
      expect(updated.url).toBe('http://localhost:9201');
    });

    it('should throw error when updating non-existent connection', async () => {
      await expect(connectionManager.updateConnection('non-existent-id', {}))
        .rejects.toThrow('Connection not found');
    });

    it('should close old client when URL changes', async () => {
      const connection = {
        name: 'Test Connection',
        url: 'http://localhost:9200',
        username: 'admin',
        password: 'password123'
      };

      const added = await connectionManager.addConnection(connection);
      connectionManager.getClient(added.id);

      await connectionManager.updateConnection(added.id, {
        url: 'http://localhost:9201'
      });

      expect(mockClient.close).toHaveBeenCalled();
    });
  });

  describe('deleteConnection', () => {
    beforeEach(() => {
      mockFs.default.existsSync.mockReturnValue(false);
      connectionManager = new ConnectionManager();
    });

    it('should delete existing connection', async () => {
      const connection = {
        name: 'Test Connection',
        url: 'http://localhost:9200',
        username: 'admin',
        password: 'password123'
      };

      const added = await connectionManager.addConnection(connection);
      
      connectionManager.deleteConnection(added.id);
      
      expect(connectionManager.connections.has(added.id)).toBe(false);
    });

    it('should close client when deleting connection', async () => {
      const connection = {
        name: 'Test Connection',
        url: 'http://localhost:9200',
        username: 'admin',
        password: 'password123'
      };

      const added = await connectionManager.addConnection(connection);
      connectionManager.getClient(added.id);
      
      connectionManager.deleteConnection(added.id);
      
      expect(mockClient.close).toHaveBeenCalled();
    });

    it('should handle deletion of current connection', async () => {
      const conn1 = await connectionManager.addConnection({
        name: 'Connection 1',
        url: 'http://localhost:9200',
        username: 'admin',
        password: 'password123'
      });

      const conn2 = await connectionManager.addConnection({
        name: 'Connection 2',
        url: 'http://localhost:9201',
        username: 'admin',
        password: 'password123'
      });

      connectionManager.switchConnection(conn1.id);
      connectionManager.deleteConnection(conn1.id);

      expect(connectionManager.currentConnectionId).toBe(conn2.id);
    });
  });

  describe('switchConnection', () => {
    beforeEach(() => {
      mockFs.default.existsSync.mockReturnValue(false);
      connectionManager = new ConnectionManager();
    });

    it('should switch to existing connection', async () => {
      const conn1 = await connectionManager.addConnection({
        name: 'Connection 1',
        url: 'http://localhost:9200',
        username: 'admin',
        password: 'password123'
      });

      const conn2 = await connectionManager.addConnection({
        name: 'Connection 2',
        url: 'http://localhost:9201',
        username: 'admin',
        password: 'password123'
      });

      connectionManager.switchConnection(conn2.id);
      
      expect(connectionManager.currentConnectionId).toBe(conn2.id);
    });

    it('should throw error when switching to non-existent connection', () => {
      expect(() => connectionManager.switchConnection('non-existent'))
        .toThrow('Connection not found');
    });
  });

  describe('getClient', () => {
    beforeEach(() => {
      mockFs.default.existsSync.mockReturnValue(false);
      connectionManager = new ConnectionManager();
    });

    it('should create and cache client', async () => {
      const connection = {
        name: 'Test Connection',
        url: 'http://localhost:9200',
        username: 'admin',
        password: 'password123'
      };

      const added = await connectionManager.addConnection(connection);
      
      const client1 = connectionManager.getClient(added.id);
      const client2 = connectionManager.getClient(added.id);
      
      expect(client1).toBe(client2);
      expect(Client).toHaveBeenCalledTimes(1);
    });

    it('should use current connection when no ID provided', async () => {
      const connection = {
        name: 'Test Connection',
        url: 'http://localhost:9200',
        username: 'admin',
        password: 'password123'
      };

      const added = await connectionManager.addConnection(connection);
      connectionManager.switchConnection(added.id);
      
      const client = connectionManager.getClient();
      
      expect(client).toBeDefined();
    });

    it('should handle authentication correctly', async () => {
      const connection = {
        name: 'Auth Connection',
        url: 'http://localhost:9200',
        username: 'admin',
        password: 'password123'
      };

      const added = await connectionManager.addConnection(connection);
      connectionManager.getClient(added.id);

      expect(Client).toHaveBeenCalledWith(
        expect.objectContaining({
          node: 'http://localhost:9200',
          auth: {
            username: 'admin',
            password: expect.any(String)
          }
        })
      );
    });
  });

  describe('checkConnectionHealth', () => {
    beforeEach(() => {
      mockFs.default.existsSync.mockReturnValue(false);
      connectionManager = new ConnectionManager();
    });

    it('should return healthy status for valid connection', async () => {
      const connection = {
        name: 'Test Connection',
        url: 'http://localhost:9200',
        username: 'admin',
        password: 'password123'
      };

      const added = await connectionManager.addConnection(connection);
      
      const health = await connectionManager.checkConnectionHealth(added.id);
      
      expect(health.connected).toBe(true);
      expect(health.cluster).toHaveProperty('status', 'green');
      expect(health.version).toBe('8.10.0');
    });

    it('should return error status for failed connection', async () => {
      const connection = {
        name: 'Failed Connection',
        url: 'http://localhost:9200',
        username: 'admin',
        password: 'password123'
      };

      const added = await connectionManager.addConnection(connection);
      
      mockClient.ping.mockRejectedValue(new Error('Connection timeout'));
      
      const health = await connectionManager.checkConnectionHealth(added.id);
      
      expect(health.connected).toBe(false);
      expect(health.error).toBe('Connection timeout');
    });

    it('should handle missing connection ID', async () => {
      const health = await connectionManager.checkConnectionHealth();
      
      expect(health.connected).toBe(false);
      expect(health.error).toBe('No active connection');
    });
  });

  describe('getAllConnections', () => {
    beforeEach(() => {
      mockFs.default.existsSync.mockReturnValue(false);
      connectionManager = new ConnectionManager();
    });

    it('should return all connections without passwords', async () => {
      await connectionManager.addConnection({
        name: 'Connection 1',
        url: 'http://localhost:9200',
        username: 'admin',
        password: 'password123'
      });

      await connectionManager.addConnection({
        name: 'Connection 2',
        url: 'http://localhost:9201',
        username: 'user',
        password: 'pass456'
      });

      const connections = connectionManager.getAllConnections();
      
      expect(connections).toHaveLength(2);
      connections.forEach(conn => {
        expect(conn).not.toHaveProperty('password');
        expect(conn).toHaveProperty('name');
        expect(conn).toHaveProperty('url');
      });
    });

    it('should mark current connection', async () => {
      const conn1 = await connectionManager.addConnection({
        name: 'Connection 1',
        url: 'http://localhost:9200',
        username: 'admin',
        password: 'password123'
      });

      await connectionManager.addConnection({
        name: 'Connection 2',
        url: 'http://localhost:9201',
        username: 'user',
        password: 'pass456'
      });

      connectionManager.switchConnection(conn1.id);
      
      const connections = connectionManager.getAllConnections();
      const currentConn = connections.find(c => c.id === conn1.id);
      
      expect(currentConn.isCurrent).toBe(true);
    });
  });

  describe('encryption and decryption', () => {
    beforeEach(() => {
      mockFs.default.existsSync.mockReturnValue(false);
      connectionManager = new ConnectionManager();
    });

    it('should encrypt and decrypt passwords correctly', () => {
      const originalPassword = 'mySecretPassword123';
      
      const encrypted = connectionManager.encrypt(originalPassword);
      expect(encrypted).not.toBe(originalPassword);
      
      const decrypted = connectionManager.decrypt(encrypted);
      expect(decrypted).toBe(originalPassword);
    });

    it('should handle empty passwords', () => {
      const encrypted = connectionManager.encrypt('');
      expect(encrypted).toBe('');
      
      const decrypted = connectionManager.decrypt('');
      expect(decrypted).toBe('');
    });
  });

  describe('persistence', () => {
    beforeEach(() => {
      mockFs.default.existsSync.mockReturnValue(false);
      connectionManager = new ConnectionManager();
    });

    it('should save connections to file', async () => {
      await connectionManager.addConnection({
        name: 'Test Connection',
        url: 'http://localhost:9200',
        username: 'admin',
        password: 'password123'
      });

      expect(mockFs.default.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('connections.json'),
        expect.stringContaining('Test Connection'),
        'utf8'
      );
    });

    it('should save current connection ID', async () => {
      const conn = await connectionManager.addConnection({
        name: 'Test Connection',
        url: 'http://localhost:9200',
        username: 'admin',
        password: 'password123'
      });

      connectionManager.switchConnection(conn.id);

      const lastCall = mockFs.default.writeFileSync.mock.calls[mockFs.default.writeFileSync.mock.calls.length - 1];
      const savedData = JSON.parse(lastCall[1]);
      
      expect(savedData.currentConnection).toBe(conn.id);
    });
  });
});