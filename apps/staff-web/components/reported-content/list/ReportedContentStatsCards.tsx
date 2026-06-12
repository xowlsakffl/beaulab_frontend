"use client";

import React from "react";
import { Card } from "@beaulab/ui-admin";

import type { ReportedContentSummary } from "@/lib/reported-content/list";

type ReportedContentStatsCardsProps = {
  summary: ReportedContentSummary | null;
};

export function ReportedContentStatsCards({ summary }: ReportedContentStatsCardsProps) {
  const cards = [
    {
      label: "신고접수/자동차단",
      value: summary?.reported_or_auto_blocked_count ?? 0,
    },
    {
      label: "오늘의 신고",
      value: summary?.today_report_count ?? 0,
    },
    {
      label: "(최근 30일 설정된)노출중지",
      value: summary?.recent_30_days_admin_hidden_count ?? 0,
    },
    {
      label: "(최근 30일 설정된)정상노출",
      value: summary?.recent_30_days_normal_visible_count ?? 0,
    },
  ];

  return (
    <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label} className="rounded-xl bg-white px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-gray-700">{card.label}</span>
            <span className="text-base font-semibold text-gray-900">{Number(card.value).toLocaleString()}</span>
          </div>
        </Card>
      ))}
    </div>
  );
}
