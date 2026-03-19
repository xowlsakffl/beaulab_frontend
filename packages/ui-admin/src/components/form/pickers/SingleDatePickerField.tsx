"use client";

import React from "react";
import { DayPicker } from "react-day-picker";
import { ko } from "react-day-picker/locale";
import { ChevronDown } from "../../../icons";
import Label from "../Label";
import { Button } from "../../ui/button/Button";
import { Card } from "../../ui/card/Card";

type SingleDatePickerFieldProps = {
  id: string;
  label: string;
  value: string;
  placeholder?: string;
  error?: string;
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
  onChange,
}: SingleDatePickerFieldProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = React.useState(false);

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
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div ref={containerRef} className="relative">
        <Button
          id={id}
          type="button"
          variant="outline"
          size="default"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`flex h-11 w-full items-center justify-between rounded-lg border px-3 text-sm ${
            error
              ? "border-error-500 text-error-800 dark:text-error-400"
              : "border-gray-300 text-gray-700 dark:border-gray-700 dark:text-gray-300"
          }`}
        >
          <span>{value || placeholder}</span>
          <ChevronDown className="size-4" />
        </Button>

        {isOpen ? (
          <Card className="absolute left-0 z-20 mt-2 rounded-xl p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800">
            <DayPicker
              mode="single"
              locale={ko}
              captionLayout="dropdown"
              startMonth={startMonth}
              endMonth={endMonth}
              reverseYears
              selected={parseDate(value)}
              onSelect={(date) => {
                onChange(date ? formatDate(date) : "");
                setIsOpen(false);
              }}
            />
            <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-white/[0.06]">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onChange("")}
                disabled={!value}
                className="h-8 px-3 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-300"
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
