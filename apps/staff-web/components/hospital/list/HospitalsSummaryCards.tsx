"use client";

import { SummaryCardsGrid, SummaryCountCard } from "@/components/common/SummaryCountCard";
import { STATUS_BADGE_COLORS } from "@/lib/common/status-badge-colors";
import type { HospitalSummary } from "@/lib/hospital/list";
import {
  CirclePause,
  CircleX,
  ClipboardClock,
  LogOut,
  Moon,
  type BadgeColor,
  type LucideIcon,
} from "@beaulab/ui-admin";

export type HospitalSummaryCardKey = "pending" | "rejected" | "dormant" | "suspended" | "withdrawn";

type HospitalsSummaryCardsProps = {
  summary: HospitalSummary | null;
  activeKey?: HospitalSummaryCardKey | null;
  onSelect?: (key: HospitalSummaryCardKey) => void;
};

type HospitalSummaryCard = {
  key: HospitalSummaryCardKey;
  label: string;
  value: number | string;
  icon: LucideIcon;
  color: BadgeColor;
};

export function HospitalsSummaryCards({ summary, activeKey = null, onSelect }: HospitalsSummaryCardsProps) {
  const cards = [
    {
      key: "pending",
      label: "검수 신청",
      value: summary?.pending_review_hospitals ?? "-",
      icon: ClipboardClock,
      color: STATUS_BADGE_COLORS.pending,
    },
    {
      key: "rejected",
      label: "검수 반려",
      value: summary?.rejected_review_hospitals ?? "-",
      icon: CircleX,
      color: STATUS_BADGE_COLORS.rejected,
    },
    {
      key: "dormant",
      label: "휴면",
      value: summary?.dormant_hospitals ?? "-",
      icon: Moon,
      color: STATUS_BADGE_COLORS.neutral,
    },
    {
      key: "suspended",
      label: "운영중지",
      value: summary?.suspended_hospitals ?? "-",
      icon: CirclePause,
      color: STATUS_BADGE_COLORS.suspended,
    },
    {
      key: "withdrawn",
      label: "탈퇴",
      value: summary?.withdrawn_hospitals ?? "-",
      icon: LogOut,
      color: STATUS_BADGE_COLORS.rejected,
    },
  ] satisfies HospitalSummaryCard[];

  return (
    <SummaryCardsGrid className="grid-cols-1 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => (
        <SummaryCountCard
          key={card.key}
          label={card.label}
          value={card.value}
          unit="개"
          icon={card.icon}
          iconColor={card.color}
          pressed={activeKey === card.key}
          onClick={() => onSelect?.(card.key)}
        />
      ))}
    </SummaryCardsGrid>
  );
}
