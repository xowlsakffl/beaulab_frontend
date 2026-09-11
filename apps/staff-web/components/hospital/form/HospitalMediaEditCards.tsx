"use client";

import React from "react";
import { Button, Card, MediaUploader, type ExistingMediaItem } from "@beaulab/ui-admin";

import type { MediaPreviewState } from "@/components/common/MediaPreviewModal";
import { ImageUploadPreviewCard } from "@/components/common/ImageUploadPreviewCard";
import { useObjectUrl } from "@beaulab/ui-admin/hooks";
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
  onPreview: (preview: MediaPreviewState) => void;
  onUploadValidationError: (message: string) => void;
}) {
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
    <ImageUploadPreviewCard
      title="병의원 로고"
      accept="image/jpeg,image/png,image/webp"
      emptyTitle="로고 이미지를 등록해 주세요."
      emptyDescription="jpg, png, webp 파일을 업로드할 수 있습니다."
      objectUrl={previewUrl}
      onPreview={(preview) =>
        onPreview({ ...preview, title: `${hospitalName || "병의원"} 로고`, isImage: isPreviewImage })
      }
      onFileChange={handleSelectFile}
      error={error}
      showHeader={false}
      mediaCollection="logo"
      className={["flex w-full flex-col self-start p-4", className].filter(Boolean).join(" ")}
    />
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
  onPreview: (preview: MediaPreviewState) => void;
  onUploadValidationError: (message: string) => void;
}) {
  const galleryCollection = MEDIA_COLLECTIONS.find((collection) => collection.key === "gallery");
  const uploaderRef = React.useRef<HTMLDivElement | null>(null);

  const maxGalleryCount = galleryCollection?.maxFiles ?? 5;
  const currentGalleryCount = gallery.length + (existingMediaByCollection?.gallery.length ?? 0);
  const isGalleryFull = currentGalleryCount >= maxGalleryCount;
  const galleryPreviewItems = React.useMemo(
    () => buildGalleryPreviewItems(existingMediaByCollection?.gallery ?? [], gallery, galleryOrder),
    [existingMediaByCollection?.gallery, gallery, galleryOrder],
  );

  if (!galleryCollection) return null;

  const openFilePicker = () => {
    if (isGalleryFull) return;
    uploaderRef.current?.querySelector<HTMLInputElement>('input[data-media-file-input="true"]')?.click();
  };

  const handlePreview = (preview: MediaPreviewState) => {
    onPreview(normalizeGalleryPreviewTitle(preview, galleryPreviewItems));
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
          existingItemsByCollection={
            existingMediaByCollection ? { gallery: existingMediaByCollection.gallery } : undefined
          }
          orderByCollection={galleryOrder ? { gallery: galleryOrder } : undefined}
          onExistingItemsChange={onExistingItemsChange}
          onOrderChange={(key, order) => {
            if (key !== "gallery") return;
            onGalleryOrderChange?.(order);
          }}
          onPreview={(_, preview) => handlePreview(preview)}
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

type GalleryPreviewItem = {
  url?: string;
  name: string;
  title: string;
};

function buildGalleryPreviewItems(
  existingItems: ExistingMediaItem[],
  files: File[],
  galleryOrder?: string[],
): GalleryPreviewItem[] {
  const existingItemByToken = new Map(existingItems.map((item) => [buildExistingMediaToken(item), item]));
  const newTokens = (galleryOrder ?? []).filter((token) => token.startsWith("new:"));
  const fileByToken = new Map(
    newTokens
      .map((token, index) => [token, files[index]])
      .filter((entry): entry is [string, File] => Boolean(entry[1])),
  );
  const defaultItems = [...existingItems.map(existingItemToPreviewItem), ...files.map(fileToPreviewItem)];
  const orderedItems =
    galleryOrder && galleryOrder.length > 0
      ? galleryOrder
          .map((token) => {
            const existingItem = existingItemByToken.get(token);
            if (existingItem) return existingItemToPreviewItem(existingItem);

            const file = fileByToken.get(token);
            return file ? fileToPreviewItem(file) : null;
          })
          .filter((item): item is Omit<GalleryPreviewItem, "title"> => Boolean(item))
      : defaultItems;

  return orderedItems.map((item, index) => ({
    ...item,
    title: galleryImageTitle(index),
  }));
}

function normalizeGalleryPreviewTitle(
  preview: MediaPreviewState,
  galleryPreviewItems: GalleryPreviewItem[],
): MediaPreviewState {
  const items = preview.items?.map((item) => ({
    ...item,
    title: resolveGalleryPreviewTitle(item, galleryPreviewItems) ?? item.title,
  }));
  const currentItemTitle =
    resolveGalleryPreviewTitle(preview, galleryPreviewItems) ??
    (typeof preview.index === "number" ? items?.[preview.index]?.title : null) ??
    preview.title;

  return {
    ...preview,
    title: currentItemTitle,
    items,
  };
}

function resolveGalleryPreviewTitle(
  preview: Pick<MediaPreviewState, "url" | "title">,
  galleryPreviewItems: GalleryPreviewItem[],
) {
  const matchedByUrl = galleryPreviewItems.find((item) => item.url && item.url === preview.url);
  if (matchedByUrl) return matchedByUrl.title;

  return galleryPreviewItems.find((item) => item.name === preview.title)?.title ?? null;
}

function existingItemToPreviewItem(item: ExistingMediaItem): Omit<GalleryPreviewItem, "title"> {
  return {
    url: item.url,
    name: item.name,
  };
}

function fileToPreviewItem(file: File): Omit<GalleryPreviewItem, "title"> {
  return {
    name: file.name,
  };
}

function buildExistingMediaToken(item: ExistingMediaItem) {
  return `existing:${String(item.id)}`;
}

function galleryImageTitle(index: number) {
  return index === 0 ? "대표이미지" : `내부이미지${index}`;
}
