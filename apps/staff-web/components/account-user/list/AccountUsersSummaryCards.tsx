"use client";

import { SummaryCountCard } from "@/components/common/SummaryCountCard";
import { type AccountUserSummary } from "@/lib/account-user/list";

type AccountUsersSummaryCardsProps = {
  summary: AccountUserSummary | null;
};

export function AccountUsersSummaryCards({ summary }: AccountUsersSummaryCardsProps) {
  const cards = [
    { label: "탈퇴 회원수", value: summary?.withdrawn_users ?? 0 },
    { label: "차단 회원수", value: summary?.blocked_users ?? 0 },
    { label: "경고 회원수", value: summary?.warned_users ?? 0 },
  ];

  return (
    <div className="grid min-w-0 grid-cols-3 gap-3">
      {cards.map((card) => (
        <SummaryCountCard key={card.label} label={card.label} value={card.value} unit="명" />
      ))}
    </div>
  );
}
