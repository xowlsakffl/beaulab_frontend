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

export type MediaUploaderProps<T extends string = string> = {
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

export type MediaListLayout = "stack" | "horizontal";
export type DropzoneVariant = "panel" | "button";
export type MediaCardVariant = "default" | "imageOnly";
export type ScrollAxis = "x" | "y";
export type DropPosition = "before" | "after";

export type MergedMediaEntry =
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
