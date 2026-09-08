"use client";
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card/Card";
import { Dropzone, HiddenFileInput } from "./MediaUploaderPrimitives";
import { ExistingMediaCard } from "./ExistingMediaCard";
import { MediaFileCard } from "./MediaFileCard";
import {
  ExistingMediaList,
  SortableExistingMediaList,
  SortableMediaFileList,
  SortableMergedMediaList,
} from "./MediaUploaderLists";
import { buildExistingMediaToken, buildNewMediaToken, normalizeMediaOrder, useStableFileId } from "./media-utils";
import type {
  MediaUploaderProps,
  ExistingMediaItem,
  MediaCollectionConfig,
  MergedMediaEntry,
  MediaUploaderPreviewPayload,
} from "./MediaUploader.types";
export type {
  MediaCollectionConfig,
  ExistingMediaItem,
  MediaUploaderPreviewItem,
  MediaUploaderPreviewPayload,
  DropzoneVariant,
  MediaCardVariant,
} from "./MediaUploader.types";

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
      const validatedIncomingFiles = onBeforeAddFiles ? await onBeforeAddFiles(collection.key, incoming) : incoming;

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
    [
      existingItemsByCollection,
      filesByCollection,
      getFileId,
      onBeforeAddFiles,
      onExistingItemsChange,
      onOrderChange,
      orderByCollection,
      setFiles,
    ],
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
      const nextFiles = nextTokens.map((token) => newTokenMap.get(token)).filter((file): file is File => Boolean(file));

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
        className={`space-y-4 ${index === 0 ? "" : "mt-8 border-t border-gray-200 pt-8"}`}
      >
        {shouldShowLabel ? (
          <div className="space-y-1.5">
            <h4 className={`text-sm font-semibold ${error ? "text-error-600" : "text-gray-800"}`}>
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
                    : (collection.maxFilesText ?? `최대 ${maxFiles}장까지 업로드했습니다.`)
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
                : [
                    collection.helperText,
                    isMultiple ? (collection.maxFilesText ?? `최대 ${maxFiles}장까지 업로드할 수 있습니다.`) : null,
                  ]
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

                    const nextItems = [
                      existingItems[itemIndex],
                      ...existingItems.filter((_, currentIndex) => currentIndex !== itemIndex),
                    ];
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
                onRemove={(fileIndex) =>
                  setFiles(
                    collection.key,
                    files.filter((_, currentIndex) => currentIndex !== fileIndex),
                  )
                }
                onMakeRepresentative={(fileIndex) => {
                  if (fileIndex === 0) return;

                  const nextFiles = [
                    files[fileIndex],
                    ...files.filter((_, currentIndex) => currentIndex !== fileIndex),
                  ];
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

        {error ? <p className="text-xs text-error-500">{error}</p> : null}
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
