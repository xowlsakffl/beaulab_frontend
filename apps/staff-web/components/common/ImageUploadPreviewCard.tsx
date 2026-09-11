"use client";

import React from "react";
import { Button, Card, CircleRemoveButton, ImagePlus, Plus } from "@beaulab/ui-admin";
import type { MediaPreviewState } from "./MediaPreviewModal";

export function ImageUploadPreviewCard({
  id,
  title,
  helper,
  accept,
  emptyTitle = `${title} 이미지를 등록해 주세요.`,
  emptyDescription,
  objectUrl,
  onPreview,
  onFileChange,
  onClear,
  error,
  disabled = false,
  aspect = "square",
  emptyAspect = aspect,
  showHeader = true,
  required = false,
  mediaCollection,
  className,
}: {
  id?: string;
  title: string;
  helper?: string;
  accept: string;
  emptyTitle?: string;
  emptyDescription: string;
  objectUrl: string | null;
  onPreview?: (preview: MediaPreviewState) => void;
  onFileChange: (file: File) => void | Promise<void>;
  onClear?: () => void;
  error?: string;
  disabled?: boolean;
  aspect?: "square" | "video" | "auto";
  emptyAspect?: "square" | "video" | "auto";
  showHeader?: boolean;
  required?: boolean;
  mediaCollection?: string;
  className?: string;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = React.useState(false);
  const errorId = React.useId();
  const displayAspect = objectUrl ? aspect : emptyAspect;
  const dragActive = isDragOver && !disabled;
  const openFilePicker = () => inputRef.current?.click();
  const previewOnly = Boolean(objectUrl && !onPreview);
  const PreviewSurface = previewOnly ? "div" : "button";

  return (
    <Card
      data-media-collection={mediaCollection}
      tabIndex={-1}
      className={["min-w-0 rounded-xl border border-gray-200 bg-white p-5", className].filter(Boolean).join(" ")}
    >
      {showHeader ? (
        <div className="mb-2 min-w-0">
          <h3 className="text-sm font-bold text-gray-900">
            {title}
            {required ? <span className="ml-0.5 text-brand-500">*</span> : null}
          </h3>
          {helper ? <p className="mt-1 text-xs text-gray-500">{helper}</p> : null}
        </div>
      ) : null}
      <div className="relative w-full min-w-0">
        <PreviewSurface
          id={id}
          {...(previewOnly ? {} : { type: "button" as const, disabled })}
          aria-label={`${title} ${objectUrl ? (onPreview ? "미리보기" : "이미지") : "등록"}`}
          aria-describedby={error ? errorId : undefined}
          onClick={
            previewOnly
              ? undefined
              : () => (objectUrl ? onPreview?.({ url: objectUrl, title, isImage: true }) : openFilePicker())
          }
          onDragOver={(event) => {
            event.preventDefault();
            event.stopPropagation();
            if (!disabled && event.dataTransfer.types.includes("Files")) setIsDragOver(true);
          }}
          onDragLeave={(event) => {
            if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return;
            setIsDragOver(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setIsDragOver(false);
            const file = event.dataTransfer.files[0];
            if (!disabled && file) void onFileChange(file);
          }}
          className={[
            "flex w-full items-center justify-center overflow-hidden rounded-xl border transition-colors focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:outline-none focus-visible:ring-inset",
            displayAspect === "square"
              ? "aspect-square"
              : displayAspect === "video"
                ? "aspect-video"
                : objectUrl
                  ? "max-h-[32rem]"
                  : "min-h-[18rem]",
            objectUrl ? "" : "border-dashed px-6",
            dragActive ? "bg-brand-50/30" : objectUrl ? "bg-gray-50" : "bg-white",
            error
              ? "border-error-500"
              : dragActive
                ? "border-brand-200"
                : "border-gray-300 enabled:hover:border-brand-200",
            objectUrl ? (onPreview ? "enabled:cursor-zoom-in" : "enabled:cursor-default") : "enabled:cursor-pointer",
            "enabled:hover:bg-brand-50/30 disabled:cursor-not-allowed disabled:opacity-60",
          ].join(" ")}
        >
          {objectUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- local and persisted media preview
            <img
              src={objectUrl}
              alt={title}
              className={
                aspect === "auto" ? "h-auto max-h-[32rem] w-full object-contain" : "h-full w-full object-cover"
              }
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-brand-50 text-brand-500">
                <Plus className="size-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-gray-800">{emptyTitle}</p>
                <p className="text-xs text-gray-500">{emptyDescription}</p>
              </div>
            </div>
          )}
        </PreviewSurface>
        {objectUrl ? (
          <>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="absolute right-2 bottom-2 size-8 bg-white"
              title={`${title} 파일선택`}
              aria-label={`${title} 파일선택`}
              disabled={disabled}
              onClick={openFilePicker}
            >
              <ImagePlus className="size-4" />
            </Button>
            {onClear ? (
              <CircleRemoveButton
                className="absolute top-2 right-2"
                aria-label={`${title} 선택 취소`}
                disabled={disabled}
                onClick={onClear}
              />
            ) : null}
          </>
        ) : null}
      </div>
      {error ? (
        <p id={errorId} role="alert" className="mt-1.5 text-xs text-error-500">
          {error}
        </p>
      ) : null}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        disabled={disabled}
        className="hidden"
        aria-label={`${title} 파일`}
        aria-invalid={Boolean(error)}
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = "";
          if (file) void onFileChange(file);
        }}
      />
    </Card>
  );
}
