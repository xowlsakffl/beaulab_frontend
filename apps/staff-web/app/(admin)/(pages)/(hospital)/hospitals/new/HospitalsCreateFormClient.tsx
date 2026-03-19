"use client";

import { api } from "@/lib/api";
import { formatDaumAddress, useDaumPostcode } from "@/hooks/useDaumPostcode";
import { isApiSuccess } from "@beaulab/types";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  FileUploadField,
  FormCheckbox,
  FormTextArea,
  HierarchicalCategorySelector,
  InputField,
  Label,
  MediaUploader,
  SingleDatePickerField,
  type CategorySelectorItem,
  type CategorySelectorLoadParams,
  type CategorySelectorSection,
  type MediaCollectionConfig,
} from "@beaulab/ui-admin";
import { useRouter } from "next/navigation";
import React from "react";

type HospitalCreateForm = {
  name: string;
  company_name: string;
  tel: string;
  email: string;
  address: string;
  address_detail: string;
  latitude: string;
  longitude: string;
  description: string;
  consulting_hours: string;
  direction: string;
  business_number: string;
  ceo_name: string;
  business_type: string;
  business_item: string;
  business_address: string;
  business_address_detail: string;
  issued_at: string;
  category_ids: number[];
};

type FieldName = keyof HospitalCreateForm | "logo" | "gallery" | "business_registration_file";
type MediaField = "logo" | "gallery";

type CategoryApiItem = {
  id: number;
  name: string;
  full_path?: string | null;
  parent_id?: number | null;
  depth: number;
  domain: string;
  status: string;
  has_children?: boolean;
};

const FIELD_NAMES: readonly FieldName[] = [
  "name",
  "tel",
  "email",
  "address",
  "address_detail",
  "latitude",
  "longitude",
  "description",
  "consulting_hours",
  "direction",
  "business_number",
  "ceo_name",
  "business_type",
  "business_item",
  "business_address",
  "business_address_detail",
  "issued_at",
  "category_ids",
  "company_name",
  "logo",
  "gallery",
  "business_registration_file",
] as const;

const INITIAL_FORM: HospitalCreateForm = {
  name: "",
  company_name: "",
  tel: "",
  email: "",
  address: "",
  address_detail: "",
  latitude: "",
  longitude: "",
  description: "",
  consulting_hours: "",
  direction: "",
  business_number: "",
  ceo_name: "",
  business_type: "",
  business_item: "",
  business_address: "",
  business_address_detail: "",
  issued_at: "",
  category_ids: [],
};

const CATEGORY_SECTIONS: CategorySelectorSection[] = [
  {
    key: "surgery",
    label: "성형",
    domain: "HOSPITAL_SURGERY",
    searchPlaceholder: "카테고리명을 입력해주세요. (ex. 눈, 코)",
  },
  {
    key: "treatment",
    label: "쁘띠/피부",
    domain: "HOSPITAL_TREATMENT",
    searchPlaceholder: "카테고리명을 입력해주세요. (ex. 인모드)",
  },
];

const MEDIA_COLLECTIONS: readonly MediaCollectionConfig<MediaField>[] = [
  {
    key: "logo",
    label: "로고",
    accept: "image/jpeg,image/png,image/webp",
    multiple: false,
    maxFiles: 1,
    emptyText: "업로드한 로고 파일이 없습니다.",
    helperText: "jpg, png, webp / 최대 5MB",
  },
  {
    key: "gallery",
    label: "대표/내부 이미지",
    accept: "image/jpeg,image/png,image/webp",
    multiple: true,
    maxFiles: 5,
    emptyText: "업로드한 이미지가 없습니다.",
    helperText: "첫 번째 이미지가 대표 이미지로 사용됩니다. 드래그로 순서를 바꿀 수 있습니다.",
    maxFilesText: "최대 5장까지 업로드할 수 있습니다.",
  },
];

function isFieldName(value: string): value is FieldName {
  return (FIELD_NAMES as readonly string[]).includes(value);
}

function normalizeErrorField(key: string): FieldName | null {
  if (key.startsWith("gallery")) return "gallery";
  if (key.startsWith("category_ids")) return "category_ids";
  if (isFieldName(key)) return key;
  return null;
}

function extractFieldErrors(details: unknown): Partial<Record<FieldName, string>> {
  if (!details || typeof details !== "object" || !("errors" in details)) {
    return {};
  }

  const rawErrors = (details as { errors?: unknown }).errors;
  if (!rawErrors || typeof rawErrors !== "object") {
    return {};
  }

  const nextErrors: Partial<Record<FieldName, string>> = {};

  for (const [key, value] of Object.entries(rawErrors as Record<string, unknown>)) {
    const normalizedKey = normalizeErrorField(key);
    if (!normalizedKey) continue;

    if (Array.isArray(value)) {
      const firstMessage = value.find((item): item is string => typeof item === "string");
      if (firstMessage) nextErrors[normalizedKey] = firstMessage;
      continue;
    }

    if (typeof value === "string") {
      nextErrors[normalizedKey] = value;
    }
  }

  return nextErrors;
}

function normalizeCategoryItem(item: CategoryApiItem): CategorySelectorItem {
  return {
    id: item.id,
    name: item.name,
    full_path: item.full_path,
    depth: item.depth,
    parent_id: item.parent_id,
    has_children: item.has_children,
  };
}

export default function HospitalsCreateFormClient() {
  const router = useRouter();
  const { error: daumPostcodeError, openPostcode } = useDaumPostcode();

  const [form, setForm] = React.useState<HospitalCreateForm>(INITIAL_FORM);
  const [logo, setLogo] = React.useState<File | null>(null);
  const [gallery, setGallery] = React.useState<File[]>([]);
  const [businessRegistrationFile, setBusinessRegistrationFile] = React.useState<File | null>(null);
  const [isBusinessAddressSameAsHospital, setIsBusinessAddressSameAsHospital] = React.useState(false);
  const [errors, setErrors] = React.useState<Partial<Record<FieldName, string>>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const clearError = React.useCallback((field: FieldName) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const setField = <K extends keyof HospitalCreateForm>(key: K, value: HospitalCreateForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    clearError(key);
  };

  const guideHospitalAddressSelection = React.useCallback(() => {
    setErrors((prev) => ({
      ...prev,
      address: prev.address ?? "병의원 주소를 먼저 선택하세요.",
    }));

    window.setTimeout(() => {
      const addressInput = document.getElementById("address");
      if (addressInput instanceof HTMLInputElement) {
        addressInput.scrollIntoView({ behavior: "smooth", block: "center" });
        addressInput.focus();
      }
    }, 0);
  }, []);

  const toggleCategory = (categoryId: number, checked: boolean) => {
    setForm((prev) => ({
      ...prev,
      category_ids: checked
        ? [...prev.category_ids, categoryId]
        : prev.category_ids.filter((item) => item !== categoryId),
    }));
    clearError("category_ids");
  };

  const openAddressSearch = React.useCallback(
    async (field: "address" | "business_address", detailFieldId: "address_detail" | "business_address_detail") => {
      try {
        await openPostcode((data) => {
          setForm((prev) => ({
            ...prev,
            [field]: formatDaumAddress(data),
            latitude: field === "address" ? "" : prev.latitude,
            longitude: field === "address" ? "" : prev.longitude,
          }));
          clearError(field);

          window.setTimeout(() => {
            const detailInput = document.getElementById(detailFieldId);
            if (detailInput instanceof HTMLInputElement) {
              detailInput.focus();
            }
          }, 0);
        });
      } catch {
        window.alert("주소 검색을 열지 못했습니다. 잠시 후 다시 시도해주세요.");
      }
    },
    [clearError, openPostcode],
  );

  const loadCategories = React.useCallback(async ({
    section,
    parentId,
    query,
    perPage,
  }: CategorySelectorLoadParams): Promise<CategorySelectorItem[]> => {
    try {
      const response = await api.get<CategoryApiItem[]>("/categories/selector", {
        domain: section.domain,
        status: ["ACTIVE"],
        ...(query
          ? {
              q: query,
              per_page: perPage ?? 12,
            }
          : {}),
        ...(parentId !== undefined && parentId !== null ? { parent_id: parentId } : {}),
      });

      if (!isApiSuccess(response)) {
        throw new Error(response.error.message || "카테고리 목록을 불러오지 못했습니다.");
      }

      return response.data
        .filter((item) => item.status === "ACTIVE")
        .map(normalizeCategoryItem);
    } catch (error) {
      if (error instanceof Error && error.message) {
        throw error;
      }

      throw new Error("카테고리 목록을 불러오는 중 오류가 발생했습니다.");
    }
  }, []);

  React.useEffect(() => {
    if (!isBusinessAddressSameAsHospital) return;

    if (!form.address.trim()) {
      setIsBusinessAddressSameAsHospital(false);
      return;
    }

    setForm((prev) => {
      if (prev.business_address === prev.address && prev.business_address_detail === prev.address_detail) {
        return prev;
      }

      return {
        ...prev,
        business_address: prev.address,
        business_address_detail: prev.address_detail,
      };
    });

    clearError("business_address");
    clearError("business_address_detail");
  }, [clearError, form.address, form.address_detail, isBusinessAddressSameAsHospital]);

  const validate = () => {
    const nextErrors: Partial<Record<FieldName, string>> = {};

    if (!form.name.trim()) {
      nextErrors.name = "병의원명은 필수 항목입니다.";
    }

    if (form.tel && !/^[0-9+\-().\s]{6,50}$/.test(form.tel)) {
      nextErrors.tel = "대표 번호 형식이 올바르지 않습니다.";
    }

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = "올바른 이메일 형식이 아닙니다.";
    }

    if (!form.business_number.trim()) {
      nextErrors.business_number = "사업자 등록번호는 필수 항목입니다.";
    }

    if (!form.company_name.trim()) {
      nextErrors.company_name = "상호명은 필수 항목입니다.";
    }

    if (!form.ceo_name.trim()) {
      nextErrors.ceo_name = "대표자는 필수 항목입니다.";
    }

    if (!form.business_type.trim()) {
      nextErrors.business_type = "업태는 필수 항목입니다.";
    }

    if (!form.business_item.trim()) {
      nextErrors.business_item = "종목은 필수 항목입니다.";
    }

    if (form.issued_at && Number.isNaN(new Date(form.issued_at).getTime())) {
      nextErrors.issued_at = "사업자 등록일 형식이 올바르지 않습니다.";
    }

    if (!logo) {
      nextErrors.logo = "로고는 필수 항목입니다.";
    }

    if (gallery.length === 0) {
      nextErrors.gallery = "대표/내부 이미지는 최소 1장 필요합니다.";
    }

    if (!businessRegistrationFile) {
      nextErrors.business_registration_file = "사업자등록증 파일은 필수 항목입니다.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validate()) return;

    const formData = new FormData();
    formData.append("name", form.name.trim());
    formData.append("company_name", form.company_name.trim());
    formData.append("description", form.description.trim());
    formData.append("consulting_hours", form.consulting_hours.trim());
    formData.append("direction", form.direction.trim());
    formData.append("address", form.address.trim());
    formData.append("address_detail", form.address_detail.trim());
    formData.append("latitude", form.latitude.trim());
    formData.append("longitude", form.longitude.trim());
    formData.append("tel", form.tel.trim());
    formData.append("email", form.email.trim());
    formData.append("business_number", form.business_number.trim());
    formData.append("ceo_name", form.ceo_name.trim());
    formData.append("business_type", form.business_type.trim());
    formData.append("business_item", form.business_item.trim());
    formData.append("business_address", form.business_address.trim());
    formData.append("business_address_detail", form.business_address_detail.trim());

    if (form.issued_at) {
      formData.append("issued_at", form.issued_at);
    }

    form.category_ids.forEach((categoryId) => {
      formData.append("category_ids[]", String(categoryId));
    });

    if (logo) {
      formData.append("logo", logo);
    }

    if (businessRegistrationFile) {
      formData.append("business_registration_file", businessRegistrationFile);
    }

    gallery.forEach((file) => formData.append("gallery[]", file));

    setIsSubmitting(true);

    try {
      const response = await api.post<{ id: number }>("/hospitals", formData);

      if (!isApiSuccess(response)) {
        const nextErrors = extractFieldErrors(response.error.details);
        if (Object.keys(nextErrors).length > 0) {
          setErrors(nextErrors);
        }
        window.alert(response.error.message || "병의원 등록에 실패했습니다.");
        return;
      }

      window.alert("병의원이 등록되었습니다.");
      router.push("/hospitals");
      router.refresh();
    } catch {
      window.alert("병의원 등록 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <Card as="section">
        <CardHeader className="pb-6">
          <CardTitle>병의원 정보 입력</CardTitle>
        </CardHeader>

        <div className="space-y-10 divide-y divide-gray-200 dark:divide-gray-800">
          <section className="space-y-6 pb-6">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">기본 정보</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">병의원 기본 정보를 입력해주세요.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">병의원명 *</Label>
              <InputField
                id="name"
                name="name"
                placeholder="병의원명을 입력하세요."
                value={form.name}
                onChange={(event) => setField("name", event.target.value)}
                error={Boolean(errors.name)}
                hint={errors.name}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tel">대표 번호</Label>
                <InputField
                  id="tel"
                  name="tel"
                  placeholder="예) 02-1234-5678"
                  value={form.tel}
                  onChange={(event) => setField("tel", event.target.value)}
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
                  placeholder="예) hello@beaulab.co.kr"
                  value={form.email}
                  onChange={(event) => setField("email", event.target.value)}
                  error={Boolean(errors.email)}
                  hint={errors.email}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">카테고리</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">카테고리를 선택해 주세요. (복수 선택 및 상위 분류 지정 가능)</p>
                </div>
                <HierarchicalCategorySelector
                  sections={CATEGORY_SECTIONS}
                  selectedIds={form.category_ids}
                  onToggleCategory={toggleCategory}
                  loadCategories={loadCategories}
                  error={errors.category_ids}
                  initialSectionKey="surgery"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>병의원 주소</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <InputField
                    id="address"
                    name="address"
                    placeholder="주소 검색 버튼으로 주소를 선택하세요."
                    value={form.address}
                    readOnly
                    onClick={() => void openAddressSearch("address", "address_detail")}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter" && event.key !== " ") return;
                      event.preventDefault();
                      void openAddressSearch("address", "address_detail");
                    }}
                    error={Boolean(errors.address)}
                    hint={errors.address}
                    className="cursor-pointer bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => openAddressSearch("address", "address_detail")}
                  className="h-11 shrink-0 border-brand-500 px-4 text-brand-500 hover:bg-gray-100"
                >
                  주소 검색
                </Button>
              </div>
              {daumPostcodeError ? (
                <p className="text-xs text-error-500">카카오 주소 검색을 불러오지 못했습니다. 새로고침 후 다시 시도하세요.</p>
              ) : null}
              <InputField
                id="address_detail"
                name="address_detail"
                placeholder="상세 주소"
                value={form.address_detail}
                onChange={(event) => setField("address_detail", event.target.value)}
                error={Boolean(errors.address_detail)}
                hint={errors.address_detail}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">병의원 소개</Label>
              <FormTextArea
                id="description"
                name="description"
                placeholder="간단 소개를 입력하세요."
                rows={4}
                value={form.description}
                onChange={(value) => setField("description", value)}
                error={Boolean(errors.description)}
                hint={errors.description}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="consulting_hours">운영 시간</Label>
              <FormTextArea
                id="consulting_hours"
                name="consulting_hours"
                placeholder="예) 평일 10:00~19:00 / 토 10:00~15:00"
                rows={3}
                value={form.consulting_hours}
                onChange={(value) => setField("consulting_hours", value)}
                error={Boolean(errors.consulting_hours)}
                hint={errors.consulting_hours}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="direction">오시는 길</Label>
              <FormTextArea
                id="direction"
                name="direction"
                placeholder="예) 2호선 홍대입구역 3번 출구 도보 5분"
                rows={3}
                value={form.direction}
                onChange={(value) => setField("direction", value)}
                error={Boolean(errors.direction)}
                hint={errors.direction}
              />
            </div>
          </section>

          <section className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">사업자 정보</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">사업자등록증과 필수 사업자 정보를 등록합니다.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="business_number">사업자 등록번호 *</Label>
                <InputField
                  id="business_number"
                  name="business_number"
                  placeholder="예) 123-45-67890"
                  value={form.business_number}
                  onChange={(event) => setField("business_number", event.target.value)}
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
                  onChange={(event) => setField("company_name", event.target.value)}
                  error={Boolean(errors.company_name)}
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
                  onChange={(event) => setField("ceo_name", event.target.value)}
                  error={Boolean(errors.ceo_name)}
                  hint={errors.ceo_name}
                />
              </div>

              <SingleDatePickerField
                id="issued_at"
                label="사업자 등록일"
                value={form.issued_at}
                onChange={(value) => setField("issued_at", value)}
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
                  onChange={(event) => setField("business_type", event.target.value)}
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
                  onChange={(event) => setField("business_item", event.target.value)}
                  error={Boolean(errors.business_item)}
                  hint={errors.business_item}
                />
              </div>
            </div>

            <FileUploadField
              id="business_registration_file"
              name="business_registration_file"
              label="사업자등록증 파일 *"
              accept=".jpg,.jpeg,.png,.pdf"
              error={errors.business_registration_file}
              description={businessRegistrationFile ? `선택된 파일: ${businessRegistrationFile.name}` : "jpg, png, pdf / 최대 10MB"}
              onChange={(files) => {
                setBusinessRegistrationFile(files?.[0] ?? null);
                clearError("business_registration_file");
              }}
            />

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Label className="mb-0">
                  사업장 주소
                </Label>
                <FormCheckbox
                  id="business_address_same_as_hospital"
                  checked={isBusinessAddressSameAsHospital}
                  onChange={(checked) => {
                    if (checked && !form.address.trim()) {
                      setIsBusinessAddressSameAsHospital(false);
                      guideHospitalAddressSelection();
                      return;
                    }

                    setIsBusinessAddressSameAsHospital(checked);

                    if (checked) {
                      setForm((prev) => ({
                        ...prev,
                        business_address: prev.address,
                        business_address_detail: prev.address_detail,
                      }));
                      clearError("business_address");
                      clearError("business_address_detail");
                    }
                  }}
                  label="병의원 주소와 동일"
                />
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <InputField
                  id="business_address"
                  name="business_address"
                  placeholder={isBusinessAddressSameAsHospital ? "병의원 주소와 동일하게 입력됩니다." : "주소 검색 버튼으로 사업장 주소를 선택하세요."}
                  value={form.business_address}
                  readOnly
                  onClick={() => {
                    if (isBusinessAddressSameAsHospital) return;
                    void openAddressSearch("business_address", "business_address_detail");
                  }}
                  onKeyDown={(event) => {
                    if (isBusinessAddressSameAsHospital) return;
                    if (event.key !== "Enter" && event.key !== " ") return;
                    event.preventDefault();
                    void openAddressSearch("business_address", "business_address_detail");
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
                  onClick={() => openAddressSearch("business_address", "business_address_detail")}
                  disabled={isBusinessAddressSameAsHospital}
                  className="h-11 shrink-0 border-brand-500 px-4 text-brand-500 hover:bg-gray-100 disabled:border-gray-200 disabled:text-gray-400"
                >
                  주소 검색
                </Button>
              </div>

              <InputField
                id="business_address_detail"
                name="business_address_detail"
                placeholder="사업장 상세 주소"
                value={form.business_address_detail}
                onChange={(event) => setField("business_address_detail", event.target.value)}
                readOnly={isBusinessAddressSameAsHospital}
                disabled={isBusinessAddressSameAsHospital}
                error={Boolean(errors.business_address_detail)}
                hint={errors.business_address_detail}
              />
            </div>
          </section>
        </div>

        <div className="mt-8">
          <Button type="submit" variant="brand" size="auth" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "등록 중..." : "병의원 등록"}
          </Button>
        </div>
      </Card>

      <MediaUploader
        title="파일 업로드"
        collections={MEDIA_COLLECTIONS}
        filesByCollection={{
          logo: logo ? [logo] : [],
          gallery,
        }}
        errors={{
          logo: errors.logo,
          gallery: errors.gallery,
        }}
        onChange={(key, files) => {
          if (key === "logo") {
            setLogo(files[0] ?? null);
            clearError("logo");
            return;
          }

          setGallery(files);
          clearError("gallery");
        }}
      />
    </form>
  );
}
