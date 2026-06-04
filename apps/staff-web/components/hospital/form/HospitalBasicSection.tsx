import React from "react";

import {
  Button,
  FormTextArea,
  InputField,
  Label,
  Select,
  SpinnerBlock,
  type CategorySelectorItem,
  type CategorySelectorLoadParams,
} from "@beaulab/ui-admin";

import {
  CATEGORY_SECTIONS,
  HOSPITAL_CATEGORY_MAX_SELECTION,
  HOSPITAL_ALLOW_STATUS_OPTIONS,
  HOSPITAL_STATUS_OPTIONS,
  type HospitalAddressDetailField,
  type HospitalAddressField,
  type HospitalFormErrors,
  type HospitalFormValues,
} from "@/lib/hospital/form";
import type { HospitalCategoryItem, HospitalFeatureItem } from "@/lib/hospital/detail";

type HospitalBasicSectionProps = {
  mode: "create" | "edit";
  form: HospitalFormValues;
  errors: HospitalFormErrors;
  daumPostcodeError: string | null;
  hospitalFeatures: HospitalFeatureItem[];
  selectedCategoryItems?: HospitalCategoryItem[];
  isHospitalFeaturesLoading: boolean;
  hospitalFeaturesError: string | null;
  loadCategories: (params: CategorySelectorLoadParams) => Promise<CategorySelectorItem[]>;
  onToggleCategory: (categoryId: number, checked: boolean) => void;
  onToggleFeature: (featureId: number, checked: boolean) => void;
  onOpenAddressSearch: (field: HospitalAddressField, detailFieldId: HospitalAddressDetailField) => Promise<void>;
  onFieldChange: (key: keyof HospitalFormValues, value: HospitalFormValues[keyof HospitalFormValues]) => void;
  onNameChange?: (value: string) => void;
  onNameBlur?: (value: string) => void;
};

export function HospitalBasicSection({
  mode,
  form,
  errors,
  daumPostcodeError,
  hospitalFeatures,
  selectedCategoryItems,
  isHospitalFeaturesLoading,
  hospitalFeaturesError,
  loadCategories,
  onToggleCategory,
  onToggleFeature,
  onOpenAddressSearch,
  onFieldChange,
  onNameChange,
  onNameBlur,
}: HospitalBasicSectionProps) {
  const isCreate = mode === "create";

  return (
    <section className="space-y-6 pb-6">
      <input type="hidden" name="latitude" value={form.latitude} readOnly />
      <input type="hidden" name="longitude" value={form.longitude} readOnly />

      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-gray-800 ">기본 정보</h3>
        <p className="text-xs text-gray-500 ">
          {isCreate ? "병의원의 기본 정보를 입력해 주세요." : "병의원의 기본 정보를 수정합니다."}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">{isCreate ? "병의원명 *" : "병의원명"}</Label>
        <InputField
          id="name"
          name="name"
          placeholder="병의원명을 입력해 주세요."
          value={form.name}
          onChange={(event) => {
            if (!isCreate) return;
            onNameChange?.(event.target.value);
          }}
          onBlur={(event) => onNameBlur?.(event.target.value)}
          error={Boolean(errors.name)}
          hint={errors.name}
          readOnly={!isCreate}
          disabled={!isCreate}
          className={!isCreate ? "bg-gray-100 text-gray-500  " : undefined}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="tel">대표 번호</Label>
          <InputField
            id="tel"
            name="tel"
            placeholder="예: 02-1234-5678"
            value={form.tel}
            onChange={(event) => onFieldChange("tel", event.target.value)}
            error={Boolean(errors.tel)}
            hint={errors.tel}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">대표 이메일</Label>
          <InputField
            id="email"
            name="email"
            type="email"
            placeholder="예: hello@beaulab.co.kr"
            value={form.email}
            onChange={(event) => onFieldChange("email", event.target.value)}
            error={Boolean(errors.email)}
            hint={errors.email}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="status">{isCreate ? "운영 상태 *" : "상태 *"}</Label>
          <Select
            id="status"
            name="status"
            value={form.status}
            options={[...HOSPITAL_STATUS_OPTIONS]}
            placeholder="상태를 선택해 주세요."
            onChange={(value: string) => onFieldChange("status", value)}
            className="h-11 w-full px-4"
          />
          {errors.status ? <p className="text-xs text-error-500">{errors.status}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="allow_status">검수 상태 *</Label>
          <Select
            id="allow_status"
            name="allow_status"
            value={form.allow_status}
            options={[...HOSPITAL_ALLOW_STATUS_OPTIONS]}
            placeholder="검수 상태를 선택해 주세요."
            onChange={(value: string) => onFieldChange("allow_status", value)}
            className="h-11 w-full px-4"
          />
          {errors.allow_status ? <p className="text-xs text-error-500">{errors.allow_status}</p> : null}
        </div>
      </div>

      {form.status === "SUSPENDED" || form.status === "WITHDRAWN" ? (
        <div className="space-y-2">
          <Label htmlFor="status_change_reason">운영중지/탈퇴 사유 *</Label>
          <FormTextArea
            id="status_change_reason"
            name="status_change_reason"
            placeholder="운영중지 또는 탈퇴 사유를 입력해 주세요."
            rows={3}
            value={form.statusChangeReason}
            onChange={(value) => onFieldChange("statusChangeReason", value)}
            error={Boolean(errors.statusChangeReason)}
            hint={errors.statusChangeReason}
          />
        </div>
      ) : null}

      <div className="space-y-2">
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-gray-700 ">진료과목</h4>
          <p className="text-xs text-gray-500 ">
            성형/시술 대분류만 최대 5개까지 선택할 수 있습니다.
          </p>
        </div>
        <HospitalCategoryBadgeSelector
          selectedIds={form.category_ids}
          selectedItems={selectedCategoryItems}
          error={errors.category_ids}
          loadCategories={loadCategories}
          onToggleCategory={onToggleCategory}
        />
      </div>

      <HospitalFeatureSelector
        features={hospitalFeatures}
        selectedIds={form.feature_ids}
        error={errors.feature_ids}
        isLoading={isHospitalFeaturesLoading}
        loadError={hospitalFeaturesError}
        onToggleFeature={onToggleFeature}
      />

      <div className="space-y-2">
        <Label>병의원 주소</Label>
        <div className="grid grid-cols-[minmax(0,1fr)_104px] gap-2">
          <div className="min-w-0">
            <InputField
              id="address"
              name="address"
              placeholder="주소 검색 버튼으로 주소를 선택해 주세요."
              value={form.address}
              readOnly
              onClick={() => void onOpenAddressSearch("address", "address_detail")}
              onKeyDown={(event) => {
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                void onOpenAddressSearch("address", "address_detail");
              }}
              error={Boolean(errors.address)}
              hint={errors.address}
              className="cursor-pointer bg-gray-50 text-gray-600  "
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => void onOpenAddressSearch("address", "address_detail")}
            className="h-11 w-full shrink-0 border-brand-500 px-4 text-brand-500 hover:bg-gray-100"
          >
            주소 검색
          </Button>
        </div>
        {daumPostcodeError ? (
          <p className="text-xs text-error-500">카카오 주소 검색을 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.</p>
        ) : null}
        <InputField
          id="address_detail"
          name="address_detail"
          placeholder="상세 주소"
          value={form.address_detail}
          onChange={(event) => onFieldChange("address_detail", event.target.value)}
          error={Boolean(errors.address_detail)}
          hint={errors.address_detail}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">병의원 소개</Label>
        <FormTextArea
          id="description"
          name="description"
          placeholder="간단한 소개를 입력해 주세요."
          rows={4}
          value={form.description}
          onChange={(value) => onFieldChange("description", value)}
          error={Boolean(errors.description)}
          hint={errors.description}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="consulting_hours">운영 시간</Label>
        <FormTextArea
          id="consulting_hours"
          name="consulting_hours"
          placeholder="예: 평일 10:00~19:00 / 토 10:00~15:00"
          rows={3}
          value={form.consulting_hours}
          onChange={(value) => onFieldChange("consulting_hours", value)}
          error={Boolean(errors.consulting_hours)}
          hint={errors.consulting_hours}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="direction">찾아오는 길</Label>
        <FormTextArea
          id="direction"
          name="direction"
          placeholder="예: 2호선 강남역 3번 출구에서 도보 5분"
          rows={3}
          value={form.direction}
          onChange={(value) => onFieldChange("direction", value)}
          error={Boolean(errors.direction)}
          hint={errors.direction}
        />
      </div>
    </section>
  );
}

function HospitalFeatureSelector({
  features,
  selectedIds,
  error,
  isLoading = false,
  loadError,
  onToggleFeature,
}: {
  features: HospitalFeatureItem[];
  selectedIds: number[];
  error?: string;
  isLoading?: boolean;
  loadError?: string | null;
  onToggleFeature: (featureId: number, checked: boolean) => void;
}) {
  return (
    <div className="space-y-2" data-field-target="feature_ids" tabIndex={-1}>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-gray-800 ">
          병의원정보 <span className="text-error-500">*</span>
        </p>
      </div>

      <div className="outline-none">
        {isLoading ? (
          <SpinnerBlock className="min-h-24" spinnerClassName="size-7" label="병의원 특징 불러오는 중" />
        ) : loadError ? (
          <p className="text-sm text-error-500">{loadError}</p>
        ) : features.length === 0 ? (
          <p className="text-sm text-gray-500 ">등록된 병의원 특징이 없습니다.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {features.map((feature) => (
              <BadgeToggleButton
                key={feature.id}
                label={feature.name}
                selected={selectedIds.includes(feature.id)}
                onClick={() => onToggleFeature(feature.id, !selectedIds.includes(feature.id))}
              />
            ))}
          </div>
        )}
      </div>

      {error ? <p className="text-xs text-error-500">{error}</p> : null}
    </div>
  );
}

function HospitalCategoryBadgeSelector({
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
  const [sections, setSections] = React.useState<
    Array<{
      key: string;
      label: string;
      items: CategorySelectorItem[];
      isLoading: boolean;
      error: string | null;
    }>
  >(() =>
    CATEGORY_SECTIONS.map((section) => ({
      key: section.key,
      label: section.label,
      items: [],
      isLoading: true,
      error: null,
    })),
  );

  React.useEffect(() => {
    let isMounted = true;

    setSections((prev) =>
      prev.map((section) => ({
        ...section,
        isLoading: true,
        error: null,
      })),
    );

    void Promise.all(
      CATEGORY_SECTIONS.map(async (section) => {
        try {
          const items = await loadCategories({ section });

          return {
            key: section.key,
            label: section.label,
            items,
            isLoading: false,
            error: null,
          };
        } catch (nextError) {
          return {
            key: section.key,
            label: section.label,
            items: [],
            isLoading: false,
            error: nextError instanceof Error && nextError.message ? nextError.message : "진료과목을 불러오지 못했습니다.",
          };
        }
      }),
    ).then((nextSections) => {
      if (!isMounted) return;
      setSections(nextSections);
    });

    return () => {
      isMounted = false;
    };
  }, [loadCategories]);

  const fallbackSelectedItems = React.useMemo(() => {
    const loadedIds = new Set(sections.flatMap((section) => section.items.map((item) => item.id)));

    return selectedItems?.filter((item) => selectedIds.includes(item.id) && !loadedIds.has(item.id)) ?? [];
  }, [sections, selectedIds, selectedItems]);

  return (
    <div className="space-y-3" data-field-target="category_ids" tabIndex={-1}>
      {sections.map((section) => (
        <div key={section.key} className="space-y-2">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold text-gray-500">{section.label}</p>
            {section.isLoading ? <span className="text-xs text-gray-400">불러오는 중</span> : null}
          </div>

          {section.error ? (
            <p className="text-sm text-error-500">{section.error}</p>
          ) : section.items.length === 0 && !section.isLoading ? (
            <p className="text-sm text-gray-500">선택 가능한 대분류가 없습니다.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {section.items.map((item) => (
                <BadgeToggleButton
                  key={item.id}
                  label={item.name}
                  selected={selectedIds.includes(item.id)}
                  onClick={() => onToggleCategory(item.id, !selectedIds.includes(item.id))}
                />
              ))}
            </div>
          )}
        </div>
      ))}

      {fallbackSelectedItems.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {fallbackSelectedItems.map((item) => (
            <BadgeToggleButton
              key={item.id}
              label={item.name}
              selected
              onClick={() => onToggleCategory(item.id, false)}
            />
          ))}
        </div>
      ) : null}

      <p className="text-xs text-gray-500">
        선택 {selectedIds.length}/{HOSPITAL_CATEGORY_MAX_SELECTION}
      </p>
      {error ? <p className="text-xs text-error-500">{error}</p> : null}
    </div>
  );
}

function BadgeToggleButton({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`inline-flex min-h-8 items-center rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
        selected
          ? "bg-brand-50 text-brand-700 ring-brand-200 hover:bg-brand-100 focus-visible:ring-brand-300"
          : "bg-gray-100 text-gray-700 ring-gray-200 hover:bg-gray-200 focus-visible:ring-gray-300"
      }`}
    >
      {label}
    </button>
  );
}
