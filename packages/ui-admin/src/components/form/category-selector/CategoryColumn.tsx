"use client";

import React from "react";

import { Check, ChevronRight } from "../../../icons";
import { Card } from "../../ui/card/Card";
import { SpinnerBlock } from "../../ui/spinner/Spinner";
import type { CategorySelectorItem } from "./HierarchicalCategorySelector";

type CategoryColumnProps = {
  title: string;
  items: CategorySelectorItem[];
  activeId?: number;
  selectedIdSet: ReadonlySet<number>;
  emptyMessage: string;
  isLoading?: boolean;
  loadingText: string;
  selectionMode: "checkbox" | "leaf-click";
  columnHeightClassName?: string;
  compact?: boolean;
  onActivate: (category: CategorySelectorItem) => void;
  onToggle: (category: CategorySelectorItem, checked: boolean) => void;
};

export const CategoryColumn = React.memo(function CategoryColumn({
  title,
  items,
  activeId,
  selectedIdSet,
  emptyMessage,
  isLoading = false,
  loadingText,
  selectionMode,
  columnHeightClassName = "h-[320px]",
  compact = false,
  onActivate,
  onToggle,
}: CategoryColumnProps) {
  return (
    <Card className={`flex flex-col ${compact ? "p-2" : "p-2.5"} ${columnHeightClassName}`}>
      <p className={`${compact ? "mb-1.5" : "mb-2"} text-xs font-semibold text-gray-500`}>{title}</p>

      {isLoading ? (
        <SpinnerBlock className="min-h-0 flex-1" spinnerClassName="size-5" label={loadingText} />
      ) : items.length > 0 ? (
        <div className={`flex-1 ${compact ? "space-y-0.5" : "space-y-1"} overflow-y-auto pr-1`}>
          {items.map((item) => {
            const isActive = activeId === item.id;
            const isSelected = selectedIdSet.has(item.id);
            const isLeafClickMode = selectionMode === "leaf-click";
            const isLeaf = !item.has_children;
            const rowClick = () => {
              if (isLeafClickMode && isLeaf) {
                onToggle(item, !isSelected);
                return;
              }

              onActivate(item);
            };

            return (
              <button
                key={item.id}
                type="button"
                onClick={rowClick}
                className={`flex w-full items-center gap-2 rounded-lg border px-2 ${compact ? "py-0.5" : "py-1"} text-left ${
                  isActive
                    ? "border-brand-200 bg-brand-50/70"
                    : isSelected
                      ? "border-brand-200 bg-brand-50 text-brand-700"
                      : "border-transparent hover:border-gray-200 hover:bg-gray-50"
                }`}
              >
                {selectionMode === "checkbox" ? (
                  <span
                    role="checkbox"
                    aria-checked={isSelected}
                    tabIndex={-1}
                    onClick={(event) => {
                      event.stopPropagation();
                      onToggle(item, !isSelected);
                    }}
                    className={`flex size-6 shrink-0 items-center justify-center rounded-md border ${
                      isSelected
                        ? "border-brand-500 bg-brand-500 text-white"
                        : "border-gray-300 bg-white text-transparent"
                    }`}
                    aria-label={isSelected ? `${item.name} 선택 해제` : `${item.name} 선택`}
                  >
                    <Check className="size-3.5" />
                  </span>
                ) : null}

                <span className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-lg py-1">
                  <span
                    className={`min-w-0 break-keep ${compact ? "text-xs" : "text-sm"} ${
                      isSelected ? "font-semibold text-brand-700" : "text-gray-700"
                    }`}
                  >
                    {item.name}
                  </span>
                  {item.has_children ? (
                    <ChevronRight className={`size-4 shrink-0 ${isActive ? "text-brand-500" : "text-gray-300"}`} />
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div
          className={`flex min-h-0 flex-1 items-center justify-center text-center ${compact ? "text-xs" : "text-sm"} text-gray-400`}
        >
          {emptyMessage}
        </div>
      )}
    </Card>
  );
});
