"use client";

import React from "react";
import type { DateRange } from "react-day-picker";
import {
  Button,
  Card,
  DateRangeFilterDropdown,
  InputField,
  Select,
} from "@beaulab/ui-admin";

import {
  HOSPITAL_REVIEW_DATE_PRESET_OPTIONS,
  HOSPITAL_REVIEW_VISIBILITY_OPTIONS,
  type HospitalReviewDatePresetKey,
  type HospitalReviewFilters,
} from "@/lib/hospital-review/list";

type SelectOption = {
  value: string;
  label: string;
};

type HospitalReviewCommentsFilterPanelProps = {
  searchInput: string;
  draftFilters: HospitalReviewFilters;
  draftDateRange?: DateRange;
  majorCategoryOptions: SelectOption[];
  middleCategoryOptions: SelectOption[];
  smallCategoryOptions: SelectOption[];
  isDatePickerOpen: boolean;
  datePickerRef: React.RefObject<HTMLDivElement | null>;
  onSearchChange: (value: string) => void;
  onToggleDatePicker: () => void;
  onMajorCategoryChange: (value: string) => void;
  onMiddleCategoryChange: (value: string) => void;
  onSmallCategoryChange: (value: string) => void;
  onVisibilityChange: (value: string) => void;
  onMetricMinChange: (value: string) => void;
  onMetricMaxChange: (value: string) => void;
  onApplyDateRange: (nextRange?: DateRange) => void;
  onApplyDatePreset: (preset: HospitalReviewDatePresetKey) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
};

export function HospitalReviewCommentsFilterPanel({
  searchInput,
  draftFilters,
  draftDateRange,
  majorCategoryOptions,
  middleCategoryOptions,
  smallCategoryOptions,
  isDatePickerOpen,
  datePickerRef,
  onSearchChange,
  onToggleDatePicker,
  onMajorCategoryChange,
  onMiddleCategoryChange,
  onSmallCategoryChange,
  onVisibilityChange,
  onMetricMinChange,
  onMetricMaxChange,
  onApplyDateRange,
  onApplyDatePreset,
  onApplyFilters,
  onResetFilters,
}: HospitalReviewCommentsFilterPanelProps) {
  const filterRowClass = "flex min-w-0 items-center gap-3 py-1.5";
  const inlineLabelClass = "w-16 shrink-0 whitespace-nowrap text-right text-sm font-medium text-gray-600 dark:text-gray-300";
  const handleEnterToSearch = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onApplyFilters();
    }
  };

  return (
    <Card className="min-w-0 rounded-xl p-3 dark:border-white/[0.05]">
      <div className="space-y-3">
        <div className="grid min-w-0 grid-cols-1 gap-x-3 gap-y-3 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.55fr)_minmax(0,0.7fr)_minmax(0,1fr)]">
          <div className={filterRowClass}>
            <span className={inlineLabelClass}>작성일</span>
            <DateRangeFilterDropdown
              label="작성일"
              hideLabel
              containerRef={datePickerRef}
              value={draftFilters.dateRange}
              placeholder="작성일 기간 선택"
              selected={draftDateRange}
              isOpen={isDatePickerOpen}
              presetOptions={HOSPITAL_REVIEW_DATE_PRESET_OPTIONS}
              onToggleOpen={onToggleDatePicker}
              onSelect={onApplyDateRange}
              onPresetSelect={(presetKey) => onApplyDatePreset(presetKey as HospitalReviewDatePresetKey)}
              onReset={() => {
                onApplyDateRange(undefined);
                onToggleDatePicker();
              }}
              onConfirm={onToggleDatePicker}
            />
          </div>

          <div className={filterRowClass}>
            <span className={inlineLabelClass}>카테고리</span>
            <div className="grid min-w-0 flex-1 grid-cols-3 gap-2">
              <Select
                value={draftFilters.majorCategoryId}
                options={majorCategoryOptions}
                showPlaceholderOption={false}
                onChange={onMajorCategoryChange}
                className="h-11 px-3"
              />
              <Select
                value={draftFilters.middleCategoryId}
                options={middleCategoryOptions}
                showPlaceholderOption={false}
                disabled={!draftFilters.majorCategoryId}
                onChange={onMiddleCategoryChange}
                className="h-11 px-3"
              />
              <Select
                value={draftFilters.smallCategoryId}
                options={smallCategoryOptions}
                showPlaceholderOption={false}
                disabled={!draftFilters.middleCategoryId}
                onChange={onSmallCategoryChange}
                className="h-11 px-3"
              />
            </div>
          </div>

          <div className={filterRowClass}>
            <span className={inlineLabelClass}>노출여부</span>
            <div className="min-w-0 flex-1">
              <Select
                value={draftFilters.visibilityStatus}
                options={HOSPITAL_REVIEW_VISIBILITY_OPTIONS}
                showPlaceholderOption={false}
                onChange={onVisibilityChange}
                className="h-11 px-3"
              />
            </div>
          </div>

          <div className={filterRowClass}>
            <span className={inlineLabelClass}>좋아요수</span>
            <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
              <InputField
                type="number"
                min="0"
                value={draftFilters.metricMin}
                onChange={(event) => onMetricMinChange(event.target.value)}
                onKeyDown={handleEnterToSearch}
                placeholder="1"
                className="bg-white px-3 dark:bg-gray-800"
              />
              <span className="text-sm text-gray-400">~</span>
              <InputField
                type="number"
                min="0"
                value={draftFilters.metricMax}
                onChange={(event) => onMetricMaxChange(event.target.value)}
                onKeyDown={handleEnterToSearch}
                placeholder="500"
                className="bg-white px-3 dark:bg-gray-800"
              />
            </div>
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-x-5 gap-y-3">
          <div className="flex min-w-0 flex-col gap-3 py-1.5 lg:flex-row lg:items-center xl:pl-2">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span className={inlineLabelClass}>검색</span>
              <div className="min-w-0 flex-1">
                <InputField
                  value={searchInput}
                  onChange={(event) => onSearchChange(event.target.value)}
                  onKeyDown={handleEnterToSearch}
                  placeholder="댓글ID, 후기ID, 댓글내용, 닉네임 등을 입력해주세요"
                  className="bg-white dark:bg-gray-800"
                />
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
              <Button type="button" variant="brand" onClick={onApplyFilters} size="sm" className="h-11 shrink-0 px-5">
                검색
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onResetFilters}
                className="h-11 border-brand-500 px-5 text-brand-500 hover:bg-gray-100 dark:hover:bg-white/[0.06]"
              >
                검색 초기화
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
