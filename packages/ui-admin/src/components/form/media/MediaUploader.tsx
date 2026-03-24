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
  errors?: Partial<Record<T, string>>;
  onChange: (key: T, files: File[]) => void;
  onExistingItemsChange?: (key: T, items: ExistingMediaItem[]) => void;
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
  const dimensions = useImageDimensions(previewBehavior === "natural-center" ? url : null);

  if (previewBehavior === "natural-center" && dimensions) {
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
  const dimensions = useImageDimensions(previewBehavior === "natural-center" ? url : null);

  if (!url) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl bg-gray-50 text-gray-500 dark:bg-gray-900 dark:text-gray-400">
        <ImageIcon className="size-10" />
      </div>
    );
  }

  if (previewBehavior === "natural-center" && dimensions) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-900">
        <Image
          src={url}
          alt={file.name}
          width={dimensions.width}
          height={dimensions.height}
          unoptimized
          className="h-auto w-auto max-h-full max-w-full object-contain"
        />
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
  onDragStart?: (index: number) => void;
  onDrop?: (index: number) => void;
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
    onDrop,
    onDragEnd,
  },
  ref,
) {
  if (!multiple && previewBehavior === "natural-center") {
    return (
      <div
        ref={ref}
        className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-[box-shadow,opacity,filter] duration-200 dark:border-gray-800 dark:bg-gray-900"
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
      draggable={multiple}
      onDragStart={(event) => {
        if (!multiple) return;
        event.dataTransfer.effectAllowed = "move";
        onDragStart?.(index);
      }}
      onDragOver={(event) => {
        if (!multiple) return;
        event.preventDefault();
      }}
      onDrop={(event) => {
        if (!multiple) return;
        event.preventDefault();
        onDrop?.(index);
      }}
      onDragEnd={onDragEnd}
      className={`overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-[box-shadow,opacity,filter] duration-200 dark:border-gray-800 dark:bg-gray-900 ${
        multiple ? "cursor-pointer" : ""
      } ${isDragging ? "opacity-70 shadow-lg saturate-75" : ""}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-50 dark:bg-gray-900">
        {multiple ? (
          <div className="absolute left-3 top-3 z-10 inline-flex cursor-pointer items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[11px] font-medium text-gray-500 shadow-sm dark:bg-gray-900/90 dark:text-gray-300">
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
  onDrop,
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
  onDragStart?: (index: number) => void;
  onDrop?: (index: number) => void;
  onDragEnd?: () => void;
}) {
  if (!multiple && previewBehavior === "natural-center") {
    return (
      <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
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
      draggable={multiple && Boolean(onDragStart)}
      onDragStart={(event) => {
        if (!multiple || !onDragStart) return;
        event.dataTransfer.effectAllowed = "move";
        onDragStart(index);
      }}
      onDragOver={(event) => {
        if (!multiple || !onDrop) return;
        event.preventDefault();
      }}
      onDrop={(event) => {
        if (!multiple || !onDrop) return;
        event.preventDefault();
        onDrop(index);
      }}
      onDragEnd={onDragEnd}
      className={`overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-[box-shadow,opacity,filter] duration-200 dark:border-gray-800 dark:bg-gray-900 ${
        multiple && onDragStart ? "cursor-pointer" : ""
      } ${isDragging ? "opacity-70 shadow-lg saturate-75" : ""}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-50 dark:bg-gray-900">
        {multiple && onDragStart ? (
          <div className="absolute left-3 top-3 z-10 inline-flex cursor-pointer items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[11px] font-medium text-gray-500 shadow-sm dark:bg-gray-900/90 dark:text-gray-300">
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
  draggedIndex,
  prefersReducedMotion,
  previewBehavior,
  onRemove,
  onMakeRepresentative,
  onDragStart,
  onDrop,
  onDragEnd,
}: {
  items: ExistingMediaItem[];
  draggedIndex?: number;
  prefersReducedMotion: boolean;
  previewBehavior?: "contain" | "natural-center";
  onRemove: (index: number) => void;
  onMakeRepresentative: (index: number) => void;
  onDragStart: (index: number) => void;
  onDrop: (index: number) => void;
  onDragEnd: () => void;
}) {
  const itemRefs = React.useRef(new Map<string, HTMLDivElement>());
  const previousRectsRef = React.useRef(new Map<string, DOMRect>());

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

    items.forEach((item) => {
      const itemId = String(item.id);
      const node = itemRefs.current.get(itemId);
      if (node) {
        nextRects.set(itemId, node.getBoundingClientRect());
      }
    });

    if (!prefersReducedMotion) {
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
          node.style.transition = "transform 320ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms ease-out";
          node.style.transform = "";
          node.style.opacity = "";
        });

        frameIds.push(frameId);
        timeoutIds.push(
          window.setTimeout(() => {
            node.style.transition = "";
            node.style.willChange = "";
          }, 340),
        );
      });
    }

    previousRectsRef.current = nextRects;

    return () => {
      frameIds.forEach((frameId) => window.cancelAnimationFrame(frameId));
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, [items, prefersReducedMotion]);

  return (
    <div className="space-y-3 pt-2">
      {items.map((item, itemIndex) => (
        <div key={String(item.id)} ref={(node) => setItemRef(String(item.id), node)}>
          <ExistingMediaCard
            item={item}
            index={itemIndex}
            multiple
            isRepresentative={itemIndex === 0}
            isDragging={draggedIndex === itemIndex}
            previewBehavior={previewBehavior}
            onRemove={() => onRemove(itemIndex)}
            onMakeRepresentative={() => onMakeRepresentative(itemIndex)}
            onDragStart={onDragStart}
            onDrop={onDrop}
            onDragEnd={onDragEnd}
          />
        </div>
      ))}
    </div>
  );
}

function AnimatedMediaFileList({
  files,
  draggedIndex,
  getFileId,
  prefersReducedMotion,
  previewBehavior,
  onRemove,
  onMakeRepresentative,
  onDragStart,
  onDrop,
  onDragEnd,
}: {
  files: File[];
  draggedIndex?: number;
  getFileId: (file: File) => string;
  prefersReducedMotion: boolean;
  previewBehavior?: "contain" | "natural-center";
  onRemove: (index: number) => void;
  onMakeRepresentative: (index: number) => void;
  onDragStart: (index: number) => void;
  onDrop: (index: number) => void;
  onDragEnd: () => void;
}) {
  const itemRefs = React.useRef(new Map<string, HTMLDivElement>());
  const previousRectsRef = React.useRef(new Map<string, DOMRect>());

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

    files.forEach((file) => {
      const fileId = getFileId(file);
      const node = itemRefs.current.get(fileId);
      if (node) {
        nextRects.set(fileId, node.getBoundingClientRect());
      }
    });

    if (!prefersReducedMotion) {
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
          node.style.transition = "transform 320ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms ease-out";
          node.style.transform = "";
          node.style.opacity = "";
        });

        frameIds.push(frameId);
        timeoutIds.push(
          window.setTimeout(() => {
            node.style.transition = "";
            node.style.willChange = "";
          }, 340),
        );
      });
    }

    previousRectsRef.current = nextRects;

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
          <MediaFileCard
            key={fileId}
            ref={(node) => setItemRef(fileId, node)}
            file={file}
            index={fileIndex}
            multiple
            isRepresentative={fileIndex === 0}
            isDragging={draggedIndex === fileIndex}
            previewBehavior={previewBehavior}
            onRemove={() => onRemove(fileIndex)}
            onMakeRepresentative={() => onMakeRepresentative(fileIndex)}
            onDragStart={onDragStart}
            onDrop={onDrop}
            onDragEnd={onDragEnd}
          />
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
  errors,
  onChange,
  onExistingItemsChange,
}: MediaUploaderProps<T>) {
  const [draggedIndexByCollection, setDraggedIndexByCollection] = React.useState<Partial<Record<T, number>>>({});
  const [draggedExistingIndexByCollection, setDraggedExistingIndexByCollection] = React.useState<Partial<Record<T, number>>>({});
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
      setFiles(collection.key, [...currentFiles, ...incoming].slice(0, maxCollectionFiles));
    },
    [filesByCollection, setFiles],
  );

  const content = collections.map((collection, index) => {
          const files = filesByCollection[collection.key] ?? [];
          const existingItems = existingItemsByCollection?.[collection.key] ?? [];
          const error = errors?.[collection.key];
          const isMultiple = collection.multiple ?? false;
          const maxFiles = collection.maxFiles ?? (isMultiple ? 12 : 1);
          const canAddMore = !isMultiple || files.length < maxFiles;
          const draggedIndex = draggedIndexByCollection[collection.key];
          const draggedExistingIndex = draggedExistingIndexByCollection[collection.key];
          const hasSelectedFiles = files.length > 0;
          const hasExistingItems = existingItems.length > 0;
          const canEditExistingItems = Boolean(onExistingItemsChange);
          const shouldShowLabel = collection.showLabel ?? true;

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
                        ? "추가 이미지를 업로드할 수 있습니다."
                        : collection.maxFilesText ?? `최대 ${maxFiles}장까지 업로드했습니다.`
                        : "새 파일을 선택하면 기존 파일을 대체합니다."
                    : hasExistingItems
                      ? isMultiple
                        ? "새 이미지를 업로드하면 기존 이미지 전체를 대체합니다."
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

              {hasSelectedFiles ? (
                isMultiple ? (
                  <AnimatedMediaFileList
                    files={files}
                    draggedIndex={draggedIndex}
                    getFileId={getFileId}
                    prefersReducedMotion={prefersReducedMotion}
                    previewBehavior={collection.previewBehavior}
                    onRemove={(fileIndex) => setFiles(collection.key, files.filter((_, currentIndex) => currentIndex !== fileIndex))}
                    onMakeRepresentative={(fileIndex) => {
                      if (fileIndex === 0) return;

                      const nextFiles = [files[fileIndex], ...files.filter((_, currentIndex) => currentIndex !== fileIndex)];
                      setFiles(collection.key, nextFiles);
                    }}
                    onDragStart={(currentIndex) =>
                      setDraggedIndexByCollection((prev) => ({ ...prev, [collection.key]: currentIndex }))
                    }
                    onDrop={(dropIndex) => {
                      if (draggedIndex === undefined || draggedIndex === dropIndex) return;

                      const nextFiles = [...files];
                      const [moved] = nextFiles.splice(draggedIndex, 1);
                      nextFiles.splice(dropIndex, 0, moved);
                      setFiles(collection.key, nextFiles);
                      setDraggedIndexByCollection((prev) => ({ ...prev, [collection.key]: undefined }));
                    }}
                    onDragEnd={() => setDraggedIndexByCollection((prev) => ({ ...prev, [collection.key]: undefined }))}
                  />
                ) : (
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
                )
              ) : hasExistingItems ? (
                canEditExistingItems && isMultiple ? (
                  <AnimatedExistingMediaList
                    items={existingItems}
                    draggedIndex={draggedExistingIndex}
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
                    onDragStart={(currentIndex) =>
                      setDraggedExistingIndexByCollection((prev) => ({ ...prev, [collection.key]: currentIndex }))
                    }
                    onDrop={(dropIndex) => {
                      if (draggedExistingIndex === undefined || draggedExistingIndex === dropIndex) return;

                      const nextItems = [...existingItems];
                      const [moved] = nextItems.splice(draggedExistingIndex, 1);
                      nextItems.splice(dropIndex, 0, moved);
                      setExistingItems(collection.key, nextItems);
                      setDraggedExistingIndexByCollection((prev) => ({ ...prev, [collection.key]: undefined }));
                    }}
                    onDragEnd={() => setDraggedExistingIndexByCollection((prev) => ({ ...prev, [collection.key]: undefined }))}
                  />
                ) : canEditExistingItems ? (
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
                    multiple={isMultiple}
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
