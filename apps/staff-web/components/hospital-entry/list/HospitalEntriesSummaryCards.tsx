"use client";

import { SummaryCardsGrid, SummaryCountCard } from "@/components/common/SummaryCountCard";
import { STATUS_BADGE_COLORS } from "@/lib/common/status-badge-colors";
import type { HospitalEntrySummary } from "@/lib/hospital-entry/list";
import { BadgeCheck, CircleX, SearchCheck, Send, type BadgeColor, type LucideIcon } from "@beaulab/ui-admin";

export type HospitalEntrySummaryCardKey = "pending" | "reviewing" | "approved" | "rejected";

type HospitalEntriesSummaryCardsProps = {
  summary: HospitalEntrySummary | null;
  activeKey?: HospitalEntrySummaryCardKey | null;
  onSelect?: (key: HospitalEntrySummaryCardKey) => void;
};

export function HospitalEntriesSummaryCards({ summary, activeKey = null, onSelect }: HospitalEntriesSummaryCardsProps) {
  const cards = [
    { key: "pending", label: "신청", value: summary?.pending ?? "-", icon: Send, color: STATUS_BADGE_COLORS.pending },
    {
      key: "reviewing",
      label: "검수",
      value: summary?.reviewing ?? "-",
      icon: SearchCheck,
      color: STATUS_BADGE_COLORS.reviewing,
    },
    {
      key: "approved",
      label: "승인",
      value: summary?.approved ?? "-",
      icon: BadgeCheck,
      color: STATUS_BADGE_COLORS.approved,
    },
    {
      key: "rejected",
      label: "반려",
      value: summary?.rejected ?? "-",
      icon: CircleX,
      color: STATUS_BADGE_COLORS.rejected,
    },
  ] satisfies ReadonlyArray<{
    key: HospitalEntrySummaryCardKey;
    label: string;
    value: number | string;
    icon: LucideIcon;
    color: BadgeColor;
  }>;

  return (
    <SummaryCardsGrid className="grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <SummaryCountCard
          key={card.key}
          label={card.label}
          value={card.value}
          unit="건"
          icon={card.icon}
          iconColor={card.color}
          pressed={activeKey === card.key}
          onClick={() => onSelect?.(card.key)}
        />
      ))}
    </SummaryCardsGrid>
  );
}
