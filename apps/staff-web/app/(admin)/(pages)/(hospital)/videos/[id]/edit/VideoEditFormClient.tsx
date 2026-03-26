"use client";

import React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { isApiSuccess } from "@beaulab/types";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, SpinnerBlock, useGlobalAlert } from "@beaulab/ui-admin";

import { VideoBasicSection } from "@/components/video/form/VideoBasicSection";
import { VideoCategorySection } from "@/components/video/form/VideoCategorySection";
import { VideoMediaPanel } from "@/components/video/form/VideoMediaPanel";
import { VideoPublishSection } from "@/components/video/form/VideoPublishSection";
import { useCategorySelectorLoader } from "@/hooks/common/useCategorySelectorLoader";
import { useVideoFieldFocus } from "@/hooks/video/useVideoFieldFocus";
import { api } from "@/lib/common/api";
import { buildReturnToPath } from "@/lib/common/navigation/buildReturnToPath";
import {
  buildVideoExistingFileItem,
  extractVideoFieldErrors,
  INITIAL_VIDEO_FORM,
  mapVideoDetailToForm,
  parseVideoDurationInput,
  validateUpdateVideoForm,
  type VideoCategoryItem,
  type VideoDetailResponse,
  type VideoDoctorOption,
  type VideoFieldName,
  type VideoFormErrors,
  type VideoFormValues,
  type VideoHospitalOption,
  type VideoMediaAsset,
} from "@/lib/video/form";

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
  const [currentVideoFile, setCurrentVideoFile] = React.useState<VideoMediaAsset | null>(null);
  const [selectedCategoryItems, setSelectedCategoryItems] = React.useState<VideoCategoryItem[]>([]);
  const [errors, setErrors] = React.useState<VideoFormErrors>({});
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const initialVideoFileIdRef = React.useRef<string | number | null>(null);

  const getReturnToPath = React.useCallback(
    (highlightId?: number) =>
      buildReturnToPath({
        searchParams,
        fallbackPath: "/videos",
        allowedPrefix: "/videos",
        highlightId,
      }),
    [searchParams],
  );

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
      setExistingThumbnail(buildVideoExistingFileItem(detail.thumbnail_file));
      setCurrentVideoFile(detail.video_file ?? null);
      initialVideoFileIdRef.current = detail.video_file?.id ?? null;
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

    const formData = new FormData();
    formData.append("_method", "PATCH");
    formData.append("hospital_id", form.hospital_id ? String(form.hospital_id) : "");
    formData.append("doctor_id", form.doctor_id ? String(form.doctor_id) : "");
    formData.append("title", form.title.trim());
    formData.append("description", form.description.trim());
    formData.append("distribution_channel", form.distribution_channel);
    formData.append("external_video_url", form.external_video_url.trim());
    formData.append("external_video_id", form.external_video_id.trim());
    const durationSeconds = parseVideoDurationInput(form.duration_seconds);
    formData.append("duration_seconds", durationSeconds === null ? "" : String(durationSeconds));
    formData.append("status", form.status);
    formData.append("allow_status", form.allow_status);
    formData.append("is_publish_period_unlimited", form.is_publish_period_unlimited ? "1" : "0");
    formData.append("publish_start_at", form.is_publish_period_unlimited ? "" : form.publish_start_at);
    formData.append("publish_end_at", form.is_publish_period_unlimited ? "" : form.publish_end_at);

    if (form.category_ids.length > 0) {
      form.category_ids.forEach((categoryId) => {
        formData.append("category_ids[]", String(categoryId));
      });
    } else {
      formData.append("category_ids[]", "");
    }

    if (thumbnailFile) {
      formData.append("thumbnail_file", thumbnailFile);
    } else {
      formData.append("existing_thumbnail_file_id", existingThumbnail?.id ? String(existingThumbnail.id) : "");
    }

    if (initialVideoFileIdRef.current && !currentVideoFile) {
      formData.append("remove_video_file", "1");
    }

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
        message: "수정된 동영상을 목록에서 확인할 수 있습니다.",
      });
      router.push(getReturnToPath(videoId));
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

  if (isLoading) {
    return <SpinnerBlock className="min-h-[60vh]" spinnerClassName="size-10" />;
  }

  if (loadError) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>동영상 정보를 불러오지 못했습니다.</CardTitle>
          <CardDescription>{loadError}</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2 pt-0">
          <Button type="button" variant="brand" onClick={() => void fetchVideo()}>
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
          selectedItems={selectedCategoryItems}
          errors={errors}
          loadCategories={loadCategories}
          onToggleCategory={toggleCategory}
        />
      </div>

      <div className="min-w-0 space-y-6">
        <VideoPublishSection form={form} errors={errors} onFieldChange={setField} />

        <VideoMediaPanel
          thumbnailFile={thumbnailFile}
          existingThumbnail={thumbnailFile ? null : existingThumbnail}
          currentVideoFile={currentVideoFile}
          videoFileDownloadUrl={Number.isFinite(videoId) && videoId > 0 ? `/videos/${videoId}/download-video-file` : null}
          isCurrentVideoFileRemoved={Boolean(initialVideoFileIdRef.current) && !currentVideoFile}
          errors={errors}
          onThumbnailChange={(file) => {
            setThumbnailFile(file);
            clearError("thumbnail_file");
          }}
          onExistingThumbnailChange={(item) => {
            setExistingThumbnail(item);
            clearError("thumbnail_file");
          }}
          onCurrentVideoFileChange={(file) => {
            setCurrentVideoFile(file);
          }}
        />

        <div className="flex flex-col gap-3">
          <Button type="button" variant="outline" size="auth" className="w-full" onClick={() => router.push(getReturnToPath())}>
            목록으로
          </Button>
          <Button type="submit" variant="brand" size="auth" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "저장 중..." : "동영상 저장"}
          </Button>
        </div>
      </div>
    </form>
  );
}
