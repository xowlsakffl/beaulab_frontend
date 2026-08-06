"use client";

import React from "react";

import {
  CategorySelectPanel,
  DoctorInfoEditorCard,
  ProfileImageEditor,
  RepeaterPanel,
} from "@/components/doctor/form/DoctorFormEditorPanels";
import { MediaPreviewModal } from "@/components/common/MediaPreviewModal";
import { LoadErrorState } from "@/components/common/LoadErrorState";
import { useDoctorCategorySelection } from "@/hooks/doctor/useDoctorCategorySelection";
import { useDoctorFieldFocus } from "@/hooks/doctor/useDoctorFieldFocus";
import { useDoctorMediaState } from "@/hooks/doctor/useDoctorMediaState";
import { api } from "@/lib/common/api";
import { buildReturnToPath } from "@/lib/common/navigation/buildReturnToPath";
import { usePageHeaderExtra } from "@/lib/common/routing/page-header-extra";
import type { DoctorCategoryItem, DoctorDetailResponse } from "@/lib/doctor/detail";
import {
  buildDoctorExistingFileItem,
  buildUpdateDoctorFormData,
  extractDoctorFieldErrors,
  INITIAL_DOCTOR_FORM,
  mapDoctorDetailToForm,
  validateUpdateDoctorForm,
  type DoctorFieldName,
  type DoctorFormErrors,
  type DoctorFormValues,
  type DoctorHospitalOption,
} from "@/lib/doctor/form";
import { isApiSuccess } from "@beaulab/types";
import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalPanel,
  ModalTitle,
  SpinnerBlock,
  useGlobalAlert,
} from "@beaulab/ui-admin";
import { useParams, useRouter, useSearchParams } from "next/navigation";

const DOCTOR_EDIT_FORM_ID = "doctor-edit-form";
export default function DoctorEditFormClient() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showAlert } = useGlobalAlert();
  const { focusFirstErrorField } = useDoctorFieldFocus();

  const rawDoctorId = Array.isArray(params.id) ? params.id[0] : params.id;
  const doctorId = Number(rawDoctorId);

  const [form, setForm] = React.useState<DoctorFormValues>(INITIAL_DOCTOR_FORM);
  const [selectedCategoryItems, setSelectedCategoryItems] = React.useState<DoctorCategoryItem[]>([]);
  const [errors, setErrors] = React.useState<DoctorFormErrors>({});
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const getReturnToPath = React.useCallback(
    (highlightId?: number) => {
      return buildReturnToPath({
        searchParams,
        fallbackPath: "/hospital-manage/doctors",
        allowedPrefix: "/hospital-manage/doctors",
        highlightId,
      });
    },
    [searchParams],
  );

  const detailPath = React.useMemo(() => {
    if (!Number.isFinite(doctorId) || doctorId <= 0) return "/hospital-manage/doctors";

    const rawReturnTo = searchParams.get("returnTo");
    return rawReturnTo
      ? `/hospital-manage/doctors/${doctorId}?returnTo=${encodeURIComponent(rawReturnTo)}`
      : `/hospital-manage/doctors/${doctorId}`;
  }, [doctorId, searchParams]);

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

  const {
    profileImage,
    licenseImage,
    specialistCertificateImage,
    existingProfileImage,
    setExistingProfileImage,
    existingLicenseImage,
    setExistingLicenseImage,
    existingSpecialistCertificateImage,
    setExistingSpecialistCertificateImage,
    previewMedia,
    setPreviewMedia,
    uploadModalMessage,
    closeUploadModal,
    handleProfileImageChange,
    handleLicenseImageChange,
    handleExistingLicenseImageChange,
    handleSpecialistCertificateImageChange,
    handleExistingSpecialistCertificateImageChange,
  } = useDoctorMediaState({ clearError });

  const handleSelectHospital = React.useCallback(
    (hospital: DoctorHospitalOption) => {
      setForm((prev) => ({
        ...prev,
        hospital_id: hospital.id,
        hospital_name: hospital.name,
        hospital_business_number: hospital.business_number ?? "",
      }));
      clearError("hospital_id");
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
      const response = await api.get<DoctorDetailResponse>(`/doctors/${doctorId}`);

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
    } catch {
      setLoadError("의료진 정보를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [doctorId, setExistingLicenseImage, setExistingProfileImage, setExistingSpecialistCertificateImage]);

  React.useEffect(() => {
    void fetchDoctor();
  }, [fetchDoctor]);

  const { categoryOptions, isCategoryLoading, categoryLoadError, toggleCategory } = useDoctorCategorySelection({
    categoryIds: form.category_ids,
    setForm,
    setErrors,
    clearError,
  });

  const validate = React.useCallback(() => {
    const nextErrors = validateUpdateDoctorForm({
      form,
      profileImage,
      existingProfileImage,
    });

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      window.setTimeout(() => focusFirstErrorField(nextErrors), 0);
      return false;
    }

    return true;
  }, [existingProfileImage, focusFirstErrorField, form, profileImage]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validate()) return;
    if (!Number.isFinite(doctorId) || doctorId <= 0) return;

    const formData = buildUpdateDoctorFormData({
      form,
      profileImage,
      existingProfileImage,
      licenseImage,
      existingLicenseImage,
      specialistCertificateImage,
      existingSpecialistCertificateImage,
    });

    setIsSubmitting(true);

    try {
      const response = await api.post<DoctorDetailResponse>(`/doctors/${doctorId}`, formData);

      if (!isApiSuccess(response)) {
        const nextErrors = extractDoctorFieldErrors(response.error.details);
        if (Object.keys(nextErrors).length > 0) {
          setErrors(nextErrors);
          window.setTimeout(() => focusFirstErrorField(nextErrors), 0);
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
        message: "수정된 의료진 정보를 확인할 수 있습니다.",
      });
      router.push(detailPath);
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
        <Button type="submit" form={DOCTOR_EDIT_FORM_ID} variant="brand" size="sm" disabled={isSubmitting}>
          {isSubmitting ? "저장 중..." : "저장하기"}
        </Button>
      </>
    ),
    [getReturnToPath, isSubmitting, router],
  );

  usePageHeaderExtra(isLoading || loadError ? null : headerActions);

  if (isLoading) {
    return <SpinnerBlock className="min-h-[60vh]" spinnerClassName="size-10" label="의료진 정보 불러오는 중" />;
  }

  if (loadError) {
    return <LoadErrorState title="의료진 정보를 불러오지 못했습니다." message={loadError} />;
  }

  return (
    <form id={DOCTOR_EDIT_FORM_ID} onSubmit={handleSubmit} autoComplete="off" className="min-w-0 space-y-4">
      <section className="grid min-w-0 grid-cols-1 items-stretch gap-4 xl:grid-cols-[20rem_minmax(0,1fr)]">
        <ProfileImageEditor
          file={profileImage}
          existingImage={profileImage ? null : existingProfileImage}
          error={errors.profile_image}
          onPreview={setPreviewMedia}
          onChange={handleProfileImageChange}
        />

        <DoctorInfoEditorCard
          form={form}
          errors={errors}
          licenseImage={licenseImage}
          specialistCertificateImage={specialistCertificateImage}
          existingLicenseImage={existingLicenseImage}
          existingSpecialistCertificateImage={existingSpecialistCertificateImage}
          onFieldChange={setField}
          onSelectHospital={handleSelectHospital}
          onClearHospital={() => {
            setForm((prev) => ({
              ...prev,
              hospital_id: null,
              hospital_name: "",
              hospital_business_number: "",
            }));
          }}
          onLicenseImageChange={handleLicenseImageChange}
          onExistingLicenseImageChange={handleExistingLicenseImageChange}
          onSpecialistCertificateImageChange={handleSpecialistCertificateImageChange}
          onExistingSpecialistCertificateImageChange={handleExistingSpecialistCertificateImageChange}
          showCurrentAllowStatus
        />

        <CategorySelectPanel
          selectedIds={form.category_ids}
          selectedItems={selectedCategoryItems}
          options={categoryOptions}
          isLoading={isCategoryLoading}
          loadError={categoryLoadError}
          error={errors.category_ids}
          onToggleCategory={toggleCategory}
        />

        <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-3">
          <RepeaterPanel
            title="경력사항"
            field="careers"
            values={form.careers}
            error={errors.careers}
            onChange={(values) => setField("careers", values)}
          />
          <RepeaterPanel
            title="활동사항"
            field="etc_contents"
            values={form.etc_contents}
            error={errors.etc_contents}
            onChange={(values) => setField("etc_contents", values)}
          />
          <RepeaterPanel
            title="학력사항"
            field="educations"
            values={form.educations}
            error={errors.educations}
            onChange={(values) => setField("educations", values)}
          />
        </div>
      </section>

      <MediaPreviewModal preview={previewMedia} onChange={setPreviewMedia} onClose={() => setPreviewMedia(null)} />
      <Modal
        isOpen={Boolean(uploadModalMessage)}
        onClose={closeUploadModal}
        className="mx-4 w-[calc(100%-2rem)] max-w-sm"
      >
        <ModalPanel>
          <ModalHeader className="pr-0">
            <ModalTitle className="text-base">이미지 업로드 조건 확인</ModalTitle>
          </ModalHeader>
          <ModalBody className="mt-5">
            <p className="text-sm leading-6 font-medium whitespace-pre-line text-gray-800">{uploadModalMessage}</p>
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="brand" onClick={closeUploadModal}>
              확인
            </Button>
          </ModalFooter>
        </ModalPanel>
      </Modal>
    </form>
  );
}
