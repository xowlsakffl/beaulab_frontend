"use client";

import React from "react";
import { isApiSuccess } from "@beaulab/types";

import { api } from "@/lib/common/api";
import type {
  ReportedContentDetailReportItem,
  ReportedContentReportsBlock,
  ReportedContentReportsMeta,
  ReportedContentTargetType,
} from "@/lib/reported-content/detail";

type UseReportedContentReportsOptions = {
  targetType?: ReportedContentTargetType | null;
  targetId?: number | null;
  enabled?: boolean;
  initialReports?: ReportedContentReportsBlock | null;
  initialPage?: number;
  latestKey?: string;
  errorMessage?: string;
};

function isValidTarget(targetId?: number | null): targetId is number {
  return Number.isFinite(targetId) && Number(targetId) > 0;
}

export function useReportedContentReports({
  targetType,
  targetId,
  enabled = true,
  initialReports = null,
  initialPage = 1,
  latestKey,
  errorMessage = "신고목록을 불러오지 못했습니다.",
}: UseReportedContentReportsOptions) {
  const hasInitialReports = Boolean(enabled && initialReports?.page === initialPage);
  const [page, setPage] = React.useState(initialPage);
  const [reports, setReports] = React.useState<ReportedContentDetailReportItem[]>(
    hasInitialReports ? (initialReports?.items ?? []) : [],
  );
  const [meta, setMeta] = React.useState<ReportedContentReportsMeta | null>(
    hasInitialReports ? (initialReports?.meta ?? null) : null,
  );
  const [loading, setLoading] = React.useState(Boolean(enabled && isValidTarget(targetId) && !hasInitialReports));
  const [error, setError] = React.useState<string | null>(null);
  const requestSeqRef = React.useRef(0);

  React.useEffect(() => {
    const shouldUseInitialReports = Boolean(enabled && initialReports?.page === initialPage);

    requestSeqRef.current += 1;
    setPage(initialPage);
    setReports(shouldUseInitialReports ? (initialReports?.items ?? []) : []);
    setMeta(shouldUseInitialReports ? (initialReports?.meta ?? null) : null);
    setError(null);
    setLoading(Boolean(enabled && isValidTarget(targetId) && !shouldUseInitialReports));
  }, [enabled, initialPage, initialReports, targetId, targetType]);

  const fetchReports = React.useCallback(
    async (nextPage = page) => {
      if (!enabled || !targetType || !isValidTarget(targetId)) return;

      const requestSeq = ++requestSeqRef.current;
      setLoading(true);
      setError(null);

      try {
        const response = await api.get<ReportedContentDetailReportItem[]>(
          `/reported-contents/${targetType}/${targetId}/reports`,
          { reports_page: nextPage },
          latestKey ? { latestKey } : undefined,
        );

        if (requestSeq !== requestSeqRef.current) return;

        if (!isApiSuccess(response)) {
          setReports([]);
          setMeta(null);
          setError(response.error.message || errorMessage);
          return;
        }

        setReports(response.data ?? []);
        setMeta((response.meta as ReportedContentReportsMeta | null) ?? null);
      } catch {
        if (requestSeq !== requestSeqRef.current) return;

        setReports([]);
        setMeta(null);
        setError("신고목록 조회 중 오류가 발생했습니다.");
      } finally {
        if (requestSeq === requestSeqRef.current) setLoading(false);
      }
    },
    [enabled, errorMessage, latestKey, page, targetId, targetType],
  );

  React.useEffect(() => {
    if (!enabled || !targetType || !isValidTarget(targetId)) return;
    if (initialReports?.page === page) {
      setReports(initialReports.items);
      setMeta(initialReports.meta);
      setError(null);
      setLoading(false);
      return;
    }

    void fetchReports(page);
  }, [enabled, fetchReports, initialReports, page, targetId, targetType]);

  return {
    reports,
    meta,
    loading,
    error,
    page,
    setPage,
    fetchReports,
  };
}
