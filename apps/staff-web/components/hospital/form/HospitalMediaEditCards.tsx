"use client";

import React from "react";
import { Button, Card, MediaUploader, type ExistingMediaItem } from "@beaulab/ui-admin";

import type { HospitalMediaPreviewState } from "@/components/hospital/media/HospitalMediaPreviewModal";
import { useObjectUrl } from "@/hooks/common/useObjectUrl";
import {
  MEDIA_COLLECTIONS,
  validateHospitalGalleryUploadFiles,
  validateHospitalLogoImageFile,
  type HospitalMediaField,
} from "@/lib/hospital/form";
import { isImageMedia, resolveMediaUrl, type MediaAsset } from "@/lib/hospital/detail";

const cardClassName = "rounded-xl border border-gray-200 bg-white p-5";
const fileSelectButtonClassName = "h-8 px-3 text-xs";

export function HospitalLogoEditCard({
  logo,
  existingLogo,
  hospitalName,
  error,
  className,
  onChange,
  onPreview,
  onUploadValidationError,
}: {
  logo: File | null;
  existingLogo: MediaAsset | null;
  hospitalName: string;
  error?: string;
  className?: string;
  onChange: (file: File | null) => void;
  onPreview: (preview: HospitalMediaPreviewState) => void;
  onUploadValidationError: (message: string) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const fileUrl = useObjectUrl(logo);
  const existingUrl = resolveMediaUrl(existingLogo);
  const previewUrl = fileUrl ?? existingUrl;
  const isPreviewImage = logo ? logo.type.startsWith("image/") : isImageMedia(existingLogo);

  const handleSelectFile = async (file: File | null) => {
    if (!file) return;

    const validationMessage = await validateHospitalLogoImageFile(file);
    if (validationMessage) {
      onUploadValidationError(validationMessage);
      return;
    }

    onChange(file);
  };

  return (
    <Card
      data-media-collection="logo"
      tabIndex={-1}
      className={[
        "flex min-h-[14rem] flex-col items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white p-4",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => {
          const nextFile = event.target.files?.[0] ?? null;
          event.currentTarget.value = "";
          void handleSelectFile(nextFile);
        }}
      />
      {previewUrl ? (
        <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <button
            type="button"
            className="flex h-full w-full cursor-zoom-in items-center justify-center"
            onClick={() =>
              onPreview({
                url: previewUrl,
                title: `${hospitalName || "병의원"} 로고`,
                isImage: isPreviewImage,
              })
            }
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- runtime storage URL or local object URL */}
            <img src={previewUrl} alt={`${hospitalName || "병의원"} 로고`} className="h-full w-full object-cover" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="flex aspect-square w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-gray-300 bg-white px-6 text-center transition-colors hover:border-brand-200 hover:bg-brand-50/30"
          onClick={() => inputRef.current?.click()}
        >
          <div className="flex size-12 items-center justify-center rounded-full bg-brand-50 text-brand-500">
            <span className="text-2xl leading-none">+</span>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-gray-800">로고 이미지를 등록해 주세요.</p>
            <p className="text-xs text-gray-500">jpg, png, webp 파일을 업로드할 수 있습니다.</p>
          </div>
        </button>
      )}
      {previewUrl ? (
        <Button type="button" variant="brand" size="sm" className="w-full" onClick={() => inputRef.current?.click()}>
          이미지 수정하기
        </Button>
      ) : (
        <Button type="button" variant="brand" size="sm" className="w-full" onClick={() => inputRef.current?.click()}>
          이미지 등록하기
        </Button>
      )}
      {error ? <p className="w-full text-left text-xs text-error-500">{error}</p> : null}
    </Card>
  );
}

export function HospitalGalleryEditCard({
  gallery,
  existingMediaByCollection,
  galleryOrder,
  error,
  onGalleryChange,
  onExistingItemsChange,
  onGalleryOrderChange,
  onPreview,
  onUploadValidationError,
}: {
  gallery: File[];
  existingMediaByCollection?: {
    logo: ExistingMediaItem[];
    gallery: ExistingMediaItem[];
  };
  galleryOrder?: string[];
  error?: string;
  onGalleryChange: (files: File[]) => void;
  onExistingItemsChange?: (key: HospitalMediaField, items: ExistingMediaItem[]) => void;
  onGalleryOrderChange?: (order: string[]) => void;
  onPreview: (preview: HospitalMediaPreviewState) => void;
  onUploadValidationError: (message: string) => void;
}) {
  const galleryCollection = MEDIA_COLLECTIONS.find((collection) => collection.key === "gallery");
  const uploaderRef = React.useRef<HTMLDivElement | null>(null);

  if (!galleryCollection) return null;

  const maxGalleryCount = galleryCollection.maxFiles ?? 5;
  const currentGalleryCount = gallery.length + (existingMediaByCollection?.gallery.length ?? 0);
  const isGalleryFull = currentGalleryCount >= maxGalleryCount;

  const openFilePicker = () => {
    if (isGalleryFull) return;
    uploaderRef.current?.querySelector<HTMLInputElement>('input[data-media-file-input="true"]')?.click();
  };

  return (
    <Card className={cardClassName}>
      <div className="mb-4 flex items-center gap-2">
        <h3 className="text-sm font-bold text-gray-900">
          병의원이미지
          <RequiredMark />
        </h3>
        <Button
          type="button"
          variant="brand"
          size="sm"
          className={fileSelectButtonClassName}
          disabled={isGalleryFull}
          onClick={openFilePicker}
        >
          파일선택
        </Button>
        {error ? <p className="text-xs text-error-500">{error}</p> : null}
      </div>
      <div ref={uploaderRef}>
        <MediaUploader
          embedded
          layout="horizontal"
          collections={[
            {
              ...galleryCollection,
              label: "파일선택",
              showLabel: false,
              dropzoneVariant: "button",
              hideDropzone: true,
              cardVariant: "imageOnly",
            },
          ]}
          filesByCollection={{ gallery }}
          existingItemsByCollection={existingMediaByCollection ? { gallery: existingMediaByCollection.gallery } : undefined}
          orderByCollection={galleryOrder ? { gallery: galleryOrder } : undefined}
          onExistingItemsChange={onExistingItemsChange}
          onOrderChange={(key, order) => {
            if (key !== "gallery") return;
            onGalleryOrderChange?.(order);
          }}
          onPreview={(_, preview) => onPreview(preview)}
          onBeforeAddFiles={async (_, files) => {
            const message = await validateHospitalGalleryUploadFiles(files);

            if (message) {
              onUploadValidationError(message);
              return [];
            }

            return files;
          }}
          onChange={(key, files) => {
            if (key !== "gallery") return;
            onGalleryChange(files);
          }}
        />
      </div>
    </Card>
  );
}

function RequiredMark() {
  return <span className="text-error-500">*</span>;
}
