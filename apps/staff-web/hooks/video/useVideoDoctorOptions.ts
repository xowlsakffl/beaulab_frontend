"use client";

import React from "react";

import { api } from "@/lib/common/api";
import type { VideoDoctorOption } from "@/lib/video/form";
import { isApiSuccess } from "@beaulab/types";

export function useVideoDoctorOptions(hospitalId: number | null) {
  const [options, setOptions] = React.useState<VideoDoctorOption[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!hospitalId) {
      setOptions([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    let isMounted = true;

    const fetchOptions = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await api.get<VideoDoctorOption[]>("/videos/doctor-options", {
          hospital_id: hospitalId,
          per_page: 50,
        });

        if (!isMounted) return;

        if (!isApiSuccess(response)) {
          setError(response.error.message || "의료진 목록을 불러오지 못했습니다.");
          setOptions([]);
          return;
        }

        setOptions(response.data);
      } catch {
        if (!isMounted) return;

        setError("의료진 목록을 불러오는 중 오류가 발생했습니다.");
        setOptions([]);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void fetchOptions();

    return () => {
      isMounted = false;
    };
  }, [hospitalId]);

  return {
    options,
    isLoading,
    error,
  };
}
