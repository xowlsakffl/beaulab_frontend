"use client";

import { useDebouncedRemoteOptions } from "@/hooks/common/useDebouncedRemoteOptions";
import { api } from "@/lib/common/api";
import { createTimedCache } from "@/lib/common/request-cache";
import type { VideoHospitalOption } from "@/lib/video/form";
import { isApiSuccess } from "@beaulab/types";

const videoHospitalOptionsCache = createTimedCache<VideoHospitalOption[]>("hospitals");

async function loadVideoHospitalOptions(query: string, signal: AbortSignal) {
  const response = await api.get<VideoHospitalOption[]>(
    "/videos/hospital-options",
    {
      q: query || undefined,
      per_page: 10,
    },
    { signal },
  );

  if (!isApiSuccess(response)) {
    throw new Error(response.error.message || "병의원 검색에 실패했습니다.");
  }

  return response.data;
}

export function useVideoHospitalOptions(enabled: boolean, query: string) {
  return useDebouncedRemoteOptions({
    enabled,
    query,
    cache: videoHospitalOptionsCache,
    loadOptions: loadVideoHospitalOptions,
    errorMessage: "병의원 검색 중 오류가 발생했습니다.",
  });
}
