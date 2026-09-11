"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthFormPanel, SignInForm, type SignInFormValues } from "@beaulab/ui-admin/components/auth";
import { SpinnerBlock } from "@beaulab/ui-admin";
import { hospitalSession } from "@/lib/common/session";

export default function HospitalLoginPageClient() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  useEffect(() => {
    let active = true;
    void hospitalSession
      .ensure()
      .then((session) => {
        if (!active) return;
        if (session) router.replace("/");
        else setChecking(false);
      })
      .catch(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
    };
  }, [router]);
  async function submit({ identifier, password }: SignInFormValues) {
    await hospitalSession.login({ nickname: identifier, password });
    router.replace("/");
  }
  if (checking) {
    return (
      <AuthFormPanel>
        <SpinnerBlock className="min-h-[360px]" label="로그인 확인 중" />
      </AuthFormPanel>
    );
  }
  return (
    <SignInForm
      title="병의원 관리자 로그인"
      description="병의원 계정으로 로그인해 주세요."
      hideSocialButtons
      forgotPasswordHref="/password/forgot"
      onSubmit={submit}
    />
  );
}
