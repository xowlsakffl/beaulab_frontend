"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { isApiSuccess } from "@beaulab/types";
import { useHospitalEmailVerification } from "@/hooks/account-hospital/useHospitalEmailVerification";
import {
  completeHospitalAccountInvitation,
  getHospitalAccountInvitation,
  type HospitalAccountInvitation,
} from "@/lib/account-hospital/invitation";
import {
  extractHospitalAccountCreateFieldErrors,
  validateHospitalAccountCreateForm,
  type HospitalAccountCreateFieldErrors,
  type HospitalAccountCreateFieldName,
} from "@/lib/account-hospital/create-form";

export function useHospitalAccountInvitationFlow(invitationToken: string) {
  const router = useRouter();
  const [invitation, setInvitation] = useState<HospitalAccountInvitation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [fieldErrors, setFieldErrors] = useState<HospitalAccountCreateFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const inFlight = useRef(false);
  const verification = useHospitalEmailVerification(invitationToken);
  const changeEmail = useRef(verification.changeEmail);
  changeEmail.current = verification.changeEmail;

  const clearFieldError = useCallback((field: HospitalAccountCreateFieldName) => {
    setFieldErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  }, []);

  const redirectForTerminalError = useCallback(
    (status: number, code: string) => {
      if ((status === 419 && code !== "CSRF_MISMATCH") || status === 404 || code === "TOKEN_ERROR") {
        router.replace("/error/419");
        return true;
      }
      return false;
    },
    [router],
  );

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setLoadError(null);
    void getHospitalAccountInvitation(invitationToken)
      .then((result) => {
        if (!active) return;
        if (!isApiSuccess(result.payload)) {
          if (!redirectForTerminalError(result.status, result.payload.error.code))
            setLoadError(result.payload.error.message);
          return;
        }
        setInvitation(result.payload.data);
        changeEmail.current(result.payload.data.recipient_email);
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

  async function submit() {
    if (inFlight.current || verification.busy) return;
    const errors = validateHospitalAccountCreateForm({
      nickname,
      password,
      passwordConfirmation,
      email: verification.email,
      emailVerificationToken: verification.verificationToken,
    });
    setFieldErrors(errors);
    setFormError(null);
    if (Object.keys(errors).length > 0) return;
    inFlight.current = true;
    setIsSubmitting(true);
    try {
      const result = await completeHospitalAccountInvitation(invitationToken, {
        nickname: nickname.trim(),
        password,
        password_confirmation: passwordConfirmation,
        email: verification.email.trim().toLowerCase(),
        email_verification_token: verification.verificationToken,
      });
      if (!isApiSuccess(result.payload)) {
        if (redirectForTerminalError(result.status, result.payload.error.code)) return;
        const fields = extractHospitalAccountCreateFieldErrors(result.payload.error.details);
        if (Object.keys(fields).length) setFieldErrors(fields);
        else setFormError(result.payload.error.message);
        return;
      }
      setPassword("");
      setPasswordConfirmation("");
      setIsCompleted(true);
    } catch {
      setFormError("계정을 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      inFlight.current = false;
      setIsSubmitting(false);
    }
  }

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
    fieldErrors,
    formError,
    isSubmitting,
    isCompleted,
    clearFieldError,
    verification,
    submit,
  };
}
