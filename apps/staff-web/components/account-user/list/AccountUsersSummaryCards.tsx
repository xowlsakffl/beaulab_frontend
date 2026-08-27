"use client";

import { SummaryCardsGrid, SummaryCountCard } from "@/components/common/SummaryCountCard";
import { type AccountUserSummary, type AccountUserSummaryCardKey } from "@/lib/account-user/list";
import { STATUS_BADGE_COLORS } from "@/lib/common/status-badge-colors";
import { Ban, TriangleAlert, UserX, type BadgeColor, type LucideIcon } from "@beaulab/ui-admin";

type AccountUsersSummaryCardsProps = {
  summary: AccountUserSummary | null;
  activeKey?: AccountUserSummaryCardKey | null;
  onSelect?: (key: AccountUserSummaryCardKey) => void;
};

export function AccountUsersSummaryCards({ summary, activeKey = null, onSelect }: AccountUsersSummaryCardsProps) {
  const cards = [
    {
      key: "withdrawn",
      label: "탈퇴 회원수",
      value: summary?.withdrawn_users ?? "-",
      icon: UserX,
      color: STATUS_BADGE_COLORS.rejected,
    },
    {
      key: "blocked",
      label: "차단 회원수",
      value: summary?.blocked_users ?? "-",
      icon: Ban,
      color: STATUS_BADGE_COLORS.rejected,
    },
    {
      key: "warned",
      label: "경고 회원수",
      value: summary?.warned_users ?? "-",
      icon: TriangleAlert,
      color: STATUS_BADGE_COLORS.rejected,
    },
  ] satisfies ReadonlyArray<{
    key: AccountUserSummaryCardKey;
    label: string;
    value: number | string;
    icon: LucideIcon;
    color: BadgeColor;
  }>;

  return (
    <SummaryCardsGrid className="grid-cols-1 sm:grid-cols-3">
      {cards.map((card) => (
        <SummaryCountCard
          key={card.key}
          label={card.label}
          value={card.value}
          unit="명"
          icon={card.icon}
          iconColor={card.color}
          pressed={activeKey === card.key}
          onClick={() => onSelect?.(card.key)}
        />
      ))}
    </SummaryCardsGrid>
  );
}
