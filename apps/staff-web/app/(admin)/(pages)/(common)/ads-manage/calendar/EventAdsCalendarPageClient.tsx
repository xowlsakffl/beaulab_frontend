"use client";

import React from "react";
import { isApiSuccess } from "@beaulab/types";
import { Card, ChevronLeft, ChevronRight, SegmentedTabs, SpinnerBlock } from "@beaulab/ui-admin";

import { LoadErrorState } from "@/components/common/LoadErrorState";
import { api } from "@/lib/common/api";
import {
  EVENT_AD_PLACEMENT_GROUPS,
  addDays,
  formatEventAdMonthLabel,
  isCurrentOrNextMonth,
  monthKey,
  type EventAdPlacementGroupKey,
} from "@/lib/hospital-event-ad/form";
import { formatEventAdLocalDate } from "@/lib/hospital-event-ad/list";

type CalendarBadgeColor = "blue" | "orange" | "red" | "brand" | "green";

type EventAdCalendarCategory = {
  id: number;
  name: string;
  display_name: string;
  code: string;
  full_path: string;
};

type EventAdCalendarPlacementStatus = {
  date: string;
  placement: string;
  placement_label: string;
  reserved_count: number;
  remaining_count: number;
  slot_limit: number;
  is_sold_out: boolean;
  is_past: boolean;
  is_deadline_closed: boolean;
  sort_order: number;
};

type EventAdCalendarDay = {
  date: string;
  is_sales_closed: boolean;
  statuses: EventAdCalendarPlacementStatus[];
};

type EventAdCalendarResponse = {
  group: EventAdPlacementGroupKey;
  category_id?: number | null;
  month: string;
  categories: EventAdCalendarCategory[];
  days: EventAdCalendarDay[];
};

const PLACEMENT_COLORS: Record<string, CalendarBadgeColor> = {
  MAIN_POPUP: "blue",
  MAIN_VERTICAL_BANNER: "orange",
  MAIN_HORIZONTAL_BANNER: "red",
  SURGERY_TOP_BANNER: "blue",
  SURGERY_HOT_EVENT: "orange",
  SURGERY_CATEGORY_BANNER: "red",
  PETIT_TOP_BANNER: "blue",
  PETIT_HOT_EVENT: "orange",
  PETIT_CATEGORY_BANNER: "red",
  CONSULT_MEMO: "brand",
  SEARCH: "green",
};

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];
const EMPTY_CATEGORIES: EventAdCalendarCategory[] = [];
const EMPTY_DAYS: EventAdCalendarDay[] = [];

export default function EventAdsCalendarPageClient() {
  const [activeGroup, setActiveGroup] = React.useState<EventAdPlacementGroupKey>("main");
  const [calendarMonth, setCalendarMonth] = React.useState(() => startOfMonth(new Date()));
  const [selectedCategoryIdByGroup, setSelectedCategoryIdByGroup] = React.useState<
    Partial<Record<EventAdPlacementGroupKey, number | null>>
  >({
    surgery: null,
    petit: null,
  });
  const [calendarData, setCalendarData] = React.useState<EventAdCalendarResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const requestIdRef = React.useRef(0);

  const selectedCategoryId = selectedCategoryIdByGroup[activeGroup] ?? null;
  const categories = calendarData?.group === activeGroup ? calendarData.categories : EMPTY_CATEGORIES;
  const calendarDays = calendarData?.group === activeGroup ? calendarData.days : EMPTY_DAYS;
  const hasCategoryTabs = activeGroup === "surgery" || activeGroup === "petit";

  const fetchCalendar = React.useCallback(async () => {
    requestIdRef.current += 1;
    const requestId = requestIdRef.current;

    setIsLoading(true);
    setLoadError(null);

    try {
      const response = await api.get<EventAdCalendarResponse>("/hospital-event-ads/calendar", {
        group: activeGroup,
        category_id: selectedCategoryId ?? undefined,
        month: monthKey(calendarMonth),
      });

      if (requestId !== requestIdRef.current) return;

      if (!isApiSuccess(response)) {
        setCalendarData(null);
        setLoadError(response.error.message || "광고 현황을 불러오지 못했습니다.");
        return;
      }

      setCalendarData(response.data);
    } catch {
      if (requestId !== requestIdRef.current) return;

      setCalendarData(null);
      setLoadError("광고 현황을 불러오는 중 오류가 발생했습니다.");
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [activeGroup, calendarMonth, selectedCategoryId]);

  React.useEffect(() => {
    void fetchCalendar();
  }, [fetchCalendar]);

  React.useEffect(() => {
    if (!hasCategoryTabs || !selectedCategoryId || categories.length === 0) return;

    const exists = categories.some((category) => category.id === selectedCategoryId);
    if (!exists) {
      setSelectedCategoryIdByGroup((prev) => ({ ...prev, [activeGroup]: null }));
    }
  }, [activeGroup, categories, hasCategoryTabs, selectedCategoryId]);

  const changeGroup = React.useCallback((group: EventAdPlacementGroupKey) => {
    setActiveGroup(group);
  }, []);

  const changeCategory = React.useCallback(
    (value: string) => {
      setSelectedCategoryIdByGroup((prev) => ({
        ...prev,
        [activeGroup]: value === "all" ? null : Number(value),
      }));
    },
    [activeGroup],
  );

  const changeMonth = React.useCallback((month: Date) => {
    setCalendarMonth(startOfMonth(month));
  }, []);

  return (
    <Card className="min-w-0 rounded-xl p-8">
      <div className="space-y-7">
        <div className="flex flex-col gap-4">
          <SegmentedTabs
            items={EVENT_AD_PLACEMENT_GROUPS.map((group) => ({ value: group.key, label: group.label }))}
            value={activeGroup}
            onValueChange={(value) => changeGroup(value as EventAdPlacementGroupKey)}
            className="w-fit min-w-[27rem] rounded-lg border border-gray-200 p-0.5"
            tabClassName="h-9 min-w-24 rounded-md px-4 py-1.5 text-sm font-semibold"
            activeTabClassName="bg-brand-500 text-white shadow-sm"
            inactiveTabClassName="text-gray-500 hover:text-brand-500"
          />

          {hasCategoryTabs ? (
            <CategoryTabs
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              disabled={isLoading && categories.length === 0}
              onValueChange={changeCategory}
            />
          ) : null}
        </div>

        {loadError ? (
          <LoadErrorState title="광고 현황을 불러오지 못했습니다." message={loadError} onRetry={fetchCalendar} />
        ) : (
          <EventAdStatusCalendar
            month={calendarMonth}
            days={calendarDays}
            loading={isLoading}
            canGoPrev={isCurrentOrNextMonth(calendarMonth, "prev")}
            canGoNext={isCurrentOrNextMonth(calendarMonth, "next")}
            onMonthChange={changeMonth}
          />
        )}
      </div>
    </Card>
  );
}

function CategoryTabs({
  categories,
  selectedCategoryId,
  disabled,
  onValueChange,
}: {
  categories: EventAdCalendarCategory[];
  selectedCategoryId: number | null;
  disabled: boolean;
  onValueChange: (value: string) => void;
}) {
  const items = React.useMemo(
    () => [
      { value: "all", label: "전체", disabled },
      ...categories.map((category) => ({
        value: String(category.id),
        label: category.display_name || category.name,
        disabled,
      })),
    ],
    [categories, disabled],
  );

  return (
    <SegmentedTabs
      items={items}
      value={selectedCategoryId === null ? "all" : String(selectedCategoryId)}
      onValueChange={onValueChange}
      className="w-fit max-w-full rounded-lg border border-gray-200 p-0.5"
      tabClassName="h-8 min-w-20 rounded-md px-4 py-1.5 text-xs font-semibold"
      activeTabClassName="bg-brand-500 text-white shadow-sm"
      inactiveTabClassName="text-gray-500 hover:text-brand-500"
    />
  );
}

function EventAdStatusCalendar({
  month,
  days,
  loading,
  canGoPrev,
  canGoNext,
  onMonthChange,
}: {
  month: Date;
  days: EventAdCalendarDay[];
  loading: boolean;
  canGoPrev: boolean;
  canGoNext: boolean;
  onMonthChange: (month: Date) => void;
}) {
  const today = React.useMemo(() => new Date(), []);
  const statusByDate = React.useMemo(() => new Map(days.map((day) => [day.date, day])), [days]);
  const closedRangeDateKeys = React.useMemo(() => {
    const dateKeys = new Set<string>();

    days.forEach((day) => {
      if (!isClosedCalendarDay(day)) return;

      const startDate = parseDateKey(day.date);
      if (!startDate) return;

      Array.from({ length: 7 }, (_, index) => addDays(startDate, index)).forEach((date) => {
        dateKeys.add(formatEventAdLocalDate(date));
      });
    });

    return dateKeys;
  }, [days]);
  const calendarDays = React.useMemo(() => buildCalendarDays(month), [month]);

  return (
    <div className="min-w-0">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">{formatEventAdMonthLabel(month)}</h2>
        <div className="flex items-center gap-2">
          <MonthButton
            icon={<ChevronLeft className="size-5" />}
            disabled={!canGoPrev}
            label="이전달"
            onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
          />
          <MonthButton
            icon={<ChevronRight className="size-5" />}
            disabled={!canGoNext}
            label="다음달"
            onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
          />
        </div>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-gray-200">
        {loading ? (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70">
            <SpinnerBlock className="min-h-0" spinnerClassName="size-7" label="광고 현황을 불러오는 중" />
          </div>
        ) : null}

        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
          {WEEKDAY_LABELS.map((day, index) => (
            <div
              key={day}
              className={[
                "px-3 py-2 text-xs font-bold",
                index === 0 ? "text-error-500" : index === 6 ? "text-brand-500" : "text-gray-500",
              ].join(" ")}
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {calendarDays.map((date) => {
            const dateKey = formatEventAdLocalDate(date);
            const dayStatus = statusByDate.get(dateKey);
            const isDimmed = !isSameMonth(date, month);
            const isToday = isSameDate(date, today);
            const isPastOrToday = isSameOrBeforeDate(date, today);
            const isClosedRangeDate = closedRangeDateKeys.has(dateKey);
            const showSoldOut =
              !isDimmed && (isClosedRangeDate || isClosedCalendarDay(dayStatus) || (!dayStatus && isPastOrToday));

            return (
              <div
                key={dateKey}
                className={[
                  "relative min-h-28 border-r border-b border-gray-200 p-2 text-left transition",
                  isDimmed ? "bg-gray-50 text-gray-300" : "bg-white text-gray-800",
                  isToday ? "bg-warning-50" : "",
                ].join(" ")}
              >
                <span className="absolute top-2 left-2 text-sm font-semibold">{date.getDate()}</span>
                <div className="absolute bottom-2 left-2 max-w-[calc(100%-1rem)] space-y-1">
                  {showSoldOut ? (
                    <span className="block w-fit max-w-full truncate rounded-md bg-gray-100 px-1.5 py-0.5 text-[11px] leading-4 font-bold text-gray-500">
                      판매종료
                    </span>
                  ) : (
                    dayStatus?.statuses.map((status) => (
                      <CalendarStatusBadge
                        key={`${dateKey}-${status.placement}`}
                        color={PLACEMENT_COLORS[status.placement] ?? "blue"}
                        label={calendarBadgeLabel(status)}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MonthButton({
  icon,
  disabled,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  disabled: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex size-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition disabled:cursor-not-allowed disabled:opacity-30"
      aria-label={label}
    >
      {icon}
    </button>
  );
}

function CalendarStatusBadge({ color, label }: { color: CalendarBadgeColor; label: string }) {
  const colorClassName = {
    blue: "bg-blue-50 text-blue-500",
    orange: "bg-orange-50 text-orange-500",
    red: "bg-error-50 text-error-500",
    brand: "bg-brand-50 text-brand-500",
    green: "bg-success-50 text-success-600",
  }[color];

  return (
    <p
      className={[
        "w-fit max-w-full truncate rounded-md px-1.5 py-0.5 text-[11px] leading-4 font-bold",
        colorClassName,
      ].join(" ")}
    >
      {label}
    </p>
  );
}

function calendarBadgeLabel(status: EventAdCalendarPlacementStatus) {
  return `${shortPlacementLabel(status.placement_label)}(${status.reserved_count}/${status.slot_limit})`;
}

function isClosedCalendarDay(day?: EventAdCalendarDay) {
  if (!day) return false;
  if (day.is_sales_closed) return true;

  return day.statuses.length > 0 && day.statuses.every((status) => status.is_sold_out);
}

function parseDateKey(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return Number.isFinite(date.getTime()) ? date : null;
}

function shortPlacementLabel(label: string) {
  return label
    .replace(/^메인\s*/, "")
    .replace(/^성형\s*/, "")
    .replace(/^쁘띠\s*/, "")
    .replace(/이벤트$/, "")
    .replace(/카테고리별 배너$/, "카테고리별")
    .trim();
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function buildCalendarDays(monthDate: Date) {
  const firstDay = startOfMonth(monthDate);
  const firstGridDay = addDays(firstDay, -firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => addDays(firstGridDay, index));
}

function isSameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function isSameDate(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isSameOrBeforeDate(a: Date, b: Date) {
  const left = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const right = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();

  return left <= right;
}
