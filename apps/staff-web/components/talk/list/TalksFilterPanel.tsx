import React from "react";

import {
  Button,
  Card,
  CheckboxFilterDropdown,
  DateRangeFilterDropdown,
  InputField,
  Select,
  SingleCheckboxFilterDropdown,
} from "@beaulab/ui-admin";
import type { DateRange } from "react-day-picker";

import {
  DATE_PRESET_OPTIONS,
  TALK_METRIC_OPTIONS,
  TALK_REPORT_STATUS_OPTIONS,
  TALK_VISIBILITY_OPTIONS,
  type DatePresetKey,
  type Filters,
} from "@/lib/talk/list";
import type { CheckboxFilterOption } from "@beaulab/ui-admin";

type TalksFilterPanelProps = {
  board: "talks" | "comments";
  searchInput: string;
  draftFilters: Filters;
  draftDateRange?: DateRange;
  categoryOptions: CheckboxFilterOption[];
  isCategoryDropdownOpen: boolean;
  isDatePickerOpen: boolean;
  categoryDropdownRef: React.RefObject<HTMLDivElement | null>;
  datePickerRef: React.RefObject<HTMLDivElement | null>;
  onSearchChange: (value: string) => void;
  onToggleCategoryDropdown: () => void;
  onToggleDatePicker: () => void;
  onToggleCategory: (value: string) => void;
  onToggleAllCategory: () => void;
  onVisibilityChange: (value: string) => void;
  onReportStatusChange: (value: string) => void;
  onMetricFieldChange: (value: string) => void;
  onMetricMinChange: (value: string) => void;
  onMetricMaxChange: (value: string) => void;
  onApplyDateRange: (nextRange?: DateRange) => void;
  onApplyDatePreset: (preset: DatePresetKey) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
};

export function TalksFilterPanel({
  board,
  searchInput,
  draftFilters,
  draftDateRange,
  categoryOptions,
  isCategoryDropdownOpen,
  isDatePickerOpen,
  categoryDropdownRef,
  datePickerRef,
  onSearchChange,
  onToggleCategoryDropdown,
  onToggleDatePicker,
  onToggleCategory,
  onToggleAllCategory,
  onVisibilityChange,
  onReportStatusChange,
  onMetricFieldChange,
  onMetricMinChange,
  onMetricMaxChange,
  onApplyDateRange,
  onApplyDatePreset,
  onApplyFilters,
  onResetFilters,
}: TalksFilterPanelProps) {
  const isCommentBoard = board === "comments";
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
          <div className={`${filterRowClass} xl:col-span-2`}>
            <span className={inlineLabelClass}>작성일</span>
            <DateRangeFilterDropdown
              label="작성일"
              hideLabel
              containerRef={datePickerRef}
              value={draftFilters.dateRange}
              placeholder="작성일 기간 선택"
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
          <div className={`${filterRowClass} xl:col-span-2`}>
            <span className={inlineLabelClass}>토크유형</span>
            <CheckboxFilterDropdown
              label="토크유형"
              hideLabel
              containerRef={categoryDropdownRef}
              selectedValues={draftFilters.categoryIds}
              options={categoryOptions}
              isOpen={isCategoryDropdownOpen}
              onToggleOpen={onToggleCategoryDropdown}
              onToggleValue={onToggleCategory}
              onToggleAll={onToggleAllCategory}
              emptyLabel="전체"
            />
          </div>
          <div className={`${filterRowClass} xl:col-span-2`}>
            <span className={inlineLabelClass}>공개여부</span>
            <div className="min-w-0 flex-1">
              <SingleCheckboxFilterDropdown
                label="공개여부"
                hideLabel
                value={draftFilters.visibilityStatus}
                options={TALK_VISIBILITY_OPTIONS}
                onChange={onVisibilityChange}
              />
            </div>
          </div>
          <div className={`${filterRowClass} xl:order-4 xl:col-span-2`}>
            <span className={inlineLabelClass}>상태</span>
            <div className="min-w-0 flex-1">
              <SingleCheckboxFilterDropdown
                label="상태"
                hideLabel
                value={draftFilters.reportStatus}
                options={TALK_REPORT_STATUS_OPTIONS}
                onChange={onReportStatusChange}
              />
            </div>
          </div>

          <div className={`${filterRowClass} xl:order-5 md:col-span-2 xl:col-span-3`}>
            <span className={inlineLabelClass}>{isCommentBoard ? "좋아요 수" : "지표"}</span>
            <div
              className={
                isCommentBoard
                  ? "grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2"
                  : "grid min-w-0 flex-1 grid-cols-[minmax(7rem,0.9fr)_minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2"
              }
            >
              {!isCommentBoard && (
                <div className="min-w-0">
                  <Select
                    value={draftFilters.metricField}
                    options={TALK_METRIC_OPTIONS}
                    showPlaceholderOption={false}
                    onChange={onMetricFieldChange}
                    className="h-11 px-4"
                  />
                </div>
              )}
              <div className="min-w-0">
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
                  className="bg-white px-3"
                  error={isMetricRangeInvalid}
                />
              </div>
            </div>
          </div>
          <div className="flex min-w-0 flex-col gap-3 py-1.5 xl:order-6 md:col-span-2 xl:col-span-5 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span className={inlineLabelClass}>검색</span>
              <div className="min-w-0 flex-1">
                <InputField
                  value={searchInput}
                  onChange={(event) => onSearchChange(event.target.value)}
                  onKeyDown={handleEnterToSearch}
                  placeholder={isCommentBoard ? "댓글 내용, 토크 제목, 닉네임 검색" : "제목, 내용, 닉네임 검색"}
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
        </div>
        {isMetricRangeInvalid ? (
          <p className="text-right text-xs text-error-500">지표 최대값은 최소값 이상이어야 합니다.</p>
        ) : null}
      </div>
    </Card>
  );
}
