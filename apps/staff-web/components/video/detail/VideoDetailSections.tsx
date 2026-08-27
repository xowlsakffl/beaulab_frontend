"use client";

import React from "react";
import { isApiSuccess } from "@beaulab/types";
import {
  Button,
  Card,
  CategoryBadgeList,
  InputField,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalPanel,
  ModalTitle,
  type BadgeColor,
  type DataTableMeta,
  StatusValueBadge,
} from "@beaulab/ui-admin";

import { MediaPreviewState } from "@/components/common/MediaPreviewModal";
import { OperationHistoryCard as CommonOperationHistoryCard } from "@/components/common/OperationHistoryCard";
import {
  ReportedContentReportsList,
  reportedContentReportsTotal,
} from "@/components/reported-content/list/ReportedContentReportsList";
import { api } from "@/lib/common/api";
import { reportStatusBadgeColor } from "@/lib/common/report-status";
import { adminStatusColor } from "@/lib/common/status-labels";
import { type ReportedContentDetailReportItem, type ReportedContentReportsMeta } from "@/lib/reported-content/detail";
import { getVideoMediaFilename, resolveVideoMediaUrl, type VideoDetailResponse } from "@/lib/video/detail";
import {
  formatLocalDateTime,
  labelVideoAdminStatus,
  labelVideoHospitalStatus,
  labelVideoReportStatus,
  videoHospitalStatusColor,
} from "@/lib/video/list";

export const videoDetailCardClassName = "rounded-xl border border-gray-200 bg-white p-5";

const labelClassName = "pt-0.5 text-xs font-semibold text-gray-500";
const valueClassName = "min-w-0 break-words text-sm leading-6 text-gray-800";

export type VideoOperationHistoryChangeItem = {
  id?: number;
  field_key?: string | null;
  field_label?: string | null;
  before_value?: unknown;
  after_value?: unknown;
  before_display?: string | null;
  after_display?: string | null;
  sort_order?: number | null;
};

export type VideoOperationHistoryItem = {
  id: number;
  actor_label?: string | null;
  field?: string | null;
  action?: string | null;
  action_label?: string | null;
  changes?: VideoOperationHistoryChangeItem[] | null;
  before_value?: unknown;
  after_value?: unknown;
  reason?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string | null;
};

export type ReportActionStatus = "ADMIN_HIDDEN" | "NORMAL_VISIBLE";

export function VideoInfoCard({
  detail,
  onPreview,
}: {
  detail: VideoDetailResponse;
  onPreview: (preview: MediaPreviewState) => void;
}) {
  return (
    <Card className={videoDetailCardClassName}>
      <h2 className="mb-5 text-sm font-bold text-gray-900">동영상 정보</h2>
      <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-[30rem_minmax(0,1fr)]">
        <VideoThumbnailPreview detail={detail} onPreview={onPreview} />
        <div className="grid min-w-0 gap-x-8 gap-y-3 md:grid-cols-2">
          <InfoField label="병의원" value={detail.hospital?.name ?? detail.hospital_name} />
          <InfoField label="의료진" value={detail.doctor?.name ?? detail.doctor_name} />
          <BadgeInfoField label="카테고리" items={categoryLabels(detail)} />
          <BadgeInfoField label="해시태그" items={hashtagLabels(detail)} />
          <InfoField label="조회수" value={formatCount(detail.view_count)} />
          <InfoField label="좋아요수" value={formatCount(detail.like_count)} />
          <InfoField label="재생시간" value={formatDuration(detail.duration_seconds)} />
          <LinkInfoField label="유튜브 링크" href={detail.external_video_url} className="md:col-span-2" />
          <InfoField label="동영상 제목" value={detail.title} className="md:col-span-2" />
          <InfoField label="영상설명" value={detail.description} multiline className="md:col-span-2" />
        </div>
      </div>
    </Card>
  );
}

export function VideoOperationInfoCard({
  detail,
  canUpdateAdminStatus,
  canUpdateReportStatus,
  updatingAdminStatus,
  updatingReportStatus,
  onAdminStatusChange,
  onReportStatusChange,
}: {
  detail: VideoDetailResponse;
  canUpdateAdminStatus: boolean;
  canUpdateReportStatus: boolean;
  updatingAdminStatus: boolean;
  updatingReportStatus: ReportActionStatus | null;
  onAdminStatusChange: (status: "NORMAL" | "FORCED_STOPPED") => void;
  onReportStatusChange: (status: ReportActionStatus) => void;
}) {
  const isForcedStopped = detail.admin_status === "FORCED_STOPPED";

  return (
    <Card className={videoDetailCardClassName}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <h3 className="text-sm font-bold text-gray-900">운영정보</h3>
        {canUpdateAdminStatus ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={updatingAdminStatus}
            className="h-9 min-w-24 shrink-0 px-4 text-sm"
            onClick={() => onAdminStatusChange(isForcedStopped ? "NORMAL" : "FORCED_STOPPED")}
          >
            {isForcedStopped ? "정상노출" : "강제중지"}
          </Button>
        ) : (
          <StatusValueBadge
            label={labelVideoAdminStatus(detail.admin_status)}
            color={adminStatusColor(detail.admin_status)}
          />
        )}
        <span className="sr-only">현재 강제중지 상태: {labelVideoAdminStatus(detail.admin_status)}</span>
      </div>
      <div className="space-y-3">
        <InfoField label="업로드일" value={formatLocalDateTime(detail.created_at)} compact />
        <StatusInfoField
          label="공개여부"
          value={detail.hospital_status}
          fallbackLabel={detail.hospital_status_label}
          formatter={labelVideoHospitalStatus}
          color={videoHospitalStatusColor}
          compact
        />
        <ReportCountInfoField videoId={detail.id} reportCount={Number(detail.report_state?.report_count ?? 0)} />
        <ReportStatusActionField
          status={detail.report_state?.status ?? "NONE"}
          canUpdate={canUpdateReportStatus}
          updating={updatingReportStatus}
          onChange={onReportStatusChange}
        />
      </div>
    </Card>
  );
}

export function VideoOperationHistoryCard({
  histories,
  meta,
  loading,
  onPageChange,
}: {
  histories: VideoOperationHistoryItem[];
  meta: DataTableMeta | null;
  loading: boolean;
  onPageChange: (page: number) => void;
}) {
  return (
    <CommonOperationHistoryCard
      histories={histories}
      meta={meta}
      loading={loading}
      onPageChange={onPageChange}
      cardClassName={videoDetailCardClassName}
      formatDateTime={formatLocalDateTime}
      statusLabel={labelVideoReportStatus}
      statusBadgeColor={reportStatusBadgeColor}
    />
  );
}

export function ReportStatusConfirmModal({
  pendingStatus,
  reason,
  reasonError,
  error,
  updating,
  onReasonChange,
  onClose,
  onConfirm,
}: {
  pendingStatus: ReportActionStatus | null;
  reason: string;
  reasonError: string | null;
  error: string | null;
  updating: boolean;
  onReasonChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const isAdminHidden = pendingStatus === "ADMIN_HIDDEN";
  const confirmMessage = isAdminHidden
    ? "해당 영상을 삭제처리(미노출) 하시겠습니까?"
    : "해당 신고 건을 오류(허위신고)로 처리하시겠습니까?";

  return (
    <Modal isOpen={pendingStatus !== null} onClose={onClose} showCloseButton={false} className="mx-4 w-full max-w-md">
      <ModalPanel>
        <ModalHeader className="pr-0">
          <ModalTitle>신고상태 변경</ModalTitle>
        </ModalHeader>

        <ModalBody className="mt-6 space-y-5">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-800">{confirmMessage}</p>
            {!isAdminHidden ? (
              <p className="text-xs leading-5 text-gray-500">
                확인 시 72시간 동안 동일 영상에 대한 신규 신고 접수가 제한됩니다.
              </p>
            ) : null}
          </div>

          {isAdminHidden ? (
            <div>
              <label htmlFor="video-report-status-reason" className="mb-1.5 block text-sm font-semibold text-gray-800">
                삭제처리 사유
              </label>
              <InputField
                id="video-report-status-reason"
                value={reason}
                onChange={(event) => onReasonChange(event.target.value)}
                disabled={updating}
                error={Boolean(reasonError)}
                hint={reasonError ?? undefined}
              />
            </div>
          ) : null}

          {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
        </ModalBody>

        <ModalFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={updating}>
            취소
          </Button>
          <Button type="button" variant="brand" onClick={onConfirm} disabled={updating}>
            {updating ? "처리 중..." : "등록"}
          </Button>
        </ModalFooter>
      </ModalPanel>
    </Modal>
  );
}

function VideoThumbnailPreview({
  detail,
  onPreview,
}: {
  detail: VideoDetailResponse;
  onPreview: (preview: MediaPreviewState) => void;
}) {
  const thumbnailUrl = resolveVideoMediaUrl(detail.thumbnail_file);
  const isImage = Boolean(detail.thumbnail_file?.mime_type?.startsWith("image/") || thumbnailUrl);
  const title = getVideoMediaFilename(detail.thumbnail_file) || "동영상 썸네일";

  return (
    <div className="w-full">
      {thumbnailUrl ? (
        <button
          type="button"
          onClick={() =>
            onPreview({
              url: thumbnailUrl,
              title: "동영상 썸네일",
              isImage,
            })
          }
          className="flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl border border-gray-200"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- runtime storage URL */}
          <img src={thumbnailUrl} alt={title} className="h-full w-full object-cover" />
        </button>
      ) : (
        <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-dashed border-gray-300 text-xl font-bold text-gray-800">
          썸네일 없음
        </div>
      )}
    </div>
  );
}

function ReportCountInfoField({ videoId, reportCount }: { videoId: number; reportCount: number }) {
  const wrapperRef = React.useRef<HTMLDivElement | null>(null);
  const stickerRef = React.useRef<HTMLElement | null>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [reports, setReports] = React.useState<ReportedContentDetailReportItem[]>([]);
  const [meta, setMeta] = React.useState<ReportedContentReportsMeta | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const normalizedReportCount = Math.max(0, Number(reportCount || 0));
  const canOpen = normalizedReportCount > 0;

  React.useEffect(() => {
    setIsOpen(false);
    setPage(1);
    setReports([]);
    setMeta(null);
    setError(null);
  }, [videoId, normalizedReportCount]);

  React.useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (wrapperRef.current?.contains(target)) return;
      if (stickerRef.current?.contains(target)) return;

      setIsOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isOpen]);

  React.useEffect(() => {
    if (!isOpen || !canOpen) return;

    let isMounted = true;

    const fetchReports = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get<ReportedContentDetailReportItem[]>(
          `/reported-contents/hospital_video/${videoId}/reports`,
          { reports_page: page },
          { latestKey: `video:reports:${videoId}` },
        );

        if (!isMounted) return;

        if (!isApiSuccess(response)) {
          setReports([]);
          setMeta(null);
          setError(response.error.message || "신고내역을 불러오지 못했습니다.");
          return;
        }

        setReports(response.data ?? []);
        setMeta((response.meta as ReportedContentReportsMeta | null) ?? null);
      } catch {
        if (!isMounted) return;

        setReports([]);
        setMeta(null);
        setError("신고내역 조회 중 오류가 발생했습니다.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void fetchReports();

    return () => {
      isMounted = false;
    };
  }, [canOpen, isOpen, page, videoId]);

  const openSticker = React.useCallback(() => {
    if (!canOpen) return;

    setIsOpen((prev) => !prev);
  }, [canOpen]);

  return (
    <div ref={wrapperRef} className="relative grid grid-cols-[7.25rem_minmax(0,1fr)] gap-3">
      <p className={labelClassName}>신고횟수</p>
      <div className="flex min-h-[1.5rem] items-center">
        {canOpen ? (
          <button
            type="button"
            onClick={openSticker}
            className="text-sm leading-6 font-semibold text-gray-800 underline decoration-gray-300 underline-offset-4 transition hover:text-brand-500 hover:decoration-brand-500"
          >
            {normalizedReportCount.toLocaleString()}회
          </button>
        ) : (
          <span className={valueClassName}>0회</span>
        )}
      </div>

      {isOpen ? (
        <ReportCountSticker
          ref={stickerRef}
          reports={reports}
          meta={meta}
          loading={loading}
          error={error}
          total={normalizedReportCount}
          page={page}
          onPageChange={setPage}
          onClose={() => setIsOpen(false)}
        />
      ) : null}
    </div>
  );
}

type ReportCountStickerProps = {
  reports: ReportedContentDetailReportItem[];
  meta: ReportedContentReportsMeta | null;
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  onPageChange: (page: number) => void;
  onClose: () => void;
};

const ReportCountSticker = React.forwardRef<HTMLElement, ReportCountStickerProps>(function ReportCountSticker(
  { reports, meta, loading, error, total, page, onPageChange, onClose },
  ref,
) {
  const currentPage = Number(meta?.current_page ?? page);
  const displayTotal = reportedContentReportsTotal(meta, reports, total);

  return (
    <aside
      ref={ref}
      className="absolute top-full left-[7.25rem] z-30 mt-2 w-[34rem] rounded-xl border border-gray-200 bg-white p-4 shadow-xl"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-900">신고내역</p>
          <p className="mt-1 text-xs font-semibold text-gray-500">{displayTotal.toLocaleString()}건</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700"
          aria-label="신고내역 닫기"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M6.04289 16.5413C5.65237 16.9318 5.65237 17.565 6.04289 17.9555C6.43342 18.346 7.06658 18.346 7.45711 17.9555L11.9987 13.4139L16.5408 17.956C16.9313 18.3466 17.5645 18.3466 17.955 17.956C18.3455 17.5655 18.3455 16.9323 17.955 16.5418L13.4129 11.9997L17.955 7.4576C18.3455 7.06707 18.3455 6.43391 17.955 6.04338C17.5645 5.65286 16.9313 5.65286 16.5408 6.04338L11.9987 10.5855L7.45711 6.0439C7.06658 5.65338 6.43342 5.65338 6.04289 6.0439C5.65237 6.43442 5.65237 7.06759 6.04289 7.45811L10.5845 11.9997L6.04289 16.5413Z"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>

      <div className="mt-3">
        <ReportedContentReportsList
          reports={reports}
          meta={meta}
          loading={loading}
          error={error}
          page={currentPage}
          loadingLabel="신고내역을 불러오는 중"
          emptyLabel="신고내역이 없습니다."
          onPageChange={onPageChange}
        />
      </div>
    </aside>
  );
});

function InfoField({
  label,
  value,
  multiline = false,
  compact = false,
  className,
}: {
  label: string;
  value?: string | number | null;
  multiline?: boolean;
  compact?: boolean;
  className?: string;
}) {
  const displayValue = typeof value === "number" ? String(value) : value?.trim() || "-";

  return (
    <div
      className={[
        compact ? "grid grid-cols-[7.25rem_minmax(0,1fr)] gap-3" : "grid grid-cols-[8.5rem_minmax(0,1fr)] gap-4",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <p className={labelClassName}>{label}</p>
      <p className={[valueClassName, multiline ? "whitespace-pre-line" : ""].filter(Boolean).join(" ")}>
        {displayValue}
      </p>
    </div>
  );
}

function StatusInfoField({
  label,
  value,
  fallbackLabel,
  formatter,
  color,
  compact = false,
}: {
  label: string;
  value?: string | null;
  fallbackLabel?: string | null;
  formatter: (status?: string | null, fallbackLabel?: string) => string;
  color: (status?: string | null) => BadgeColor;
  compact?: boolean;
}) {
  const status = value?.trim() || "";

  return (
    <div
      className={[
        compact ? "grid grid-cols-[7.25rem_minmax(0,1fr)] gap-3" : "grid grid-cols-[8.5rem_minmax(0,1fr)] gap-4",
      ].join(" ")}
    >
      <p className={labelClassName}>{label}</p>
      <div className="flex min-h-[1.5rem] items-center">
        <StatusValueBadge
          label={formatter(status, fallbackLabel ?? undefined)}
          color={status ? color(status) : "light"}
        />
      </div>
    </div>
  );
}

function ReportStatusActionField({
  status,
  canUpdate,
  updating,
  onChange,
}: {
  status?: string | null;
  canUpdate: boolean;
  updating: ReportActionStatus | null;
  onChange: (status: ReportActionStatus) => void;
}) {
  const currentStatus = status?.trim() || "NONE";
  const hasReportState = currentStatus !== "NONE";
  const isAdminHidden = currentStatus === "ADMIN_HIDDEN";
  const isNormalVisible = isNormalVisibleReportStatus(currentStatus);

  return (
    <div className="grid grid-cols-[7.25rem_minmax(0,1fr)] gap-3">
      <p className={labelClassName}>신고상태</p>
      <div className="flex min-h-[1.5rem] flex-wrap items-center gap-2">
        {canUpdate ? (
          <>
            <Button
              type="button"
              variant={isAdminHidden ? "brand" : "outline"}
              size="sm"
              disabled={!hasReportState || isAdminHidden || updating !== null}
              title={!hasReportState ? "신고 접수 내역이 있어야 변경할 수 있습니다." : undefined}
              className={reportActionButtonClassName(isAdminHidden)}
              onClick={() => onChange("ADMIN_HIDDEN")}
            >
              {updating === "ADMIN_HIDDEN" ? "처리 중" : "삭제처리"}
            </Button>
            <Button
              type="button"
              variant={isNormalVisible ? "brand" : "outline"}
              size="sm"
              disabled={!hasReportState || isNormalVisible || updating !== null}
              title={!hasReportState ? "신고 접수 내역이 있어야 변경할 수 있습니다." : undefined}
              className={reportActionButtonClassName(isNormalVisible)}
              onClick={() => onChange("NORMAL_VISIBLE")}
            >
              {updating === "NORMAL_VISIBLE" ? "처리 중" : "신고오류"}
            </Button>
          </>
        ) : (
          <StatusValueBadge
            label={labelVideoReportStatus(currentStatus)}
            color={reportStatusBadgeColor(currentStatus)}
          />
        )}
      </div>
    </div>
  );
}

function LinkInfoField({ label, href, className }: { label: string; href?: string | null; className?: string }) {
  const trimmedHref = href?.trim();

  return (
    <div className={["grid grid-cols-[8.5rem_minmax(0,1fr)] gap-4", className].filter(Boolean).join(" ")}>
      <p className={labelClassName}>{label}</p>
      {trimmedHref ? (
        <a
          href={trimmedHref}
          target="_blank"
          rel="noreferrer"
          className="text-sm leading-6 break-all text-brand-600 underline underline-offset-2 hover:text-brand-500"
        >
          {trimmedHref}
        </a>
      ) : (
        <p className={valueClassName}>-</p>
      )}
    </div>
  );
}

function BadgeInfoField({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="grid grid-cols-[8.5rem_minmax(0,1fr)] gap-4">
      <p className={labelClassName}>{label}</p>
      <CategoryBadgeList values={items} empty={<span className={valueClassName}>-</span>} />
    </div>
  );
}

function categoryLabels(detail: VideoDetailResponse) {
  return (detail.categories ?? [])
    .map(
      (item) =>
        (item.full_path || item.name)
          .split(">")
          .map((part) => part.trim())
          .filter(Boolean)[0] ?? item.name,
    )
    .filter(Boolean);
}

function hashtagLabels(detail: VideoDetailResponse) {
  return (detail.hashtags ?? []).map((item) => `#${item.name}`).filter(Boolean);
}

function formatCount(value?: number | null) {
  return Number(value ?? 0).toLocaleString();
}

function formatDuration(value?: number | null) {
  if (!Number.isFinite(value) || Number(value) < 0) return "-";

  const totalSeconds = Math.floor(Number(value));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function isNormalVisibleReportStatus(status?: string | null) {
  return status === "NORMAL_VISIBLE" || status === "REEXPOSED";
}

function reportActionButtonClassName(active: boolean) {
  return ["h-11 min-w-24 px-6 text-sm font-semibold", active ? "" : "text-gray-500"].join(" ");
}
