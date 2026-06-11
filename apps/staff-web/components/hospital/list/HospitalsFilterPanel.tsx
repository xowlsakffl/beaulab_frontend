import Link from "next/link";
import React from "react";
import type { DateRange } from "react-day-picker";

import { Can } from "@/components/common/guard";
import {
  Button,
  Card,
  CheckboxFilterDropdown,
  DateRangeFilterDropdown,
  InputField,
  SquarePlus,
} from "@beaulab/ui-admin";

import {
  ALLOW_STATUS_OPTIONS,
  DATE_PRESET_OPTIONS,
  HOSPITAL_DEPARTMENT_OPTIONS,
  HOSPITAL_STATUS_OPTIONS,
  type DateFilterKey,
  type DatePresetKey,
  type Filters,
} from "@/lib/hospital/list";

type HospitalsFilterPanelProps = {
  draftFilters: Filters;
  draftDateRange?: DateRange;
  isStatusDropdownOpen: boolean;
  isReviewDropdownOpen: boolean;
  isDepartmentDropdownOpen: boolean;
  isDatePickerOpen: boolean;
  statusDropdownRef: React.RefObject<HTMLDivElement | null>;
  reviewDropdownRef: React.RefObject<HTMLDivElement | null>;
  departmentDropdownRef: React.RefObject<HTMLDivElement | null>;
  datePickerRef: React.RefObject<HTMLDivElement | null>;
  searchInput: string;
  onSearchChange: (value: string) => void;
  onToggleStatusDropdown: () => void;
  onToggleReviewDropdown: () => void;
  onToggleDepartmentDropdown: () => void;
  onToggleDatePicker: () => void;
  onToggleHospitalStatus: (value: string) => void;
  onToggleAllHospitalStatus: () => void;
  onToggleReviewStatus: (value: string) => void;
  onToggleAllReviewStatus: () => void;
  onToggleDepartment: (value: string) => void;
  onToggleAllDepartments: () => void;
  onApplyDateRange: (key: DateFilterKey, nextRange?: DateRange) => void;
  onApplyDatePreset: (key: DateFilterKey, preset: DatePresetKey) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
};

export function HospitalsFilterPanel({
  draftFilters,
  draftDateRange,
  isStatusDropdownOpen,
  isReviewDropdownOpen,
  isDepartmentDropdownOpen,
  isDatePickerOpen,
  statusDropdownRef,
  reviewDropdownRef,
  departmentDropdownRef,
  datePickerRef,
  searchInput,
  onSearchChange,
  onToggleStatusDropdown,
  onToggleReviewDropdown,
  onToggleDepartmentDropdown,
  onToggleDatePicker,
  onToggleHospitalStatus,
  onToggleAllHospitalStatus,
  onToggleReviewStatus,
  onToggleAllReviewStatus,
  onToggleDepartment,
  onToggleAllDepartments,
  onApplyDateRange,
  onApplyDatePreset,
  onApplyFilters,
  onResetFilters,
}: HospitalsFilterPanelProps) {
  const inlineLabelClass = "w-20 shrink-0 whitespace-nowrap text-right text-sm font-medium text-gray-600 ";

  return (
    <Card className="rounded-xl p-3 ">
      <div className="grid grid-cols-1 gap-x-4 gap-y-4 lg:grid-cols-2 2xl:grid-cols-[repeat(4,minmax(15rem,1fr))]">
        <div className="flex min-w-0 items-center gap-4 py-1.5">
          <span className={inlineLabelClass}>기간</span>
          <DateRangeFilterDropdown
            label="기간"
            hideLabel
            containerRef={datePickerRef}
            value={draftFilters.dateRange}
              placeholder="가입일 기준 기간을 선택해 주세요."
            selected={draftDateRange}
            isOpen={isDatePickerOpen}
            presetOptions={DATE_PRESET_OPTIONS}
            onToggleOpen={onToggleDatePicker}
            onSelect={(nextRange) => onApplyDateRange("created", nextRange)}
            onPresetSelect={(presetKey) => onApplyDatePreset("created", presetKey as DatePresetKey)}
            onReset={() => {
              onApplyDateRange("created", undefined);
              onToggleDatePicker();
            }}
            onConfirm={onToggleDatePicker}
          />
        </div>
        <div className="flex min-w-0 items-center gap-4 py-1.5">
          <span className={inlineLabelClass}>분과</span>
          <CheckboxFilterDropdown
            label="분과"
            hideLabel
            containerRef={departmentDropdownRef}
            selectedValues={draftFilters.departments}
            options={HOSPITAL_DEPARTMENT_OPTIONS}
            isOpen={isDepartmentDropdownOpen}
            onToggleOpen={onToggleDepartmentDropdown}
            onToggleValue={onToggleDepartment}
            onToggleAll={onToggleAllDepartments}
          />
        </div>
        <div className="flex min-w-0 items-center gap-4 py-1.5">
          <span className={inlineLabelClass}>회원상태</span>
          <CheckboxFilterDropdown
            label="회원상태"
            hideLabel
            containerRef={statusDropdownRef}
            selectedValues={draftFilters.hospitalStatuses}
            options={HOSPITAL_STATUS_OPTIONS}
            isOpen={isStatusDropdownOpen}
            onToggleOpen={onToggleStatusDropdown}
            onToggleValue={onToggleHospitalStatus}
            onToggleAll={onToggleAllHospitalStatus}
          />
        </div>
        <div className="flex min-w-0 items-center gap-4 py-1.5">
          <span className={inlineLabelClass}>검수상태</span>
          <CheckboxFilterDropdown
            label="검수상태"
            hideLabel
            containerRef={reviewDropdownRef}
            selectedValues={draftFilters.reviewStatuses}
            options={ALLOW_STATUS_OPTIONS}
            isOpen={isReviewDropdownOpen}
            onToggleOpen={onToggleReviewDropdown}
            onToggleValue={onToggleReviewStatus}
            onToggleAll={onToggleAllReviewStatus}
          />
        </div>
        <div className="flex min-w-0 flex-col gap-3 py-1.5 lg:col-span-2 lg:flex-row lg:items-center 2xl:col-span-full">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <span className={inlineLabelClass}>검색</span>
            <div className="min-w-0 flex-1">
              <InputField
                value={searchInput}
                onChange={(event) => onSearchChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    onApplyFilters();
                  }
                }}
                placeholder="HID, 병의원명, 병원아이디를 입력해 주세요."
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
            <Can permission="beaulab.hospital.create">
              <Link href="/hospitals/new">
                <Button type="button" variant="brand" size="sm" className="h-11 px-5">
                  <SquarePlus className="size-5" />
                  <span>병의원 등록</span>
                </Button>
              </Link>
            </Can>
          </div>
        </div>
      </div>
    </Card>
  );
}
