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
  REPORTED_CONTENT_DATE_PRESET_OPTIONS,
  REPORTED_CONTENT_DATE_TYPE_OPTIONS,
  REPORTED_CONTENT_REASON_OPTIONS,
  REPORTED_CONTENT_SEARCH_TYPE_OPTIONS,
  REPORTED_CONTENT_STATUS_OPTIONS,
  REPORTED_CONTENT_VISIBILITY_OPTIONS,
  REPORTED_CONTENT_WARNING_OPTIONS,
  type ReportedContentDatePresetKey,
  type ReportedContentFilters,
} from "@/lib/reported-content/list";

type ReportedContentFilterPanelProps = {
  searchInput: string;
  draftFilters: ReportedContentFilters;
  draftDateRange?: DateRange;
  isDatePickerOpen: boolean;
  datePickerRef: React.RefObject<HTMLDivElement | null>;
  onSearchChange: (value: string) => void;
  onSearchTypeChange: (value: string) => void;
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
};

export function ReportedContentFilterPanel({
  searchInput,
  draftFilters,
  draftDateRange,
  isDatePickerOpen,
  datePickerRef,
  onSearchChange,
  onSearchTypeChange,
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
}: ReportedContentFilterPanelProps) {
  const filterRowClass = "flex min-w-0 items-center gap-2 py-1.5";
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
        <div className="grid min-w-0 grid-cols-1 gap-x-3 gap-y-3 xl:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <div className={filterRowClass}>
            <span className={inlineLabelClass}>기간</span>
            <div className="grid min-w-0 flex-1 grid-cols-[minmax(7rem,0.55fr)_minmax(0,1fr)] gap-2">
              <Select
                value={draftFilters.dateType}
                options={REPORTED_CONTENT_DATE_TYPE_OPTIONS}
                showPlaceholderOption={false}
                onChange={onDateTypeChange}
                className="h-11 px-3"
              />
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

          <div className={filterRowClass}>
            <span className={inlineLabelClass}>신고상태</span>
            <div className="min-w-0 flex-1">
              <Select
                value={draftFilters.reportStatus}
                options={REPORTED_CONTENT_STATUS_OPTIONS}
                showPlaceholderOption={false}
                onChange={onReportStatusChange}
                className="h-11 px-3"
              />
            </div>
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-x-4 gap-y-3 xl:grid-cols-[minmax(0,0.75fr)_minmax(0,3fr)]">
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

          <div className="flex min-w-0 flex-col gap-3 py-1.5 lg:flex-row lg:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span className={inlineLabelClass}>검색</span>
              <div className="grid min-w-0 flex-1 grid-cols-[minmax(7rem,0.35fr)_minmax(0,1fr)] gap-2">
                <Select
                  value={draftFilters.searchType}
                  options={REPORTED_CONTENT_SEARCH_TYPE_OPTIONS}
                  showPlaceholderOption={false}
                  onChange={onSearchTypeChange}
                  className="h-11 px-3"
                />
                <InputField
                  value={searchInput}
                  onChange={(event) => onSearchChange(event.target.value)}
                  onKeyDown={handleEnterToSearch}
                  placeholder={searchPlaceholder(draftFilters.searchType)}
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

function searchPlaceholder(searchType: ReportedContentFilters["searchType"]) {
  if (searchType === "id") return "ID를 입력해주세요";
  if (searchType === "hospital_name") return "병의원명을 입력해주세요";
  if (searchType === "content") return "내용을 입력해주세요";

  return "닉네임을 입력해주세요";
}
