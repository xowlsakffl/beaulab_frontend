"use client";

import React from "react";
import { DayPicker, type DateRange, type Locale } from "react-day-picker";
import { ko } from "react-day-picker/locale";
import { ChevronDown } from "../../../icons";
import { Button } from "../../ui/button/Button";
import { Card } from "../../ui/card/Card";

export type DatePresetOption = {
  key: string;
  label: string;
};

type DateRangeFilterDropdownProps = {
  label: string;
  value: string;
  placeholder: string;
  selected?: DateRange;
  isOpen: boolean;
  onToggleOpen: () => void;
  onSelect: (range?: DateRange) => void;
  onReset: () => void;
  onConfirm: () => void;
  onPresetSelect: (presetKey: string) => void;
  presetOptions: readonly DatePresetOption[];
  containerRef?: React.RefObject<HTMLDivElement | null>;
  locale?: Locale;
};

const filterFieldLabelClass = "mb-1 text-xs font-medium text-gray-500";
const filterTriggerClass =
  "flex h-11 w-full min-w-0 items-center justify-between rounded-lg border border-gray-300 px-3 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-300";

export function DateRangeFilterDropdown({
  label,
  value,
  placeholder,
  selected,
  isOpen,
  onToggleOpen,
  onSelect,
  onReset,
  onConfirm,
  onPresetSelect,
  presetOptions,
  containerRef,
  locale = ko,
}: DateRangeFilterDropdownProps) {
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
          <span className="min-w-0 flex-1 truncate text-left">{value || placeholder}</span>
          <ChevronDown className="size-4" />
        </Button>
        {isOpen ? (
          <Card className="absolute left-0 z-20 mt-1 max-w-[calc(100vw-2rem)] rounded-lg p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800 sm:left-auto sm:right-0">
            <div className="mb-3 flex flex-wrap gap-2 border-b border-gray-100 pb-3 dark:border-white/[0.06]">
              {presetOptions.map((preset) => (
                <Button
                  key={preset.key}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onPresetSelect(preset.key)}
                  className="h-8 px-3 text-xs"
                >
                  {preset.label}
                </Button>
              ))}
            </div>
            <DayPicker mode="range" selected={selected} locale={locale} onSelect={onSelect} />
            <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-white/[0.06]">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onReset}
                disabled={!selected?.from && !selected?.to}
                className="h-8 px-3 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-300"
              >
                초기화
              </Button>
              <Button type="button" variant="brand" size="sm" onClick={onConfirm} className="h-8 px-3 text-xs">
                확인
              </Button>
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

export default DateRangeFilterDropdown;
