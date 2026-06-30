"use client";

import { SummaryCountCard } from "@/components/common/SummaryCountCard";
import type { HospitalEventSummary } from "@/lib/hospital-event/list";

export type HospitalEventSummaryCardKey =
  "active" | "recent_created" | "ending_soon" | "recent_stopped" | "pending" | "reviewing" | "approved" | "rejected";

type HospitalEventsSummaryCardsProps = {
  summary: HospitalEventSummary | null;
  activeKey?: HospitalEventSummaryCardKey | null;
  onSelect?: (key: HospitalEventSummaryCardKey) => void;
};

export function HospitalEventsSummaryCards({ summary, activeKey = null, onSelect }: HospitalEventsSummaryCardsProps) {
  const cards = [
    { key: "active", label: "진행중인 이벤트", value: summary?.active_events ?? 0 },
    { key: "recent_created", label: "최근 생성(30일)", value: summary?.recent_created_events ?? 0 },
    { key: "ending_soon", label: "종료(30일)전 이벤트", value: summary?.ending_soon_events ?? 0 },
    { key: "recent_stopped", label: "최근 중지(30일)", value: summary?.recent_stopped_events ?? 0 },
    { key: "pending", label: "신청", value: summary?.pending_events ?? 0 },
    { key: "reviewing", label: "검수", value: summary?.reviewing_events ?? 0 },
    { key: "approved", label: "승인", value: summary?.approved_events ?? 0 },
    { key: "rejected", label: "반려", value: summary?.rejected_events ?? 0 },
  ] satisfies Array<{ key: HospitalEventSummaryCardKey; label: string; value: number }>;

  return (
    <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <SummaryCountCard
          key={card.key}
          label={card.label}
          value={card.value}
          unit="개"
          pressed={activeKey === card.key}
          onClick={() => onSelect?.(card.key)}
        />
      ))}
    </div>
  );
}
