"use client";

import * as React from "react";
import { cn } from "../../../lib/utils";

export type SegmentedTabItem<T extends string = string> = {
  value: T;
  label: React.ReactNode;
  disabled?: boolean;
  isInvalid?: boolean;
};

type SegmentedTabsProps<T extends string = string> = {
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
      className={cn("grid gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-900", className, listClassName)}
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
              isActive
                ? "bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-white"
                : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white",
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
