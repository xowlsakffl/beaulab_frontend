"use client";

import React from "react";
import { Card, RichTextEditor, useGlobalAlert } from "@beaulab/ui-admin";
import { useObjectUrl } from "@beaulab/ui-admin/hooks";
import { ImageUploadPreviewCard } from "@/components/common/ImageUploadPreviewCard";
import { MediaPreviewModal, type MediaPreviewState } from "@/components/common/MediaPreviewModal";
import { promotionBannerItem } from "@/lib/hospital-promotion/detail";
import { PROMOTION_BANNER_ACCEPT, PROMOTION_BANNER_HELPER_TEXT } from "@/lib/hospital-promotion/form";
import type { PromotionBanner } from "@/lib/hospital-promotion/types";
import { PromotionFormField } from "./PromotionFormField";

export const PromotionContentSection = React.memo(function PromotionContentSection({
  content,
  banner,
  existingBanner,
  bannerError,
  contentError,
  disabled,
  onBannerChange,
  onContentChange,
  onUploadImage,
  onContentBlur,
}: {
  content: string;
  banner: File | null;
  existingBanner?: PromotionBanner | null;
  bannerError?: string;
  contentError?: string;
  disabled: boolean;
  onBannerChange: (file: File | null) => void;
  onContentChange: (content: string) => void;
  onUploadImage: (file: File) => Promise<{ url: string }>;
  onContentBlur: () => void;
}) {
  const [preview, setPreview] = React.useState<MediaPreviewState | null>(null);
  const objectUrl = useObjectUrl(banner);
  const bannerUrl = objectUrl ?? promotionBannerItem(existingBanner)[0]?.url ?? null;
  const { showAlert } = useGlobalAlert();
  return (
    <div className="min-w-0 space-y-4">
      <ImageUploadPreviewCard
        id="promotion-banner"
        title="배너 이미지"
        emptyTitle="배너 이미지를 등록해 주세요."
        emptyDescription="jpg, png, webp 파일을 업로드할 수 있습니다."
        helper={PROMOTION_BANNER_HELPER_TEXT}
        accept={PROMOTION_BANNER_ACCEPT}
        objectUrl={bannerUrl}
        onPreview={setPreview}
        onFileChange={onBannerChange}
        onClear={banner ? () => onBannerChange(null) : undefined}
        disabled={disabled}
        error={bannerError}
        aspect="auto"
        required
      />
      <Card as="section" className="min-w-0 rounded-xl p-5">
        <PromotionFormField label="내용" htmlFor="promotion-content" required error={contentError}>
          <div
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) onContentBlur();
            }}
          >
            <RichTextEditor
              id="promotion-content"
              name="content"
              value={content}
              disabled={disabled}
              onChange={onContentChange}
              onUploadImage={onUploadImage}
              onUploadError={(message) => showAlert({ variant: "error", title: "이미지 업로드 실패", message })}
              error={Boolean(contentError)}
              placeholder="내용을 입력해 주세요."
            />
          </div>
        </PromotionFormField>
      </Card>
      <MediaPreviewModal preview={preview} onChange={setPreview} onClose={() => setPreview(null)} />
    </div>
  );
});
