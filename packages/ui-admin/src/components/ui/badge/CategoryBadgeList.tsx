import type { ReactNode } from "react";

import { cn } from "../../../lib/utils";

export type CategoryBadgeListProps = {
  values: Array<string | null | undefined>;
  empty?: ReactNode;
  title?: string;
  className?: string;
};

export function normalizeCategoryBadgeValues(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(
      values
        .flatMap((value) => (value ?? "").split("\n"))
        .map((value) => value.trim())
        .filter((value) => value !== "" && value !== "-"),
    ),
  );
}

export function CategoryBadgeList({
  values,
  empty = "-",
  title,
  className,
}: CategoryBadgeListProps) {
  const normalizedValues = normalizeCategoryBadgeValues(values);

  if (normalizedValues.length === 0) {
    return empty;
  }

  return (
    <div className={cn("flex min-w-0 flex-wrap gap-1.5", className)} title={title}>
      {normalizedValues.map((value) => (
        <span
          key={value}
          className="inline-flex max-w-full rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-600"
          title={value}
        >
          <span className="truncate">{value}</span>
        </span>
      ))}
    </div>
  );
}
