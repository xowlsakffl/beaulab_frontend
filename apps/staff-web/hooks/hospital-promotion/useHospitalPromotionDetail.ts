"use client";

import React from "react";
import { isApiSuccess } from "@beaulab/types";
import { fetchHospitalPromotion } from "@/lib/hospital-promotion/api";
import type { HospitalPromotionDetail } from "@/lib/hospital-promotion/types";

export function useHospitalPromotionDetail(id: number) {
  const [state, setState] = React.useState<{
    id: number;
    detail: HospitalPromotionDetail | null;
    isLoading: boolean;
    loadError: string | null;
  }>({ id, detail: null, isLoading: true, loadError: null });
  React.useEffect(() => {
    if (!Number.isSafeInteger(id) || id <= 0) {
      setState({ id, detail: null, isLoading: false, loadError: "잘못된 프로모션 경로입니다." });
      return;
    }
    const controller = new AbortController();
    setState({ id, detail: null, isLoading: true, loadError: null });
    void (async () => {
      try {
        const response = await fetchHospitalPromotion(id, controller.signal);
        if (controller.signal.aborted) return;
        if (!isApiSuccess(response)) {
          setState({
            id,
            detail: null,
            isLoading: false,
            loadError: response.error.message || "프로모션 정보를 불러오지 못했습니다.",
          });
          return;
        }
        setState({ id, detail: response.data, isLoading: false, loadError: null });
      } catch {
        if (!controller.signal.aborted)
          setState({ id, detail: null, isLoading: false, loadError: "프로모션 정보를 불러오지 못했습니다." });
      }
    })();
    return () => controller.abort();
  }, [id]);
  if (state.id !== id) return { detail: null, isLoading: true, loadError: null };
  return state;
}
