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
  const filterRowClass = "flex min-w-0 items-center gap-2 py-1.5";
  const inlineLabelClass = "w-16 shrink-0 whitespace-nowrap text-right text-sm font-medium text-gray-600 ";
  const handleEnterToSearch = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onApplyFilters();
    }
  };

  return (
    <Card className="min-w-0 rounded-xl p-3">
      <div className="space-y-3">
        <div className="grid min-w-0 grid-cols-[minmax(0,1.35fr)_minmax(0,1.15fr)_minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,1.6fr)] gap-x-3 gap-y-3 max-[1800px]:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
          <div className={filterRowClass}>
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

          <div className={filterRowClass}>
            <span className={inlineLabelClass}>카테고리</span>
            <div className="min-w-0 flex-1">
              <Select
                value={draftFilters.categoryId}
                options={categoryOptions}
                showPlaceholderOption={false}
                onChange={onCategoryChange}
                className="h-11 px-3"
              />
            </div>
          </div>

          <div className={filterRowClass}>
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

          <div className={filterRowClass}>
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
            label="지표"
            metricValue={draftFilters.metric}
            minValue={draftFilters.metricMin}
            maxValue={draftFilters.metricMax}
            onMetricChange={(value) => onMetricChange(value as VideoMetric)}
            onMinChange={onMetricMinChange}
            onMaxChange={onMetricMaxChange}
            onEnter={handleEnterToSearch}
          />
        </div>

        <div className="grid min-w-0 grid-cols-[minmax(0,0.72fr)_minmax(0,3fr)] gap-x-3 gap-y-3">
          <div className={filterRowClass}>
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

          <div className="flex min-w-0 flex-row items-center gap-2 py-1.5">
            <div className="flex min-w-0 flex-1 items-center gap-2">
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
              <Button type="button" variant="brand" onClick={onApplyFilters} size="filter" className="shrink-0">
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
        </div>
      </div>
    </Card>
  );
}

function MetricRangeFilter({
  label,
  metricValue,
  minValue,
  maxValue,
  onMetricChange,
  onMinChange,
  onMaxChange,
  onEnter,
}: {
  label: string;
  metricValue: string;
  minValue: string;
  maxValue: string;
  onMetricChange: (value: string) => void;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
  onEnter: (event: React.KeyboardEvent<HTMLInputElement>) => void;
}) {
  const inlineLabelClass = "w-16 shrink-0 whitespace-nowrap text-right text-sm font-medium text-gray-600 ";

  return (
    <div className="flex min-w-0 items-center gap-2 py-1.5">
      <span className={inlineLabelClass}>{label}</span>
      <div className="grid min-w-0 flex-1 grid-cols-[minmax(8.5rem,1.25fr)_minmax(0,0.8fr)_auto_minmax(0,0.8fr)] items-center gap-2">
        <Select
          value={metricValue}
          options={VIDEO_METRIC_OPTIONS}
          showPlaceholderOption={false}
          onChange={onMetricChange}
          className="h-11 px-3"
        />
        <InputField
          type="number"
          min="0"
          value={minValue}
          disabled={metricValue === "all"}
          onChange={(event) => onMinChange(event.target.value)}
          onKeyDown={onEnter}
          placeholder="0"
          className="bg-white px-3"
        />
        <span className="text-sm text-gray-400">~</span>
        <InputField
          type="number"
          min="0"
          value={maxValue}
          disabled={metricValue === "all"}
          onChange={(event) => onMaxChange(event.target.value)}
          onKeyDown={onEnter}
          placeholder="999999999"
          className="bg-white px-3"
        />
      </div>
    </div>
  );
}
