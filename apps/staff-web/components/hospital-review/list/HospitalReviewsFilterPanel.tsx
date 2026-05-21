"use client";

import React from "react";
import type { DateRange } from "react-day-picker";
import {
  Button,
  Card,
  CheckboxFilterDropdown,
  DateRangeFilterDropdown,
  InputField,
  Select,
} from "@beaulab/ui-admin";

import {
  HOSPITAL_REVIEW_BEST_OPTIONS,
  HOSPITAL_REVIEW_DATE_PRESET_OPTIONS,
  HOSPITAL_REVIEW_METRIC_OPTIONS,
  HOSPITAL_REVIEW_RATING_OPTIONS,
  HOSPITAL_REVIEW_REPORT_STATUS_OPTIONS,
  HOSPITAL_REVIEW_VISIBILITY_OPTIONS,
  type HospitalReviewDatePresetKey,
  type HospitalReviewFilters,
} from "@/lib/hospital-review/list";

type HospitalReviewsFilterPanelProps = {
  searchInput: string;
  draftFilters: HospitalReviewFilters;
  draftDateRange?: DateRange;
  majorCategoryOptions: SelectOption[];
  middleCategoryOptions: SelectOption[];
  isRatingDropdownOpen: boolean;
  isDatePickerOpen: boolean;
  ratingDropdownRef: React.RefObject<HTMLDivElement | null>;
  datePickerRef: React.RefObject<HTMLDivElement | null>;
  onSearchChange: (value: string) => void;
  onToggleRatingDropdown: () => void;
  onToggleDatePicker: () => void;
  onMajorCategoryChange: (value: string) => void;
  onMiddleCategoryChange: (value: string) => void;
  onToggleRating: (value: string) => void;
  onToggleAllRating: () => void;
  onVisibilityChange: (value: string) => void;
  onReportStatusChange: (value: string) => void;
  onBestChange: (value: string) => void;
  onMetricFieldChange: (value: string) => void;
  onMetricMinChange: (value: string) => void;
  onMetricMaxChange: (value: string) => void;
  onApplyDateRange: (nextRange?: DateRange) => void;
  onApplyDatePreset: (preset: HospitalReviewDatePresetKey) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
};

type SelectOption = {
  value: string;
  label: string;
};

export function HospitalReviewsFilterPanel({
  searchInput,
  draftFilters,
  draftDateRange,
  majorCategoryOptions,
  middleCategoryOptions,
  isRatingDropdownOpen,
  isDatePickerOpen,
  ratingDropdownRef,
  datePickerRef,
  onSearchChange,
  onToggleRatingDropdown,
  onToggleDatePicker,
  onMajorCategoryChange,
  onMiddleCategoryChange,
  onToggleRating,
  onToggleAllRating,
  onVisibilityChange,
  onReportStatusChange,
  onBestChange,
  onMetricFieldChange,
  onMetricMinChange,
  onMetricMaxChange,
  onApplyDateRange,
  onApplyDatePreset,
  onApplyFilters,
  onResetFilters,
}: HospitalReviewsFilterPanelProps) {
  const filterRowClass = "flex min-w-0 items-center gap-3 py-1.5";
  const inlineLabelClass = "w-16 shrink-0 whitespace-nowrap text-right text-sm font-medium text-gray-600 ";
  const handleEnterToSearch = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onApplyFilters();
    }
  };

  return (
    <Card className="min-w-0 rounded-xl p-3 ">
      <div className="space-y-3">
        <div className="grid min-w-0 grid-cols-1 gap-x-3 gap-y-3 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.45fr)_minmax(0,0.7fr)_minmax(0,1.55fr)_minmax(0,0.75fr)]">
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
            <div className="grid min-w-0 flex-1 grid-cols-2 gap-2">
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
            <span className={inlineLabelClass}>지표</span>
            <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:grid-cols-[minmax(7rem,0.9fr)_minmax(0,1fr)_auto_minmax(0,1fr)]">
              <div className="min-w-0 max-sm:col-span-3">
                <Select
                  value={draftFilters.metricField}
                  options={HOSPITAL_REVIEW_METRIC_OPTIONS}
                  showPlaceholderOption={false}
                  onChange={onMetricFieldChange}
                  className="h-11 px-3"
                />
              </div>
              <div className="min-w-0">
                <InputField
                  type="number"
                  min="0"
                  value={draftFilters.metricMin}
                  onChange={(event) => onMetricMinChange(event.target.value)}
                  onKeyDown={handleEnterToSearch}
                  placeholder="1"
                  className="bg-white px-3 "
                />
              </div>
              <span className="text-sm text-gray-400">~</span>
              <div className="min-w-0">
                <InputField
                  type="number"
                  min="0"
                  value={draftFilters.metricMax}
                  onChange={(event) => onMetricMaxChange(event.target.value)}
                  onKeyDown={handleEnterToSearch}
                  placeholder="500"
                  className="bg-white px-3 "
                />
              </div>
            </div>
          </div>

          <div className={filterRowClass}>
            <span className={inlineLabelClass}>상태</span>
            <div className="min-w-0 flex-1">
              <Select
                value={draftFilters.reportStatus}
                options={HOSPITAL_REVIEW_REPORT_STATUS_OPTIONS}
                showPlaceholderOption={false}
                onChange={onReportStatusChange}
                className="h-11 px-3"
              />
            </div>
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-x-5 gap-y-3 xl:grid-cols-[minmax(0,0.65fr)_minmax(0,0.65fr)_minmax(0,2.7fr)]">
          <div className={filterRowClass}>
            <span className={inlineLabelClass}>베스트</span>
            <div className="min-w-0 flex-1">
              <Select
                value={draftFilters.best}
                options={HOSPITAL_REVIEW_BEST_OPTIONS}
                showPlaceholderOption={false}
                onChange={onBestChange}
                className="h-11 px-3"
              />
            </div>
          </div>

          <div className={filterRowClass}>
            <span className={inlineLabelClass}>평점</span>
            <CheckboxFilterDropdown
              label="평점"
              hideLabel
              containerRef={ratingDropdownRef}
              selectedValues={draftFilters.ratings}
              options={HOSPITAL_REVIEW_RATING_OPTIONS}
              isOpen={isRatingDropdownOpen}
              onToggleOpen={onToggleRatingDropdown}
              onToggleValue={onToggleRating}
              onToggleAll={onToggleAllRating}
              emptyLabel="전체"
            />
          </div>

          <div className="flex min-w-0 flex-col gap-3 py-1.5 lg:flex-row lg:items-center xl:pl-2">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span className={inlineLabelClass}>검색</span>
              <div className="min-w-0 flex-1">
                <InputField
                  value={searchInput}
                  onChange={(event) => onSearchChange(event.target.value)}
                  onKeyDown={handleEnterToSearch}
                  placeholder="닉네임, 병의원명, 의료진명 등을 입력해주세요"
                  className="bg-white "
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
                className="h-11 border-brand-500 px-5 text-brand-500 hover:bg-gray-100 "
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
