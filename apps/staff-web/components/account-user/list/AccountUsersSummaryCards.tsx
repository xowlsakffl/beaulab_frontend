"use client";

import { Card } from "@beaulab/ui-admin";

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
        <Card key={card.label} className="rounded-xl bg-white px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-gray-700">{card.label}</span>
            <span className="text-base font-semibold text-gray-900">{Number(card.value).toLocaleString()}명</span>
          </div>
        </Card>
      ))}
    </div>
  );
}
