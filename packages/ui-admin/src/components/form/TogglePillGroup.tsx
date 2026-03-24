"use client";

import React from "react";

import { cn } from "../../lib/utils";

export type TogglePillOption = {
  value: string | number;
  label: string;
  disabled?: boolean;
};

type TogglePillGroupProps = {
  options: readonly TogglePillOption[];
  selectedValues: readonly (string | number)[];
  onToggle: (value: string | number, checked: boolean) => void;
  size?: "sm" | "md";
  className?: string;
  optionClassName?: string;
};

const sizeClassNames = {
  sm: "min-h-8 px-3 py-1.5 text-xs",
  md: "min-h-9 px-4 py-2 text-sm",
} as const;

export function TogglePillGroup({
  options,
  selectedValues,
  onToggle,
  size = "sm",
  className,
  optionClassName,
}: TogglePillGroupProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map((option) => {
        const isSelected = selectedValues.includes(option.value);

        return (
          <button
            key={String(option.value)}
            type="button"
            disabled={option.disabled}
            aria-pressed={isSelected}
            onClick={() => onToggle(option.value, !isSelected)}
            className={cn(
              "inline-flex items-center rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
              sizeClassNames[size],
              isSelected
                ? "bg-brand-50 text-brand-700 hover:bg-brand-100 focus-visible:ring-brand-300 dark:bg-brand-500/10 dark:text-brand-300 dark:hover:bg-brand-500/20"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 focus-visible:ring-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700",
              optionClassName,
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export default TogglePillGroup;
