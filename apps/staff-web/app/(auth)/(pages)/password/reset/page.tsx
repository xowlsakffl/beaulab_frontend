import PasswordResetPageClient from "./PasswordResetPageClient";
import { AuthFormPanel } from "@beaulab/ui-admin/components/auth";
import { verifyPasswordResetToken } from "@/lib/common/auth/password-reset.server";
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
    <AuthFormPanel
      loginHref="/login"
      title="비밀번호 재설정"
      description="재설정 링크를 확인하는 중 일시적인 문제가 발생했습니다."
    >
      <div role="alert" className="rounded-lg border border-error-200 bg-error-50 px-4 py-3">
        <p className="text-xs leading-5 font-medium text-error-600">{message}</p>
        <p className="mt-1 text-[11px] leading-4 text-error-500">
          링크가 만료된 것은 아닐 수 있습니다. 잠시 후 페이지를 다시 열어 주세요.
        </p>
      </div>
    </AuthFormPanel>
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
