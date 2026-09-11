"use client";

import React from "react";
import { isApiSuccess } from "@beaulab/types";
import type { DataTableMeta } from "@beaulab/ui-admin";
import { api } from "@/lib/common/api";
import { useListData } from "@/hooks/common/useListData";
import { promotionListApiQuery, type PromotionListQuery } from "@/lib/hospital-promotion/list";
import {
  PROMOTION_API,
  PROMOTION_CACHE,
  type HospitalPromotion,
  type PromotionBoard,
} from "@/lib/hospital-promotion/types";

type PromotionListResult = {
  key: string;
} & (
  { tab: "active"; board: PromotionBoard } | { tab: "ended"; items: HospitalPromotion[]; meta: DataTableMeta | null }
);

export function useHospitalPromotionList(query: PromotionListQuery) {
  const fetchRows = React.useCallback(async (next: PromotionListQuery, signal: AbortSignal) => {
    const params = promotionListApiQuery(next);
    const key = JSON.stringify(next);
    let result: PromotionListResult;
    if (next.tab === "active") {
      const response = await api.get<PromotionBoard>(`${PROMOTION_API}/board`, params, { signal });
      if (!isApiSuccess(response)) throw new Error(response.error.message);
      result = { key, tab: "active", board: response.data };
    } else {
      const response = await api.get<HospitalPromotion[]>(PROMOTION_API, params, { signal });
      if (!isApiSuccess(response)) throw new Error(response.error.message);
      result = { key, tab: "ended", items: response.data, meta: (response.meta as DataTableMeta | null) ?? null };
    }
    return { rows: [result], meta: null };
  }, []);

  const { rows, error, loading, refreshing, fetchList } = useListData({
    cacheNamespace: PROMOTION_CACHE,
    query,
    fetchRows,
    cacheTtlMs: 0,
    errorMessage: "프로모션 목록을 불러오지 못했습니다.",
  });

  React.useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") void fetchList(true);
    };
    // Date-based schedules change at midnight in Korea, even without a mutation.
    const day = 86_400_000;
    const koreaOffset = 9 * 3_600_000;
    const untilMidnight = day - ((Date.now() + koreaOffset) % day);
    let timer: ReturnType<typeof setTimeout>;
    const onMidnight = () => {
      refresh();
      timer = setTimeout(onMidnight, day);
    };
    timer = setTimeout(onMidnight, untilMidnight + 100);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [fetchList]);

  const result = rows[0]?.key === JSON.stringify(query) ? rows[0] : null;
  return { result, error, loading: !error && (loading || !result), refreshing, retry: () => fetchList(true) };
}
