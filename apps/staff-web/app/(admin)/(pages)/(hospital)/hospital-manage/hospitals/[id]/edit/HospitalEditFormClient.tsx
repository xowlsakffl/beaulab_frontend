"use client";

import { LoadErrorState } from "@/components/common/LoadErrorState";
import { HospitalFormLayout } from "@/components/hospital/form/HospitalFormLayout";
import { useDaumPostcode } from "@/hooks/common/useDaumPostcode";
import { useHospitalAddressSearch } from "@/hooks/hospital/useHospitalAddressSearch";
import { useHospitalCategorySelectorLoader } from "@/hooks/hospital/useHospitalCategorySelectorLoader";
import { useHospitalFieldFocus } from "@/hooks/hospital/useHospitalFieldFocus";
import { useHospitalFeatureList } from "@/hooks/hospital/useHospitalFeatureList";
import { useHospitalFormSelections } from "@/hooks/hospital/useHospitalFormSelections";
import { api } from "@/lib/common/api";
import { usePageHeaderExtra } from "@/lib/common/routing/page-header-extra";
import type { HospitalCategoryItem, HospitalDetailResponse, MediaAsset } from "@/lib/hospital/detail";
import {
  buildHospitalExistingMediaItems,
  buildUpdateHospitalFormData,
  extractFieldErrors,
  hospitalMediaId,
  INITIAL_HOSPITAL_FORM,
  mapHospitalDetailToForm,
  validateUpdateHospitalForm,
  type HospitalFieldName,
  type HospitalFormErrors,
  type HospitalFormValues,
} from "@/lib/hospital/form";
import { buildReturnToPath } from "@/lib/common/navigation/buildReturnToPath";
import { isApiSuccess } from "@beaulab/types";
import { Button, SpinnerBlock, useGlobalAlert } from "@beaulab/ui-admin";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import React from "react";

const HOSPITAL_EDIT_FORM_ID = "hospital-edit-form";

export default function HospitalEditFormClient() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showAlert } = useGlobalAlert();
  const { openPostcode, geocodeAddress } = useDaumPostcode();
  const { focusFirstErrorField } = useHospitalFieldFocus();
  const loadCategories = useHospitalCategorySelectorLoader();
  const {
    features: hospitalFeatures,
    isLoading: isHospitalFeaturesLoading,
    error: hospitalFeaturesError,
  } = useHospitalFeatureList();
  const getReturnToPath = React.useCallback(
    (highlightId?: number) =>
      buildReturnToPath({
        searchParams,
        fallbackPath: "/hospital-manage/hospitals",
        allowedPrefix: "/hospital-manage/hospitals",
        highlightId,
      }),
    [searchParams],
  );

  const rawHospitalId = Array.isArray(params.id) ? params.id[0] : params.id;
  const hospitalId = Number(rawHospitalId);

  const detailPath = React.useMemo(() => {
    if (!Number.isFinite(hospitalId) || hospitalId <= 0) return "/hospital-manage/hospitals";

    const rawReturnTo = searchParams.get("returnTo");
    return rawReturnTo
      ? `/hospital-manage/hospitals/${hospitalId}?returnTo=${encodeURIComponent(rawReturnTo)}`
      : `/hospital-manage/hospitals/${hospitalId}`;
  }, [hospitalId, searchParams]);

  const [form, setForm] = React.useState<HospitalFormValues>(INITIAL_HOSPITAL_FORM);
  const [initialForm, setInitialForm] = React.useState<HospitalFormValues | null>(null);
  const [logo, setLogo] = React.useState<File | null>(null);
  const [gallery, setGallery] = React.useState<File[]>([]);
  const [businessRegistrationFile, setBusinessRegistrationFile] = React.useState<File | null>(null);
  const [existingLogo, setExistingLogo] = React.useState<MediaAsset | null>(null);
  const [existingGallery, setExistingGallery] = React.useState<MediaAsset[]>([]);
  const [galleryOrder, setGalleryOrder] = React.useState<string[]>([]);
  const [existingCertificate, setExistingCertificate] = React.useState<MediaAsset | null>(null);
  const [accountHospital, setAccountHospital] = React.useState<HospitalDetailResponse["account_hospital"]>(null);
  const [pointBalance, setPointBalance] = React.useState<HospitalDetailResponse["point_balance"]>(null);
  const [initialLogoId, setInitialLogoId] = React.useState<string | null>(null);
  const [initialCertificateId, setInitialCertificateId] = React.useState<string | null>(null);
  const [initialGalleryOrder, setInitialGalleryOrder] = React.useState<string[]>([]);
  const [selectedCategoryItems, setSelectedCategoryItems] = React.useState<HospitalCategoryItem[]>([]);
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

  const { openAddressSearch } = useHospitalAddressSearch({
    openPostcode,
    geocodeAddress,
    clearError,
    setErrors,
    setForm,
    showAlert,
  });

  const { toggleCategory, toggleFeature } = useHospitalFormSelections({
    categoryIds: form.category_ids,
    setForm,
    setErrors,
    clearError,
  });

  const fetchHospital = React.useCallback(async () => {
    if (!Number.isFinite(hospitalId) || hospitalId <= 0) {
      setLoadError("잘못된 병의원 경로입니다.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      const response = await api.get<HospitalDetailResponse>(`/hospitals/${hospitalId}`, {
        include: "business_registration,categories,features,account_hospital",
      });

      if (!isApiSuccess(response)) {
        setLoadError(response.error.message || "병의원 정보를 불러오지 못했습니다.");
        return;
      }

      const data = response.data;
      const nextForm = mapHospitalDetailToForm(data);
      const nextGalleryOrder = (data.gallery ?? [])
        .map((media) => (media.id !== null && media.id !== undefined ? `existing:${String(media.id)}` : null))
        .filter((token): token is string => Boolean(token));

      setForm(nextForm);
      setInitialForm(nextForm);
      setSelectedCategoryItems(data.categories ?? []);
      setExistingLogo(data.logo ?? null);
      setExistingGallery(data.gallery ?? []);
      setGallery([]);
      setLogo(null);
      setBusinessRegistrationFile(null);
      setGalleryOrder(nextGalleryOrder);
      setInitialGalleryOrder(nextGalleryOrder);
      setExistingCertificate(data.business_registration?.certificate_media ?? null);
      setAccountHospital(data.account_hospital ?? null);
      setPointBalance(data.point_balance ?? null);
      setInitialLogoId(hospitalMediaId(data.logo));
      setInitialCertificateId(hospitalMediaId(data.business_registration?.certificate_media ?? null));
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
      window.setTimeout(() => focusFirstErrorField(nextErrors), 0);
      return false;
    }

    return true;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validate()) return;
    if (!Number.isFinite(hospitalId) || hospitalId <= 0) return;

    const formData = buildUpdateHospitalFormData({
      form,
      baseline: initialForm,
      logo,
      existingLogo,
      initialLogoId,
      gallery,
      galleryOrder,
      initialGalleryOrder,
      businessRegistrationFile,
      existingCertificate,
      initialCertificateId,
    });

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
        message: "수정된 병의원 정보를 확인할 수 있습니다.",
      });
      router.push(detailPath);
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

  const existingMediaByCollection = React.useMemo(
    () => buildHospitalExistingMediaItems(existingLogo, existingGallery),
    [existingGallery, existingLogo],
  );

  const headerActions = React.useMemo(
    () => (
      <>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => router.push(getReturnToPath())}
          disabled={isSubmitting}
        >
          취소
        </Button>
        <Button type="submit" form={HOSPITAL_EDIT_FORM_ID} variant="brand" size="sm" disabled={isSubmitting}>
          {isSubmitting ? "저장 중..." : "저장하기"}
        </Button>
      </>
    ),
    [getReturnToPath, isSubmitting, router],
  );

  usePageHeaderExtra(isLoading || loadError ? null : headerActions);

  if (isLoading) {
    return <SpinnerBlock className="min-h-[60vh]" spinnerClassName="size-10" label="병의원 정보 불러오는 중" />;
  }

  if (loadError) {
    return <LoadErrorState title="병의원 정보를 불러오지 못했습니다." message={loadError} />;
  }

  return (
    <HospitalFormLayout
      mode="edit"
      formId={HOSPITAL_EDIT_FORM_ID}
      form={form}
      errors={errors}
      logo={logo}
      gallery={gallery}
      existingLogo={existingLogo}
      existingMediaByCollection={existingMediaByCollection}
      galleryOrder={galleryOrder}
      businessRegistrationFile={businessRegistrationFile}
      existingCertificate={existingCertificate}
      accountHospital={accountHospital}
      pointBalance={pointBalance}
      selectedCategoryItems={selectedCategoryItems}
      hospitalFeatures={hospitalFeatures}
      isHospitalFeaturesLoading={isHospitalFeaturesLoading}
      hospitalFeaturesError={hospitalFeaturesError}
      onSubmit={handleSubmit}
      onFieldChange={setField}
      onLogoChange={(file) => {
        setLogo(file);
        clearError("logo");
      }}
      onGalleryChange={(files) => {
        setGallery(files);
        clearError("gallery");
      }}
      onExistingItemsChange={(key, items) => {
        if (key !== "gallery") return;

        const galleryById = new Map(
          existingGallery.map((media, index) => [String(media.id ?? `gallery-${index}`), media]),
        );
        const nextGallery = items
          .map((item) => galleryById.get(String(item.id)))
          .filter((media): media is MediaAsset => Boolean(media));

        setExistingGallery(nextGallery);
        clearError("gallery");
      }}
      onGalleryOrderChange={(order) => {
        setGalleryOrder(order);
        clearError("gallery");
      }}
      onBusinessRegistrationFileChange={(file) => {
        setBusinessRegistrationFile(file);
        clearError("business_registration_file");
      }}
      onExistingCertificateChange={(hasFile) => {
        setExistingCertificate(hasFile ? existingCertificate : null);
        clearError("business_registration_file");
      }}
      onOpenAddressSearch={openAddressSearch}
      loadCategories={loadCategories}
      onToggleCategory={toggleCategory}
      onToggleFeature={toggleFeature}
    />
  );
}
