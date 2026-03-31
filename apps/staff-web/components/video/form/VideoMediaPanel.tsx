import {
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  MediaUploader,
  Download,
  X,
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
import { downloadFile } from "@/lib/common/api";

type VideoMediaPanelProps = {
  thumbnailFile: File | null;
  existingThumbnail?: ExistingMediaItem | null;
  currentVideoFile?: VideoMediaAsset | null;
  videoFileDownloadUrl?: string | null;
  isCurrentVideoFileRemoved?: boolean;
  errors: VideoFormErrors;
  onThumbnailChange: (file: File | null) => void;
  onExistingThumbnailChange?: (item: ExistingMediaItem | null) => void;
  onCurrentVideoFileChange?: (file: VideoMediaAsset | null) => void;
};

export function VideoMediaPanel({
  thumbnailFile,
  existingThumbnail,
  currentVideoFile,
  videoFileDownloadUrl,
  isCurrentVideoFileRemoved = false,
  errors,
  onThumbnailChange,
  onExistingThumbnailChange = () => undefined,
  onCurrentVideoFileChange = () => undefined,
}: VideoMediaPanelProps) {
  const currentVideoFileUrl = resolveVideoMediaUrl(currentVideoFile);

  return (
    <Card as="aside" className="min-w-0">
      <CardHeader className="pb-6">
        <CardTitle>파일 업로드</CardTitle>
        <CardDescription>썸네일과 병의원 파트너가 제출한 원본 파일을 확인합니다.</CardDescription>
      </CardHeader>

      <div className="space-y-6">
        <MediaUploader
          embedded
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
          onExistingItemsChange={(_, items) => onExistingThumbnailChange(items[0] ?? null)}
          onChange={(_, files) => onThumbnailChange(files[0] ?? null)}
        />

        <div className="space-y-2">
          <p className="text-sm font-semibold text-gray-800 dark:text-white/90">원본 동영상 파일</p>
          {currentVideoFile ? (
            <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {getVideoMediaFilename(currentVideoFile)}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                    {currentVideoFile.size ? (
                      <p className="text-xs text-gray-500 dark:text-gray-400">{formatBytes(currentVideoFile.size)}</p>
                    ) : null}
                    {currentVideoFileUrl ? (
                      <>
                        <a
                          href={currentVideoFileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-medium text-brand-600 underline underline-offset-2 dark:text-brand-400"
                        >
                          파일 보기
                        </a>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 border-b border-current pb-px text-xs font-medium leading-none text-blue-600 dark:text-blue-400"
                          onClick={() => {
                            void downloadFile(
                              videoFileDownloadUrl ?? currentVideoFileUrl ?? "",
                              getVideoMediaFilename(currentVideoFile),
                            );
                          }}
                        >
                          <Download className="size-3.5" />
                          다운로드
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-9 shrink-0 text-gray-500 hover:text-red-600"
                  onClick={() => onCurrentVideoFileChange(null)}
                  aria-label="원본 동영상 파일 삭제"
                  title="파일 제거"
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>
          ) : isCurrentVideoFileRemoved ? (
            <div className="rounded-2xl border border-dashed border-red-300 bg-red-50/40 px-4 py-5 text-sm text-red-600 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-300">
              원본 동영상 파일이 저장 시 삭제됩니다.
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-300 px-4 py-5 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
              제출된 원본 동영상 파일이 없습니다.
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
