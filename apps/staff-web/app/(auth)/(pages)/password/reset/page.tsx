import PasswordResetPageClient from "./PasswordResetPageClient";
import Link from "next/link";
import { verifyPasswordResetToken } from "@/lib/common/auth/password-reset";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type PasswordResetPageProps = {
  searchParams: Promise<{
    email?: string;
    token?: string;
  }>;
};

function PasswordResetRetryMessage({ message }: { message: string }) {
  return (
    <div className="flex w-full flex-1 flex-col lg:w-1/2">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        <div>
          <Link
            href="/login"
            className="mb-8 inline-flex text-sm font-medium text-gray-500 transition hover:text-brand-500"
          >
            로그인으로 돌아가기
          </Link>

          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 text-title-sm font-semibold text-gray-800 sm:text-title-md">비밀번호 재설정</h1>
            <p className="text-sm leading-6 text-gray-500">재설정 링크를 확인하는 중 일시적인 문제가 발생했습니다.</p>
          </div>

          <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3">
            <p className="text-xs leading-5 font-medium text-error-600">{message}</p>
            <p className="mt-1 text-[11px] leading-4 text-error-500">
              링크가 만료된 것은 아닐 수 있습니다. 잠시 후 페이지를 다시 열어 주세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function PasswordResetPage({ searchParams }: PasswordResetPageProps) {
  const resolvedSearchParams = await searchParams;
  const email = typeof resolvedSearchParams.email === "string" ? resolvedSearchParams.email : "";
  const token = typeof resolvedSearchParams.token === "string" ? resolvedSearchParams.token : "";

  const verifyResult = await verifyPasswordResetToken({ email, token });

  if (verifyResult.status === "invalid") {
    redirect("/error/419");
  }

  if (verifyResult.status === "rate_limited") {
    redirect("/error/429");
  }

  if (verifyResult.status === "retry") {
    return <PasswordResetRetryMessage message={verifyResult.message} />;
  }

  return <PasswordResetPageClient email={email} token={token} />;
}
