import type { DataTableMeta } from "@beaulab/ui-admin";

import {
  formatHospitalEvaluationAuthorName,
  formatHospitalEvaluationCost,
  formatHospitalEvaluationRating,
  labelHospitalEvaluationReviewType,
  labelHospitalEvaluationVisibilityStatus,
  type HospitalEvaluationAuthor,
  type HospitalEvaluationCategory,
  type HospitalEvaluationDoctor,
  type HospitalEvaluationHospital,
} from "@/lib/hospital-evaluation/list";

export type HospitalEvaluationMediaAsset = {
  id: number;
  collection?: string | null;
  disk?: string | null;
  path?: string | null;
  url?: string | null;
  mime_type?: string | null;
  size?: number | null;
  width?: number | null;
  height?: number | null;
  sort_order?: number | null;
  is_primary?: boolean | null;
  metadata?: unknown;
  created_at?: string | null;
  updated_at?: string | null;
};

export type HospitalEvaluationReceiptDetail = {
  status?: string | null;
  label?: string | null;
  rejection_reason?: string | null;
  rejection_reason_label?: string | null;
  rejection_reason_text?: string | null;
};

export type HospitalEvaluationRatings = {
  staff_kindness?: number | null;
  surgery_satisfaction?: number | null;
  facility?: number | null;
  aftercare?: number | null;
  cost?: number | null;
  average?: number | null;
};

export type HospitalEvaluationAssessmentItem = {
  value?: boolean | null;
  label?: string | null;
};

export type HospitalEvaluationAssessment = {
  overtreatment?: HospitalEvaluationAssessmentItem | null;
  waiting_time?: HospitalEvaluationAssessmentItem | null;
  doctor_consultation?: HospitalEvaluationAssessmentItem | null;
  recommendation?: HospitalEvaluationAssessmentItem | null;
};

export type HospitalEvaluationOperationHistory = {
  id: number;
  actor_label?: string | null;
  action?: string | null;
  field?: string | null;
  before_value?: unknown;
  after_value?: unknown;
  reason?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string | null;
};

export type PaginatedBlock<T> = {
  items?: T[] | null;
  meta?: DataTableMeta | null;
};

export type HospitalEvaluationDetailResponse = {
  id: number;
  author?: HospitalEvaluationAuthor | null;
  hospital?: HospitalEvaluationHospital | null;
  doctor?: HospitalEvaluationDoctor | null;
  categories?: HospitalEvaluationCategory[] | null;
  category_domain?: string | null;
  content?: string | null;
  phone?: string | null;
  author_ip?: string | null;
  cost?: number | null;
  ratings?: HospitalEvaluationRatings | null;
  assessment?: HospitalEvaluationAssessment | null;
  status?: string | null;
  post_status?: string | null;
  view_count?: number | null;
  receipt?: HospitalEvaluationReceiptDetail | null;
  images?: HospitalEvaluationMediaAsset[] | null;
  receipt_images?: HospitalEvaluationMediaAsset[] | null;
  operation_histories?: PaginatedBlock<HospitalEvaluationOperationHistory> | null;
  created_at?: string | null;
  updated_at?: string | null;
  deleted_at?: string | null;
};

export type HospitalEvaluationReceiptDecision = "verify" | "reject";

export const HOSPITAL_EVALUATION_DETAIL_HISTORY_PER_PAGE = 10;

export const HOSPITAL_EVALUATION_RECEIPT_REJECTION_OPTIONS = [
  { value: "IMAGE_MISMATCH", label: "영수증 이미지 불일치" },
  { value: "BUSINESS_NAME_MISMATCH", label: "상호 불일치" },
  { value: "BUSINESS_NUMBER_MISMATCH", label: "사업자번호 불일치" },
  { value: "TRANSACTION_DATE_MISMATCH", label: "거래일시 불일치" },
  { value: "SURGERY_COST_MISMATCH", label: "수술금액 불일치" },
  { value: "OTHER", label: "기타" },
] as const;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export function resolveHospitalEvaluationMediaUrl(media?: HospitalEvaluationMediaAsset | null): string | null {
  const rawUrl = media?.url?.trim();
  if (rawUrl) return rawUrl;

  const rawPath = media?.path?.trim();
  if (!rawPath) return null;
  if (/^https?:\/\//i.test(rawPath)) return rawPath;
  if (!API_BASE_URL) return rawPath;
  if (rawPath.startsWith("/storage/")) return `${API_BASE_URL}${rawPath}`;
  if (rawPath.startsWith("storage/")) return `${API_BASE_URL}/${rawPath}`;
  if (rawPath.startsWith("/")) return `${API_BASE_URL}${rawPath}`;

  return `${API_BASE_URL}/storage/${rawPath}`;
}

export function formatHospitalEvaluationDetailDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function formatHospitalEvaluationDetailDateTime(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function formatHospitalEvaluationDetailAuthorName(author?: HospitalEvaluationAuthor | null) {
  return formatHospitalEvaluationAuthorName(author);
}

export function formatHospitalEvaluationDetailCost(value?: number | null) {
  return formatHospitalEvaluationCost(Number(value ?? 0));
}

export function formatHospitalEvaluationDetailRating(value?: number | null) {
  return formatHospitalEvaluationRating(Number(value ?? 0));
}

export function formatHospitalEvaluationAverageRating(value?: number | null) {
  return Number(value ?? 0).toFixed(1);
}

export function labelHospitalEvaluationDetailReviewType(domain?: string | null) {
  return labelHospitalEvaluationReviewType(domain);
}

export function titleHospitalEvaluationDetailReviewType(domain?: string | null) {
  const label = labelHospitalEvaluationDetailReviewType(domain);
  if (label === "-") return "병의원 후기 평가";

  return `${label.replace(/후기$/, "").trim()} 후기 평가`;
}

export function labelHospitalEvaluationHistoryChange(history: HospitalEvaluationOperationHistory) {
  const metadataLabel = getHistoryMetadataLabel(history.metadata, "after_label");
  if (metadataLabel) return metadataLabel;

  if (history.field === "status") {
    return labelHospitalEvaluationVisibilityStatus(stringifyHistoryValue(history.after_value));
  }

  if (history.field === "receipt_status") {
    return labelHospitalEvaluationReceiptStatus(stringifyHistoryValue(history.after_value));
  }

  return history.action?.trim() || "-";
}

export function formatHospitalEvaluationHistoryReason(history: HospitalEvaluationOperationHistory) {
  const reason = history.reason?.trim() || "";
  if (reason) return reason;

  return getHistoryMetadataLabel(history.metadata, "rejection_reason_label") || "-";
}

export function labelHospitalEvaluationReceiptStatus(status?: string | null) {
  switch (status) {
    case "UPLOADED":
      return "영수증";
    case "VERIFIED":
      return "영수증 인증";
    case "REJECTED":
      return "영수증 부적합";
    case "NONE":
      return "없음";
    default:
      return status?.trim() || "-";
  }
}

function getHistoryMetadataLabel(metadata: Record<string, unknown> | null | undefined, key: string) {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim() !== "" ? value.trim() : "";
}

function stringifyHistoryValue(value: unknown) {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}
