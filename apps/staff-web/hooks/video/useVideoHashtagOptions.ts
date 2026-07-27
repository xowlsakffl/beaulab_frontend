"use client";

import React from "react";
import { isApiSuccess } from "@beaulab/types";

import { api } from "@/lib/common/api";
import { sanitizeHashtagName } from "@/lib/hashtag/list";
import type { VideoHashtagOption } from "@/lib/video/form";

export function useVideoHashtagOptions(enabled: boolean, query: string) {
  const [options, setOptions] = React.useState<VideoHashtagOption[]>([]);
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
        const response = await api.get<VideoHashtagOption[]>("/hashtags", {
          q: sanitizeHashtagName(query) || undefined,
          status: "ACTIVE",
          per_page: 20,
        });

        if (requestId !== requestIdRef.current) {
          return;
        }

        if (!isApiSuccess(response)) {
          setOptions([]);
          setError(response.error.message || "해시태그를 불러오지 못했습니다.");
          return;
        }

        setOptions(response.data);
      } catch {
        if (requestId !== requestIdRef.current) {
          return;
        }

        setOptions([]);
        setError("해시태그를 불러오는 중 오류가 발생했습니다.");
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
