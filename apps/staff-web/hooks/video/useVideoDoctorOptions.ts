"use client";

import { isApiSuccess } from "@beaulab/types";

import { useDebouncedRemoteOptions } from "@/hooks/common/useDebouncedRemoteOptions";
import { api } from "@/lib/common/api";
import { createTimedCache } from "@/lib/common/request-cache";
import type { VideoDoctorOption } from "@/lib/video/form";

const videoDoctorOptionsCache = createTimedCache<VideoDoctorOption[]>();

async function loadVideoDoctorOptions(hospitalId: string, signal: AbortSignal) {
  const response = await api.get<VideoDoctorOption[]>(
    "/videos/doctor-options",
    {
      hospital_id: Number(hospitalId),
      per_page: 50,
    },
    { signal },
  );
  if (!isApiSuccess(response)) {
    throw new Error(response.error.message || "의료진 목록을 불러오지 못했습니다.");
  }
  return response.data;
}

export function useVideoDoctorOptions(hospitalId: number | null) {
  return useDebouncedRemoteOptions({
    enabled: hospitalId !== null,
    query: hospitalId === null ? "" : String(hospitalId),
    cache: videoDoctorOptionsCache,
    loadOptions: loadVideoDoctorOptions,
    errorMessage: "의료진 목록을 불러오는 중 오류가 발생했습니다.",
    debounceMs: 0,
  });
}
