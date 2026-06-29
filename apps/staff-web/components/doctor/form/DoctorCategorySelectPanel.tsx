"use client";

import React from "react";

import type { DoctorCategoryItem } from "@/lib/doctor/detail";
import { MAX_DOCTOR_CATEGORY_SELECTION } from "@/lib/doctor/form";
import { Card, ChevronDown, SpinnerBlock, X, type CategorySelectorItem } from "@beaulab/ui-admin";

const cardClassName = "rounded-xl border border-gray-200 bg-white p-5";
const formDropdownButtonClassName =
  "flex h-9 w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700";

export type DoctorCategoryOption = CategorySelectorItem & {
  domain?: string | null;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function CategorySelectPanel({
  selectedIds,
  selectedItems,
  options,
  isLoading,
  loadError,
  error,
  onToggleCategory,
}: {
  selectedIds: number[];
  selectedItems: DoctorCategoryItem[];
  options: DoctorCategoryOption[];
  isLoading: boolean;
  loadError: string | null;
  error?: string;
  onToggleCategory: (categoryId: number, checked: boolean) => void;
}) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const optionMap = React.useMemo(() => new Map(options.map((option) => [option.id, option])), [options]);
  const selectedItemMap = React.useMemo(() => new Map(selectedItems.map((item) => [item.id, item])), [selectedItems]);
  const selectedDisplayItems = selectedIds
    .map((categoryId) => optionMap.get(categoryId) ?? selectedItemMap.get(categoryId))
    .filter((item): item is DoctorCategoryOption | DoctorCategoryItem => Boolean(item));

  React.useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isOpen]);

  return (
    <Card className={cardClassName} data-field-target="category_ids" tabIndex={-1}>
      <div ref={containerRef} className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-gray-900">진료분야</h3>
          <span className="text-xs text-gray-500">
            선택 {selectedIds.length}/{MAX_DOCTOR_CATEGORY_SELECTION}
          </span>
        </div>

        <div className="min-h-20 rounded-xl border border-gray-200 bg-white p-2">
          {selectedDisplayItems.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {selectedDisplayItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onToggleCategory(item.id, false)}
                  className="inline-flex max-w-full items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-600"
                >
                  <span className="truncate">{item.name}</span>
                  <X className="size-3 shrink-0" />
                </button>
              ))}
            </div>
          ) : (
            <span className="px-1 py-2 text-sm text-gray-400">선택된 진료분야가 없습니다.</span>
          )}
        </div>

        <div className="relative">
          <button type="button" onClick={() => setIsOpen((prev) => !prev)} className={formDropdownButtonClassName}>
            전체
            <ChevronDown className="size-4 text-gray-500" />
          </button>

          {isOpen ? (
            <Card className="absolute left-0 right-0 top-full z-[80] mt-2 max-h-72 overflow-y-auto rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
              {isLoading ? (
                <div className="py-5">
                  <SpinnerBlock className="min-h-0" spinnerClassName="size-5" label="진료분야 불러오는 중" />
                </div>
              ) : loadError ? (
                <p className="px-3 py-4 text-sm text-error-500">{loadError}</p>
              ) : options.length === 0 ? (
                <p className="px-3 py-4 text-sm text-gray-500">선택 가능한 진료분야가 없습니다.</p>
              ) : (
                <div className="space-y-1">
                  {options.map((option) => {
                    const isSelected = selectedIds.includes(option.id);

                    return (
                      <button
                        key={`${option.domain ?? "category"}:${option.id}`}
                        type="button"
                        onClick={() => onToggleCategory(option.id, !isSelected)}
                        className={cx(
                          "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm",
                          isSelected ? "bg-brand-50 font-semibold text-brand-700" : "text-gray-700 hover:bg-gray-50",
                        )}
                      >
                        {option.name}
                        {isSelected ? <span className="text-xs">선택됨</span> : null}
                      </button>
                    );
                  })}
                </div>
              )}
            </Card>
          ) : null}
        </div>

        {error ? <p className="text-xs text-error-500">{error}</p> : null}
      </div>
    </Card>
  );
}
