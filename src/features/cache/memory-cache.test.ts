import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MemoryCache } from './memory-cache';

describe('MemoryCache', () => {
  let cache: MemoryCache;

  beforeEach(() => {
    cache = new MemoryCache({ defaultTtlMs: 1000 });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('set and get', () => {
    it('should store and retrieve values', () => {
      cache.set('key1', 'value1');

      expect(cache.get('key1')).toBe('value1');
    });

    it('should return null for non-existent keys', () => {
      expect(cache.get('nonexistent')).toBe(null);
    });

    it('should handle different data types', () => {
      const objectValue = { name: 'test', count: 42 };
      const arrayValue = [1, 2, 3];

      cache.set('object', objectValue);
      cache.set('array', arrayValue);
      cache.set('number', 123);
      cache.set('boolean', true);

      expect(cache.get('object')).toEqual(objectValue);
      expect(cache.get('array')).toEqual(arrayValue);
      expect(cache.get('number')).toBe(123);
      expect(cache.get('boolean')).toBe(true);
    });
  });

  describe('TTL (Time To Live)', () => {
    it('should expire entries after TTL', () => {
      cache.set('key1', 'value1', 500);

      expect(cache.get('key1')).toBe('value1');

      vi.advanceTimersByTime(600);

      expect(cache.get('key1')).toBe(null);
    });

    it('should use default TTL when not specified', () => {
      cache.set('key1', 'value1');

      expect(cache.get('key1')).toBe('value1');

      vi.advanceTimersByTime(500);
      expect(cache.get('key1')).toBe('value1');

      vi.advanceTimersByTime(600);
      expect(cache.get('key1')).toBe(null);
    });
  });

  describe('has', () => {
    it('should return true for existing keys', () => {
      cache.set('key1', 'value1');

      expect(cache.has('key1')).toBe(true);
    });

    it('should return false for non-existent keys', () => {
      expect(cache.has('nonexistent')).toBe(false);
    });

    it('should return false for expired keys', () => {
      cache.set('key1', 'value1', 500);

      expect(cache.has('key1')).toBe(true);

      vi.advanceTimersByTime(600);

      expect(cache.has('key1')).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete existing entries', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);

      cache.delete('key1');

      expect(cache.has('key1')).toBe(false);
      expect(cache.get('key1')).toBe(null);
    });

    it('should handle deletion of non-existent keys', () => {
      expect(() => cache.delete('nonexistent')).not.toThrow();
    });
  });

  describe('clear', () => {
    it('should clear all entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      expect(cache.size()).toBe(3);

      cache.clear();

      expect(cache.size()).toBe(0);
      expect(cache.get('key1')).toBe(null);
      expect(cache.get('key2')).toBe(null);
      expect(cache.get('key3')).toBe(null);
    });
  });

  describe('maxSize', () => {
    it('should respect max size limit', () => {
      const limitedCache = new MemoryCache({
        defaultTtlMs: 1000,
        maxSize: 2,
      });

      limitedCache.set('key1', 'value1');
      limitedCache.set('key2', 'value2');
      limitedCache.set('key3', 'value3'); // Should evict key1

      expect(limitedCache.has('key1')).toBe(false);
      expect(limitedCache.has('key2')).toBe(true);
      expect(limitedCache.has('key3')).toBe(true);
      expect(limitedCache.size()).toBe(2);
    });
  });

  describe('cleanup', () => {
    it('should remove expired entries', () => {
      cache.set('key1', 'value1', 500);
      cache.set('key2', 'value2', 1500);

      vi.advanceTimersByTime(600);

      expect(cache.size()).toBe(2); // Both still physically present

      cache.cleanup();

      expect(cache.size()).toBe(1); // Only key2 should remain
      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(true);
    });
  });
});
