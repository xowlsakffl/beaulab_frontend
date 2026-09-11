"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isApiSuccess } from "@beaulab/types";
import { Button, SpinnerBlock } from "@beaulab/ui-admin";
import { AuthFormPanel, PasswordResetForm, type PasswordResetFormValues } from "@beaulab/ui-admin/components/auth";

import { resetHospitalPassword, verifyHospitalPasswordResetToken } from "@/lib/account-hospital/password-reset";

type ResetPageState =
  { status: "loading" | "retry" | "completed" } | { status: "ready"; hospitalName: string; maskedNickname: string };

export default function HospitalPasswordResetPageClient({ token }: { token: string }) {
  const router = useRouter();
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<ResetPageState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    void verifyHospitalPasswordResetToken(token)
      .then(({ response, payload }) => {
        if (!active) return;
        if (isApiSuccess(payload) && payload.data.valid) {
          setState({
            status: "ready",
            hospitalName: payload.data.hospital_name,
            maskedNickname: payload.data.masked_nickname,
          });
        } else if (
          (response.status === 419 && !isApiSuccess(payload) && payload.error.code !== "CSRF_MISMATCH") ||
          response.status === 422
        ) {
          router.replace("/error/419");
        } else if (response.status === 429) {
          router.replace("/error/429");
        } else {
          setState({ status: "retry" });
        }
      })
      .catch(() => {
        if (active) setState({ status: "retry" });
      });
    return () => {
      active = false;
    };
  }, [router, token, attempt]);

  const handleSubmit = async ({ password, passwordConfirmation }: PasswordResetFormValues) => {
    const { response, payload } = await resetHospitalPassword(token, password, passwordConfirmation);
    if (!isApiSuccess(payload)) {
      if (response.status === 419 && payload.error.code !== "CSRF_MISMATCH") {
        setState({ status: "loading" });
        router.replace("/error/419");
      }
      throw new Error(payload.error.message || "비밀번호를 변경하지 못했습니다.");
    }
    return payload.data.message;
  };

  if (state.status === "loading") {
    return (
      <AuthFormPanel>
        <SpinnerBlock className="min-h-[360px]" label="링크 확인 중" />
      </AuthFormPanel>
    );
  }

  if (state.status === "ready") {
    return (
      <PasswordResetForm
        token={token}
        maskedUsername={state.maskedNickname}
        title="병의원 비밀번호 재설정"
        description={
          <span className="block text-lg leading-7 font-semibold break-words text-brand-500">{state.hospitalName}</span>
        }
        onSubmit={handleSubmit}
        onSuccess={() => setState({ status: "completed" })}
      />
    );
  }

  return (
    <AuthFormPanel
      loginHref="/login"
      title={state.status === "completed" ? "비밀번호가 변경되었습니다." : "재설정 링크를 확인할 수 없습니다."}
      description={
        state.status === "completed"
          ? "변경한 비밀번호로 로그인해 주세요."
          : "일시적인 오류가 발생했습니다. 잠시 후 다시 확인해 주세요."
      }
    >
      {state.status === "completed" ? (
        <Button asChild variant="brand" size="auth" className="w-full">
          <Link href="/login">로그인하러 가기</Link>
        </Button>
      ) : (
        <Button
          type="button"
          variant="brand"
          size="auth"
          className="w-full"
          onClick={() => {
            setState({ status: "loading" });
            setAttempt((current) => current + 1);
          }}
        >
          다시 확인
        </Button>
      )}
    </AuthFormPanel>
  );
}
