"use client";

import React from "react";
import { Card } from "@beaulab/ui-admin";

import { ACCOUNT_USER_SIGNUP_CHANNEL_OPTIONS, type AccountUserSummary } from "@/lib/account-user/list";

type AccountUsersSummaryCardsProps = {
  summary: AccountUserSummary | null;
};

export function AccountUsersSummaryCards({ summary }: AccountUsersSummaryCardsProps) {
  const cards = [
    { label: "일 방문자수", value: summary?.daily_visitors ?? 0 },
    { label: "한달 방문자수", value: summary?.monthly_visitors ?? 0 },
    { label: "총 회원수", value: summary?.total_users ?? 0 },
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

export function AccountUsersSignupChannelCard({ summary }: AccountUsersSummaryCardsProps) {
  const signupChannels = React.useMemo(() => {
    const summaryByChannel = new Map(
      (summary?.signup_channels ?? [])
        .filter((item) => item.channel?.trim())
        .map((item) => [item.channel?.trim(), item]),
    );

    return ACCOUNT_USER_SIGNUP_CHANNEL_OPTIONS.filter((option) => option.value).map((option) => {
      const item = summaryByChannel.get(option.value);

      return {
        channel: option.value,
        label: item?.label?.trim() || option.label,
        count: Number(item?.count ?? 0),
      };
    });
  }, [summary]);

  return (
    <Card className="h-full rounded-xl bg-white p-5">
      <h3 className="text-sm font-semibold text-gray-900">가입경로상세</h3>
      <div className="mt-4 space-y-2">
        {signupChannels.map((item) => (
          <div key={item.channel} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-gray-600">{item.label}</span>
            <span className="font-semibold text-gray-900">{Number(item.count ?? 0).toLocaleString()}명</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
