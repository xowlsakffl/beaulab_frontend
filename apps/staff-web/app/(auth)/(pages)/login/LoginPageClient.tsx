"use client";

import { useRouter } from "next/navigation";
import { SignInForm, type SignInFormValues } from "@beaulab/ui-admin/components/auth";
import { login } from "@/lib/session";

type LoginPageClientProps = {
  nextPath: string;
};

export default function LoginPageClient({ nextPath }: LoginPageClientProps) {
  const router = useRouter();

  const handleSubmit = async ({ identifier, password }: SignInFormValues) => {
    if (!identifier || !password) {
      throw new Error("아이디와 비밀번호를 입력해주세요.");
    }

    await login({ nickname: identifier, password });
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
