"use client";

import React, { useId, useState } from "react";
import { twMerge } from "tailwind-merge";
import { ChevronDown } from "../../icons";

interface Option {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<
  React.ComponentPropsWithRef<"select">,
  "onChange" | "value" | "defaultValue" | "multiple" | "size" | "children"
> {
  options: Option[];
  id?: string;
  name?: string;
  placeholder?: string;
  showPlaceholderOption?: boolean;
  onChange: (value: string) => void;
  className?: string;
  defaultValue?: string;
  value?: string;
  disabled?: boolean;
  error?: boolean;
  hint?: string;
}

export const Select: React.FC<SelectProps> = ({
  options,
  id,
  name,
  placeholder = "선택",
  showPlaceholderOption = true,
  onChange,
  className = "",
  defaultValue = "",
  value,
  disabled = false,
  error = false,
  hint,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  ...props
}) => {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = `${inputId}-hint`;
  const [uncontrolledValue, setUncontrolledValue] = useState<string>(defaultValue);
  const selectedValue = value ?? uncontrolledValue;
  const hasSelectedOption = options.some((option) => option.value === selectedValue);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextValue = e.target.value;

    if (value === undefined) {
      setUncontrolledValue(nextValue);
    }

    onChange(nextValue);
  };

  return (
    <div className="relative">
      <select
        {...props}
        id={inputId}
        aria-invalid={error || ariaInvalid}
        aria-describedby={[ariaDescribedBy, hint ? hintId : undefined].filter(Boolean).join(" ") || undefined}
        name={name}
        className={twMerge(
          "w-full cursor-pointer appearance-none rounded-lg border border-gray-300 bg-white px-4 pr-10 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 focus:outline-hidden",
          hasSelectedOption ? "text-gray-800" : "text-gray-400",
          disabled ? "cursor-not-allowed opacity-60" : undefined,
          error ? "border-error-500 focus:border-error-500 focus:ring-error-500/10" : undefined,
          className,
          "h-11",
        )}
        value={selectedValue}
        onChange={handleChange}
        disabled={disabled}
      >
        {showPlaceholderOption && (
          <option value="" disabled className="text-gray-700">
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value} className="text-gray-700">
            {option.label}
          </option>
        ))}
      </select>

      <span className="pointer-events-none absolute top-5.5 right-3 -translate-y-1/2 text-gray-500" aria-hidden="true">
        <ChevronDown className="size-4" />
      </span>
      {hint ? (
        <p id={hintId} className={`mt-1.5 text-xs ${error ? "text-error-500" : "text-gray-500"}`}>
          {hint}
        </p>
      ) : null}
    </div>
  );
};

export default Select;
