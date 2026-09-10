"use client";

import React from "react";
import { Button, CircleRemoveButton, ImagePlus, Label } from "@beaulab/ui-admin";
import { AddCircleButton, AddCircleIcon } from "@/components/common/AddCircleButton";
import type { MediaPreviewState } from "@/components/common/MediaPreviewModal";
import { useObjectUrl } from "@/hooks/common/useObjectUrl";
import {
  BEFORE_AFTER_PHOTO_HELPER,
  BEFORE_AFTER_PHOTO_MAX_COUNT,
  BEFORE_AFTER_PHOTO_SIDES,
  emptyBeforeAfterPhoto,
  validateBeforeAfterPhotoFile,
  type BeforeAfterPhotoSide,
  type HospitalEventBeforeAfterPhoto,
  type HospitalEventPhotoInput,
} from "@/lib/hospital-event/before-after-photos";
import { HOSPITAL_EVENT_IMAGE_ACCEPT } from "@/lib/hospital-event/form";
import { resolveHospitalEventMediaUrl } from "@/lib/hospital-event/list";

export function HospitalEventBeforeAfterPhotos({
  photos,
  onChange,
  onPreview,
  onUploadWarning,
  error,
}: {
  photos: HospitalEventBeforeAfterPhoto[];
  onChange: React.Dispatch<React.SetStateAction<HospitalEventBeforeAfterPhoto[]>>;
  onPreview: (preview: MediaPreviewState) => void;
  onUploadWarning: (message: string) => void;
  error?: string;
}) {
  return (
    <div
      className="grid grid-cols-[6rem_minmax(0,1fr)] items-start gap-3"
      data-field-target="before_after_photos"
      tabIndex={-1}
    >
      <Label className="pt-2 text-xs font-semibold text-gray-500">
        전후사진
        <span className="mt-1 block text-[11px] font-normal text-gray-400">
          (최대 {BEFORE_AFTER_PHOTO_MAX_COUNT}개)
        </span>
      </Label>
      <div className="min-w-0 space-y-2">
        <div className="grid grid-cols-2 gap-3">
          {photos.map((photo, index) => (
            <div key={photo.key} className="relative min-w-0">
              <HospitalEventBeforeAfterPhotoPair
                photo={photo}
                index={index}
                onPreview={onPreview}
                onPhotoChange={(side, file) =>
                  onChange((prev) =>
                    prev.map((pair) => (pair.key === photo.key ? { ...pair, [side]: { file, media: null } } : pair)),
                  )
                }
                onUploadWarning={onUploadWarning}
              />
              <CircleRemoveButton
                className="absolute -top-2 -right-2 z-10 size-5 bg-white"
                aria-label={`${index + 1}번째 전후사진 삭제`}
                onClick={() => onChange((prev) => prev.filter((pair) => pair.key !== photo.key))}
              />
            </div>
          ))}
          {photos.length < BEFORE_AFTER_PHOTO_MAX_COUNT ? (
            <AddCircleButton
              label="전후사진 추가"
              fullWidth
              className="aspect-[2/1] h-auto min-h-20"
              onClick={() =>
                onChange((prev) =>
                  prev.length < BEFORE_AFTER_PHOTO_MAX_COUNT ? [...prev, emptyBeforeAfterPhoto()] : prev,
                )
              }
            />
          ) : null}
        </div>
        <p className="text-[11px] text-gray-400">{BEFORE_AFTER_PHOTO_HELPER}</p>
        {error ? <p className="text-xs text-error-500">{error}</p> : null}
      </div>
    </div>
  );
}

export function HospitalEventBeforeAfterPhotoPair({
  photo,
  index,
  onPreview,
  onPhotoChange,
  onUploadWarning,
  labelVariant = "default",
}: {
  photo: HospitalEventBeforeAfterPhoto;
  index: number;
  onPreview?: (preview: MediaPreviewState) => void;
  onPhotoChange?: (side: BeforeAfterPhotoSide, file: File) => void;
  onUploadWarning?: (message: string) => void;
  labelVariant?: "default" | "overlay";
}) {
  return (
    <div className="min-w-0">
      <div
        className={`grid aspect-[2/1] w-full grid-cols-2 overflow-hidden rounded-md bg-white ${onPhotoChange ? "min-h-20 divide-x divide-gray-200 border border-gray-200" : ""}`}
      >
        {BEFORE_AFTER_PHOTO_SIDES.map(({ key, label }) => (
          <PhotoSlot
            key={key}
            value={photo[key]}
            label={label}
            labelVariant={labelVariant}
            title={`${index + 1}번째 시술 ${label} 사진`}
            onPreview={onPreview}
            onUploadWarning={onUploadWarning}
            onChange={onPhotoChange ? (file) => onPhotoChange(key, file) : undefined}
          />
        ))}
      </div>
      {!onPhotoChange && labelVariant === "default" ? (
        <div className="mt-1.5 flex items-center gap-3 text-[11px] leading-4 text-gray-600">
          <span>전</span>
          <span className="h-0.5 min-w-0 flex-1 bg-linear-to-r from-gray-100 to-gray-300" aria-hidden="true" />
          <span>후</span>
        </div>
      ) : null}
    </div>
  );
}

function PhotoSlot({
  value,
  label,
  labelVariant,
  title,
  onChange,
  onPreview,
  onUploadWarning,
}: {
  value: HospitalEventPhotoInput;
  label: string;
  labelVariant: "default" | "overlay";
  title: string;
  onChange?: (file: File) => void;
  onPreview?: (preview: MediaPreviewState) => void;
  onUploadWarning?: (message: string) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const objectUrl = useObjectUrl(value.file);
  const url = objectUrl ?? resolveHospitalEventMediaUrl(value.media, "original");
  return (
    <div className="relative min-h-0 min-w-0">
      <button
        type="button"
        className="flex h-full w-full items-center justify-center focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:outline-none focus-visible:ring-inset"
        aria-label={url ? `${title} 미리보기` : `${title} 등록`}
        disabled={url ? !onPreview : !onChange}
        onClick={() => (url ? onPreview?.({ url, title, isImage: true }) : inputRef.current?.click())}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element -- shared local and persisted image preview
          <img src={url} alt={title} className={`h-full w-full ${onChange ? "object-contain" : "object-cover"}`} />
        ) : onChange ? (
          <AddCircleIcon />
        ) : null}
      </button>
      {labelVariant === "overlay" || onChange ? (
        <span className="pointer-events-none absolute top-1.5 left-1.5 flex size-4 items-center justify-center rounded-full border border-gray-200 bg-white/90 text-[10px] text-gray-500">
          {label}
        </span>
      ) : null}
      {onChange ? (
        <>
          <input
            ref={inputRef}
            type="file"
            accept={HOSPITAL_EVENT_IMAGE_ACCEPT}
            className="hidden"
            aria-label={`${title} 파일`}
            onChange={async (event) => {
              const file = event.target.files?.[0];
              event.currentTarget.value = "";
              if (!file) return;
              const error = await validateBeforeAfterPhotoFile(file);
              if (error) {
                onUploadWarning?.(error);
                return;
              }
              onChange(file);
            }}
          />
          {url ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="absolute right-1 bottom-1 size-6 bg-white"
              title={`${title} 교체`}
              aria-label={`${title} 교체`}
              onClick={() => inputRef.current?.click()}
            >
              <ImagePlus className="size-3.5" />
            </Button>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
