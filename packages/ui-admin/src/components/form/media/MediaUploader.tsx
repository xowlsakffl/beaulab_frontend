"use client";

import Image from "next/image";
import React from "react";
import { GripVertical, Image as ImageIcon, Star, UploadCloud, X } from "../../../icons";
import { Button } from "../../ui/button/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card/Card";

export type MediaCollectionConfig<T extends string = string> = {
  key: T;
  label: string;
  showLabel?: boolean;
  dropzoneVariant?: DropzoneVariant;
  hideDropzone?: boolean;
  accept: string;
  multiple?: boolean;
  maxFiles?: number;
  emptyText: string;
  helperText: string;
  maxFilesText?: string;
  previewBehavior?: "contain" | "natural-center";
  cardVariant?: MediaCardVariant;
};

export type ExistingMediaItem = {
  id: string | number;
  url: string;
  name: string;
  size?: number | null;
  isImage?: boolean;
  isRepresentative?: boolean;
};

export type MediaUploaderPreviewItem = {
  url: string;
  title: string;
  isImage: boolean;
};

export type MediaUploaderPreviewPayload = MediaUploaderPreviewItem & {
  items?: MediaUploaderPreviewItem[];
  index?: number;
};

type MediaUploaderProps<T extends string = string> = {
  title?: string;
  embedded?: boolean;
  layout?: MediaListLayout;
  collections: readonly MediaCollectionConfig<T>[];
  filesByCollection: Partial<Record<T, File[]>>;
  existingItemsByCollection?: Partial<Record<T, ExistingMediaItem[]>>;
  orderByCollection?: Partial<Record<T, string[]>>;
  errors?: Partial<Record<T, string>>;
  onChange: (key: T, files: File[]) => void;
  onExistingItemsChange?: (key: T, items: ExistingMediaItem[]) => void;
  onOrderChange?: (key: T, order: string[]) => void;
  onPreview?: (key: T, preview: MediaUploaderPreviewPayload) => void;
  onBeforeAddFiles?: (key: T, files: File[]) => File[] | Promise<File[]>;
};

type MediaListLayout = "stack" | "horizontal";
export type DropzoneVariant = "panel" | "button";
export type MediaCardVariant = "default" | "imageOnly";

type MergedMediaEntry =
  | {
      token: string;
      kind: "existing";
      item: ExistingMediaItem;
    }
  | {
      token: string;
      kind: "new";
      file: File;
    };

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes)) return "";

  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`;
}

function isImageFile(file: File) {
  return file.type.startsWith("image/");
}

function buildExistingMediaToken(item: ExistingMediaItem) {
  return `existing:${String(item.id)}`;
}

function buildNewMediaToken(fileId: string) {
  return `new:${fileId}`;
}

type DropPosition = "before" | "after";

function getMediaListClassName(layout: MediaListLayout) {
  if (layout === "horizontal") {
    return "grid auto-cols-[calc((100%_-_2.25rem)_/_4)] grid-flow-col gap-3 overflow-x-auto overflow-y-hidden overscroll-x-contain pt-2 pb-4 [scrollbar-gutter:stable]";
  }

  return "space-y-3 pt-2";
}

function getMediaListItemClassName(layout: MediaListLayout, itemIndex: number, itemCount: number) {
  if (layout === "horizontal") {
    return "relative min-w-0";
  }

  return `relative ${itemIndex === 0 ? "pt-4" : ""} ${itemIndex === itemCount - 1 ? "pb-4" : ""}`;
}

function resolveDropPosition(event: React.DragEvent<HTMLElement>, layout: MediaListLayout): DropPosition {
  const rect = event.currentTarget.getBoundingClientRect();

  if (layout === "horizontal") {
    return event.clientX - rect.left < rect.width / 2 ? "before" : "after";
  }

  return event.clientY - rect.top < rect.height / 2 ? "before" : "after";
}

function resolveDropPositionWithBias(
  event: React.DragEvent<HTMLElement>,
  itemIndex: number,
  itemCount: number,
  layout: MediaListLayout,
): DropPosition {
  const rect = event.currentTarget.getBoundingClientRect();
  const offset = layout === "horizontal" ? event.clientX - rect.left : event.clientY - rect.top;
  const size = layout === "horizontal" ? rect.width : rect.height;

  if (itemIndex === 0) {
    return offset < size * 0.72 ? "before" : "after";
  }

  if (itemIndex === itemCount - 1) {
    return offset < size * 0.28 ? "before" : "after";
  }

  return offset < size / 2 ? "before" : "after";
}

function resolveInsertionIndex(itemIndex: number, position: DropPosition) {
  return position === "before" ? itemIndex : itemIndex + 1;
}

function reorderItemsByInsertionIndex<T>(items: T[], draggedIndex: number, insertionIndex: number) {
  if (draggedIndex < 0 || draggedIndex >= items.length || insertionIndex < 0 || insertionIndex > items.length) {
    return items;
  }

  const nextItems = [...items];
  const [movedItem] = nextItems.splice(draggedIndex, 1);
  let insertIndex = insertionIndex;
  if (draggedIndex < insertIndex) {
    insertIndex -= 1;
  }

  nextItems.splice(insertIndex, 0, movedItem);
  return nextItems;
}

function DropIndicator({ position, layout }: { position: DropPosition; layout: MediaListLayout }) {
  if (layout === "horizontal") {
    return (
      <div
        className={`pointer-events-none absolute inset-y-3 z-20 ${position === "before" ? "-left-1.5" : "-right-1.5"}`}
        aria-hidden="true"
      >
        <div className="flex h-full flex-col items-center gap-1.5">
          <span className="size-2 rounded-full bg-blue-500 shadow-[0_0_0_2px_rgba(59,130,246,0.18)]" />
          <span className="w-1 flex-1 rounded-full bg-blue-500 shadow-[0_0_0_2px_rgba(59,130,246,0.12)]" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`pointer-events-none absolute inset-x-3 z-20 ${position === "before" ? "-top-1.5" : "-bottom-1.5"}`}
      aria-hidden="true"
    >
      <div className="flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-blue-500 shadow-[0_0_0_2px_rgba(59,130,246,0.18)]" />
        <span className="h-1 flex-1 rounded-full bg-blue-500 shadow-[0_0_0_2px_rgba(59,130,246,0.12)]" />
      </div>
    </div>
  );
}

function getScrollContainer(node: HTMLElement | null): HTMLElement | Window {
  if (typeof window === "undefined") {
    return window;
  }

  let currentNode = node?.parentElement ?? null;

  while (currentNode) {
    const style = window.getComputedStyle(currentNode);
    const overflowY = style.overflowY;
    const canScroll = (overflowY === "auto" || overflowY === "scroll") && currentNode.scrollHeight > currentNode.clientHeight;

    if (canScroll) {
      return currentNode;
    }

    currentNode = currentNode.parentElement;
  }

  return window;
}

function autoScrollDuringDrag(event: React.DragEvent<HTMLElement>) {
  if (typeof window === "undefined") {
    return;
  }

  const threshold = 120;
  const maxStep = 20;
  const scrollContainer = getScrollContainer(event.currentTarget);

  if (scrollContainer === window) {
    return;
  }

  const scrollElement = scrollContainer as HTMLElement;
  const rect = scrollElement.getBoundingClientRect();
  const topDistance = event.clientY - rect.top;
  const bottomDistance = rect.bottom - event.clientY;

  if (topDistance < threshold) {
    const velocity = Math.ceil(((threshold - topDistance) / threshold) * maxStep);
    scrollElement.scrollTop -= velocity;
    return;
  }

  if (bottomDistance < threshold) {
    const velocity = Math.ceil(((threshold - bottomDistance) / threshold) * maxStep);
    scrollElement.scrollTop += velocity;
  }
}

function autoScrollWindowByClientY(clientY: number) {
  if (typeof window === "undefined") {
    return;
  }

  const topThreshold = 180;
  const bottomThreshold = 140;
  const maxStep = 20;
  const topDistance = clientY;
  const bottomDistance = window.innerHeight - clientY;

  if (topDistance < topThreshold) {
    const velocity = Math.ceil(((topThreshold - topDistance) / topThreshold) * maxStep);
    window.scrollBy(0, -velocity);
    return;
  }

  if (bottomDistance < bottomThreshold) {
    const velocity = Math.ceil(((bottomThreshold - bottomDistance) / bottomThreshold) * maxStep);
    window.scrollBy(0, velocity);
  }
}

function useWindowAutoScrollWhileDragging(enabled: boolean) {
  const latestClientYRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      return;
    }

    let frameId = 0;

    const tick = () => {
      const clientY = latestClientYRef.current;
      if (clientY !== null) {
        autoScrollWindowByClientY(clientY);
      }

      frameId = window.requestAnimationFrame(tick);
    };

    const handleDragOver = (event: DragEvent) => {
      latestClientYRef.current = event.clientY;
    };

    frameId = window.requestAnimationFrame(tick);
    window.addEventListener("dragover", handleDragOver);

    return () => {
      window.removeEventListener("dragover", handleDragOver);
      window.cancelAnimationFrame(frameId);
      latestClientYRef.current = null;
    };
  }, [enabled]);
}

function normalizeMediaOrder(order: string[] | undefined, defaultOrder: string[]) {
  const validTokenSet = new Set(defaultOrder);
  const nextOrder: string[] = [];
  const pushedTokenSet = new Set<string>();

  for (const token of order ?? []) {
    if (!validTokenSet.has(token) || pushedTokenSet.has(token)) {
      continue;
    }

    nextOrder.push(token);
    pushedTokenSet.add(token);
  }

  for (const token of defaultOrder) {
    if (pushedTokenSet.has(token)) {
      continue;
    }

    nextOrder.push(token);
    pushedTokenSet.add(token);
  }

  return nextOrder;
}

let activeDragPreview: HTMLDivElement | null = null;

function clearDragPreview() {
  if (!activeDragPreview) {
    return;
  }

  activeDragPreview.remove();
  activeDragPreview = null;
}

function createDragPreview(sourceNode: HTMLElement, variant: "card" | "compact" = "card") {
  if (typeof document === "undefined") {
    return null;
  }

  clearDragPreview();

  const rect = sourceNode.getBoundingClientRect();
  const clonedNode =
    variant === "compact"
      ? document.createElement("div")
      : (sourceNode.cloneNode(true) as HTMLDivElement);

  if (variant === "compact") {
    clonedNode.textContent = "이미지 이동";
    clonedNode.style.display = "flex";
    clonedNode.style.alignItems = "center";
    clonedNode.style.justifyContent = "center";
    clonedNode.style.fontSize = "12px";
    clonedNode.style.fontWeight = "600";
    clonedNode.style.color = "#374151";
    clonedNode.style.background = "rgba(255,255,255,0.94)";
    clonedNode.style.border = "1px solid rgba(209,213,219,0.95)";
    clonedNode.style.borderRadius = "999px";
    clonedNode.style.padding = "8px 12px";
  }

  clonedNode.style.position = "fixed";
  clonedNode.style.top = "-10000px";
  clonedNode.style.left = "-10000px";
  clonedNode.style.width = variant === "compact" ? "88px" : `${rect.width}px`;
  clonedNode.style.height = variant === "compact" ? "36px" : `${rect.height}px`;
  clonedNode.style.pointerEvents = "none";
  clonedNode.style.opacity = variant === "compact" ? "0.92" : "0.68";
  clonedNode.style.transform = variant === "compact" ? "none" : "scale(0.985)";
  clonedNode.style.boxShadow =
    variant === "compact" ? "0 10px 24px rgba(15, 23, 42, 0.16)" : "0 20px 45px rgba(15, 23, 42, 0.18)";
  clonedNode.style.zIndex = "9999";

  document.body.appendChild(clonedNode);
  activeDragPreview = clonedNode;
  return clonedNode;
}

function useObjectUrl(file: File | null) {
  const [url, setUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return url;
}

function useStableFileId() {
  const fileIdsRef = React.useRef(new WeakMap<File, string>());
  const nextIdRef = React.useRef(0);

  return React.useCallback((file: File) => {
    const existingId = fileIdsRef.current.get(file);
    if (existingId) {
      return existingId;
    }

    nextIdRef.current += 1;
    const nextId = `media-file-${nextIdRef.current}`;
    fileIdsRef.current.set(file, nextId);
    return nextId;
  }, []);
}

function useImageDimensions(url: string | null, enabled = true) {
  const [dimensions, setDimensions] = React.useState<{ width: number; height: number } | null>(null);

  React.useEffect(() => {
    if (!url || !enabled) {
      setDimensions(null);
      return;
    }

    const image = new window.Image();
    image.onload = () => {
      setDimensions({
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
    };
    image.onerror = () => setDimensions(null);
    image.src = url;

    return () => {
      image.onload = null;
      image.onerror = null;
    };
  }, [enabled, url]);

  return dimensions;
}

function MediaImagePreview({
  url,
  alt,
  previewBehavior = "contain",
}: {
  url: string;
  alt: string;
  previewBehavior?: "contain" | "natural-center";
}) {
  const useNaturalSize = previewBehavior === "natural-center";
  const dimensions = useImageDimensions(url, useNaturalSize);

  if (useNaturalSize && dimensions) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-xl bg-gray-50 ">
        <Image
          src={url}
          alt={alt}
          width={dimensions.width}
          height={dimensions.height}
          unoptimized
          className="h-auto w-auto max-h-full max-w-full object-contain"
        />
      </div>
    );
  }

  return (
    <div className="relative h-full w-full rounded-xl bg-gray-50 ">
      <Image src={url} alt={alt} fill unoptimized className="object-contain" />
    </div>
  );
}

function MediaPreview({
  file,
  previewBehavior = "contain",
}: {
  file: File;
  previewBehavior?: "contain" | "natural-center";
}) {
  const url = useObjectUrl(isImageFile(file) ? file : null);

  if (!url) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl bg-gray-50 text-gray-500  ">
        <ImageIcon className="size-10" />
      </div>
    );
  }

  return (
    <MediaImagePreview url={url} alt={file.name} previewBehavior={previewBehavior} />
  );
}

function Dropzone({
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

    if (files.length > 0) {
      onPickFiles(files);
    }
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
        "relative grid place-items-center rounded-2xl border border-dashed transition-all select-none",
        "min-h-[240px] p-6",
        disabled ? "pointer-events-none opacity-60" : "cursor-pointer",
        error
          ? "border-error-500 bg-error-50/40 "
          : isDragOver
            ? "border-gray-400 bg-gray-100/80  "
            : "border-gray-300 bg-gray-50  ",
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
        if (files.length > 0) {
          onPickFiles(files);
        }
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
          <div className="absolute inset-0 rounded-2xl bg-white/30 backdrop-blur-[2px] " />
        </div>
      ) : null}

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
        <div className="flex flex-col items-center justify-center gap-3 text-center">
          <div className="grid size-12 place-items-center rounded-xl bg-black/5 ">
            <UploadCloud className="size-5 text-gray-700 " />
          </div>

          <div className="mx-auto w-full max-w-[220px] space-y-1 text-center">
            <div className="text-sm font-semibold text-gray-900 ">{primaryText}</div>
            <div className="text-xs text-gray-500 ">
              {secondaryText ?? (multiple ? "여러 파일 업로드 가능" : "1개 파일만 업로드 가능")}
            </div>
          </div>
        </div>
      </div>

      {footerText ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 px-6 pb-5">
          <p className="text-center text-xs text-gray-500 ">{footerText}</p>
        </div>
      ) : null}
    </label>
  );
}

function HiddenFileInput({
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

        if (files.length > 0) {
          onPickFiles(files);
        }
      }}
    />
  );
}

type MediaFileCardProps = {
  file: File;
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

const MediaFileCard = React.forwardRef<HTMLDivElement, MediaFileCardProps>(function MediaFileCard(
  {
    file,
    index,
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
  const previewUrl = useObjectUrl(file);
  const handlePreview = React.useCallback(() => {
    if (!previewUrl || !onPreview) return;

    onPreview({
      url: previewUrl,
      title: file.name,
      isImage: isImageFile(file),
    });
  }, [file, onPreview, previewUrl]);

  const previewContent = <MediaPreview file={file} previewBehavior={previewBehavior} />;
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
        className={`flex w-full max-w-[500px] items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-[box-shadow,opacity,filter,transform] duration-200 lg:max-w-none   ${
          isDragging ? "scale-[0.985] opacity-45 shadow-lg saturate-75" : ""
        }`}
      >
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl">
          {previewNode}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900 ">{file.name}</p>
          <p className="mt-1 text-xs text-gray-500 ">{formatBytes(file.size)}</p>
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
      className={`overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-[box-shadow,opacity,filter,transform] duration-200   ${
        ""
      } w-full max-w-[500px] lg:max-w-none ${isDragging ? "scale-[0.985] opacity-45 shadow-lg saturate-75" : ""}`}
    >
      <div className={`relative ${cardVariant === "imageOnly" ? "aspect-[76/49]" : "aspect-[4/3]"} overflow-hidden bg-gray-50 `}>
        {multiple ? (
          <div
            draggable
            onDragStart={(event) => {
              event.dataTransfer.effectAllowed = "move";
              const sourceCard = event.currentTarget.closest("[data-media-card]") as HTMLElement | null;
              const dragPreview = sourceCard ? createDragPreview(sourceCard, cardVariant === "imageOnly" ? "compact" : "card") : null;
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
            className="absolute left-3 top-3 z-10 inline-flex cursor-grab active:cursor-grabbing items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[11px] font-medium text-gray-500 shadow-sm select-none  "
          >
            <GripVertical className="size-3.5" />
            순서 이동
          </div>
        ) : null}
        {multiple && isRepresentative && cardVariant !== "imageOnly" ? (
          <div className="absolute right-3 top-3 z-10 rounded-full bg-brand-500 px-2.5 py-1 text-[11px] font-semibold text-white">
            대표
          </div>
        ) : null}
        {cardVariant === "imageOnly" ? (
          <div className="absolute right-3 top-3 z-10 flex items-center gap-1">
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
                <Star className={isRepresentative ? "size-4 fill-yellow-400 text-yellow-500" : "size-4 text-gray-400"} />
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
        <div className="flex items-center justify-between gap-3 border-t border-gray-200 p-3 ">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900 ">{file.name}</p>
            <p className="text-xs text-gray-500 ">{formatBytes(file.size)}</p>
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
                <Star className={isRepresentative ? "size-4 fill-yellow-400 text-yellow-500" : "size-4 text-gray-400"} />
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

function ExistingMediaCard({
  item,
  index,
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
}: {
  item: ExistingMediaItem;
  index: number;
  multiple: boolean;
  isRepresentative: boolean;
  isDragging?: boolean;
  previewBehavior?: "contain" | "natural-center";
  cardVariant?: MediaCardVariant;
  onRemove?: () => void;
  onMakeRepresentative?: () => void;
  onPreview?: (preview: MediaUploaderPreviewPayload) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}) {
  const canPreview = Boolean(item.url && onPreview);
  const handlePreview = React.useCallback(() => {
    if (!item.url || !onPreview) return;

    onPreview({
      url: item.url,
      title: item.name,
      isImage: item.isImage !== false,
    });
  }, [item.isImage, item.name, item.url, onPreview]);

  const previewContent =
    item.isImage === false ? (
      <div className="flex h-full items-center justify-center rounded-xl bg-gray-50 text-gray-500  ">
        <ImageIcon className="size-8" />
      </div>
    ) : (
      <MediaImagePreview url={item.url} alt={item.name} previewBehavior={previewBehavior} />
    );
  const previewNode = canPreview ? (
    <button type="button" className="block h-full w-full cursor-zoom-in text-left" onClick={handlePreview}>
      {previewContent}
    </button>
  ) : (
    previewContent
  );

  if (!multiple && previewBehavior === "natural-center") {
    return (
      <div className="flex w-full max-w-[500px] items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm lg:max-w-none  ">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl">
          {previewNode}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900 ">{item.name}</p>
          <p className="mt-1 text-xs text-gray-500 ">
            {[item.size ? formatBytes(item.size) : null, "현재 파일"].filter(Boolean).join(" · ")}
          </p>
        </div>

        {onRemove ? (
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
        ) : null}
      </div>
    );
  }

  return (
    <div
      data-media-card="true"
      className={`overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-[box-shadow,opacity,filter,transform] duration-200   ${
        ""
      } w-full max-w-[500px] lg:max-w-none ${isDragging ? "scale-[0.985] opacity-45 shadow-lg saturate-75" : ""}`}
    >
      <div className={`relative ${cardVariant === "imageOnly" ? "aspect-[76/49]" : "aspect-[4/3]"} overflow-hidden bg-gray-50 `}>
        {multiple && onDragStart ? (
          <div
            draggable
            onDragStart={(event) => {
              event.dataTransfer.effectAllowed = "move";
              const sourceCard = event.currentTarget.closest("[data-media-card]") as HTMLElement | null;
              const dragPreview = sourceCard ? createDragPreview(sourceCard, cardVariant === "imageOnly" ? "compact" : "card") : null;
              if (dragPreview) {
                event.dataTransfer.setDragImage(
                  dragPreview,
                  cardVariant === "imageOnly" ? 44 : event.currentTarget.clientWidth / 2,
                  cardVariant === "imageOnly" ? 18 : event.currentTarget.clientHeight / 2,
                );
              }
              onDragStart();
            }}
            onDragEnd={() => {
              clearDragPreview();
              onDragEnd?.();
            }}
            className="absolute left-3 top-3 z-10 inline-flex cursor-grab active:cursor-grabbing items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[11px] font-medium text-gray-500 shadow-sm select-none  "
          >
            <GripVertical className="size-3.5" />
            순서 이동
          </div>
        ) : null}
        {multiple && isRepresentative && cardVariant !== "imageOnly" ? (
          <div className="absolute right-3 top-3 z-10 rounded-full bg-brand-500 px-2.5 py-1 text-[11px] font-semibold text-white">
            대표
          </div>
        ) : null}
        {cardVariant === "imageOnly" ? (
          <div className="absolute right-3 top-3 z-10 flex items-center gap-1">
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
                <Star className={isRepresentative ? "size-4 fill-yellow-400 text-yellow-500" : "size-4 text-gray-400"} />
              </Button>
            ) : null}

            {onRemove ? (
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
            ) : null}
          </div>
        ) : null}
        {previewNode}
      </div>

      {cardVariant !== "imageOnly" ? (
        <div className="flex items-center justify-between gap-3 border-t border-gray-200 p-3 ">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900 ">{item.name}</p>
            <p className="text-xs text-gray-500 ">
              {[item.size ? formatBytes(item.size) : null, "현재 파일"].filter(Boolean).join(" · ")}
            </p>
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
                <Star className={isRepresentative ? "size-4 fill-yellow-400 text-yellow-500" : "size-4 text-gray-400"} />
              </Button>
            ) : null}

            {onRemove ? (
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
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ExistingMediaList({
  items,
  multiple,
  previewBehavior,
  cardVariant = "default",
  layout = "stack",
  onPreview,
}: {
  items: ExistingMediaItem[];
  multiple: boolean;
  previewBehavior?: "contain" | "natural-center";
  cardVariant?: MediaCardVariant;
  layout?: MediaListLayout;
  onPreview?: (preview: MediaUploaderPreviewPayload) => void;
}) {
  const previewItems = React.useMemo(
    () =>
      items
        .filter((item) => Boolean(item.url))
        .map((item) => ({
          url: item.url,
          title: item.name,
          isImage: item.isImage !== false,
        })),
    [items],
  );
  const previewIndexById = React.useMemo(() => {
    const map = new Map<string, number>();
    let nextIndex = 0;

    items.forEach((item) => {
      if (!item.url) return;
      map.set(String(item.id), nextIndex);
      nextIndex += 1;
    });

    return map;
  }, [items]);

  if (multiple) {
    return (
      <div className={getMediaListClassName(layout)}>
        {items.map((item, index) => (
          <ExistingMediaCard
            key={String(item.id)}
            item={item}
            index={index}
            multiple
            isRepresentative={index === 0}
            previewBehavior={previewBehavior}
            cardVariant={cardVariant}
            onPreview={
              onPreview
                ? (preview) =>
                    onPreview({
                      ...preview,
                      items: previewItems,
                      index: previewIndexById.get(String(item.id)) ?? 0,
                    })
                : undefined
            }
          />
        ))}
      </div>
    );
  }

  return (
    <div className="pt-2">
      <ExistingMediaCard
        item={items[0]}
        index={0}
        multiple={false}
        isRepresentative={false}
        previewBehavior={previewBehavior}
        cardVariant={cardVariant}
        onPreview={
          onPreview
            ? (preview) =>
                onPreview({
                  ...preview,
                  items: previewItems,
                  index: previewIndexById.get(String(items[0]?.id)) ?? 0,
                })
            : undefined
        }
      />
    </div>
  );
}

function SortableExistingMediaList({
  items,
  previewBehavior,
  cardVariant = "default",
  layout = "stack",
  onRemove,
  onMakeRepresentative,
  onReorder,
  onPreview,
}: {
  items: ExistingMediaItem[];
  previewBehavior?: "contain" | "natural-center";
  cardVariant?: MediaCardVariant;
  layout?: MediaListLayout;
  onRemove: (index: number) => void;
  onMakeRepresentative: (index: number) => void;
  onReorder: (items: ExistingMediaItem[]) => void;
  onPreview?: (preview: MediaUploaderPreviewPayload) => void;
}) {
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);
  const [dropInsertionIndex, setDropInsertionIndex] = React.useState<number | null>(null);
  const previewItems = React.useMemo(
    () =>
      items
        .filter((item) => Boolean(item.url))
        .map((item) => ({
          url: item.url,
          title: item.name,
          isImage: item.isImage !== false,
        })),
    [items],
  );
  const previewIndexById = React.useMemo(() => {
    const map = new Map<string, number>();
    let nextIndex = 0;

    items.forEach((item) => {
      if (!item.url) return;
      map.set(String(item.id), nextIndex);
      nextIndex += 1;
    });

    return map;
  }, [items]);
  useWindowAutoScrollWhileDragging(layout !== "horizontal" && draggedIndex !== null);

  return (
    <div
      className={getMediaListClassName(layout)}
      onDragOver={(event) => {
        if (draggedIndex === null) return;
        event.preventDefault();
        if (layout !== "horizontal") {
          autoScrollDuringDrag(event);
        }
      }}
    >
      {items.map((item, itemIndex) => (
        <div
          key={String(item.id)}
          className={getMediaListItemClassName(layout, itemIndex, items.length)}
          onDragOver={(event) => {
            if (draggedIndex === null) return;
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
            if (layout !== "horizontal") {
              autoScrollDuringDrag(event);
            }
            const insertionIndex = resolveInsertionIndex(
              itemIndex,
              resolveDropPositionWithBias(event, itemIndex, items.length, layout),
            );
            setDropInsertionIndex((current) =>
              current === insertionIndex ? current : insertionIndex,
            );
          }}
          onDrop={(event) => {
            if (draggedIndex === null || draggedIndex === itemIndex) return;
            event.preventDefault();
            const insertionIndex = dropInsertionIndex ?? resolveInsertionIndex(itemIndex, resolveDropPosition(event, layout));
            onReorder(reorderItemsByInsertionIndex(items, draggedIndex, insertionIndex));
            setDraggedIndex(null);
            setDropInsertionIndex(null);
          }}
        >
          {dropInsertionIndex !== null &&
          draggedIndex !== null &&
          draggedIndex !== itemIndex &&
          (dropInsertionIndex === itemIndex || (itemIndex === items.length - 1 && dropInsertionIndex === itemIndex + 1)) ? (
            <DropIndicator position={dropInsertionIndex === itemIndex ? "before" : "after"} layout={layout} />
          ) : null}
          <ExistingMediaCard
            item={item}
            index={itemIndex}
            multiple
            isRepresentative={itemIndex === 0}
            isDragging={draggedIndex === itemIndex}
            previewBehavior={previewBehavior}
            cardVariant={cardVariant}
            onRemove={() => onRemove(itemIndex)}
            onMakeRepresentative={() => onMakeRepresentative(itemIndex)}
            onPreview={
              onPreview
                ? (preview) =>
                    onPreview({
                      ...preview,
                      items: previewItems,
                      index: previewIndexById.get(String(item.id)) ?? 0,
                    })
                : undefined
            }
            onDragStart={() => setDraggedIndex(itemIndex)}
            onDragEnd={() => {
              setDraggedIndex(null);
              setDropInsertionIndex(null);
            }}
          />
        </div>
      ))}
    </div>
  );
}

function SortableMediaFileList({
  files,
  getFileId,
  previewBehavior,
  cardVariant = "default",
  layout = "stack",
  representativeOffset = 0,
  allowRepresentative = true,
  onRemove,
  onMakeRepresentative,
  onReorder,
  onPreview,
}: {
  files: File[];
  getFileId: (file: File) => string;
  previewBehavior?: "contain" | "natural-center";
  cardVariant?: MediaCardVariant;
  layout?: MediaListLayout;
  representativeOffset?: number;
  allowRepresentative?: boolean;
  onRemove: (index: number) => void;
  onMakeRepresentative: (index: number) => void;
  onReorder: (files: File[]) => void;
  onPreview?: (preview: MediaUploaderPreviewPayload) => void;
}) {
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);
  const [dropInsertionIndex, setDropInsertionIndex] = React.useState<number | null>(null);
  useWindowAutoScrollWhileDragging(layout !== "horizontal" && draggedIndex !== null);

  return (
    <div
      className={getMediaListClassName(layout)}
      onDragOver={(event) => {
        if (draggedIndex === null) return;
        event.preventDefault();
        if (layout !== "horizontal") {
          autoScrollDuringDrag(event);
        }
      }}
    >
      {files.map((file, fileIndex) => {
        const fileId = getFileId(file);

        return (
          <div
            key={fileId}
            className={getMediaListItemClassName(layout, fileIndex, files.length)}
            onDragOver={(event) => {
              if (draggedIndex === null) return;
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
              if (layout !== "horizontal") {
                autoScrollDuringDrag(event);
              }
              const insertionIndex = resolveInsertionIndex(
                fileIndex,
                resolveDropPositionWithBias(event, fileIndex, files.length, layout),
              );
              setDropInsertionIndex((current) =>
                current === insertionIndex ? current : insertionIndex,
              );
            }}
            onDrop={(event) => {
              if (draggedIndex === null || draggedIndex === fileIndex) return;
              event.preventDefault();
              const insertionIndex = dropInsertionIndex ?? resolveInsertionIndex(fileIndex, resolveDropPosition(event, layout));
              onReorder(reorderItemsByInsertionIndex(files, draggedIndex, insertionIndex));
              setDraggedIndex(null);
              setDropInsertionIndex(null);
            }}
          >
            {dropInsertionIndex !== null &&
            draggedIndex !== null &&
            draggedIndex !== fileIndex &&
            (dropInsertionIndex === fileIndex || (fileIndex === files.length - 1 && dropInsertionIndex === fileIndex + 1)) ? (
              <DropIndicator position={dropInsertionIndex === fileIndex ? "before" : "after"} layout={layout} />
            ) : null}
            <MediaFileCard
              file={file}
              index={fileIndex}
              multiple
              isRepresentative={representativeOffset + fileIndex === 0}
              isDragging={draggedIndex === fileIndex}
              previewBehavior={previewBehavior}
              cardVariant={cardVariant}
              onRemove={() => onRemove(fileIndex)}
              onMakeRepresentative={allowRepresentative ? () => onMakeRepresentative(fileIndex) : undefined}
              onPreview={onPreview}
              onDragStart={() => setDraggedIndex(fileIndex)}
              onDragEnd={() => {
                setDraggedIndex(null);
                setDropInsertionIndex(null);
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

function SortableMergedMediaList({
  items,
  previewBehavior,
  cardVariant = "default",
  layout = "stack",
  onRemove,
  onMakeRepresentative,
  onReorder,
  onPreview,
}: {
  items: MergedMediaEntry[];
  previewBehavior?: "contain" | "natural-center";
  cardVariant?: MediaCardVariant;
  layout?: MediaListLayout;
  onRemove: (token: string) => void;
  onMakeRepresentative: (token: string) => void;
  onReorder: (items: MergedMediaEntry[]) => void;
  onPreview?: (preview: MediaUploaderPreviewPayload) => void;
}) {
  const [draggedToken, setDraggedToken] = React.useState<string | null>(null);
  const [dropInsertionIndex, setDropInsertionIndex] = React.useState<number | null>(null);
  const existingPreviewItems = React.useMemo(
    () =>
      items.reduce<MediaUploaderPreviewItem[]>((accumulator, item) => {
        if (item.kind !== "existing" || !item.item.url) return accumulator;

        accumulator.push({
          url: item.item.url,
          title: item.item.name,
          isImage: item.item.isImage !== false,
        });

        return accumulator;
      }, []),
    [items],
  );
  const previewIndexByToken = React.useMemo(() => {
    const map = new Map<string, number>();
    let nextIndex = 0;

    items.forEach((item) => {
      if (item.kind !== "existing" || !item.item.url) return;
      map.set(item.token, nextIndex);
      nextIndex += 1;
    });

    return map;
  }, [items]);
  useWindowAutoScrollWhileDragging(layout !== "horizontal" && draggedToken !== null);

  const draggedIndex = draggedToken ? items.findIndex((entry) => entry.token === draggedToken) : -1;

  return (
    <div
      className={getMediaListClassName(layout)}
      onDragOver={(event) => {
        if (!draggedToken) return;
        event.preventDefault();
        if (layout !== "horizontal") {
          autoScrollDuringDrag(event);
        }
      }}
    >
      {items.map((item, itemIndex) => {
        const isRepresentative = itemIndex === 0;

        return (
          <div
            key={item.token}
            className={getMediaListItemClassName(layout, itemIndex, items.length)}
            onDragOver={(event) => {
              if (!draggedToken) return;
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
              if (layout !== "horizontal") {
                autoScrollDuringDrag(event);
              }
              const insertionIndex = resolveInsertionIndex(
                itemIndex,
                resolveDropPositionWithBias(event, itemIndex, items.length, layout),
              );
              setDropInsertionIndex((current) =>
                current === insertionIndex ? current : insertionIndex,
              );
            }}
            onDrop={(event) => {
              if (!draggedToken || draggedToken === item.token) return;
              event.preventDefault();
              const dropIndex = items.findIndex((entry) => entry.token === item.token);
              if (draggedIndex < 0 || dropIndex < 0) {
                setDraggedToken(null);
                setDropInsertionIndex(null);
                return;
              }

              const insertionIndex = dropInsertionIndex ?? resolveInsertionIndex(dropIndex, resolveDropPosition(event, layout));
              onReorder(reorderItemsByInsertionIndex(items, draggedIndex, insertionIndex));
              setDraggedToken(null);
              setDropInsertionIndex(null);
            }}
          >
            {dropInsertionIndex !== null &&
            draggedToken !== null &&
            draggedToken !== item.token &&
            (dropInsertionIndex === itemIndex || (itemIndex === items.length - 1 && dropInsertionIndex === itemIndex + 1)) ? (
              <DropIndicator position={dropInsertionIndex === itemIndex ? "before" : "after"} layout={layout} />
            ) : null}
            {item.kind === "existing" ? (
              <ExistingMediaCard
                item={item.item}
                index={itemIndex}
                multiple
                isRepresentative={isRepresentative}
                isDragging={draggedToken === item.token}
                previewBehavior={previewBehavior}
                cardVariant={cardVariant}
                onRemove={() => onRemove(item.token)}
                onMakeRepresentative={() => onMakeRepresentative(item.token)}
                onPreview={
                  onPreview
                    ? (preview) =>
                        onPreview({
                          ...preview,
                          items: existingPreviewItems,
                          index: previewIndexByToken.get(item.token) ?? 0,
                        })
                    : undefined
                }
                onDragStart={() => setDraggedToken(item.token)}
                onDragEnd={() => {
                  setDraggedToken(null);
                  setDropInsertionIndex(null);
                }}
              />
            ) : (
              <MediaFileCard
                file={item.file}
                index={itemIndex}
                multiple
                isRepresentative={isRepresentative}
                isDragging={draggedToken === item.token}
                previewBehavior={previewBehavior}
                cardVariant={cardVariant}
                onRemove={() => onRemove(item.token)}
                onMakeRepresentative={() => onMakeRepresentative(item.token)}
                onPreview={onPreview}
                onDragStart={() => setDraggedToken(item.token)}
                onDragEnd={() => {
                  setDraggedToken(null);
                  setDropInsertionIndex(null);
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function MediaUploader<T extends string = string>({
  title = "파일 업로드",
  embedded = false,
  layout = "stack",
  collections,
  filesByCollection,
  existingItemsByCollection,
  orderByCollection,
  errors,
  onChange,
  onExistingItemsChange,
  onOrderChange,
  onPreview,
  onBeforeAddFiles,
}: MediaUploaderProps<T>) {
  const getFileId = useStableFileId();

  const setFiles = React.useCallback(
    (key: T, files: File[]) => {
      onChange(key, files);
    },
    [onChange],
  );

  const setExistingItems = React.useCallback(
    (key: T, items: ExistingMediaItem[]) => {
      onExistingItemsChange?.(key, items);
    },
    [onExistingItemsChange],
  );

  const addFiles = React.useCallback(
    async (collection: MediaCollectionConfig<T>, incoming: File[]) => {
      const validatedIncomingFiles = onBeforeAddFiles
        ? await onBeforeAddFiles(collection.key, incoming)
        : incoming;

      if (validatedIncomingFiles.length === 0) {
        return;
      }

      if (!(collection.multiple ?? false)) {
        setFiles(collection.key, validatedIncomingFiles[0] ? [validatedIncomingFiles[0]] : []);
        return;
      }

      const maxCollectionFiles = collection.maxFiles ?? 12;
      const currentFiles = filesByCollection[collection.key] ?? [];
      const currentExistingItems = existingItemsByCollection?.[collection.key] ?? [];
      const remainingSlots = Math.max(maxCollectionFiles - currentFiles.length - currentExistingItems.length, 0);
      const acceptedIncomingFiles = validatedIncomingFiles.slice(0, remainingSlots);

      if (remainingSlots === 0) {
        return;
      }

      const nextFiles = [...currentFiles, ...acceptedIncomingFiles];
      setFiles(collection.key, nextFiles);

      if (onOrderChange && onExistingItemsChange) {
        const defaultOrder = [
          ...currentExistingItems.map((item) => buildExistingMediaToken(item)),
          ...currentFiles.map((file) => buildNewMediaToken(getFileId(file))),
        ];
        const currentOrder = normalizeMediaOrder(orderByCollection?.[collection.key], defaultOrder);
        const nextOrder = [
          ...currentOrder,
          ...acceptedIncomingFiles.map((file) => buildNewMediaToken(getFileId(file))),
        ];

        onOrderChange(
          collection.key,
          normalizeMediaOrder(nextOrder, [
            ...currentExistingItems.map((item) => buildExistingMediaToken(item)),
            ...nextFiles.map((file) => buildNewMediaToken(getFileId(file))),
          ]),
        );
      }
    },
    [existingItemsByCollection, filesByCollection, getFileId, onBeforeAddFiles, onExistingItemsChange, onOrderChange, orderByCollection, setFiles],
  );

  const content = collections.map((collection, index) => {
          const files = filesByCollection[collection.key] ?? [];
          const existingItems = existingItemsByCollection?.[collection.key] ?? [];
          const error = errors?.[collection.key];
          const isMultiple = collection.multiple ?? false;
          const maxFiles = collection.maxFiles ?? (isMultiple ? 12 : 1);
          const totalItemCount = files.length + existingItems.length;
          const canAddMore = !isMultiple || totalItemCount < maxFiles;
          const hasSelectedFiles = files.length > 0;
          const hasExistingItems = existingItems.length > 0;
          const canEditExistingItems = Boolean(onExistingItemsChange);
          const canUseMergedOrdering = isMultiple && canEditExistingItems && Boolean(onOrderChange);
          const shouldShowLabel = collection.showLabel ?? true;
          const existingTokenMap = new Map(existingItems.map((item) => [buildExistingMediaToken(item), item]));
          const newTokenMap = new Map(files.map((file) => [buildNewMediaToken(getFileId(file)), file]));
          const defaultMergedOrder = [
            ...existingItems.map((item) => buildExistingMediaToken(item)),
            ...files.map((file) => buildNewMediaToken(getFileId(file))),
          ];
          const mergedOrder = canUseMergedOrdering
            ? normalizeMediaOrder(orderByCollection?.[collection.key], defaultMergedOrder)
            : defaultMergedOrder;
          const mergedItems: MergedMediaEntry[] = canUseMergedOrdering
            ? mergedOrder.reduce<MergedMediaEntry[]>((accumulator, token) => {
                const existingItem = existingTokenMap.get(token);
                if (existingItem) {
                  accumulator.push({ token, kind: "existing", item: existingItem });
                  return accumulator;
                }

                const newFile = newTokenMap.get(token);
                if (newFile) {
                  accumulator.push({ token, kind: "new", file: newFile });
                }

                return accumulator;
              }, [])
            : [];
          const handlePreview = onPreview
            ? (preview: MediaUploaderPreviewPayload) => {
                onPreview(collection.key, preview);
              }
            : undefined;

          const applyMergedOrder = (nextTokens: string[]) => {
            if (!canUseMergedOrdering || !onOrderChange) {
              return;
            }

            const nextExistingItems = nextTokens
              .map((token) => existingTokenMap.get(token))
              .filter((item): item is ExistingMediaItem => Boolean(item));
            const nextFiles = nextTokens
              .map((token) => newTokenMap.get(token))
              .filter((file): file is File => Boolean(file));

            const nextDefaultOrder = [
              ...nextExistingItems.map((item) => buildExistingMediaToken(item)),
              ...nextFiles.map((file) => buildNewMediaToken(getFileId(file))),
            ];
            const normalizedNextOrder = normalizeMediaOrder(nextTokens, nextDefaultOrder);

            setExistingItems(collection.key, nextExistingItems);
            setFiles(collection.key, nextFiles);
            onOrderChange(collection.key, normalizedNextOrder);
          };

    return (
      <section
        key={String(collection.key)}
        data-media-collection={String(collection.key)}
        tabIndex={-1}
        className={`space-y-4 ${index === 0 ? "" : "mt-8 border-t border-gray-200 pt-8 "}`}
      >
        {shouldShowLabel ? (
          <div className="space-y-1.5">
            <h4 className={`text-sm font-semibold ${error ? "text-error-600 " : "text-gray-800 "}`}>
              {collection.label}
            </h4>
          </div>
        ) : null}

              {collection.hideDropzone ? (
                <HiddenFileInput
                  accept={collection.accept}
                  multiple={isMultiple}
                  disabled={!canAddMore}
                  onPickFiles={(incoming) => {
                    void addFiles(collection, incoming);
                  }}
                />
              ) : (
                <Dropzone
                  accept={collection.accept}
                  multiple={isMultiple}
                  disabled={!canAddMore}
                  error={Boolean(error)}
                  variant={collection.dropzoneVariant}
                  primaryText={
                    collection.dropzoneVariant === "button"
                      ? collection.label
                      : files.length > 0 && !isMultiple
                        ? "파일 교체"
                        : undefined
                  }
                  secondaryText={
                    files.length > 0
                      ? isMultiple
                        ? canAddMore
                          ? "기존 파일은 유지되고 새 파일이 추가됩니다."
                          : collection.maxFilesText ?? `최대 ${maxFiles}장까지 업로드했습니다.`
                          : "새 파일을 선택하면 기존 파일을 대체합니다."
                      : hasExistingItems
                        ? isMultiple
                          ? "기존 파일을 유지하거나 삭제하고 새 파일을 추가할 수 있습니다."
                          : "새 파일을 선택하면 기존 파일을 대체합니다."
                        : collection.emptyText
                  }
                  footerText={
                    collection.dropzoneVariant === "button"
                      ? undefined
                      : [collection.helperText, isMultiple ? collection.maxFilesText ?? `최대 ${maxFiles}장까지 업로드할 수 있습니다.` : null]
                          .filter(Boolean)
                          .join(" · ")
                  }
                  onPickFiles={(incoming) => {
                    void addFiles(collection, incoming);
                  }}
                />
              )}

              {isMultiple ? (
                <>
                  {canUseMergedOrdering && totalItemCount > 0 ? (
                    <SortableMergedMediaList
                      items={mergedItems}
                      previewBehavior={collection.previewBehavior}
                      cardVariant={collection.cardVariant}
                      layout={layout}
                      onPreview={handlePreview}
                      onRemove={(token) => {
                        applyMergedOrder(mergedOrder.filter((currentToken) => currentToken !== token));
                      }}
                      onMakeRepresentative={(token) => {
                        if (mergedOrder[0] === token) return;

                        applyMergedOrder([token, ...mergedOrder.filter((currentToken) => currentToken !== token)]);
                      }}
                      onReorder={(nextItems) => applyMergedOrder(nextItems.map((item) => item.token))}
                    />
                  ) : hasExistingItems ? (
                    canEditExistingItems ? (
                      <SortableExistingMediaList
                        items={existingItems}
                        previewBehavior={collection.previewBehavior}
                        cardVariant={collection.cardVariant}
                        layout={layout}
                        onPreview={handlePreview}
                        onRemove={(itemIndex) =>
                          setExistingItems(
                            collection.key,
                            existingItems.filter((_, currentIndex) => currentIndex !== itemIndex),
                          )
                        }
                        onMakeRepresentative={(itemIndex) => {
                          if (itemIndex === 0) return;

                          const nextItems = [existingItems[itemIndex], ...existingItems.filter((_, currentIndex) => currentIndex !== itemIndex)];
                          setExistingItems(collection.key, nextItems);
                        }}
                        onReorder={(nextItems) => setExistingItems(collection.key, nextItems)}
                      />
                    ) : (
                      <ExistingMediaList
                        items={existingItems}
                        multiple
                        previewBehavior={collection.previewBehavior}
                        cardVariant={collection.cardVariant}
                        layout={layout}
                        onPreview={handlePreview}
                      />
                    )
                  ) : null}

                  {!canUseMergedOrdering && hasSelectedFiles ? (
                    <SortableMediaFileList
                      files={files}
                      getFileId={getFileId}
                      previewBehavior={collection.previewBehavior}
                      cardVariant={collection.cardVariant}
                      layout={layout}
                      representativeOffset={existingItems.length}
                      allowRepresentative={existingItems.length === 0}
                      onPreview={handlePreview}
                      onRemove={(fileIndex) => setFiles(collection.key, files.filter((_, currentIndex) => currentIndex !== fileIndex))}
                      onMakeRepresentative={(fileIndex) => {
                        if (fileIndex === 0) return;

                        const nextFiles = [files[fileIndex], ...files.filter((_, currentIndex) => currentIndex !== fileIndex)];
                        setFiles(collection.key, nextFiles);
                      }}
                      onReorder={(nextFiles) => setFiles(collection.key, nextFiles)}
                    />
                  ) : null}
                </>
              ) : hasSelectedFiles ? (
                <div className="pt-2">
                  <MediaFileCard
                    file={files[0]}
                    index={0}
                    multiple={false}
                    isRepresentative={false}
                    previewBehavior={collection.previewBehavior}
                    cardVariant={collection.cardVariant}
                    onPreview={handlePreview}
                    onRemove={() => setFiles(collection.key, [])}
                  />
                </div>
              ) : hasExistingItems ? (
                canEditExistingItems ? (
                  <div className="pt-2">
                    <ExistingMediaCard
                      item={existingItems[0]}
                      index={0}
                      multiple={false}
                      isRepresentative={false}
                      previewBehavior={collection.previewBehavior}
                      cardVariant={collection.cardVariant}
                      onPreview={handlePreview}
                      onRemove={() => setExistingItems(collection.key, [])}
                    />
                  </div>
                ) : (
                  <ExistingMediaList
                    items={existingItems}
                    multiple={false}
                    previewBehavior={collection.previewBehavior}
                    cardVariant={collection.cardVariant}
                    onPreview={handlePreview}
                  />
                )
              ) : null}

        {error ? (
          <p className="text-xs text-error-500">{error}</p>
        ) : null}
      </section>
    );
  });

  if (embedded) {
    return <div className="space-y-0">{content}</div>;
  }

  return (
    <Card as="aside">
      <CardHeader className="p-0 pb-5">
        <CardTitle>{title}</CardTitle>
        <CardDescription>이미지 항목별로 파일을 업로드해 주세요.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-0 p-0">{content}</CardContent>
    </Card>
  );
}

export default MediaUploader;
