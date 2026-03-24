"use client";

import React from "react";

import { DoctorBasicInfoSection } from "@/components/doctor/form/DoctorBasicInfoSection";
import { DoctorCategorySection } from "@/components/doctor/form/DoctorCategorySection";
import { DoctorMedicalInfoSection } from "@/components/doctor/form/DoctorMedicalInfoSection";
import { useCategorySelectorLoader } from "@/hooks/common/useCategorySelectorLoader";
import { useDoctorFieldFocus } from "@/hooks/doctor/useDoctorFieldFocus";
import { api } from "@/lib/common/api";
import {
  extractDoctorFieldErrors,
  INITIAL_DOCTOR_FORM,
  sanitizeDoctorList,
  validateCreateDoctorForm,
  type DoctorFieldName,
  type DoctorFormErrors,
  type DoctorFormValues,
  type DoctorHospitalOption,
} from "@/lib/doctor/form";
import { isApiSuccess } from "@beaulab/types";
import { Button, useGlobalAlert } from "@beaulab/ui-admin";
import { useRouter } from "next/navigation";

export default function DoctorsCreateFormClient() {
  const router = useRouter();
  const { showAlert } = useGlobalAlert();
  const loadCategories = useCategorySelectorLoader();
  const { focusFirstErrorField } = useDoctorFieldFocus();

  const [form, setForm] = React.useState<DoctorFormValues>(INITIAL_DOCTOR_FORM);
  const [profileImage, setProfileImage] = React.useState<File | null>(null);
  const [licenseImage, setLicenseImage] = React.useState<File | null>(null);
  const [specialistCertificateImage, setSpecialistCertificateImage] = React.useState<File | null>(null);
  const [educationCertificateImages, setEducationCertificateImages] = React.useState<File[]>([]);
  const [etcCertificateImages, setEtcCertificateImages] = React.useState<File[]>([]);
  const [errors, setErrors] = React.useState<DoctorFormErrors>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

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

  const validate = React.useCallback(() => {
    const nextErrors = validateCreateDoctorForm({ form });
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

    const formData = new FormData();
    formData.append("hospital_id", String(form.hospital_id));
    formData.append("name", form.name.trim());
    formData.append("gender", form.gender);
    formData.append("position", form.position);
    formData.append("status", form.status);
    formData.append("allow_status", form.allow_status);
    formData.append("is_specialist", form.is_specialist ? "1" : "0");

    if (form.career_started_at) {
      formData.append("career_started_at", form.career_started_at);
    }

    if (form.license_number.trim()) {
      formData.append("license_number", form.license_number.trim());
    }

    form.category_ids.forEach((categoryId) => {
      formData.append("category_ids[]", String(categoryId));
    });

    const educations = sanitizeDoctorList(form.educations);
    const careers = sanitizeDoctorList(form.careers);
    const etcContents = sanitizeDoctorList(form.etc_contents);

    if (educations.length > 0) {
      formData.append("educations", JSON.stringify(educations));
    }

    if (careers.length > 0) {
      formData.append("careers", JSON.stringify(careers));
    }

    if (etcContents.length > 0) {
      formData.append("etc_contents", JSON.stringify(etcContents));
    }

    if (profileImage) {
      formData.append("profile_image", profileImage);
    }

    if (licenseImage) {
      formData.append("license_image", licenseImage);
    }

    if (specialistCertificateImage) {
      formData.append("specialist_certificate_image", specialistCertificateImage);
    }
    educationCertificateImages.forEach((file) => formData.append("education_certificate_image[]", file));
    etcCertificateImages.forEach((file) => formData.append("etc_certificate_image[]", file));

    setIsSubmitting(true);

    try {
      const response = await api.post<{ id: number }>("/doctors", formData);

      if (!isApiSuccess(response)) {
        const nextErrors = extractDoctorFieldErrors(response.error.details);
        if (Object.keys(nextErrors).length > 0) {
          setErrors(nextErrors);
          focusFirstErrorField(nextErrors);
        }

        showAlert({
          variant: "error",
          title: "의료진 등록 실패",
          message: response.error.message || "의료진 등록에 실패했습니다.",
        });
        return;
      }

      showAlert({
        variant: "success",
        title: "의료진 등록 완료",
        message: "새로 등록된 의료진을 목록에서 확인할 수 있습니다.",
      });
      router.push(`/doctors?highlight=${response.data.id}`);
    } catch {
      showAlert({
        variant: "error",
        title: "의료진 등록 실패",
        message: "의료진 등록 중 오류가 발생했습니다.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectHospital = React.useCallback(
    (hospital: DoctorHospitalOption) => {
      setForm((prev) => ({
        ...prev,
        hospital_id: hospital.id,
        hospital_name: hospital.name,
        hospital_business_number: hospital.business_number?.trim() ?? "",
      }));
      clearError("hospital_id");
    },
    [clearError],
  );

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 xl:items-start xl:grid-cols-[minmax(0,1.32fr)_minmax(320px,0.68fr)]">
      <div className="min-w-0 flex flex-col gap-6">
        <DoctorBasicInfoSection
          form={form}
          errors={errors}
          profileImage={profileImage}
          showStatusFields
          onFieldChange={setField}
          onSelectHospital={handleSelectHospital}
          onProfileImageChange={(file) => {
            setProfileImage(file);
            clearError("profile_image");
          }}
        />

        <DoctorCategorySection
          selectedIds={form.category_ids}
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
          onFieldChange={setField}
          onLicenseImageChange={(file) => {
            setLicenseImage(file);
            clearError("license_image");
          }}
          onSpecialistCertificateImageChange={(file) => {
            setSpecialistCertificateImage(file);
            clearError("specialist_certificate_image");
          }}
          onEducationCertificateImagesChange={(files) => {
            setEducationCertificateImages(files);
            clearError("education_certificate_image");
          }}
          onEtcCertificateImagesChange={(files) => {
            setEtcCertificateImages(files);
            clearError("etc_certificate_image");
          }}
        />

        <div className="flex flex-col gap-3">
          <Button type="button" variant="outline" size="auth" className="w-full" onClick={() => router.push("/doctors")}>
            목록으로
          </Button>
          <Button type="submit" variant="brand" size="auth" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "등록 중..." : "의료진 등록"}
          </Button>
        </div>
      </div>
    </form>
  );
}
