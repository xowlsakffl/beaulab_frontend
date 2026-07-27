"use client";

import React from "react";
import { isApiSuccess } from "@beaulab/types";

import { api } from "@/lib/common/api";
import { getTimedCache, setTimedCache } from "@/lib/common/request-cache";
import { sanitizeHashtagName } from "@/lib/hashtag/list";
import type { VideoHashtagOption } from "@/lib/video/form";

const VIDEO_HASHTAG_OPTIONS_CACHE_TTL_MS = 5 * 60 * 1000;
const videoHashtagOptionsCache = new Map<string, { expiresAt: number; value: VideoHashtagOption[] }>();

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
      const sanitizedQuery = sanitizeHashtagName(query);
      const cacheKey = sanitizedQuery;
      const cachedOptions = getTimedCache(videoHashtagOptionsCache, cacheKey);

      if (cachedOptions) {
        setOptions(cachedOptions);
        setIsLoading(false);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await api.get<VideoHashtagOption[]>("/hashtags", {
          q: sanitizedQuery || undefined,
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

        setTimedCache(videoHashtagOptionsCache, cacheKey, response.data, VIDEO_HASHTAG_OPTIONS_CACHE_TTL_MS);
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
