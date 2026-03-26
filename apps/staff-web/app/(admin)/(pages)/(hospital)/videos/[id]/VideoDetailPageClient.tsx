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
  FormSettingToggleRow,
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
  }, [videoId, searchParams]);

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
              <Button
                type="button"
                variant="outline"
                className="flex-1 sm:flex-none"
                onClick={() => router.push(getReturnToPath())}
              >
                목록으로
              </Button>
              <Can permission="beaulab.video.update">
                <Button
                  type="button"
                  variant="brand"
                  className="flex-1 sm:flex-none"
                  onClick={() => router.push(editPath)}
                >
                  수정하기
                </Button>
              </Can>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-8">
          <section className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">기본 정보</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                동영상의 병원, 의료진, 상태 정보를 확인합니다.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <DetailField label="병의원명" value={detail.hospital_name} />
              <DetailField label="의료진명" value={detail.doctor_name} />
              <DetailField label="제목" value={detail.title} className="md:col-span-2" />
              <DetailField label="설명" value={detail.description} className="md:col-span-2" />
              <DetailField label="조회수" value={formatCount(detail.view_count)} />
              <DetailField label="좋아요 수" value={formatCount(detail.like_count)} />
              <StatusField label="운영 상태" tone="success" value={detail.status} formatter={labelVideoOperatingStatus} />
              <StatusField
                label="검수 상태"
                tone="warning"
                value={detail.allow_status}
                formatter={labelVideoApprovalStatus}
              />
              <TagField label="카테고리" values={detail.categories?.map((item) => item.full_path || item.name) ?? []} className="md:col-span-2" />
              <DetailField label="등록신청일" value={formatLocalDateTime(detail.created_at)} />
              <DetailField label="등록완료일" value={formatLocalDateTime(detail.allowed_at)} />
            </div>
          </section>

          <section className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">배포 정보</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                외부 영상 연동과 게시 기간 정보를 확인합니다.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <DetailField label="배포 채널" value={labelVideoDistributionChannel(detail.distribution_channel)} />
              <DetailField label="재생 시간" value={formatDuration(detail.duration_seconds)} />
              <LinkField label="외부 영상 URL" href={detail.external_video_url} className="md:col-span-2" />
              <DetailField label="외부 영상 ID" value={detail.external_video_id} className="md:col-span-2" />
              <DetailField label="등록일" value={formatLocalDateTime(detail.created_at)} />
              <DetailField label="수정일" value={formatLocalDateTime(detail.updated_at)} />
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50/80 dark:border-gray-800 dark:bg-gray-900/50">
              <FormSettingToggleRow
                title="무기한 게시"
                description="게시 종료 없이 계속 노출합니다."
                checked={Boolean(detail.is_publish_period_unlimited)}
                onChange={() => undefined}
                disabled
                isLast
              >
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">게시 기간</p>
                  <p className="break-words text-sm leading-6 text-gray-800 dark:text-gray-100">
                    {formatPublishPeriod(detail)}
                  </p>
                </div>
              </FormSettingToggleRow>
            </div>
          </section>
        </CardContent>
      </Card>

      <Card as="aside" className="min-w-0">
        <CardHeader className="pb-6">
          <CardTitle>파일 정보</CardTitle>
          <CardDescription>썸네일과 원본 동영상 파일을 확인합니다.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <ThumbnailSection media={detail.thumbnail_file} />
          <FileSummaryField label="원본 동영상 파일" media={detail.video_file} detailId={detail.id} />
        </CardContent>
      </Card>
    </div>
  );
}

function DetailField({
  label,
  value,
  className,
}: {
  label: string;
  value?: string | number | null;
  className?: string;
}) {
  const displayValue = typeof value === "number" ? String(value) : value?.toString().trim() || "-";

  return (
    <div className={["space-y-2", className].filter(Boolean).join(" ")}>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <div className="break-words text-sm leading-6 text-gray-800 dark:text-gray-100">{displayValue}</div>
    </div>
  );
}

function LinkField({
  label,
  href,
  className,
}: {
  label: string;
  href?: string | null;
  className?: string;
}) {
  const trimmedHref = href?.trim();

  return (
    <div className={["space-y-2", className].filter(Boolean).join(" ")}>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
      {trimmedHref ? (
        <a
          href={trimmedHref}
          target="_blank"
          rel="noreferrer"
          className="break-all text-sm leading-6 text-brand-600 underline underline-offset-2 dark:text-brand-400"
        >
          {trimmedHref}
        </a>
      ) : (
        <div className="text-sm leading-6 text-gray-800 dark:text-gray-100">-</div>
      )}
    </div>
  );
}

function StatusField({
  label,
  value,
  formatter,
  tone,
}: {
  label: string;
  value?: string | null;
  formatter: (value?: string | null) => string;
  tone: "success" | "warning" | "error";
}) {
  const status = value?.trim() || "";
  const badgeColor = status ? tone : "light";

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <StatusBadge size="sm" color={badgeColor}>
        {formatter(status)}
      </StatusBadge>
    </div>
  );
}

function TagField({
  label,
  values,
  className,
}: {
  label: string;
  values: string[];
  className?: string;
}) {
  return (
    <div className={["space-y-2", className].filter(Boolean).join(" ")}>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
      {values.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {values.map((value) => (
            <span
              key={value}
              className="inline-flex max-w-full items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:bg-brand-500/15 dark:text-brand-200"
              title={value}
            >
              <span className="truncate">{value}</span>
            </span>
          ))}
        </div>
      ) : (
        <div className="text-sm leading-6 text-gray-800 dark:text-gray-100">-</div>
      )}
    </div>
  );
}

function ThumbnailSection({ media }: { media?: VideoMediaAsset | null }) {
  const fileUrl = resolveVideoMediaUrl(media);
  const fileName = getVideoMediaFilename(media);

  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">썸네일</h3>
      </div>

      {fileUrl && fileName ? (
        <DetailImageMediaCard
          fileName={fileName}
          fileUrl={fileUrl}
          imageUrl={fileUrl}
          sizeText={formatBytes(media?.size) ?? undefined}
          previewAlt={fileName}
        />
      ) : (
        <DetailEmptyState>등록된 썸네일이 없습니다.</DetailEmptyState>
      )}
    </section>
  );
}

function FileSummaryField({
  label,
  media,
  detailId,
}: {
  label: string;
  media?: VideoMediaAsset | null;
  detailId: number;
}) {
  const fileUrl = resolveVideoMediaUrl(media);
  const fileName = getVideoMediaFilename(media);

  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">{label}</h3>
      </div>

      {fileUrl && fileName ? (
        <DetailCompactMediaCard
          fileName={fileName}
          fileUrl={fileUrl}
          downloadUrl={`/videos/${detailId}/download-video-file`}
          sizeText={formatBytes(media?.size) ?? undefined}
          previewFallbackText="파일"
          previewSizeClassName="h-[72px] w-[72px]"
          showDownload
        />
      ) : (
        <DetailEmptyState>등록된 원본 동영상 파일이 없습니다.</DetailEmptyState>
      )}
    </section>
  );
}

function formatCount(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) return "0";
  return value.toLocaleString();
}

function formatDuration(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value) || value < 0) {
    return "-";
  }

  const totalSeconds = Math.floor(value);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatPublishPeriod(detail: VideoViewResponse) {
  if (detail.is_publish_period_unlimited) {
    return "무기한 게시";
  }

  const start = formatLocalDateTime(detail.publish_start_at);
  const end = formatLocalDateTime(detail.publish_end_at);

  if (start === "-" && end === "-") return "-";
  if (start === "-") return `~ ${end}`;
  if (end === "-") return `${start} ~`;

  return `${start} ~ ${end}`;
}
