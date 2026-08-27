"use client";

import React from "react";
import type { DateRange } from "react-day-picker";
import {
  Button,
  Card,
  DateRangeFilterDropdown,
  InputField,
  Select,
  SingleCheckboxFilterDropdown,
} from "@beaulab/ui-admin";

import {
  HOSPITAL_REVIEW_DATE_PRESET_OPTIONS,
  HOSPITAL_REVIEW_REPORT_STATUS_OPTIONS,
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
  onReportStatusChange: (value: string) => void;
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
  onReportStatusChange,
  onMetricMinChange,
  onMetricMaxChange,
  onApplyDateRange,
  onApplyDatePreset,
  onApplyFilters,
  onResetFilters,
}: HospitalReviewCommentsFilterPanelProps) {
  const filterRowClass = "flex min-w-0 items-center gap-3";
  const inlineLabelClass = "w-[72px] shrink-0 whitespace-nowrap text-right text-sm font-medium text-gray-600";
  const isMetricRangeInvalid =
    draftFilters.metricMin !== "" &&
    draftFilters.metricMax !== "" &&
    Number(draftFilters.metricMax) < Number(draftFilters.metricMin);
  const handleEnterToSearch = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      if (isMetricRangeInvalid) return;
      onApplyFilters();
    }
  };

  return (
    <Card className="min-w-0 rounded-xl p-3">
      <div className="space-y-3">
        <div className="grid min-w-0 gap-x-4 gap-y-3 md:grid-cols-2 xl:grid-cols-8">
          <div className={`${filterRowClass} md:col-span-2 xl:col-span-2`}>
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

          <div className={`${filterRowClass} md:col-span-2 xl:col-span-4`}>
            <span className={inlineLabelClass}>카테고리</span>
            <div className="grid min-w-0 flex-1 grid-cols-3 gap-2">
              <Select
                value={draftFilters.majorCategoryId}
                options={majorCategoryOptions}
                showPlaceholderOption={false}
                onChange={onMajorCategoryChange}
                className="h-11 px-4"
              />
              <Select
                value={draftFilters.middleCategoryId}
                options={middleCategoryOptions}
                showPlaceholderOption={false}
                disabled={!draftFilters.majorCategoryId}
                onChange={onMiddleCategoryChange}
                className="h-11 px-4"
              />
              <Select
                value={draftFilters.smallCategoryId}
                options={smallCategoryOptions}
                showPlaceholderOption={false}
                disabled={!draftFilters.middleCategoryId}
                onChange={onSmallCategoryChange}
                className="h-11 px-4"
              />
            </div>
          </div>

          <div className={`${filterRowClass} xl:col-span-2`}>
            <span className={inlineLabelClass}>공개여부</span>
            <div className="min-w-0 flex-1">
              <SingleCheckboxFilterDropdown
                label="공개여부"
                hideLabel
                value={draftFilters.visibilityStatus}
                options={HOSPITAL_REVIEW_VISIBILITY_OPTIONS}
                onChange={onVisibilityChange}
              />
            </div>
          </div>

          <div className={`${filterRowClass} md:col-span-2 xl:col-span-3`}>
            <span className={inlineLabelClass}>좋아요수</span>
            <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
              <InputField
                type="number"
                min="0"
                value={draftFilters.metricMin}
                onChange={(event) => onMetricMinChange(event.target.value)}
                onKeyDown={handleEnterToSearch}
                placeholder="1"
                className="bg-white px-3"
                error={isMetricRangeInvalid}
              />
              <span className="text-sm text-gray-400">~</span>
              <InputField
                type="number"
                min="0"
                value={draftFilters.metricMax}
                onChange={(event) => onMetricMaxChange(event.target.value)}
                onKeyDown={handleEnterToSearch}
                placeholder="500"
                className="bg-white px-3"
                error={isMetricRangeInvalid}
              />
            </div>
          </div>

          <div className={`${filterRowClass} md:col-span-2 xl:col-span-2`}>
            <span className={inlineLabelClass}>상태</span>
            <div className="min-w-0 flex-1">
              <SingleCheckboxFilterDropdown
                label="상태"
                hideLabel
                value={draftFilters.reportStatus}
                options={HOSPITAL_REVIEW_REPORT_STATUS_OPTIONS}
                onChange={onReportStatusChange}
              />
            </div>
          </div>
          <div className="flex min-w-0 flex-col gap-3 py-1.5 md:col-span-2 xl:col-span-3 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span className={inlineLabelClass}>검색</span>
              <div className="min-w-0 flex-1">
                <InputField
                  value={searchInput}
                  onChange={(event) => onSearchChange(event.target.value)}
                  onKeyDown={handleEnterToSearch}
                  placeholder="댓글ID, 후기ID, 댓글내용, 닉네임 등을 입력해주세요"
                  className="bg-white"
                />
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
              <Button
                type="button"
                variant="brand"
                onClick={onApplyFilters}
                size="filter"
                className="shrink-0"
                disabled={isMetricRangeInvalid}
              >
                검색
              </Button>
              <Button type="button" variant="brandOutline" size="filter" onClick={onResetFilters} className="shrink-0">
                검색 초기화
              </Button>
            </div>
          </div>
          {isMetricRangeInvalid ? (
            <p className="text-right text-xs text-error-500">좋아요수 최대값은 최소값 이상이어야 합니다.</p>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
