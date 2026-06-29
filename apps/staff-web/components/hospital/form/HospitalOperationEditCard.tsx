"use client";

import React from "react";
import {
  Card,
  ChevronDown,
  FormCheckbox,
  FormTextArea,
  Label,
  Select,
  SpinnerBlock,
  X,
  type CategorySelectorItem,
  type CategorySelectorLoadParams,
} from "@beaulab/ui-admin";

import { HOSPITAL_DEPARTMENT_OPTIONS } from "@/lib/hospital/list";
import { type HospitalCategoryItem, type HospitalFeatureItem } from "@/lib/hospital/detail";
import {
  CATEGORY_SECTIONS,
  HOSPITAL_CATEGORY_MAX_SELECTION,
  type HospitalFormErrors,
  type HospitalFormValues,
  type HospitalOperationDayKey,
  type HospitalOperationHoursFormValues,
} from "@/lib/hospital/form";

const cardClassName = "rounded-xl border border-gray-200 bg-white p-5";

const operationDayLabels: Array<[HospitalOperationDayKey, string]> = [
  ["mon", "월"],
  ["tue", "화"],
  ["wed", "수"],
  ["thu", "목"],
  ["fri", "금"],
  ["sat", "토"],
  ["sun", "일"],
];

const timeOptions = Array.from({ length: 48 }, (_, index) => {
  const minutes = index * 30;
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const value = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

  return { value, label: value };
});

function TimeSelect({
  id,
  label,
  value,
  disabled,
  options = timeOptions,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  disabled?: boolean;
  options?: typeof timeOptions;
  onChange: (value: string) => void;
}) {
  return (
    <>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Select
        id={id}
        name={id}
        value={value}
        placeholder="시간"
        options={options}
        onChange={onChange}
        disabled={disabled}
        className="h-9 bg-white px-3 py-1.5 pr-8 text-xs"
      />
    </>
  );
}

function endTimeOptions(startTime: string) {
  const startMinutes = timeToMinutes(startTime);

  if (startMinutes === null) return timeOptions;

  return timeOptions.filter((option) => {
    const optionMinutes = timeToMinutes(option.value);

    return optionMinutes !== null && optionMinutes >= startMinutes;
  });
}

function isBeforeTime(value: string, baseValue: string) {
  const valueMinutes = timeToMinutes(value);
  const baseMinutes = timeToMinutes(baseValue);

  if (valueMinutes === null || baseMinutes === null) return false;

  return valueMinutes < baseMinutes;
}

function timeToMinutes(value: string) {
  const match = /^(\d{2}):([0-5]\d)$/.exec(value);

  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (hour < 0 || hour > 23) return null;

  return hour * 60 + minute;
}

export function HospitalOperationEditCard({
  form,
  errors,
  selectedCategoryItems,
  hospitalFeatures,
  isHospitalFeaturesLoading,
  hospitalFeaturesError,
  onFieldChange,
  loadCategories,
  onToggleCategory,
  onToggleFeature,
}: {
  form: HospitalFormValues;
  errors: HospitalFormErrors;
  selectedCategoryItems?: HospitalCategoryItem[];
  hospitalFeatures: HospitalFeatureItem[];
  isHospitalFeaturesLoading: boolean;
  hospitalFeaturesError: string | null;
  onFieldChange: (key: keyof HospitalFormValues, value: HospitalFormValues[keyof HospitalFormValues]) => void;
  loadCategories: (params: CategorySelectorLoadParams) => Promise<CategorySelectorItem[]>;
  onToggleCategory: (categoryId: number, checked: boolean) => void;
  onToggleFeature: (featureId: number, checked: boolean) => void;
}) {
  const updateOperationHours = (
    dayKey: HospitalOperationDayKey,
    patch: Partial<HospitalOperationHoursFormValues[HospitalOperationDayKey]>,
  ) => {
    onFieldChange("operation_hours", {
      ...form.operation_hours,
      [dayKey]: {
        ...form.operation_hours[dayKey],
        ...patch,
      },
    });
  };

  const updateStartTime = (dayKey: HospitalOperationDayKey, start: string) => {
    const currentEnd = form.operation_hours[dayKey].end;

    updateOperationHours(dayKey, {
      start,
      end: isBeforeTime(currentEnd, start) ? start : currentEnd,
    });
  };

  return (
    <Card className={cardClassName}>
      <h3 className="mb-5 text-sm font-bold text-gray-900">운영정보</h3>
      <div className="grid grid-cols-[minmax(14rem,0.8fr)_minmax(16rem,1fr)_minmax(18rem,1fr)_minmax(24rem,1.3fr)] gap-10">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="department">분과</Label>
            <Select
              id="department"
              name="department"
              value={form.department}
              placeholder="병의원 분과를 선택해 주세요."
              options={HOSPITAL_DEPARTMENT_OPTIONS}
              onChange={(value) => onFieldChange("department", value)}
              className="h-9 bg-white px-3 py-1.5"
            />
            {errors.department ? <p className="text-xs text-error-500">{errors.department}</p> : null}
          </div>

          <HospitalCategorySelect
            selectedIds={form.category_ids}
            selectedItems={selectedCategoryItems}
            error={errors.category_ids}
            loadCategories={loadCategories}
            onToggleCategory={onToggleCategory}
          />
        </div>

        <HospitalFeatureCheckboxes
          features={hospitalFeatures}
          selectedIds={form.feature_ids}
          error={errors.feature_ids}
          isLoading={isHospitalFeaturesLoading}
          loadError={hospitalFeaturesError}
          onToggleFeature={onToggleFeature}
        />

        <div className="space-y-2">
          <Label htmlFor="description">병의원소개</Label>
          <FormTextArea
            id="description"
            name="description"
            value={form.description}
            placeholder="병의원 소개를 입력해 주세요."
            onChange={(value) => onFieldChange("description", value)}
            error={Boolean(errors.description)}
            hint={errors.description}
            rows={9}
          />
        </div>

        <div className="space-y-5">
          <div id="operation_hours" className="space-y-2">
            <Label>
              진료시간
              <RequiredMark />
            </Label>
            <div className="space-y-2">
              {operationDayLabels.map(([dayKey, dayLabel]) => {
                const item = form.operation_hours[dayKey];

                return (
                  <div key={dayKey} className="grid grid-cols-[1.5rem_6.75rem_1rem_6.75rem_auto] items-center gap-2">
                    <span className="text-sm font-semibold text-gray-700">{dayLabel}</span>
                    <TimeSelect
                      id={`operation-hours-${dayKey}-start`}
                      label={`${dayLabel} 시작 시간`}
                      value={item.start}
                      disabled={item.is_closed}
                      onChange={(value) => updateStartTime(dayKey, value)}
                    />
                    <span className="text-center text-sm text-gray-500">~</span>
                    <TimeSelect
                      id={`operation-hours-${dayKey}-end`}
                      label={`${dayLabel} 종료 시간`}
                      value={item.end}
                      disabled={item.is_closed}
                      options={endTimeOptions(item.start)}
                      onChange={(value) => updateOperationHours(dayKey, { end: value })}
                    />
                    <div className="w-fit justify-self-start">
                      <FormCheckbox
                        checked={item.is_closed}
                        onChange={(checked) => updateOperationHours(dayKey, { is_closed: checked })}
                        label="진료안함"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            {errors.operation_hours ? <p className="text-xs text-error-500">{errors.operation_hours}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="direction">오시는 길</Label>
            <FormTextArea
              id="direction"
              name="direction"
              value={form.direction}
              placeholder="대중교통, 주차, 건물 위치 등 오시는 길을 입력해 주세요."
              onChange={(value) => onFieldChange("direction", value)}
              error={Boolean(errors.direction)}
              hint={errors.direction}
              rows={3}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}

function HospitalCategorySelect({
  selectedIds,
  selectedItems,
  error,
  loadCategories,
  onToggleCategory,
}: {
  selectedIds: number[];
  selectedItems?: HospitalCategoryItem[];
  error?: string;
  loadCategories: (params: CategorySelectorLoadParams) => Promise<CategorySelectorItem[]>;
  onToggleCategory: (categoryId: number, checked: boolean) => void;
}) {
  const [options, setOptions] = React.useState<Array<{ value: string; label: string }>>([]);
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    setIsLoading(true);
    void Promise.all(
      CATEGORY_SECTIONS.map(async (section) => {
        const items = await loadCategories({ section });
        return items.map((item) => ({
          value: String(item.id),
          label: item.name,
        }));
      }),
    )
      .then((groups) => {
        if (!isMounted) return;
        setOptions(groups.flat());
        setLoadError(null);
      })
      .catch(() => {
        if (!isMounted) return;
        setLoadError("진료과목을 불러오지 못했습니다.");
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [loadCategories]);

  React.useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isOpen]);

  const selectedLabels = selectedIds.map((id) => {
    const option = options.find((item) => item.value === String(id));
    const fallback = selectedItems?.find((item) => item.id === id);
    return {
      id,
      label: option?.label ?? fallback?.name ?? String(id),
    };
  });
  return (
    <div ref={containerRef} className="space-y-2" data-field-target="category_ids" tabIndex={-1}>
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor="category_selector" className="mb-0">
          진료과목 <span className="text-xs text-gray-500">(최대 {HOSPITAL_CATEGORY_MAX_SELECTION}개)</span>
        </Label>
        <span className="text-xs text-gray-500">
          선택 {selectedIds.length}/{HOSPITAL_CATEGORY_MAX_SELECTION}
        </span>
      </div>
      <div className={["min-h-20 rounded-xl border bg-white p-2", error ? "border-error-500" : "border-gray-200"].join(" ")}>
        {selectedLabels.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {selectedLabels.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onToggleCategory(item.id, false)}
                className="inline-flex max-w-full items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-600"
              >
                <span className="truncate">{item.label}</span>
                <X className="size-3 shrink-0" />
              </button>
            ))}
          </div>
        ) : (
          <span className="px-1 py-2 text-sm text-gray-400">선택된 진료과목이 없습니다.</span>
        )}
      </div>
      <div className="relative">
        <button
          id="category_selector"
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex h-9 w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700"
        >
          전체
          <ChevronDown className="size-4 text-gray-500" />
        </button>

        {isOpen ? (
          <Card className="absolute left-0 right-0 top-full z-[80] mt-2 max-h-72 overflow-y-auto rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
            {isLoading ? (
              <div className="py-5">
                <SpinnerBlock className="min-h-0" spinnerClassName="size-5" label="진료과목 불러오는 중" />
              </div>
            ) : options.length === 0 ? (
              <p className="px-3 py-4 text-sm text-gray-500">선택 가능한 진료과목이 없습니다.</p>
            ) : (
              <div className="space-y-1">
                {options.map((option) => {
                  const categoryId = Number(option.value);
                  const isSelected = selectedIds.includes(categoryId);

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        if (!Number.isFinite(categoryId)) return;
                        if (isSelected) {
                          onToggleCategory(categoryId, false);
                          return;
                        }
                        if (selectedIds.length >= HOSPITAL_CATEGORY_MAX_SELECTION) return;
                        onToggleCategory(categoryId, true);
                      }}
                      className={[
                        "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm",
                        isSelected ? "bg-brand-50 font-semibold text-brand-700" : "text-gray-700 hover:bg-gray-50",
                      ].join(" ")}
                    >
                      <span>{option.label}</span>
                      {isSelected ? <span className="text-xs">선택됨</span> : null}
                    </button>
                  );
                })}
              </div>
            )}
          </Card>
        ) : null}
      </div>
      {loadError ? <p className="text-xs text-error-500">{loadError}</p> : null}
      {error ? <p className="text-xs text-error-500">{error}</p> : null}
    </div>
  );
}

function HospitalFeatureCheckboxes({
  features,
  selectedIds,
  error,
  isLoading,
  loadError,
  onToggleFeature,
}: {
  features: HospitalFeatureItem[];
  selectedIds: number[];
  error?: string;
  isLoading: boolean;
  loadError: string | null;
  onToggleFeature: (featureId: number, checked: boolean) => void;
}) {
  return (
    <div className="space-y-3" data-field-target="feature_ids" tabIndex={-1}>
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm text-gray-900">
          병의원정보
          <RequiredMark />
        </p>
        {error ? <p className="text-xs text-error-500">{error}</p> : null}
      </div>
      <div className="rounded-xl bg-white p-5">
        {isLoading ? (
          <p className="text-sm text-gray-500">불러오는 중</p>
        ) : loadError ? (
          <p className="text-sm text-error-500">{loadError}</p>
        ) : (
          <div className="grid grid-cols-2 gap-x-5 gap-y-5">
            {features.map((feature) => (
              <div key={feature.id} className="w-fit justify-self-start">
                <FormCheckbox
                  checked={selectedIds.includes(feature.id)}
                  onChange={(checked) => onToggleFeature(feature.id, checked)}
                  label={feature.name}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RequiredMark() {
  return <span className="text-error-500">*</span>;
}
