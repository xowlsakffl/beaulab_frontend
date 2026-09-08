"use client";
import React from "react";
import type {
  ExistingMediaItem,
  MediaCardVariant,
  MediaListLayout,
  MediaUploaderPreviewPayload,
  MediaUploaderPreviewItem,
  MergedMediaEntry,
} from "./MediaUploader.types";
import { MediaFileCard } from "./MediaFileCard";
import { ExistingMediaCard } from "./ExistingMediaCard";
import { isImageFile } from "./MediaUploaderPrimitives";
import { getMediaListClassName, SortableMediaList } from "./SortableMediaList";
import { useObjectUrlRegistry } from "./media-utils";

export function ExistingMediaList({
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

export function SortableExistingMediaList({
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
  const entries = React.useMemo<MergedMediaEntry[]>(
    () => items.map((item) => ({ kind: "existing", item, token: String(item.id) })),
    [items],
  );
  return (
    <SortableMergedMediaList
      items={entries}
      previewBehavior={previewBehavior}
      cardVariant={cardVariant}
      layout={layout}
      onPreview={onPreview}
      onRemove={(token) => onRemove(items.findIndex((item) => String(item.id) === token))}
      onMakeRepresentative={(token) => onMakeRepresentative(items.findIndex((item) => String(item.id) === token))}
      onReorder={(next) => onReorder(next.flatMap((entry) => (entry.kind === "existing" ? [entry.item] : [])))}
    />
  );
}

export function SortableMediaFileList({
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
  const entries = React.useMemo<MergedMediaEntry[]>(
    () => files.map((file) => ({ kind: "new", file, token: getFileId(file) })),
    [files, getFileId],
  );
  return (
    <SortableMergedMediaList
      items={entries}
      previewBehavior={previewBehavior}
      cardVariant={cardVariant}
      layout={layout}
      representativeOffset={representativeOffset}
      allowRepresentative={allowRepresentative}
      onPreview={onPreview}
      onRemove={(token) => onRemove(files.findIndex((file) => getFileId(file) === token))}
      onMakeRepresentative={(token) => onMakeRepresentative(files.findIndex((file) => getFileId(file) === token))}
      onReorder={(next) => onReorder(next.flatMap((entry) => (entry.kind === "new" ? [entry.file] : [])))}
    />
  );
}

export function SortableMergedMediaList({
  items,
  previewBehavior,
  cardVariant = "default",
  layout = "stack",
  onRemove,
  onMakeRepresentative,
  onReorder,
  onPreview,
  representativeOffset = 0,
  allowRepresentative = true,
}: {
  items: MergedMediaEntry[];
  representativeOffset?: number;
  allowRepresentative?: boolean;
  previewBehavior?: "contain" | "natural-center";
  cardVariant?: MediaCardVariant;
  layout?: MediaListLayout;
  onRemove: (token: string) => void;
  onMakeRepresentative: (token: string) => void;
  onReorder: (items: MergedMediaEntry[]) => void;
  onPreview?: (preview: MediaUploaderPreviewPayload) => void;
}) {
  const { getObjectUrl, retainObjectUrls } = useObjectUrlRegistry();
  const [objectUrls, setObjectUrls] = React.useState(new Map<string, string>());

  React.useEffect(() => {
    const nextUrls = new Map<string, string>();
    for (const item of items) {
      if (item.kind !== "new") continue;
      const url = getObjectUrl(item.token, item.file);
      if (url) nextUrls.set(item.token, url);
    }
    retainObjectUrls(new Set(nextUrls.keys()));
    setObjectUrls((current) =>
      current.size === nextUrls.size && [...nextUrls].every(([token, url]) => current.get(token) === url)
        ? current
        : nextUrls,
    );
  }, [getObjectUrl, items, retainObjectUrls]);

  const previewItems = React.useMemo(
    () =>
      items.reduce<MediaUploaderPreviewItem[]>((accumulator, item) => {
        if (item.kind === "existing") {
          if (!item.item.url) return accumulator;

          accumulator.push({
            url: item.item.url,
            title: item.item.name,
            isImage: item.item.isImage !== false,
          });

          return accumulator;
        }

        const previewUrl = objectUrls.get(item.token);
        if (!previewUrl) return accumulator;

        accumulator.push({
          url: previewUrl,
          title: item.file.name,
          isImage: isImageFile(item.file),
        });

        return accumulator;
      }, []),
    [items, objectUrls],
  );
  const previewIndexByToken = React.useMemo(() => {
    const map = new Map<string, number>();
    let nextIndex = 0;

    items.forEach((item) => {
      if (item.kind === "existing" && !item.item.url) return;
      if (item.kind === "new" && !objectUrls.has(item.token)) return;
      map.set(item.token, nextIndex);
      nextIndex += 1;
    });

    return map;
  }, [items, objectUrls]);

  return (
    <SortableMediaList items={items} getKey={getMergedKey} layout={layout} onReorder={onReorder}>
      {(entry, index, drag) => {
        const props = {
          index,
          multiple: true,
          isRepresentative: representativeOffset + index === 0,
          ...drag,
          previewBehavior,
          cardVariant,
          onRemove: () => onRemove(entry.token),
          onMakeRepresentative: allowRepresentative ? () => onMakeRepresentative(entry.token) : undefined,
          onPreview: onPreview
            ? (preview: MediaUploaderPreviewPayload) =>
                onPreview({
                  ...preview,
                  items: previewItems,
                  index: previewIndexByToken.get(entry.token) ?? 0,
                })
            : undefined,
        };
        return entry.kind === "existing" ? (
          <ExistingMediaCard item={entry.item} {...props} />
        ) : (
          <MediaFileCard file={entry.file} objectUrl={objectUrls.get(entry.token) ?? null} {...props} />
        );
      }}
    </SortableMediaList>
  );
}
const getMergedKey = (item: MergedMediaEntry) => item.token;
