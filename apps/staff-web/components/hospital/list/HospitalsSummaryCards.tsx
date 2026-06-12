"use client";

import { Card } from "@beaulab/ui-admin";

import type { HospitalSummary } from "@/lib/hospital/list";

type HospitalsSummaryCardsProps = {
  summary: HospitalSummary | null;
};

export function HospitalsSummaryCards({ summary }: HospitalsSummaryCardsProps) {
  const cards = [
    { label: "휴면 업체수", value: summary?.dormant_hospitals ?? 0 },
    { label: "검수신청 업체수", value: summary?.pending_review_hospitals ?? 0 },
    { label: "검수반려 업체수", value: summary?.rejected_review_hospitals ?? 0 },
    { label: "운영중지 업체수", value: summary?.suspended_hospitals ?? 0 },
    { label: "탈퇴 업체수", value: summary?.withdrawn_hospitals ?? 0 },
  ];

  return (
    <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => (
        <Card key={card.label} className="rounded-xl bg-white px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-gray-700">{card.label}</span>
            <span className="text-base font-semibold text-gray-900">
              {Number(card.value).toLocaleString()}개
            </span>
          </div>
        </Card>
      ))}
    </div>
  );
}
