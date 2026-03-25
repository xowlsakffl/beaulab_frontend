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
  accept: string;
  multiple?: boolean;
  maxFiles?: number;
  emptyText: string;
  helperText: string;
  maxFilesText?: string;
  previewBehavior?: "contain" | "natural-center";
};

export type ExistingMediaItem = {
  id: string | number;
  url: string;
  name: string;
  size?: number | null;
  isImage?: boolean;
  isRepresentative?: boolean;
};

type MediaUploaderProps<T extends string = string> = {
  title?: string;
  embedded?: boolean;
  collections: readonly MediaCollectionConfig<T>[];
  filesByCollection: Partial<Record<T, File[]>>;
  existingItemsByCollection?: Partial<Record<T, ExistingMediaItem[]>>;
  orderByCollection?: Partial<Record<T, string[]>>;
  errors?: Partial<Record<T, string>>;
  onChange: (key: T, files: File[]) => void;
  onExistingItemsChange?: (key: T, items: ExistingMediaItem[]) => void;
  onOrderChange?: (key: T, order: string[]) => void;
};

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

function resolveDropPosition(event: React.DragEvent<HTMLElement>): DropPosition {
  const rect = event.currentTarget.getBoundingClientRect();
  return event.clientY - rect.top < rect.height / 2 ? "before" : "after";
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

function DropIndicator({ position }: { position: DropPosition }) {
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

  const threshold = 96;
  const maxStep = 26;
  const scrollContainer = getScrollContainer(event.currentTarget);

  if (scrollContainer === window) {
    const topDistance = event.clientY;
    const bottomDistance = window.innerHeight - event.clientY;

    if (topDistance < threshold) {
      const velocity = Math.ceil(((threshold - topDistance) / threshold) * maxStep);
      window.scrollBy(0, -velocity);
      return;
    }

    if (bottomDistance < threshold) {
      const velocity = Math.ceil(((threshold - bottomDistance) / threshold) * maxStep);
      window.scrollBy(0, velocity);
    }

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

function createDragPreview(sourceNode: HTMLElement) {
  if (typeof document === "undefined") {
    return null;
  }

  clearDragPreview();

  const clonedNode = sourceNode.cloneNode(true) as HTMLDivElement;
  const rect = sourceNode.getBoundingClientRect();

  clonedNode.style.position = "fixed";
  clonedNode.style.top = "-10000px";
  clonedNode.style.left = "-10000px";
  clonedNode.style.width = `${rect.width}px`;
  clonedNode.style.height = `${rect.height}px`;
  clonedNode.style.pointerEvents = "none";
  clonedNode.style.opacity = "0.68";
  clonedNode.style.transform = "scale(0.985)";
  clonedNode.style.boxShadow = "0 20px 45px rgba(15, 23, 42, 0.18)";
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

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);

    updatePreference();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", updatePreference);
      return () => mediaQuery.removeEventListener("change", updatePreference);
    }

    mediaQuery.addListener(updatePreference);
    return () => mediaQuery.removeListener(updatePreference);
  }, []);

  return prefersReducedMotion;
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

function useImageDimensions(url: string | null) {
  const [dimensions, setDimensions] = React.useState<{ width: number; height: number } | null>(null);

  React.useEffect(() => {
    if (!url) {
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
  }, [url]);

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
  const dimensions = useImageDimensions(url);

  if (dimensions) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-900">
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
    <div className="relative h-full w-full rounded-xl bg-gray-50 dark:bg-gray-900">
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
      <div className="flex h-full items-center justify-center rounded-xl bg-gray-50 text-gray-500 dark:bg-gray-900 dark:text-gray-400">
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
  primaryText = "파일 드래그 또는 클릭",
  secondaryText,
  footerText,
  onPickFiles,
}: {
  accept: string;
  multiple: boolean;
  disabled: boolean;
  error?: boolean;
  primaryText?: string;
  secondaryText?: string;
  footerText?: string;
  onPickFiles: (files: File[]) => void;
}) {
  const [isDragOver, setIsDragOver] = React.useState(false);

  return (
    <label
      className={[
        "relative grid place-items-center rounded-2xl border border-dashed transition-all select-none",
        "min-h-[240px] p-6",
        disabled ? "pointer-events-none opacity-60" : "cursor-pointer",
        error
          ? "border-error-500 bg-error-50/40 dark:bg-error-500/5"
          : isDragOver
            ? "border-gray-400 bg-gray-100/80 dark:border-gray-500 dark:bg-gray-900/60"
            : "border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/40",
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

      {isDragOver ? (
        <div className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-brand-500">
          <div className="absolute inset-0 rounded-2xl bg-white/30 backdrop-blur-[2px] dark:bg-black/20" />
        </div>
      ) : null}

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
        <div className="flex flex-col items-center justify-center gap-3 text-center">
          <div className="grid size-12 place-items-center rounded-xl bg-black/5 dark:bg-white/10">
            <UploadCloud className="size-5 text-gray-700 dark:text-gray-200" />
          </div>

          <div className="mx-auto w-full max-w-[220px] space-y-1 text-center">
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{primaryText}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {secondaryText ?? (multiple ? "여러 파일 업로드 가능" : "1개 파일만 업로드 가능")}
            </div>
          </div>
        </div>
      </div>

      {footerText ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 px-6 pb-5">
          <p className="text-center text-xs text-gray-500 dark:text-gray-400">{footerText}</p>
        </div>
      ) : null}
    </label>
  );
}

type MediaFileCardProps = {
  file: File;
  index: number;
  multiple: boolean;
  isRepresentative: boolean;
  isDragging?: boolean;
  previewBehavior?: "contain" | "natural-center";
  onRemove: () => void;
  onMakeRepresentative?: () => void;
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
    onRemove,
    onMakeRepresentative,
    onDragStart,
    onDragEnd,
  },
  ref,
) {
  if (!multiple && previewBehavior === "natural-center") {
    return (
      <div
        ref={ref}
        className={`flex w-full max-w-[500px] items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-[box-shadow,opacity,filter,transform] duration-200 lg:max-w-none dark:border-gray-800 dark:bg-gray-900 ${
          isDragging ? "scale-[0.985] opacity-45 shadow-lg saturate-75" : ""
        }`}
      >
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl">
          <MediaPreview file={file} previewBehavior={previewBehavior} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{file.name}</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{formatBytes(file.size)}</p>
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
      className={`overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-[box-shadow,opacity,filter,transform] duration-200 dark:border-gray-800 dark:bg-gray-900 ${
        ""
      } w-full max-w-[500px] lg:max-w-none ${isDragging ? "scale-[0.985] opacity-45 shadow-lg saturate-75" : ""}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-50 dark:bg-gray-900">
        {multiple ? (
          <div
            draggable
            onDragStart={(event) => {
              event.dataTransfer.effectAllowed = "move";
              const sourceCard = event.currentTarget.closest("[data-media-card]") as HTMLElement | null;
              const dragPreview = sourceCard ? createDragPreview(sourceCard) : null;
              if (dragPreview) {
                event.dataTransfer.setDragImage(dragPreview, event.currentTarget.clientWidth / 2, event.currentTarget.clientHeight / 2);
              }
              onDragStart?.();
            }}
            onDragEnd={() => {
              clearDragPreview();
              onDragEnd?.();
            }}
            className="absolute left-3 top-3 z-10 inline-flex cursor-grab active:cursor-grabbing items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[11px] font-medium text-gray-500 shadow-sm select-none dark:bg-gray-900/90 dark:text-gray-300"
          >
            <GripVertical className="size-3.5" />
            순서 이동
          </div>
        ) : null}
        {multiple && isRepresentative ? (
          <div className="absolute right-3 top-3 z-10 rounded-full bg-brand-500 px-2.5 py-1 text-[11px] font-semibold text-white">
            대표
          </div>
        ) : null}
        <MediaPreview file={file} previewBehavior={previewBehavior} />
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-gray-200 p-3 dark:border-gray-800">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{file.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{formatBytes(file.size)}</p>
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
  onRemove,
  onMakeRepresentative,
  onDragStart,
  onDragEnd,
}: {
  item: ExistingMediaItem;
  index: number;
  multiple: boolean;
  isRepresentative: boolean;
  isDragging?: boolean;
  previewBehavior?: "contain" | "natural-center";
  onRemove?: () => void;
  onMakeRepresentative?: () => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}) {
  if (!multiple && previewBehavior === "natural-center") {
    return (
      <div className="flex w-full max-w-[500px] items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm lg:max-w-none dark:border-gray-800 dark:bg-gray-900">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl">
          {item.isImage === false ? (
            <div className="flex h-full items-center justify-center rounded-xl bg-gray-50 text-gray-500 dark:bg-gray-900 dark:text-gray-400">
              <ImageIcon className="size-8" />
            </div>
          ) : (
            <MediaImagePreview url={item.url} alt={item.name} previewBehavior={previewBehavior} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{item.name}</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
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
      className={`overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-[box-shadow,opacity,filter,transform] duration-200 dark:border-gray-800 dark:bg-gray-900 ${
        ""
      } w-full max-w-[500px] lg:max-w-none ${isDragging ? "scale-[0.985] opacity-45 shadow-lg saturate-75" : ""}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-50 dark:bg-gray-900">
        {multiple && onDragStart ? (
          <div
            draggable
            onDragStart={(event) => {
              event.dataTransfer.effectAllowed = "move";
              const sourceCard = event.currentTarget.closest("[data-media-card]") as HTMLElement | null;
              const dragPreview = sourceCard ? createDragPreview(sourceCard) : null;
              if (dragPreview) {
                event.dataTransfer.setDragImage(dragPreview, event.currentTarget.clientWidth / 2, event.currentTarget.clientHeight / 2);
              }
              onDragStart();
            }}
            onDragEnd={() => {
              clearDragPreview();
              onDragEnd?.();
            }}
            className="absolute left-3 top-3 z-10 inline-flex cursor-grab active:cursor-grabbing items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[11px] font-medium text-gray-500 shadow-sm select-none dark:bg-gray-900/90 dark:text-gray-300"
          >
            <GripVertical className="size-3.5" />
            순서 이동
          </div>
        ) : null}
        {multiple && isRepresentative ? (
          <div className="absolute right-3 top-3 z-10 rounded-full bg-brand-500 px-2.5 py-1 text-[11px] font-semibold text-white">
            대표
          </div>
        ) : null}
        {item.isImage === false ? (
          <div className="flex h-full items-center justify-center text-gray-500 dark:text-gray-400">
            <ImageIcon className="size-10" />
          </div>
        ) : (
          <MediaImagePreview url={item.url} alt={item.name} previewBehavior={previewBehavior} />
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-gray-200 p-3 dark:border-gray-800">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{item.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
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
    </div>
  );
}

function ExistingMediaList({
  items,
  multiple,
  previewBehavior,
}: {
  items: ExistingMediaItem[];
  multiple: boolean;
  previewBehavior?: "contain" | "natural-center";
}) {
  if (multiple) {
    return (
      <div className="space-y-3 pt-2">
        {items.map((item, index) => (
          <ExistingMediaCard
            key={String(item.id)}
            item={item}
            index={index}
            multiple
            isRepresentative={index === 0}
            previewBehavior={previewBehavior}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="pt-2">
      <ExistingMediaCard item={items[0]} index={0} multiple={false} isRepresentative={false} previewBehavior={previewBehavior} />
    </div>
  );
}

function AnimatedExistingMediaList({
  items,
  prefersReducedMotion,
  previewBehavior,
  onRemove,
  onMakeRepresentative,
  onReorder,
}: {
  items: ExistingMediaItem[];
  prefersReducedMotion: boolean;
  previewBehavior?: "contain" | "natural-center";
  onRemove: (index: number) => void;
  onMakeRepresentative: (index: number) => void;
  onReorder: (items: ExistingMediaItem[]) => void;
}) {
  const itemRefs = React.useRef(new Map<string, HTMLDivElement>());
  const previousRectsRef = React.useRef(new Map<string, DOMRect>());
  const previousSignatureRef = React.useRef<string>("");
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);
  const [dropInsertionIndex, setDropInsertionIndex] = React.useState<number | null>(null);

  const setItemRef = React.useCallback((id: string, node: HTMLDivElement | null) => {
    if (node) {
      itemRefs.current.set(id, node);
      return;
    }

    itemRefs.current.delete(id);
  }, []);

  React.useLayoutEffect(() => {
    const nextRects = new Map<string, DOMRect>();
    const frameIds: number[] = [];
    const timeoutIds: number[] = [];
    const signature = items.map((item) => String(item.id)).join("|");
    const shouldAnimate = previousSignatureRef.current !== "" && previousSignatureRef.current !== signature;

    items.forEach((item) => {
      const itemId = String(item.id);
      const node = itemRefs.current.get(itemId);
      if (node) {
        nextRects.set(itemId, node.getBoundingClientRect());
      }
    });

    if (!prefersReducedMotion && shouldAnimate) {
      nextRects.forEach((nextRect, itemId) => {
        const node = itemRefs.current.get(itemId);
        if (!node) return;

        const previousRect = previousRectsRef.current.get(itemId);
        const deltaX = previousRect ? previousRect.left - nextRect.left : 0;
        const deltaY = previousRect ? previousRect.top - nextRect.top : 0;
        const isNewNode = !previousRect;

        if (!isNewNode && Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) {
          return;
        }

        node.style.transition = "none";
        node.style.willChange = "transform, opacity";
        node.style.transform = isNewNode ? "translateY(14px)" : `translate(${deltaX}px, ${deltaY}px)`;
        if (isNewNode) {
          node.style.opacity = "0";
        }

        const frameId = window.requestAnimationFrame(() => {
          node.style.transition = "transform 460ms cubic-bezier(0.22, 1, 0.36, 1), opacity 320ms ease-out";
          node.style.transform = "";
          node.style.opacity = "";
        });

        frameIds.push(frameId);
        timeoutIds.push(
          window.setTimeout(() => {
            node.style.transition = "";
            node.style.willChange = "";
          }, 480),
        );
      });
    }

    previousRectsRef.current = nextRects;
    previousSignatureRef.current = signature;

    return () => {
      frameIds.forEach((frameId) => window.cancelAnimationFrame(frameId));
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, [items, prefersReducedMotion]);

  return (
    <div className="space-y-3 pt-2">
      {items.map((item, itemIndex) => (
        <div
          key={String(item.id)}
          ref={(node) => setItemRef(String(item.id), node)}
          className="relative"
          onDragOver={(event) => {
            if (draggedIndex === null) return;
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
            autoScrollDuringDrag(event);
            const insertionIndex = resolveInsertionIndex(itemIndex, resolveDropPosition(event));
            setDropInsertionIndex((current) =>
              current === insertionIndex ? current : insertionIndex,
            );
          }}
          onDrop={(event) => {
            if (draggedIndex === null || draggedIndex === itemIndex) return;
            event.preventDefault();
            const insertionIndex = dropInsertionIndex ?? resolveInsertionIndex(itemIndex, resolveDropPosition(event));
            onReorder(reorderItemsByInsertionIndex(items, draggedIndex, insertionIndex));
            setDraggedIndex(null);
            setDropInsertionIndex(null);
          }}
        >
          {dropInsertionIndex === itemIndex && draggedIndex !== null && draggedIndex !== itemIndex ? (
            <DropIndicator position="before" />
          ) : null}
          <ExistingMediaCard
            item={item}
            index={itemIndex}
            multiple
            isRepresentative={itemIndex === 0}
            isDragging={draggedIndex === itemIndex}
            previewBehavior={previewBehavior}
            onRemove={() => onRemove(itemIndex)}
            onMakeRepresentative={() => onMakeRepresentative(itemIndex)}
            onDragStart={() => setDraggedIndex(itemIndex)}
            onDragEnd={() => {
              setDraggedIndex(null);
              setDropInsertionIndex(null);
            }}
          />
          {dropInsertionIndex === items.length && itemIndex === items.length - 1 && draggedIndex !== itemIndex ? (
            <DropIndicator position="after" />
          ) : null}
        </div>
      ))}
    </div>
  );
}

function AnimatedMediaFileList({
  files,
  getFileId,
  prefersReducedMotion,
  previewBehavior,
  representativeOffset = 0,
  allowRepresentative = true,
  onRemove,
  onMakeRepresentative,
  onReorder,
}: {
  files: File[];
  getFileId: (file: File) => string;
  prefersReducedMotion: boolean;
  previewBehavior?: "contain" | "natural-center";
  representativeOffset?: number;
  allowRepresentative?: boolean;
  onRemove: (index: number) => void;
  onMakeRepresentative: (index: number) => void;
  onReorder: (files: File[]) => void;
}) {
  const itemRefs = React.useRef(new Map<string, HTMLDivElement>());
  const previousRectsRef = React.useRef(new Map<string, DOMRect>());
  const previousSignatureRef = React.useRef<string>("");
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);
  const [dropInsertionIndex, setDropInsertionIndex] = React.useState<number | null>(null);

  const setItemRef = React.useCallback((id: string, node: HTMLDivElement | null) => {
    if (node) {
      itemRefs.current.set(id, node);
      return;
    }

    itemRefs.current.delete(id);
  }, []);

  React.useLayoutEffect(() => {
    const nextRects = new Map<string, DOMRect>();
    const frameIds: number[] = [];
    const timeoutIds: number[] = [];
    const signature = files.map((file) => getFileId(file)).join("|");
    const shouldAnimate = previousSignatureRef.current !== "" && previousSignatureRef.current !== signature;

    files.forEach((file) => {
      const fileId = getFileId(file);
      const node = itemRefs.current.get(fileId);
      if (node) {
        nextRects.set(fileId, node.getBoundingClientRect());
      }
    });

    if (!prefersReducedMotion && shouldAnimate) {
      nextRects.forEach((nextRect, fileId) => {
        const node = itemRefs.current.get(fileId);
        if (!node) return;

        const previousRect = previousRectsRef.current.get(fileId);
        const deltaX = previousRect ? previousRect.left - nextRect.left : 0;
        const deltaY = previousRect ? previousRect.top - nextRect.top : 0;
        const isNewNode = !previousRect;

        if (!isNewNode && Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) {
          return;
        }

        node.style.transition = "none";
        node.style.willChange = "transform, opacity";
        node.style.transform = isNewNode ? "translateY(14px)" : `translate(${deltaX}px, ${deltaY}px)`;
        if (isNewNode) {
          node.style.opacity = "0";
        }

        const frameId = window.requestAnimationFrame(() => {
          node.style.transition = "transform 460ms cubic-bezier(0.22, 1, 0.36, 1), opacity 320ms ease-out";
          node.style.transform = "";
          node.style.opacity = "";
        });

        frameIds.push(frameId);
        timeoutIds.push(
          window.setTimeout(() => {
            node.style.transition = "";
            node.style.willChange = "";
          }, 480),
        );
      });
    }

    previousRectsRef.current = nextRects;
    previousSignatureRef.current = signature;

    return () => {
      frameIds.forEach((frameId) => window.cancelAnimationFrame(frameId));
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, [files, getFileId, prefersReducedMotion]);

  return (
    <div className="space-y-3 pt-2">
      {files.map((file, fileIndex) => {
        const fileId = getFileId(file);

        return (
          <div
            key={fileId}
            ref={(node) => setItemRef(fileId, node)}
            className="relative"
            onDragOver={(event) => {
              if (draggedIndex === null) return;
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
              autoScrollDuringDrag(event);
              const insertionIndex = resolveInsertionIndex(fileIndex, resolveDropPosition(event));
              setDropInsertionIndex((current) =>
                current === insertionIndex ? current : insertionIndex,
              );
            }}
            onDrop={(event) => {
              if (draggedIndex === null || draggedIndex === fileIndex) return;
              event.preventDefault();
              const insertionIndex = dropInsertionIndex ?? resolveInsertionIndex(fileIndex, resolveDropPosition(event));
              onReorder(reorderItemsByInsertionIndex(files, draggedIndex, insertionIndex));
              setDraggedIndex(null);
              setDropInsertionIndex(null);
            }}
          >
            {dropInsertionIndex === fileIndex && draggedIndex !== null && draggedIndex !== fileIndex ? (
              <DropIndicator position="before" />
            ) : null}
            <MediaFileCard
              file={file}
              index={fileIndex}
              multiple
              isRepresentative={representativeOffset + fileIndex === 0}
              isDragging={draggedIndex === fileIndex}
              previewBehavior={previewBehavior}
              onRemove={() => onRemove(fileIndex)}
              onMakeRepresentative={allowRepresentative ? () => onMakeRepresentative(fileIndex) : undefined}
              onDragStart={() => setDraggedIndex(fileIndex)}
              onDragEnd={() => {
                setDraggedIndex(null);
                setDropInsertionIndex(null);
              }}
            />
            {dropInsertionIndex === files.length && fileIndex === files.length - 1 && draggedIndex !== fileIndex ? (
              <DropIndicator position="after" />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function AnimatedMergedMediaList({
  items,
  prefersReducedMotion,
  previewBehavior,
  onRemove,
  onMakeRepresentative,
  onReorder,
}: {
  items: MergedMediaEntry[];
  prefersReducedMotion: boolean;
  previewBehavior?: "contain" | "natural-center";
  onRemove: (token: string) => void;
  onMakeRepresentative: (token: string) => void;
  onReorder: (items: MergedMediaEntry[]) => void;
}) {
  const itemRefs = React.useRef(new Map<string, HTMLDivElement>());
  const previousRectsRef = React.useRef(new Map<string, DOMRect>());
  const previousSignatureRef = React.useRef<string>("");
  const [draggedToken, setDraggedToken] = React.useState<string | null>(null);
  const [dropInsertionIndex, setDropInsertionIndex] = React.useState<number | null>(null);

  const setItemRef = React.useCallback((id: string, node: HTMLDivElement | null) => {
    if (node) {
      itemRefs.current.set(id, node);
      return;
    }

    itemRefs.current.delete(id);
  }, []);

  React.useLayoutEffect(() => {
    const nextRects = new Map<string, DOMRect>();
    const frameIds: number[] = [];
    const timeoutIds: number[] = [];
    const signature = items.map((item) => item.token).join("|");
    const shouldAnimate = previousSignatureRef.current !== "" && previousSignatureRef.current !== signature;

    items.forEach((item) => {
      const node = itemRefs.current.get(item.token);
      if (node) {
        nextRects.set(item.token, node.getBoundingClientRect());
      }
    });

    if (!prefersReducedMotion && shouldAnimate) {
      nextRects.forEach((nextRect, token) => {
        const node = itemRefs.current.get(token);
        if (!node) return;

        const previousRect = previousRectsRef.current.get(token);
        const deltaX = previousRect ? previousRect.left - nextRect.left : 0;
        const deltaY = previousRect ? previousRect.top - nextRect.top : 0;
        const isNewNode = !previousRect;

        if (!isNewNode && Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) {
          return;
        }

        node.style.transition = "none";
        node.style.willChange = "transform, opacity";
        node.style.transform = isNewNode ? "translateY(14px)" : `translate(${deltaX}px, ${deltaY}px)`;
        if (isNewNode) {
          node.style.opacity = "0";
        }

        const frameId = window.requestAnimationFrame(() => {
          node.style.transition = "transform 460ms cubic-bezier(0.22, 1, 0.36, 1), opacity 320ms ease-out";
          node.style.transform = "";
          node.style.opacity = "";
        });

        frameIds.push(frameId);
        timeoutIds.push(
          window.setTimeout(() => {
            node.style.transition = "";
            node.style.willChange = "";
          }, 480),
        );
      });
    }

    previousRectsRef.current = nextRects;
    previousSignatureRef.current = signature;

    return () => {
      frameIds.forEach((frameId) => window.cancelAnimationFrame(frameId));
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, [items, prefersReducedMotion]);

  return (
    <div className="space-y-3 pt-2">
      {items.map((item, itemIndex) => {
        const isRepresentative = itemIndex === 0;
        const draggedIndex = draggedToken ? items.findIndex((entry) => entry.token === draggedToken) : -1;

        return (
          <div
            key={item.token}
            ref={(node) => setItemRef(item.token, node)}
            className="relative"
            onDragOver={(event) => {
              if (!draggedToken) return;
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
              autoScrollDuringDrag(event);
              const insertionIndex = resolveInsertionIndex(itemIndex, resolveDropPosition(event));
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

              const insertionIndex = dropInsertionIndex ?? resolveInsertionIndex(dropIndex, resolveDropPosition(event));
              onReorder(reorderItemsByInsertionIndex(items, draggedIndex, insertionIndex));
              setDraggedToken(null);
              setDropInsertionIndex(null);
            }}
          >
            {dropInsertionIndex === itemIndex && draggedToken !== null && draggedToken !== item.token ? (
              <DropIndicator position="before" />
            ) : null}
            {item.kind === "existing" ? (
              <ExistingMediaCard
                item={item.item}
                index={itemIndex}
                multiple
                isRepresentative={isRepresentative}
                isDragging={draggedToken === item.token}
                previewBehavior={previewBehavior}
                onRemove={() => onRemove(item.token)}
                onMakeRepresentative={() => onMakeRepresentative(item.token)}
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
                onRemove={() => onRemove(item.token)}
                onMakeRepresentative={() => onMakeRepresentative(item.token)}
                onDragStart={() => setDraggedToken(item.token)}
                onDragEnd={() => {
                  setDraggedToken(null);
                  setDropInsertionIndex(null);
                }}
              />
            )}
            {dropInsertionIndex === items.length && itemIndex === items.length - 1 && draggedToken !== item.token ? (
              <DropIndicator position="after" />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function MediaUploader<T extends string = string>({
  title = "파일 업로드",
  embedded = false,
  collections,
  filesByCollection,
  existingItemsByCollection,
  orderByCollection,
  errors,
  onChange,
  onExistingItemsChange,
  onOrderChange,
}: MediaUploaderProps<T>) {
  const prefersReducedMotion = usePrefersReducedMotion();
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
    (collection: MediaCollectionConfig<T>, incoming: File[]) => {
      if (!(collection.multiple ?? false)) {
        setFiles(collection.key, incoming[0] ? [incoming[0]] : []);
        return;
      }

      const maxCollectionFiles = collection.maxFiles ?? 12;
      const currentFiles = filesByCollection[collection.key] ?? [];
      const currentExistingItems = existingItemsByCollection?.[collection.key] ?? [];
      const remainingSlots = Math.max(maxCollectionFiles - currentFiles.length - currentExistingItems.length, 0);
      const acceptedIncomingFiles = incoming.slice(0, remainingSlots);

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
    [existingItemsByCollection, filesByCollection, getFileId, onExistingItemsChange, onOrderChange, orderByCollection, setFiles],
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
        className={`space-y-4 ${index === 0 ? "" : "mt-8 border-t border-gray-200 pt-8 dark:border-gray-800"}`}
      >
        {shouldShowLabel ? (
          <div className="space-y-1.5">
            <h4 className={`text-sm font-semibold ${error ? "text-error-600 dark:text-error-400" : "text-gray-800 dark:text-white/90"}`}>
              {collection.label}
            </h4>
          </div>
        ) : null}

              <Dropzone
                accept={collection.accept}
                multiple={isMultiple}
                disabled={!canAddMore}
                error={Boolean(error)}
                primaryText={files.length > 0 && !isMultiple ? "파일 교체" : undefined}
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
                  [collection.helperText, isMultiple ? collection.maxFilesText ?? `최대 ${maxFiles}장까지 업로드할 수 있습니다.` : null]
                    .filter(Boolean)
                    .join(" · ")
                }
                onPickFiles={(incoming) => addFiles(collection, incoming)}
              />

              {isMultiple ? (
                <>
                  {canUseMergedOrdering && totalItemCount > 0 ? (
                    <AnimatedMergedMediaList
                      items={mergedItems}
                      prefersReducedMotion={prefersReducedMotion}
                      previewBehavior={collection.previewBehavior}
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
                      <AnimatedExistingMediaList
                        items={existingItems}
                        prefersReducedMotion={prefersReducedMotion}
                        previewBehavior={collection.previewBehavior}
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
                      />
                    )
                  ) : null}

                  {!canUseMergedOrdering && hasSelectedFiles ? (
                    <AnimatedMediaFileList
                      files={files}
                      getFileId={getFileId}
                      prefersReducedMotion={prefersReducedMotion}
                      previewBehavior={collection.previewBehavior}
                      representativeOffset={existingItems.length}
                      allowRepresentative={existingItems.length === 0}
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
                      onRemove={() => setExistingItems(collection.key, [])}
                    />
                  </div>
                ) : (
                  <ExistingMediaList
                    items={existingItems}
                    multiple={false}
                    previewBehavior={collection.previewBehavior}
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
