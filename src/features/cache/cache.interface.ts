export interface CacheEntry<T> {
  readonly value: T;
  readonly expiresAt: number;
}

export interface Cache {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T, ttlMs: number): void;
  delete(key: string): void;
  clear(): void;
  has(key: string): boolean;
}

export interface CacheConfig {
  readonly defaultTtlMs: number;
  readonly maxSize?: number;
}

export enum CacheStrategy {
  MEMORY = 'memory',
  LOCAL_STORAGE = 'localStorage',
  SESSION_STORAGE = 'sessionStorage',
}
