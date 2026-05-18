import type { DataTableMeta } from "@beaulab/ui-admin";

import type { ContentReportSummary } from "@/lib/common/content-report";
import {
  formatHospitalReviewAuthorName,
  formatHospitalReviewCategories,
  labelHospitalReviewVisibilityStatus,
  type HospitalReviewAuthor,
  type HospitalReviewCategory,
  type HospitalReviewDoctor,
  type HospitalReviewHospital,
  type HospitalReviewMediaAsset,
} from "@/lib/hospital-review/list";

export type HospitalReviewOperationHistory = {
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

export type HospitalReviewCommentHistory = {
  actor_label?: string | null;
  status?: string | null;
  created_at?: string | null;
  reason?: string | null;
};

export type HospitalReviewCommentMention = {
  id?: number | null;
  mentioned_user_id?: number | null;
  mentioned_by_user_id?: number | null;
  mention_text?: string | null;
  mentioned_user_name?: string | null;
};

export type HospitalReviewDetailComment = {
  id: number;
  parent_id?: number | null;
  is_reply?: boolean | null;
  author?: HospitalReviewAuthor | null;
  content?: string | null;
  status?: string | null;
  author_ip?: string | null;
  like_count?: number | null;
  mention?: HospitalReviewCommentMention | null;
  report?: ContentReportSummary | null;
  operation_histories?: HospitalReviewCommentHistory[] | null;
  created_at?: string | null;
  updated_at?: string | null;
  deleted_at?: string | null;
};

export type PaginatedBlock<T> = {
  items?: T[] | null;
  meta?: DataTableMeta | null;
};

export type HospitalReviewDetailResponse = {
  id: number;
  author?: HospitalReviewAuthor | null;
  hospital?: HospitalReviewHospital | null;
  doctor?: HospitalReviewDoctor | null;
  categories?: HospitalReviewCategory[] | null;
  report?: ContentReportSummary | null;
  title?: string | null;
  content?: string | null;
  author_ip?: string | null;
  cost?: number | null;
  rating?: number | null;
  status?: string | null;
  is_main_featured?: boolean | null;
  is_sub_featured?: boolean | null;
  view_count?: number | null;
  comment_count?: number | null;
  like_count?: number | null;
  save_count?: number | null;
  before_images?: HospitalReviewMediaAsset[] | null;
  after_images?: HospitalReviewMediaAsset[] | null;
  operation_histories?: PaginatedBlock<HospitalReviewOperationHistory> | null;
  comments?: PaginatedBlock<HospitalReviewDetailComment> | null;
  created_at?: string | null;
  updated_at?: string | null;
  deleted_at?: string | null;
};

export const HOSPITAL_REVIEW_DETAIL_COMMENT_PER_PAGE_OPTIONS = [10, 20, 50] as const;
export const HOSPITAL_REVIEW_DETAIL_HISTORY_PER_PAGE = 10;

export function formatHospitalReviewDetailDateTime(value?: string | null) {
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

export function formatHospitalReviewDetailDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function formatHospitalReviewDetailCategories(categories?: HospitalReviewCategory[] | null) {
  return formatHospitalReviewCategories(categories, 3);
}

export function getHospitalReviewDetailSmallCategoryNames(categories?: HospitalReviewCategory[] | null) {
  return Array.from(new Set(
    (categories ?? [])
      .map((category) => {
        const pathItems = (category.full_path?.trim() || category.name?.trim() || "")
          .split(">")
          .map((item) => item.trim())
          .filter(Boolean);

        if (Number(category.depth ?? 0) > 0 && Number(category.depth ?? 0) !== 3) {
          return "";
        }

        return pathItems.at(-1) || category.name?.trim() || "";
      })
      .filter(Boolean),
  ));
}

export function formatHospitalReviewDetailAuthorName(author?: HospitalReviewAuthor | null) {
  return formatHospitalReviewAuthorName(author);
}

export function formatHospitalReviewDetailCost(value?: number | null) {
  return `${Number(value ?? 0).toLocaleString()}만원`;
}

export function formatHospitalReviewDetailRating(value?: number | null) {
  return String(Number(value ?? 0));
}

export function labelHospitalReviewHistoryChange(history: HospitalReviewOperationHistory) {
  if (history.field === "status") {
    return labelHospitalReviewVisibilityStatus(stringifyHistoryValue(history.after_value));
  }

  if (history.field === "warning_status") {
    return labelHospitalReviewWarningHistoryStatus(history);
  }

  if (history.field === "is_main_featured") {
    return stringifyHistoryValue(history.after_value) === "true" || stringifyHistoryValue(history.after_value) === "1"
      ? "메인 베스트"
      : "메인 베스트 해제";
  }

  if (history.field === "is_sub_featured") {
    return stringifyHistoryValue(history.after_value) === "true" || stringifyHistoryValue(history.after_value) === "1"
      ? "부위 베스트"
      : "부위 베스트 해제";
  }

  return history.action?.trim() || "-";
}

export function labelHospitalReviewCommentHistoryChange(history: HospitalReviewCommentHistory) {
  if (history.status) {
    return labelHospitalReviewVisibilityStatus(history.status);
  }

  return "-";
}

export function formatHospitalReviewHistoryReason(history: HospitalReviewOperationHistory) {
  const reason = history.reason?.trim() || "";

  return reason || "-";
}

export function formatHospitalReviewCommentHistoryReason(history: HospitalReviewCommentHistory) {
  const reason = history.reason?.trim() || "";

  return reason || "-";
}

function stringifyHistoryValue(value: unknown) {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function labelHospitalReviewWarningHistoryStatus(history: HospitalReviewOperationHistory) {
  const metadataLabel = getHistoryMetadataLabel(history.metadata, "after_label");
  if (metadataLabel) return metadataLabel;

  switch (stringifyHistoryValue(history.after_value)) {
    case "WARNED":
      return "경고";
    case "IGNORED":
      return "무시";
    case "NONE":
      return "미처리";
    default:
      return "-";
  }
}

function getHistoryMetadataLabel(metadata: Record<string, unknown> | null | undefined, key: string) {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim() !== "" ? value.trim() : "";
}
