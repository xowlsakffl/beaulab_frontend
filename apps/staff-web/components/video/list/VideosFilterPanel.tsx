import Link from "next/link";
import React from "react";
import type { DateRange } from "react-day-picker";
import {
  Button,
  Card,
  CheckboxFilterDropdown,
  DateRangeFilterDropdown,
  InputField,
  Select,
  SingleCheckboxFilterDropdown,
  SquarePlus,
} from "@beaulab/ui-admin";

import { Can } from "@/components/common/guard";
import {
  DATE_PRESET_OPTIONS,
  VIDEO_ADMIN_STATUS_OPTIONS,
  VIDEO_HOSPITAL_STATUS_OPTIONS,
  VIDEO_METRIC_OPTIONS,
  VIDEO_REPORT_STATUS_OPTIONS,
  type DatePresetKey,
  type Filters,
  type VideoMetric,
} from "@/lib/video/list";

type SelectOption = {
  value: string;
  label: string;
};

type VideosFilterPanelProps = {
  searchInput: string;
  draftFilters: Filters;
  draftDateRange?: DateRange;
  categoryOptions: SelectOption[];
  isDatePickerOpen: boolean;
  isReportStatusDropdownOpen: boolean;
  datePickerRef: React.RefObject<HTMLDivElement | null>;
  reportStatusDropdownRef: React.RefObject<HTMLDivElement | null>;
  onSearchChange: (value: string) => void;
  onToggleDatePicker: () => void;
  onToggleReportStatusDropdown: () => void;
  onApplyDateRange: (nextRange?: DateRange) => void;
  onApplyDatePreset: (preset: DatePresetKey) => void;
  onCategoryChange: (value: string) => void;
  onHospitalStatusChange: (value: string) => void;
  onToggleReportStatus: (value: string) => void;
  onToggleAllReportStatus: () => void;
  onMetricChange: (value: VideoMetric) => void;
  onMetricMinChange: (value: string) => void;
  onMetricMaxChange: (value: string) => void;
  onAdminStatusChange: (value: string) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
};

export function VideosFilterPanel({
  searchInput,
  draftFilters,
  draftDateRange,
  categoryOptions,
  isDatePickerOpen,
  isReportStatusDropdownOpen,
  datePickerRef,
  reportStatusDropdownRef,
  onSearchChange,
  onToggleDatePicker,
  onToggleReportStatusDropdown,
  onApplyDateRange,
  onApplyDatePreset,
  onCategoryChange,
  onHospitalStatusChange,
  onToggleReportStatus,
  onToggleAllReportStatus,
  onMetricChange,
  onMetricMinChange,
  onMetricMaxChange,
  onAdminStatusChange,
  onApplyFilters,
  onResetFilters,
}: VideosFilterPanelProps) {
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
        <div className="grid min-w-0 gap-x-4 gap-y-3 md:grid-cols-2 xl:grid-cols-10">
          <div className={`${filterRowClass} xl:col-span-3`}>
            <span className={inlineLabelClass}>기간</span>
            <div className="min-w-0 flex-1">
              <DateRangeFilterDropdown
                label="기간"
                hideLabel
                containerRef={datePickerRef}
                value={draftFilters.dateRange}
                placeholder="기간 선택"
                selected={draftDateRange}
                isOpen={isDatePickerOpen}
                presetOptions={DATE_PRESET_OPTIONS}
                onToggleOpen={onToggleDatePicker}
                onSelect={onApplyDateRange}
                onPresetSelect={(presetKey) => onApplyDatePreset(presetKey as DatePresetKey)}
                onReset={() => {
                  onApplyDateRange(undefined);
                  onToggleDatePicker();
                }}
                onConfirm={onToggleDatePicker}
              />
            </div>
          </div>

          <div className={`${filterRowClass} xl:col-span-3`}>
            <span className={inlineLabelClass}>카테고리</span>
            <div className="min-w-0 flex-1">
              <Select
                value={draftFilters.categoryId}
                options={categoryOptions}
                showPlaceholderOption={false}
                onChange={onCategoryChange}
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
                value={draftFilters.hospitalStatus}
                options={VIDEO_HOSPITAL_STATUS_OPTIONS}
                onChange={onHospitalStatusChange}
              />
            </div>
          </div>

          <div className={`${filterRowClass} xl:col-span-2`}>
            <span className={inlineLabelClass}>신고상태</span>
            <div className="min-w-0 flex-1">
              <CheckboxFilterDropdown
                label="신고상태"
                hideLabel
                containerRef={reportStatusDropdownRef}
                selectedValues={draftFilters.reportStatuses}
                options={VIDEO_REPORT_STATUS_OPTIONS}
                isOpen={isReportStatusDropdownOpen}
                onToggleOpen={onToggleReportStatusDropdown}
                onToggleValue={onToggleReportStatus}
                onToggleAll={onToggleAllReportStatus}
              />
            </div>
          </div>

          <MetricRangeFilter
            className="md:col-span-2 xl:col-span-3"
            label="지표"
            metricValue={draftFilters.metric}
            minValue={draftFilters.metricMin}
            maxValue={draftFilters.metricMax}
            onMetricChange={(value) => onMetricChange(value as VideoMetric)}
            onMinChange={onMetricMinChange}
            onMaxChange={onMetricMaxChange}
            onEnter={handleEnterToSearch}
            error={isMetricRangeInvalid}
          />

          <div className={`${filterRowClass} xl:col-span-2`}>
            <span className={inlineLabelClass}>강제중지</span>
            <div className="min-w-0 flex-1">
              <SingleCheckboxFilterDropdown
                label="강제중지"
                hideLabel
                value={draftFilters.adminStatus}
                options={VIDEO_ADMIN_STATUS_OPTIONS}
                onChange={onAdminStatusChange}
              />
            </div>
          </div>
          <div className="flex min-w-0 flex-col gap-3 py-1.5 md:col-span-2 xl:col-span-5 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span className={inlineLabelClass}>검색</span>
              <div className="min-w-0 flex-1">
                <InputField
                  value={searchInput}
                  onChange={(event) => onSearchChange(event.target.value)}
                  onKeyDown={handleEnterToSearch}
                  placeholder="VID, 병의원명, 제목을 입력해주세요"
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
              <Can permission="beaulab.video.create">
                <Link href="/video-manage/videos/new">
                  <Button type="button" variant="brand" size="filter">
                    <SquarePlus className="size-5" />
                    <span>동영상 등록</span>
                  </Button>
                </Link>
              </Can>
            </div>
          </div>
          {isMetricRangeInvalid ? (
            <p className="text-right text-xs text-error-500">지표 최대값은 최소값 이상이어야 합니다.</p>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

function MetricRangeFilter({
  className,
  label,
  metricValue,
  minValue,
  maxValue,
  onMetricChange,
  onMinChange,
  onMaxChange,
  onEnter,
  error = false,
}: {
  className?: string;
  label: string;
  metricValue: string;
  minValue: string;
  maxValue: string;
  onMetricChange: (value: string) => void;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
  onEnter: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  error?: boolean;
}) {
  const inlineLabelClass = "w-[72px] shrink-0 whitespace-nowrap text-right text-sm font-medium text-gray-600";

  return (
    <div className={["flex min-w-0 items-center gap-3", className].filter(Boolean).join(" ")}>
      <span className={inlineLabelClass}>{label}</span>
      <div className="grid min-w-0 flex-1 grid-cols-[minmax(8.5rem,1.25fr)_minmax(0,0.8fr)_auto_minmax(0,0.8fr)] items-center gap-2">
        <Select
          value={metricValue}
          options={VIDEO_METRIC_OPTIONS}
          showPlaceholderOption={false}
          onChange={onMetricChange}
          className="h-11 px-4"
        />
        <InputField
          type="number"
          min="0"
          value={minValue}
          onChange={(event) => onMinChange(event.target.value)}
          onKeyDown={onEnter}
          placeholder="0"
          className="bg-white px-3"
          error={error}
        />
        <span className="text-sm text-gray-400">~</span>
        <InputField
          type="number"
          min="0"
          value={maxValue}
          onChange={(event) => onMaxChange(event.target.value)}
          onKeyDown={onEnter}
          placeholder="999999999"
          className="bg-white px-3"
          error={error}
        />
      </div>
    </div>
  );
}
