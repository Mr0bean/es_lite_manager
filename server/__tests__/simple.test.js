import { describe, it, expect, jest } from '@jest/globals';

describe('Simple Backend Test', () => {
  it('should perform basic math', () => {
    expect(2 + 2).toBe(4);
  });

  it('should handle arrays', () => {
    const arr = [1, 2, 3];
    expect(arr).toHaveLength(3);
    expect(arr).toContain(2);
  });

  it('should handle objects', () => {
    const obj = { name: 'test', value: 123 };
    expect(obj).toHaveProperty('name');
    expect(obj.value).toBe(123);
  });

  it('should work with mocks', () => {
    const mockFn = jest.fn();
    mockFn('test');
    expect(mockFn).toHaveBeenCalledWith('test');
  });

  it('should handle promises', async () => {
    const promise = Promise.resolve('success');
    await expect(promise).resolves.toBe('success');
  });
});