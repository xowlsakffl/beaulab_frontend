"use client";

import { SummaryCountCard } from "@/components/common/SummaryCountCard";
import type { HospitalSummary } from "@/lib/hospital/list";

export type HospitalSummaryCardKey = "pending" | "rejected" | "dormant" | "suspended" | "withdrawn";

type HospitalsSummaryCardsProps = {
  summary: HospitalSummary | null;
  activeKey?: HospitalSummaryCardKey | null;
  onSelect?: (key: HospitalSummaryCardKey) => void;
};

export function HospitalsSummaryCards({ summary, activeKey = null, onSelect }: HospitalsSummaryCardsProps) {
  const cards = [
    { key: "pending", label: "검수신청 업체수", value: summary?.pending_review_hospitals ?? 0 },
    { key: "rejected", label: "검수반려 업체수", value: summary?.rejected_review_hospitals ?? 0 },
    { key: "dormant", label: "휴면 업체수", value: summary?.dormant_hospitals ?? 0 },
    { key: "suspended", label: "운영중지 업체수", value: summary?.suspended_hospitals ?? 0 },
    { key: "withdrawn", label: "탈퇴 업체수", value: summary?.withdrawn_hospitals ?? 0 },
  ] satisfies Array<{ key: HospitalSummaryCardKey; label: string; value: number }>;

  return (
    <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
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
