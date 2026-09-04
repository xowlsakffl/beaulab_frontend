"use client";

import React from "react";
import { isApiSuccess } from "@beaulab/types";
import { api } from "@/lib/common/api";
import type { NoticeDetailResponse } from "@/lib/notice/detail";

export function useNoticeDetail(noticeId: number) {
  const [detail, setDetail] = React.useState<NoticeDetailResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!Number.isSafeInteger(noticeId) || noticeId <= 0) {
      setLoadError("잘못된 공지사항 경로입니다.");
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setLoadError(null);
    setDetail(null);

    const load = async () => {
      try {
        const response = await api.get<NoticeDetailResponse>(`/notices/${noticeId}`, undefined, {
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        if (!isApiSuccess(response)) {
          setLoadError(response.error.message || "공지사항 정보를 불러오지 못했습니다.");
          return;
        }
        setDetail(response.data);
      } catch {
        if (!controller.signal.aborted) setLoadError("공지사항 정보를 불러오는 중 오류가 발생했습니다.");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };
    void load();
    return () => controller.abort();
  }, [noticeId]);

  return { detail, isLoading: isLoading || (!loadError && detail?.id !== noticeId), loadError };
}
