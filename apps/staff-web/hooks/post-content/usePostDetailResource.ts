"use client";

import React from "react";
import { isApiSuccess } from "@beaulab/types";
import type { DataTableMeta } from "@beaulab/ui-admin";
import { api, isApiRequestCanceledError } from "@/lib/common/api";

type Query = Record<string, number>;
type ResourceState<T> = {
  key: string;
  data: T | null;
  meta: DataTableMeta | null;
  error: string | null;
  loading: boolean;
};

export function usePostDetailResource<T>(path: string | null, query: Query, errorMessage: string) {
  const key = JSON.stringify([path, query]);
  const [state, setState] = React.useState<ResourceState<T>>({
    key,
    data: null,
    meta: null,
    error: null,
    loading: true,
  });
  const currentRef = React.useRef({ path, query, key, errorMessage });
  React.useLayoutEffect(() => {
    currentRef.current = { path, query, key, errorMessage };
  }, [path, query, key, errorMessage]);
  const controllerRef = React.useRef<AbortController | null>(null);
  const mountedRef = React.useRef(false);

  // Mutation completions always reload the current resource, never a captured page.
  const reload = React.useCallback(async () => {
    if (!mountedRef.current) return;
    const current = currentRef.current;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const isCurrent = () => mountedRef.current && !controller.signal.aborted && current.key === currentRef.current.key;
    setState((previous) => ({
      key: current.key,
      data: previous.key === current.key ? previous.data : null,
      meta: previous.key === current.key ? previous.meta : null,
      error: null,
      loading: Boolean(current.path),
    }));
    if (!current.path) return;
    try {
      const response = await api.get<T>(current.path, current.query, { signal: controller.signal });
      if (!isCurrent()) return;
      if (!isApiSuccess(response)) throw new Error(response.error.message || current.errorMessage);
      setState({
        key: current.key,
        data: response.data,
        meta: (response.meta as DataTableMeta | null) ?? null,
        error: null,
        loading: false,
      });
    } catch (error) {
      if (!isCurrent() || isApiRequestCanceledError(error)) return;
      setState((previous) => ({
        ...previous,
        error: error instanceof Error ? error.message : current.errorMessage,
        loading: false,
      }));
    }
  }, []);

  React.useEffect(() => {
    mountedRef.current = true;
    void reload();
    return () => {
      mountedRef.current = false;
      controllerRef.current?.abort();
    };
  }, [key, reload]);

  const update = React.useCallback((updateData: (data: T) => T, expectedKey?: string) => {
    if (expectedKey && expectedKey !== currentRef.current.key) return;
    setState((previous) =>
      previous.key === currentRef.current.key && previous.data !== null
        ? { ...previous, data: updateData(previous.data) }
        : previous,
    );
  }, []);

  const isCurrent = state.key === key;
  return {
    key,
    data: isCurrent ? state.data : null,
    meta: isCurrent ? state.meta : null,
    error: isCurrent ? state.error : null,
    loading: !isCurrent || state.loading,
    reload,
    update,
  };
}
