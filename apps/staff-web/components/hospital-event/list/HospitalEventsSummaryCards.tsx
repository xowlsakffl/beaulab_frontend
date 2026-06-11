"use client";

import { Card } from "@beaulab/ui-admin";

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
    { label: "검수신청중", value: summary?.pending_events ?? 0 },
    { label: "검토중", value: summary?.reviewing_events ?? 0 },
    { label: "검수반려", value: summary?.rejected_events ?? 0 },
    { label: "파트너취소", value: summary?.partner_canceled_events ?? 0 },
  ];

  return (
    <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label} className="rounded-xl bg-white px-4 py-4">
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
