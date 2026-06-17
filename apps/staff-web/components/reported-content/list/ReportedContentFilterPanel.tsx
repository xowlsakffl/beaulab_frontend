"use client";

import React from "react";
import type { DateRange } from "react-day-picker";
import {
  Button,
  Card,
  DateRangeFilterDropdown,
  FormCheckbox,
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
  showReportStatusFilter?: boolean;
  showReportCountFilter?: boolean;
  showWarningFilter?: boolean;
  singleLineFilters?: boolean;
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
  dateTypeInline = true,
  showVisibilityFilter = true,
  showReportStatusFilter = true,
  showReportCountFilter = true,
  showWarningFilter = true,
  singleLineFilters = false,
}: ReportedContentFilterPanelProps) {
  const filterRowClass = "flex min-w-0 items-center gap-2 py-1.5";
  const inlineLabelClass = "w-16 shrink-0 whitespace-nowrap text-right text-sm font-medium text-gray-600 ";
  const firstGridClass = singleLineFilters
    ? "grid min-w-0 grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,2.6fr)] gap-x-3 gap-y-3"
    : showVisibilityFilter && showReportStatusFilter
    ? "grid min-w-0 grid-cols-[minmax(0,2.25fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)] gap-x-3 gap-y-3 max-[1800px]:grid-cols-[minmax(0,2.15fr)_minmax(0,1fr)_minmax(0,1.15fr)]"
    : showVisibilityFilter || showReportStatusFilter
      ? "grid min-w-0 grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)] gap-x-3 gap-y-3 max-[1800px]:grid-cols-[minmax(0,2.15fr)_minmax(0,1fr)_minmax(0,1.15fr)]"
      : "grid min-w-0 grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.2fr)] gap-x-3 gap-y-3";
  const desktopSecondGridClass = showWarningFilter
    ? "grid min-w-0 grid-cols-[minmax(0,0.75fr)_minmax(0,3fr)] gap-x-4 gap-y-3 max-[1800px]:hidden"
    : "grid min-w-0 grid-cols-[minmax(0,1fr)] gap-x-4 gap-y-3 max-[1800px]:hidden";
  const compactSecondGridClass =
    "hidden min-w-0 grid-cols-[minmax(0,0.85fr)_minmax(0,0.85fr)_minmax(0,0.85fr)] gap-x-3 gap-y-3 max-[1800px]:grid";
  const compactSearchGridClass = "hidden min-w-0 grid-cols-[minmax(0,1fr)] gap-x-4 gap-y-3 max-[1800px]:grid";
  const dateControlsClass = dateTypeInline
    ? singleLineFilters
      ? "flex min-w-0 flex-1 flex-row items-center gap-3"
      : "flex min-w-0 flex-1 flex-row items-center gap-6"
    : "grid min-w-0 flex-1 grid-cols-[minmax(7rem,0.55fr)_minmax(0,1fr)] gap-2";
  const handleEnterToSearch = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onApplyFilters();
    }
  };
  const reportCountFilter = showReportCountFilter ? (
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
          className="bg-white px-3 "
        />
        <span className="text-sm text-gray-400">~</span>
        <InputField
          type="number"
          min="0"
          value={draftFilters.reportCountMax}
          onChange={(event) => onReportCountMaxChange(event.target.value)}
          onKeyDown={handleEnterToSearch}
          placeholder="100"
          className="bg-white px-3 "
        />
      </div>
    </div>
  ) : null;
  const warningFilter = showWarningFilter ? (
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
  ) : null;
  const visibilityFilter = showVisibilityFilter ? (
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
  ) : null;
  const reportStatusFilter = showReportStatusFilter ? (
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
  ) : null;
  const searchFilter = (
    <div className="flex min-w-0 flex-row items-center gap-3 py-1.5">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className={inlineLabelClass}>검색</span>
        <div className="min-w-0 flex-1">
          <InputField
            value={searchInput}
            onChange={(event) => onSearchChange(event.target.value)}
            onKeyDown={handleEnterToSearch}
            placeholder={searchInputPlaceholder ?? "ID, 닉네임, 병의원명, 내용 등을 입력해주세요"}
            className="bg-white "
          />
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
        <Button type="button" variant="brand" onClick={onApplyFilters} size="filter" className="shrink-0">
          검색
        </Button>
        <Button
          type="button"
          variant="brandOutline"
          size="filter"
          onClick={onResetFilters}
          className="shrink-0"
        >
          검색 초기화
        </Button>
      </div>
    </div>
  );

  return (
    <Card className="min-w-0 rounded-xl p-3 ">
      <div className="space-y-3">
        <div className={firstGridClass}>
          <div className={filterRowClass}>
            <span className={inlineLabelClass}>기간</span>
            <div className={dateControlsClass}>
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
                    <FormCheckbox
                      key={option.value}
                      checked={draftFilters.dateType === option.value}
                      onChange={() => onDateTypeChange(option.value)}
                      label={option.label}
                    />
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

          {reportCountFilter}

          {singleLineFilters ? visibilityFilter : <div className="contents max-[1800px]:hidden">{visibilityFilter}</div>}
          {singleLineFilters ? reportStatusFilter : <div className="contents max-[1800px]:hidden">{reportStatusFilter}</div>}
          {singleLineFilters ? warningFilter : null}
          {singleLineFilters ? searchFilter : null}
        </div>

        {singleLineFilters ? null : (
          <div className={desktopSecondGridClass}>
            {warningFilter}
            {searchFilter}
          </div>
        )}

        {singleLineFilters ? null : (
          <div className={compactSecondGridClass}>
            {visibilityFilter}
            {reportStatusFilter}
            {warningFilter}
          </div>
        )}

        {singleLineFilters ? null : (
          <div className={compactSearchGridClass}>
            {searchFilter}
          </div>
        )}
      </div>
    </Card>
  );
}
