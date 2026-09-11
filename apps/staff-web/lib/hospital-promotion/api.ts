import { api } from "@/lib/common/api";
import { PROMOTION_API, type HospitalPromotionDetail, type PromotionAvailability } from "./types";

export function fetchHospitalPromotion(id: number, signal: AbortSignal) {
  return api.get<HospitalPromotionDetail>(`${PROMOTION_API}/${id}`, undefined, { signal });
}

export function saveHospitalPromotion(data: FormData, id?: number) {
  // The shared API mutation wrapper invalidates the promotion list/board caches on success.
  return api.post<HospitalPromotionDetail>(id ? `${PROMOTION_API}/${id}` : PROMOTION_API, data);
}

export function fetchPromotionAvailability(
  query: {
    side: string;
    slot: string;
    start_date: string;
    end_date: string;
    exclude_id?: number;
  },
  signal: AbortSignal,
) {
  return api.get<PromotionAvailability>(`${PROMOTION_API}/availability`, query, { signal });
}

export function uploadPromotionEditorImage(file: File, promotionId?: number) {
  const data = new FormData();
  data.append("image", file);
  if (promotionId) data.append("promotion_id", String(promotionId));
  // Temporary editor assets do not mutate a promotion or invalidate list queries.
  return api.raw<{ url: string; path: string }>(`${PROMOTION_API}/editor-images`, { method: "POST", body: data });
}

export function deletePromotionEditorImages(urls: string[]) {
  return api.raw<{ deleted_count: number }>(`${PROMOTION_API}/editor-images`, { method: "DELETE", body: { urls } });
}
