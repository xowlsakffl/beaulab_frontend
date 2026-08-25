import type { BadgeColor } from "@beaulab/ui-admin";

export type ReviewAllowStatus = "NOT_APPLIED" | "PENDING" | "REVIEWING" | "APPROVED" | "REJECTED";

export const NOT_APPLIED_REVIEW_ALLOW_STATUS_OPTION = { value: "NOT_APPLIED", label: "미신청" } as const;

export const REVIEW_ALLOW_STATUS_OPTIONS = [
  { value: "PENDING", label: "신청" },
  { value: "REVIEWING", label: "검수" },
  { value: "APPROVED", label: "승인" },
  { value: "REJECTED", label: "반려" },
] as const;

export const REVIEW_ALLOW_STATUS_WITH_NOT_APPLIED_OPTIONS = [
  NOT_APPLIED_REVIEW_ALLOW_STATUS_OPTION,
  ...REVIEW_ALLOW_STATUS_OPTIONS,
] as const;

export const REVIEW_ALLOW_STATUS_ACTION_OPTIONS = REVIEW_ALLOW_STATUS_OPTIONS.filter(
  (option) => option.value !== "PENDING",
);

export function labelReviewAllowStatus(status?: string | null, fallbackLabel = "-") {
  return REVIEW_ALLOW_STATUS_WITH_NOT_APPLIED_OPTIONS.find((option) => option.value === status)?.label ?? fallbackLabel;
}

export function reviewAllowStatusColor(status?: string | null): BadgeColor {
  if (status === "PENDING") return "info";
  if (status === "REVIEWING") return "warning";
  if (status === "APPROVED") return "success";
  if (status === "REJECTED") return "error";

  return "light";
}

export function isPendingReviewAllowStatus(status?: string | null) {
  return status === "PENDING" || status === "REVIEWING";
}

export function pendingReviewAllowStatusRowClass(status?: string | null) {
  return isPendingReviewAllowStatus(status) ? "shadow-[inset_3px_0_0_var(--color-brand-500)]" : undefined;
}
