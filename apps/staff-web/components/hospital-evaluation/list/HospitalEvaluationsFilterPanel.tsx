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
  HOSPITAL_EVALUATION_DATE_PRESET_OPTIONS,
  HOSPITAL_EVALUATION_RATING_OPTIONS,
  HOSPITAL_EVALUATION_REVIEW_TYPE_OPTIONS,
  HOSPITAL_EVALUATION_VISIBILITY_OPTIONS,
  type HospitalEvaluationDatePresetKey,
  type HospitalEvaluationFilters,
} from "@/lib/hospital-evaluation/list";

type HospitalEvaluationsFilterPanelProps = {
  searchInput: string;
  draftFilters: HospitalEvaluationFilters;
  draftDateRange?: DateRange;
  isDatePickerOpen: boolean;
  datePickerRef: React.RefObject<HTMLDivElement | null>;
  onSearchChange: (value: string) => void;
  onToggleDatePicker: () => void;
  onVisibilityChange: (value: string) => void;
  onRatingChange: (value: string) => void;
  onReviewTypeChange: (value: string) => void;
  onCostMinChange: (value: string) => void;
  onCostMaxChange: (value: string) => void;
  onViewCountMinChange: (value: string) => void;
  onViewCountMaxChange: (value: string) => void;
  onApplyDateRange: (nextRange?: DateRange) => void;
  onApplyDatePreset: (preset: HospitalEvaluationDatePresetKey) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
};

export function HospitalEvaluationsFilterPanel({
  searchInput,
  draftFilters,
  draftDateRange,
  isDatePickerOpen,
  datePickerRef,
  onSearchChange,
  onToggleDatePicker,
  onVisibilityChange,
  onRatingChange,
  onReviewTypeChange,
  onCostMinChange,
  onCostMaxChange,
  onViewCountMinChange,
  onViewCountMaxChange,
  onApplyDateRange,
  onApplyDatePreset,
  onApplyFilters,
  onResetFilters,
}: HospitalEvaluationsFilterPanelProps) {
  const filterRowClass = "flex min-w-0 items-center gap-3 py-1.5";
  const inlineLabelClass = "w-16 shrink-0 whitespace-nowrap text-right text-sm font-medium text-gray-600 dark:text-gray-300";
  const wideInlineLabelClass = "w-24 shrink-0 whitespace-nowrap text-right text-sm font-medium text-gray-600 dark:text-gray-300";

  const handleEnterToSearch = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onApplyFilters();
    }
  };

  return (
    <Card className="min-w-0 rounded-xl p-3 dark:border-white/[0.05]">
      <div className="space-y-3">
        <div className="grid min-w-0 grid-cols-1 gap-x-3 gap-y-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)_minmax(0,0.85fr)_minmax(0,1.35fr)_minmax(0,1.35fr)]">
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
              presetOptions={HOSPITAL_EVALUATION_DATE_PRESET_OPTIONS}
              onToggleOpen={onToggleDatePicker}
              onSelect={onApplyDateRange}
              onPresetSelect={(presetKey) => onApplyDatePreset(presetKey as HospitalEvaluationDatePresetKey)}
              onReset={() => {
                onApplyDateRange(undefined);
                onToggleDatePicker();
              }}
              onConfirm={onToggleDatePicker}
            />
          </div>

          <div className={filterRowClass}>
            <span className={inlineLabelClass}>노출여부</span>
            <div className="min-w-0 flex-1">
              <Select
                value={draftFilters.visibilityStatus}
                options={HOSPITAL_EVALUATION_VISIBILITY_OPTIONS}
                showPlaceholderOption={false}
                onChange={onVisibilityChange}
                className="h-11 px-3"
              />
            </div>
          </div>

          <div className={filterRowClass}>
            <span className={inlineLabelClass}>평점</span>
            <div className="min-w-0 flex-1">
              <Select
                value={draftFilters.rating}
                options={HOSPITAL_EVALUATION_RATING_OPTIONS}
                showPlaceholderOption={false}
                onChange={onRatingChange}
                className="h-11 px-3"
              />
            </div>
          </div>

          <div className={filterRowClass}>
            <span className={wideInlineLabelClass}>시/수술비용</span>
            <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
              <InputField
                type="number"
                min="0"
                value={draftFilters.costMin}
                onChange={(event) => onCostMinChange(event.target.value)}
                onKeyDown={handleEnterToSearch}
                placeholder="0"
                className="bg-white px-3 dark:bg-gray-800"
              />
              <span className="text-sm text-gray-400">~</span>
              <InputField
                type="number"
                min="0"
                value={draftFilters.costMax}
                onChange={(event) => onCostMaxChange(event.target.value)}
                onKeyDown={handleEnterToSearch}
                placeholder="500"
                className="bg-white px-3 dark:bg-gray-800"
              />
            </div>
          </div>

          <div className={filterRowClass}>
            <span className={inlineLabelClass}>조회수</span>
            <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
              <InputField
                type="number"
                min="0"
                value={draftFilters.viewCountMin}
                onChange={(event) => onViewCountMinChange(event.target.value)}
                onKeyDown={handleEnterToSearch}
                placeholder="0"
                className="bg-white px-3 dark:bg-gray-800"
              />
              <span className="text-sm text-gray-400">~</span>
              <InputField
                type="number"
                min="0"
                value={draftFilters.viewCountMax}
                onChange={(event) => onViewCountMaxChange(event.target.value)}
                onKeyDown={handleEnterToSearch}
                placeholder="1000"
                className="bg-white px-3 dark:bg-gray-800"
              />
            </div>
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-x-5 gap-y-3 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,3.2fr)]">
          <div className={filterRowClass}>
            <span className={inlineLabelClass}>후기유형</span>
            <div className="min-w-0 flex-1">
              <Select
                value={draftFilters.reviewType}
                options={HOSPITAL_EVALUATION_REVIEW_TYPE_OPTIONS}
                showPlaceholderOption={false}
                onChange={onReviewTypeChange}
                className="h-11 px-3"
              />
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-3 py-1.5 lg:flex-row lg:items-center xl:pl-2">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span className={inlineLabelClass}>검색</span>
              <div className="min-w-0 flex-1">
                <InputField
                  value={searchInput}
                  onChange={(event) => onSearchChange(event.target.value)}
                  onKeyDown={handleEnterToSearch}
                  placeholder="후기ID, 병의원명, 전화번호 등을 입력해주세요"
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
