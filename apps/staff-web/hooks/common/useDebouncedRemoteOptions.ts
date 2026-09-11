"use client";

import React from "react";

import { getTimedCache, setTimedCache, getTimedCacheVersion, subscribeRequestCache } from "@/lib/common/request-cache";

type RemoteOptionsCache<T> = Map<string, { expiresAt: number; value: T[] }>;

type UseDebouncedRemoteOptionsParams<T> = {
  enabled: boolean;
  query: string;
  cache: RemoteOptionsCache<T>;
  loadOptions: (query: string, signal: AbortSignal) => Promise<T[]>;
  errorMessage: string;
  normalizeQuery?: (query: string) => string;
  debounceMs?: number;
  cacheTtlMs?: number;
};

export function useDebouncedRemoteOptions<T>({
  enabled,
  query,
  cache,
  loadOptions,
  errorMessage,
  normalizeQuery = defaultNormalizeQuery,
  debounceMs = 250,
  cacheTtlMs = 5 * 60 * 1000,
}: UseDebouncedRemoteOptionsParams<T>) {
  const [options, setOptions] = React.useState<T[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const requestIdRef = React.useRef(0);
  const getCacheVersion = React.useCallback(() => getTimedCacheVersion(cache), [cache]);
  const cacheVersion = React.useSyncExternalStore(subscribeRequestCache, getCacheVersion, getCacheVersion);

  React.useEffect(() => {
    const requestId = ++requestIdRef.current;

    if (!enabled) {
      setOptions([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    const normalizedQuery = normalizeQuery(query);
    const cachedOptions = getTimedCache(cache, normalizedQuery);

    if (cachedOptions) {
      setOptions(cachedOptions);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    setOptions([]);
    const controller = new AbortController();

    const timer = window.setTimeout(async () => {
      try {
        const nextOptions = await loadOptions(normalizedQuery, controller.signal);

        if (requestId !== requestIdRef.current || cacheVersion !== getCacheVersion()) return;

        setTimedCache(cache, normalizedQuery, nextOptions, cacheTtlMs, cacheVersion);
        setOptions(nextOptions);
      } catch (requestError) {
        if (requestId !== requestIdRef.current || controller.signal.aborted || cacheVersion !== getCacheVersion())
          return;

        setOptions([]);
        setError(requestError instanceof Error ? requestError.message : errorMessage);
      } finally {
        if (requestId === requestIdRef.current) setIsLoading(false);
      }
    }, debounceMs);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
      if (requestId === requestIdRef.current) requestIdRef.current += 1;
    };
  }, [
    cache,
    cacheVersion,
    cacheTtlMs,
    debounceMs,
    enabled,
    errorMessage,
    loadOptions,
    normalizeQuery,
    query,
    getCacheVersion,
  ]);

  return { options, isLoading, error };
}

function defaultNormalizeQuery(query: string) {
  return query.trim();
}
