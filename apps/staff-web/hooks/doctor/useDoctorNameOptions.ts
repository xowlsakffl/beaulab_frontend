"use client";

import React from "react";

import { api } from "@/lib/common/api";
import { isApiSuccess } from "@beaulab/types";

export type DoctorNameOption = {
  id: number;
  name: string;
  position?: string | null;
};

export function useDoctorNameOptions(hospitalId: number | null, enabled: boolean, query: string) {
  const [options, setOptions] = React.useState<DoctorNameOption[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const requestIdRef = React.useRef(0);

  React.useEffect(() => {
    if (!enabled || !hospitalId) {
      setOptions([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    const timer = window.setTimeout(async () => {
      requestIdRef.current += 1;
      const requestId = requestIdRef.current;

      setIsLoading(true);
      setError(null);

      try {
        const response = await api.get<DoctorNameOption[]>("/doctors/doctor-options", {
          hospital_id: hospitalId,
          q: query.trim() || undefined,
          per_page: 3,
        });

        if (requestId !== requestIdRef.current) return;

        if (!isApiSuccess(response)) {
          setError(response.error.message || "의료진 목록을 불러오지 못했습니다.");
          setOptions([]);
          return;
        }

        setOptions(response.data);
      } catch {
        if (requestId !== requestIdRef.current) return;

        setError("의료진 목록을 불러오는 중 오류가 발생했습니다.");
        setOptions([]);
      } finally {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [enabled, hospitalId, query]);

  return {
    options,
    isLoading,
    error,
  };
}
