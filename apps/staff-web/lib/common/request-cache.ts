type TimedCacheEntry<T> = {
  expiresAt: number;
  value: T;
};

export function getTimedCache<T>(cache: Map<string, TimedCacheEntry<T>>, key: string): T | null {
  const entry = cache.get(key);

  if (!entry) {
    return null;
  }

  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }

  return entry.value;
}

export function setTimedCache<T>(cache: Map<string, TimedCacheEntry<T>>, key: string, value: T, ttlMs: number): void {
  cache.set(key, {
    expiresAt: Date.now() + ttlMs,
    value,
  });
}
