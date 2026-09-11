"use client";

import { Button } from "@beaulab/ui-admin";
import { useHospitalSession } from "@/hooks/common/useHospitalSession";

export default function HospitalAccountPageClient() {
  const { session, error, warning, isLoggingOut, logout } = useHospitalSession();
  return (
    <main className="mx-auto max-w-2xl space-y-6 p-8">
      <h1 className="text-xl font-semibold text-gray-900">병의원 계정</h1>
      <dl className="space-y-3 text-sm">
        <div className="flex gap-6">
          <dt className="w-20 text-gray-500">인증 이메일</dt>
          <dd className="min-w-0 break-all">{session.profile.email || "미등록"}</dd>
        </div>
        <div className="flex gap-6">
          <dt className="w-20 text-gray-500">아이디</dt>
          <dd>{session.profile.nickname}</dd>
        </div>
      </dl>
      {warning > 0 ? (
        <p role="status" className="text-sm text-warning-600">
          {warning}초 후 로그인이 만료됩니다.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-error-500">
          {error}
        </p>
      ) : null}
      <Button variant="outline" onClick={logout} disabled={isLoggingOut}>
        로그아웃
      </Button>
    </main>
  );
}
