"use client";

import {
  Building2,
  Button,
  CheckCircle2,
  Eye,
  EyeOff,
  GridShape,
  InputField,
  Label,
  ShieldCheck,
  SpinnerBlock,
  StatusValueBadge,
} from "@beaulab/ui-admin";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { useHospitalAccountInvitationFlow } from "@/hooks/account-hospital/useHospitalAccountInvitationFlow";

type HospitalAccountCreatePageClientProps = {
  invitationToken: string;
};

export default function HospitalAccountCreatePageClient({ invitationToken }: HospitalAccountCreatePageClientProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const flow = useHospitalAccountInvitationFlow(invitationToken);
  const {
    invitation,
    isLoading,
    loadError,
    nickname,
    setNickname,
    password,
    setPassword,
    passwordConfirmation,
    setPasswordConfirmation,
    phone,
    verificationCode,
    phoneVerificationId,
    resendRemainingSeconds,
    fieldErrors,
    formError,
    isSendingCode,
    isVerifyingCode,
    isSubmitting,
    isCompleted,
    isPhoneVerified,
    clearFieldError,
    changePhone,
    changeVerificationCode,
    sendVerificationCode,
    verifyCode,
    submit,
  } = flow;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await submit();
  };

  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-2">
      <section className="flex min-h-screen items-center px-6 py-10 sm:px-10 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-md">
          {isLoading ? (
            <SpinnerBlock className="min-h-[360px]" spinnerClassName="size-8" label="초대 정보 확인 중" />
          ) : loadError ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
              <h1 className="text-xl font-semibold text-gray-900">계정 생성 정보를 확인할 수 없습니다.</h1>
              <p className="mt-3 text-sm leading-6 text-gray-500">{loadError}</p>
            </div>
          ) : isCompleted ? (
            <AccountCreateCompleted
              hospitalName={invitation?.hospital_name ?? ""}
              onLogin={() => router.push("/login")}
            />
          ) : (
            <>
              <div className="mb-8">
                <div className="mb-5 inline-flex size-11 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <Building2 className="size-5" />
                </div>
                <h1 className="text-title-sm font-semibold text-gray-900">병의원 계정 생성</h1>
                <p className="mt-2 text-sm leading-6 text-gray-500">
                  <span className="font-medium text-gray-700">{invitation?.hospital_name}</span> 관리자 계정을
                  생성합니다.
                </p>
              </div>

              <form onSubmit={handleSubmit} noValidate>
                <div className="space-y-5">
                  <div>
                    <RequiredLabel htmlFor="nickname">아이디</RequiredLabel>
                    <InputField
                      id="nickname"
                      name="nickname"
                      value={nickname}
                      onChange={(event) => {
                        setNickname(event.target.value);
                        clearFieldError("nickname");
                      }}
                      placeholder="아이디를 입력하세요."
                      autoComplete="username"
                      maxLength={50}
                      error={Boolean(fieldErrors.nickname)}
                      hint={fieldErrors.nickname}
                    />
                  </div>

                  <PasswordField
                    id="password"
                    label="비밀번호"
                    value={password}
                    visible={showPassword}
                    error={fieldErrors.password}
                    autoComplete="new-password"
                    onChange={(value) => {
                      setPassword(value);
                      clearFieldError("password");
                    }}
                    onToggle={() => setShowPassword((current) => !current)}
                  />

                  <PasswordField
                    id="password-confirmation"
                    label="비밀번호 확인"
                    value={passwordConfirmation}
                    visible={showPasswordConfirmation}
                    error={fieldErrors.password_confirmation}
                    autoComplete="new-password"
                    onChange={(value) => {
                      setPasswordConfirmation(value);
                      clearFieldError("password_confirmation");
                    }}
                    onToggle={() => setShowPasswordConfirmation((current) => !current)}
                  />

                  <div>
                    <RequiredLabel htmlFor="phone">휴대폰 번호</RequiredLabel>
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <InputField
                          id="phone"
                          name="phone"
                          value={phone}
                          onChange={(event) => {
                            changePhone(event.target.value);
                          }}
                          placeholder="휴대폰 번호를 입력하세요."
                          inputMode="numeric"
                          autoComplete="tel"
                          maxLength={13}
                          disabled={isPhoneVerified}
                          error={Boolean(fieldErrors.phone)}
                          hint={fieldErrors.phone}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="brandOutline"
                        className="h-11 shrink-0 px-4"
                        disabled={isPhoneVerified || isSendingCode || resendRemainingSeconds > 0}
                        onClick={() => void sendVerificationCode()}
                      >
                        {isSendingCode
                          ? "발송 중"
                          : resendRemainingSeconds > 0
                            ? `${resendRemainingSeconds}초 후 재발송`
                            : phoneVerificationId === null
                              ? "인증번호 발송"
                              : "재발송"}
                      </Button>
                    </div>
                  </div>

                  {phoneVerificationId !== null ? (
                    <div>
                      <RequiredLabel htmlFor="verification-code">인증번호</RequiredLabel>
                      {isPhoneVerified ? (
                        <div className="border-success-200 flex h-11 items-center justify-between rounded-lg border bg-success-50 px-4">
                          <div className="flex items-center gap-2 text-sm text-success-700">
                            <ShieldCheck className="size-4" />
                            휴대폰 인증이 완료되었습니다.
                          </div>
                          <StatusValueBadge label="완료" color="success" />
                        </div>
                      ) : (
                        <div className="flex items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <InputField
                              id="verification-code"
                              name="code"
                              value={verificationCode}
                              onChange={(event) => {
                                changeVerificationCode(event.target.value);
                              }}
                              placeholder="6자리 인증번호"
                              inputMode="numeric"
                              autoComplete="one-time-code"
                              maxLength={6}
                              error={Boolean(fieldErrors.code)}
                              hint={fieldErrors.code}
                            />
                          </div>
                          <Button
                            type="button"
                            variant="brand"
                            className="h-11 shrink-0 px-4"
                            disabled={isVerifyingCode || verificationCode.length !== 6}
                            onClick={() => void verifyCode()}
                          >
                            {isVerifyingCode ? "확인 중" : "인증하기"}
                          </Button>
                        </div>
                      )}
                      {fieldErrors.phone_verification_token ? (
                        <p className="mt-1 text-xs leading-4 text-error-500">{fieldErrors.phone_verification_token}</p>
                      ) : null}
                    </div>
                  ) : null}

                  <div>
                    {formError ? <p className="mb-1 text-xs leading-5 text-error-500">{formError}</p> : null}
                    <Button
                      type="submit"
                      variant="brand"
                      size="auth"
                      className="w-full"
                      disabled={isSubmitting || !isPhoneVerified}
                    >
                      {isSubmitting ? "생성 중..." : "계정 생성"}
                    </Button>
                  </div>
                </div>
              </form>
            </>
          )}
        </div>
      </section>

      <aside className="relative hidden min-h-screen items-center justify-center overflow-hidden bg-brand-950 px-12 lg:flex">
        <GridShape />
        <div className="relative z-10 flex max-w-sm flex-col items-center text-center">
          <Image
            width={237}
            height={46}
            src="/images/logo/board_logo_dark.png"
            alt="뷰랩"
            className="h-auto w-[237px]"
            priority
          />
          <p className="mt-5 text-sm leading-6 text-gray-300">병의원 운영을 위한 뷰랩 파트너 서비스입니다.</p>
        </div>
      </aside>
    </main>
  );
}

function RequiredLabel({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <Label htmlFor={htmlFor}>
      {children} <span className="text-error-500">*</span>
    </Label>
  );
}

type PasswordFieldProps = {
  id: string;
  label: string;
  value: string;
  visible: boolean;
  error?: string;
  autoComplete: string;
  onChange: (value: string) => void;
  onToggle: () => void;
};

function PasswordField({ id, label, value, visible, error, autoComplete, onChange, onToggle }: PasswordFieldProps) {
  return (
    <div>
      <RequiredLabel htmlFor={id}>{label}</RequiredLabel>
      <div className="relative">
        <InputField
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={`${label}${label.endsWith("확인") ? "을" : "를"} 입력하세요.`}
          autoComplete={autoComplete}
          maxLength={255}
          error={Boolean(error)}
          className="pr-11"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute top-[22px] right-3 flex size-8 -translate-y-1/2 items-center justify-center text-gray-400 transition hover:text-gray-600"
          aria-label={visible ? `${label} 숨기기` : `${label} 보기`}
          title={visible ? `${label} 숨기기` : `${label} 보기`}
        >
          {visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
        </button>
      </div>
      {error ? <p className="mt-1 text-xs leading-4 text-error-500">{error}</p> : null}
    </div>
  );
}

function AccountCreateCompleted({ hospitalName, onLogin }: { hospitalName: string; onLogin: () => void }) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-success-50 text-success-600">
        <CheckCircle2 className="size-7" />
      </div>
      <h1 className="mt-5 text-2xl font-semibold text-gray-900">계정 생성이 완료되었습니다.</h1>
      <p className="mt-3 text-sm leading-6 text-gray-500">
        <span className="font-medium text-gray-700">{hospitalName}</span> 계정이 정상적으로 생성되었습니다.
      </p>
      <Button type="button" variant="brand" className="mt-7 h-11 w-full max-w-xs" onClick={onLogin}>
        로그인하러 가기
      </Button>
    </div>
  );
}
