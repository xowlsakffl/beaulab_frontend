"use client";

import React from "react";
import { createPortal } from "react-dom";
import {
  DayFlag,
  DayPicker,
  SelectionState,
  UI,
  getDefaultClassNames,
  type DateRange,
  type Locale,
} from "react-day-picker";
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
  onSelect: (range?: DateRange, selectedDay?: Date) => void;
  onReset: () => void;
  onConfirm: () => void;
  onPresetSelect: (presetKey: string) => void;
  presetOptions: readonly DatePresetOption[];
  containerRef?: React.RefObject<HTMLDivElement | null>;
  locale?: Locale;
  hideLabel?: boolean;
  error?: boolean;
  triggerClassName?: string;
};

const filterFieldLabelClass = "mb-1 text-xs font-medium text-gray-500";
const filterTriggerClass =
  "flex h-11 w-full min-w-0 items-center justify-between rounded-lg border border-gray-300 px-4 text-sm text-gray-700";

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
  error = false,
  triggerClassName,
}: DateRangeFilterDropdownProps) {
  const defaultClassNames = React.useMemo(() => getDefaultClassNames(), []);
  const triggerContainerRef = React.useRef<HTMLDivElement | null>(null);
  const popupRef = React.useRef<HTMLDivElement | null>(null);
  const [popupStyle, setPopupStyle] = React.useState<React.CSSProperties | undefined>(undefined);
  const [isPopupPositioned, setIsPopupPositioned] = React.useState(false);
  const setTriggerContainerRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      triggerContainerRef.current = node;

      if (containerRef) {
        (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }
    },
    [containerRef],
  );
  const updatePopupPosition = React.useCallback(() => {
    const trigger = triggerContainerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const margin = 16;
    const popupWidth = popupRef.current?.offsetWidth ?? 360;
    const popupHeight = popupRef.current?.scrollHeight ?? popupRef.current?.offsetHeight ?? 520;
    const maxPopupHeight = Math.max(240, window.innerHeight - margin * 2);
    const renderedPopupHeight = Math.min(popupHeight, maxPopupHeight);
    const left = Math.min(
      Math.max(margin, rect.right - popupWidth),
      Math.max(margin, window.innerWidth - popupWidth - margin),
    );
    const belowTop = rect.bottom + 4;
    const fitsBelow = belowTop + renderedPopupHeight <= window.innerHeight - margin;
    const top = fitsBelow ? belowTop : Math.max(margin, rect.top - renderedPopupHeight - 4);

    setPopupStyle({
      position: "fixed",
      top,
      left,
      zIndex: 100002,
      maxWidth: `calc(100vw - ${margin * 2}px)`,
      maxHeight: maxPopupHeight,
      overflowY: "auto",
    });
    setIsPopupPositioned(true);
  }, []);
  const dayPickerClassNames = React.useMemo(
    () => ({
      ...defaultClassNames,
      [UI.Chevron]: cn(defaultClassNames[UI.Chevron], "fill-brand-500 "),
      [UI.NextMonthButton]: cn(defaultClassNames[UI.NextMonthButton], "rounded-md text-brand-500 hover:bg-brand-50  "),
      [UI.PreviousMonthButton]: cn(
        defaultClassNames[UI.PreviousMonthButton],
        "rounded-md text-brand-500 hover:bg-brand-50  ",
      ),
      [UI.DayButton]: cn(
        defaultClassNames[UI.DayButton],
        "transition-colors hover:bg-brand-50 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300  ",
      ),
      [UI.CaptionLabel]: cn(defaultClassNames[UI.CaptionLabel], "font-semibold text-gray-800 "),
      [UI.Weekday]: cn(defaultClassNames[UI.Weekday], "text-gray-500 "),
      [DayFlag.today]: cn(defaultClassNames[DayFlag.today], "text-brand-600 "),
      [SelectionState.selected]: cn(defaultClassNames[SelectionState.selected], "text-brand-700 "),
      [SelectionState.range_middle]: cn(defaultClassNames[SelectionState.range_middle], "bg-brand-50 "),
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
  React.useLayoutEffect(() => {
    if (!isOpen) {
      setPopupStyle(undefined);
      setIsPopupPositioned(false);
      return;
    }

    updatePopupPosition();
    const frameId = window.requestAnimationFrame(updatePopupPosition);

    return () => window.cancelAnimationFrame(frameId);
  }, [isOpen, updatePopupPosition]);

  React.useEffect(() => {
    if (!isOpen) return;

    window.addEventListener("resize", updatePopupPosition);
    window.addEventListener("scroll", updatePopupPosition, true);

    return () => {
      window.removeEventListener("resize", updatePopupPosition);
      window.removeEventListener("scroll", updatePopupPosition, true);
    };
  }, [isOpen, updatePopupPosition]);

  const resolvedPopupStyle: React.CSSProperties = {
    ...(popupStyle ?? {
      position: "fixed",
      top: 0,
      left: 0,
      zIndex: 100002,
      maxWidth: "calc(100vw - 32px)",
      maxHeight: "calc(100vh - 32px)",
      overflowY: "auto",
    }),
    visibility: isPopupPositioned ? "visible" : "hidden",
  };

  const popup = isOpen ? (
    <div
      ref={popupRef}
      style={resolvedPopupStyle}
      className="z-[100002] overscroll-contain"
      onMouseDown={(event) => event.stopPropagation()}
    >
      <Card className="rounded-lg p-3 shadow-lg">
        <div className="mb-3 flex flex-wrap gap-2 border-b border-gray-100 pb-3">
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
          onSelect={(range, selectedDay) => onSelect(range, selectedDay)}
          classNames={dayPickerClassNames}
          style={dayPickerStyles}
        />
        <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            disabled={!selected?.from && !selected?.to}
            className="h-8 px-3 text-xs text-gray-500 hover:text-gray-700"
          >
            초기화
          </Button>
          <Button type="button" variant="brand" size="sm" onClick={onConfirm} className="h-8 px-3 text-xs">
            확인
          </Button>
        </div>
      </Card>
    </div>
  ) : null;

  return (
    <div className={cn("w-full min-w-0", isOpen ? "relative z-[100001]" : undefined)}>
      {!hideLabel ? <p className={filterFieldLabelClass}>{label}</p> : null}
      <div ref={setTriggerContainerRef} className="relative">
        <Button
          type="button"
          variant="outline"
          size="default"
          onClick={onToggleOpen}
          className={cn(
            filterTriggerClass,
            error ? "border-error-500 focus:ring-3 focus:ring-error-500/10" : undefined,
            triggerClassName,
            "h-11",
          )}
        >
          <span className="min-w-0 flex-1 truncate text-left">{value || placeholder}</span>
          <ChevronDown className="size-4" />
        </Button>
        {popup && typeof document !== "undefined" ? createPortal(popup, document.body) : null}
      </div>
    </div>
  );
}

export default DateRangeFilterDropdown;
