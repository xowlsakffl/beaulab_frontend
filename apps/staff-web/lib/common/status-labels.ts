import type { BadgeColor } from "@beaulab/ui-admin";

type VisibilityLabelOptions = {
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
  if (status === "FORCED_STOPPED" || status === "ADMIN_STOPPED" || status === "강제중지") return "error";
  if (status === "NORMAL" || status === "ACTIVE" || status === "정상") return "success";

  return "light";
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
  if (status === "PRIVATE" || status === "비공개" || status === "미공개") return "error";
  if (status === "INACTIVE" || status === "미노출") return "error";
  if (status === "PUBLIC" || status === "공개") return "success";
  if (status === "ACTIVE" || status === "노출") return "success";

  return "light";
}
