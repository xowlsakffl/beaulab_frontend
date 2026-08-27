"use client";

import { SummaryCardsGrid, SummaryCountCard } from "@/components/common/SummaryCountCard";
import { STATUS_BADGE_COLORS } from "@/lib/common/status-badge-colors";
import type { HospitalEventSummary } from "@/lib/hospital-event/list";
import {
  BadgeCheck,
  CalendarCheck,
  CalendarClock,
  CalendarOff,
  CalendarPlus,
  CircleX,
  SearchCheck,
  Send,
  type BadgeColor,
  type LucideIcon,
} from "@beaulab/ui-admin";

export type HospitalEventSummaryCardKey =
  "active" | "recent_created" | "ending_soon" | "recent_stopped" | "pending" | "reviewing" | "approved" | "rejected";

type HospitalEventsSummaryCardsProps = {
  summary: HospitalEventSummary | null;
  activeKey?: HospitalEventSummaryCardKey | null;
  onSelect?: (key: HospitalEventSummaryCardKey) => void;
};

type HospitalEventSummaryCard = {
  key: HospitalEventSummaryCardKey;
  label: string;
  value: number | string;
  icon: LucideIcon;
  color?: BadgeColor;
};

export function HospitalEventsSummaryCards({ summary, activeKey = null, onSelect }: HospitalEventsSummaryCardsProps) {
  const cards: ReadonlyArray<HospitalEventSummaryCard> = [
    {
      key: "active",
      label: "진행중인 이벤트",
      value: summary?.active_events ?? "-",
      icon: CalendarCheck,
    },
    {
      key: "recent_created",
      label: "최근 생성(30일)",
      value: summary?.recent_created_events ?? "-",
      icon: CalendarPlus,
    },
    {
      key: "ending_soon",
      label: "종료(30일)전 이벤트",
      value: summary?.ending_soon_events ?? "-",
      icon: CalendarClock,
    },
    {
      key: "recent_stopped",
      label: "최근 비공개/종료(30일)된 이벤트",
      value: summary?.recent_stopped_events ?? "-",
      icon: CalendarOff,
    },
    {
      key: "pending",
      label: "신청",
      value: summary?.pending_events ?? "-",
      icon: Send,
      color: STATUS_BADGE_COLORS.pending,
    },
    {
      key: "reviewing",
      label: "검수",
      value: summary?.reviewing_events ?? "-",
      icon: SearchCheck,
      color: STATUS_BADGE_COLORS.reviewing,
    },
    {
      key: "approved",
      label: "승인",
      value: summary?.approved_events ?? "-",
      icon: BadgeCheck,
      color: STATUS_BADGE_COLORS.approved,
    },
    {
      key: "rejected",
      label: "반려",
      value: summary?.rejected_events ?? "-",
      icon: CircleX,
      color: STATUS_BADGE_COLORS.rejected,
    },
  ];

  return (
    <SummaryCardsGrid className="grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
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
