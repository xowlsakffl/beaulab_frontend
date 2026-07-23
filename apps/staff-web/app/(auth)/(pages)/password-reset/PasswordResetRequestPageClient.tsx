"use client";

import { PasswordResetRequestForm, type PasswordResetRequestFormValues } from "@beaulab/ui-admin/components/auth";
import { sendPasswordResetLink } from "@/lib/common/auth/password-reset";

export default function PasswordResetRequestPageClient() {
  const handleSubmit = async ({ email }: PasswordResetRequestFormValues) => {
    return sendPasswordResetLink({ email });
  };

  return (
    <PasswordResetRequestForm
      title="관리자 비밀번호 재설정"
      description="이메일 주소를 입력하면 비밀번호 재설정 링크를 보내드립니다."
      onSubmit={handleSubmit}
    />
  );
}
