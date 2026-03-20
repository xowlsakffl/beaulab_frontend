import { MediaUploader, type ExistingMediaItem } from "@beaulab/ui-admin";

import { MEDIA_COLLECTIONS, type HospitalMediaField } from "@/lib/hospital/form";

type HospitalMediaPanelProps = {
  filesByCollection: {
    logo: File[];
    gallery: File[];
  };
  errors: {
    logo?: string;
    gallery?: string;
  };
  existingItemsByCollection?: {
    logo: ExistingMediaItem[];
    gallery: ExistingMediaItem[];
  };
  onExistingItemsChange?: (key: HospitalMediaField, items: ExistingMediaItem[]) => void;
  onChange: (key: HospitalMediaField, files: File[]) => void;
};

export function HospitalMediaPanel({
  filesByCollection,
  errors,
  existingItemsByCollection,
  onExistingItemsChange,
  onChange,
}: HospitalMediaPanelProps) {
  return (
    <MediaUploader
      title="파일 업로드"
      collections={MEDIA_COLLECTIONS}
      filesByCollection={filesByCollection}
      existingItemsByCollection={existingItemsByCollection}
      errors={errors}
      onExistingItemsChange={onExistingItemsChange}
      onChange={onChange}
    />
  );
}
