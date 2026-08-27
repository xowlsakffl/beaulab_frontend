"use client";

import type { HTMLAttributes } from "react";

import {
  Card,
  ChartNoAxesColumnIncreasing,
  getBadgeColorClassName,
  type BadgeColor,
  type LucideIcon,
} from "@beaulab/ui-admin";

type SummaryCountCardLayout = "horizontal" | "center";

type SummaryCountCardProps = {
  label: string;
  value: number | string;
  unit?: string;
  icon?: LucideIcon;
  iconColor?: BadgeColor;
  layout?: SummaryCountCardLayout;
  className?: string;
  labelClassName?: string;
  loading?: boolean;
  pressed?: boolean;
  onClick?: () => void;
};

function formatSummaryValue(value: number | string) {
  return typeof value === "number" ? value.toLocaleString() : value;
}

export function SummaryCountCard({
  label,
  value,
  unit,
  icon: Icon = ChartNoAxesColumnIncreasing,
  iconColor = "primary",
  layout = "horizontal",
  className,
  labelClassName,
  loading = false,
  pressed,
  onClick,
}: SummaryCountCardProps) {
  const displayValue = formatSummaryValue(value);
  const summaryLabelClassName =
    labelClassName ?? (layout === "center" ? "text-sm font-medium text-gray-700" : "text-sm font-medium text-gray-600");

  if (layout === "center") {
    const centerClassName = onClick
      ? `rounded-lg border px-4 py-3 text-center transition-colors ${
          pressed ? "border-brand-300 bg-brand-50" : "border-gray-300 hover:border-brand-300 hover:bg-brand-50"
        }`
      : "rounded-lg border border-gray-300 px-4 py-3 text-center";

    if (onClick) {
      return (
        <button type="button" onClick={onClick} aria-pressed={pressed} className={centerClassName}>
          <p className={summaryLabelClassName}>{label}</p>
          <p className="mt-1 text-base font-semibold text-gray-900">
            {displayValue}
            {unit}
          </p>
        </button>
      );
    }

    return (
      <div className={centerClassName}>
        <p className={summaryLabelClassName}>{label}</p>
        <p className="mt-1 text-base font-semibold text-gray-900">
          {displayValue}
          {unit}
        </p>
      </div>
    );
  }

  const horizontalClassName = className ?? "min-h-20 px-4 py-3";
  const horizontalContent = (
    <div className="flex w-full min-w-0 items-center gap-3">
      <span
        className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${getBadgeColorClassName(iconColor)}`}
      >
        <Icon aria-hidden="true" className="size-5" strokeWidth={1.8} />
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block truncate ${summaryLabelClassName}`} title={label}>
          {label}
        </span>
        <span className="mt-1 flex min-h-6 items-end gap-1.5">
          {loading ? (
            <span className="h-6 w-12 animate-pulse rounded bg-gray-100" />
          ) : (
            <>
              <strong className="text-xl leading-none font-semibold text-gray-900">{displayValue}</strong>
              {unit ? <span className="pb-0.5 text-xs font-medium text-gray-500">{unit}</span> : null}
            </>
          )}
        </span>
      </span>
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={pressed}
        className={`flex w-full items-center rounded-lg border text-left transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 focus-visible:outline-none ${
          pressed
            ? "border-brand-300 bg-brand-50"
            : "border-gray-200 bg-white hover:border-brand-300 hover:bg-brand-50/30"
        } ${horizontalClassName}`}
      >
        {horizontalContent}
      </button>
    );
  }

  return (
    <Card className={`flex items-center rounded-lg border border-gray-200 bg-white ${horizontalClassName}`}>
      {horizontalContent}
    </Card>
  );
}

export function SummaryCardsGrid({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={`grid min-w-0 gap-3 ${className ?? ""}`} {...props} />;
}
