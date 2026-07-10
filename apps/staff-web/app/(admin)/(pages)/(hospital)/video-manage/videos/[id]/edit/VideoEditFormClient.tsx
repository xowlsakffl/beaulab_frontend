"use client";

import React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { isApiSuccess } from "@beaulab/types";
import { Button, SpinnerBlock, useGlobalAlert } from "@beaulab/ui-admin";

import { LoadErrorState } from "@/components/common/LoadErrorState";
import { VideoBasicSection } from "@/components/video/form/VideoBasicSection";
import { useCategorySelectorLoader } from "@/hooks/common/useCategorySelectorLoader";
import { useVideoFieldFocus } from "@/hooks/video/useVideoFieldFocus";
import { api } from "@/lib/common/api";
import { usePageHeaderExtra } from "@/lib/common/routing/page-header-extra";
import type { VideoCategoryItem, VideoDetailResponse, VideoHashtagItem } from "@/lib/video/detail";
import {
  buildUpdateVideoFormData,
  buildVideoExistingFileItem,
  extractVideoFieldErrors,
  INITIAL_VIDEO_FORM,
  mapVideoDetailToForm,
  validateUpdateVideoForm,
  type VideoDoctorOption,
  type VideoFieldName,
  type VideoFormErrors,
  type VideoFormValues,
  type VideoHospitalOption,
} from "@/lib/video/form";

const VIDEO_EDIT_FORM_ID = "video-edit-form";

export default function VideoEditFormClient() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showAlert } = useGlobalAlert();
  const loadCategories = useCategorySelectorLoader();
  const { focusFirstErrorField } = useVideoFieldFocus();

  const rawVideoId = Array.isArray(params.id) ? params.id[0] : params.id;
  const videoId = Number(rawVideoId);

  const [form, setForm] = React.useState<VideoFormValues>(INITIAL_VIDEO_FORM);
  const [thumbnailFile, setThumbnailFile] = React.useState<File | null>(null);
  const [existingThumbnail, setExistingThumbnail] = React.useState<ReturnType<typeof buildVideoExistingFileItem>>(null);
  const [selectedCategoryItems, setSelectedCategoryItems] = React.useState<VideoCategoryItem[]>([]);
  const [selectedHashtagItems, setSelectedHashtagItems] = React.useState<VideoHashtagItem[]>([]);
  const [errors, setErrors] = React.useState<VideoFormErrors>({});
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const detailPath = React.useMemo(() => {
    if (!Number.isFinite(videoId) || videoId <= 0) return "/video-manage/videos";

    const rawReturnTo = searchParams.get("returnTo");
    return rawReturnTo
      ? `/video-manage/videos/${videoId}?returnTo=${encodeURIComponent(rawReturnTo)}`
      : `/video-manage/videos/${videoId}`;
  }, [videoId, searchParams]);

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

  const fetchVideo = React.useCallback(async () => {
    if (!Number.isFinite(videoId) || videoId <= 0) {
      setLoadError("잘못된 동영상 경로입니다.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      const response = await api.get<VideoDetailResponse>(`/videos/${videoId}`);

      if (!isApiSuccess(response)) {
        setLoadError(response.error.message || "동영상 정보를 불러오지 못했습니다.");
        return;
      }

      const detail = response.data;
      setForm(mapVideoDetailToForm(detail));
      setSelectedCategoryItems(detail.categories ?? []);
      setSelectedHashtagItems(detail.hashtags ?? []);
      setExistingThumbnail(buildVideoExistingFileItem(detail.thumbnail_file));
    } catch {
      setLoadError("동영상 정보를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [videoId]);

  React.useEffect(() => {
    void fetchVideo();
  }, [fetchVideo]);

  const validate = React.useCallback(() => {
    const nextErrors = validateUpdateVideoForm(form);
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
    if (!Number.isFinite(videoId) || videoId <= 0) return;

    const formData = buildUpdateVideoFormData({
      form,
      thumbnailFile,
      existingThumbnail,
    });

    setIsSubmitting(true);

    try {
      const response = await api.post<VideoDetailResponse>(`/videos/${videoId}`, formData);

      if (!isApiSuccess(response)) {
        const nextErrors = extractVideoFieldErrors(response.error.details);
        if (Object.keys(nextErrors).length > 0) {
          setErrors(nextErrors);
          focusFirstErrorField(nextErrors);
        }

        showAlert({
          variant: "error",
          title: "동영상 수정 실패",
          message: response.error.message || "동영상 수정에 실패했습니다.",
        });
        return;
      }

      showAlert({
        variant: "success",
        title: "동영상 수정 완료",
        message: "수정된 동영상을 확인할 수 있습니다.",
      });
      router.push(detailPath);
    } catch {
      showAlert({
        variant: "error",
        title: "동영상 수정 실패",
        message: "동영상 수정 중 오류가 발생했습니다.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const headerAction = React.useMemo(
    () => (
      <Button type="submit" form={VIDEO_EDIT_FORM_ID} variant="brand" size="sm" disabled={isSubmitting}>
        {isSubmitting ? "저장 중..." : "저장하기"}
      </Button>
    ),
    [isSubmitting],
  );

  usePageHeaderExtra(isLoading || loadError ? null : headerAction);

  if (isLoading) {
    return <SpinnerBlock className="min-h-[60vh]" spinnerClassName="size-10" />;
  }

  if (loadError) {
    return (
      <LoadErrorState
        title="동영상 정보를 불러오지 못했습니다."
        message={loadError}
        onRetry={() => void fetchVideo()}
      />
    );
  }

  return (
    <form id={VIDEO_EDIT_FORM_ID} onSubmit={handleSubmit} autoComplete="off" className="min-w-0 space-y-6">
      <VideoBasicSection
        form={form}
        errors={errors}
        thumbnailFile={thumbnailFile}
        existingThumbnail={thumbnailFile ? null : existingThumbnail}
        selectedCategoryItems={selectedCategoryItems}
        selectedHashtagItems={selectedHashtagItems}
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
      />
    </form>
  );
}
