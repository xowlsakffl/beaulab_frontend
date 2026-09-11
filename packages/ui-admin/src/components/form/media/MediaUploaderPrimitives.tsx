"use client";

import Image from "next/image";
import React from "react";

import { Image as ImageIcon, UploadCloud } from "../../../icons";

type PreviewBehavior = "contain" | "natural-center";
type DropzoneVariant = "panel" | "button";

export function isImageFile(file: File) {
  return file.type.startsWith("image/");
}

export { useObjectUrl } from "../../../hooks/useObjectUrl";

function useImageDimensions(url: string | null, enabled = true) {
  const [dimensions, setDimensions] = React.useState<{ width: number; height: number } | null>(null);

  React.useEffect(() => {
    if (!url || !enabled) {
      setDimensions(null);
      return;
    }

    const image = new window.Image();
    image.onload = () => setDimensions({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => setDimensions(null);
    image.src = url;

    return () => {
      image.onload = null;
      image.onerror = null;
    };
  }, [enabled, url]);

  return dimensions;
}

export function MediaImagePreview({
  url,
  alt,
  previewBehavior = "contain",
}: {
  url: string;
  alt: string;
  previewBehavior?: PreviewBehavior;
}) {
  const useNaturalSize = previewBehavior === "natural-center";
  const dimensions = useImageDimensions(url, useNaturalSize);

  if (useNaturalSize && dimensions) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-xl bg-gray-50">
        <Image
          src={url}
          alt={alt}
          width={dimensions.width}
          height={dimensions.height}
          unoptimized
          className="h-auto max-h-full w-auto max-w-full object-contain"
        />
      </div>
    );
  }

  return (
    <div className="relative h-full w-full rounded-xl bg-gray-50">
      <Image src={url} alt={alt} fill unoptimized className="object-contain" />
    </div>
  );
}

export function MediaPreview({
  file,
  url,
  previewBehavior = "contain",
}: {
  file: File;
  url: string | null;
  previewBehavior?: PreviewBehavior;
}) {
  if (!url || !isImageFile(file)) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl bg-gray-50 text-gray-500">
        <ImageIcon className="size-10" />
      </div>
    );
  }

  return <MediaImagePreview url={url} alt={file.name} previewBehavior={previewBehavior} />;
}

export function Dropzone({
  accept,
  multiple,
  disabled,
  error = false,
  variant = "panel",
  primaryText = "파일 드래그 또는 클릭",
  secondaryText,
  footerText,
  onPickFiles,
}: {
  accept: string;
  multiple: boolean;
  disabled: boolean;
  error?: boolean;
  variant?: DropzoneVariant;
  primaryText?: string;
  secondaryText?: string;
  footerText?: string;
  onPickFiles: (files: File[]) => void;
}) {
  const [isDragOver, setIsDragOver] = React.useState(false);
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = "";

    if (files.length > 0) onPickFiles(files);
  };

  if (variant === "button") {
    return (
      <label
        className={[
          "inline-flex h-8 items-center justify-center rounded bg-brand-500 px-3 text-xs font-semibold text-white transition-colors",
          disabled ? "pointer-events-none opacity-60" : "cursor-pointer hover:bg-brand-600",
          error ? "ring-1 ring-error-500" : "",
        ].join(" ")}
      >
        <input
          type="file"
          data-media-file-input="true"
          className="sr-only"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={handleInputChange}
        />
        {primaryText}
      </label>
    );
  }

  return (
    <label
      className={[
        "relative grid min-h-[240px] place-items-center rounded-2xl border border-dashed p-6 transition-all select-none",
        disabled ? "pointer-events-none opacity-60" : "cursor-pointer",
        error
          ? "border-error-500 bg-error-50/40"
          : isDragOver
            ? "border-gray-400 bg-gray-100/80"
            : "border-gray-300 bg-gray-50",
      ].join(" ")}
      onDragEnter={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragOver(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragOver(true);
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragOver(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragOver(false);
        const files = Array.from(event.dataTransfer.files ?? []);
        if (files.length > 0) onPickFiles(files);
      }}
    >
      <input
        type="file"
        data-media-file-input="true"
        className="sr-only"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={handleInputChange}
      />

      {isDragOver ? (
        <div className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-brand-500">
          <div className="absolute inset-0 rounded-2xl bg-white/30 backdrop-blur-[2px]" />
        </div>
      ) : null}

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
        <div className="flex flex-col items-center justify-center gap-3 text-center">
          <div className="grid size-12 place-items-center rounded-xl bg-black/5">
            <UploadCloud className="size-5 text-gray-700" />
          </div>
          <div className="mx-auto w-full max-w-[220px] space-y-1 text-center">
            <div className="text-sm font-semibold text-gray-900">{primaryText}</div>
            <div className="text-xs text-gray-500">
              {secondaryText ?? (multiple ? "여러 파일 업로드 가능" : "1개 파일만 업로드 가능")}
            </div>
          </div>
        </div>
      </div>

      {footerText ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 px-6 pb-5">
          <p className="text-center text-xs text-gray-500">{footerText}</p>
        </div>
      ) : null}
    </label>
  );
}

export function HiddenFileInput({
  accept,
  multiple,
  disabled,
  onPickFiles,
}: {
  accept: string;
  multiple: boolean;
  disabled: boolean;
  onPickFiles: (files: File[]) => void;
}) {
  return (
    <input
      type="file"
      data-media-file-input="true"
      className="sr-only"
      accept={accept}
      multiple={multiple}
      disabled={disabled}
      onChange={(event) => {
        const files = Array.from(event.currentTarget.files ?? []);
        event.currentTarget.value = "";
        if (files.length > 0) onPickFiles(files);
      }}
    />
  );
}
