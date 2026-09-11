import { createCacheInvalidation, matchesCacheScope, type CacheScope } from "./cache-invalidation";

type ListDataCacheValue<Row, Meta> = {
  rows: Row[];
  meta: Meta | null;
};

type ListDataCacheEntry = {
  value: ListDataCacheValue<unknown, unknown>;
  storedAt: number;
};

const MAX_CACHE_ENTRIES = 100;
const listDataCache = new Map<string, ListDataCacheEntry>();
const invalidation = createCacheInvalidation();
export const getListDataCacheVersion = invalidation.getVersion;
export const subscribeListDataCache = invalidation.subscribe;

function buildCacheKey(namespace: string, requestKey: string) {
  return `${namespace}:${requestKey}`;
}

export function getListDataCache<Row, Meta>(
  namespace: string,
  requestKey: string,
  ttlMs: number,
): ListDataCacheValue<Row, Meta> | null {
  const cacheKey = buildCacheKey(namespace, requestKey);
  const entry = listDataCache.get(cacheKey);

  if (!entry) return null;

  if (Date.now() - entry.storedAt > ttlMs) {
    listDataCache.delete(cacheKey);
    return null;
  }

  listDataCache.delete(cacheKey);
  listDataCache.set(cacheKey, entry);

  return entry.value as ListDataCacheValue<Row, Meta>;
}

export function setListDataCache<Row, Meta>(
  namespace: string,
  requestKey: string,
  value: ListDataCacheValue<Row, Meta>,
  requestVersion: number,
) {
  if (requestVersion !== getListDataCacheVersion(namespace)) return;
  const cacheKey = buildCacheKey(namespace, requestKey);

  listDataCache.delete(cacheKey);
  listDataCache.set(cacheKey, {
    value: value as ListDataCacheValue<unknown, unknown>,
    storedAt: Date.now(),
  });

  while (listDataCache.size > MAX_CACHE_ENTRIES) {
    const oldestKey = listDataCache.keys().next().value;
    if (!oldestKey) break;
    listDataCache.delete(oldestKey);
  }
}

export function invalidateListDataCache(scope?: CacheScope) {
  invalidation.invalidate(scope, () => {
    if (scope === undefined) listDataCache.clear();
    else
      for (const key of listDataCache.keys()) {
        if (matchesCacheScope(key, scope)) listDataCache.delete(key);
      }
  });
}
