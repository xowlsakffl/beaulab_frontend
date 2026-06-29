"use client";

import { isApiRequestCanceledError } from "@/lib/common/api";
import React from "react";

type ListFetchResult<Row, Meta> = {
  rows: Row[];
  meta: Meta | null;
};

type UseListDataOptions<Query, Row, Meta> = {
  query: Query;
  fetchRows: (query: Query) => Promise<ListFetchResult<Row, Meta>>;
  errorMessage: string;
  getRequestKey?: (query: Query) => string;
  enabled?: boolean;
};

function defaultGetRequestKey<Query>(query: Query) {
  return JSON.stringify(query);
}

function resolveErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function useListData<Query, Row, Meta = unknown>({
  query,
  fetchRows,
  errorMessage,
  getRequestKey = defaultGetRequestKey,
  enabled = true,
}: UseListDataOptions<Query, Row, Meta>) {
  const [rows, setRows] = React.useState<Row[]>([]);
  const [meta, setMeta] = React.useState<Meta | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const requestKeyRef = React.useRef("");
  const hasFetchedRef = React.useRef(false);
  const requestSeqRef = React.useRef(0);

  const fetchList = React.useCallback(
    async (manualRefresh = false) => {
      const requestKey = getRequestKey(query);
      if (!manualRefresh && requestKeyRef.current === requestKey) return;
      requestKeyRef.current = requestKey;
      const requestSeq = ++requestSeqRef.current;

      if (!hasFetchedRef.current) setLoading(true);
      else setRefreshing(true);
      if (manualRefresh) setRefreshing(true);

      setError(null);
      let shouldFinalize = true;

      try {
        const result = await fetchRows(query);
        if (requestSeq !== requestSeqRef.current) {
          shouldFinalize = false;
          return;
        }

        setRows(result.rows);
        setMeta(result.meta);
        hasFetchedRef.current = true;
      } catch (error) {
        if (requestSeq !== requestSeqRef.current) {
          shouldFinalize = false;
          return;
        }

        if (isApiRequestCanceledError(error)) {
          shouldFinalize = false;
          return;
        }

        setError(resolveErrorMessage(error, errorMessage));
      } finally {
        if (shouldFinalize) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [errorMessage, fetchRows, getRequestKey, query],
  );

  React.useEffect(() => {
    requestKeyRef.current = "";
  }, [fetchRows, getRequestKey]);

  React.useEffect(() => {
    if (!enabled) return;

    void fetchList(false);
  }, [enabled, fetchList]);

  const resetList = React.useCallback(() => {
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
