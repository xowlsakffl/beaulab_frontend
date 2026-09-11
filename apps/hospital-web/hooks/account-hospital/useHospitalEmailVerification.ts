"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { isApiSuccess } from "@beaulab/types";
import { isValidEmail } from "@/lib/account-hospital/create-form";
import { sendEmailVerification, verifyEmailCode } from "@/lib/account-hospital/email-verification";

export function useHospitalEmailVerification(invitationToken: string) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [verificationId, setVerificationId] = useState<number | null>(null);
  const [verificationToken, setVerificationToken] = useState("");
  const [verified, setVerified] = useState(false);
  const [codeExpiresAt, setCodeExpiresAt] = useState(0);
  const [verifiedExpiresAt, setVerifiedExpiresAt] = useState(0);
  const [resendAt, setResendAt] = useState(0);
  const [now, setNow] = useState(0);
  const [busy, setBusy] = useState<"send" | "verify" | null>(null);
  const [error, setError] = useState("");
  const generation = useRef(0);
  const inFlight = useRef(false);
  const invalidate = useCallback(() => {
    generation.current++;
  }, []);

  useEffect(() => {
    invalidate();
    inFlight.current = false;
    setBusy(null);
    setVerificationId(null);
    setVerificationToken("");
    setVerified(false);
    setCode("");
    setEmail("");
    setError("");
    setCodeExpiresAt(0);
    setVerifiedExpiresAt(0);
    setResendAt(0);
    return invalidate;
  }, [invitationToken, invalidate]);

  useEffect(() => {
    if (!codeExpiresAt && !resendAt && !verifiedExpiresAt) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [codeExpiresAt, resendAt, verifiedExpiresAt]);

  const isVerified = verified && (!verifiedExpiresAt || now < verifiedExpiresAt);
  const resendSeconds = Math.max(0, Math.ceil((resendAt - now) / 1000));
  const codeSeconds = Math.max(0, Math.ceil((codeExpiresAt - now) / 1000));

  function changeEmail(value: string) {
    generation.current++;
    setEmail(value);
    setVerificationId(null);
    setVerificationToken("");
    setVerified(false);
    setCode("");
    setCodeExpiresAt(0);
    setVerifiedExpiresAt(0);
    setError("");
  }

  async function send() {
    if (inFlight.current || resendSeconds > 0) return;
    if (!isValidEmail(email)) {
      setError("이메일 주소를 정확히 입력해 주세요.");
      return;
    }
    const request = generation.current;
    inFlight.current = true;
    setBusy("send");
    setError("");
    try {
      const { payload } = await sendEmailVerification(invitationToken, email.trim().toLowerCase());
      if (request !== generation.current) return;
      if (!isApiSuccess(payload)) {
        setError(payload.error.message);
        return;
      }
      setVerificationId(payload.data.verification_id);
      setVerificationToken("");
      setVerified(false);
      setCode("");
      const current = Date.now();
      setNow(current);
      setCodeExpiresAt(Date.parse(payload.data.code_expires_at));
      setResendAt(current + payload.data.resend_after_seconds * 1000);
    } catch {
      if (request === generation.current) setError("인증번호를 발송하지 못했습니다. 다시 시도해 주세요.");
    } finally {
      if (request === generation.current) {
        inFlight.current = false;
        setBusy(null);
      }
    }
  }

  async function verify() {
    if (inFlight.current || verificationId === null) return;
    if (!/^\d{6}$/.test(code)) {
      setError("6자리 인증번호를 입력해 주세요.");
      return;
    }
    const request = generation.current;
    inFlight.current = true;
    setBusy("verify");
    setError("");
    try {
      const { payload } = await verifyEmailCode(invitationToken, verificationId, code);
      if (request !== generation.current) return;
      if (!isApiSuccess(payload)) {
        setError(payload.error.message);
        return;
      }
      setVerified(true);
      setVerificationToken(payload.data.email_verification_token ?? "");
      setVerifiedExpiresAt(payload.data.expires_at ? Date.parse(payload.data.expires_at) : 0);
      setNow(Date.now());
    } catch {
      if (request === generation.current) setError("인증번호를 확인하지 못했습니다. 다시 시도해 주세요.");
    } finally {
      if (request === generation.current) {
        inFlight.current = false;
        setBusy(null);
      }
    }
  }

  return {
    email,
    changeEmail,
    code,
    changeCode: (value: string) => setCode(value.replace(/\D/g, "").slice(0, 6)),
    verificationId,
    verificationToken: isVerified ? verificationToken : "",
    isVerified,
    resendSeconds,
    codeSeconds,
    busy,
    error,
    expired: verified && !isVerified,
    send,
    verify,
  };
}
