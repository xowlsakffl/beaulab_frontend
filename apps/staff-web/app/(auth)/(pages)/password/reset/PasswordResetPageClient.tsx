"use client";

import { PasswordResetForm, type PasswordResetFormValues } from "@beaulab/ui-admin/components/auth";
import { useGlobalAlert } from "@beaulab/ui-admin";
import { useRouter } from "next/navigation";
import { resetPassword } from "@/lib/common/auth/password-reset";

type PasswordResetPageClientProps = {
  email: string;
  token: string;
};

export default function PasswordResetPageClient({ email, token }: PasswordResetPageClientProps) {
  const router = useRouter();
  const { showAlert } = useGlobalAlert();

  const handleSubmit = async ({ email, token, password, passwordConfirmation }: PasswordResetFormValues) => {
    return resetPassword({
      email,
      token,
      password,
      password_confirmation: passwordConfirmation,
    });
  };

  const handleSuccess = (message: string) => {
    showAlert({
      variant: "success",
      title: "비밀번호 변경 완료",
      message,
    });
    router.push("/login");
  };

  return (
    <PasswordResetForm
      email={email}
      token={token}
      title="관리자 새 비밀번호 설정"
      description="메일로 받은 링크가 만료되기 전에 새 비밀번호를 설정해 주세요."
      onSubmit={handleSubmit}
      onSuccess={handleSuccess}
    />
  );
}
