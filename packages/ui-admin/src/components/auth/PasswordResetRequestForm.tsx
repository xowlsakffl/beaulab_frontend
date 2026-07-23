"use client";

import Link from "next/link";
import React, { FormEvent, useState } from "react";
import { ArrowLeft, Mail } from "../../icons";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import Button from "../ui/button/Button";

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;

  if (typeof error === "object" && error !== null) {
    const maybeApiError = error as {
      error?: { message?: unknown };
      message?: unknown;
    };

    if (typeof maybeApiError.error?.message === "string") {
      return maybeApiError.error.message;
    }

    if (typeof maybeApiError.message === "string") {
      return maybeApiError.message;
    }
  }

  return "비밀번호 재설정 메일 발송에 실패했습니다.";
}

export type PasswordResetRequestFormValues = {
  email: string;
};

type PasswordResetRequestFormProps = {
  title?: string;
  description?: string;
  emailPlaceholder?: string;
  submitText?: string;
  loginHref?: string;
  successMessage?: string;
  onSubmit?: (values: PasswordResetRequestFormValues) => Promise<string | void> | string | void;
};

export function PasswordResetRequestForm({
  title = "비밀번호 재설정",
  description = "가입한 이메일 주소를 입력하면 비밀번호 재설정 링크를 보내드립니다.",
  emailPlaceholder = "이메일 주소를 입력하세요.",
  submitText = "재설정 링크 받기",
  loginHref = "/login",
  successMessage = "재설정 링크 메일이 발송되었습니다. 메일함을 확인해 주세요.",
  onSubmit,
}: PasswordResetRequestFormProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [localSuccess, setLocalSuccess] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!onSubmit) return;

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setLocalError("이메일 주소를 입력해 주세요.");
      setLocalSuccess(null);
      return;
    }

    setLocalError(null);
    setLocalSuccess(null);
    setIsSubmitting(true);

    try {
      await onSubmit({ email: trimmedEmail });
      setLocalSuccess(successMessage);
    } catch (error) {
      setLocalError(extractErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex w-full flex-1 flex-col lg:w-1/2">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        <div>
          <Link
            href={loginHref}
            className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-brand-500"
          >
            <ArrowLeft className="size-4" />
            로그인으로 돌아가기
          </Link>

          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 text-title-sm font-semibold text-gray-800 sm:text-title-md">{title}</h1>
            <p className="text-sm text-gray-500">{description}</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-5">
              <div>
                <Label>
                  이메일 <span className="text-error-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    type="email"
                    placeholder={emailPlaceholder}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                  />
                  <Mail className="absolute top-1/2 right-4 size-4 -translate-y-1/2 text-gray-400" />
                </div>
                {localError ? <p className="mt-1 text-[11px] leading-4 text-error-500">{localError}</p> : null}
                {localSuccess ? (
                  <p className="mt-2 rounded-md bg-brand-25 px-3 py-2 text-xs font-medium text-brand-700">
                    {localSuccess}
                  </p>
                ) : null}
              </div>

              <Button variant="brand" className="w-full" size="auth" disabled={isSubmitting}>
                {isSubmitting ? "발송 중..." : submitText}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
