import React from "react";

import {
  Button,
  FormTextArea,
  HierarchicalCategorySelector,
  InputField,
  Label,
  Select,
  SpinnerBlock,
  TogglePillGroup,
  type CategorySelectorItem,
  type CategorySelectorLoadParams,
  type TogglePillOption,
} from "@beaulab/ui-admin";

import {
  CATEGORY_SECTIONS,
  HOSPITAL_ALLOW_STATUS_OPTIONS,
  HOSPITAL_STATUS_OPTIONS,
  type HospitalAddressDetailField,
  type HospitalAddressField,
  type HospitalCategoryItem,
  type HospitalFeatureItem,
  type HospitalFormErrors,
  type HospitalFormValues,
} from "@/lib/hospital/form";

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
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">기본 정보</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
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
          className={!isCreate ? "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400" : undefined}
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
          <Label htmlFor="allow_status">검수상태 *</Label>
          <Select
            id="allow_status"
            name="allow_status"
            value={form.allow_status}
            options={[...HOSPITAL_ALLOW_STATUS_OPTIONS]}
            placeholder="검수상태를 선택해 주세요."
            onChange={(value: string) => onFieldChange("allow_status", value)}
            className="h-11 w-full px-4"
          />
          {errors.allow_status ? <p className="text-xs text-error-500">{errors.allow_status}</p> : null}
        </div>
      </div>

      <div className="space-y-2">
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">카테고리</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            카테고리를 선택해 주세요. 복수 선택과 하위 분류 지정이 가능합니다.
          </p>
        </div>
        <div data-field-target="category_ids" tabIndex={-1}>
          <HierarchicalCategorySelector
            sections={CATEGORY_SECTIONS}
            selectedIds={form.category_ids}
            selectedItems={selectedCategoryItems}
            onToggleCategory={onToggleCategory}
            loadCategories={loadCategories}
            error={errors.category_ids}
            initialSectionKey="surgery"
          />
        </div>
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
              className="cursor-pointer bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
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
  const featureOptions = React.useMemo<readonly TogglePillOption[]>(
    () =>
      features.map((feature) => ({
        value: feature.id,
        label: feature.name,
      })),
    [features],
  );

  return (
    <div className="space-y-2" data-field-target="feature_ids" tabIndex={-1}>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
          병원정보 <span className="text-error-500">*</span>
        </p>
      </div>

      <div className="outline-none">
        {isLoading ? (
          <SpinnerBlock className="min-h-24" spinnerClassName="size-7" label="병원 특징 불러오는 중" />
        ) : loadError ? (
          <p className="text-sm text-error-500">{loadError}</p>
        ) : features.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">등록된 병원 특징이 없습니다.</p>
        ) : (
          <TogglePillGroup
            options={featureOptions}
            selectedValues={selectedIds}
            size="sm"
            onToggle={(value, checked) => onToggleFeature(Number(value), checked)}
          />
        )}
      </div>

      {error ? <p className="text-xs text-error-500">{error}</p> : null}
    </div>
  );
}
