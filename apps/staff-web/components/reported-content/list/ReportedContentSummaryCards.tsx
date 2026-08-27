"use client";

import { SummaryCardsGrid, SummaryCountCard } from "@/components/common/SummaryCountCard";
import { STATUS_BADGE_COLORS } from "@/lib/common/status-badge-colors";
import type { ReportedContentSummary, ReportedContentSummaryCardKey } from "@/lib/reported-content/list";
import { CalendarDays, Eye, EyeOff, Siren, type BadgeColor, type LucideIcon } from "@beaulab/ui-admin";

type ReportedContentSummaryCardsProps = {
  summary: ReportedContentSummary | null;
  activeKey?: ReportedContentSummaryCardKey | null;
  onSelect?: (key: ReportedContentSummaryCardKey) => void;
};

export function ReportedContentSummaryCards({ summary, activeKey = null, onSelect }: ReportedContentSummaryCardsProps) {
  const cards = [
    {
      key: "today_report",
      label: "오늘의 신고",
      value: summary?.today_report_count ?? "-",
      icon: CalendarDays,
      color: STATUS_BADGE_COLORS.brand,
    },
    {
      key: "reported_or_auto_blocked",
      label: "신고접수/자동차단",
      value: summary?.reported_or_auto_blocked_count ?? "-",
      icon: Siren,
      color: STATUS_BADGE_COLORS.reportReceived,
    },
    {
      key: "recent_30_days_admin_hidden",
      label: "(최근 30일 설정된)노출중지",
      value: summary?.recent_30_days_admin_hidden_count ?? "-",
      icon: EyeOff,
      color: STATUS_BADGE_COLORS.reportRestricted,
    },
    {
      key: "recent_30_days_normal_visible",
      label: "(최근 30일 설정된)정상노출",
      value: summary?.recent_30_days_normal_visible_count ?? "-",
      icon: Eye,
      color: STATUS_BADGE_COLORS.active,
    },
  ] satisfies ReadonlyArray<{
    key: ReportedContentSummaryCardKey;
    label: string;
    value: number | string;
    icon: LucideIcon;
    color: BadgeColor;
  }>;

  return (
    <SummaryCardsGrid className="grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <SummaryCountCard
          key={card.key}
          label={card.label}
          value={card.value}
          unit="건"
          icon={card.icon}
          iconColor={card.color}
          pressed={activeKey === card.key}
          onClick={() => onSelect?.(card.key)}
        />
      ))}
    </SummaryCardsGrid>
  );
}
