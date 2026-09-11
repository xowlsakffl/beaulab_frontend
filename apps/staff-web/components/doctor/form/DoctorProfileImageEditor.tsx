"use client";

import type { ExistingMediaItem } from "@beaulab/ui-admin";
import type { MediaPreviewState } from "@/components/common/MediaPreviewModal";
import { ImageUploadPreviewCard } from "@/components/common/ImageUploadPreviewCard";
import { useObjectUrl } from "@beaulab/ui-admin/hooks";

export function ProfileImageEditor({
  file,
  existingImage,
  error,
  onPreview,
  onChange,
}: {
  file: File | null;
  existingImage: ExistingMediaItem | null;
  error?: string;
  onPreview: (preview: MediaPreviewState) => void;
  onChange: (file: File | null) => void | Promise<void>;
}) {
  const filePreviewUrl = useObjectUrl(file);
  const previewUrl = filePreviewUrl ?? existingImage?.url ?? null;

  return (
    <ImageUploadPreviewCard
      title="의료진 프로필"
      accept="image/jpeg,image/png,image/webp"
      emptyTitle="프로필 사진을 등록해 주세요."
      emptyDescription="jpg, png, webp 파일을 업로드할 수 있습니다."
      objectUrl={previewUrl}
      onPreview={onPreview}
      onFileChange={onChange}
      error={error}
      showHeader={false}
      mediaCollection="profile_image"
      className="flex w-full flex-col self-start p-4"
    />
  );
}
