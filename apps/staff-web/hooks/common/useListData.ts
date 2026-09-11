"use client";

import { isApiRequestCanceledError } from "@/lib/common/api";
import {
  getListDataCache,
  setListDataCache,
  getListDataCacheVersion,
  subscribeListDataCache,
} from "@/lib/common/list-data-cache";
import React from "react";

type ListFetchResult<Row, Meta> = {
  rows: Row[];
  meta: Meta | null;
};

type UseListDataOptions<Query, Row, Meta> = {
  cacheNamespace: string;
  query: Query;
  fetchRows: (query: Query, signal: AbortSignal) => Promise<ListFetchResult<Row, Meta>>;
  errorMessage: string;
  getRequestKey?: (query: Query) => string;
  enabled?: boolean;
  cacheTtlMs?: number;
};

const DEFAULT_CACHE_TTL_MS = 30_000;

function defaultGetRequestKey<Query>(query: Query) {
  return JSON.stringify(query);
}

function resolveErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function useListData<Query, Row, Meta = unknown>({
  cacheNamespace,
  query,
  fetchRows,
  errorMessage,
  getRequestKey = defaultGetRequestKey,
  enabled = true,
  cacheTtlMs = DEFAULT_CACHE_TTL_MS,
}: UseListDataOptions<Query, Row, Meta>) {
  const getCacheVersion = React.useCallback(() => getListDataCacheVersion(cacheNamespace), [cacheNamespace]);
  const cacheVersion = React.useSyncExternalStore(subscribeListDataCache, getCacheVersion, getCacheVersion);
  const [initialCachedData] = React.useState(() =>
    getListDataCache<Row, Meta>(cacheNamespace, getRequestKey(query), cacheTtlMs),
  );
  const [rows, setRows] = React.useState<Row[]>(initialCachedData?.rows ?? []);
  const [meta, setMeta] = React.useState<Meta | null>(initialCachedData?.meta ?? null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(initialCachedData === null);
  const [refreshing, setRefreshing] = React.useState(false);

  const requestKeyRef = React.useRef("");
  const hasFetchedRef = React.useRef(initialCachedData !== null);
  const requestSeqRef = React.useRef(0);
  const controllerRef = React.useRef<AbortController | null>(null);
  const activeRequestVersionRef = React.useRef<number | null>(null);
  const previousCacheVersionRef = React.useRef(cacheVersion);
  const mountedRef = React.useRef(false);
  const currentQueryRef = React.useRef(query);
  React.useLayoutEffect(() => {
    currentQueryRef.current = query;
  }, [query]);

  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      controllerRef.current?.abort();
      requestSeqRef.current += 1;
      requestKeyRef.current = "";
    };
  }, []);

  const fetchList = React.useCallback(
    async (manualRefresh = false) => {
      if (!mountedRef.current || !enabled) return;
      const currentQuery = currentQueryRef.current;
      const requestKey = getRequestKey(currentQuery);
      if (!manualRefresh && requestKeyRef.current === requestKey) return;
      requestKeyRef.current = requestKey;
      const requestSeq = ++requestSeqRef.current;
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      const requestVersion = getCacheVersion();
      activeRequestVersionRef.current = requestVersion;
      const isCurrent = () =>
        mountedRef.current &&
        !controller.signal.aborted &&
        requestSeq === requestSeqRef.current &&
        requestVersion === getCacheVersion() &&
        requestKey === getRequestKey(currentQueryRef.current);

      if (!hasFetchedRef.current) setLoading(true);
      else setRefreshing(true);
      if (manualRefresh) setRefreshing(true);

      setError(null);
      try {
        const result = await fetchRows(currentQuery, controller.signal);
        if (!isCurrent()) return;

        setRows(result.rows);
        setMeta(result.meta);
        setListDataCache(cacheNamespace, requestKey, result, requestVersion);
        hasFetchedRef.current = true;
      } catch (error) {
        if (!isCurrent()) return;

        if (isApiRequestCanceledError(error)) {
          requestKeyRef.current = "";
          return;
        }

        setError(resolveErrorMessage(error, errorMessage));
      } finally {
        if (isCurrent()) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [cacheNamespace, enabled, errorMessage, fetchRows, getRequestKey, getCacheVersion],
  );

  React.useEffect(() => {
    requestKeyRef.current = "";
  }, [cacheNamespace, fetchRows, getRequestKey]);

  React.useEffect(() => {
    if (!enabled) return;

    const timeoutId = window.setTimeout(() => {
      void fetchList(false);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      controllerRef.current?.abort();
      requestSeqRef.current += 1;
      requestKeyRef.current = "";
    };
  }, [enabled, fetchList, query]);

  React.useEffect(() => {
    if (previousCacheVersionRef.current === cacheVersion) return;
    previousCacheVersionRef.current = cacheVersion;
    if (!enabled || activeRequestVersionRef.current === cacheVersion) return;
    // A mutation callback may already have started a refresh in this generation.
    void fetchList(true);
  }, [cacheVersion, enabled, fetchList]);

  const resetList = React.useCallback(() => {
    controllerRef.current?.abort();
    requestSeqRef.current += 1;
    requestKeyRef.current = "";
    hasFetchedRef.current = false;
    setRows([]);
    setMeta(null);
    setError(null);
    setLoading(true);
    setRefreshing(false);
  }, []);

  return {
    rows,
    setRows,
    meta,
    setMeta,
    error,
    setError,
    loading,
    refreshing,
    fetchList,
    resetList,
  };
}
