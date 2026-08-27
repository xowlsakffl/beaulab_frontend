import type { BadgeColor } from "@beaulab/ui-admin";

import { STATUS_BADGE_COLORS } from "@/lib/common/status-badge-colors";

export function reportStatusBadgeColor(status?: string | null): BadgeColor {
  if (status === "REPORTED" || status === "RECEIVED") return STATUS_BADGE_COLORS.reportReceived;
  if (status === "AUTO_BLOCKED" || status === "INACTIVE") return STATUS_BADGE_COLORS.reportAutoBlocked;
  if (status === "ADMIN_HIDDEN") return STATUS_BADGE_COLORS.reportRestricted;
  if (status === "NORMAL_VISIBLE") return STATUS_BADGE_COLORS.reportVisible;
  if (status === "REEXPOSED") return STATUS_BADGE_COLORS.reportReexposed;
  if (status === "VALID") return STATUS_BADGE_COLORS.reportAutoBlocked;
  if (status === "INVALID") return STATUS_BADGE_COLORS.reportInvalid;

  return STATUS_BADGE_COLORS.reportInvalid;
}

export function reportStatusBadgeLabel(status?: string | null, fallbackLabel = "-") {
  if (status === "REPORTED" || status === "RECEIVED") return "신고접수";
  if (status === "AUTO_BLOCKED") return "자동차단";
  if (status === "ADMIN_HIDDEN" || status === "INACTIVE") return "노출중지";
  if (status === "NORMAL_VISIBLE") return "정상노출";
  if (status === "REEXPOSED") return "재노출";
  if (status === "VALID") return "유효신고";
  if (status === "INVALID") return "신고오류";

  return fallbackLabel;
}

export function reportWarningBadgeColor(status?: string | null): BadgeColor {
  if (status === "WARNED") return STATUS_BADGE_COLORS.reportAutoBlocked;
  if (status === "IGNORED") return STATUS_BADGE_COLORS.reportInvalid;

  return STATUS_BADGE_COLORS.neutral;
}

export function reportWarningBadgeLabel(status?: string | null, fallbackLabel = "-") {
  if (status === "WARNED") return "경고";
  if (status === "IGNORED") return "무시";

  return fallbackLabel;
}
