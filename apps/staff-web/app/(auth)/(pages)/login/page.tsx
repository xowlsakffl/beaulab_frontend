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
      title="뷰랩 관리자 로그인"
      description="아이디와 비밀번호를 입력해 뷰랩 관리자에 로그인하세요!"
      identifierLabel="아이디"
      identifierPlaceholder="아이디를 입력하세요."
      identifierType="text"
      passwordPlaceholder="비밀번호를 입력하세요."
      submitText="로그인"
      hideSocialButtons
      onSubmit={handleSubmit}
    />
  );
}
