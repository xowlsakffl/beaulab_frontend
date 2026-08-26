"use client";

import { SummaryCountCard } from "@/components/common/SummaryCountCard";
import type { HospitalSummary } from "@/lib/hospital/list";

export type HospitalSummaryCardKey = "pending" | "rejected" | "dormant" | "suspended" | "withdrawn";

type HospitalsSummaryCardsProps = {
  summary: HospitalSummary | null;
  loading?: boolean;
  activeKey?: HospitalSummaryCardKey | null;
  onSelect?: (key: HospitalSummaryCardKey) => void;
};

type HospitalSummaryCard = {
  key: HospitalSummaryCardKey;
  label: string;
  value: number | null;
};

export function HospitalsSummaryCards({
  summary,
  loading = false,
  activeKey = null,
  onSelect,
}: HospitalsSummaryCardsProps) {
  const cards = [
    {
      key: "pending",
      label: "검수 신청",
      value: summary?.pending_review_hospitals ?? null,
    },
    {
      key: "rejected",
      label: "검수 반려",
      value: summary?.rejected_review_hospitals ?? null,
    },
    {
      key: "dormant",
      label: "휴면",
      value: summary?.dormant_hospitals ?? null,
    },
    {
      key: "suspended",
      label: "운영중지",
      value: summary?.suspended_hospitals ?? null,
    },
    {
      key: "withdrawn",
      label: "탈퇴",
      value: summary?.withdrawn_hospitals ?? null,
    },
  ] satisfies HospitalSummaryCard[];

  return (
    <section className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => (
        <SummaryCountCard
          key={card.key}
          label={card.label}
          value={card.value ?? "-"}
          unit={card.value === null ? undefined : "개"}
          loading={loading}
          pressed={activeKey === card.key}
          onClick={() => onSelect?.(card.key)}
        />
      ))}
    </section>
  );
}
