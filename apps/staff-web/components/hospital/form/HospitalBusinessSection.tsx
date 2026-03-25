import { Button, FileUploadField, FormCheckbox, InputField, Label, SingleDatePickerField, X } from "@beaulab/ui-admin";

import type {
  HospitalAddressDetailField,
  HospitalAddressField,
  HospitalFormErrors,
  HospitalFormValues,
} from "@/lib/hospital/form";

type HospitalBusinessSectionProps = {
  mode: "create" | "edit";
  form: HospitalFormValues;
  errors: HospitalFormErrors;
  isBusinessAddressSameAsHospital: boolean;
  businessRegistrationLabel: string;
  businessRegistrationDescription: string;
  existingCertificateName?: string;
  existingCertificateSizeText?: string;
  existingCertificateUrl?: string | null;
  onFieldChange: (key: keyof HospitalFormValues, value: HospitalFormValues[keyof HospitalFormValues]) => void;
  onBusinessNumberChange?: (value: string) => void;
  onBusinessNumberBlur?: (value: string) => void;
  onBusinessRegistrationFileChange: (file: File | null) => void;
  onExistingCertificateChange?: (hasFile: boolean) => void;
  onBusinessAddressSameAsHospitalChange: (checked: boolean) => void;
  onGuideHospitalAddressSelection: () => void;
  onOpenAddressSearch: (field: HospitalAddressField, detailFieldId: HospitalAddressDetailField) => Promise<void>;
};

export function HospitalBusinessSection({
  mode,
  form,
  errors,
  isBusinessAddressSameAsHospital,
  businessRegistrationLabel,
  businessRegistrationDescription,
  existingCertificateName,
  existingCertificateSizeText,
  existingCertificateUrl,
  onFieldChange,
  onBusinessNumberChange,
  onBusinessNumberBlur,
  onBusinessRegistrationFileChange,
  onExistingCertificateChange,
  onBusinessAddressSameAsHospitalChange,
  onGuideHospitalAddressSelection,
  onOpenAddressSearch,
}: HospitalBusinessSectionProps) {
  const isCreate = mode === "create";

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">사업자 정보</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {isCreate ? "사업자등록증과 필수 사업자 정보를 등록합니다." : "사업자등록증과 필수 사업자 정보를 수정합니다."}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="business_number">사업자 등록번호 *</Label>
          <InputField
            id="business_number"
            name="business_number"
            placeholder="예) 123-45-67890"
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
            hint={errors.business_number}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="company_name">상호명 *</Label>
          <InputField
            id="company_name"
            name="company_name"
            placeholder="사업자등록증 상 상호명을 입력하세요."
            value={form.company_name}
            onChange={(event) => onFieldChange("company_name", event.target.value)}
            error={Boolean(errors.company_name)}
            hint={errors.company_name}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="ceo_name">대표자 *</Label>
          <InputField
            id="ceo_name"
            name="ceo_name"
            placeholder="대표자명을 입력하세요."
            value={form.ceo_name}
            onChange={(event) => onFieldChange("ceo_name", event.target.value)}
            error={Boolean(errors.ceo_name)}
            hint={errors.ceo_name}
          />
        </div>

        <SingleDatePickerField
          id="issued_at"
          label="사업자 등록일"
          value={form.issued_at}
          onChange={(value) => onFieldChange("issued_at", value)}
          error={errors.issued_at}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="business_type">업태 *</Label>
          <InputField
            id="business_type"
            name="business_type"
            placeholder="예) 의료업"
            value={form.business_type}
            onChange={(event) => onFieldChange("business_type", event.target.value)}
            error={Boolean(errors.business_type)}
            hint={errors.business_type}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="business_item">종목 *</Label>
          <InputField
            id="business_item"
            name="business_item"
            placeholder="예) 성형외과"
            value={form.business_item}
            onChange={(event) => onFieldChange("business_item", event.target.value)}
            error={Boolean(errors.business_item)}
            hint={errors.business_item}
          />
        </div>
      </div>

      <FileUploadField
        id="business_registration_file"
        name="business_registration_file"
        label={businessRegistrationLabel}
        accept=".jpg,.jpeg,.png,.pdf"
        error={errors.business_registration_file}
        description={businessRegistrationDescription}
        onChange={(files) => onBusinessRegistrationFileChange(files?.[0] ?? null)}
      />
      {onExistingCertificateChange && existingCertificateName && existingCertificateUrl ? (
        <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-800 dark:bg-gray-900/60">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-800 dark:text-white/90">{existingCertificateName}</p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {[existingCertificateSizeText, "현재 파일"].filter(Boolean).join(" · ")}
              </p>
              <a
                href={existingCertificateUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-medium text-brand-600 underline underline-offset-2 dark:text-brand-400"
              >
                파일 보기
              </a>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 text-gray-500 hover:text-red-600"
            onClick={() => onExistingCertificateChange(false)}
            title="파일 제거"
          >
            <X className="size-4" />
          </Button>
        </div>
      ) : null}

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Label className="mb-0">사업장 주소</Label>
          <FormCheckbox
            id="business_address_same_as_hospital"
            checked={isBusinessAddressSameAsHospital}
            onChange={(checked) => {
              if (checked && !form.address.trim()) {
                onGuideHospitalAddressSelection();
                return;
              }

              onBusinessAddressSameAsHospitalChange(checked);
            }}
            label="병의원 주소와 동일"
          />
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_104px] gap-2">
          <div className="min-w-0">
            <InputField
              id="business_address"
              name="business_address"
              placeholder={isBusinessAddressSameAsHospital ? "병의원 주소와 동일하게 입력됩니다." : "주소 검색 버튼으로 사업장 주소를 선택하세요."}
              value={form.business_address}
              readOnly
              onClick={() => {
                if (isBusinessAddressSameAsHospital) return;
                void onOpenAddressSearch("business_address", "business_address_detail");
              }}
              onKeyDown={(event) => {
                if (isBusinessAddressSameAsHospital) return;
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                void onOpenAddressSearch("business_address", "business_address_detail");
              }}
              className={
                isBusinessAddressSameAsHospital
                  ? "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                  : "cursor-pointer bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
              }
              disabled={isBusinessAddressSameAsHospital}
              error={Boolean(errors.business_address)}
              hint={errors.business_address}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => void onOpenAddressSearch("business_address", "business_address_detail")}
            disabled={isBusinessAddressSameAsHospital}
            className="h-11 w-full shrink-0 border-brand-500 px-4 text-brand-500 hover:bg-gray-100 disabled:border-gray-200 disabled:text-gray-400"
          >
            주소 검색
          </Button>
        </div>

        <InputField
          id="business_address_detail"
          name="business_address_detail"
          placeholder="사업장 상세 주소"
          value={form.business_address_detail}
          onChange={(event) => onFieldChange("business_address_detail", event.target.value)}
          readOnly={isBusinessAddressSameAsHospital}
          disabled={isBusinessAddressSameAsHospital}
          error={Boolean(errors.business_address_detail)}
          hint={errors.business_address_detail}
        />
      </div>
    </section>
  );
}
