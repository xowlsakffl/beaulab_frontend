"use client";

import React from "react";

import type { HospitalMediaPreviewState } from "@/components/hospital/media/HospitalMediaPreviewModal";
import { useObjectUrl } from "@/hooks/common/useObjectUrl";
import { Button, Card, type ExistingMediaItem } from "@beaulab/ui-admin";

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
  onPreview: (preview: HospitalMediaPreviewState) => void;
  onChange: (file: File | null) => void | Promise<void>;
}) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const filePreviewUrl = useObjectUrl(file);
  const previewUrl = filePreviewUrl ?? existingImage?.url ?? null;

  return (
    <Card
      className="flex w-full flex-col self-start rounded-xl border border-gray-200 bg-white p-4"
      data-media-collection="profile_image"
      tabIndex={-1}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => {
          const nextFile = event.target.files?.[0] ?? null;
          event.currentTarget.value = "";
          void onChange(nextFile);
        }}
      />

      {previewUrl ? (
        <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl bg-white">
          <button
            type="button"
            className="flex h-full w-full cursor-zoom-in items-center justify-center overflow-hidden rounded-2xl"
            onClick={() =>
              onPreview({
                url: previewUrl,
                title: "의료진 프로필",
                isImage: true,
              })
            }
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- runtime storage/object URL */}
            <img src={previewUrl} alt="의료진 프로필" className="h-full w-full object-cover" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="flex aspect-square w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-gray-300 bg-white px-6 text-center transition-colors hover:border-brand-200 hover:bg-brand-50/30"
          onClick={() => inputRef.current?.click()}
        >
          <div className="flex size-12 items-center justify-center rounded-full bg-brand-50 text-brand-500">
            <span className="text-2xl leading-none">+</span>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-gray-800">프로필 사진을 등록해 주세요.</p>
            <p className="text-xs text-gray-500">jpg, png, webp 파일을 업로드할 수 있습니다.</p>
          </div>
        </button>
      )}

      {previewUrl ? (
        <Button
          type="button"
          variant="brand"
          size="sm"
          className="mt-3 w-full"
          onClick={() => inputRef.current?.click()}
        >
          이미지 수정하기
        </Button>
      ) : (
        <Button
          type="button"
          variant="brand"
          size="sm"
          className="mt-3 w-full"
          onClick={() => inputRef.current?.click()}
        >
          이미지 등록하기
        </Button>
      )}
      {error ? <p className="mt-2 text-xs text-error-500">{error}</p> : null}
    </Card>
  );
}
