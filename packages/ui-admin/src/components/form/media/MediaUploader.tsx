"use client";

import Image from "next/image";
import React from "react";
import { GripVertical, Image as ImageIcon, Star, UploadCloud, X } from "../../../icons";
import { Button } from "../../ui/button/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card/Card";

export type MediaCollectionConfig<T extends string = string> = {
  key: T;
  label: string;
  accept: string;
  multiple?: boolean;
  maxFiles?: number;
  emptyText: string;
  helperText: string;
  maxFilesText?: string;
};

type MediaUploaderProps<T extends string = string> = {
  title?: string;
  collections: readonly MediaCollectionConfig<T>[];
  filesByCollection: Partial<Record<T, File[]>>;
  errors?: Partial<Record<T, string>>;
  onChange: (key: T, files: File[]) => void;
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

function MediaPreview({ file }: { file: File }) {
  const url = useObjectUrl(isImageFile(file) ? file : null);

  if (!url) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl bg-gray-50 text-gray-500 dark:bg-gray-900 dark:text-gray-400">
        <ImageIcon className="size-10" />
      </div>
    );
  }

  return (
    <div className="relative h-full w-full rounded-xl bg-gray-50 dark:bg-gray-900">
      <Image src={url} alt={file.name} fill unoptimized className="object-contain" />
    </div>
  );
}

function Dropzone({
  accept,
  multiple,
  disabled,
  error = false,
  primaryText = "파일을 끌어오거나 클릭해서 선택",
  secondaryText,
  onPickFiles,
}: {
  accept: string;
  multiple: boolean;
  disabled: boolean;
  error?: boolean;
  primaryText?: string;
  secondaryText?: string;
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
    </label>
  );
}

function MediaFileCard({
  file,
  index,
  multiple,
  isRepresentative,
  onRemove,
  onMakeRepresentative,
  onDragStart,
  onDrop,
  onDragEnd,
}: {
  file: File;
  index: number;
  multiple: boolean;
  isRepresentative: boolean;
  onRemove: () => void;
  onMakeRepresentative?: () => void;
  onDragStart?: (index: number) => void;
  onDrop?: (index: number) => void;
  onDragEnd?: () => void;
}) {
  return (
    <div
      draggable={multiple}
      onDragStart={() => onDragStart?.(index)}
      onDragOver={(event) => {
        if (!multiple) return;
        event.preventDefault();
      }}
      onDrop={() => onDrop?.(index)}
      onDragEnd={onDragEnd}
      className={`overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 ${
        multiple ? "cursor-pointer" : ""
      }`}
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
        <MediaPreview file={file} />
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
}

export function MediaUploader<T extends string = string>({
  title = "파일 업로드",
  collections,
  filesByCollection,
  errors,
  onChange,
}: MediaUploaderProps<T>) {
  const [draggedIndexByCollection, setDraggedIndexByCollection] = React.useState<Partial<Record<T, number>>>({});

  const setFiles = React.useCallback(
    (key: T, files: File[]) => {
      onChange(key, files);
    },
    [onChange],
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

  return (
    <Card as="aside">
      <CardHeader className="p-0 pb-5">
        <CardTitle>{title}</CardTitle>
        <CardDescription>이미지 항목별로 파일을 업로드해 주세요.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-0 p-0">
        {collections.map((collection, index) => {
          const files = filesByCollection[collection.key] ?? [];
          const error = errors?.[collection.key];
          const isMultiple = collection.multiple ?? false;
          const maxFiles = collection.maxFiles ?? (isMultiple ? 12 : 1);
          const canAddMore = !isMultiple || files.length < maxFiles;
          const draggedIndex = draggedIndexByCollection[collection.key];

          return (
            <section
              key={String(collection.key)}
              className={`space-y-4 ${index === 0 ? "" : "mt-8 border-t border-gray-200 pt-8 dark:border-gray-800"}`}
            >
              <div className="space-y-1.5">
                <h4 className={`text-sm font-semibold ${error ? "text-error-600 dark:text-error-400" : "text-gray-800 dark:text-white/90"}`}>
                  {collection.label}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">{collection.helperText}</p>
                {isMultiple ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {collection.maxFilesText ?? `최대 ${maxFiles}장까지 업로드할 수 있습니다.`}
                  </p>
                ) : null}
              </div>

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
                    : collection.emptyText
                }
                onPickFiles={(incoming) => addFiles(collection, incoming)}
              />

              {files.length > 0 ? (
                isMultiple ? (
                  <div className="space-y-3 pt-2">
                    {files.map((file, fileIndex) => (
                      <MediaFileCard
                        key={`${file.name}:${file.size}:${file.lastModified}:${fileIndex}`}
                        file={file}
                        index={fileIndex}
                        multiple
                        isRepresentative={fileIndex === 0}
                        onRemove={() => setFiles(collection.key, files.filter((_, currentIndex) => currentIndex !== fileIndex))}
                        onMakeRepresentative={() => {
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
                    ))}
                  </div>
                ) : (
                  <div className="pt-2">
                    <MediaFileCard
                      file={files[0]}
                      index={0}
                      multiple={false}
                      isRepresentative={false}
                      onRemove={() => setFiles(collection.key, [])}
                    />
                  </div>
                )
              ) : null}

              {error ? (
                <p className="text-xs text-error-500">{error}</p>
              ) : null}
            </section>
          );
        })}
      </CardContent>
    </Card>
  );
}

export default MediaUploader;
