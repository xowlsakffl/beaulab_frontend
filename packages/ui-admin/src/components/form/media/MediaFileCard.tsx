"use client";
import React from "react";
import { GripVertical, Star, X } from "../../../icons";
import { Button } from "../../ui/button/Button";
import { MediaPreview, isImageFile, useObjectUrl } from "./MediaUploaderPrimitives";
import type { MediaCardVariant, MediaUploaderPreviewPayload } from "./MediaUploader.types";
import { formatBytes } from "./media-utils";
import { clearDragPreview, createDragPreview } from "./media-drag-preview";

type MediaFileCardProps = {
  file: File;
  objectUrl?: string | null;
  index: number;
  multiple: boolean;
  isRepresentative: boolean;
  isDragging?: boolean;
  previewBehavior?: "contain" | "natural-center";
  cardVariant?: MediaCardVariant;
  onRemove: () => void;
  onMakeRepresentative?: () => void;
  onPreview?: (preview: MediaUploaderPreviewPayload) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
};

export const MediaFileCard = React.forwardRef<HTMLDivElement, MediaFileCardProps>(function MediaFileCard(
  {
    file,
    objectUrl,
    multiple,
    isRepresentative,
    isDragging = false,
    previewBehavior = "contain",
    cardVariant = "default",
    onRemove,
    onMakeRepresentative,
    onPreview,
    onDragStart,
    onDragEnd,
  },
  ref,
) {
  const ownedObjectUrl = useObjectUrl(objectUrl === undefined ? file : null);
  const previewUrl = objectUrl === undefined ? ownedObjectUrl : objectUrl;
  const handlePreview = React.useCallback(() => {
    if (!previewUrl || !onPreview) return;

    onPreview({
      url: previewUrl,
      title: file.name,
      isImage: isImageFile(file),
    });
  }, [file, onPreview, previewUrl]);

  const previewContent = <MediaPreview file={file} url={previewUrl} previewBehavior={previewBehavior} />;
  const previewNode =
    previewUrl && onPreview ? (
      <button type="button" className="block h-full w-full cursor-zoom-in text-left" onClick={handlePreview}>
        {previewContent}
      </button>
    ) : (
      previewContent
    );

  if (!multiple && previewBehavior === "natural-center") {
    return (
      <div
        ref={ref}
        className={`flex w-full max-w-[500px] items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-[box-shadow,opacity,filter,transform] duration-200 lg:max-w-none ${
          isDragging ? "scale-[0.985] opacity-45 shadow-lg saturate-75" : ""
        }`}
      >
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl">{previewNode}</div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900">{file.name}</p>
          <p className="mt-1 text-xs text-gray-500">{formatBytes(file.size)}</p>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-9 shrink-0 text-gray-500 hover:text-red-600"
          onClick={(event) => {
            event.preventDefault();
            onRemove();
          }}
          title="파일 제거"
        >
          <X className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      data-media-card="true"
      className={`overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-[box-shadow,opacity,filter,transform] duration-200 ${""} w-full max-w-[500px] lg:max-w-none ${isDragging ? "scale-[0.985] opacity-45 shadow-lg saturate-75" : ""}`}
    >
      <div
        className={`relative ${cardVariant === "imageOnly" ? "aspect-[76/49]" : "aspect-[4/3]"} overflow-hidden bg-gray-50`}
      >
        {multiple ? (
          <div
            draggable
            onDragStart={(event) => {
              event.dataTransfer.effectAllowed = "move";
              const sourceCard = event.currentTarget.closest("[data-media-card]") as HTMLElement | null;
              const dragPreview = sourceCard
                ? createDragPreview(sourceCard, cardVariant === "imageOnly" ? "compact" : "card")
                : null;
              if (dragPreview) {
                event.dataTransfer.setDragImage(
                  dragPreview,
                  cardVariant === "imageOnly" ? 44 : event.currentTarget.clientWidth / 2,
                  cardVariant === "imageOnly" ? 18 : event.currentTarget.clientHeight / 2,
                );
              }
              onDragStart?.();
            }}
            onDragEnd={() => {
              clearDragPreview();
              onDragEnd?.();
            }}
            className="absolute top-3 left-3 z-10 inline-flex cursor-grab items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[11px] font-medium text-gray-500 shadow-sm select-none active:cursor-grabbing"
          >
            <GripVertical className="size-3.5" />
            순서 이동
          </div>
        ) : null}
        {multiple && isRepresentative && cardVariant !== "imageOnly" ? (
          <div className="absolute top-3 right-3 z-10 rounded-full bg-brand-500 px-2.5 py-1 text-[11px] font-semibold text-white">
            대표
          </div>
        ) : null}
        {cardVariant === "imageOnly" ? (
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1">
            {multiple && onMakeRepresentative ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 rounded-full bg-white/90 text-gray-500 shadow-sm hover:bg-white"
                onClick={(event) => {
                  event.preventDefault();
                  onMakeRepresentative();
                }}
                title="대표 이미지로 설정"
              >
                <Star
                  className={isRepresentative ? "size-4 fill-yellow-400 text-yellow-500" : "size-4 text-gray-400"}
                />
              </Button>
            ) : null}

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 rounded-full bg-white/90 text-gray-500 shadow-sm hover:bg-white hover:text-red-600"
              onClick={(event) => {
                event.preventDefault();
                onRemove();
              }}
              title="파일 제거"
            >
              <X className="size-4" />
            </Button>
          </div>
        ) : null}
        {previewNode}
      </div>

      {cardVariant !== "imageOnly" ? (
        <div className="flex items-center justify-between gap-3 border-t border-gray-200 p-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900">{file.name}</p>
            <p className="text-xs text-gray-500">{formatBytes(file.size)}</p>
          </div>

          <div className="flex items-center gap-1">
            {multiple && onMakeRepresentative ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9"
                onClick={(event) => {
                  event.preventDefault();
                  onMakeRepresentative();
                }}
                title="대표 이미지로 설정"
              >
                <Star
                  className={isRepresentative ? "size-4 fill-yellow-400 text-yellow-500" : "size-4 text-gray-400"}
                />
              </Button>
            ) : null}

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-9 text-gray-500 hover:text-red-600"
              onClick={(event) => {
                event.preventDefault();
                onRemove();
              }}
              title="파일 제거"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
});

MediaFileCard.displayName = "MediaFileCard";
