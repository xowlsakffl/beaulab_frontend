"use client";

import { SummaryCountCard } from "@/components/common/SummaryCountCard";
import { type AccountUserSummary, type AccountUserSummaryCardKey } from "@/lib/account-user/list";

type AccountUsersSummaryCardsProps = {
  summary: AccountUserSummary | null;
  activeKey?: AccountUserSummaryCardKey | null;
  onSelect?: (key: AccountUserSummaryCardKey) => void;
};

export function AccountUsersSummaryCards({ summary, activeKey = null, onSelect }: AccountUsersSummaryCardsProps) {
  const cards = [
    { key: "withdrawn", label: "탈퇴 회원수", value: summary?.withdrawn_users ?? 0 },
    { key: "blocked", label: "차단 회원수", value: summary?.blocked_users ?? 0 },
    { key: "warned", label: "경고 회원수", value: summary?.warned_users ?? 0 },
  ] satisfies Array<{ key: AccountUserSummaryCardKey; label: string; value: number }>;

  return (
    <div className="grid min-w-0 grid-cols-3 gap-3">
      {cards.map((card) => (
        <SummaryCountCard
          key={card.key}
          label={card.label}
          value={card.value}
          unit="명"
          pressed={activeKey === card.key}
          onClick={() => onSelect?.(card.key)}
        />
      ))}
    </div>
  );
}
