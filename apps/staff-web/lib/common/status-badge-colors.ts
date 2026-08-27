import type { BadgeColor } from "@beaulab/ui-admin";

export const STATUS_BADGE_COLORS = {
  brand: "primary",
  pending: "info",
  reviewing: "orange",
  approved: "success",
  rejected: "error",
  active: "success",
  inactive: "error",
  attention: "orange",
  suspended: "orange",
  neutral: "light",
  reportReceived: "yellow",
  reportAutoBlocked: "red",
  reportRestricted: "orange",
  reportVisible: "green",
  reportReexposed: "blue",
  reportInvalid: "gray",
} as const satisfies Record<string, BadgeColor>;
