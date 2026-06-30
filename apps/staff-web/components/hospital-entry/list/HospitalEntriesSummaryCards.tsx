"use client";

import { SummaryCountCard } from "@/components/common/SummaryCountCard";
import type { HospitalEntrySummary } from "@/lib/hospital-entry/list";

type HospitalEntriesSummaryCardsProps = {
  summary: HospitalEntrySummary | null;
};

export function HospitalEntriesSummaryCards({ summary }: HospitalEntriesSummaryCardsProps) {
  const cards = [
    { label: "입점신청", value: summary?.pending ?? 0 },
    { label: "입점반려", value: summary?.rejected ?? 0 },
    { label: "입점승인", value: summary?.approved ?? 0 },
  ];

  return (
    <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-3">
      {cards.map((card) => (
        <SummaryCountCard key={card.label} label={card.label} value={card.value} unit="건" />
      ))}
    </div>
  );
}
