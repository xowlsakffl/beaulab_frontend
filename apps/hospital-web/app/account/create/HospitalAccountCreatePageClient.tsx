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
  StatusBadge,
} from "@beaulab/ui-admin";
import { isApiSuccess } from "@beaulab/types";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";

import {
  completeHospitalAccountInvitation,
  getHospitalAccountInvitation,
  type HospitalAccountInvitation,
} from "@/lib/account-hospital/invitation";

type HospitalAccountCreatePageClientProps = {
  invitationToken: string;
  initialIdentityVerificationToken: string;
};

type FieldName = "nickname" | "password" | "password_confirmation" | "identity_verification_token";
type FieldErrors = Partial<Record<FieldName, string>>;

const IDENTITY_VERIFICATION_TOKEN_PATTERN = /^[A-Za-z0-9]{64}$/;
const IDENTITY_VERIFICATION_URL = process.env.NEXT_PUBLIC_HOSPITAL_IDENTITY_VERIFICATION_URL?.trim() || "";

export default function HospitalAccountCreatePageClient({
  invitationToken,
  initialIdentityVerificationToken,
}: HospitalAccountCreatePageClientProps) {
  const router = useRouter();
  const [invitation, setInvitation] = useState<HospitalAccountInvitation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [identityVerificationToken] = useState(initialIdentityVerificationToken);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [identityVerificationError, setIdentityVerificationError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const isIdentityVerified = IDENTITY_VERIFICATION_TOKEN_PATTERN.test(identityVerificationToken);

  useEffect(() => {
    if (!initialIdentityVerificationToken) return;

    const url = new URL(window.location.href);
    url.searchParams.delete("identity_verification_token");
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  }, [initialIdentityVerificationToken]);

  useEffect(() => {
    let active = true;

    const loadInvitation = async () => {
      try {
        const result = await getHospitalAccountInvitation(invitationToken);
        if (!active) return;

        if (!isApiSuccess(result.payload)) {
          if (result.status === 419 || result.status === 404 || result.payload.error.code === "TOKEN_ERROR") {
            router.replace("/error/419");
            return;
          }

          if (result.status === 429 || result.payload.error.code === "RATE_LIMITED") {
            router.replace("/error/429");
            return;
          }

          setLoadError(result.payload.error.message || "계정 생성 정보를 불러오지 못했습니다.");
          return;
        }

        setInvitation(result.payload.data);
      } catch {
        if (active) {
          setLoadError("계정 생성 정보를 불러오지 못했습니다.");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadInvitation();

    return () => {
      active = false;
    };
  }, [invitationToken, router]);

  const startIdentityVerification = () => {
    setIdentityVerificationError(null);
    setFormError(null);

    if (!IDENTITY_VERIFICATION_URL) {
      setIdentityVerificationError("휴대폰 본인인증 연동이 아직 설정되지 않았습니다.");
      return;
    }

    const returnUrl = new URL(window.location.href);
    returnUrl.searchParams.delete("identity_verification_token");

    const verificationUrl = new URL(IDENTITY_VERIFICATION_URL, window.location.origin);
    verificationUrl.searchParams.set("invitation_token", invitationToken);
    verificationUrl.searchParams.set("return_url", returnUrl.toString());
    window.location.assign(verificationUrl.toString());
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validateForm({
      nickname,
      password,
      passwordConfirmation,
      identityVerificationToken,
    });

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setFormError(null);
      return;
    }

    setFieldErrors({});
    setIdentityVerificationError(null);
    setFormError(null);
    setIsSubmitting(true);

    try {
      const result = await completeHospitalAccountInvitation(invitationToken, {
        nickname: nickname.trim(),
        password,
        password_confirmation: passwordConfirmation,
        identity_verification_token: identityVerificationToken,
      });

      if (!isApiSuccess(result.payload)) {
        if (result.status === 419 || result.payload.error.code === "TOKEN_ERROR") {
          router.replace("/error/419");
          return;
        }

        if (result.status === 429 || result.payload.error.code === "RATE_LIMITED") {
          router.replace("/error/429");
          return;
        }

        const apiFieldErrors = extractFieldErrors(result.payload.error.details);
        if (Object.keys(apiFieldErrors).length > 0) {
          setFieldErrors(apiFieldErrors);
        } else {
          setFormError(result.payload.error.message || "계정을 생성하지 못했습니다.");
        }
        return;
      }

      setPassword("");
      setPasswordConfirmation("");
      setIsCompleted(true);
    } catch {
      setFormError("계정을 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsSubmitting(false);
    }
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
            <AccountCreateCompleted hospitalName={invitation?.hospital_name ?? ""} />
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
                        clearFieldError("nickname", setFieldErrors);
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
                      clearFieldError("password", setFieldErrors);
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
                      clearFieldError("password_confirmation", setFieldErrors);
                    }}
                    onToggle={() => setShowPasswordConfirmation((current) => !current)}
                  />

                  <div>
                    <RequiredLabel>휴대폰 본인인증</RequiredLabel>
                    <div className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-gray-300 px-4 py-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <ShieldCheck
                          className={isIdentityVerified ? "size-4 text-success-600" : "size-4 text-gray-400"}
                        />
                        <span className="truncate text-sm text-gray-700">
                          {isIdentityVerified ? "본인인증이 완료되었습니다." : "본인인증이 필요합니다."}
                        </span>
                      </div>
                      {isIdentityVerified ? (
                        <StatusBadge color="success" size="sm">
                          완료
                        </StatusBadge>
                      ) : (
                        <Button type="button" variant="brandOutline" size="sm" onClick={startIdentityVerification}>
                          본인인증
                        </Button>
                      )}
                    </div>
                    {fieldErrors.identity_verification_token ? (
                      <p className="mt-1 text-xs leading-4 text-error-500">{fieldErrors.identity_verification_token}</p>
                    ) : null}
                    {identityVerificationError ? (
                      <p className="mt-1 text-xs leading-5 text-error-500">{identityVerificationError}</p>
                    ) : null}
                  </div>

                  <div>
                    {formError ? <p className="mb-1 text-xs leading-5 text-error-500">{formError}</p> : null}
                    <Button
                      type="submit"
                      variant="brand"
                      size="auth"
                      className="w-full"
                      disabled={isSubmitting || !isIdentityVerified}
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

function AccountCreateCompleted({ hospitalName }: { hospitalName: string }) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-success-50 text-success-600">
        <CheckCircle2 className="size-7" />
      </div>
      <h1 className="mt-5 text-2xl font-semibold text-gray-900">계정 생성이 완료되었습니다.</h1>
      <p className="mt-3 text-sm leading-6 text-gray-500">
        <span className="font-medium text-gray-700">{hospitalName}</span> 병의원 계정이 정상적으로 생성되었습니다.
      </p>
    </div>
  );
}

function validateForm({
  nickname,
  password,
  passwordConfirmation,
  identityVerificationToken,
}: {
  nickname: string;
  password: string;
  passwordConfirmation: string;
  identityVerificationToken: string;
}): FieldErrors {
  const errors: FieldErrors = {};
  const trimmedNickname = nickname.trim();

  if (!trimmedNickname) {
    errors.nickname = "아이디를 입력해 주세요.";
  } else if (trimmedNickname.length < 4) {
    errors.nickname = "아이디는 4자 이상 입력해 주세요.";
  } else if (!/^[A-Za-z0-9._-]+$/.test(trimmedNickname)) {
    errors.nickname = "아이디는 영문, 숫자, 마침표, 밑줄, 하이픈만 사용할 수 있습니다.";
  }

  if (!password) {
    errors.password = "비밀번호를 입력해 주세요.";
  } else if (password.length < 8) {
    errors.password = "비밀번호는 8자 이상 입력해 주세요.";
  }

  if (!passwordConfirmation) {
    errors.password_confirmation = "비밀번호 확인을 입력해 주세요.";
  } else if (password !== passwordConfirmation) {
    errors.password_confirmation = "비밀번호 확인이 일치하지 않습니다.";
  }

  if (!IDENTITY_VERIFICATION_TOKEN_PATTERN.test(identityVerificationToken)) {
    errors.identity_verification_token = "휴대폰 본인인증을 완료해 주세요.";
  }

  return errors;
}

function extractFieldErrors(details: unknown): FieldErrors {
  if (typeof details !== "object" || details === null) return {};

  const detailsRecord = details as Record<string, unknown>;
  const source =
    typeof detailsRecord.errors === "object" && detailsRecord.errors !== null
      ? (detailsRecord.errors as Record<string, unknown>)
      : detailsRecord;
  const result: FieldErrors = {};

  for (const field of ["nickname", "password", "password_confirmation", "identity_verification_token"] as const) {
    const value = source[field];
    if (typeof value === "string") {
      result[field] = value;
    } else if (Array.isArray(value) && typeof value[0] === "string") {
      result[field] = value[0];
    }
  }

  return result;
}

function clearFieldError(field: FieldName, setErrors: React.Dispatch<React.SetStateAction<FieldErrors>>) {
  setErrors((current) => {
    if (!current[field]) return current;

    const next = { ...current };
    delete next[field];
    return next;
  });
}
