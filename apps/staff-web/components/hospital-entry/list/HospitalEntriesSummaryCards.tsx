"use client";

import { Card } from "@beaulab/ui-admin";

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
        <Card key={card.label} className="rounded-xl bg-white px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-gray-700">{card.label}</span>
            <span className="text-base font-semibold text-gray-900">{Number(card.value).toLocaleString()}건</span>
          </div>
        </Card>
      ))}
    </div>
  );
}
