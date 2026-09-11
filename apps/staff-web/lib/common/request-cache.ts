import { createCacheInvalidation, matchesCacheScope, type CacheScope } from "./cache-invalidation";

type TimedCacheEntry<T> = { expiresAt: number; value: T };
export type TimedCache<T> = Map<string, TimedCacheEntry<T>>;
const caches = new Map<Map<string, unknown>, readonly string[]>();
const pendingRequests = new Map<AbortController, readonly string[]>();
const invalidation = createCacheInvalidation();
const MAX_CACHE_ENTRIES = 100;

export const getRequestCacheVersion = invalidation.getVersion;
export const subscribeRequestCache = invalidation.subscribe;
export const getTimedCacheVersion = (cache: Map<string, unknown>) => getRequestCacheVersion(caches.get(cache));

export function createTimedCache<T>(scope: CacheScope): TimedCache<T> {
  const cache: TimedCache<T> = new Map();
  caches.set(cache, typeof scope === "string" ? [scope] : scope);
  return cache;
}

export function invalidateRequestCaches(scope?: CacheScope) {
  const affected = (namespaces: readonly string[]) =>
    scope === undefined || namespaces.some((name) => matchesCacheScope(name, scope));
  invalidation.invalidate(scope, () => {
    caches.forEach((namespaces, cache) => {
      if (affected(namespaces)) cache.clear();
    });
    pendingRequests.forEach((namespaces, controller) => {
      if (!affected(namespaces)) return;
      controller.abort();
      pendingRequests.delete(controller);
    });
  });
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
  if (requestVersion !== getTimedCacheVersion(cache)) return;
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

export function createCachedRequest<T>(ttlMs: number, scope: CacheScope) {
  const cache = createTimedCache<T>(scope);
  const pending = new Map<string, { version: number; promise: Promise<T> }>();
  return (key: string, load: (signal: AbortSignal) => Promise<T>, ttl = ttlMs): Promise<T> => {
    const value = getTimedCache(cache, key);
    if (value !== null) return Promise.resolve(value);
    const version = getTimedCacheVersion(cache);
    const existing = pending.get(key);
    if (existing?.version === version) return existing.promise;
    const requestVersion = version;
    const controller = new AbortController();
    pendingRequests.set(controller, caches.get(cache)!);
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
