"use client";

import React from "react";
import { DayFlag, DayPicker, SelectionState, UI, getDefaultClassNames } from "react-day-picker";
import { ko } from "react-day-picker/locale";
import { ChevronDown } from "../../../icons";
import { cn } from "../../../lib/utils";
import Label from "../Label";
import { Button } from "../../ui/button/Button";
import { Card } from "../../ui/card/Card";

type SingleDatePickerFieldProps = {
  id: string;
  label?: string;
  value: string;
  placeholder?: string;
  error?: string;
  className?: string;
  buttonClassName?: string;
  popoverClassName?: string;
  onChange: (value: string) => void;
};

function parseDate(value: string) {
  if (!value) return undefined;

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;

  return new Date(year, month - 1, day);
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const today = new Date();
const startMonth = new Date(today.getFullYear() - 100, 0, 1);
const endMonth = new Date(today.getFullYear(), 11, 31);

export function SingleDatePickerField({
  id,
  label,
  value,
  placeholder = "날짜를 선택하세요.",
  error,
  className = "",
  buttonClassName = "",
  popoverClassName = "",
  onChange,
}: SingleDatePickerFieldProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const defaultClassNames = React.useMemo(() => getDefaultClassNames(), []);
  const dayPickerClassNames = React.useMemo(
    () => ({
      ...defaultClassNames,
      [UI.Chevron]: cn(defaultClassNames[UI.Chevron], "fill-brand-500"),
      [UI.NextMonthButton]: cn(defaultClassNames[UI.NextMonthButton], "rounded-md text-brand-500 hover:bg-brand-50"),
      [UI.PreviousMonthButton]: cn(defaultClassNames[UI.PreviousMonthButton], "rounded-md text-brand-500 hover:bg-brand-50"),
      [UI.DayButton]: cn(
        defaultClassNames[UI.DayButton],
        "transition-colors hover:bg-brand-50 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300",
      ),
      [UI.CaptionLabel]: cn(defaultClassNames[UI.CaptionLabel], "font-semibold text-gray-800"),
      [UI.Weekday]: cn(defaultClassNames[UI.Weekday], "text-gray-500"),
      [DayFlag.today]: cn(defaultClassNames[DayFlag.today], "text-brand-600"),
      [SelectionState.selected]: cn(defaultClassNames[SelectionState.selected], "text-brand-700"),
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
      }) as React.CSSProperties,
    [],
  );

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
    <div className={`space-y-2 ${className}`}>
      {label ? <Label htmlFor={id}>{label}</Label> : null}
      <div ref={containerRef} className="relative">
        <Button
          id={id}
          type="button"
          variant="outline"
          size="default"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`flex h-11 w-full items-center justify-between rounded-lg border px-3 text-sm shadow-none ${
            error
              ? "border-error-500 text-error-800 "
              : "border-gray-300 text-gray-700  "
          } ${buttonClassName}`}
        >
          <span>{value || placeholder}</span>
          <ChevronDown className="size-4" />
        </Button>

        {isOpen ? (
          <Card className={`absolute left-0 z-[100000] mt-2 rounded-xl p-3 shadow-lg  ${popoverClassName}`}>
            <DayPicker
              mode="single"
              locale={ko}
              captionLayout="dropdown"
              startMonth={startMonth}
              endMonth={endMonth}
              reverseYears
              selected={parseDate(value)}
              classNames={dayPickerClassNames}
              style={dayPickerStyles}
              onSelect={(date) => {
                onChange(date ? formatDate(date) : "");
                setIsOpen(false);
              }}
            />
            <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 ">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onChange("")}
                disabled={!value}
                className="h-8 px-3 text-xs text-gray-500 hover:text-gray-700 "
              >
                초기화
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 px-3 text-xs"
              >
                닫기
              </Button>
            </div>
          </Card>
        ) : null}
      </div>
      {error ? <p className="text-xs text-error-500">{error}</p> : null}
    </div>
  );
}

export default SingleDatePickerField;
