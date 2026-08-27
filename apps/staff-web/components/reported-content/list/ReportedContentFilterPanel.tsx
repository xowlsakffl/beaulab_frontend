"use client";

import React from "react";
import type { DateRange } from "react-day-picker";
import {
  Button,
  Card,
  DateRangeFilterDropdown,
  FormCheckbox,
  InputField,
  SingleCheckboxFilterDropdown,
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
}: ReportedContentFilterPanelProps) {
  const filterRowClass = "flex min-w-0 items-center gap-3";
  const inlineLabelClass = "w-[72px] shrink-0 whitespace-nowrap text-right text-sm font-medium text-gray-600";
  const isReportCountRangeInvalid =
    showReportCountFilter &&
    draftFilters.reportCountMin !== "" &&
    draftFilters.reportCountMax !== "" &&
    Number(draftFilters.reportCountMax) < Number(draftFilters.reportCountMin);
  const dateControlsClass = dateTypeInline
    ? "flex min-w-0 flex-1 flex-row items-center gap-4"
    : "grid min-w-0 flex-1 grid-cols-[minmax(7rem,0.55fr)_minmax(0,1fr)] gap-2";
  const secondaryFilterCount =
    Number(showVisibilityFilter) + Number(showReportStatusFilter) + Number(showWarningFilter);
  const isWarningOnlyLayout =
    !showReportCountFilter && !showVisibilityFilter && !showReportStatusFilter && showWarningFilter;
  const searchDesktopSpan = isWarningOnlyLayout
    ? "xl:col-span-12"
    : secondaryFilterCount === 3
      ? "xl:col-span-6"
      : secondaryFilterCount === 2
        ? "xl:col-span-8"
        : secondaryFilterCount === 1
          ? "xl:col-span-10"
          : "xl:col-span-12";
  const reportReasonDesktopSpan = showReportCountFilter || isWarningOnlyLayout ? "xl:col-span-3" : "xl:col-span-6";
  const warningDesktopSpan = isWarningOnlyLayout ? "xl:col-span-3" : "xl:col-span-2";
  const handleEnterToSearch = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      if (isReportCountRangeInvalid) return;
      onApplyFilters();
    }
  };
  const reportCountFilter = showReportCountFilter ? (
    <div className={`${filterRowClass} xl:col-span-3`}>
      <span className={inlineLabelClass}>신고횟수</span>
      <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
        <InputField
          type="number"
          min="0"
          value={draftFilters.reportCountMin}
          onChange={(event) => onReportCountMinChange(event.target.value)}
          onKeyDown={handleEnterToSearch}
          placeholder="0"
          className="bg-white px-3"
          error={isReportCountRangeInvalid}
        />
        <span className="text-sm text-gray-400">~</span>
        <InputField
          type="number"
          min="0"
          value={draftFilters.reportCountMax}
          onChange={(event) => onReportCountMaxChange(event.target.value)}
          onKeyDown={handleEnterToSearch}
          placeholder="100"
          className="bg-white px-3"
          error={isReportCountRangeInvalid}
        />
      </div>
    </div>
  ) : null;
  const warningFilter = showWarningFilter ? (
    <div className={`${filterRowClass} ${warningDesktopSpan}`}>
      <span className={inlineLabelClass}>경고</span>
      <div className="min-w-0 flex-1">
        <SingleCheckboxFilterDropdown
          label="경고"
          hideLabel
          value={draftFilters.warningStatus}
          options={REPORTED_CONTENT_WARNING_OPTIONS}
          onChange={onWarningStatusChange}
        />
      </div>
    </div>
  ) : null;
  const visibilityFilter = showVisibilityFilter ? (
    <div className={`${filterRowClass} xl:col-span-2`}>
      <span className={inlineLabelClass}>공개여부</span>
      <div className="min-w-0 flex-1">
        <SingleCheckboxFilterDropdown
          label="공개여부"
          hideLabel
          value={draftFilters.visibilityStatus}
          options={REPORTED_CONTENT_VISIBILITY_OPTIONS}
          onChange={onVisibilityChange}
        />
      </div>
    </div>
  ) : null;
  const reportStatusFilter = showReportStatusFilter ? (
    <div className={`${filterRowClass} xl:col-span-2`}>
      <span className={inlineLabelClass}>{reportStatusLabel}</span>
      <div className="min-w-0 flex-1">
        <SingleCheckboxFilterDropdown
          label={reportStatusLabel}
          hideLabel
          value={draftFilters.reportStatus}
          options={reportStatusOptions}
          onChange={onReportStatusChange}
        />
      </div>
    </div>
  ) : null;
  const searchFilter = (
    <div
      className={`flex min-w-0 flex-col gap-3 py-1.5 md:col-span-2 ${searchDesktopSpan} sm:flex-row sm:items-center`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className={inlineLabelClass}>검색</span>
        <div className="min-w-0 flex-1">
          <InputField
            value={searchInput}
            onChange={(event) => onSearchChange(event.target.value)}
            onKeyDown={handleEnterToSearch}
            placeholder={searchInputPlaceholder ?? "ID, 닉네임, 병의원명, 내용 등을 입력해주세요"}
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
          disabled={isReportCountRangeInvalid}
        >
          검색
        </Button>
        <Button type="button" variant="brandOutline" size="filter" onClick={onResetFilters} className="shrink-0">
          검색 초기화
        </Button>
      </div>
    </div>
  );

  return (
    <Card className="min-w-0 rounded-xl p-3">
      <div className="space-y-3">
        <div className="grid min-w-0 gap-x-4 gap-y-3 md:grid-cols-2 xl:grid-cols-12">
          <div className={`${filterRowClass} md:col-span-2 xl:col-span-6`}>
            <span className={inlineLabelClass}>기간</span>
            <div className={dateControlsClass}>
              {dateTypeInline ? null : (
                <SingleCheckboxFilterDropdown
                  label="기간 기준"
                  hideLabel
                  value={draftFilters.dateType}
                  options={dateTypeOptions}
                  onChange={onDateTypeChange}
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

          <div className={`${filterRowClass} ${reportReasonDesktopSpan}`}>
            <span className={inlineLabelClass}>신고사유</span>
            <div className="min-w-0 flex-1">
              <SingleCheckboxFilterDropdown
                label="신고사유"
                hideLabel
                value={draftFilters.reportReason}
                options={REPORTED_CONTENT_REASON_OPTIONS}
                onChange={onReportReasonChange}
              />
            </div>
          </div>

          {reportCountFilter}

          {visibilityFilter}
          {reportStatusFilter}
          {warningFilter}
          {searchFilter}
        </div>

        {isReportCountRangeInvalid ? (
          <p className="text-right text-xs text-error-500">신고횟수 최대값은 최소값 이상이어야 합니다.</p>
        ) : null}
      </div>
    </Card>
  );
}
