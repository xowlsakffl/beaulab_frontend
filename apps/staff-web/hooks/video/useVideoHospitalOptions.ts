"use client";

import React from "react";

import { api } from "@/lib/common/api";
import type { VideoHospitalOption } from "@/lib/video/form";
import { isApiSuccess } from "@beaulab/types";

export function useVideoHospitalOptions(enabled: boolean, query: string) {
  const [options, setOptions] = React.useState<VideoHospitalOption[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const requestIdRef = React.useRef(0);

  React.useEffect(() => {
    if (!enabled) return;

    const timer = window.setTimeout(async () => {
      requestIdRef.current += 1;
      const requestId = requestIdRef.current;

      setIsLoading(true);
      setError(null);

      try {
        const response = await api.get<VideoHospitalOption[]>("/videos/hospital-options", {
          q: query.trim() || undefined,
          per_page: 10,
        });

        if (requestId !== requestIdRef.current) {
          return;
        }

        if (!isApiSuccess(response)) {
          setError(response.error.message || "병의원 검색에 실패했습니다.");
          setOptions([]);
          return;
        }

        setOptions(response.data);
      } catch {
        if (requestId !== requestIdRef.current) {
          return;
        }

        setError("병의원 검색 중 오류가 발생했습니다.");
        setOptions([]);
      } finally {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [enabled, query]);

  return {
    options,
    isLoading,
    error,
  };
}
