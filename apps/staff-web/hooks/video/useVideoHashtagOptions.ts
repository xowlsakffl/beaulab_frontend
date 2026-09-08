"use client";

import { isApiSuccess } from "@beaulab/types";

import { useDebouncedRemoteOptions } from "@/hooks/common/useDebouncedRemoteOptions";
import { api } from "@/lib/common/api";
import { createTimedCache } from "@/lib/common/request-cache";
import { sanitizeHashtagName } from "@/lib/hashtag/list";
import type { VideoHashtagOption } from "@/lib/video/form";

const videoHashtagOptionsCache = createTimedCache<VideoHashtagOption[]>();

async function loadVideoHashtagOptions(query: string, signal: AbortSignal) {
  const response = await api.get<VideoHashtagOption[]>(
    "/hashtags",
    {
      q: query || undefined,
      status: "ACTIVE",
      per_page: 20,
    },
    { signal },
  );

  if (!isApiSuccess(response)) {
    throw new Error(response.error.message || "해시태그를 불러오지 못했습니다.");
  }

  return response.data;
}

export function useVideoHashtagOptions(enabled: boolean, query: string) {
  return useDebouncedRemoteOptions({
    enabled,
    query,
    cache: videoHashtagOptionsCache,
    loadOptions: loadVideoHashtagOptions,
    errorMessage: "해시태그를 불러오는 중 오류가 발생했습니다.",
    normalizeQuery: sanitizeHashtagName,
  });
}
