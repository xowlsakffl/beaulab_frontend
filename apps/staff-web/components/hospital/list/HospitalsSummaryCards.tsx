"use client";

import { Card } from "@beaulab/ui-admin";

import type { HospitalSummary } from "@/lib/hospital/list";

type HospitalsSummaryCardsProps = {
  summary: HospitalSummary | null;
};

export function HospitalsSummaryCards({ summary }: HospitalsSummaryCardsProps) {
  const cards = [
    { label: "일 방문업체수", value: summary?.daily_visitors ?? 0 },
    { label: "한달 방문업체수", value: summary?.monthly_visitors ?? 0 },
    { label: "휴면 업체수", value: summary?.dormant_hospitals ?? 0 },
    { label: "총 업체수", value: summary?.total_hospitals ?? 0 },
    { label: "검수신청 업체수", value: summary?.pending_review_hospitals ?? 0 },
    { label: "검수반려 업체수", value: summary?.rejected_review_hospitals ?? 0 },
    { label: "운영중지 업체수", value: summary?.suspended_hospitals ?? 0 },
    { label: "탈퇴 업체수", value: summary?.withdrawn_hospitals ?? 0 },
  ];

  return (
    <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
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

export function HospitalsRegistrationSummaryCard({ summary }: HospitalsSummaryCardsProps) {
  const items = [
    { label: "오늘 가입", value: summary?.today_registered_hospitals ?? 0 },
    { label: "7일내 가입업체", value: summary?.registered_within_7_days ?? 0 },
    { label: "30일내 가입업체", value: summary?.registered_within_30_days ?? 0 },
    { label: "1년내 가입업체", value: summary?.registered_within_1_year ?? 0 },
  ];

  return (
    <Card className="h-full rounded-xl bg-white p-5">
      <h3 className="text-sm font-semibold text-gray-900">가입등록현황</h3>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-4 text-sm">
            <span className="text-gray-600">{item.label}</span>
            <span className="font-semibold text-gray-900">{Number(item.value).toLocaleString()}개</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
