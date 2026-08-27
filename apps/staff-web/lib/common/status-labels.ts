import type { BadgeColor } from "@beaulab/ui-admin";

import { STATUS_BADGE_COLORS } from "@/lib/common/status-badge-colors";

export type VisibilityLabelOptions = {
  publicLabel?: string;
  privateLabel?: string;
  activeLabel?: string;
  inactiveLabel?: string;
  fallbackLabel?: string;
};

export function labelAdminStatus(status?: string | null, fallbackLabel = "-") {
  if (status === "NORMAL" || status === "ACTIVE" || status === "정상") return "정상";
  if (status === "FORCED_STOPPED" || status === "ADMIN_STOPPED" || status === "강제중지") return "강제중지";

  return status?.trim() || fallbackLabel;
}

export function adminStatusColor(status?: string | null): BadgeColor {
  if (status === "FORCED_STOPPED" || status === "ADMIN_STOPPED" || status === "강제중지") {
    return STATUS_BADGE_COLORS.inactive;
  }
  if (status === "NORMAL" || status === "ACTIVE" || status === "정상") return STATUS_BADGE_COLORS.active;

  return STATUS_BADGE_COLORS.neutral;
}

export function labelOwnerVisibilityStatus(status?: string | null, options: VisibilityLabelOptions = {}) {
  const {
    publicLabel = "공개",
    privateLabel = "비공개",
    activeLabel = "노출",
    inactiveLabel = "미노출",
    fallbackLabel = "-",
  } = options;

  if (status === "PUBLIC" || status === "공개") return publicLabel;
  if (status === "PRIVATE" || status === "비공개" || status === "미공개") return privateLabel;
  if (status === "ACTIVE" || status === "노출") return activeLabel;
  if (status === "INACTIVE" || status === "미노출") return inactiveLabel;

  return status?.trim() || fallbackLabel;
}

export function ownerVisibilityStatusColor(status?: string | null): BadgeColor {
  if (status === "PRIVATE" || status === "비공개" || status === "미공개") {
    return STATUS_BADGE_COLORS.inactive;
  }
  if (status === "INACTIVE" || status === "미노출") return STATUS_BADGE_COLORS.inactive;
  if (status === "PUBLIC" || status === "공개") return STATUS_BADGE_COLORS.active;
  if (status === "ACTIVE" || status === "노출") return STATUS_BADGE_COLORS.active;

  return STATUS_BADGE_COLORS.neutral;
}
