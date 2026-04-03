"use client";

import React from "react";
import { DayFlag, DayPicker, SelectionState, UI, getDefaultClassNames, type DateRange, type Locale } from "react-day-picker";
import { ko } from "react-day-picker/locale";
import { ChevronDown } from "../../../icons";
import { cn } from "../../../lib/utils";
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
  hideLabel?: boolean;
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
  hideLabel = false,
}: DateRangeFilterDropdownProps) {
  const defaultClassNames = React.useMemo(() => getDefaultClassNames(), []);
  const dayPickerClassNames = React.useMemo(
    () => ({
      ...defaultClassNames,
      [UI.Chevron]: cn(defaultClassNames[UI.Chevron], "fill-brand-500 dark:fill-brand-400"),
      [UI.NextMonthButton]: cn(
        defaultClassNames[UI.NextMonthButton],
        "rounded-md text-brand-500 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10",
      ),
      [UI.PreviousMonthButton]: cn(
        defaultClassNames[UI.PreviousMonthButton],
        "rounded-md text-brand-500 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10",
      ),
      [UI.DayButton]: cn(
        defaultClassNames[UI.DayButton],
        "transition-colors hover:bg-brand-50 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 dark:hover:bg-brand-500/10 dark:hover:text-brand-100",
      ),
      [UI.CaptionLabel]: cn(defaultClassNames[UI.CaptionLabel], "font-semibold text-gray-800 dark:text-white/90"),
      [UI.Weekday]: cn(defaultClassNames[UI.Weekday], "text-gray-500 dark:text-gray-400"),
      [DayFlag.today]: cn(defaultClassNames[DayFlag.today], "text-brand-600 dark:text-brand-400"),
      [SelectionState.selected]: cn(defaultClassNames[SelectionState.selected], "text-brand-700 dark:text-brand-100"),
      [SelectionState.range_middle]: cn(defaultClassNames[SelectionState.range_middle], "bg-brand-50 dark:bg-brand-500/10"),
    }),
    [defaultClassNames],
  );
  const dayPickerStyles = React.useMemo(
    () =>
      ({
        "--rdp-accent-color": "var(--color-brand-500)",
        "--rdp-accent-background-color": "var(--color-brand-50)",
        "--rdp-selected-border": "2px solid var(--color-brand-500)",
        "--rdp-today-color": "var(--color-brand-600)",
        "--rdp-range_middle-background-color": "var(--color-brand-50)",
        "--rdp-range_middle-color": "var(--color-brand-700)",
        "--rdp-range_start-date-background-color": "var(--color-brand-500)",
        "--rdp-range_end-date-background-color": "var(--color-brand-500)",
      }) as React.CSSProperties,
    [],
  );

  return (
    <div className="min-w-0 w-full">
      {!hideLabel ? <p className={filterFieldLabelClass}>{label}</p> : null}
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
            <DayPicker
              mode="range"
              selected={selected}
              locale={locale}
              onSelect={onSelect}
              classNames={dayPickerClassNames}
              style={dayPickerStyles}
            />
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
