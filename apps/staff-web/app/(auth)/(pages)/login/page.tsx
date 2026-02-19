"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { SignInForm, type SignInFormValues } from "@beaulab/ui-admin/components/auth";
import { login } from "@/lib/session";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSubmit = async ({ identifier, password }: SignInFormValues) => {
    if (!identifier || !password) {
      throw new Error("닉네임과 비밀번호를 입력해주세요.");
    }

    await login({ nickname: identifier, password });
    const nextPath = searchParams.get("next") || "/";
    router.replace(nextPath);
    router.refresh();
  };

  return (
    <SignInForm
      title="Staff Sign In"
      description="닉네임 로그인으로 staff 어드민에 접속합니다."
      identifierLabel="Nickname"
      identifierPlaceholder="nickname"
      identifierType="text"
      passwordPlaceholder="password"
      submitText="Sign in"
      hideSocialButtons
      onSubmit={handleSubmit}
    />
  );
}
