"use client";

import React from "react";
import { InlineFileSelect, Label } from "@beaulab/ui-admin";

import type { MediaPreviewState } from "@/components/common/MediaPreviewModal";
import { ImageUploadPreviewCard } from "@/components/common/ImageUploadPreviewCard";
import { useObjectUrl } from "@beaulab/ui-admin/hooks";
import {
  HOSPITAL_EVENT_IMAGE_ACCEPT,
  HOSPITAL_EVENT_PAGE_IMAGE_HELPER_TEXT,
  HOSPITAL_EVENT_THUMBNAIL_HELPER_TEXT,
  validateHospitalEventImageFile,
  type HospitalEventImageFieldName,
  type HospitalEventType,
} from "@/lib/hospital-event/form";
import { resolveHospitalEventMediaUrl, type HospitalEventMedia } from "@/lib/hospital-event/list";

const labelClassName = "text-xs font-semibold text-gray-500";

export function HospitalEventMediaCard({
  eventType,
  thumbnailImage,
  eventPageImage,
  existingThumbnailImage,
  existingEventPageImage,
  onThumbnailChange,
  onEventPageChange,
  onPreview,
  onUploadWarning,
  textPagePreview,
}: {
  eventType: HospitalEventType;
  thumbnailImage: File | null;
  eventPageImage: File | null;
  existingThumbnailImage: HospitalEventMedia | null;
  existingEventPageImage: HospitalEventMedia | null;
  onThumbnailChange: (file: File | null) => void;
  onEventPageChange: (file: File | null) => void;
  onPreview: (preview: MediaPreviewState) => void;
  onUploadWarning: (message: string) => void;
  textPagePreview?: React.ReactNode;
}) {
  const thumbnailObjectUrl = useObjectUrl(thumbnailImage);
  const eventPageObjectUrl = useObjectUrl(eventPageImage);
  const thumbnailUrl = thumbnailObjectUrl ?? resolveHospitalEventMediaUrl(existingThumbnailImage, "original");
  const eventPageUrl = eventPageObjectUrl ?? resolveHospitalEventMediaUrl(existingEventPageImage, "original");

  return (
    <div className="min-w-0 space-y-4">
      <ImageUploadPreviewCard
        title="썸네일"
        helper={HOSPITAL_EVENT_THUMBNAIL_HELPER_TEXT}
        accept={HOSPITAL_EVENT_IMAGE_ACCEPT}
        emptyDescription="jpg, png 파일을 업로드할 수 있습니다."
        objectUrl={thumbnailUrl}
        onPreview={onPreview}
        onFileChange={(file) =>
          applyValidatedEventImageFile({ file, field: "thumbnail_image", onChange: onThumbnailChange, onUploadWarning })
        }
      />
      {eventType === "IMAGE" ? (
        <ImageUploadPreviewCard
          title="이벤트 페이지"
          helper={HOSPITAL_EVENT_PAGE_IMAGE_HELPER_TEXT}
          accept={HOSPITAL_EVENT_IMAGE_ACCEPT}
          emptyTitle="이벤트 이미지를 등록해 주세요."
          emptyDescription="jpg, png 파일을 업로드할 수 있습니다."
          objectUrl={eventPageUrl}
          onPreview={onPreview}
          onFileChange={(file) =>
            applyValidatedEventImageFile({
              file,
              field: "event_page_image",
              onChange: onEventPageChange,
              onUploadWarning,
            })
          }
          aspect="auto"
          emptyAspect="square"
        />
      ) : (
        textPagePreview
      )}
    </div>
  );
}

export function HospitalEventInlineImageFileField({
  label,
  target,
  required = false,
  helper,
  file,
  existingMedia,
  error,
  onChange,
  onUploadWarning,
}: {
  label: string;
  target: HospitalEventImageFieldName;
  required?: boolean;
  helper: string;
  file: File | null;
  existingMedia?: HospitalEventMedia | null;
  error?: string;
  onChange: (file: File | null) => void;
  onUploadWarning: (message: string) => void;
}) {
  const existingFileName = formatHospitalEventMediaFileName(existingMedia);
  const displayText = file?.name ?? existingFileName;
  const hasFile = Boolean(file || existingFileName);

  return (
    <div className="grid grid-cols-[6rem_minmax(0,1fr)] items-start gap-3" data-field-target={target} tabIndex={-1}>
      <Label className={`${labelClassName} pt-2`}>
        {label}
        {required ? <span className="ml-0.5 text-brand-500">*</span> : null}
      </Label>
      <div className="min-w-0">
        <InlineFileSelect
          accept={HOSPITAL_EVENT_IMAGE_ACCEPT}
          fileName={hasFile ? displayText : null}
          placeholder={`${label} 파일을 선택해 주세요.`}
          helperText={helper}
          error={Boolean(error)}
          onChange={(selectedFile) =>
            applyValidatedEventImageFile({
              file: selectedFile,
              field: target,
              onUploadWarning,
              onChange,
            })
          }
        />
        {error ? <p className="mt-1.5 text-xs text-error-500">{error}</p> : null}
      </div>
    </div>
  );
}

async function applyValidatedEventImageFile({
  file,
  field,
  onUploadWarning,
  onChange,
}: {
  file: File | null;
  field: HospitalEventImageFieldName;
  onUploadWarning: (message: string) => void;
  onChange: (file: File | null) => void;
}) {
  if (!file) return;

  const validationMessage = await validateHospitalEventImageFile(field, file);
  if (validationMessage) {
    onUploadWarning(validationMessage);
    return;
  }

  onChange(file);
}

function formatHospitalEventMediaFileName(media?: HospitalEventMedia | null) {
  const metadata = media?.metadata;
  if (metadata && typeof metadata === "object" && !Array.isArray(metadata)) {
    const values = metadata as Record<string, unknown>;
    const metadataName = values.original_name ?? values.file_name ?? values.name;
    if (typeof metadataName === "string" && metadataName.trim()) {
      return metadataName.trim();
    }
  }

  const source = media?.path?.trim() || media?.url?.trim();
  if (!source) return null;

  const fileName = source.split("?")[0].split("/").filter(Boolean).pop();
  if (!fileName) return null;

  try {
    return decodeURIComponent(fileName);
  } catch {
    return fileName;
  }
}
