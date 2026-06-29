"use client";

import React from "react";
import type { CategorySelectorItem, CategorySelectorLoadParams } from "@beaulab/ui-admin";
import {
  Card,
  FormCheckbox,
  HierarchicalCategorySelector,
  InputField,
  Label,
  Select,
  SpinnerBlock,
} from "@beaulab/ui-admin";

import { useDoctorHospitalOptions } from "@/hooks/doctor/useDoctorHospitalOptions";
import type { HospitalEventCachedCategoryItem } from "@/hooks/hospital-event/useHospitalEventCategorySelection";
import type { DoctorHospitalOption } from "@/lib/doctor/form";
import { HOSPITAL_EVENT_CATEGORY_SECTIONS, type HospitalEventFormValues } from "@/lib/hospital-event/form";
import type { VideoDoctorOption } from "@/lib/video/form";

const cardClassName = "rounded-xl border border-gray-200 bg-white p-5";
const labelClassName = "text-xs font-semibold text-gray-500";
const inputClassName = "h-9 bg-white px-3 text-sm";

export function HospitalPickerCard({
  selectedHospital,
  error,
  onSelectHospital,
  onClearHospital,
}: {
  selectedHospital: DoctorHospitalOption | null;
  error?: string;
  onSelectHospital: (hospital: DoctorHospitalOption) => void;
  onClearHospital: () => void;
}) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const [query, setQuery] = React.useState(selectedHospital?.name ?? "");
  const { options, isLoading, error: loadError } = useDoctorHospitalOptions(isOpen, query);
  const visibleOptions = options.slice(0, 3);

  React.useEffect(() => {
    if (selectedHospital?.name) {
      setQuery(selectedHospital.name);
    }
  }, [selectedHospital?.id, selectedHospital?.name]);

  React.useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isOpen]);

  return (
    <Card className={cardClassName}>
      <div className="grid grid-cols-[5rem_minmax(0,1fr)] items-start gap-x-2 gap-y-1" data-field-target="hospital_id" tabIndex={-1}>
        <Label className={`${labelClassName} flex h-9 items-center`}>
          병의원<span className="ml-0.5 text-brand-500">*</span>
        </Label>
        <div ref={containerRef} className="relative min-w-0">
          <InputField
            value={query}
            onClick={() => setIsOpen(true)}
            onChange={(event) => {
              const nextQuery = event.target.value;
              setQuery(nextQuery);
              if (selectedHospital && nextQuery !== selectedHospital.name) {
                onClearHospital();
              }
              setIsOpen(true);
            }}
            placeholder="병의원명을 검색해 주세요."
            error={Boolean(error)}
            className={inputClassName}
          />
          {isOpen ? (
            <Card className="absolute left-0 right-0 top-full z-[80] mt-2 max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
              {isLoading ? (
                <div className="py-5">
                  <SpinnerBlock className="min-h-0" spinnerClassName="size-5" label="병의원 검색 중" />
                </div>
              ) : loadError ? (
                <p className="px-3 py-4 text-sm text-error-500">{loadError}</p>
              ) : visibleOptions.length === 0 ? (
                <p className="px-3 py-4 text-sm text-gray-500">검색 결과가 없습니다.</p>
              ) : (
                <div className="space-y-1">
                  {visibleOptions.map((hospital) => (
                    <button
                      key={hospital.id}
                      type="button"
                      onClick={() => {
                        onSelectHospital(hospital);
                        setQuery(hospital.name);
                        setIsOpen(false);
                      }}
                      className="w-full rounded-lg px-3 py-2 text-left hover:bg-brand-50"
                    >
                      <span className="block truncate text-sm font-semibold text-gray-800">{hospital.name}</span>
                      <span className="block truncate text-xs text-gray-500">
                        HID {hospital.id} · 사업자등록번호 {hospital.business_number?.trim() || "-"}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </Card>
          ) : null}
        </div>
        {error ? <p className="col-start-2 text-xs text-error-500">{error}</p> : null}
      </div>
    </Card>
  );
}

export function CategoryDoctorPickerCard({
  selectedIds,
  selectedItems,
  primaryCategoryId,
  activeSectionKey,
  isMaleTargeted,
  error,
  primaryError,
  loadCategories,
  onToggleCategory,
  onSectionChangeRequest,
  onPrimaryCategoryChange,
  onMaleTargetedChange,
  hospitalId,
  doctors,
  isLoading,
  loadError,
  assignments,
  onSelectDoctor,
}: {
  selectedIds: number[];
  selectedItems: HospitalEventCachedCategoryItem[];
  primaryCategoryId: number | null;
  activeSectionKey: string;
  isMaleTargeted: boolean;
  error?: string;
  primaryError?: string;
  loadCategories: (params: CategorySelectorLoadParams) => Promise<CategorySelectorItem[]>;
  onToggleCategory: (categoryId: number, checked: boolean) => void;
  onSectionChangeRequest: (sectionKey: string, currentSectionKey: string) => boolean;
  onPrimaryCategoryChange: (value: string) => void;
  onMaleTargetedChange: (checked: boolean) => void;
  hospitalId: number | null;
  doctors: VideoDoctorOption[];
  isLoading: boolean;
  loadError: string | null;
  assignments: HospitalEventFormValues["doctor_assignments"];
  onSelectDoctor: (index: number, doctor: VideoDoctorOption | null) => void;
}) {
  const selectedDoctorIds = new Set(assignments.map((assignment) => assignment.hospital_doctor_id).filter(Boolean));
  const visibleAssignments = doctors.length > 0 ? assignments.slice(0, Math.min(3, doctors.length)) : [];
  const optionsForSlot = (currentId: number | null) => [
    { value: "", label: !hospitalId ? "병의원을 먼저 선택해 주세요." : isLoading ? "의료진 불러오는 중" : "의료진을 선택해 주세요." },
    ...doctors
      .filter((doctor) => !selectedDoctorIds.has(doctor.id) || doctor.id === currentId)
      .map((doctor) => ({ value: String(doctor.id), label: doctor.name })),
  ];

  return (
    <Card className={cardClassName} data-field-target="category_ids" tabIndex={-1}>
      <HierarchicalCategorySelector
        sections={HOSPITAL_EVENT_CATEGORY_SECTIONS}
        selectedIds={selectedIds}
        selectedItems={selectedItems}
        primaryCategoryId={primaryCategoryId}
        activeSectionKey={activeSectionKey}
        onSectionChangeRequest={onSectionChangeRequest}
        onPrimaryCategoryChange={(categoryId) => onPrimaryCategoryChange(String(categoryId))}
        onToggleCategory={onToggleCategory}
        loadCategories={loadCategories}
        error={error}
        primaryError={primaryError}
        errorPlacement="header"
        initialSectionKey="surgery"
        sectionTabsPlacement="header"
        compactSectionTabs
        searchMode="dropdown"
        showSearchTitle={false}
        showDirectTitle={false}
        selectionMode="leaf-click"
        selectedDisplay="input"
        searchDepth={3}
        searchInputClassName="h-9"
        columnHeightClassName="h-[232px]"
        headerTitle={<h3 className="text-sm font-bold text-gray-900">카테고리 설정</h3>}
        afterColumns={
          <div className="flex items-center gap-4 pt-1">
            <FormCheckbox checked={isMaleTargeted} onChange={onMaleTargetedChange} label="남자성형 이벤트" className="size-4 rounded-sm" />
            <span className="text-xs text-gray-500">남성 대상 이벤트일 경우만 선택해주세요.</span>
          </div>
        }
        text={{
          selectedTitle: "선택한 소카테고리",
          primaryTitle: "대표 카테고리 선택",
          selectedPlaceholder: "소카테고리를 선택해 주세요.",
          primaryPlaceholder: "대표 카테고리를 선택해 주세요.",
        }}
      />

      <div className="mt-6 border-t border-gray-200 pt-5">
        <h3 className="text-sm font-bold text-gray-900">의료진 선택</h3>
      </div>
      {visibleAssignments.length > 0 ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {visibleAssignments.map((assignment, index) => (
            <Select
              key={index}
              value={assignment.hospital_doctor_id ? String(assignment.hospital_doctor_id) : ""}
              options={optionsForSlot(assignment.hospital_doctor_id)}
              showPlaceholderOption={false}
              disabled={!hospitalId || isLoading}
              onChange={(value) => {
                const matched = doctors.find((doctor) => String(doctor.id) === value) ?? null;
                onSelectDoctor(index, matched);
              }}
              className="h-10 px-3"
            />
          ))}
        </div>
      ) : (
        <div className="mt-3 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-400">
          {!hospitalId ? "병의원을 먼저 선택해 주세요." : isLoading ? "의료진을 불러오는 중입니다." : "선택 가능한 의료진이 없습니다."}
        </div>
      )}
      {loadError ? <p className="mt-2 text-xs text-error-500">{loadError}</p> : null}
      <div className="mt-4 rounded-xl bg-gray-50 px-3 py-3 text-xs leading-5 text-gray-600">
        이벤트 접수는 병의원 기준 3시간 정도 소요될 수 있습니다.
        <br />
        이벤트명 및 지정한 카테고리를 등록 후 검수 단계에서 운영자에 의해 변경될 수 있습니다.
      </div>
    </Card>
  );
}
