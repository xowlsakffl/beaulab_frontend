"use client";

import React from "react";

import { VideoBasicSection } from "@/components/video/form/VideoBasicSection";
import { useCategorySelectorLoader } from "@/hooks/common/useCategorySelectorLoader";
import { useVideoFieldFocus } from "@/hooks/video/useVideoFieldFocus";
import { api } from "@/lib/common/api";
import { usePageHeaderExtra } from "@/lib/common/routing/page-header-extra";
import {
  buildCreateVideoFormData,
  extractVideoFieldErrors,
  INITIAL_VIDEO_FORM,
  validateCreateVideoForm,
  type VideoDoctorOption,
  type VideoFieldName,
  type VideoFormErrors,
  type VideoFormValues,
  type VideoHospitalOption,
} from "@/lib/video/form";
import { isApiSuccess } from "@beaulab/types";
import { Button, useGlobalAlert } from "@beaulab/ui-admin";
import { useRouter } from "next/navigation";

const VIDEO_CREATE_FORM_ID = "video-create-form";

export default function VideosCreateFormClient() {
  const router = useRouter();
  const { showAlert } = useGlobalAlert();
  const loadCategories = useCategorySelectorLoader();
  const { focusFirstErrorField } = useVideoFieldFocus();

  const [form, setForm] = React.useState<VideoFormValues>(INITIAL_VIDEO_FORM);
  const [thumbnailFile, setThumbnailFile] = React.useState<File | null>(null);
  const [errors, setErrors] = React.useState<VideoFormErrors>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const clearError = React.useCallback((field: VideoFieldName) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;

      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const setField = React.useCallback(
    <K extends keyof VideoFormValues>(key: K, value: VideoFormValues[K]) => {
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

  const toggleHashtag = React.useCallback(
    (hashtagId: number, checked: boolean) => {
      setForm((prev) => ({
        ...prev,
        hashtag_ids: checked
          ? prev.hashtag_ids.includes(hashtagId)
            ? prev.hashtag_ids
            : [...prev.hashtag_ids, hashtagId]
          : prev.hashtag_ids.filter((item) => item !== hashtagId),
      }));
      clearError("hashtag_ids");
    },
    [clearError],
  );

  const addHashtagName = React.useCallback(
    (name: string) => {
      setForm((prev) => ({
        ...prev,
        hashtag_names: prev.hashtag_names.includes(name) ? prev.hashtag_names : [...prev.hashtag_names, name],
      }));
      clearError("hashtag_ids");
    },
    [clearError],
  );

  const removeHashtagName = React.useCallback((name: string) => {
    setForm((prev) => ({
      ...prev,
      hashtag_names: prev.hashtag_names.filter((item) => item !== name),
    }));
  }, []);

  const handleSelectHospital = React.useCallback(
    (hospital: VideoHospitalOption) => {
      setForm((prev) => ({
        ...prev,
        hospital_id: hospital.id,
        hospital_name: hospital.name,
        hospital_business_number: hospital.business_number?.trim() ?? "",
        doctor_id: null,
        doctor_name: "",
      }));
      clearError("hospital_id");
      clearError("doctor_id");
    },
    [clearError],
  );

  const handleClearHospital = React.useCallback(() => {
    setForm((prev) => ({
      ...prev,
      hospital_id: null,
      hospital_name: "",
      hospital_business_number: "",
      doctor_id: null,
      doctor_name: "",
    }));
    clearError("doctor_id");
  }, [clearError]);

  const handleSelectDoctorOption = React.useCallback(
    (doctor: VideoDoctorOption | null) => {
      setForm((prev) => ({
        ...prev,
        doctor_id: doctor?.id ?? null,
        doctor_name: doctor?.name ?? "",
      }));
      clearError("doctor_id");
    },
    [clearError],
  );

  const setThumbnailValidationError = React.useCallback((message: string) => {
    setErrors((prev) => ({ ...prev, thumbnail_file: message }));
  }, []);

  const validate = React.useCallback(() => {
    const nextErrors = validateCreateVideoForm(form);
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
    if (!form.hospital_id) return;

    const formData = buildCreateVideoFormData({ form, thumbnailFile });

    setIsSubmitting(true);

    try {
      const response = await api.post<{ id: number }>("/videos", formData);

      if (!isApiSuccess(response)) {
        const nextErrors = extractVideoFieldErrors(response.error.details);
        if (Object.keys(nextErrors).length > 0) {
          setErrors(nextErrors);
          focusFirstErrorField(nextErrors);
        }

        showAlert({
          variant: "error",
          title: "동영상 등록 실패",
          message: response.error.message || "동영상 등록에 실패했습니다.",
        });
        return;
      }

      showAlert({
        variant: "success",
        title: "동영상 등록 완료",
        message: "새로 등록된 동영상을 목록에서 확인할 수 있습니다.",
      });
      router.push(`/video-manage/videos?highlight=${response.data.id}`);
    } catch {
      showAlert({
        variant: "error",
        title: "동영상 등록 실패",
        message: "동영상 등록 중 오류가 발생했습니다.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const headerAction = React.useMemo(
    () => (
      <Button type="submit" form={VIDEO_CREATE_FORM_ID} variant="brand" size="sm" disabled={isSubmitting}>
        {isSubmitting ? "저장 중..." : "저장하기"}
      </Button>
    ),
    [isSubmitting],
  );

  usePageHeaderExtra(headerAction);

  return (
    <form id={VIDEO_CREATE_FORM_ID} onSubmit={handleSubmit} autoComplete="off" className="min-w-0 space-y-6">
      <VideoBasicSection
        form={form}
        errors={errors}
        thumbnailFile={thumbnailFile}
        showMetrics={false}
        loadCategories={loadCategories}
        onFieldChange={setField}
        onSelectHospital={handleSelectHospital}
        onClearHospital={handleClearHospital}
        onSelectDoctorOption={handleSelectDoctorOption}
        onToggleCategory={toggleCategory}
        onToggleHashtag={toggleHashtag}
        onAddHashtagName={addHashtagName}
        onRemoveHashtagName={removeHashtagName}
        onThumbnailChange={(file) => {
          setThumbnailFile(file);
          clearError("thumbnail_file");
        }}
        onThumbnailValidationError={setThumbnailValidationError}
      />
    </form>
  );
}
