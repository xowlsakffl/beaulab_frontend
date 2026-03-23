"use client";

import React from "react";

import { api } from "@/lib/common/api";
import type { HospitalFeatureItem } from "@/lib/hospital/form";
import { isApiSuccess } from "@beaulab/types";

export function useHospitalFeatureList() {
  const [features, setFeatures] = React.useState<HospitalFeatureItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    const fetchFeatures = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await api.get<HospitalFeatureItem[]>("/hospital-features", {
          status: ["ACTIVE"],
        });

        if (!isApiSuccess(response)) {
          throw new Error(response.error.message || "병원 특징 목록을 불러오지 못했습니다.");
        }

        if (!isMounted) return;

        setFeatures(
          response.data
            .filter((item) => item.status === undefined || item.status === "ACTIVE")
            .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.id - b.id),
        );
      } catch (fetchError) {
        if (!isMounted) return;

        setError(fetchError instanceof Error ? fetchError.message : "병원 특징 목록을 불러오는 중 오류가 발생했습니다.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void fetchFeatures();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    features,
    isLoading,
    error,
  };
}
