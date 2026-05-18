"use client";

import React from "react";
import type { DateRange } from "react-day-picker";
import {
  Button,
  Card,
  CircleCheck,
  DateRangeFilterDropdown,
  InputField,
  Select,
} from "@beaulab/ui-admin";

import {
  REPORTED_CONTENT_DATE_PRESET_OPTIONS,
  REPORTED_CONTENT_DATE_TYPE_OPTIONS,
  REPORTED_CONTENT_REASON_OPTIONS,
  REPORTED_CONTENT_STATUS_OPTIONS,
  REPORTED_CONTENT_VISIBILITY_OPTIONS,
  REPORTED_CONTENT_WARNING_OPTIONS,
  type ReportedContentDatePresetKey,
  type ReportedContentDateType,
  type ReportedContentFilters,
  type ReportedContentOption,
} from "@/lib/reported-content/list";

type ReportedContentFilterPanelProps = {
  searchInput: string;
  draftFilters: ReportedContentFilters;
  draftDateRange?: DateRange;
  isDatePickerOpen: boolean;
  datePickerRef: React.RefObject<HTMLDivElement | null>;
  onSearchChange: (value: string) => void;
  onDateTypeChange: (value: string) => void;
  onToggleDatePicker: () => void;
  onApplyDateRange: (nextRange?: DateRange) => void;
  onApplyDatePreset: (preset: ReportedContentDatePresetKey) => void;
  onReportReasonChange: (value: string) => void;
  onReportCountMinChange: (value: string) => void;
  onReportCountMaxChange: (value: string) => void;
  onVisibilityChange: (value: string) => void;
  onReportStatusChange: (value: string) => void;
  onWarningStatusChange: (value: string) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
  dateTypeOptions?: ReportedContentOption<ReportedContentDateType>[];
  reportStatusOptions?: ReportedContentOption[];
  searchInputPlaceholder?: string;
  reportStatusLabel?: string;
  dateTypeInline?: boolean;
  showVisibilityFilter?: boolean;
  showWarningFilter?: boolean;
};

export function ReportedContentFilterPanel({
  searchInput,
  draftFilters,
  draftDateRange,
  isDatePickerOpen,
  datePickerRef,
  onSearchChange,
  onDateTypeChange,
  onToggleDatePicker,
  onApplyDateRange,
  onApplyDatePreset,
  onReportReasonChange,
  onReportCountMinChange,
  onReportCountMaxChange,
  onVisibilityChange,
  onReportStatusChange,
  onWarningStatusChange,
  onApplyFilters,
  onResetFilters,
  dateTypeOptions = REPORTED_CONTENT_DATE_TYPE_OPTIONS,
  reportStatusOptions = REPORTED_CONTENT_STATUS_OPTIONS,
  searchInputPlaceholder,
  reportStatusLabel = "신고상태",
  dateTypeInline = false,
  showVisibilityFilter = true,
  showWarningFilter = true,
}: ReportedContentFilterPanelProps) {
  const filterRowClass = "flex min-w-0 items-center gap-2 py-1.5";
  const inlineLabelClass = "w-16 shrink-0 whitespace-nowrap text-right text-sm font-medium text-gray-600 dark:text-gray-300";
  const firstGridClass = showVisibilityFilter
    ? "grid min-w-0 grid-cols-1 gap-x-3 gap-y-3 xl:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)]"
    : "grid min-w-0 grid-cols-1 gap-x-3 gap-y-3 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)]";
  const handleEnterToSearch = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onApplyFilters();
    }
  };

  return (
    <Card className="min-w-0 rounded-xl p-3 dark:border-white/[0.05]">
      <div className="space-y-3">
        <div className={firstGridClass}>
          <div className={filterRowClass}>
            <span className={inlineLabelClass}>기간</span>
            <div className={dateTypeInline ? "grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] items-center gap-6" : "grid min-w-0 flex-1 grid-cols-[minmax(7rem,0.55fr)_minmax(0,1fr)] gap-2"}>
              {dateTypeInline ? null : (
                <Select
                  value={draftFilters.dateType}
                  options={dateTypeOptions}
                  showPlaceholderOption={false}
                  onChange={onDateTypeChange}
                  className="h-11 px-3"
                />
              )}
              <DateRangeFilterDropdown
                label="기간"
                hideLabel
                containerRef={datePickerRef}
                value={draftFilters.dateRange}
                placeholder="기간 선택"
                selected={draftDateRange}
                isOpen={isDatePickerOpen}
                presetOptions={REPORTED_CONTENT_DATE_PRESET_OPTIONS}
                onToggleOpen={onToggleDatePicker}
                onSelect={onApplyDateRange}
                onPresetSelect={(presetKey) => onApplyDatePreset(presetKey as ReportedContentDatePresetKey)}
                onReset={() => {
                  onApplyDateRange(undefined);
                  onToggleDatePicker();
                }}
                onConfirm={onToggleDatePicker}
              />
              {dateTypeInline ? (
                <div className="flex shrink-0 items-center gap-5 px-1">
                  {dateTypeOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => onDateTypeChange(option.value)}
                      className="inline-flex items-center gap-2 whitespace-nowrap text-sm font-semibold text-gray-800 transition hover:text-brand-600 dark:text-gray-100 dark:hover:text-brand-300"
                    >
                      <CircleCheck
                        className={draftFilters.dateType === option.value ? "size-5 text-brand-500" : "size-5 text-gray-400"}
                        aria-hidden="true"
                      />
                      {option.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className={filterRowClass}>
            <span className={inlineLabelClass}>신고사유</span>
            <div className="min-w-0 flex-1">
              <Select
                value={draftFilters.reportReason}
                options={REPORTED_CONTENT_REASON_OPTIONS}
                showPlaceholderOption={false}
                onChange={onReportReasonChange}
                className="h-11 px-3"
              />
            </div>
          </div>

          <div className={filterRowClass}>
            <span className={inlineLabelClass}>신고횟수</span>
            <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
              <InputField
                type="number"
                min="0"
                value={draftFilters.reportCountMin}
                onChange={(event) => onReportCountMinChange(event.target.value)}
                onKeyDown={handleEnterToSearch}
                placeholder="0"
                className="bg-white px-3 dark:bg-gray-800"
              />
              <span className="text-sm text-gray-400">~</span>
              <InputField
                type="number"
                min="0"
                value={draftFilters.reportCountMax}
                onChange={(event) => onReportCountMaxChange(event.target.value)}
                onKeyDown={handleEnterToSearch}
                placeholder="100"
                className="bg-white px-3 dark:bg-gray-800"
              />
            </div>
          </div>

          {showVisibilityFilter ? (
          <div className={filterRowClass}>
            <span className={inlineLabelClass}>노출여부</span>
            <div className="min-w-0 flex-1">
              <Select
                value={draftFilters.visibilityStatus}
                options={REPORTED_CONTENT_VISIBILITY_OPTIONS}
                showPlaceholderOption={false}
                onChange={onVisibilityChange}
                className="h-11 px-3"
              />
            </div>
          </div>
          ) : null}

          <div className={filterRowClass}>
            <span className={inlineLabelClass}>{reportStatusLabel}</span>
            <div className="min-w-0 flex-1">
              <Select
                value={draftFilters.reportStatus}
                options={reportStatusOptions}
                showPlaceholderOption={false}
                onChange={onReportStatusChange}
                className="h-11 px-3"
              />
            </div>
          </div>
        </div>

        <div className={showWarningFilter ? "grid min-w-0 grid-cols-1 gap-x-4 gap-y-3 xl:grid-cols-[minmax(0,0.75fr)_minmax(0,3fr)]" : "grid min-w-0 grid-cols-1 gap-x-4 gap-y-3"}>
          {showWarningFilter ? (
          <div className={filterRowClass}>
            <span className={inlineLabelClass}>경고</span>
            <div className="min-w-0 flex-1">
              <Select
                value={draftFilters.warningStatus}
                options={REPORTED_CONTENT_WARNING_OPTIONS}
                showPlaceholderOption={false}
                onChange={onWarningStatusChange}
                className="h-11 px-3"
              />
            </div>
          </div>
          ) : null}

          <div className="flex min-w-0 flex-col gap-3 py-1.5 lg:flex-row lg:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span className={inlineLabelClass}>검색</span>
              <div className="min-w-0 flex-1">
                <InputField
                  value={searchInput}
                  onChange={(event) => onSearchChange(event.target.value)}
                  onKeyDown={handleEnterToSearch}
                  placeholder={searchInputPlaceholder ?? "ID, 닉네임, 병의원명, 내용 등을 입력해주세요"}
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
