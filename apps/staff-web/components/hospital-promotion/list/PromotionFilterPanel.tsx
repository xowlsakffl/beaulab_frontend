"use client";

import React from "react";
import {
  Button,
  Card,
  CheckboxFilterDropdown,
  DateRangeFilterDropdown,
  InputField,
  SquarePlus,
} from "@beaulab/ui-admin";
import type { DateRange } from "react-day-picker";
import { Can } from "@/components/common/guard";
import {
  buildFilterDateState,
  buildPresetDateRange,
  mapDateRange,
  STANDARD_DATE_PRESET_OPTIONS,
  type StandardDatePresetKey,
} from "@/lib/common/date-range-filter";
import type { PromotionFilters } from "@/lib/hospital-promotion/list";
import { PROMOTION_PERMISSIONS } from "@/lib/hospital-promotion/types";
import { PROMOTION_STATUS_OPTIONS } from "@/lib/hospital-promotion/options";

type Props = {
  filters: PromotionFilters;
  onChange: (filters: PromotionFilters) => void;
  onSearch: () => void;
  onReset: () => void;
  onCreate?: () => void;
};

export function PromotionFilterPanel({ filters, onChange, onSearch, onReset, onCreate }: Props) {
  const [dateOpen, setDateOpen] = React.useState(false);
  const dateRef = React.useRef<HTMLDivElement | null>(null);
  const [statusOpen, setStatusOpen] = React.useState(false);
  const statusRef = React.useRef<HTMLDivElement | null>(null);
  const date = buildFilterDateState(filters.start_date, filters.end_date);

  React.useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!dateRef.current?.contains(event.target as Node)) setDateOpen(false);
      if (!statusRef.current?.contains(event.target as Node)) setStatusOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const setRange = (range?: DateRange) => {
    const next = mapDateRange(range);
    onChange({ ...filters, start_date: next.startDate, end_date: next.endDate });
  };

  return (
    <Card className="min-w-0 rounded-xl p-3">
      <form
        className="grid min-w-0 gap-x-4 gap-y-3 md:grid-cols-2 xl:grid-cols-[minmax(270px,1fr)_190px_minmax(0,2.5fr)]"
        onSubmit={(event) => {
          event.preventDefault();
          setDateOpen(false);
          setStatusOpen(false);
          onSearch();
        }}
      >
        <div className="staff-filter-row">
          <span className="staff-filter-inline-label">기간</span>
          <DateRangeFilterDropdown
            label="게시기간"
            hideLabel
            containerRef={dateRef}
            value={date.label}
            placeholder="전체"
            selected={date.range}
            isOpen={dateOpen}
            presetOptions={STANDARD_DATE_PRESET_OPTIONS}
            onToggleOpen={() => {
              setStatusOpen(false);
              setDateOpen((open) => !open);
            }}
            onSelect={setRange}
            onPresetSelect={(key) => {
              setRange(buildPresetDateRange(key as StandardDatePresetKey));
              setDateOpen(false);
            }}
            onReset={() => {
              setRange(undefined);
              setDateOpen(false);
            }}
            onConfirm={() => setDateOpen(false)}
          />
        </div>
        <div className="staff-filter-row">
          <span className="staff-filter-inline-label">공개여부</span>
          <div className="min-w-0 flex-1">
            <CheckboxFilterDropdown
              label="공개여부"
              hideLabel
              containerRef={statusRef}
              selectedValues={filters.statuses}
              options={PROMOTION_STATUS_OPTIONS}
              isOpen={statusOpen}
              onToggleOpen={() => {
                setDateOpen(false);
                setStatusOpen((open) => !open);
              }}
              onToggleValue={(value) => {
                const status = PROMOTION_STATUS_OPTIONS.find((option) => option.value === value)?.value;
                if (!status) return;
                onChange({
                  ...filters,
                  statuses: filters.statuses.includes(status)
                    ? filters.statuses.filter((item) => item !== status)
                    : [...filters.statuses, status],
                });
              }}
              onToggleAll={() =>
                onChange({
                  ...filters,
                  statuses:
                    filters.statuses.length === PROMOTION_STATUS_OPTIONS.length
                      ? []
                      : PROMOTION_STATUS_OPTIONS.map((option) => option.value),
                })
              }
            />
          </div>
        </div>
        <div className="col-span-full flex min-w-0 flex-col gap-3 xl:col-span-1 sm:flex-row sm:items-center">
          <div className="staff-filter-row flex-1">
            <label htmlFor="promotion-search" className="staff-filter-inline-label xl:w-12">
              검색
            </label>
            <div className="min-w-0 flex-1">
              <InputField
                id="promotion-search"
                value={filters.q}
                maxLength={100}
                onChange={(event) => onChange({ ...filters, q: event.target.value })}
                placeholder="ID, 프로모션, 담당자 검색"
              />
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            <Button type="submit" variant="brand" size="filter">
              검색
            </Button>
            <Button
              type="button"
              variant="brandOutline"
              size="filter"
              onClick={() => {
                setDateOpen(false);
                setStatusOpen(false);
                onReset();
              }}
            >
              검색 초기화
            </Button>
            {onCreate ? (
              <Can permission={PROMOTION_PERMISSIONS.create}>
                <Button type="button" variant="brand" size="filter" onClick={onCreate}>
                  <SquarePlus className="size-5" />
                  프로모션 등록
                </Button>
              </Can>
            ) : null}
          </div>
        </div>
      </form>
    </Card>
  );
}
