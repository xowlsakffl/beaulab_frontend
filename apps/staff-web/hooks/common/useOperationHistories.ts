"use client";

import React from "react";
import { isApiSuccess } from "@beaulab/types";
import type { DataTableMeta } from "@beaulab/ui-admin";
import type { OperationHistoryListItem } from "@/components/common/OperationHistoryCard";
import { useListData } from "@/hooks/common/useListData";
import { api } from "@/lib/common/api";

type HistoryQuery = { endpoint: string | null; page: number; perPage: number };
type HistoryMeta = { endpoint: string; pagination: DataTableMeta | null };
type HistoryOptions = { perPage?: number } & (
  { page?: never; onPageChange?: never } | { page: number; onPageChange: (page: number) => void }
);

export function useOperationHistories<Item extends OperationHistoryListItem = OperationHistoryListItem>(
  endpoint: string | null,
  { page: controlledPage, onPageChange, perPage = 10 }: HistoryOptions = {},
) {
  const [pageQuery, setPageQuery] = React.useState({ endpoint, page: 1 });
  const page = controlledPage ?? (pageQuery.endpoint === endpoint ? pageQuery.page : 1);
  const query = React.useMemo(() => ({ endpoint, page, perPage }), [endpoint, page, perPage]);
  const fetchRows = React.useCallback(async (current: HistoryQuery, signal: AbortSignal) => {
    if (!current.endpoint) throw new Error("히스토리 조회 대상이 없습니다.");
    const response = await api.get<Item[]>(
      current.endpoint,
      { operation_histories_page: current.page, operation_histories_per_page: current.perPage },
      { signal },
    );
    if (!isApiSuccess(response)) throw new Error(response.error.message || "히스토리를 불러오지 못했습니다.");
    return {
      rows: response.data,
      meta: { endpoint: current.endpoint, pagination: (response.meta as DataTableMeta | null) ?? null },
    };
  }, []);
  const { rows, meta, loading, refreshing, error, fetchList, resetList } = useListData<HistoryQuery, Item, HistoryMeta>(
    {
      cacheNamespace: "operation-histories",
      query,
      fetchRows,
      errorMessage: "히스토리를 불러오지 못했습니다.",
      enabled: endpoint !== null,
    },
  );
  const [activeEndpoint, setActiveEndpoint] = React.useState(endpoint);
  const currentPage = React.useRef(page);
  React.useLayoutEffect(() => {
    currentPage.current = page;
  }, [page]);
  React.useEffect(() => {
    if (activeEndpoint === endpoint) return;
    setActiveEndpoint(endpoint);
    resetList();
  }, [activeEndpoint, endpoint, resetList]);

  const setPage = React.useCallback(
    (nextPage: number) => {
      const page = Number.isSafeInteger(nextPage) && nextPage > 0 ? nextPage : 1;
      if (onPageChange) onPageChange(page);
      else setPageQuery({ endpoint, page });
    },
    [endpoint, onPageChange],
  );
  const refresh = React.useCallback(async () => {
    if (currentPage.current !== 1) {
      setPage(1);
      return;
    }
    await fetchList(true);
  }, [fetchList, setPage]);
  const isCurrentEndpoint = activeEndpoint === endpoint;
  const hasCurrentRows = meta?.endpoint === endpoint;

  return {
    histories: hasCurrentRows ? rows : [],
    meta: hasCurrentRows ? (meta?.pagination ?? null) : null,
    loading: endpoint !== null && (!isCurrentEndpoint || loading || refreshing),
    error: isCurrentEndpoint ? error : null,
    page,
    setPage,
    refresh,
  };
}
