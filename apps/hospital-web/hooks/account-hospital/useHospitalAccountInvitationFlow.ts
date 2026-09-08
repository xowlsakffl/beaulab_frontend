"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { isApiSuccess } from "@beaulab/types";

import {
  completeHospitalAccountInvitation,
  getHospitalAccountInvitation,
  sendHospitalAccountPhoneVerification,
  verifyHospitalAccountPhoneVerification,
  type HospitalAccountInvitation,
} from "@/lib/account-hospital/invitation";
import {
  PHONE_VERIFICATION_TOKEN_PATTERN,
  extractHospitalAccountCreateFieldErrors,
  formatPhoneInput,
  isValidPhone,
  validateHospitalAccountCreateForm,
  type HospitalAccountCreateFieldErrors,
  type HospitalAccountCreateFieldName,
} from "@/lib/account-hospital/create-form";

export function useHospitalAccountInvitationFlow(invitationToken: string) {
  const router = useRouter();
  const [invitation, setInvitation] = React.useState<HospitalAccountInvitation | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [nickname, setNickname] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [passwordConfirmation, setPasswordConfirmation] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [verificationCode, setVerificationCode] = React.useState("");
  const [phoneVerificationId, setPhoneVerificationId] = React.useState<number | null>(null);
  const [phoneVerificationToken, setPhoneVerificationToken] = React.useState("");
  const [resendRemainingSeconds, setResendRemainingSeconds] = React.useState(0);
  const [fieldErrors, setFieldErrors] = React.useState<HospitalAccountCreateFieldErrors>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [isSendingCode, setIsSendingCode] = React.useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isCompleted, setIsCompleted] = React.useState(false);
  const isPhoneVerified = PHONE_VERIFICATION_TOKEN_PATTERN.test(phoneVerificationToken);

  const clearFieldError = React.useCallback((field: HospitalAccountCreateFieldName) => {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }, []);

  const redirectForTerminalError = React.useCallback(
    (status: number, code: string) => {
      if ((status === 419 && code !== "CSRF_MISMATCH") || status === 404 || code === "TOKEN_ERROR") {
        router.replace("/error/419");
        return true;
      }
      if (status === 429 || code === "RATE_LIMITED") {
        router.replace("/error/429");
        return true;
      }
      return false;
    },
    [router],
  );

  React.useEffect(() => {
    if (resendRemainingSeconds <= 0) return;
    const timer = window.setTimeout(() => setResendRemainingSeconds((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [resendRemainingSeconds]);

  React.useEffect(() => {
    let active = true;
    setIsLoading(true);
    setLoadError(null);

    void getHospitalAccountInvitation(invitationToken)
      .then((result) => {
        if (!active) return;
        if (!isApiSuccess(result.payload)) {
          if (!redirectForTerminalError(result.status, result.payload.error.code)) {
            setLoadError(result.payload.error.message || "계정 생성 정보를 불러오지 못했습니다.");
          }
          return;
        }
        setInvitation(result.payload.data);
      })
      .catch(() => {
        if (active) setLoadError("계정 생성 정보를 불러오지 못했습니다.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [invitationToken, redirectForTerminalError]);

  const changePhone = React.useCallback(
    (value: string) => {
      setPhone(formatPhoneInput(value));
      setPhoneVerificationId(null);
      setPhoneVerificationToken("");
      setVerificationCode("");
      setResendRemainingSeconds(0);
      clearFieldError("phone");
      clearFieldError("code");
      clearFieldError("phone_verification_token");
    },
    [clearFieldError],
  );

  const changeVerificationCode = React.useCallback(
    (value: string) => {
      setVerificationCode(value.replace(/\D/g, "").slice(0, 6));
      clearFieldError("code");
    },
    [clearFieldError],
  );

  const sendVerificationCode = React.useCallback(async () => {
    setFormError(null);
    clearFieldError("phone");
    if (!isValidPhone(phone)) {
      setFieldErrors((current) => ({ ...current, phone: "휴대폰 번호를 정확히 입력해 주세요." }));
      return;
    }

    setIsSendingCode(true);
    try {
      const result = await sendHospitalAccountPhoneVerification(invitationToken, phone);
      if (!isApiSuccess(result.payload)) {
        const apiError = result.payload.error;
        if (!redirectForTerminalError(result.status, apiError.code)) {
          setFieldErrors((current) => ({
            ...current,
            phone: apiError.message || "인증번호를 발송하지 못했습니다.",
          }));
        }
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
  }, [clearFieldError, invitationToken, phone, redirectForTerminalError]);

  const verifyCode = React.useCallback(async () => {
    setFormError(null);
    clearFieldError("code");
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
        const apiError = result.payload.error;
        if (!redirectForTerminalError(result.status, apiError.code)) {
          setFieldErrors((current) => ({
            ...current,
            code: apiError.message || "인증번호를 확인하지 못했습니다.",
          }));
        }
        return;
      }
      setPhoneVerificationToken(result.payload.data.phone_verification_token);
      clearFieldError("code");
      clearFieldError("phone_verification_token");
    } catch {
      setFieldErrors((current) => ({ ...current, code: "인증번호를 확인하지 못했습니다." }));
    } finally {
      setIsVerifyingCode(false);
    }
  }, [clearFieldError, invitationToken, phoneVerificationId, redirectForTerminalError, verificationCode]);

  const submit = React.useCallback(async () => {
    const nextErrors = validateHospitalAccountCreateForm({
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
        if (redirectForTerminalError(result.status, result.payload.error.code)) return;
        const apiFieldErrors = extractHospitalAccountCreateFieldErrors(result.payload.error.details);
        if (Object.keys(apiFieldErrors).length > 0) setFieldErrors(apiFieldErrors);
        else setFormError(result.payload.error.message || "계정을 생성하지 못했습니다.");
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
  }, [
    invitationToken,
    nickname,
    password,
    passwordConfirmation,
    phone,
    phoneVerificationToken,
    redirectForTerminalError,
  ]);

  return {
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
  };
}
