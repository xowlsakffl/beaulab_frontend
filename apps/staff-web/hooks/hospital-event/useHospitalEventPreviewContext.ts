"use client";

import React from "react";
import { fetchHospitalEventPreviewContext } from "@/lib/hospital-event/api";
import { getRequestCacheVersion, subscribeRequestCache } from "@/lib/common/request-cache";
import type { HospitalEventFormValues } from "@/lib/hospital-event/form";
import type { HospitalEventPreviewContext } from "@/lib/hospital-event/preview";

const getPreviewVersion = () => getRequestCacheVersion(["hospitals", "doctors"]);

export function useHospitalEventPreviewContext(form: HospitalEventFormValues) {
  const doctorIds = [
    ...new Set(form.doctor_assignments.flatMap((item) => (item.hospital_doctor_id ? [item.hospital_doctor_id] : []))),
  ].sort((a, b) => a - b);
  const query =
    form.event_type === "TEXT" && form.hospital_id
      ? JSON.stringify({ hospital_id: form.hospital_id, doctor_ids: doctorIds })
      : null;
  const version = React.useSyncExternalStore(subscribeRequestCache, getPreviewVersion, getPreviewVersion);
  const [attempt, setAttempt] = React.useState(0);
  const [result, setResult] = React.useState<{
    query: string;
    version: number;
    attempt: number;
    data: HospitalEventPreviewContext | null;
    error: string | null;
  } | null>(null);

  React.useEffect(() => {
    if (!query) return;
    const controller = new AbortController();
    void (async () => {
      try {
        const filters = JSON.parse(query) as { hospital_id: number; doctor_ids: number[] };
        const data = await fetchHospitalEventPreviewContext(filters, controller.signal);
        if (!controller.signal.aborted) setResult({ query, version, attempt, data, error: null });
      } catch (error) {
        if (!controller.signal.aborted)
          setResult({
            query,
            version,
            attempt,
            data: null,
            error: error instanceof Error ? error.message : "병원 정보를 불러오지 못했습니다.",
          });
      }
    })();
    return () => controller.abort();
  }, [query, version, attempt]);

  const current = result?.query === query && result.version === version && result.attempt === attempt ? result : null;
  return {
    data: query ? (current?.data ?? null) : null,
    error: query ? (current?.error ?? null) : null,
    isLoading: Boolean(query && !current),
    retry: () => setAttempt((value) => value + 1),
  };
}

export type HospitalEventPreviewContextState = ReturnType<typeof useHospitalEventPreviewContext>;
