"use client";

import { HospitalBasicSection } from "@/components/hospital/form/HospitalBasicSection";
import { HospitalBusinessSection } from "@/components/hospital/form/HospitalBusinessSection";
import { HospitalMediaPanel } from "@/components/hospital/form/HospitalMediaPanel";
import { useCategorySelectorLoader } from "@/hooks/common/useCategorySelectorLoader";
import { useDaumPostcode } from "@/hooks/common/useDaumPostcode";
import { useHospitalAddressSearch } from "@/hooks/hospital/useHospitalAddressSearch";
import { useHospitalFieldFocus } from "@/hooks/hospital/useHospitalFieldFocus";
import { useHospitalFeatureList } from "@/hooks/hospital/useHospitalFeatureList";
import { api } from "@/lib/common/api";
import {
  buildHospitalExistingMediaItems,
  extractFieldErrors,
  formatBytes,
  getMediaFilename,
  INITIAL_HOSPITAL_FORM,
  mapHospitalDetailToForm,
  normalizeBusinessNumber,
  resolveMediaUrl,
  validateUpdateHospitalForm,
  type HospitalCategoryItem,
  type HospitalDetailResponse,
  type HospitalFieldName,
  type HospitalFormErrors,
  type HospitalFormValues,
  type MediaAsset,
} from "@/lib/hospital/form";
import { buildReturnToPath } from "@/lib/common/navigation/buildReturnToPath";
import { isApiSuccess } from "@beaulab/types";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  SpinnerBlock,
  useGlobalAlert,
} from "@beaulab/ui-admin";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import React from "react";

export default function HospitalEditFormClient() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showAlert } = useGlobalAlert();
  const { error: daumPostcodeError, openPostcode, geocodeAddress } = useDaumPostcode();
  const { focusField, focusFirstErrorField } = useHospitalFieldFocus();
  const loadCategories = useCategorySelectorLoader();
  const {
    features: hospitalFeatures,
    isLoading: isHospitalFeaturesLoading,
    error: hospitalFeaturesError,
  } = useHospitalFeatureList();
  const getReturnToPath = React.useCallback(
    (highlightId?: number) =>
      buildReturnToPath({
        searchParams,
        fallbackPath: "/hospitals",
        allowedPrefix: "/hospitals",
        highlightId,
      }),
    [searchParams],
  );

  const rawHospitalId = Array.isArray(params.id) ? params.id[0] : params.id;
  const hospitalId = Number(rawHospitalId);

  const [form, setForm] = React.useState<HospitalFormValues>(INITIAL_HOSPITAL_FORM);
  const [logo, setLogo] = React.useState<File | null>(null);
  const [gallery, setGallery] = React.useState<File[]>([]);
  const [businessRegistrationFile, setBusinessRegistrationFile] = React.useState<File | null>(null);
  const [existingLogo, setExistingLogo] = React.useState<MediaAsset | null>(null);
  const [existingGallery, setExistingGallery] = React.useState<MediaAsset[]>([]);
  const [galleryOrder, setGalleryOrder] = React.useState<string[]>([]);
  const [existingCertificate, setExistingCertificate] = React.useState<MediaAsset | null>(null);
  const [selectedCategoryItems, setSelectedCategoryItems] = React.useState<HospitalCategoryItem[]>([]);
  const [pageTitle, setPageTitle] = React.useState("병의원 수정");
  const [isBusinessAddressSameAsHospital, setIsBusinessAddressSameAsHospital] = React.useState(false);
  const [errors, setErrors] = React.useState<HospitalFormErrors>({});
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const clearError = React.useCallback((field: HospitalFieldName) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const setField = <K extends keyof HospitalFormValues>(key: K, value: HospitalFormValues[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    clearError(key);
  };

  const { guideHospitalAddressSelection, openAddressSearch } = useHospitalAddressSearch({
    openPostcode,
    geocodeAddress,
    clearError,
    setErrors,
    setForm,
    showAlert,
    focusField,
  });

  const toggleCategory = (categoryId: number, checked: boolean) => {
    setForm((prev) => ({
      ...prev,
      category_ids: checked
        ? [...prev.category_ids, categoryId]
        : prev.category_ids.filter((item) => item !== categoryId),
    }));
    clearError("category_ids");
  };

  const toggleFeature = (featureId: number, checked: boolean) => {
    setForm((prev) => ({
      ...prev,
      feature_ids: checked
        ? prev.feature_ids.includes(featureId)
          ? prev.feature_ids
          : [...prev.feature_ids, featureId]
        : prev.feature_ids.filter((item) => item !== featureId),
    }));
    clearError("feature_ids");
  };

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

  const handleBusinessAddressSameAsHospitalChange = React.useCallback(
    (checked: boolean) => {
      setIsBusinessAddressSameAsHospital(checked);

      if (!checked) {
        return;
      }

      setForm((prev) => ({
        ...prev,
        business_address: prev.address,
        business_address_detail: prev.address_detail,
      }));
      clearError("business_address");
      clearError("business_address_detail");
    },
    [clearError],
  );

  const fetchHospital = React.useCallback(async () => {
    if (!Number.isFinite(hospitalId) || hospitalId <= 0) {
      setLoadError("잘못된 병의원 경로입니다.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      const response = await api.get<HospitalDetailResponse>(`/hospitals/${hospitalId}/edit`, {
        include: "business_registration,categories,features",
      });

      if (!isApiSuccess(response)) {
        setLoadError(response.error.message || "병의원 정보를 불러오지 못했습니다.");
        return;
      }

      const data = response.data;
      const nextForm = mapHospitalDetailToForm(data);

      setForm(nextForm);
      setSelectedCategoryItems(data.categories ?? []);
      setExistingLogo(data.logo ?? null);
      setExistingGallery(data.gallery ?? []);
      setGalleryOrder(
        (data.gallery ?? [])
          .map((media) => (media.id !== null && media.id !== undefined ? `existing:${String(media.id)}` : null))
          .filter((token): token is string => Boolean(token)),
      );
      setExistingCertificate(data.business_registration?.certificate_media ?? null);
      setPageTitle(data.name ? `${data.name} 수정` : "병의원 수정");
      setIsBusinessAddressSameAsHospital(
        Boolean(nextForm.address.trim()) &&
          nextForm.address === nextForm.business_address &&
          nextForm.address_detail === nextForm.business_address_detail,
      );
    } catch {
      setLoadError("병의원 정보를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [hospitalId]);

  React.useEffect(() => {
    void fetchHospital();
  }, [fetchHospital]);

  const validate = () => {
    const nextErrors = validateUpdateHospitalForm({
      form,
      logo,
      existingLogo,
      gallery,
      existingGallery,
      businessRegistrationFile,
      existingCertificate,
    });

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      focusFirstErrorField(nextErrors);
      return false;
    }

    return true;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validate()) return;
    if (!Number.isFinite(hospitalId) || hospitalId <= 0) return;

    const formData = new FormData();
    formData.append("_method", "PATCH");
    formData.append("description", form.description.trim());
    formData.append("consulting_hours", form.consulting_hours.trim());
    formData.append("direction", form.direction.trim());
    formData.append("address", form.address.trim());
    formData.append("address_detail", form.address_detail.trim());
    formData.append("latitude", form.latitude.trim());
    formData.append("longitude", form.longitude.trim());
    formData.append("tel", form.tel.trim());
    formData.append("email", form.email.trim());
    formData.append("allow_status", form.allow_status);
    formData.append("status", form.status);
    formData.append("business_number", normalizeBusinessNumber(form.business_number));
    formData.append("company_name", form.company_name.trim());
    formData.append("ceo_name", form.ceo_name.trim());
    formData.append("business_type", form.business_type.trim());
    formData.append("business_item", form.business_item.trim());
    formData.append("business_address", form.business_address.trim());
    formData.append("business_address_detail", form.business_address_detail.trim());

    if (form.issued_at) {
      formData.append("issued_at", form.issued_at);
    }

    if (form.category_ids.length > 0) {
      form.category_ids.forEach((categoryId) => {
        formData.append("category_ids[]", String(categoryId));
      });
    } else {
      formData.append("category_ids[]", "");
    }

    if (form.feature_ids.length > 0) {
      form.feature_ids.forEach((featureId) => {
        formData.append("feature_ids[]", String(featureId));
      });
    } else {
      formData.append("feature_ids[]", "");
    }

    if (logo) {
      formData.append("logo", logo);
    } else {
      formData.append("existing_logo_id", existingLogo?.id ? String(existingLogo.id) : "");
    }

    let nextGalleryFileIndex = 0;
    if (galleryOrder.length > 0) {
      galleryOrder.forEach((token) => {
        if (token.startsWith("existing:")) {
          formData.append("gallery_order[]", token);
          return;
        }

        if (token.startsWith("new:")) {
          formData.append("gallery_order[]", `new:${nextGalleryFileIndex}`);
          nextGalleryFileIndex += 1;
        }
      });
    }

    if (gallery.length > 0) {
      gallery.forEach((file) => formData.append("gallery[]", file));
    }

    if (businessRegistrationFile) {
      formData.append("business_registration_file", businessRegistrationFile);
    } else {
      formData.append(
        "existing_business_registration_file_id",
        existingCertificate?.id ? String(existingCertificate.id) : "",
      );
    }

    setIsSubmitting(true);

    try {
      const response = await api.post<HospitalDetailResponse>(`/hospitals/${hospitalId}`, formData);

      if (!isApiSuccess(response)) {
        const nextErrors = extractFieldErrors(response.error.details);
        if (Object.keys(nextErrors).length > 0) {
          setErrors(nextErrors);
          focusFirstErrorField(nextErrors);
        }

        showAlert({
          variant: "error",
          title: "병의원 수정 실패",
          message: response.error.message || "병의원 수정에 실패했습니다.",
        });
        return;
      }

      showAlert({
        variant: "success",
        title: "병의원 수정 완료",
        message: "수정된 병의원을 목록에서 확인할 수 있습니다.",
      });
      router.push(getReturnToPath(hospitalId));
    } catch {
      showAlert({
        variant: "error",
        title: "병의원 수정 실패",
        message: "병의원 수정 중 오류가 발생했습니다.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentCertificateLabel = businessRegistrationFile ? `선택된 파일: ${businessRegistrationFile.name}` : "jpg, png, pdf / 최대 10MB";
  const existingCertificateUrl = resolveMediaUrl(existingCertificate);
  const existingMediaByCollection = React.useMemo(
    () => buildHospitalExistingMediaItems(existingLogo, existingGallery),
    [existingGallery, existingLogo],
  );

  if (isLoading) {
    return (
      <SpinnerBlock className="min-h-[60vh]" spinnerClassName="size-10" label="병의원 정보 불러오는 중" />
    );
  }

  if (loadError) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>병의원 정보를 불러오지 못했습니다.</CardTitle>
          <CardDescription>{loadError}</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2 pt-0">
          <Button type="button" variant="brand" onClick={() => void fetchHospital()}>
            다시 불러오기
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push(getReturnToPath())}>
            목록으로
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:items-start lg:grid-cols-[minmax(0,1.36fr)_minmax(240px,0.64fr)]">
      <Card as="section" className="min-w-0">
        <CardHeader className="pb-6">
          <CardTitle>{pageTitle}</CardTitle>
        </CardHeader>

        <div className="space-y-10 divide-y divide-gray-200 dark:divide-gray-800">
          <HospitalBasicSection
            mode="edit"
            form={form}
            errors={errors}
              daumPostcodeError={daumPostcodeError}
              hospitalFeatures={hospitalFeatures}
              selectedCategoryItems={selectedCategoryItems}
              isHospitalFeaturesLoading={isHospitalFeaturesLoading}
              hospitalFeaturesError={hospitalFeaturesError}
              loadCategories={loadCategories}
            onToggleCategory={toggleCategory}
            onToggleFeature={toggleFeature}
            onOpenAddressSearch={openAddressSearch}
            onFieldChange={setField}
          />

          <HospitalBusinessSection
            mode="edit"
            form={form}
            errors={errors}
            isBusinessAddressSameAsHospital={isBusinessAddressSameAsHospital}
            businessRegistrationLabel={existingCertificate ? "사업자등록증 파일" : "사업자등록증 파일 *"}
            businessRegistrationDescription={currentCertificateLabel}
            existingCertificateName={!businessRegistrationFile && existingCertificate ? getMediaFilename(existingCertificate) : undefined}
            existingCertificateSizeText={!businessRegistrationFile && existingCertificate ? formatBytes(existingCertificate.size) : undefined}
            existingCertificateUrl={!businessRegistrationFile ? existingCertificateUrl : undefined}
            onFieldChange={setField}
            onBusinessRegistrationFileChange={(file) => {
              setBusinessRegistrationFile(file);
              clearError("business_registration_file");
            }}
            onExistingCertificateChange={(hasFile) => {
              setExistingCertificate(hasFile ? existingCertificate : null);
              clearError("business_registration_file");
            }}
            onBusinessAddressSameAsHospitalChange={handleBusinessAddressSameAsHospitalChange}
            onGuideHospitalAddressSelection={guideHospitalAddressSelection}
            onOpenAddressSearch={openAddressSearch}
          />
        </div>

      </Card>

      <div className="min-w-0 space-y-6">
        <HospitalMediaPanel
          filesByCollection={{
            logo: logo ? [logo] : [],
            gallery,
          }}
          existingItemsByCollection={existingMediaByCollection}
          orderByCollection={{
            gallery: galleryOrder,
          }}
          errors={{
            logo: errors.logo,
            gallery: errors.gallery,
          }}
          onExistingItemsChange={(key, items) => {
            if (key === "logo") {
              setExistingLogo((prev) => (items[0] && prev ? prev : null));
              clearError("logo");
              return;
            }

            if (key !== "gallery") return;

            const galleryById = new Map(existingGallery.map((media, index) => [String(media.id ?? `gallery-${index}`), media]));
            const nextGallery = items
              .map((item) => galleryById.get(String(item.id)))
              .filter((media): media is MediaAsset => Boolean(media));

            setExistingGallery(nextGallery);
            clearError("gallery");
          }}
          onOrderChange={(key, order) => {
            if (key !== "gallery") return;

            setGalleryOrder(order);
            clearError("gallery");
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

        <div className="flex flex-col gap-3">
          <Button type="button" variant="outline" size="auth" className="w-full" onClick={() => router.push(getReturnToPath())}>
            목록으로
          </Button>
          <Button type="submit" variant="brand" size="auth" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "저장 중..." : "수정 저장"}
          </Button>
        </div>
      </div>
    </form>
  );
}
