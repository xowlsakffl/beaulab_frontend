"use client";

import React from "react";
import { UserAddressCard, UserInfoCard, UserMetaCard } from "@beaulab/ui-admin";
import type { StaffSession } from "@beaulab/types";
import { getSession } from "@/lib/session";

function formatLastLogin(lastLoginAt?: string | null) {
  if (!lastLoginAt) return "기록 없음";

  const date = new Date(lastLoginAt);
  if (Number.isNaN(date.getTime())) return lastLoginAt;

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function ProfilePageClient() {
  const [session, setSession] = React.useState<StaffSession | null>(null);

  React.useEffect(() => {
    setSession(getSession());
  }, []);

  if (!session) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        세션 정보를 불러오는 중입니다.
      </p>
    );
  }

  const { profile, auth } = session;
  const roles = auth?.roles?.length ? auth.roles.join(", ") : "지정된 역할 없음";
  const permissions = auth?.permissions?.length ?? 0;

  return (
    <div className="space-y-6">
      <UserMetaCard
        name={profile.name}
        subtitle={profile.nickname ? `아이디 ${profile.nickname}` : "스태프 관리자"}
        description={profile.status ? `계정 상태: ${profile.status}` : "뷰랩 관리자 계정"}
        location={profile.email}
        avatarSrc="/images/user/owner.png"
        avatarAlt={profile.name}
      />
      <UserInfoCard
        title="기본 정보"
        items={[
          { label: "계정 ID", value: String(profile.id) },
          { label: "이름", value: profile.name || "-" },
          { label: "아이디", value: profile.nickname || "-" },
          { label: "이메일", value: profile.email || "-" },
        ]}
      />
      <UserAddressCard
        title="권한 정보"
        items={[
          { label: "역할", value: roles },
          { label: "권한 수", value: `${permissions}개` },
          { label: "마지막 로그인", value: formatLastLogin(profile.last_login_at) },
          { label: "액터", value: session.actor },
        ]}
      />
    </div>
  );
}
