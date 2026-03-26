"use client";

import React from "react";

import { DoctorBasicInfoSection } from "@/components/doctor/form/DoctorBasicInfoSection";
import { DoctorCategorySection } from "@/components/doctor/form/DoctorCategorySection";
import { DoctorMedicalInfoSection } from "@/components/doctor/form/DoctorMedicalInfoSection";
import { useCategorySelectorLoader } from "@/hooks/common/useCategorySelectorLoader";
import { useDoctorFieldFocus } from "@/hooks/doctor/useDoctorFieldFocus";
import { api } from "@/lib/common/api";
import { buildReturnToPath } from "@/lib/common/navigation/buildReturnToPath";
import {
  buildDoctorExistingFileItem,
  buildDoctorExistingFileItems,
  extractDoctorFieldErrors,
  INITIAL_DOCTOR_FORM,
  mapDoctorDetailToForm,
  sanitizeDoctorList,
  validateUpdateDoctorForm,
  type DoctorCategoryItem,
  type DoctorDetailResponse,
  type DoctorFieldName,
  type DoctorFormErrors,
  type DoctorFormValues,
} from "@/lib/doctor/form";
import { isApiSuccess } from "@beaulab/types";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  SpinnerBlock,
  type ExistingMediaItem,
  useGlobalAlert,
} from "@beaulab/ui-admin";
import { useParams, useRouter, useSearchParams } from "next/navigation";

export default function DoctorEditFormClient() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showAlert } = useGlobalAlert();
  const loadCategories = useCategorySelectorLoader();
  const { focusFirstErrorField } = useDoctorFieldFocus();

  const rawDoctorId = Array.isArray(params.id) ? params.id[0] : params.id;
  const doctorId = Number(rawDoctorId);

  const [form, setForm] = React.useState<DoctorFormValues>(INITIAL_DOCTOR_FORM);
  const [profileImage, setProfileImage] = React.useState<File | null>(null);
  const [licenseImage, setLicenseImage] = React.useState<File | null>(null);
  const [specialistCertificateImage, setSpecialistCertificateImage] = React.useState<File | null>(null);
  const [educationCertificateImages, setEducationCertificateImages] = React.useState<File[]>([]);
  const [etcCertificateImages, setEtcCertificateImages] = React.useState<File[]>([]);
  const [existingProfileImage, setExistingProfileImage] = React.useState<ExistingMediaItem | null>(null);
  const [selectedCategoryItems, setSelectedCategoryItems] = React.useState<DoctorCategoryItem[]>([]);
  const [existingLicenseImage, setExistingLicenseImage] = React.useState<ReturnType<typeof buildDoctorExistingFileItem>>(null);
  const [existingSpecialistCertificateImage, setExistingSpecialistCertificateImage] =
    React.useState<ReturnType<typeof buildDoctorExistingFileItem>>(null);
  const [existingEducationCertificateImages, setExistingEducationCertificateImages] = React.useState<
    ReturnType<typeof buildDoctorExistingFileItems>
  >([]);
  const [existingEtcCertificateImages, setExistingEtcCertificateImages] = React.useState<
    ReturnType<typeof buildDoctorExistingFileItems>
  >([]);
  const [errors, setErrors] = React.useState<DoctorFormErrors>({});
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const getReturnToPath = React.useCallback(
    (highlightId?: number) => {
      return buildReturnToPath({
        searchParams,
        fallbackPath: "/doctors",
        allowedPrefix: "/doctors",
        highlightId,
      });
    },
    [searchParams],
  );

  const clearError = React.useCallback((field: DoctorFieldName) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;

      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const setField = React.useCallback(
    <K extends keyof DoctorFormValues>(key: K, value: DoctorFormValues[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      clearError(key);
    },
    [clearError],
  );

  const toggleCategory = React.useCallback(
    (categoryId: number, checked: boolean) => {
      setForm((prev) => ({
        ...prev,
        category_ids: checked
          ? prev.category_ids.includes(categoryId)
            ? prev.category_ids
            : [...prev.category_ids, categoryId]
          : prev.category_ids.filter((item) => item !== categoryId),
      }));
      clearError("category_ids");
    },
    [clearError],
  );

  const fetchDoctor = React.useCallback(async () => {
    if (!Number.isFinite(doctorId) || doctorId <= 0) {
      setLoadError("잘못된 의료진 경로입니다.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      const response = await api.get<DoctorDetailResponse>(`/doctors/${doctorId}/edit`);

      if (!isApiSuccess(response)) {
        setLoadError(response.error.message || "의료진 정보를 불러오지 못했습니다.");
        return;
      }

      const detail = response.data;
      setForm(mapDoctorDetailToForm(detail));
      setSelectedCategoryItems(detail.categories ?? []);
      setExistingProfileImage(buildDoctorExistingFileItem(detail.profile_image));
      setExistingLicenseImage(buildDoctorExistingFileItem(detail.license_image));
      setExistingSpecialistCertificateImage(buildDoctorExistingFileItem(detail.specialist_certificate_image));
      const nextEducationCertificateImages = buildDoctorExistingFileItems(detail.education_certificate_image);
      const nextEtcCertificateImages = buildDoctorExistingFileItems(detail.etc_certificate_image);

      setExistingEducationCertificateImages(nextEducationCertificateImages);
      setExistingEtcCertificateImages(nextEtcCertificateImages);
    } catch {
      setLoadError("의료진 정보를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [doctorId]);

  React.useEffect(() => {
    void fetchDoctor();
  }, [fetchDoctor]);

  const validate = React.useCallback(() => {
    const nextErrors = validateUpdateDoctorForm({ form });
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      focusFirstErrorField(nextErrors);
      return false;
    }

    return true;
  }, [focusFirstErrorField, form]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validate()) return;
    if (!Number.isFinite(doctorId) || doctorId <= 0) return;

    const formData = new FormData();
    formData.append("_method", "PATCH");
    formData.append("name", form.name.trim());
    formData.append("gender", form.gender);
    formData.append("position", form.position);
    formData.append("status", form.status);
    formData.append("allow_status", form.allow_status);
    formData.append("career_started_at", form.career_started_at);
    formData.append("license_number", form.license_number.trim());
    formData.append("is_specialist", form.is_specialist ? "1" : "0");
    formData.append("educations", JSON.stringify(sanitizeDoctorList(form.educations)));
    formData.append("careers", JSON.stringify(sanitizeDoctorList(form.careers)));
    formData.append("etc_contents", JSON.stringify(sanitizeDoctorList(form.etc_contents)));

    if (form.category_ids.length > 0) {
      form.category_ids.forEach((categoryId) => {
        formData.append("category_ids[]", String(categoryId));
      });
    } else {
      formData.append("category_ids[]", "");
    }

    if (profileImage) {
      formData.append("profile_image", profileImage);
    } else {
      formData.append("existing_profile_image_id", existingProfileImage?.id ? String(existingProfileImage.id) : "");
    }

    if (licenseImage) {
      formData.append("license_image", licenseImage);
    } else {
      formData.append("existing_license_image_id", existingLicenseImage?.id ? String(existingLicenseImage.id) : "");
    }

    if (specialistCertificateImage) {
      formData.append("specialist_certificate_image", specialistCertificateImage);
    } else {
      formData.append(
        "existing_specialist_certificate_image_id",
        existingSpecialistCertificateImage?.id ? String(existingSpecialistCertificateImage.id) : "",
      );
    }

    if (existingEducationCertificateImages.length > 0) {
      existingEducationCertificateImages.forEach((item) => {
        formData.append("existing_education_certificate_image_ids[]", String(item.id));
      });
    } else {
      formData.append("existing_education_certificate_image_ids[]", "");
    }

    if (educationCertificateImages.length > 0) {
      educationCertificateImages.forEach((file) => {
        formData.append("education_certificate_image[]", file);
      });
    }

    if (existingEtcCertificateImages.length > 0) {
      existingEtcCertificateImages.forEach((item) => {
        formData.append("existing_etc_certificate_image_ids[]", String(item.id));
      });
    } else {
      formData.append("existing_etc_certificate_image_ids[]", "");
    }

    if (etcCertificateImages.length > 0) {
      etcCertificateImages.forEach((file) => {
        formData.append("etc_certificate_image[]", file);
      });
    }

    setIsSubmitting(true);

    try {
      const response = await api.post<DoctorDetailResponse>(`/doctors/${doctorId}`, formData);

      if (!isApiSuccess(response)) {
        const nextErrors = extractDoctorFieldErrors(response.error.details);
        if (Object.keys(nextErrors).length > 0) {
          setErrors(nextErrors);
          focusFirstErrorField(nextErrors);
        }

        showAlert({
          variant: "error",
          title: "의료진 수정 실패",
          message: response.error.message || "의료진 수정에 실패했습니다.",
        });
        return;
      }

      showAlert({
        variant: "success",
        title: "의료진 수정 완료",
        message: "수정된 의료진을 목록에서 확인할 수 있습니다.",
      });
      router.push(getReturnToPath(doctorId));
    } catch {
      showAlert({
        variant: "error",
        title: "의료진 수정 실패",
        message: "의료진 수정 중 오류가 발생했습니다.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <SpinnerBlock className="min-h-[60vh]" spinnerClassName="size-10" />;
  }

  if (loadError) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>의료진 정보를 불러오지 못했습니다.</CardTitle>
          <CardDescription>{loadError}</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2 pt-0">
          <Button type="button" variant="brand" onClick={() => void fetchDoctor()}>
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
    <form onSubmit={handleSubmit} className="grid gap-6 xl:items-start xl:grid-cols-[minmax(0,1.38fr)_minmax(240px,0.62fr)]">
      <div className="min-w-0 flex flex-col gap-6">
        <DoctorBasicInfoSection
          form={form}
          errors={errors}
          profileImage={profileImage}
          existingProfileImage={profileImage ? null : existingProfileImage}
          hospitalSelectionMode="readonly"
          showStatusFields
          onFieldChange={setField}
          onSelectHospital={() => undefined}
          onProfileImageChange={(file) => {
            setProfileImage(file);
            clearError("profile_image");
          }}
          onExistingProfileImageChange={(item) => {
            setExistingProfileImage(item);
            clearError("profile_image");
          }}
        />

        <DoctorCategorySection
          selectedIds={form.category_ids}
          selectedItems={selectedCategoryItems}
          errors={errors}
          loadCategories={loadCategories}
          onToggleCategory={toggleCategory}
        />
      </div>

      <div className="min-w-0 space-y-6">
        <DoctorMedicalInfoSection
          form={form}
          errors={errors}
          licenseImage={licenseImage}
          specialistCertificateImage={specialistCertificateImage}
          educationCertificateImages={educationCertificateImages}
          etcCertificateImages={etcCertificateImages}
          existingLicenseImage={licenseImage ? null : existingLicenseImage}
          existingSpecialistCertificateImage={specialistCertificateImage ? null : existingSpecialistCertificateImage}
          existingEducationCertificateImages={existingEducationCertificateImages}
          existingEtcCertificateImages={existingEtcCertificateImages}
          onFieldChange={setField}
          onLicenseImageChange={(file) => {
            setLicenseImage(file);
            clearError("license_image");
          }}
          onExistingLicenseImageChange={(file) => {
            setExistingLicenseImage(file);
            clearError("license_image");
          }}
          onSpecialistCertificateImageChange={(file) => {
            setSpecialistCertificateImage(file);
            clearError("specialist_certificate_image");
          }}
          onExistingSpecialistCertificateImageChange={(file) => {
            setExistingSpecialistCertificateImage(file);
            clearError("specialist_certificate_image");
          }}
          onEducationCertificateImagesChange={(files) => {
            setEducationCertificateImages(files);
            clearError("education_certificate_image");
          }}
          onExistingEducationCertificateImagesChange={(files) => {
            setExistingEducationCertificateImages(files);
            clearError("education_certificate_image");
          }}
          onEtcCertificateImagesChange={(files) => {
            setEtcCertificateImages(files);
            clearError("etc_certificate_image");
          }}
          onExistingEtcCertificateImagesChange={(files) => {
            setExistingEtcCertificateImages(files);
            clearError("etc_certificate_image");
          }}
        />

        <div className="flex flex-col gap-3">
          <Button type="button" variant="outline" size="auth" className="w-full" onClick={() => router.push(getReturnToPath())}>
            목록으로
          </Button>
          <Button type="submit" variant="brand" size="auth" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "수정 중..." : "수정 저장"}
          </Button>
        </div>
      </div>
    </form>
  );
}
