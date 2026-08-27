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
import { isApiSuccess } from "@beaulab/types";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";

import {
  completeHospitalAccountInvitation,
  getHospitalAccountInvitation,
  sendHospitalAccountPhoneVerification,
  type HospitalAccountInvitation,
  verifyHospitalAccountPhoneVerification,
} from "@/lib/account-hospital/invitation";

type HospitalAccountCreatePageClientProps = {
  invitationToken: string;
};

type FieldName = "nickname" | "password" | "password_confirmation" | "phone" | "code" | "phone_verification_token";
type FieldErrors = Partial<Record<FieldName, string>>;

const PHONE_VERIFICATION_TOKEN_PATTERN = /^[A-Za-z0-9]{64}$/;

export default function HospitalAccountCreatePageClient({ invitationToken }: HospitalAccountCreatePageClientProps) {
  const router = useRouter();
  const [invitation, setInvitation] = useState<HospitalAccountInvitation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [phone, setPhone] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [phoneVerificationId, setPhoneVerificationId] = useState<number | null>(null);
  const [phoneVerificationToken, setPhoneVerificationToken] = useState("");
  const [resendRemainingSeconds, setResendRemainingSeconds] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const isPhoneVerified = PHONE_VERIFICATION_TOKEN_PATTERN.test(phoneVerificationToken);
  useEffect(() => {
    if (resendRemainingSeconds <= 0) return;

    const timer = window.setTimeout(() => {
      setResendRemainingSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [resendRemainingSeconds]);

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

  const sendVerificationCode = async () => {
    setFormError(null);
    clearFieldError("phone", setFieldErrors);

    if (!isValidPhone(phone)) {
      setFieldErrors((current) => ({ ...current, phone: "휴대폰 번호를 정확히 입력해 주세요." }));
      return;
    }

    setIsSendingCode(true);
    try {
      const result = await sendHospitalAccountPhoneVerification(invitationToken, phone);
      if (!isApiSuccess(result.payload)) {
        if (result.status === 419 || result.payload.error.code === "TOKEN_ERROR") {
          router.replace("/error/419");
          return;
        }

        const errorMessage = result.payload.error.message;
        setFieldErrors((current) => ({
          ...current,
          phone: errorMessage || "인증번호를 발송하지 못했습니다.",
        }));
        return;
      }

      setPhoneVerificationId(result.payload.data.verification_id);
      setPhoneVerificationToken("");
      setVerificationCode("");
      setResendRemainingSeconds(result.payload.data.resend_after_seconds);
    } catch {
      setFieldErrors((current) => ({ ...current, phone: "인증번호를 발송하지 못했습니다." }));
    } finally {
      setIsSendingCode(false);
    }
  };

  const verifyCode = async () => {
    setFormError(null);
    clearFieldError("code", setFieldErrors);

    if (phoneVerificationId === null || !/^\d{6}$/.test(verificationCode)) {
      setFieldErrors((current) => ({ ...current, code: "6자리 인증번호를 입력해 주세요." }));
      return;
    }

    setIsVerifyingCode(true);
    try {
      const result = await verifyHospitalAccountPhoneVerification(
        invitationToken,
        phoneVerificationId,
        verificationCode,
      );
      if (!isApiSuccess(result.payload)) {
        if (result.status === 419 || result.payload.error.code === "TOKEN_ERROR") {
          router.replace("/error/419");
          return;
        }

        const errorMessage = result.payload.error.message;
        setFieldErrors((current) => ({
          ...current,
          code: errorMessage || "인증번호를 확인하지 못했습니다.",
        }));
        return;
      }

      setPhoneVerificationToken(result.payload.data.phone_verification_token);
      setFieldErrors((current) => {
        const next = { ...current };
        delete next.code;
        delete next.phone_verification_token;
        return next;
      });
    } catch {
      setFieldErrors((current) => ({ ...current, code: "인증번호를 확인하지 못했습니다." }));
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validateForm({
      nickname,
      password,
      passwordConfirmation,
      phone,
      phoneVerificationToken,
    });

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setFormError(null);
      return;
    }

    setFieldErrors({});
    setFormError(null);
    setIsSubmitting(true);

    try {
      const result = await completeHospitalAccountInvitation(invitationToken, {
        nickname: nickname.trim(),
        password,
        password_confirmation: passwordConfirmation,
        phone_verification_token: phoneVerificationToken,
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
                    <RequiredLabel htmlFor="phone">휴대폰 번호</RequiredLabel>
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <InputField
                          id="phone"
                          name="phone"
                          value={phone}
                          onChange={(event) => {
                            setPhone(formatPhoneInput(event.target.value));
                            setPhoneVerificationId(null);
                            setPhoneVerificationToken("");
                            setVerificationCode("");
                            setResendRemainingSeconds(0);
                            clearFieldError("phone", setFieldErrors);
                            clearFieldError("code", setFieldErrors);
                            clearFieldError("phone_verification_token", setFieldErrors);
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
                                setVerificationCode(event.target.value.replace(/\D/g, "").slice(0, 6));
                                clearFieldError("code", setFieldErrors);
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

function validateForm({
  nickname,
  password,
  passwordConfirmation,
  phone,
  phoneVerificationToken,
}: {
  nickname: string;
  password: string;
  passwordConfirmation: string;
  phone: string;
  phoneVerificationToken: string;
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

  if (!isValidPhone(phone)) {
    errors.phone = "휴대폰 번호를 정확히 입력해 주세요.";
  }

  if (!PHONE_VERIFICATION_TOKEN_PATTERN.test(phoneVerificationToken)) {
    errors.phone_verification_token = "휴대폰 인증을 완료해 주세요.";
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

  for (const field of [
    "nickname",
    "password",
    "password_confirmation",
    "phone",
    "code",
    "phone_verification_token",
  ] as const) {
    const value = source[field];
    if (typeof value === "string") {
      result[field] = value;
    } else if (Array.isArray(value) && typeof value[0] === "string") {
      result[field] = value[0];
    }
  }

  return result;
}

function formatPhoneInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;

  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

function isValidPhone(value: string) {
  return /^01[016789]-?\d{3,4}-?\d{4}$/.test(value);
}

function clearFieldError(field: FieldName, setErrors: React.Dispatch<React.SetStateAction<FieldErrors>>) {
  setErrors((current) => {
    if (!current[field]) return current;

    const next = { ...current };
    delete next[field];
    return next;
  });
}
