"use client";

import { SummaryCountCard } from "@/components/common/SummaryCountCard";
import type { ReportedContentSummary, ReportedContentSummaryCardKey } from "@/lib/reported-content/list";

type ReportedContentSummaryCardsProps = {
  summary: ReportedContentSummary | null;
  activeKey?: ReportedContentSummaryCardKey | null;
  onSelect?: (key: ReportedContentSummaryCardKey) => void;
};

export function ReportedContentSummaryCards({ summary, activeKey = null, onSelect }: ReportedContentSummaryCardsProps) {
  const cards = [
    {
      key: "reported_or_auto_blocked",
      label: "신고접수/자동차단",
      value: summary?.reported_or_auto_blocked_count ?? 0,
    },
    {
      key: "today_report",
      label: "오늘의 신고",
      value: summary?.today_report_count ?? 0,
    },
    {
      key: "recent_30_days_admin_hidden",
      label: "(최근 30일 설정된)노출중지",
      value: summary?.recent_30_days_admin_hidden_count ?? 0,
    },
    {
      key: "recent_30_days_normal_visible",
      label: "(최근 30일 설정된)정상노출",
      value: summary?.recent_30_days_normal_visible_count ?? 0,
    },
  ] satisfies Array<{ key: ReportedContentSummaryCardKey; label: string; value: number }>;

  return (
    <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <SummaryCountCard
          key={card.key}
          label={card.label}
          value={card.value}
          pressed={activeKey === card.key}
          onClick={() => onSelect?.(card.key)}
        />
      ))}
    </div>
  );
}
