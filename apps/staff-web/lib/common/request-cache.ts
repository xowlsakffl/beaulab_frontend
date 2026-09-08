type TimedCacheEntry<T> = { expiresAt: number; value: T };
type TimedCache<T> = Map<string, TimedCacheEntry<T>>;
const caches = new Set<Map<string, unknown>>();
const listeners = new Set<() => void>();
const pendingRequests = new Set<AbortController>();
let version = 0;
const MAX_CACHE_ENTRIES = 100;

export const getRequestCacheVersion = () => version;
export function subscribeRequestCache(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function createTimedCache<T>(): TimedCache<T> {
  const cache: TimedCache<T> = new Map();
  caches.add(cache);
  return cache;
}

export function invalidateRequestCaches() {
  version += 1;
  caches.forEach((cache) => cache.clear());
  pendingRequests.forEach((controller) => controller.abort());
  pendingRequests.clear();
  listeners.forEach((listener) => listener());
}

export function getTimedCache<T>(cache: Map<string, TimedCacheEntry<T>>, key: string): T | null {
  const entry = cache.get(key);

  if (!entry) {
    return null;
  }

  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }

  cache.delete(key);
  cache.set(key, entry);
  return entry.value;
}

export function setTimedCache<T>(
  cache: TimedCache<T>,
  key: string,
  value: T,
  ttlMs: number,
  requestVersion: number,
): void {
  if (requestVersion !== version) return;
  cache.delete(key);
  cache.set(key, {
    expiresAt: Date.now() + ttlMs,
    value,
  });
  while (cache.size > MAX_CACHE_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey === undefined) break;
    cache.delete(oldestKey);
  }
}

export function createCachedRequest<T>(ttlMs: number) {
  const cache = createTimedCache<T>();
  const pending = new Map<string, { version: number; promise: Promise<T> }>();
  return (key: string, load: (signal: AbortSignal) => Promise<T>, ttl = ttlMs): Promise<T> => {
    const value = getTimedCache(cache, key);
    if (value !== null) return Promise.resolve(value);
    const existing = pending.get(key);
    if (existing?.version === version) return existing.promise;
    const requestVersion = version;
    const controller = new AbortController();
    pendingRequests.add(controller);
    const promise = load(controller.signal)
      .then((result) => {
        controller.signal.throwIfAborted();
        setTimedCache(cache, key, result, ttl, requestVersion);
        return result;
      })
      .finally(() => {
        pendingRequests.delete(controller);
        if (pending.get(key)?.promise === promise) pending.delete(key);
      });
    pending.set(key, { version: requestVersion, promise });
    return promise;
  };
}
