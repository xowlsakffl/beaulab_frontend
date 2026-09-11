"use client";

import { Button, InputField, Label, ShieldCheck } from "@beaulab/ui-admin";
import type { useHospitalEmailVerification } from "@/hooks/account-hospital/useHospitalEmailVerification";

export function EmailVerificationFields({
  flow,
  disabled = false,
}: {
  flow: ReturnType<typeof useHospitalEmailVerification>;
  disabled?: boolean;
}) {
  const busy = Boolean(flow.busy) || disabled;
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="account-email">
          이메일 <span className="text-error-500">*</span>
        </Label>
        <div className="flex flex-wrap items-start gap-2">
          <div className="min-w-[180px] flex-1">
            <InputField
              id="account-email"
              name="email"
              type="email"
              autoComplete="email"
              maxLength={254}
              value={flow.email}
              onChange={(event) => flow.changeEmail(event.target.value)}
              placeholder="이메일을 입력해 주세요."
              disabled={busy}
            />
          </div>
          <Button
            type="button"
            variant="brandOutline"
            className="h-11 shrink-0 px-3"
            onClick={() => void flow.send()}
            disabled={busy || flow.isVerified || flow.resendSeconds > 0}
          >
            {flow.busy === "send"
              ? "발송 중"
              : flow.resendSeconds > 0
                ? `${flow.resendSeconds}초 후 재발송`
                : flow.verificationId === null
                  ? "인증번호 발송"
                  : "재발송"}
          </Button>
        </div>
      </div>
      {flow.isVerified ? (
        <p role="status" className="flex items-center gap-2 text-sm text-success-700">
          <ShieldCheck className="size-4" /> 이메일 인증이 완료되었습니다.
        </p>
      ) : flow.verificationId !== null ? (
        <div>
          <Label htmlFor="email-code">인증번호</Label>
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <InputField
                id="email-code"
                name="code"
                value={flow.code}
                onChange={(event) => flow.changeCode(event.target.value)}
                placeholder="6자리 인증번호"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                disabled={busy}
              />
            </div>
            <Button
              type="button"
              variant="brand"
              className="h-11 shrink-0 px-4"
              disabled={busy || flow.code.length !== 6 || flow.codeSeconds === 0 || flow.expired}
              onClick={() => void flow.verify()}
            >
              {flow.busy === "verify" ? "확인 중" : "인증하기"}
            </Button>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {flow.expired
              ? "인증이 만료되었습니다. 인증번호를 다시 발송해 주세요."
              : flow.codeSeconds > 0
                ? `인증번호 유효시간 ${Math.floor(flow.codeSeconds / 60)}:${String(flow.codeSeconds % 60).padStart(2, "0")}`
                : "인증번호가 만료되었습니다. 다시 발송해 주세요."}
          </p>
        </div>
      ) : null}
      {flow.error ? (
        <p role="alert" className="text-xs text-error-500">
          {flow.error}
        </p>
      ) : null}
    </div>
  );
}
