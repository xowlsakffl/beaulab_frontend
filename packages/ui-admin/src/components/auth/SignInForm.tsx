"use client";

import Input from "../form/input/InputField";
import Label from "../form/Label";
import Button from "../ui/button/Button";
import { EyeOff, Eye } from "../../icons";
import Link from "next/link";
import React, { FormEvent, useId, useState } from "react";
import { AuthFormPanel } from "./AuthFormPanel";

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

  return "로그인 실패.";
}

export type SignInFormValues = {
  identifier: string;
  password: string;
};

type SignInFormProps = {
  title?: string;
  description?: string;
  identifierLabel?: string;
  identifierPlaceholder?: string;
  identifierType?: "text" | "email";
  passwordPlaceholder?: string;
  submitText?: string;
  backHref?: string;
  forgotPasswordHref?: string | null;
  signUpHref?: string;
  hideSocialButtons?: boolean;
  errorMessage?: string | null;
  onSubmit?: (values: SignInFormValues) => Promise<void> | void;
};

export function SignInForm({
  title = "로그인",
  description = "아이디와 비밀번호를 입력해 로그인하세요!",
  identifierLabel = "아이디",
  identifierPlaceholder = "아이디를 입력하세요.",
  identifierType = "text",
  passwordPlaceholder = "비밀번호를 입력하세요.",
  submitText = "로그인",
  forgotPasswordHref = "/reset-password",
  hideSocialButtons = false,
  errorMessage,
  onSubmit,
}: SignInFormProps) {
  const formId = useId();
  const [showPassword, setShowPassword] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!onSubmit || isSubmitting) return;

    setLocalError(null);
    setIsSubmitting(true);

    try {
      await onSubmit({
        identifier: identifier.trim(),
        password,
      });
    } catch (err) {
      setLocalError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const finalErrorMessage = errorMessage ?? localError;

  return (
    <AuthFormPanel title={title} description={description}>
      {!hideSocialButtons ? (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5">
            <button className="inline-flex items-center justify-center gap-3 rounded-lg bg-gray-100 px-7 py-3 text-sm font-normal text-gray-700 transition-colors hover:bg-gray-200 hover:text-gray-800">
              Sign in with Google
            </button>
            <button className="inline-flex items-center justify-center gap-3 rounded-lg bg-gray-100 px-7 py-3 text-sm font-normal text-gray-700 transition-colors hover:bg-gray-200 hover:text-gray-800">
              Sign in with X
            </button>
          </div>
          <div className="relative py-3 sm:py-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white p-2 text-gray-400 sm:px-5 sm:py-2">Or</span>
            </div>
          </div>
        </>
      ) : null}
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <div>
            <Label htmlFor={`${formId}-identifier`}>
              {identifierLabel} <span className="text-error-500">*</span>{" "}
            </Label>
            <Input
              id={`${formId}-identifier`}
              name="username"
              autoComplete="username"
              required
              disabled={isSubmitting}
              placeholder={identifierPlaceholder}
              type={identifierType}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor={`${formId}-password`}>
              비밀번호 <span className="text-error-500">*</span>{" "}
            </Label>
            <div className="relative">
              <Input
                id={`${formId}-password`}
                name="password"
                autoComplete="current-password"
                required
                disabled={isSubmitting}
                className="pr-11"
                type={showPassword ? "text" : "password"}
                placeholder={passwordPlaceholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                title={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-1/2 right-4 z-30 -translate-y-1/2 cursor-pointer"
              >
                {showPassword ? <Eye className="" /> : <EyeOff className="" />}
              </button>
            </div>
            {finalErrorMessage ? (
              <p role="alert" className="mt-1 text-[11px] leading-4 text-error-500">
                {finalErrorMessage}
              </p>
            ) : null}
          </div>
          {forgotPasswordHref ? (
            <div className="-mt-2 flex items-center justify-end">
              <Link href={forgotPasswordHref} className="text-sm text-brand-500 hover:text-brand-600">
                비밀번호를 잊으셨나요?
              </Link>
            </div>
          ) : null}
          <div>
            <Button type="submit" variant="brand" className="w-full" size="auth" disabled={isSubmitting}>
              {isSubmitting ? "로그인 중..." : submitText}
            </Button>
          </div>
        </div>
      </form>
    </AuthFormPanel>
  );
}
