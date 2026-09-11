"use client";

import { PasswordResetRequestForm, type PasswordResetRequestFormValues } from "@beaulab/ui-admin/components/auth";
import { isApiSuccess } from "@beaulab/types";
import { requestHospitalPasswordReset } from "@/lib/account-hospital/password-reset";

export default function HospitalPasswordForgotPageClient() {
  async function submit({ email }: PasswordResetRequestFormValues) {
    const { payload } = await requestHospitalPasswordReset(email.trim().toLowerCase());
    if (!isApiSuccess(payload)) throw new Error(payload.error.message);
  }
  return (
    <PasswordResetRequestForm
      title="비밀번호 찾기"
      description="계정에 인증된 이메일 주소를 입력해 주세요."
      loginHref="/login"
      successMessage="등록된 이메일이라면 비밀번호 재설정 안내를 보내드립니다."
      onSubmit={submit}
    />
  );
}
