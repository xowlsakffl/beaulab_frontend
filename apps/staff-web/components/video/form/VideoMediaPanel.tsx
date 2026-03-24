import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  MediaUploader,
  type ExistingMediaItem,
} from "@beaulab/ui-admin";

import {
  formatBytes,
  getVideoMediaFilename,
  resolveVideoMediaUrl,
  VIDEO_THUMBNAIL_COLLECTIONS,
  type VideoFormErrors,
  type VideoMediaAsset,
} from "@/lib/video/form";

type VideoMediaPanelProps = {
  thumbnailFile: File | null;
  existingThumbnail?: ExistingMediaItem | null;
  currentVideoFile?: VideoMediaAsset | null;
  errors: VideoFormErrors;
  onThumbnailChange: (file: File | null) => void;
};

export function VideoMediaPanel({
  thumbnailFile,
  existingThumbnail,
  currentVideoFile,
  errors,
  onThumbnailChange,
}: VideoMediaPanelProps) {
  const currentVideoFileUrl = resolveVideoMediaUrl(currentVideoFile);

  return (
    <Card as="aside" className="min-w-0">
      <CardHeader className="pb-6">
        <CardTitle>파일 업로드</CardTitle>
        <CardDescription>썸네일과 병원 파트너가 제출한 원본 파일을 확인합니다.</CardDescription>
      </CardHeader>

      <div className="space-y-6">
        <MediaUploader
          title="썸네일"
          collections={VIDEO_THUMBNAIL_COLLECTIONS}
          filesByCollection={{
            thumbnail_file: thumbnailFile ? [thumbnailFile] : [],
          }}
          existingItemsByCollection={
            existingThumbnail && !thumbnailFile
              ? {
                  thumbnail_file: [existingThumbnail],
                }
              : undefined
          }
          errors={{
            thumbnail_file: errors.thumbnail_file,
          }}
          onChange={(_, files) => onThumbnailChange(files[0] ?? null)}
        />

        <div className="space-y-2">
          <p className="text-sm font-semibold text-gray-800 dark:text-white/90">원본 동영상 파일</p>
          {currentVideoFile ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                {getVideoMediaFilename(currentVideoFile)}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                {currentVideoFile.size ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400">{formatBytes(currentVideoFile.size)}</p>
                ) : null}
                {currentVideoFileUrl ? (
                  <a
                    href={currentVideoFileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-medium text-brand-600 underline underline-offset-2 dark:text-brand-400"
                  >
                    파일 보기
                  </a>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-5 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-400">
              제출된 원본 동영상 파일이 없습니다.
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
