"use client";

import * as React from "react";
import { cn } from "../../../lib/utils";

type SpinnerProps = {
  className?: string;
  label?: string;
};

type SpinnerBlockProps = {
  className?: string;
  spinnerClassName?: string;
  label?: string;
};

export function Spinner({ className, label = "로딩 중" }: SpinnerProps) {
  return (
    <span className="inline-flex items-center justify-center" role="status" aria-live="polite">
      <svg
        className={cn("size-4 animate-spin text-gray-400 dark:text-gray-500", className)}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
      >
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="4" />
        <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" />
      </svg>
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function SpinnerBlock({ className, spinnerClassName, label = "로딩 중" }: SpinnerBlockProps) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <Spinner className={cn("size-6 text-brand-500 dark:text-brand-400", spinnerClassName)} label={label} />
    </div>
  );
}

export default Spinner;
