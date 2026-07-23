"use client";

import Link from "next/link";
import React, { FormEvent, useState } from "react";
import { ArrowLeft, Eye, EyeOff } from "../../icons";
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

  return "비밀번호 변경에 실패했습니다.";
}

export type PasswordResetFormValues = {
  email: string;
  token: string;
  password: string;
  passwordConfirmation: string;
};

type PasswordResetFormProps = {
  email: string;
  token: string;
  title?: string;
  description?: string;
  loginHref?: string;
  onSubmit?: (values: PasswordResetFormValues) => Promise<string | void> | string | void;
  onSuccess?: (message: string) => void;
};

export function PasswordResetForm({
  email,
  token,
  title = "새 비밀번호 설정",
  description = "새로 사용할 비밀번호를 입력해 주세요.",
  loginHref = "/login",
  onSubmit,
  onSuccess,
}: PasswordResetFormProps) {
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const hasRequiredLinkData = Boolean(email && token);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!onSubmit) return;

    if (!hasRequiredLinkData) {
      setLocalError("비밀번호 재설정 링크가 올바르지 않습니다.");
      return;
    }

    if (password.length < 8) {
      setLocalError("비밀번호는 8자 이상 입력해 주세요.");
      return;
    }

    if (password !== passwordConfirmation) {
      setLocalError("비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    setLocalError(null);
    setIsSubmitting(true);

    try {
      const message = await onSubmit({
        email,
        token,
        password,
        passwordConfirmation,
      });
      onSuccess?.(message || "비밀번호가 변경되었습니다.");
      setIsCompleted(true);
      setPassword("");
      setPasswordConfirmation("");
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

          {!hasRequiredLinkData ? (
            <div className="rounded-md border border-error-200 bg-error-50 px-3 py-2 text-xs leading-4 text-error-600">
              비밀번호 재설정 링크가 올바르지 않습니다. 다시 요청해 주세요.
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <Label>
                    새 비밀번호 <span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="새 비밀번호를 입력하세요."
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute top-1/2 right-4 z-30 -translate-y-1/2 text-gray-400 transition hover:text-gray-600"
                      aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                    >
                      {showPassword ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <Label>
                    새 비밀번호 확인 <span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPasswordConfirmation ? "text" : "password"}
                      placeholder="새 비밀번호를 다시 입력하세요."
                      value={passwordConfirmation}
                      onChange={(event) => setPasswordConfirmation(event.target.value)}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswordConfirmation((current) => !current)}
                      className="absolute top-1/2 right-4 z-30 -translate-y-1/2 text-gray-400 transition hover:text-gray-600"
                      aria-label={showPasswordConfirmation ? "비밀번호 확인 숨기기" : "비밀번호 확인 보기"}
                    >
                      {showPasswordConfirmation ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                    </button>
                  </div>
                  {localError ? <p className="mt-1 text-[11px] leading-4 text-error-500">{localError}</p> : null}
                </div>

                <Button variant="brand" className="w-full" size="auth" disabled={isSubmitting || isCompleted}>
                  {isSubmitting ? "변경 중..." : isCompleted ? "변경 완료" : "비밀번호 변경"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
