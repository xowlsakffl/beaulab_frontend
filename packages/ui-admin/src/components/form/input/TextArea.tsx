"use client";

import React, { useId } from "react";
import { twMerge } from "tailwind-merge";

export interface TextareaProps extends Omit<React.ComponentPropsWithRef<"textarea">, "onChange" | "value"> {
  id?: string;
  name?: string;
  placeholder?: string; // Placeholder text
  rows?: number; // Number of rows
  value?: string; // Current value
  onChange?: (value: string) => void; // Change handler
  className?: string; // Additional CSS classes
  disabled?: boolean; // Disabled state
  error?: boolean; // Error state
  hint?: string; // Hint text to display
}

const TextArea: React.FC<TextareaProps> = ({
  id,
  name,
  placeholder = "Enter your message", // Default placeholder
  rows = 3, // Default number of rows
  value,
  onChange, // Callback for changes
  className = "", // Additional custom styles
  disabled = false, // Disabled state
  error = false, // Error state
  hint = "", // Default hint text
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  ...props
}) => {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = `${inputId}-hint`;
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  const textareaClasses = twMerge(
    "w-full rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3    ",
    disabled
      ? "border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed   "
      : error
        ? "border-error-500 bg-transparent text-error-800 focus:ring-error-500/10  "
        : "border-gray-300 bg-transparent text-gray-800 focus:border-brand-300 focus:ring-brand-500/10    ",
    className,
  );

  return (
    <div className="relative">
      <textarea
        {...props}
        id={inputId}
        aria-invalid={error || ariaInvalid}
        aria-describedby={[ariaDescribedBy, hint ? hintId : undefined].filter(Boolean).join(" ") || undefined}
        name={name}
        placeholder={placeholder}
        rows={rows}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        className={textareaClasses}
      />
      {hint && (
        <p id={hintId} className={`mt-1.5 text-xs ${error ? "text-error-500" : "text-gray-500"}`}>
          {hint}
        </p>
      )}
    </div>
  );
};

export default TextArea;
