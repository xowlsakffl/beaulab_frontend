"use client";

import { Card } from "@beaulab/ui-admin";

type SummaryCountCardLayout = "horizontal" | "center";

type SummaryCountCardProps = {
  label: string;
  value: number | string;
  unit?: string;
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
  layout = "horizontal",
  className,
  labelClassName,
  loading = false,
  pressed,
  onClick,
}: SummaryCountCardProps) {
  const displayValue = formatSummaryValue(value);
  const summaryLabelClassName =
    labelClassName ?? (layout === "center" ? "text-sm font-medium text-gray-700" : "text-sm font-semibold text-gray-700");

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

  const horizontalClassName = className ?? "min-h-20 rounded-lg px-5 py-4";
  const horizontalContent = (
    <div className="flex w-full items-center justify-between gap-4">
      <span className={summaryLabelClassName}>{label}</span>
      <span className="flex min-h-7 shrink-0 items-center justify-end gap-1.5">
        {loading ? (
          <span className="h-6 w-12 animate-pulse rounded bg-gray-100" />
        ) : (
          <>
            <strong className="text-xl font-semibold leading-none text-gray-950">{displayValue}</strong>
            {unit ? <span className="text-xs font-medium text-gray-500">{unit}</span> : null}
          </>
        )}
      </span>
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={pressed}
        className={`flex w-full items-center border text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 ${
          pressed ? "border-brand-300 bg-brand-50" : "border-gray-200 bg-white hover:border-brand-300 hover:bg-gray-50"
        } ${horizontalClassName}`}
      >
        {horizontalContent}
      </button>
    );
  }

  return <Card className={`flex items-center border border-gray-200 bg-white ${horizontalClassName}`}>{horizontalContent}</Card>;
}
