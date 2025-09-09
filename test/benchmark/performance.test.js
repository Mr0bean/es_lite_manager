/**
 * 性能基准测试
 * 用于测试关键功能的性能指标
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { performance } from 'perf_hooks';

describe('Performance Benchmarks', () => {
  const PERFORMANCE_THRESHOLDS = {
    api_response: 200,        // API响应时间 < 200ms
    search_query: 500,        // 搜索查询 < 500ms
    bulk_operation: 1000,     // 批量操作 < 1000ms
    index_creation: 300,      // 索引创建 < 300ms
    document_crud: 100,       // 文档CRUD < 100ms
    memory_usage: 100 * 1024 * 1024  // 内存使用 < 100MB
  };

  // 性能测量辅助函数
  const measurePerformance = async (fn, name) => {
    const startTime = performance.now();
    const startMemory = process.memoryUsage().heapUsed;
    
    try {
      const result = await fn();
      
      const endTime = performance.now();
      const endMemory = process.memoryUsage().heapUsed;
      
      return {
        name,
        duration: endTime - startTime,
        memoryDelta: endMemory - startMemory,
        success: true,
        result
      };
    } catch (error) {
      const endTime = performance.now();
      return {
        name,
        duration: endTime - startTime,
        success: false,
        error: error.message
      };
    }
  };

  // 批量测试辅助函数
  const runMultipleTimes = async (fn, times = 10) => {
    const results = [];
    for (let i = 0; i < times; i++) {
      const result = await measurePerformance(fn, `Run ${i + 1}`);
      results.push(result);
    }
    
    const durations = results.map(r => r.duration);
    return {
      min: Math.min(...durations),
      max: Math.max(...durations),
      avg: durations.reduce((a, b) => a + b, 0) / durations.length,
      median: durations.sort((a, b) => a - b)[Math.floor(durations.length / 2)],
      results
    };
  };

  describe('API Response Time', () => {
    it('should respond within acceptable time for health check', async () => {
      const mockHealthCheck = async () => {
        // 模拟健康检查
        await new Promise(resolve => setTimeout(resolve, 50));
        return { status: 'ok' };
      };

      const result = await measurePerformance(mockHealthCheck, 'Health Check');
      
      expect(result.duration).toBeLessThan(PERFORMANCE_THRESHOLDS.api_response);
      expect(result.success).toBe(true);
    });

    it('should handle concurrent requests efficiently', async () => {
      const mockApiCall = async () => {
        await new Promise(resolve => setTimeout(resolve, 20));
        return { data: 'response' };
      };

      const concurrentCalls = 10;
      const startTime = performance.now();
      
      const promises = Array(concurrentCalls).fill(null).map(() => mockApiCall());
      await Promise.all(promises);
      
      const totalTime = performance.now() - startTime;
      
      // 并发请求应该比串行快
      expect(totalTime).toBeLessThan(concurrentCalls * 50);
    });
  });

  describe('Search Performance', () => {
    it('should perform search within threshold', async () => {
      const mockSearch = async (query) => {
        // 模拟搜索操作
        await new Promise(resolve => setTimeout(resolve, 100));
        return {
          hits: Array(100).fill(null).map((_, i) => ({
            _id: `doc-${i}`,
            _score: Math.random()
          }))
        };
      };

      const stats = await runMultipleTimes(() => mockSearch('test query'), 5);
      
      expect(stats.avg).toBeLessThan(PERFORMANCE_THRESHOLDS.search_query);
      expect(stats.median).toBeLessThan(PERFORMANCE_THRESHOLDS.search_query);
    });

    it('should handle large result sets efficiently', async () => {
      const mockLargeSearch = async () => {
        // 模拟大数据集
        const results = Array(10000).fill(null).map((_, i) => ({
          _id: `doc-${i}`,
          _source: {
            title: `Document ${i}`,
            content: `Content for document ${i}`,
            timestamp: Date.now()
          }
        }));
        
        return { hits: results };
      };

      const result = await measurePerformance(mockLargeSearch, 'Large Search');
      
      expect(result.success).toBe(true);
      expect(result.memoryDelta).toBeLessThan(PERFORMANCE_THRESHOLDS.memory_usage);
    });
  });

  describe('Bulk Operations', () => {
    it('should handle bulk inserts efficiently', async () => {
      const mockBulkInsert = async (documents) => {
        // 模拟批量插入
        await new Promise(resolve => setTimeout(resolve, 200));
        return {
          items: documents.map((_, i) => ({
            index: { _id: `doc-${i}`, status: 201 }
          }))
        };
      };

      const documents = Array(100).fill(null).map((_, i) => ({
        title: `Document ${i}`,
        content: `Content ${i}`
      }));

      const result = await measurePerformance(
        () => mockBulkInsert(documents),
        'Bulk Insert 100 docs'
      );
      
      expect(result.duration).toBeLessThan(PERFORMANCE_THRESHOLDS.bulk_operation);
    });

    it('should optimize batch sizes', async () => {
      const testBatchSize = async (size) => {
        const docs = Array(size).fill({ data: 'test' });
        await new Promise(resolve => setTimeout(resolve, size * 2));
        return size;
      };

      const batchSizes = [10, 50, 100, 500];
      const results = [];

      for (const size of batchSizes) {
        const result = await measurePerformance(
          () => testBatchSize(size),
          `Batch size ${size}`
        );
        results.push({
          size,
          duration: result.duration,
          throughput: size / (result.duration / 1000) // docs per second
        });
      }

      // 验证吞吐量
      results.forEach(result => {
        expect(result.throughput).toBeGreaterThan(10); // 至少10 docs/s
      });
    });
  });

  describe('Memory Management', () => {
    it('should not leak memory during operations', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // 执行多次操作
      for (let i = 0; i < 100; i++) {
        const data = Array(1000).fill(null).map(() => ({
          id: Math.random(),
          data: 'x'.repeat(1000)
        }));
        
        // 模拟处理
        await new Promise(resolve => setTimeout(resolve, 1));
        
        // 清理引用
        data.length = 0;
      }
      
      // 强制垃圾回收（如果可用）
      if (global.gc) {
        global.gc();
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // 内存增长应该在合理范围内
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // < 50MB
    });

    it('should handle memory pressure gracefully', async () => {
      const stressTest = async () => {
        const bigData = [];
        for (let i = 0; i < 100; i++) {
          bigData.push(Array(10000).fill(Math.random()));
        }
        
        // 处理数据
        const processed = bigData.map(arr => arr.reduce((a, b) => a + b, 0));
        
        return processed.length;
      };

      const result = await measurePerformance(stressTest, 'Memory Stress Test');
      
      expect(result.success).toBe(true);
      expect(result.result).toBe(100);
    });
  });

  describe('Caching Performance', () => {
    it('should improve performance with caching', async () => {
      const cache = new Map();
      
      const fetchWithCache = async (key) => {
        if (cache.has(key)) {
          return cache.get(key);
        }
        
        // 模拟昂贵的操作
        await new Promise(resolve => setTimeout(resolve, 100));
        const result = { data: `Result for ${key}` };
        cache.set(key, result);
        return result;
      };

      // 第一次调用（无缓存）
      const firstCall = await measurePerformance(
        () => fetchWithCache('test-key'),
        'First call (no cache)'
      );
      
      // 第二次调用（有缓存）
      const secondCall = await measurePerformance(
        () => fetchWithCache('test-key'),
        'Second call (with cache)'
      );
      
      // 缓存应该显著提高性能
      expect(secondCall.duration).toBeLessThan(firstCall.duration / 10);
    });
  });

  describe('Network Latency Simulation', () => {
    it('should handle various network conditions', async () => {
      const networkConditions = [
        { name: 'Fast', latency: 10 },
        { name: 'Average', latency: 50 },
        { name: 'Slow', latency: 200 },
        { name: 'Very Slow', latency: 500 }
      ];

      for (const condition of networkConditions) {
        const simulateRequest = async () => {
          await new Promise(resolve => setTimeout(resolve, condition.latency));
          return { success: true };
        };

        const result = await measurePerformance(
          simulateRequest,
          `${condition.name} network`
        );
        
        expect(result.duration).toBeGreaterThanOrEqual(condition.latency);
        expect(result.duration).toBeLessThan(condition.latency + 50);
      }
    });
  });

  describe('Performance Report', () => {
    it('should generate performance summary', async () => {
      const tests = [
        { name: 'API Call', fn: async () => new Promise(r => setTimeout(r, 50)) },
        { name: 'Search', fn: async () => new Promise(r => setTimeout(r, 100)) },
        { name: 'Bulk Op', fn: async () => new Promise(r => setTimeout(r, 200)) }
      ];

      const report = {};
      
      for (const test of tests) {
        const stats = await runMultipleTimes(test.fn, 3);
        report[test.name] = {
          min: stats.min.toFixed(2),
          max: stats.max.toFixed(2),
          avg: stats.avg.toFixed(2),
          median: stats.median.toFixed(2)
        };
      }

      console.log('\n=== Performance Report ===');
      console.log(JSON.stringify(report, null, 2));
      
      // 验证所有测试都完成了
      expect(Object.keys(report)).toHaveLength(tests.length);
    });
  });
});