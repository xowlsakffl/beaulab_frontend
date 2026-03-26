"use client";

import React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { isApiSuccess } from "@beaulab/types";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, FormSettingToggleRow, SpinnerBlock, StatusBadge } from "@beaulab/ui-admin";

import { Can } from "@/components/common/guard";
import { DetailCompactMediaCard, DetailEmptyState } from "@/components/common/DetailMediaCard";
import { api } from "@/lib/common/api";
import { buildReturnToPath } from "@/lib/common/navigation/buildReturnToPath";
import {
  formatBytes,
  formatLocalDateTime,
  getNoticeAttachmentFilename,
  labelNoticeChannel,
  labelNoticeStatus,
  resolveNoticeAttachmentUrl,
  type NoticeDetailResponse,
} from "@/lib/notice/form";

export default function NoticeDetailPageClient() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawNoticeId = Array.isArray(params.id) ? params.id[0] : params.id;
  const noticeId = Number(rawNoticeId);

  const [detail, setDetail] = React.useState<NoticeDetailResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const getReturnToPath = React.useCallback(
    (highlightId?: number) =>
      buildReturnToPath({
        searchParams,
        fallbackPath: "/notices",
        allowedPrefix: "/notices",
        highlightId,
      }),
    [searchParams],
  );

  const editPath = React.useMemo(() => {
    const rawReturnTo = searchParams.get("returnTo");
    if (!Number.isFinite(noticeId) || noticeId <= 0) {
      return "/notices";
    }

    return rawReturnTo
      ? `/notices/${noticeId}/edit?returnTo=${encodeURIComponent(rawReturnTo)}`
      : `/notices/${noticeId}/edit`;
  }, [noticeId, searchParams]);

  const fetchNotice = React.useCallback(async () => {
    if (!Number.isFinite(noticeId) || noticeId <= 0) {
      setLoadError("잘못된 공지사항 경로입니다.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      const response = await api.get<NoticeDetailResponse>(`/notices/${noticeId}`);
      if (!isApiSuccess(response)) {
        setLoadError(response.error.message || "공지사항 정보를 불러오지 못했습니다.");
        return;
      }

      setDetail(response.data);
    } catch {
      setLoadError("공지사항 정보를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [noticeId]);

  React.useEffect(() => {
    void fetchNotice();
  }, [fetchNotice]);

  if (isLoading) {
    return <SpinnerBlock className="min-h-[60vh]" spinnerClassName="size-10" />;
  }

  if (loadError || !detail) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>공지사항 정보를 불러오지 못했습니다.</CardTitle>
          <CardDescription>{loadError ?? "공지사항 정보를 찾을 수 없습니다."}</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2 pt-0">
          <Button type="button" variant="brand" onClick={() => void fetchNotice()}>
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
              <Can permission="beaulab.notice.update">
                <Button type="button" variant="brand" className="flex-1 sm:flex-none" onClick={() => router.push(editPath)}>
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
              <p className="text-xs text-gray-500 dark:text-gray-400">공지 채널과 작성 정보를 확인합니다.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <DetailField label="제목" value={detail.title} className="md:col-span-2" />
              <DetailField label="채널" value={labelNoticeChannel(detail.channel)} />
              <StatusField label="운영 상태" value={detail.status} />
              <DetailField label="조회수" value={detail.view_count.toLocaleString()} />
              <DetailField label="등록일" value={formatLocalDateTime(detail.created_at)} />
              <DetailField label="수정일" value={formatLocalDateTime(detail.updated_at)} />
            </div>
          </section>

          <section className="space-y-3">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">게시 옵션</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">설정값은 표시만 되며 상세 화면에서는 수정할 수 없습니다.</p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50/80 dark:border-gray-800 dark:bg-gray-900/50">
              <FormSettingToggleRow
                title="상단 공지"
                description="공지 목록 상단에 우선 노출합니다."
                checked={detail.is_pinned}
                onChange={() => undefined}
                disabled
              />

              <FormSettingToggleRow
                title="관리자 메인 팝업"
                description="관리자 메인 진입 시 팝업으로 노출합니다."
                checked={detail.is_important}
                onChange={() => undefined}
                disabled
              />

              <FormSettingToggleRow
                title="무기한 게시"
                description="게시 종료 없이 계속 노출합니다."
                checked={detail.is_publish_period_unlimited}
                onChange={() => undefined}
                disabled
                isLast
              >
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">게시 기간</p>
                  <p className="break-words text-sm leading-6 text-gray-800 dark:text-gray-100">{formatPublishPeriod(detail)}</p>
                </div>
              </FormSettingToggleRow>
            </div>
          </section>

          <section className="space-y-2">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">내용</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">공지사항 본문을 확인합니다.</p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
              {detail.content?.trim() ? (
                <div
                  className="notice-content-view break-words text-sm leading-7 text-gray-800 dark:text-gray-100 [&_a]:text-brand-600 [&_a]:underline [&_a]:underline-offset-2 [&_blockquote]:my-4 [&_blockquote]:border-l-2 [&_blockquote]:border-brand-300 [&_blockquote]:pl-4 [&_h2]:my-4 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:my-3 [&_h3]:text-base [&_h3]:font-semibold [&_img]:my-4 [&_img]:max-w-full [&_img]:rounded-xl [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-3 [&_ul]:list-disc [&_ul]:pl-6"
                  dangerouslySetInnerHTML={{ __html: detail.content }}
                />
              ) : (
                <DetailEmptyState>등록된 내용이 없습니다.</DetailEmptyState>
              )}
            </div>
          </section>
        </CardContent>
      </Card>

      <Card as="aside" className="min-w-0">
        <CardHeader className="pb-6">
          <CardTitle>첨부파일</CardTitle>
          <CardDescription>공지사항에 첨부된 파일을 확인합니다.</CardDescription>
        </CardHeader>

        <div className="space-y-4">
          {detail.attachments && detail.attachments.length > 0 ? (
            detail.attachments.map((attachment) => (
              <DetailCompactMediaCard
                key={attachment.id}
                fileName={getNoticeAttachmentFilename(attachment)}
                fileUrl={resolveNoticeAttachmentUrl(attachment)}
                sizeText={formatBytes(attachment.size) ?? undefined}
                previewFallbackText="파일"
                previewSizeClassName="h-[72px] w-[72px]"
              />
            ))
          ) : (
            <DetailEmptyState>등록된 첨부파일이 없습니다.</DetailEmptyState>
          )}
        </div>
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

function StatusField({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  const status = value?.trim() || "";
  const color = status === "ACTIVE" ? "success" : "error";

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <StatusBadge size="sm" color={color}>
        {labelNoticeStatus(status)}
      </StatusBadge>
    </div>
  );
}

function formatPublishPeriod(detail: NoticeDetailResponse) {
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
