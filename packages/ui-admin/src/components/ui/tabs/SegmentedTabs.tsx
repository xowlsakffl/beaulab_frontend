"use client";

import * as React from "react";
import { cn } from "../../../lib/utils";

export type SegmentedTabItem<T extends string = string> = {
  value: T;
  label: React.ReactNode;
  disabled?: boolean;
  isInvalid?: boolean;
};

export type SegmentedTabsVariant = "segmented" | "buttons";

type SegmentedTabsProps<T extends string = string> = {
  variant?: SegmentedTabsVariant;
  items: readonly SegmentedTabItem<T>[];
  value?: T;
  onValueChange: (value: T) => void;
  columns?: number;
  className?: string;
  listClassName?: string;
  tabClassName?: string;
  activeTabClassName?: string;
  inactiveTabClassName?: string;
};

export function SegmentedTabs<T extends string = string>({
  variant = "segmented",
  items,
  value,
  onValueChange,
  columns,
  className,
  listClassName,
  tabClassName,
  activeTabClassName,
  inactiveTabClassName,
}: SegmentedTabsProps<T>) {
  if (items.length === 0) {
    return null;
  }

  const gridColumns = Math.max(columns ?? items.length, 1);

  return (
    <div
      role="tablist"
      className={cn(
        "grid",
        variant === "buttons" ? "gap-2" : "gap-1 rounded-xl bg-gray-100 p-1",
        className,
        listClassName,
      )}
      style={{ gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))` }}
    >
      {items.map((item) => {
        const isActive = item.value === value;

        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-disabled={item.disabled}
            disabled={item.disabled}
            onClick={() => onValueChange(item.value)}
            className={cn(
              "w-full rounded-lg px-4 py-2 text-sm font-medium transition",
              variant === "buttons"
                ? isActive
                  ? "bg-brand-500 text-white hover:bg-brand-600"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                : isActive
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-800",
              "focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 focus-visible:outline-none",
              item.isInvalid && "ring-1 ring-error-500/60",
              item.disabled && "cursor-not-allowed opacity-60",
              tabClassName,
              isActive ? activeTabClassName : inactiveTabClassName,
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedTabs;
