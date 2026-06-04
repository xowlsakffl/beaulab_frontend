"use client";

import React from "react";

import {
  Button,
  Card,
  FormCheckbox,
  FormTextArea,
  InputField,
  Label,
  MediaUploader,
  Select,
  X,
  type CategorySelectorItem,
  type CategorySelectorLoadParams,
  type ExistingMediaItem,
} from "@beaulab/ui-admin";

import {
  CATEGORY_SECTIONS,
  HOSPITAL_CATEGORY_MAX_SELECTION,
  MEDIA_COLLECTIONS,
  type HospitalAddressDetailField,
  type HospitalAddressField,
  type HospitalFormErrors,
  type HospitalFormValues,
  type HospitalMediaField,
  type HospitalOperationDayKey,
  type HospitalOperationHoursFormValues,
} from "@/lib/hospital/form";
import { HOSPITAL_DEPARTMENT_OPTIONS, labelApprovalStatus } from "@/lib/hospital/list";
import {
  getMediaFilename,
  resolveMediaUrl,
  type HospitalCategoryItem,
  type HospitalFeatureItem,
  type MediaAsset,
} from "@/lib/hospital/detail";

const cardClassName = "rounded-xl border border-gray-200 bg-white p-5";
const labelClassName = "pt-0.5 text-xs font-semibold text-gray-500";
const operationDayLabels: Array<[HospitalOperationDayKey, string]> = [
  ["mon", "월"],
  ["tue", "화"],
  ["wed", "수"],
  ["thu", "목"],
  ["fri", "금"],
  ["sat", "토"],
  ["sun", "일"],
];

const settlementBankOptions = [
  { value: "국민은행", label: "국민은행" },
  { value: "신한은행", label: "신한은행" },
  { value: "우리은행", label: "우리은행" },
  { value: "하나은행", label: "하나은행" },
  { value: "기업은행", label: "기업은행" },
  { value: "농협은행", label: "농협은행" },
  { value: "카카오뱅크", label: "카카오뱅크" },
  { value: "토스뱅크", label: "토스뱅크" },
  { value: "기타", label: "기타" },
];

type HospitalFormLayoutProps = {
  mode: "create" | "edit";
  formId: string;
  form: HospitalFormValues;
  errors: HospitalFormErrors;
  logo: File | null;
  gallery: File[];
  existingLogo?: MediaAsset | null;
  existingMediaByCollection?: {
    logo: ExistingMediaItem[];
    gallery: ExistingMediaItem[];
  };
  galleryOrder?: string[];
  businessRegistrationFile: File | null;
  existingCertificate?: MediaAsset | null;
  selectedCategoryItems?: HospitalCategoryItem[];
  hospitalFeatures: HospitalFeatureItem[];
  isHospitalFeaturesLoading: boolean;
  hospitalFeaturesError: string | null;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onFieldChange: (key: keyof HospitalFormValues, value: HospitalFormValues[keyof HospitalFormValues]) => void;
  onNameChange?: (value: string) => void;
  onNameBlur?: (value: string) => void;
  onBusinessNumberChange?: (value: string) => void;
  onBusinessNumberBlur?: (value: string) => void;
  onLogoChange: (file: File | null) => void;
  onGalleryChange: (files: File[]) => void;
  onExistingItemsChange?: (key: HospitalMediaField, items: ExistingMediaItem[]) => void;
  onGalleryOrderChange?: (order: string[]) => void;
  onBusinessRegistrationFileChange: (file: File | null) => void;
  onExistingCertificateChange?: (hasFile: boolean) => void;
  onOpenAddressSearch: (field: HospitalAddressField, detailFieldId: HospitalAddressDetailField) => Promise<void>;
  loadCategories: (params: CategorySelectorLoadParams) => Promise<CategorySelectorItem[]>;
  onToggleCategory: (categoryId: number, checked: boolean) => void;
  onToggleFeature: (featureId: number, checked: boolean) => void;
};

export function HospitalFormLayout({
  mode,
  formId,
  form,
  errors,
  logo,
  gallery,
  existingLogo = null,
  existingMediaByCollection,
  galleryOrder,
  businessRegistrationFile,
  existingCertificate = null,
  selectedCategoryItems,
  hospitalFeatures,
  isHospitalFeaturesLoading,
  hospitalFeaturesError,
  onSubmit,
  onFieldChange,
  onNameChange,
  onNameBlur,
  onBusinessNumberChange,
  onBusinessNumberBlur,
  onLogoChange,
  onGalleryChange,
  onExistingItemsChange,
  onGalleryOrderChange,
  onBusinessRegistrationFileChange,
  onExistingCertificateChange,
  onOpenAddressSearch,
  loadCategories,
  onToggleCategory,
  onToggleFeature,
}: HospitalFormLayoutProps) {
  const isCreate = mode === "create";

  return (
    <form id={formId} onSubmit={onSubmit} className="min-w-0 space-y-6">
      <div className="grid min-w-0 grid-cols-1 items-stretch gap-3 xl:grid-cols-[20rem_minmax(0,1fr)_19rem]">
        <HospitalLogoEditCard
          logo={logo}
          existingLogo={existingLogo}
          hospitalName={form.name}
          error={errors.logo}
          onChange={onLogoChange}
        />

        <div className="grid min-w-0 gap-3">
          <HospitalMainInfoEditCard
            mode={mode}
            form={form}
            errors={errors}
            businessRegistrationFile={businessRegistrationFile}
            existingCertificate={existingCertificate}
            onFieldChange={onFieldChange}
            onNameChange={onNameChange}
            onNameBlur={onNameBlur}
            onBusinessNumberChange={onBusinessNumberChange}
            onBusinessNumberBlur={onBusinessNumberBlur}
            onBusinessRegistrationFileChange={onBusinessRegistrationFileChange}
            onExistingCertificateChange={onExistingCertificateChange}
            onOpenAddressSearch={onOpenAddressSearch}
          />

          <HospitalBusinessAccountEditCard form={form} errors={errors} onFieldChange={onFieldChange} />
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          <HospitalPointEditCard />
          <HospitalAdReceptionEditCard form={form} errors={errors} onFieldChange={onFieldChange} />
        </div>
      </div>

      <HospitalGalleryEditCard
        gallery={gallery}
        existingMediaByCollection={existingMediaByCollection}
        galleryOrder={galleryOrder}
        error={errors.gallery}
        onGalleryChange={onGalleryChange}
        onExistingItemsChange={onExistingItemsChange}
        onGalleryOrderChange={onGalleryOrderChange}
      />

      <HospitalOperationEditCard
        form={form}
        errors={errors}
        selectedCategoryItems={selectedCategoryItems}
        hospitalFeatures={hospitalFeatures}
        isHospitalFeaturesLoading={isHospitalFeaturesLoading}
        hospitalFeaturesError={hospitalFeaturesError}
        onFieldChange={onFieldChange}
        loadCategories={loadCategories}
        onToggleCategory={onToggleCategory}
        onToggleFeature={onToggleFeature}
      />

      {isCreate ? null : <input type="hidden" name="mode" value="edit" readOnly />}
    </form>
  );
}

function HospitalLogoEditCard({
  logo,
  existingLogo,
  hospitalName,
  error,
  onChange,
}: {
  logo: File | null;
  existingLogo: MediaAsset | null;
  hospitalName: string;
  error?: string;
  onChange: (file: File | null) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const fileUrl = useObjectUrl(logo);
  const existingUrl = resolveMediaUrl(existingLogo);
  const previewUrl = fileUrl ?? existingUrl;

  return (
    <Card
      data-media-collection="logo"
      tabIndex={-1}
      className="flex min-h-[14rem] flex-col items-center justify-center gap-4 rounded-xl border border-gray-200 bg-white p-4"
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
      />
      <div className="flex min-h-[12rem] w-full items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-white">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- runtime storage URL or local object URL
          <img src={previewUrl} alt={`${hospitalName || "병의원"} 로고`} className="h-full w-full object-cover" />
        ) : (
          <div className="flex size-24 items-center justify-center rounded-full border-2 border-gray-700 bg-white text-xl font-bold text-gray-800">
            {buildLogoInitials(hospitalName)}
          </div>
        )}
      </div>
      <Button type="button" variant="brand" size="sm" className="w-full" onClick={() => inputRef.current?.click()}>
        이미지 수정하기
      </Button>
      {error ? <p className="text-xs text-error-500">{error}</p> : null}
    </Card>
  );
}

function HospitalMainInfoEditCard({
  mode,
  form,
  errors,
  businessRegistrationFile,
  existingCertificate,
  onFieldChange,
  onNameChange,
  onNameBlur,
  onBusinessNumberChange,
  onBusinessNumberBlur,
  onBusinessRegistrationFileChange,
  onExistingCertificateChange,
  onOpenAddressSearch,
}: {
  mode: "create" | "edit";
  form: HospitalFormValues;
  errors: HospitalFormErrors;
  businessRegistrationFile: File | null;
  existingCertificate: MediaAsset | null;
  onFieldChange: (key: keyof HospitalFormValues, value: HospitalFormValues[keyof HospitalFormValues]) => void;
  onNameChange?: (value: string) => void;
  onNameBlur?: (value: string) => void;
  onBusinessNumberChange?: (value: string) => void;
  onBusinessNumberBlur?: (value: string) => void;
  onBusinessRegistrationFileChange: (file: File | null) => void;
  onExistingCertificateChange?: (hasFile: boolean) => void;
  onOpenAddressSearch: (field: HospitalAddressField, detailFieldId: HospitalAddressDetailField) => Promise<void>;
}) {
  const isCreate = mode === "create";

  return (
    <Card className={cardClassName}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-bold text-gray-900">병의원정보</h2>
          {!isCreate && form.status !== "ACTIVE" ? (
            <span className="rounded bg-gray-700 px-2 py-0.5 text-xs font-semibold text-white">
              {labelApprovalStatus(form.status)}
            </span>
          ) : null}
        </div>
        <Button type="button" variant="brand" size="sm">
          비밀번호 재설정
        </Button>
      </div>

      <div className="grid gap-x-8 gap-y-3 md:grid-cols-2">
        <EditField label="병의원명" required error={errors.name}>
          <InputField
            id="name"
            name="name"
            value={form.name}
            placeholder="병의원명"
            readOnly={!isCreate}
            disabled={!isCreate}
            onChange={(event) => onNameChange?.(event.target.value)}
            onBlur={(event) => onNameBlur?.(event.target.value)}
            error={Boolean(errors.name)}
            className="h-9 bg-white px-3 py-1.5"
          />
        </EditField>
        <EditField label="대표자" required error={errors.ceo_name}>
          <InputField
            id="ceo_name"
            name="ceo_name"
            value={form.ceo_name}
            onChange={(event) => onFieldChange("ceo_name", event.target.value)}
            error={Boolean(errors.ceo_name)}
            className="h-9 bg-white px-3 py-1.5"
          />
        </EditField>
        <EditField label="병의원주소" required error={errors.address} className="md:col-span-2">
          <div className="space-y-2">
            <div className="grid grid-cols-[minmax(0,1fr)_5rem] gap-2">
              <InputField
                id="address"
                name="address"
                value={form.address}
                readOnly
                onClick={() => void onOpenAddressSearch("address", "address_detail")}
                error={Boolean(errors.address)}
                className="h-9 cursor-pointer bg-white px-3 py-1.5"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9"
                onClick={() => void onOpenAddressSearch("address", "address_detail")}
              >
                주소찾기
              </Button>
            </div>
            <InputField
              id="address_detail"
              name="address_detail"
              value={form.address_detail}
              placeholder="상세주소"
              onChange={(event) => onFieldChange("address_detail", event.target.value)}
              error={Boolean(errors.address_detail)}
              className="h-9 bg-white px-3 py-1.5"
            />
            {errors.address_detail ? <p className="text-xs text-error-500">{errors.address_detail}</p> : null}
          </div>
        </EditField>
        <EditField label="전화번호" required error={errors.tel}>
          <InputField
            id="tel"
            name="tel"
            value={form.tel}
            onChange={(event) => onFieldChange("tel", event.target.value)}
            error={Boolean(errors.tel)}
            className="h-9 bg-white px-3 py-1.5"
          />
        </EditField>
        <div />
        <EditField label="사업자등록번호" required error={errors.business_number}>
          <InputField
            id="business_number"
            name="business_number"
            value={form.business_number}
            onChange={(event) => {
              if (isCreate) {
                onBusinessNumberChange?.(event.target.value);
                return;
              }
              onFieldChange("business_number", event.target.value);
            }}
            onBlur={(event) => onBusinessNumberBlur?.(event.target.value)}
            error={Boolean(errors.business_number)}
            className="h-9 bg-white px-3 py-1.5"
          />
        </EditField>
        <BusinessCertificateEditField
          file={businessRegistrationFile}
          existingCertificate={existingCertificate}
          error={errors.business_registration_file}
          onFileChange={onBusinessRegistrationFileChange}
          onExistingCertificateChange={onExistingCertificateChange}
        />
        <EditField label="업태" required error={errors.business_type}>
          <InputField
            id="business_type"
            name="business_type"
            value={form.business_type}
            onChange={(event) => onFieldChange("business_type", event.target.value)}
            error={Boolean(errors.business_type)}
            className="h-9 bg-white px-3 py-1.5"
          />
        </EditField>
        <EditField label="종목" required error={errors.business_item}>
          <InputField
            id="business_item"
            name="business_item"
            value={form.business_item}
            onChange={(event) => onFieldChange("business_item", event.target.value)}
            error={Boolean(errors.business_item)}
            className="h-9 bg-white px-3 py-1.5"
          />
        </EditField>
      </div>
    </Card>
  );
}

function HospitalBusinessAccountEditCard({
  form,
  errors,
  onFieldChange,
}: {
  form: HospitalFormValues;
  errors: HospitalFormErrors;
  onFieldChange: (key: keyof HospitalFormValues, value: HospitalFormValues[keyof HospitalFormValues]) => void;
}) {
  return (
    <Card className={cardClassName}>
      <div className="grid gap-x-8 gap-y-3 md:grid-cols-2">
        <EditField label="세금계산서 이메일" error={errors.tax_invoice_email} className="md:col-span-2">
          <InputField
            id="tax_invoice_email"
            name="tax_invoice_email"
            type="email"
            value={form.tax_invoice_email}
            onChange={(event) => onFieldChange("tax_invoice_email", event.target.value)}
            error={Boolean(errors.tax_invoice_email)}
            className="h-9 bg-white px-3 py-1.5"
          />
        </EditField>
        <EditField label="정산 계좌번호" error={errors.settlement_account_number}>
          <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-2">
            <Select
              id="settlement_bank_name"
              value={form.settlement_bank_name}
              placeholder="선택"
              options={settlementBankOptions}
              onChange={(value) => onFieldChange("settlement_bank_name", value)}
              className="h-9 bg-white px-3 py-1.5"
            />
            <InputField
              id="settlement_account_number"
              name="settlement_account_number"
              value={form.settlement_account_number}
              onChange={(event) => onFieldChange("settlement_account_number", event.target.value)}
              error={Boolean(errors.settlement_account_number)}
              className="h-9 bg-white px-3 py-1.5"
            />
          </div>
        </EditField>
        <EditField label="예금주명" error={errors.settlement_account_holder}>
          <InputField
            id="settlement_account_holder"
            name="settlement_account_holder"
            value={form.settlement_account_holder}
            onChange={(event) => onFieldChange("settlement_account_holder", event.target.value)}
            error={Boolean(errors.settlement_account_holder)}
            className="h-9 bg-white px-3 py-1.5"
          />
        </EditField>
      </div>
    </Card>
  );
}

function HospitalPointEditCard() {
  return (
    <Card className={cardClassName}>
      <div className="flex min-h-[6.25rem] flex-col justify-between gap-3">
        <h3 className="text-sm font-bold text-gray-900">현재 포인트 잔액</h3>
        <p className="text-right text-sm font-bold text-gray-900">0 P</p>
      </div>
    </Card>
  );
}

function HospitalAdReceptionEditCard({
  form,
  errors,
  onFieldChange,
}: {
  form: HospitalFormValues;
  errors: HospitalFormErrors;
  onFieldChange: (key: keyof HospitalFormValues, value: HospitalFormValues[keyof HospitalFormValues]) => void;
}) {
  return (
    <Card className={[cardClassName, "flex-1"].join(" ")}>
      <h3 className="mb-5 text-sm font-bold text-gray-900">광고 안내 수신 접수전화번호</h3>
      <div className="space-y-4">
        <CompactPhoneField
          id="ad_reception_phone_1"
          label="[필수] 담당자1"
          required
          value={form.ad_reception_phone_1}
          error={errors.ad_reception_phone_1}
          onChange={(value) => onFieldChange("ad_reception_phone_1", value)}
        />
        <CompactPhoneField
          id="ad_reception_phone_2"
          label="[선택] 담당자2"
          value={form.ad_reception_phone_2}
          error={errors.ad_reception_phone_2}
          onChange={(value) => onFieldChange("ad_reception_phone_2", value)}
        />
        <CompactPhoneField
          id="ad_reception_phone_3"
          label="[선택] 담당자3"
          value={form.ad_reception_phone_3}
          error={errors.ad_reception_phone_3}
          onChange={(value) => onFieldChange("ad_reception_phone_3", value)}
        />
      </div>
    </Card>
  );
}

function HospitalGalleryEditCard({
  gallery,
  existingMediaByCollection,
  galleryOrder,
  error,
  onGalleryChange,
  onExistingItemsChange,
  onGalleryOrderChange,
}: {
  gallery: File[];
  existingMediaByCollection?: {
    logo: ExistingMediaItem[];
    gallery: ExistingMediaItem[];
  };
  galleryOrder?: string[];
  error?: string;
  onGalleryChange: (files: File[]) => void;
  onExistingItemsChange?: (key: HospitalMediaField, items: ExistingMediaItem[]) => void;
  onGalleryOrderChange?: (order: string[]) => void;
}) {
  const galleryCollection = MEDIA_COLLECTIONS.find((collection) => collection.key === "gallery");
  const uploaderRef = React.useRef<HTMLDivElement | null>(null);

  if (!galleryCollection) return null;

  const maxGalleryCount = galleryCollection.maxFiles ?? 5;
  const currentGalleryCount = gallery.length + (existingMediaByCollection?.gallery.length ?? 0);
  const isGalleryFull = currentGalleryCount >= maxGalleryCount;

  const openFilePicker = () => {
    if (isGalleryFull) return;
    uploaderRef.current?.querySelector<HTMLInputElement>('input[data-media-file-input="true"]')?.click();
  };

  return (
    <Card className={cardClassName}>
      <div className="mb-4 flex items-center gap-2">
        <h3 className="text-sm font-bold text-gray-900">
          병의원이미지
          <RequiredMark />
        </h3>
        <Button
          type="button"
          variant="brand"
          size="sm"
          className="h-8 px-3 text-xs"
          disabled={isGalleryFull}
          onClick={openFilePicker}
        >
          파일선택
        </Button>
      </div>
      <div ref={uploaderRef}>
        <MediaUploader
          embedded
          layout="horizontal"
          collections={[
            {
              ...galleryCollection,
              label: "파일선택",
              showLabel: false,
              dropzoneVariant: "button",
              hideDropzone: true,
              cardVariant: "imageOnly",
            },
          ]}
          filesByCollection={{ gallery }}
          existingItemsByCollection={existingMediaByCollection ? { gallery: existingMediaByCollection.gallery } : undefined}
          orderByCollection={galleryOrder ? { gallery: galleryOrder } : undefined}
          errors={{ gallery: error }}
          onExistingItemsChange={onExistingItemsChange}
          onOrderChange={(key, order) => {
            if (key !== "gallery") return;
            onGalleryOrderChange?.(order);
          }}
          onChange={(key, files) => {
            if (key !== "gallery") return;
            onGalleryChange(files);
          }}
        />
      </div>
    </Card>
  );
}

function HospitalOperationEditCard({
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
  const updateOperationHours = (dayKey: HospitalOperationDayKey, patch: Partial<HospitalOperationHoursFormValues[HospitalOperationDayKey]>) => {
    onFieldChange("operation_hours", {
      ...form.operation_hours,
      [dayKey]: {
        ...form.operation_hours[dayKey],
        ...patch,
      },
    });
  };

  return (
    <Card className={cardClassName}>
      <h3 className="mb-5 text-sm font-bold text-gray-900">운영정보</h3>
      <div className="grid gap-10 xl:grid-cols-[minmax(15rem,0.8fr)_minmax(18rem,1fr)_minmax(20rem,1.2fr)]">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="department">분과</Label>
            <Select
              id="department"
              name="department"
              value={form.department}
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

        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="description">병원소개</Label>
            <FormTextArea
              id="description"
              name="description"
              value={form.description}
              placeholder="병원소개를 입력해 주세요."
              onChange={(value) => onFieldChange("description", value)}
              error={Boolean(errors.description)}
              hint={errors.description}
              rows={4}
            />
          </div>

          <div id="operation_hours" className="space-y-2">
            <Label>
              진료시간
              <RequiredMark />
            </Label>
            <div className="space-y-2">
              {operationDayLabels.map(([dayKey, dayLabel]) => {
                const item = form.operation_hours[dayKey];

                return (
                  <div key={dayKey} className="grid grid-cols-[1.5rem_5.5rem_1rem_5.5rem_auto] items-center gap-2">
                    <span className="text-sm font-semibold text-gray-700">{dayLabel}</span>
                    <InputField
                      type="time"
                      value={item.start}
                      disabled={item.is_closed}
                      onChange={(event) => updateOperationHours(dayKey, { start: event.target.value })}
                      className="h-9 bg-white px-2 py-1.5"
                    />
                    <span className="text-center text-sm text-gray-500">~</span>
                    <InputField
                      type="time"
                      value={item.end}
                      disabled={item.is_closed}
                      onChange={(event) => updateOperationHours(dayKey, { end: event.target.value })}
                      className="h-9 bg-white px-2 py-1.5"
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
              placeholder="오시는 길을 입력해 주세요."
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
  const [selectedValue, setSelectedValue] = React.useState("");
  const [loadError, setLoadError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;

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
      });

    return () => {
      isMounted = false;
    };
  }, [loadCategories]);

  const selectedLabels = selectedIds.map((id) => {
    const option = options.find((item) => item.value === String(id));
    const fallback = selectedItems?.find((item) => item.id === id);
    return {
      id,
      label: option?.label ?? fallback?.name ?? String(id),
    };
  });

  return (
    <div className="space-y-2" data-field-target="category_ids" tabIndex={-1}>
      <Label htmlFor="category_selector">진료과목 <span className="text-xs text-gray-500">(최대 5개)</span></Label>
      <div className="flex flex-wrap gap-1.5 rounded-xl border border-gray-200 bg-white p-2">
        {selectedLabels.length > 0 ? (
          selectedLabels.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onToggleCategory(item.id, false)}
              className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700"
            >
              {item.label}
              <X className="size-3" />
            </button>
          ))
        ) : (
          <span className="px-1 text-xs text-gray-400">선택된 진료과목 없음</span>
        )}
      </div>
      <Select
        id="category_selector"
        value={selectedValue}
        placeholder="전체"
        options={options.filter((option) => !selectedIds.includes(Number(option.value)))}
        onChange={(value) => {
          const categoryId = Number(value);
          if (!Number.isFinite(categoryId)) return;
          if (selectedIds.length >= HOSPITAL_CATEGORY_MAX_SELECTION) return;
          onToggleCategory(categoryId, true);
          setSelectedValue("");
        }}
        className="h-9 bg-white px-3 py-1.5"
      />
      <p className="text-xs text-gray-500">선택 {selectedIds.length}/{HOSPITAL_CATEGORY_MAX_SELECTION}</p>
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
      <p className="text-sm text-gray-900">
        병원정보
        <RequiredMark />
      </p>
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
      {error ? <p className="text-xs text-error-500">{error}</p> : null}
    </div>
  );
}

function BusinessCertificateEditField({
  file,
  existingCertificate,
  error,
  onFileChange,
  onExistingCertificateChange,
}: {
  file: File | null;
  existingCertificate: MediaAsset | null;
  error?: string;
  onFileChange: (file: File | null) => void;
  onExistingCertificateChange?: (hasFile: boolean) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const fileUrl = useObjectUrl(file);
  const existingUrl = resolveMediaUrl(existingCertificate);
  const previewUrl = fileUrl ?? existingUrl;
  const filename = file?.name ?? (existingCertificate ? getMediaFilename(existingCertificate) : "");
  const hasFile = Boolean(file || existingCertificate);

  const clearFile = () => {
    if (inputRef.current) {
      inputRef.current.value = "";
    }

    if (file) {
      onFileChange(null);
      return;
    }

    if (existingCertificate) {
      onExistingCertificateChange?.(false);
    }
  };

  return (
    <EditField label="사업자등록증" required error={error}>
      <input
        id="business_registration_file"
        name="business_registration_file"
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.pdf"
        className="hidden"
        onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
      />
      <div className="min-w-0 space-y-2">
        <div className="flex min-w-0 items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
            등록
          </Button>
          {previewUrl ? (
            <Button type="button" variant="brand" size="sm" onClick={() => window.open(previewUrl, "_blank", "noopener,noreferrer")}>
              미리보기
            </Button>
          ) : null}
        </div>
        {hasFile && filename ? (
          <div className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
            <span className="min-w-0 truncate text-xs font-medium text-gray-700">{filename}</span>
            <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs text-gray-500 hover:text-red-600" onClick={clearFile}>
              삭제
            </Button>
          </div>
        ) : null}
      </div>
    </EditField>
  );
}

function CompactPhoneField({
  id,
  label,
  required = false,
  value,
  error,
  onChange,
}: {
  id: string;
  label: string;
  required?: boolean;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid grid-cols-[7.25rem_minmax(0,1fr)] items-center gap-3">
      <p className={labelClassName}>
        {label}
        {required ? <RequiredMark /> : null}
      </p>
      <div>
        <InputField
          id={id}
          name={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          error={Boolean(error)}
          className="h-9 bg-white px-3 py-1.5"
        />
        {error ? <p className="mt-1 text-xs text-error-500">{error}</p> : null}
      </div>
    </div>
  );
}

function EditField({
  label,
  required = false,
  error,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={["grid grid-cols-[8.5rem_minmax(0,1fr)] items-start gap-4", className].filter(Boolean).join(" ")}>
      <p className={labelClassName}>
        {label}
        {required ? <RequiredMark /> : null}
      </p>
      <div>
        {children}
        {error ? <p className="mt-1 text-xs text-error-500">{error}</p> : null}
      </div>
    </div>
  );
}

function RequiredMark() {
  return <span className="text-error-500">*</span>;
}

function useObjectUrl(file: File | null) {
  const [url, setUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }

    const nextUrl = URL.createObjectURL(file);
    setUrl(nextUrl);

    return () => URL.revokeObjectURL(nextUrl);
  }, [file]);

  return url;
}

function buildLogoInitials(name: string) {
  const normalized = name.trim();
  if (!normalized) return "D:A";
  const words = normalized.split(/\s+/).filter(Boolean);
  if (words.length >= 2) return `${words[0][0] ?? "D"}:${words[1][0] ?? "A"}`.toUpperCase();
  return normalized.slice(0, 2).toUpperCase();
}
