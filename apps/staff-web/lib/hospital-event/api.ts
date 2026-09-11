import { isApiSuccess } from "@beaulab/types";
import type { DataTableMeta } from "@beaulab/ui-admin/components/tables";
import { api } from "@/lib/common/api";
import { normalizeHospitalEvent, type HospitalEventApiItem, type buildHospitalEventsQuery } from "./list";
import type { HospitalEventPreviewContext } from "./preview";

export async function fetchHospitalEventRows(query: ReturnType<typeof buildHospitalEventsQuery>, signal: AbortSignal) {
  const response = await api.get<HospitalEventApiItem[]>("/hospital-events", query, {
    signal,
    latestKey: "hospital-events:list",
  });
  if (!isApiSuccess(response)) throw new Error(response.error.message || "이벤트 목록 조회에 실패했습니다.");
  return { rows: response.data.map(normalizeHospitalEvent), meta: (response.meta as DataTableMeta | null) ?? null };
}

export async function fetchHospitalEventPreviewContext(
  filters: { hospital_id: number; doctor_ids: number[] },
  signal: AbortSignal,
) {
  const response = await api.get<HospitalEventPreviewContext>(
    "/hospital-events/preview-context",
    { hospital_id: filters.hospital_id, "doctor_ids[]": filters.doctor_ids },
    { signal },
  );
  if (!isApiSuccess(response)) throw new Error(response.error.message || "병원 정보를 불러오지 못했습니다.");
  return response.data;
}
