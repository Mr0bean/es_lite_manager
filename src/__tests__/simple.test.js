import { describe, it, expect } from 'vitest';

describe('Simple Test', () => {
  it('should perform basic math', () => {
    expect(1 + 1).toBe(2);
  });

  it('should compare strings', () => {
    expect('hello').toBe('hello');
  });

  it('should check array length', () => {
    const arr = [1, 2, 3];
    expect(arr).toHaveLength(3);
  });
});