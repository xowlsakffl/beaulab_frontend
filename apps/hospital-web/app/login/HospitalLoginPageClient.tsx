"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SignInForm, type SignInFormValues } from "@beaulab/ui-admin/components/auth";
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
  if (checking) return <SpinnerBlock className="min-h-dvh" label="로그인 확인 중" />;
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 p-6">
      <Image src="/images/logo/board_logo_dark.png" alt="뷰랩" width={160} height={36} priority />
      <SignInForm
        title="병의원 로그인"
        description="병의원 계정으로 로그인해 주세요."
        hideSocialButtons
        forgotPasswordHref={null}
        onSubmit={submit}
      />
    </main>
  );
}
