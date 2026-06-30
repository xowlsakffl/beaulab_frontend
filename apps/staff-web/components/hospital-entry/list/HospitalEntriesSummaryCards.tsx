"use client";

import { SummaryCountCard } from "@/components/common/SummaryCountCard";
import type { HospitalEntrySummary } from "@/lib/hospital-entry/list";

export type HospitalEntrySummaryCardKey = "pending" | "rejected" | "approved";

type HospitalEntriesSummaryCardsProps = {
  summary: HospitalEntrySummary | null;
  activeKey?: HospitalEntrySummaryCardKey | null;
  onSelect?: (key: HospitalEntrySummaryCardKey) => void;
};

export function HospitalEntriesSummaryCards({ summary, activeKey = null, onSelect }: HospitalEntriesSummaryCardsProps) {
  const cards = [
    { key: "pending", label: "입점신청", value: summary?.pending ?? 0 },
    { key: "rejected", label: "입점반려", value: summary?.rejected ?? 0 },
    { key: "approved", label: "입점승인", value: summary?.approved ?? 0 },
  ] satisfies Array<{ key: HospitalEntrySummaryCardKey; label: string; value: number }>;

  return (
    <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-3">
      {cards.map((card) => (
        <SummaryCountCard
          key={card.key}
          label={card.label}
          value={card.value}
          unit="건"
          pressed={activeKey === card.key}
          onClick={() => onSelect?.(card.key)}
        />
      ))}
    </div>
  );
}
