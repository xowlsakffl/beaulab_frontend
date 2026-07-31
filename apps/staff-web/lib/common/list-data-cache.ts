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
) {
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

export function invalidateListDataCache(namespace?: string) {
  if (!namespace) {
    listDataCache.clear();
    return;
  }

  const prefix = `${namespace}:`;

  for (const cacheKey of listDataCache.keys()) {
    if (cacheKey.startsWith(prefix)) {
      listDataCache.delete(cacheKey);
    }
  }
}
