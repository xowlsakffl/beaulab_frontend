"use client";

import React from "react";
import { Button, Card, Label } from "@beaulab/ui-admin";

import type { HospitalMediaPreviewState } from "@/components/hospital/media/HospitalMediaPreviewModal";
import { useObjectUrl } from "@/hooks/common/useObjectUrl";
import {
  HOSPITAL_EVENT_IMAGE_ACCEPT,
  validateHospitalEventImageFile,
  type HospitalEventImageFieldName,
  type HospitalEventType,
} from "@/lib/hospital-event/form";
import {
  resolveHospitalEventMediaUrl,
  type HospitalEventMedia,
} from "@/lib/hospital-event/list";

const cardClassName = "rounded-xl border border-gray-200 bg-white p-5";
const labelClassName = "text-xs font-semibold text-gray-500";
const fileButtonClassName = "h-8 px-3 text-xs";

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
}: {
  eventType: HospitalEventType;
  thumbnailImage: File | null;
  eventPageImage: File | null;
  existingThumbnailImage: HospitalEventMedia | null;
  existingEventPageImage: HospitalEventMedia | null;
  onThumbnailChange: (file: File | null) => void;
  onEventPageChange: (file: File | null) => void;
  onPreview: (preview: HospitalMediaPreviewState) => void;
  onUploadWarning: (message: string) => void;
}) {
  const thumbnailObjectUrl = useObjectUrl(thumbnailImage);
  const eventPageObjectUrl = useObjectUrl(eventPageImage);
  const thumbnailUrl = thumbnailObjectUrl ?? resolveHospitalEventMediaUrl(existingThumbnailImage, "original");
  const eventPageUrl = eventPageObjectUrl ?? resolveHospitalEventMediaUrl(existingEventPageImage, "original");

  return (
    <div className="min-w-0 space-y-4">
      <SingleImagePreviewPanel
        title="썸네일"
        helper="800px x 800px 이상, 1:1비율, 2MB 이하"
        objectUrl={thumbnailUrl}
        onPreview={onPreview}
        onFileChange={onThumbnailChange}
        field="thumbnail_image"
        onUploadWarning={onUploadWarning}
      />
      {eventType === "IMAGE" ? (
        <SingleImagePreviewPanel
          title="이벤트 페이지"
          helper="가로 800px 이상, 5MB 이하"
          objectUrl={eventPageUrl}
          onPreview={onPreview}
          onFileChange={onEventPageChange}
          field="event_page_image"
          onUploadWarning={onUploadWarning}
          tall
        />
      ) : null}
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
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const existingFileName = formatHospitalEventMediaFileName(existingMedia);
  const displayText = file?.name ?? existingFileName ?? helper;
  const hasFile = Boolean(file || existingFileName);

  return (
    <div className="grid grid-cols-[6rem_minmax(0,1fr)] items-start gap-3" data-field-target={target} tabIndex={-1}>
      <Label className={`${labelClassName} pt-2`}>
        {label}
        {required ? <span className="ml-0.5 text-brand-500">*</span> : null}
      </Label>
      <div className="min-w-0">
        <div className="space-y-2">
          <div className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2">
            <span
              className={[
                "min-w-0 truncate rounded-md px-2 py-1 text-xs",
                hasFile ? "bg-gray-50 font-medium text-gray-700" : "text-gray-500",
              ].join(" ")}
            >
              {displayText}
            </span>
            <Button type="button" variant="brand" size="sm" className={fileButtonClassName} onClick={() => inputRef.current?.click()}>
              파일선택
            </Button>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={HOSPITAL_EVENT_IMAGE_ACCEPT}
            className="hidden"
            onChange={async (event) => {
              const selectedFile = event.target.files?.[0] ?? null;
              event.currentTarget.value = "";
              await applyValidatedEventImageFile({
                file: selectedFile,
                field: target,
                onUploadWarning,
                onChange,
              });
            }}
          />
        </div>
        {error ? <p className="mt-1.5 text-xs text-error-500">{error}</p> : null}
      </div>
    </div>
  );
}

function SingleImagePreviewPanel({
  title,
  helper,
  objectUrl,
  onPreview,
  onFileChange,
  field,
  onUploadWarning,
  tall = false,
}: {
  title: string;
  helper: string;
  objectUrl: string | null;
  onPreview: (preview: HospitalMediaPreviewState) => void;
  onFileChange: (file: File | null) => void;
  field: HospitalEventImageFieldName;
  onUploadWarning: (message: string) => void;
  tall?: boolean;
}) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const emptyTitle = title === "이벤트 페이지" ? "이벤트 이미지를 등록해 주세요." : `${title} 이미지를 등록해 주세요.`;

  return (
    <Card className={cardClassName}>
      <div className="mb-2">
        <div>
          <h3 className="text-sm font-bold text-gray-900">{title}</h3>
          <p className="mt-1 text-xs text-gray-500">{helper}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => {
          if (objectUrl) {
            onPreview({ url: objectUrl, title, isImage: true });
            return;
          }

          inputRef.current?.click();
        }}
        className={[
          "flex w-full items-center justify-center overflow-hidden rounded-xl",
          tall ? (objectUrl ? "max-h-[32rem]" : "min-h-[18rem]") : "aspect-square",
          objectUrl ? "cursor-pointer border border-gray-200 bg-gray-50" : "cursor-pointer",
        ].join(" ")}
      >
        {objectUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
          <img src={objectUrl} alt={title} className={tall ? "h-auto max-h-[32rem] w-full object-contain" : "h-full w-full object-cover"} />
        ) : (
          <div className="flex aspect-square w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-gray-300 bg-white px-6 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-brand-50 text-brand-500">
              <span className="text-2xl leading-none">+</span>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-gray-800">{emptyTitle}</p>
              <p className="text-xs text-gray-500">jpg, png 파일을 업로드할 수 있습니다.</p>
            </div>
          </div>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={HOSPITAL_EVENT_IMAGE_ACCEPT}
        className="hidden"
        onChange={async (event) => {
          const selectedFile = event.target.files?.[0] ?? null;
          event.currentTarget.value = "";
          await applyValidatedEventImageFile({
            file: selectedFile,
            field,
            onUploadWarning,
            onChange: onFileChange,
          });
        }}
      />
    </Card>
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
