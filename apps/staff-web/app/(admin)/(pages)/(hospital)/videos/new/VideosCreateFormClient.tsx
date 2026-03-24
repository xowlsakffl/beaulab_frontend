"use client";

import React from "react";

import { VideoBasicSection } from "@/components/video/form/VideoBasicSection";
import { VideoCategorySection } from "@/components/video/form/VideoCategorySection";
import { VideoMediaPanel } from "@/components/video/form/VideoMediaPanel";
import { VideoPublishSection } from "@/components/video/form/VideoPublishSection";
import { useCategorySelectorLoader } from "@/hooks/common/useCategorySelectorLoader";
import { useVideoFieldFocus } from "@/hooks/video/useVideoFieldFocus";
import { api } from "@/lib/common/api";
import {
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

    const formData = new FormData();
    formData.append("hospital_id", String(form.hospital_id));
    formData.append("title", form.title.trim());
    formData.append("description", form.description.trim());
    formData.append("distribution_channel", form.distribution_channel);
    formData.append("status", form.status);
    formData.append("allow_status", form.allow_status);
    formData.append("is_publish_period_unlimited", form.is_publish_period_unlimited ? "1" : "0");

    if (form.doctor_id) {
      formData.append("doctor_id", String(form.doctor_id));
    }

    if (form.external_video_url.trim()) {
      formData.append("external_video_url", form.external_video_url.trim());
    }

    if (form.external_video_id.trim()) {
      formData.append("external_video_id", form.external_video_id.trim());
    }

    if (form.duration_seconds.trim()) {
      formData.append("duration_seconds", form.duration_seconds.trim());
    }

    if (!form.is_publish_period_unlimited) {
      if (form.publish_start_at) {
        formData.append("publish_start_at", form.publish_start_at);
      }

      if (form.publish_end_at) {
        formData.append("publish_end_at", form.publish_end_at);
      }
    }

    form.category_ids.forEach((categoryId) => {
      formData.append("category_ids[]", String(categoryId));
    });

    if (thumbnailFile) {
      formData.append("thumbnail_file", thumbnailFile);
    }

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
      router.push(`/videos?highlight=${response.data.id}`);
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

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 xl:items-start xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0 space-y-6">
        <VideoBasicSection
          form={form}
          errors={errors}
          onFieldChange={setField}
          onSelectHospital={handleSelectHospital}
          onSelectDoctorOption={handleSelectDoctorOption}
        />

        <VideoCategorySection
          selectedIds={form.category_ids}
          errors={errors}
          loadCategories={loadCategories}
          onToggleCategory={toggleCategory}
        />
      </div>

      <div className="min-w-0 space-y-6">
        <VideoPublishSection form={form} errors={errors} onFieldChange={setField} />

        <VideoMediaPanel
          thumbnailFile={thumbnailFile}
          errors={errors}
          onThumbnailChange={(file) => {
            setThumbnailFile(file);
            clearError("thumbnail_file");
          }}
        />

        <div className="flex flex-col gap-3">
          <Button type="button" variant="outline" size="auth" className="w-full" onClick={() => router.push("/videos")}>
            목록으로
          </Button>
          <Button type="submit" variant="brand" size="auth" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "등록 중..." : "동영상 등록"}
          </Button>
        </div>
      </div>
    </form>
  );
}
