"use client";

import React from "react";

import {
  CategorySelectPanel,
  DoctorInfoEditorCard,
  MAX_DOCTOR_CATEGORY_SELECTION,
  ProfileImageEditor,
  RepeaterPanel,
  validateProfileImageFile,
  type DoctorCategoryOption,
} from "@/components/doctor/form/DoctorFormEditorPanels";
import {
  HospitalMediaPreviewModal,
  type HospitalMediaPreviewState,
} from "@/components/hospital/media/HospitalMediaPreviewModal";
import { useCategorySelectorLoader } from "@/hooks/common/useCategorySelectorLoader";
import { useDoctorFieldFocus } from "@/hooks/doctor/useDoctorFieldFocus";
import { api } from "@/lib/common/api";
import { buildReturnToPath } from "@/lib/common/navigation/buildReturnToPath";
import { usePageHeaderExtra } from "@/lib/common/routing/page-header-extra";
import type { DoctorCategoryItem, DoctorDetailResponse } from "@/lib/doctor/detail";
import {
  buildDoctorExistingFileItem,
  extractDoctorFieldErrors,
  DOCTOR_CATEGORY_SECTIONS,
  INITIAL_DOCTOR_FORM,
  mapDoctorDetailToForm,
  sanitizeDoctorList,
  validateUpdateDoctorForm,
  type DoctorFieldName,
  type DoctorFormErrors,
  type DoctorFormValues,
  type DoctorHospitalOption,
} from "@/lib/doctor/form";
import { isApiSuccess } from "@beaulab/types";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalPanel,
  ModalTitle,
  SpinnerBlock,
  type ExistingMediaItem,
  useGlobalAlert,
} from "@beaulab/ui-admin";
import { useParams, useRouter, useSearchParams } from "next/navigation";

const DOCTOR_EDIT_FORM_ID = "doctor-edit-form";
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
  const [existingProfileImage, setExistingProfileImage] = React.useState<ExistingMediaItem | null>(null);
  const [selectedCategoryItems, setSelectedCategoryItems] = React.useState<DoctorCategoryItem[]>([]);
  const [existingLicenseImage, setExistingLicenseImage] = React.useState<ReturnType<typeof buildDoctorExistingFileItem>>(null);
  const [existingSpecialistCertificateImage, setExistingSpecialistCertificateImage] =
    React.useState<ReturnType<typeof buildDoctorExistingFileItem>>(null);
  const [categoryOptions, setCategoryOptions] = React.useState<DoctorCategoryOption[]>([]);
  const [isCategoryLoading, setIsCategoryLoading] = React.useState(false);
  const [categoryLoadError, setCategoryLoadError] = React.useState<string | null>(null);
  const [errors, setErrors] = React.useState<DoctorFormErrors>({});
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [previewMedia, setPreviewMedia] = React.useState<HospitalMediaPreviewState | null>(null);
  const [uploadModalMessage, setUploadModalMessage] = React.useState<string | null>(null);

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

  const detailPath = React.useMemo(() => {
    if (!Number.isFinite(doctorId) || doctorId <= 0) return "/doctors";

    const rawReturnTo = searchParams.get("returnTo");
    return rawReturnTo
      ? `/doctors/${doctorId}?returnTo=${encodeURIComponent(rawReturnTo)}`
      : `/doctors/${doctorId}`;
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

  const toggleCategory = React.useCallback(
    (categoryId: number, checked: boolean) => {
      if (checked && !form.category_ids.includes(categoryId) && form.category_ids.length >= MAX_DOCTOR_CATEGORY_SELECTION) {
        setErrors((current) => ({
          ...current,
          category_ids: `진료분야는 최대 ${MAX_DOCTOR_CATEGORY_SELECTION}개까지 선택할 수 있습니다.`,
        }));
        return;
      }

      setForm((prev) => {
        if (checked) {
          if (prev.category_ids.includes(categoryId)) return prev;

          return {
            ...prev,
            category_ids: [...prev.category_ids, categoryId],
          };
        }

        return {
          ...prev,
          category_ids: prev.category_ids.filter((item) => item !== categoryId),
        };
      });
      clearError("category_ids");
    },
    [clearError, form.category_ids],
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
  }, [doctorId]);

  React.useEffect(() => {
    void fetchDoctor();
  }, [fetchDoctor]);

  React.useEffect(() => {
    let isMounted = true;

    const loadRootCategories = async () => {
      setIsCategoryLoading(true);
      setCategoryLoadError(null);

      try {
        const results = await Promise.all(
          DOCTOR_CATEGORY_SECTIONS.map(async (section) => {
            const items = await loadCategories({ section });
            return items.map((item) => ({
              ...item,
              domain: section.domain,
            }));
          }),
        );

        if (!isMounted) return;

        const nextOptions = results
          .flat()
          .filter((item) => item.depth === 1 || item.parent_id === null || item.parent_id === undefined);
        setCategoryOptions(nextOptions);
      } catch {
        if (!isMounted) return;
        setCategoryLoadError("진료분야를 불러오지 못했습니다.");
      } finally {
        if (isMounted) {
          setIsCategoryLoading(false);
        }
      }
    };

    void loadRootCategories();

    return () => {
      isMounted = false;
    };
  }, [loadCategories]);

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

    const formData = new FormData();
    formData.append("_method", "PATCH");
    formData.append("hospital_id", form.hospital_id ? String(form.hospital_id) : "");
    formData.append("name", form.name.trim());
    formData.append("gender", form.gender);
    formData.append("position", form.position);
    formData.append("status", form.status);
    formData.append("allow_status", form.allow_status);
    formData.append("career_started_at", form.career_started_at);
    formData.append("license_number", form.license_number.replace(/\D/g, ""));
    formData.append("specialist_field", form.specialist_field);
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
        <Button type="button" variant="outline" size="sm" onClick={() => router.push(getReturnToPath())} disabled={isSubmitting}>
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
    <form id={DOCTOR_EDIT_FORM_ID} onSubmit={handleSubmit} className="min-w-0 space-y-4">

      <section className="grid min-w-0 grid-cols-1 items-stretch gap-4 xl:grid-cols-[20rem_minmax(0,1fr)]">
        <ProfileImageEditor
          file={profileImage}
          existingImage={profileImage ? null : existingProfileImage}
          error={errors.profile_image}
          onPreview={setPreviewMedia}
          onChange={async (file) => {
            if (!file) return;

            const validationMessage = await validateProfileImageFile(file);
            if (validationMessage) {
              setUploadModalMessage(validationMessage);
              return;
            }

            setProfileImage(file);
            clearError("profile_image");
          }}
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

      <HospitalMediaPreviewModal preview={previewMedia} onChange={setPreviewMedia} onClose={() => setPreviewMedia(null)} />
      <Modal
        isOpen={Boolean(uploadModalMessage)}
        onClose={() => setUploadModalMessage(null)}
        className="mx-4 w-[calc(100%-2rem)] max-w-sm"
      >
        <ModalPanel>
          <ModalHeader className="pr-0">
            <ModalTitle className="text-base">이미지 업로드 조건 확인</ModalTitle>
          </ModalHeader>
          <ModalBody className="mt-5">
            <p className="whitespace-pre-line text-sm font-medium leading-6 text-gray-800">{uploadModalMessage}</p>
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="brand" onClick={() => setUploadModalMessage(null)}>
              확인
            </Button>
          </ModalFooter>
        </ModalPanel>
      </Modal>
    </form>
  );
}
