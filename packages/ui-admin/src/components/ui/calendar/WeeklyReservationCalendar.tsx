"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "../../../lib/utils";
import { SpinnerBlock } from "../spinner/Spinner";

type WeeklyReservationCalendarProps<TWeek> = {
  month: Date;
  weeks: TWeek[];
  getWeekDate: (week: TWeek) => string;
  getRemainingCount: (week: TWeek) => number;
  getSlotLimit: (week: TWeek) => number;
  getIsSoldOut: (week: TWeek) => boolean;
  onMonthChange: (month: Date) => void;
  onSelectWeek: (week: TWeek) => void;
  canGoPrev?: boolean;
  canGoNext?: boolean;
  isLoading?: boolean;
  loadingLabel?: string;
  className?: string;
  monthLabel?: string;
  soldOutLabel?: string;
  availableLabel?: (week: TWeek) => string;
  showSoldOutWeekRange?: boolean;
};

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

export function WeeklyReservationCalendar<TWeek>({
  month,
  weeks,
  getWeekDate,
  getRemainingCount,
  getSlotLimit,
  getIsSoldOut,
  onMonthChange,
  onSelectWeek,
  canGoPrev = true,
  canGoNext = true,
  isLoading = false,
  loadingLabel = "예약 현황을 불러오는 중",
  className,
  monthLabel,
  soldOutLabel = "판매종료",
  availableLabel,
  showSoldOutWeekRange = false,
}: WeeklyReservationCalendarProps<TWeek>) {
  const [hoveredStartDate, setHoveredStartDate] = React.useState<string | null>(null);
  const today = React.useMemo(() => new Date(), []);
  const calendarDays = React.useMemo(() => buildCalendarDays(month), [month]);
  const weekByDate = React.useMemo(() => {
    const map = new Map<string, TWeek>();

    weeks.forEach((week) => {
      map.set(getWeekDate(week), week);
    });

    return map;
  }, [getWeekDate, weeks]);
  const soldOutWeekByDate = React.useMemo(() => {
    const map = new Map<string, TWeek>();
    if (!showSoldOutWeekRange) return map;

    weeks.forEach((week) => {
      if (!getIsSoldOut(week) && getRemainingCount(week) > 0) return;

      const startDate = parseDateKey(getWeekDate(week));
      if (!startDate) return;

      Array.from({ length: 7 }, (_, index) => addDays(startDate, index)).forEach((date) => {
        map.set(formatDateKey(date), week);
      });
    });

    return map;
  }, [getIsSoldOut, getRemainingCount, getWeekDate, showSoldOutWeekRange, weeks]);
  const hoveredStart = hoveredStartDate ? parseDateKey(hoveredStartDate) : null;
  const hoveredEnd = hoveredStart ? addDays(hoveredStart, 6) : null;

  return (
    <div className={cn("min-w-0", className)}>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">{monthLabel ?? formatMonthLabel(month)}</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!canGoPrev}
            onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
            className="flex size-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="이전달"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            disabled={!canGoNext}
            onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
            className="flex size-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="다음달"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-gray-200">
        {isLoading ? (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70">
            <SpinnerBlock className="min-h-0" spinnerClassName="size-7" label={loadingLabel} />
          </div>
        ) : null}

        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
          {WEEKDAY_LABELS.map((day, index) => (
            <div
              key={day}
              className={cn(
                "px-3 py-2 text-xs font-bold",
                index === 0 ? "text-error-500" : index === 6 ? "text-brand-500" : "text-gray-500",
              )}
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {calendarDays.map((date) => {
            const dateKey = formatDateKey(date);
            const isDimmed = !isSameMonth(date, month);
            const week = isDimmed ? undefined : weekByDate.get(dateKey);
            const soldOutWeek = isDimmed ? undefined : soldOutWeekByDate.get(dateKey);
            const badgeWeek = week ?? soldOutWeek;
            const isToday = isSameDate(date, today);
            const isHighlighted = hoveredStart && hoveredEnd ? isDateInRange(date, hoveredStart, hoveredEnd) : false;
            const isPastOrToday = isSameOrBeforeDate(date, today);
            const shouldShowPastSoldOut = showSoldOutWeekRange && !week && !soldOutWeek && !isDimmed && isPastOrToday;
            const isSoldOut = badgeWeek
              ? getIsSoldOut(badgeWeek) || getRemainingCount(badgeWeek) <= 0
              : shouldShowPastSoldOut;
            const remainingCount = week ? getRemainingCount(week) : 0;
            const isAvailable = Boolean(week && !isSoldOut && remainingCount > 0);
            const shouldShowBadge = Boolean(week || (soldOutWeek && isSoldOut) || shouldShowPastSoldOut);
            const availableText = week
              ? (availableLabel?.(week) ?? `예약가능(${remainingCount}/${getSlotLimit(week)})`)
              : "";

            return (
              <button
                key={dateKey}
                type="button"
                disabled={!isAvailable}
                onClick={() => week && onSelectWeek(week)}
                onMouseEnter={() => setHoveredStartDate(isAvailable ? dateKey : null)}
                onMouseLeave={() => setHoveredStartDate(null)}
                className={cn(
                  "relative min-h-28 border-r border-b border-gray-200 p-2 text-left transition",
                  isDimmed ? "bg-gray-50 text-gray-300" : "bg-white text-gray-800",
                  isToday && "bg-warning-50",
                  isHighlighted && "bg-brand-50",
                  isAvailable ? "cursor-pointer hover:bg-brand-50" : "cursor-default",
                )}
              >
                <span className="absolute top-2 left-2 text-sm font-semibold">{date.getDate()}</span>
                {shouldShowBadge ? (
                  <span
                    className={cn(
                      "absolute bottom-2 left-2 max-w-[calc(100%-1rem)] truncate rounded-md px-1.5 py-0.5 text-[11px] leading-4 font-bold",
                      isSoldOut ? "bg-gray-100 text-gray-500" : "bg-blue-50 text-blue-500",
                    )}
                  >
                    {isSoldOut ? soldOutLabel : availableText}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function parseDateKey(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return Number.isFinite(date.getTime()) ? date : null;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(date.getDate() + days);

  return next;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function buildCalendarDays(monthDate: Date) {
  const firstDay = startOfMonth(monthDate);
  const firstGridDay = addDays(firstDay, -firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => addDays(firstGridDay, index));
}

function isSameDate(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isDateInRange(date: Date, start: Date, end: Date) {
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

  return target >= start.getTime() && target <= end.getTime();
}

function isSameOrBeforeDate(date: Date, target: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() <= target.getTime();
}

function isSameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function formatDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatMonthLabel(date: Date) {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
}
