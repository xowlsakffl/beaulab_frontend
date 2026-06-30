"use client";

import { SummaryCountCard } from "@/components/common/SummaryCountCard";
import type { HospitalEventSummary } from "@/lib/hospital-event/list";

type HospitalEventsSummaryCardsProps = {
  summary: HospitalEventSummary | null;
};

export function HospitalEventsSummaryCards({ summary }: HospitalEventsSummaryCardsProps) {
  const cards = [
    { label: "진행중인 이벤트", value: summary?.active_events ?? 0 },
    { label: "최근 생성(30일)", value: summary?.recent_created_events ?? 0 },
    { label: "종료(30일)전 이벤트", value: summary?.ending_soon_events ?? 0 },
    { label: "최근 중지(30일)", value: summary?.recent_stopped_events ?? 0 },
    { label: "신청", value: summary?.pending_events ?? 0 },
    { label: "검수", value: summary?.reviewing_events ?? 0 },
    { label: "승인", value: summary?.approved_events ?? 0 },
    { label: "반려", value: summary?.rejected_events ?? 0 },
  ];

  return (
    <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <SummaryCountCard
          key={card.label}
          label={card.label}
          value={card.value}
          unit="개"
          className="rounded-xl bg-white px-4 py-4"
        />
      ))}
    </div>
  );
}
