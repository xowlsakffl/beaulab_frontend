"use client";

import { Button, Eye, EyeOff, InputField, Label, SpinnerBlock } from "@beaulab/ui-admin";
import { AuthFormPanel } from "@beaulab/ui-admin/components/auth";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { EmailVerificationFields } from "@/components/account-hospital/EmailVerificationFields";
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
    verification,
    fieldErrors,
    formError,
    isSubmitting,
    isCompleted,
    clearFieldError,
    submit,
  } = flow;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await submit();
  };

  if (isLoading) {
    return (
      <AuthFormPanel>
        <SpinnerBlock className="min-h-[360px]" spinnerClassName="size-8" label="초대 정보 확인 중" />
      </AuthFormPanel>
    );
  }

  if (loadError) {
    return <AuthFormPanel title="계정 생성 정보를 확인할 수 없습니다." description={loadError} loginHref="/login" />;
  }

  if (isCompleted) {
    return (
      <AuthFormPanel
        title="계정 생성이 완료되었습니다."
        description={
          <>
            <span className="font-medium text-gray-700">{invitation?.hospital_name}</span> 계정이 정상적으로
            생성되었습니다.
          </>
        }
      >
        <Button type="button" variant="brand" size="auth" className="w-full" onClick={() => router.push("/login")}>
          로그인하러 가기
        </Button>
      </AuthFormPanel>
    );
  }

  return (
    <AuthFormPanel
      title="병의원 계정 생성"
      description={
        <>
          <span className="font-medium text-gray-700">{invitation?.hospital_name}</span> 관리자 계정을 생성합니다.
        </>
      }
    >
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

          <EmailVerificationFields flow={verification} disabled={isSubmitting} />
          {fieldErrors.email || fieldErrors.email_verification_token ? (
            <p role="alert" className="text-xs text-error-500">
              {fieldErrors.email || fieldErrors.email_verification_token}
            </p>
          ) : null}

          <div>
            {formError ? <p className="mb-1 text-xs leading-5 text-error-500">{formError}</p> : null}
            <Button
              type="submit"
              variant="brand"
              size="auth"
              className="w-full"
              disabled={isSubmitting || !verification.isVerified || Boolean(verification.busy)}
            >
              {isSubmitting ? "생성 중..." : "계정 생성"}
            </Button>
          </div>
        </div>
      </form>
    </AuthFormPanel>
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
