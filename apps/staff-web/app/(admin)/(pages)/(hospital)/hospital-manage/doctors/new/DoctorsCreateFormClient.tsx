"use client";

import React from "react";

import {
  CategorySelectPanel,
  DoctorInfoEditorCard,
  ProfileImageEditor,
  RepeaterPanel,
} from "@/components/doctor/form/DoctorFormEditorPanels";
import { MediaPreviewModal } from "@/components/common/MediaPreviewModal";
import { useDoctorCategorySelection } from "@/hooks/doctor/useDoctorCategorySelection";
import { useDoctorFieldFocus } from "@/hooks/doctor/useDoctorFieldFocus";
import { useDoctorMediaState } from "@/hooks/doctor/useDoctorMediaState";
import { api } from "@/lib/common/api";
import { buildReturnToPath } from "@/lib/common/navigation/buildReturnToPath";
import { usePageHeaderExtra } from "@/lib/common/routing/page-header-extra";
import {
  buildCreateDoctorFormData,
  extractDoctorFieldErrors,
  INITIAL_DOCTOR_FORM,
  validateCreateDoctorForm,
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
  useGlobalAlert,
} from "@beaulab/ui-admin";
import { useRouter, useSearchParams } from "next/navigation";

const DOCTOR_CREATE_FORM_ID = "doctor-create-form";

export default function DoctorsCreateFormClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showAlert } = useGlobalAlert();
  const { focusFirstErrorField } = useDoctorFieldFocus();

  const [form, setForm] = React.useState<DoctorFormValues>(INITIAL_DOCTOR_FORM);
  const [errors, setErrors] = React.useState<DoctorFormErrors>({});
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
    previewMedia,
    setPreviewMedia,
    uploadModalMessage,
    closeUploadModal,
    handleProfileImageChange,
    handleLicenseImageChange,
    handleSpecialistCertificateImageChange,
  } = useDoctorMediaState({ clearError });

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

  const { categoryOptions, isCategoryLoading, categoryLoadError, toggleCategory } = useDoctorCategorySelection({
    categoryIds: form.category_ids,
    setForm,
    setErrors,
    clearError,
  });

  const validate = React.useCallback(() => {
    const nextErrors = validateCreateDoctorForm({ form, profileImage });
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      window.setTimeout(() => focusFirstErrorField(nextErrors), 0);
      return false;
    }

    return true;
  }, [focusFirstErrorField, form, profileImage]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validate()) return;

    const formData = buildCreateDoctorFormData({
      form,
      profileImage,
      licenseImage,
      specialistCertificateImage,
    });

    setIsSubmitting(true);

    try {
      const response = await api.post<{ id: number }>("/doctors", formData);

      if (!isApiSuccess(response)) {
        const nextErrors = extractDoctorFieldErrors(response.error.details);
        if (Object.keys(nextErrors).length > 0) {
          setErrors(nextErrors);
          window.setTimeout(() => focusFirstErrorField(nextErrors), 0);
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
        message: "등록된 의료진을 목록에서 확인할 수 있습니다.",
      });
      router.push(getReturnToPath(response.data.id));
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
        <Button type="submit" form={DOCTOR_CREATE_FORM_ID} variant="brand" size="sm" disabled={isSubmitting}>
          {isSubmitting ? "저장 중..." : "저장하기"}
        </Button>
      </>
    ),
    [getReturnToPath, isSubmitting, router],
  );

  usePageHeaderExtra(headerActions);

  return (
    <form id={DOCTOR_CREATE_FORM_ID} onSubmit={handleSubmit} autoComplete="off" className="min-w-0 space-y-4">
      <section className="grid min-w-0 grid-cols-1 items-stretch gap-4 xl:grid-cols-[20rem_minmax(0,1fr)]">
        <ProfileImageEditor
          file={profileImage}
          existingImage={null}
          error={errors.profile_image}
          onPreview={setPreviewMedia}
          onChange={handleProfileImageChange}
        />

        <DoctorInfoEditorCard
          form={form}
          errors={errors}
          licenseImage={licenseImage}
          specialistCertificateImage={specialistCertificateImage}
          existingLicenseImage={null}
          existingSpecialistCertificateImage={null}
          onFieldChange={setField}
          onSelectHospital={handleSelectHospital}
          onClearHospital={() => {
            setForm((prev) => ({
              ...prev,
              hospital_id: null,
              hospital_name: "",
              hospital_business_number: "",
              name: "",
            }));
          }}
          onLicenseImageChange={handleLicenseImageChange}
          onExistingLicenseImageChange={() => undefined}
          onSpecialistCertificateImageChange={handleSpecialistCertificateImageChange}
          onExistingSpecialistCertificateImageChange={() => undefined}
        />

        <CategorySelectPanel
          selectedIds={form.category_ids}
          selectedItems={[]}
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
