"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isApiSuccess } from "@beaulab/types";
import { Button, CheckCircle2, SpinnerBlock } from "@beaulab/ui-admin";
import { PasswordResetForm, type PasswordResetFormValues } from "@beaulab/ui-admin/components/auth";

import { resetHospitalPassword, verifyHospitalPasswordResetToken } from "@/lib/account-hospital/password-reset";

type ResetPageState =
  { status: "loading" | "retry" | "completed" } | { status: "ready"; hospitalName: string; maskedNickname: string };

export default function HospitalPasswordResetPageClient({ token }: { token: string }) {
  const router = useRouter();
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
  }, [router, token]);

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

  if (state.status === "loading") return <SpinnerBlock className="min-h-screen" label="링크 확인 중" />;

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6 py-10 sm:px-10">
      {state.status === "ready" ? (
        <PasswordResetForm
          token={token}
          maskedUsername={state.maskedNickname}
          loginHref={null}
          title="병의원 비밀번호 재설정"
          description={
            <span className="block text-lg leading-7 font-semibold break-words text-brand-500">
              {state.hospitalName}
            </span>
          }
          onSubmit={handleSubmit}
          onSuccess={() => setState({ status: "completed" })}
        />
      ) : (
        <div className="mx-auto w-full max-w-md text-center">
          {state.status === "completed" ? <CheckCircle2 className="mx-auto mb-5 size-12 text-brand-500" /> : null}
          <h1 className="text-xl font-semibold text-gray-900">
            {state.status === "completed" ? "비밀번호가 변경되었습니다." : "재설정 링크를 확인할 수 없습니다."}
          </h1>
          <p className="mt-3 text-sm leading-6 text-gray-500">
            {state.status === "completed"
              ? "변경한 비밀번호로 로그인해 주세요."
              : "일시적인 오류가 발생했습니다. 잠시 후 링크를 다시 열어 주세요."}
          </p>
          {state.status === "completed" ? (
            <Button asChild variant="brand" className="mt-7 h-11 w-full max-w-xs">
              <Link href="/login">로그인하러 가기</Link>
            </Button>
          ) : null}
        </div>
      )}
    </main>
  );
}
