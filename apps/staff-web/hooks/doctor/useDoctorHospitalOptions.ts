"use client";

import { useDebouncedRemoteOptions } from "@/hooks/common/useDebouncedRemoteOptions";
import { api } from "@/lib/common/api";
import { createTimedCache } from "@/lib/common/request-cache";
import type { DoctorHospitalOption } from "@/lib/doctor/form";
import { isApiSuccess } from "@beaulab/types";

const doctorHospitalOptionsCache = createTimedCache<DoctorHospitalOption[]>("hospitals");

async function loadDoctorHospitalOptions(query: string, signal: AbortSignal) {
  const response = await api.get<DoctorHospitalOption[]>(
    "/doctors/hospital-options",
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

export function useDoctorHospitalOptions(enabled: boolean, query: string) {
  return useDebouncedRemoteOptions({
    enabled,
    query,
    cache: doctorHospitalOptionsCache,
    loadOptions: loadDoctorHospitalOptions,
    errorMessage: "병의원 검색 중 오류가 발생했습니다.",
  });
}
