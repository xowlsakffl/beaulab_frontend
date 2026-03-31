"use client";

import React from "react";
import { ChevronDown } from "../../../icons";
import { Button } from "../../ui/button/Button";
import { Card } from "../../ui/card/Card";
import Checkbox from "../input/Checkbox";

export type CheckboxFilterOption = {
  value: string;
  label: string;
};

type CheckboxFilterDropdownProps = {
  label: string;
  selectedValues: string[];
  options: CheckboxFilterOption[];
  isOpen: boolean;
  onToggleOpen: () => void;
  onToggleValue: (value: string) => void;
  onToggleAll: () => void;
  containerRef?: React.RefObject<HTMLDivElement | null>;
  emptyLabel?: string;
  allLabel?: string;
  allSelectedText?: string;
  selectedText?: (count: number) => string;
};

const filterFieldLabelClass = "mb-1 text-xs font-medium text-gray-500";
const filterTriggerClass =
  "flex h-11 w-full min-w-0 items-center justify-between rounded-lg border border-gray-300 px-3 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-300";

export function CheckboxFilterDropdown({
  label,
  selectedValues,
  options,
  isOpen,
  onToggleOpen,
  onToggleValue,
  onToggleAll,
  containerRef,
  emptyLabel = "전체",
  allLabel = "전체",
  allSelectedText = "전체",
  selectedText,
}: CheckboxFilterDropdownProps) {
  const selectedCount = selectedValues.length;
  const selectedValueSet = React.useMemo(() => new Set(selectedValues), [selectedValues]);
  const selectedLabels = React.useMemo(
    () => options.filter((option) => selectedValueSet.has(option.value)).map((option) => option.label),
    [options, selectedValueSet],
  );
  const isAllSelected = options.length > 0 && selectedLabels.length === options.length;
  const resolvedSelectedText = React.useMemo(() => {
    if (isAllSelected) return allSelectedText;
    if (selectedLabels.length > 0) return selectedLabels.join(", ");
    if (selectedText) return selectedText(selectedCount);

    return `${selectedCount}개 선택`;
  }, [allSelectedText, isAllSelected, selectedCount, selectedLabels, selectedText]);

  return (
    <div className="min-w-0 w-full">
      <p className={filterFieldLabelClass}>{label}</p>
      <div ref={containerRef} className="relative">
        <Button
          type="button"
          variant="outline"
          size="default"
          onClick={onToggleOpen}
          className={filterTriggerClass}
        >
          <span className="min-w-0 flex-1 truncate text-left">
            {selectedCount > 0 ? resolvedSelectedText : emptyLabel}
          </span>
          <ChevronDown className="size-4" />
        </Button>

        {isOpen ? (
          <Card className="absolute z-20 mt-1 w-full rounded-lg p-2 shadow-lg dark:border-gray-700 dark:bg-gray-800">
            <div className="px-1 py-1 text-sm">
              <Checkbox label={allLabel} checked={isAllSelected} onChange={onToggleAll} />
            </div>
            {options.map((option) => (
              <div key={option.value} className="px-1 py-1 text-sm">
                <Checkbox
                  label={option.label}
                  checked={selectedValues.includes(option.value)}
                  onChange={() => onToggleValue(option.value)}
                />
              </div>
            ))}
          </Card>
        ) : null}
      </div>
    </div>
  );
}

export default CheckboxFilterDropdown;
