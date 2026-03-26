"use client";

import type React from "react";

type FormSettingToggleRowProps = {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  children?: React.ReactNode;
  isLast?: boolean;
  className?: string;
  disabled?: boolean;
};

export function FormSettingToggleRow({
  title,
  description,
  checked,
  onChange,
  children,
  isLast = false,
  className = "",
  disabled = false,
}: FormSettingToggleRowProps) {
  return (
    <div
      className={[
        "px-4 py-4",
        !isLast ? "border-b border-gray-200 dark:border-gray-800" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-semibold text-gray-800 dark:text-white/90">{title}</p>
          <p className="text-xs leading-5 text-gray-500 dark:text-gray-400">{description}</p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={checked}
          onClick={() => {
            if (disabled) return;
            onChange(!checked);
          }}
          disabled={disabled}
          className={[
            "relative mt-0.5 inline-flex h-7 w-12 shrink-0 rounded-full transition-colors",
            disabled
              ? "cursor-not-allowed bg-gray-200 dark:bg-gray-700"
              : checked
                ? "bg-brand-500"
                : "bg-gray-200 dark:bg-gray-700",
          ].join(" ")}
        >
          <span
            className={[
              "absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
              checked ? "translate-x-6" : "translate-x-1",
            ].join(" ")}
          />
        </button>
      </div>

      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}

export default FormSettingToggleRow;
