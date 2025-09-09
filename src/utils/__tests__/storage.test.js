import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as storage from '../storage.js';

describe('Storage Utils', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('setItem', () => {
    it('should store string values', () => {
      storage.setItem('test-key', 'test-value');
      expect(localStorage.setItem).toHaveBeenCalledWith('test-key', 'test-value');
    });

    it('should stringify objects', () => {
      const obj = { name: 'test', value: 123 };
      storage.setItem('test-obj', obj);
      expect(localStorage.setItem).toHaveBeenCalledWith('test-obj', JSON.stringify(obj));
    });

    it('should handle null values', () => {
      storage.setItem('test-null', null);
      expect(localStorage.setItem).toHaveBeenCalledWith('test-null', 'null');
    });
  });

  describe('getItem', () => {
    it('should retrieve string values', () => {
      localStorage.getItem.mockReturnValue('test-value');
      const result = storage.getItem('test-key');
      expect(result).toBe('test-value');
    });

    it('should parse JSON objects', () => {
      const obj = { name: 'test', value: 123 };
      localStorage.getItem.mockReturnValue(JSON.stringify(obj));
      const result = storage.getItem('test-obj');
      expect(result).toEqual(obj);
    });

    it('should return null for non-existent keys', () => {
      localStorage.getItem.mockReturnValue(null);
      const result = storage.getItem('non-existent');
      expect(result).toBeNull();
    });

    it('should return raw value if JSON parse fails', () => {
      localStorage.getItem.mockReturnValue('not-json');
      const result = storage.getItem('test-key');
      expect(result).toBe('not-json');
    });
  });

  describe('removeItem', () => {
    it('should remove item from localStorage', () => {
      storage.removeItem('test-key');
      expect(localStorage.removeItem).toHaveBeenCalledWith('test-key');
    });
  });

  describe('clear', () => {
    it('should clear all items from localStorage', () => {
      storage.clear();
      expect(localStorage.clear).toHaveBeenCalled();
    });
  });

  describe('getConnectionId', () => {
    it('should retrieve current connection ID', () => {
      localStorage.getItem.mockReturnValue('conn-123');
      const result = storage.getConnectionId();
      expect(localStorage.getItem).toHaveBeenCalledWith('currentConnectionId');
      expect(result).toBe('conn-123');
    });

    it('should return null if no connection ID', () => {
      localStorage.getItem.mockReturnValue(null);
      const result = storage.getConnectionId();
      expect(result).toBeNull();
    });
  });

  describe('setConnectionId', () => {
    it('should store connection ID', () => {
      storage.setConnectionId('conn-456');
      expect(localStorage.setItem).toHaveBeenCalledWith('currentConnectionId', 'conn-456');
    });

    it('should handle null connection ID', () => {
      storage.setConnectionId(null);
      expect(localStorage.removeItem).toHaveBeenCalledWith('currentConnectionId');
    });
  });

  describe('getLanguage', () => {
    it('should retrieve stored language', () => {
      localStorage.getItem.mockReturnValue('zh-CN');
      const result = storage.getLanguage();
      expect(result).toBe('zh-CN');
    });

    it('should return default language if not set', () => {
      localStorage.getItem.mockReturnValue(null);
      const result = storage.getLanguage();
      expect(result).toBe('en');
    });
  });

  describe('setLanguage', () => {
    it('should store language preference', () => {
      storage.setLanguage('fr');
      expect(localStorage.setItem).toHaveBeenCalledWith('language', 'fr');
    });
  });

  describe('getTheme', () => {
    it('should retrieve stored theme', () => {
      localStorage.getItem.mockReturnValue('dark');
      const result = storage.getTheme();
      expect(result).toBe('dark');
    });

    it('should return default theme if not set', () => {
      localStorage.getItem.mockReturnValue(null);
      const result = storage.getTheme();
      expect(result).toBe('light');
    });
  });

  describe('setTheme', () => {
    it('should store theme preference', () => {
      storage.setTheme('dark');
      expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'dark');
    });
  });
});