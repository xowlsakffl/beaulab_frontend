"use client";

import { ArrowLeft, Card, WeeklyReservationCalendar } from "@beaulab/ui-admin";

import { LoadErrorState } from "@/components/common/LoadErrorState";
import {
  eventAdStartDayLabel,
  formatEventAdMonthLabel,
  isCurrentOrNextMonth,
  type EventAdAvailabilityWeek,
  type EventAdCategoryOption,
  type EventAdPlacementOption,
} from "@/lib/hospital-event-ad/form";

export function EventAdDateStep({
  selectedPlacement,
  selectedCategory,
  calendarMonth,
  availabilityWeeks,
  isLoading,
  error,
  onMonthChange,
  onSelectWeek,
  onBack,
}: {
  selectedPlacement: EventAdPlacementOption;
  selectedCategory: EventAdCategoryOption | null;
  calendarMonth: Date;
  availabilityWeeks: EventAdAvailabilityWeek[];
  isLoading: boolean;
  error: string | null;
  onMonthChange: (month: Date) => void;
  onSelectWeek: (week: EventAdAvailabilityWeek) => void;
  onBack: () => void;
}) {
  const startDayLabel = eventAdStartDayLabel(selectedPlacement);

  return (
    <Card className="rounded-xl p-8">
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 text-sm">
            <p className="font-bold text-gray-900">상품 구매 유의사항</p>
            <ul className="space-y-1 pl-1 text-gray-600">
              <li className="relative pl-3 before:absolute before:top-2 before:left-0 before:size-1 before:rounded-full before:bg-gray-400">
                희망 노출 시작일은 {startDayLabel}만 선택 가능하며, 선택한 날짜로부터 7일간 자동으로 지정됩니다.
              </li>
              <li className="relative pl-3 before:absolute before:top-2 before:left-0 before:size-1 before:rounded-full before:bg-gray-400">
                배너광고는 주단위로 판매되며 광고 시작일 11:00부터 차주 {startDayLabel} 10:59:59 까지 노출돼요.
              </li>
              <li className="relative pl-3 before:absolute before:top-2 before:left-0 before:size-1 before:rounded-full before:bg-gray-400">
                매월 첫 영업일 오전 9시 30분에 차월 광고 구매가 가능해요.
              </li>
              <li className="relative pl-3 before:absolute before:top-2 before:left-0 before:size-1 before:rounded-full before:bg-gray-400">
                광고 게시일 2 영업일전까지만 신청이 가능해요.
              </li>
            </ul>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border border-gray-200 px-3 text-sm font-semibold text-gray-600 transition hover:border-brand-300 hover:text-brand-500"
          >
            <ArrowLeft className="size-4" />
            <span>뒤로가기</span>
          </button>
        </div>

        <div className="grid gap-8 xl:grid-cols-[340px_minmax(0,1fr)]">
          <aside>
            <div>
              <p className="text-sm font-bold text-gray-900">선택한 광고위치</p>
              <div className="mt-2 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm font-bold text-gray-900">{selectedPlacement.label}</p>
              </div>
              {selectedCategory ? (
                <p className="mt-3 text-xs font-semibold text-brand-500">
                  {selectedCategory.display_name || selectedCategory.name}
                </p>
              ) : null}
            </div>
          </aside>

          <section className="min-w-0">
            {error ? (
              <LoadErrorState title="광고 예약 현황을 불러오지 못했습니다." message={error} />
            ) : (
              <WeeklyReservationCalendar<EventAdAvailabilityWeek>
                month={calendarMonth}
                weeks={availabilityWeeks}
                getWeekDate={(week) => week.date}
                getRemainingCount={(week) => week.remaining_count}
                getSlotLimit={(week) => week.slot_limit}
                getIsSoldOut={(week) => week.is_sold_out}
                canGoPrev={isCurrentOrNextMonth(calendarMonth, "prev")}
                canGoNext={isCurrentOrNextMonth(calendarMonth, "next")}
                isLoading={isLoading}
                loadingLabel="예약 현황을 불러오는 중"
                monthLabel={formatEventAdMonthLabel(calendarMonth)}
                availableLabel={(week) => `예약가능(${week.reserved_count}/${week.slot_limit})`}
                showSoldOutWeekRange
                onMonthChange={onMonthChange}
                onSelectWeek={onSelectWeek}
              />
            )}
          </section>
        </div>
      </div>
    </Card>
  );
}
