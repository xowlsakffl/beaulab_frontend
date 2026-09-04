"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, SpinnerBlock } from "@beaulab/ui-admin";
import { monitorWebSession } from "@beaulab/api-client";
import type { HospitalSession } from "@beaulab/types";
import { hospitalSession } from "@/lib/common/session";
import { hospitalApi } from "@/lib/common/api";

export default function HospitalAccountPageClient() {
  const router = useRouter();
  const [session, setSession] = useState<HospitalSession | null>(null);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState(0);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    void hospitalSession
      .ensure()
      .then((value) => {
        if (!active) return;
        if (!value) router.replace("/login");
        else setSession(value);
      })
      .catch(() => {
        if (active) setError("로그인 정보를 확인하지 못했습니다.");
      });
    return () => {
      active = false;
    };
  }, [router]);
  useEffect(() => {
    if (!session) return;
    return monitorWebSession(hospitalApi, "hospital", {
      onExpired: () => window.location.replace("/login"),
      onChanged: () => window.location.reload(),
      onWarning: setWarning,
    });
  }, [session]);
  async function signOut() {
    setBusy(true);
    try {
      await hospitalSession.logout();
      router.replace("/login");
    } catch {
      setError("로그아웃하지 못했습니다. 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }
  if (!session)
    return error ? (
      <p className="p-8 text-sm text-error-500">{error}</p>
    ) : (
      <SpinnerBlock className="min-h-dvh" label="로그인 확인 중" />
    );
  return (
    <main className="mx-auto max-w-2xl space-y-6 p-8">
      <h1 className="text-xl font-semibold text-gray-900">병의원 계정</h1>
      <dl className="space-y-3 text-sm">
        <div className="flex gap-6">
          <dt className="w-20 text-gray-500">연락처</dt>
          <dd>{session.profile.phone || "-"}</dd>
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
      <Button variant="outline" onClick={signOut} disabled={busy}>
        로그아웃
      </Button>
    </main>
  );
}
