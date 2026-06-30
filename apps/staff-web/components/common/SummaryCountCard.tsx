"use client";

import type { ReactNode } from "react";

import { Card } from "@beaulab/ui-admin";

type SummaryCountCardLayout = "horizontal" | "center";

type SummaryCountCardProps = {
  label: string;
  value: number | string;
  unit?: string;
  layout?: SummaryCountCardLayout;
  className?: string;
  pressed?: boolean;
  onClick?: () => void;
};

function formatSummaryValue(value: number | string, unit?: string): ReactNode {
  const formatted = typeof value === "number" ? value.toLocaleString() : value;

  return unit ? `${formatted}${unit}` : formatted;
}

export function SummaryCountCard({
  label,
  value,
  unit,
  layout = "horizontal",
  className,
  pressed,
  onClick,
}: SummaryCountCardProps) {
  const displayValue = formatSummaryValue(value, unit);

  if (layout === "center") {
    const centerClassName = onClick
      ? "rounded-lg border border-gray-300 px-4 py-3 text-center transition-colors hover:border-brand-300 hover:bg-brand-50"
      : "rounded-lg border border-gray-300 px-4 py-3 text-center";

    if (onClick) {
      return (
        <button type="button" onClick={onClick} aria-pressed={pressed} className={centerClassName}>
          <p className="text-sm font-medium text-gray-700">{label}</p>
          <p className="mt-1 text-base font-semibold text-gray-900">{displayValue}</p>
        </button>
      );
    }

    return (
      <div className={centerClassName}>
        <p className="text-sm font-medium text-gray-700">{label}</p>
        <p className="mt-1 text-base font-semibold text-gray-900">{displayValue}</p>
      </div>
    );
  }

  const horizontalClassName = className ?? "rounded-xl bg-white px-5 py-4";

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={pressed}
        className={`w-full border border-gray-200 text-left transition-colors hover:border-brand-300 hover:bg-brand-50 ${horizontalClassName}`}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <span className="text-base font-semibold text-gray-900">{displayValue}</span>
        </div>
      </button>
    );
  }

  return (
    <Card className={horizontalClassName}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-base font-semibold text-gray-900">{displayValue}</span>
      </div>
    </Card>
  );
}
