"use client";

import React from "react";

import type { DoctorCategoryItem } from "@/lib/doctor/detail";
import { groupMedicalCategorySelectorItems } from "@/lib/common/category";
import { MAX_DOCTOR_CATEGORY_SELECTION } from "@/lib/doctor/form";
import { Card, ChevronDown, SpinnerBlock, X, type CategorySelectorItem } from "@beaulab/ui-admin";

const cardClassName = "rounded-xl border border-gray-200 bg-white p-5";
const formDropdownButtonClassName =
  "flex h-11 w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700";

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
  const groupedOptions = React.useMemo(() => groupMedicalCategorySelectorItems(options), [options]);
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
            <Card className="absolute top-full right-0 left-0 z-[80] mt-2 max-h-72 overflow-y-auto rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
              {isLoading ? (
                <div className="py-5">
                  <SpinnerBlock className="min-h-0" spinnerClassName="size-5" label="진료분야 불러오는 중" />
                </div>
              ) : loadError ? (
                <p className="px-3 py-4 text-sm text-error-500">{loadError}</p>
              ) : options.length === 0 ? (
                <p className="px-3 py-4 text-sm text-gray-500">선택 가능한 진료분야가 없습니다.</p>
              ) : (
                <div className="space-y-3">
                  {groupedOptions.map((group) => (
                    <div
                      key={group.key}
                      className="space-y-1.5 border-t border-dashed border-gray-200 pt-2 first:border-t-0 first:pt-0"
                    >
                      <p className="px-3 py-1 text-[11px] font-bold text-brand-500">{group.label}</p>
                      {group.items.map((option) => {
                        const isSelected = selectedIds.includes(option.id);

                        return (
                          <button
                            key={`${option.domain ?? "category"}:${option.id}`}
                            type="button"
                            onClick={() => onToggleCategory(option.id, !isSelected)}
                            className={cx(
                              "flex h-11 w-full items-center justify-between rounded-lg border border-transparent px-4 text-left text-sm transition",
                              isSelected
                                ? "border-brand-200 bg-brand-50 font-semibold text-brand-700"
                                : "text-gray-700 hover:border-gray-200 hover:bg-gray-50",
                            )}
                          >
                            {option.name}
                            {isSelected ? <span className="text-xs font-semibold text-brand-500">선택됨</span> : null}
                          </button>
                        );
                      })}
                    </div>
                  ))}
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
