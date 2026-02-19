"use client";

import Checkbox from "../form/input/Checkbox";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import Button from "../ui/button/Button";
import { ChevronLeft, EyeOff, Eye } from "../../icons";
import Link from "next/link";
import React, { FormEvent, useState } from "react";

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;

  if (typeof error === "object" && error !== null) {
    const maybeApiError = (error as {
      error?: { message?: unknown };
      message?: unknown;
    });

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
  keepLoggedIn: boolean;
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
  forgotPasswordHref?: string;
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
  signUpHref = "/signup",
  hideSocialButtons = false,
  errorMessage,
  onSubmit,
}: SignInFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!onSubmit) return;

    setLocalError(null);
    setIsSubmitting(true);

    try {
      await onSubmit({
        identifier: identifier.trim(),
        password,
        keepLoggedIn: isChecked,
      });
    } catch (err) {
      setLocalError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const finalErrorMessage = errorMessage ?? localError;

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              {title}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
          </div>
          <div>
            {!hideSocialButtons ? (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5">
                  <button className="inline-flex items-center justify-center gap-3 py-3 text-sm font-normal text-gray-700 transition-colors bg-gray-100 rounded-lg px-7 hover:bg-gray-200 hover:text-gray-800 dark:bg-white/5 dark:text-white/90 dark:hover:bg-white/10">
                    Sign in with Google
                  </button>
                  <button className="inline-flex items-center justify-center gap-3 py-3 text-sm font-normal text-gray-700 transition-colors bg-gray-100 rounded-lg px-7 hover:bg-gray-200 hover:text-gray-800 dark:bg-white/5 dark:text-white/90 dark:hover:bg-white/10">
                    Sign in with X
                  </button>
                </div>
                <div className="relative py-3 sm:py-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="p-2 text-gray-400 bg-white dark:bg-gray-900 sm:px-5 sm:py-2">
                      Or
                    </span>
                  </div>
                </div>
              </>
            ) : null}
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <Label>
                    {identifierLabel} <span className="text-error-500">*</span>{" "}
                  </Label>
                  <Input
                    placeholder={identifierPlaceholder}
                    type={identifierType}
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                  />
                </div>
                <div className="mb-4">
                  <Label>
                    비밀번호 <span className="text-error-500">*</span>{" "}
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder={passwordPlaceholder}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <Eye className="dark:text-gray-400" />
                      ) : (
                        <EyeOff className="dark:text-gray-400" />
                      )}
                    </span>
                  </div>
                </div>
                {finalErrorMessage ? (
                  <div className="text-sm text-error-600 dark:text-error-400">{finalErrorMessage}</div>
                ) : null}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox checked={isChecked} onChange={setIsChecked} />
                    <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                      로그인 유지
                    </span>
                  </div>
                  <Link
                    href={forgotPasswordHref}
                    className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    비밀번호를 잊으셨나요?
                  </Link>
                </div>
                <div>
                  <Button className="w-full" size="sm" disabled={isSubmitting}>
                    {isSubmitting ? "로그인 중..." : submitText}
                  </Button>
                </div>
              </div>
            </form>

            {/*<div className="mt-5">*/}
            {/*  <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">*/}
            {/*    Don&apos;t have an account? {""}*/}
            {/*    <Link*/}
            {/*      href={signUpHref}*/}
            {/*      className="text-brand-500 hover:text-brand-600 dark:text-brand-400"*/}
            {/*    >*/}
            {/*      Sign Up*/}
            {/*    </Link>*/}
            {/*  </p>*/}
            {/*</div>*/}
          </div>
        </div>
      </div>
    </div>
  );
}
