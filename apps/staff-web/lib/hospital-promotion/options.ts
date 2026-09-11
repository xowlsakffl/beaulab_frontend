import { STATUS_BADGE_COLORS } from "@/lib/common/status-badge-colors";
import { ownerVisibilityStatusColor } from "@/lib/common/status-labels";
import type { PromotionProgress, PromotionStatus } from "./types";

export const PROMOTION_POSITION_OPTIONS = (
  [
    { side: "LEFT", label: "좌" },
    { side: "RIGHT", label: "우" },
  ] as const
).flatMap(({ side, label }) =>
  [1, 2, 3].map((slot) => ({
    value: `${side}_${slot}`,
    label: `공지사항 배너[${label}] ${slot}`,
    side,
    slot: String(slot),
  })),
);
export const PROMOTION_STATUS_OPTIONS: { value: PromotionStatus; label: string }[] = [
  { value: "ACTIVE", label: "공개" },
  { value: "INACTIVE", label: "비공개" },
];

export function promotionPositionOption(side: string, slot: string | number) {
  return PROMOTION_POSITION_OPTIONS.find((option) => option.side === side && option.slot === String(slot));
}

export function labelPromotionStatus(value?: string | null) {
  return PROMOTION_STATUS_OPTIONS.find((option) => option.value === value)?.label ?? "-";
}

export const promotionStatusColor = ownerVisibilityStatusColor;

export function labelPromotionProgress(value?: string | null) {
  return ({ UPCOMING: "진행예정", CURRENT: "진행중", ENDED: "종료" } as Record<string, string>)[value ?? ""] ?? "-";
}

export function promotionProgressColor(value?: PromotionProgress | null) {
  if (value === "CURRENT") return STATUS_BADGE_COLORS.active;
  if (value === "UPCOMING") return STATUS_BADGE_COLORS.pending;
  return STATUS_BADGE_COLORS.neutral;
}
