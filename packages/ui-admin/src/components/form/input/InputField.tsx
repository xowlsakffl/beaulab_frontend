"use client";

import React, { FC } from "react";
import { twMerge } from "tailwind-merge";

interface InputProps {
  type?: "text" | "number" | "email" | "password" | "date" | "time" | string;
  id?: string;
  name?: string;
  placeholder?: string;
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClick?: (e: React.MouseEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  readOnly?: boolean;
  className?: string;
  min?: string;
  max?: string;
  step?: number;
  disabled?: boolean;
  success?: boolean;
  error?: boolean;
  hint?: string;
}

export const InputField: FC<InputProps> = ({
  type = "text",
  id,
  name,
  placeholder,
  value,
  defaultValue,
  onChange,
  onClick,
  onKeyDown,
  readOnly = false,
  className = "",
  min,
  max,
  step,
  disabled = false,
  success = false,
  error = false,
  hint,
}) => {
  const inputClasses = twMerge(
    "h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800",
    disabled
      ? "text-gray-500 border-gray-300 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
      : error
        ? "text-error-800 border-error-500 focus:ring-3 focus:ring-error-500/10 dark:text-error-400 dark:border-error-500"
        : success
          ? "text-success-500 border-success-400 focus:ring-success-500/10 focus:border-success-300 dark:text-success-400 dark:border-success-500"
          : "bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800",
    readOnly && !disabled ? "cursor-default" : undefined,
    className
  );

  return (
    <div className="relative">
      <input
        type={type}
        id={id}
        name={name}
        placeholder={placeholder}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        onClick={onClick}
        onKeyDown={onKeyDown}
        readOnly={readOnly}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className={inputClasses}
      />

      {hint && (
        <p className={`mt-1.5 text-xs ${error ? "text-error-500" : success ? "text-success-500" : "text-gray-500"}`}>
          {hint}
        </p>
      )}
    </div>
  );
};

export default InputField;
