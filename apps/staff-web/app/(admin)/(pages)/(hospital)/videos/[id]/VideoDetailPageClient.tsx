"use client";

import React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { isApiSuccess } from "@beaulab/types";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  SpinnerBlock,
  StatusBadge,
} from "@beaulab/ui-admin";

import { Can } from "@/components/common/guard";
import {
  DetailCompactMediaCard,
  DetailEmptyState,
  DetailImageMediaCard,
} from "@/components/common/DetailMediaCard";
import { api } from "@/lib/common/api";
import { buildReturnToPath } from "@/lib/common/navigation/buildReturnToPath";
import {
  formatBytes,
  getVideoMediaFilename,
  resolveVideoMediaUrl,
  type VideoDetailResponse,
  type VideoMediaAsset,
} from "@/lib/video/form";
import {
  formatLocalDateTime,
  labelVideoApprovalStatus,
  labelVideoDistributionChannel,
  labelVideoOperatingStatus,
} from "@/lib/video/list";

type VideoViewResponse = Omit<VideoDetailResponse, "hospital_business_number">;

export default function VideoDetailPageClient() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawVideoId = Array.isArray(params.id) ? params.id[0] : params.id;
  const videoId = Number(rawVideoId);

  const [detail, setDetail] = React.useState<VideoViewResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const getReturnToPath = React.useCallback(
    (highlightId?: number) =>
      buildReturnToPath({
        searchParams,
        fallbackPath: "/videos",
        allowedPrefix: "/videos",
        highlightId,
      }),
    [searchParams],
  );

  const editPath = React.useMemo(() => {
    const rawReturnTo = searchParams.get("returnTo");
    if (!Number.isFinite(videoId) || videoId <= 0) {
      return "/videos";
    }

    return rawReturnTo
      ? `/videos/${videoId}/edit?returnTo=${encodeURIComponent(rawReturnTo)}`
      : `/videos/${videoId}/edit`;
  }, [searchParams, videoId]);

  const fetchVideo = React.useCallback(async () => {
    if (!Number.isFinite(videoId) || videoId <= 0) {
      setLoadError("잘못된 동영상 경로입니다.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      const response = await api.get<VideoViewResponse>(`/videos/${videoId}`);

      if (!isApiSuccess(response)) {
        setLoadError(response.error.message || "동영상 정보를 불러오지 못했습니다.");
        return;
      }

      setDetail(response.data);
    } catch {
      setLoadError("동영상 정보를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [videoId]);

  React.useEffect(() => {
    void fetchVideo();
  }, [fetchVideo]);

  if (isLoading) {
    return <SpinnerBlock className="min-h-[60vh]" spinnerClassName="size-10" />;
  }

  if (loadError || !detail) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>동영상 정보를 불러오지 못했습니다.</CardTitle>
          <CardDescription>{loadError ?? "동영상 정보를 찾을 수 없습니다."}</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2 pt-0">
          <Button type="button" variant="brand" onClick={() => void fetchVideo()}>
            다시 불러오기
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push(getReturnToPath())}>
            목록으로
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:items-start lg:grid-cols-[minmax(0,1.36fr)_minmax(240px,0.64fr)]">
      <Card as="section" className="min-w-0">
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle>{detail.title} 상세 정보</CardTitle>
            </div>

            <div className="flex w-full flex-row gap-2 sm:w-auto">
              <Button type="button" variant="outline" className="flex-1 sm:flex-none" onClick={() => router.push(getReturnToPath())}>
                목록으로
              </Button>
              <Can permission="beaulab.video.update">
                <Button type="button" variant="brand" className="flex-1 sm:flex-none" onClick={() => router.push(editPath)}>
                  수정하기
                </Button>
              </Can>
            </div>
          </div>
        </CardHeader>

        <div className="space-y-10 divide-y divide-gray-200 dark:divide-gray-800">
          <section className="space-y-6 pb-6">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">기본 정보</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">동영상과 소속 병의원, 검수 상태를 확인합니다.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <DetailField label="병의원명" value={detail.hospital_name} />
              <DetailField label="의료진이름" value={detail.doctor_name} />
              <DetailField label="제목" value={detail.title} multiline className="md:col-span-2" />
              <DetailField label="설명" value={detail.description} multiline className="md:col-span-2" />

              <DetailField label="조회수" value={formatCount(detail.view_count)} />
              <DetailField label="좋아요 수" value={formatCount(detail.like_count)} />
              <StatusField label="운영 상태" value={detail.status} kind="status" />
              <StatusField label="검수 상태" value={detail.allow_status} kind="allow_status" />
              <TagField
                label="카테고리"
                items={detail.categories?.map((item) => item.full_path?.trim() || item.name) ?? []}
                className="md:col-span-2"
              />
              <DetailField label="등록신청일" value={formatLocalDateTime(detail.created_at)} />
              <DetailField label="등록완료일" value={formatLocalDateTime(detail.allowed_at)} />
            </div>
          </section>

          <section className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">배포 정보</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">배포 채널과 게시 기간, 외부 영상 연결 정보를 확인합니다.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <DetailField label="배포채널" value={labelVideoDistributionChannel(detail.distribution_channel)} />
              <DetailField label="재생 시간" value={formatDuration(detail.duration_seconds)} />
              <LinkField label="외부 영상 URL" value={detail.external_video_url} className="md:col-span-2" />
              <DetailField label="외부 영상 ID" value={detail.external_video_id} />
              <DetailField label="게시 기간" value={formatPublishPeriod(detail)} />
              <DetailField label="등록일" value={formatLocalDateTime(detail.created_at)} />
              <DetailField label="수정일" value={formatLocalDateTime(detail.updated_at)} />
            </div>
          </section>
        </div>
      </Card>

      <Card as="aside" className="min-w-0">
        <CardHeader className="pb-6">
          <CardTitle>파일 정보</CardTitle>
          <CardDescription>썸네일과 원본 동영상 파일을 확인합니다.</CardDescription>
        </CardHeader>

        <div className="space-y-6">
          <ThumbnailSection media={detail.thumbnail_file ?? null} />
          <FileSummaryField
            label="원본 동영상 파일"
            media={detail.video_file ?? null}
            downloadUrl={`/videos/${detail.id}/download-video-file`}
            emptyText="제출된 원본 동영상 파일이 없습니다."
          />
        </div>
      </Card>
    </div>
  );
}

function DetailField({
  label,
  value,
  multiline = false,
  className,
}: {
  label: string;
  value?: string | number | null;
  multiline?: boolean;
  className?: string;
}) {
  const displayValue = typeof value === "number" ? String(value) : value?.trim() || "-";

  return (
    <div className={["space-y-2", className].filter(Boolean).join(" ")}>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <div
        className={
          multiline
            ? "whitespace-pre-line break-words text-sm leading-6 text-gray-800 dark:text-gray-100"
            : "break-words text-sm leading-6 text-gray-800 dark:text-gray-100"
        }
      >
        {displayValue}
      </div>
    </div>
  );
}

function LinkField({
  label,
  value,
  className,
}: {
  label: string;
  value?: string | null;
  className?: string;
}) {
  const href = value?.trim();

  return (
    <div className={["space-y-2", className].filter(Boolean).join(" ")}>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="break-all text-sm leading-6 font-medium text-brand-600 underline underline-offset-2 dark:text-brand-400"
        >
          {href}
        </a>
      ) : (
        <div className="text-sm leading-6 text-gray-500 dark:text-gray-400">-</div>
      )}
    </div>
  );
}

function StatusField({
  label,
  value,
  kind,
}: {
  label: string;
  value?: string | null;
  kind: "status" | "allow_status";
}) {
  const status = value ?? "";
  const labelText = kind === "status" ? labelVideoOperatingStatus(status) : labelVideoApprovalStatus(status);
  const color =
    status === "ACTIVE" || status === "APPROVED"
      ? "success"
      : status === "SUBMITTED" || status === "IN_REVIEW"
        ? "warning"
        : "error";

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <div className="flex min-h-[28px] items-center">
        <StatusBadge size="sm" color={color}>
          {labelText || "-"}
        </StatusBadge>
      </div>
    </div>
  );
}

function TagField({
  label,
  items,
  className,
}: {
  label: string;
  items: string[];
  className?: string;
}) {
  return (
    <div className={["space-y-2", className].filter(Boolean).join(" ")}>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <div className="flex min-h-[28px] flex-wrap items-center gap-2">
        {items.length > 0 ? (
          items.map((item) => (
            <span
              key={item}
              className="inline-flex max-w-full items-center rounded-full bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 break-all dark:bg-brand-500/10 dark:text-brand-300"
            >
              {item}
            </span>
          ))
        ) : (
          <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
        )}
      </div>
    </div>
  );
}

function ThumbnailSection({ media }: { media: VideoMediaAsset | null }) {
  const thumbnailUrl = resolveVideoMediaUrl(media);

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-gray-800 dark:text-white/90">썸네일</p>
      {thumbnailUrl ? (
        <DetailImageMediaCard
          fileName={getVideoMediaFilename(media)}
          fileUrl={thumbnailUrl}
          imageUrl={thumbnailUrl}
          sizeText={media?.size ? formatBytes(media.size) : null}
          className="w-full"
          previewAlt="동영상 썸네일"
        />
      ) : (
        <DetailEmptyState>업로드한 썸네일 파일이 없습니다.</DetailEmptyState>
      )}
    </div>
  );
}

function FileSummaryField({
  label,
  media,
  downloadUrl,
  emptyText,
}: {
  label: string;
  media: VideoMediaAsset | null;
  downloadUrl?: string | null;
  emptyText: string;
}) {
  const fileUrl = resolveVideoMediaUrl(media);

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-gray-800 dark:text-white/90">{label}</p>
      {media ? (
        <DetailCompactMediaCard
          fileName={getVideoMediaFilename(media)}
          fileUrl={fileUrl}
          downloadUrl={downloadUrl}
          sizeText={media.size ? formatBytes(media.size) : null}
          previewSizeClassName="h-14 w-14"
          showDownload
        />
      ) : (
        <DetailEmptyState>{emptyText}</DetailEmptyState>
      )}
    </div>
  );
}

function formatCount(value?: number | null) {
  return Number.isFinite(value) ? Number(value).toLocaleString() : "-";
}

function formatDuration(value?: number | null) {
  if (!Number.isFinite(value)) return "-";

  const totalSeconds = Math.max(0, Math.floor(Number(value)));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return [
      String(hours).padStart(2, "0"),
      String(minutes).padStart(2, "0"),
      String(seconds).padStart(2, "0"),
    ].join(":");
  }

  return [
    String(minutes).padStart(2, "0"),
    String(seconds).padStart(2, "0"),
  ].join(":");
}

function formatPublishPeriod(detail: VideoDetailResponse) {
  if (detail.is_publish_period_unlimited) {
    return "무기한";
  }

  const start = formatLocalDateTime(detail.publish_start_at);
  const end = formatLocalDateTime(detail.publish_end_at);

  if (start === "-" && end === "-") return "-";
  return `${start} ~ ${end}`;
}
