"use client";

import React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { isApiSuccess } from "@beaulab/types";
import { Button, SpinnerBlock, type DataTableMeta } from "@beaulab/ui-admin";

import { AllowStatusConfirmModal } from "@/components/common/AllowStatusControls";
import { Can } from "@/components/common/guard";
import { LoadErrorState } from "@/components/common/LoadErrorState";
import { MediaPreviewModal, type MediaPreviewState } from "@/components/common/MediaPreviewModal";
import {
  ReportStatusConfirmModal,
  VideoInfoCard,
  VideoOperationHistoryCard,
  VideoOperationInfoCard,
  type ReportActionStatus,
  type VideoOperationHistoryItem,
} from "@/components/video/detail/VideoDetailSections";
import { api } from "@/lib/common/api";
import { usePageHeaderExtra } from "@/lib/common/routing/page-header-extra";
import { type VideoDetailResponse } from "@/lib/video/detail";
import { labelVideoAdminStatus, labelVideoReportStatus } from "@/lib/video/list";

const HISTORY_PER_PAGE = 10;

type ReportStatusResponse = {
  status?: string | null;
  label?: string | null;
  report_count?: number | null;
  process_reason?: string | null;
  updated_at?: string | null;
};

export default function VideoDetailPageClient() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawVideoId = Array.isArray(params.id) ? params.id[0] : params.id;
  const videoId = Number(rawVideoId);

  const [detail, setDetail] = React.useState<VideoDetailResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [previewMedia, setPreviewMedia] = React.useState<MediaPreviewState | null>(null);
  const [isForcedStopModalOpen, setIsForcedStopModalOpen] = React.useState(false);
  const [isNormalizeModalOpen, setIsNormalizeModalOpen] = React.useState(false);
  const [adminStatusReason, setAdminStatusReason] = React.useState("");
  const [adminStatusError, setAdminStatusError] = React.useState<string | null>(null);
  const [updatingAdminStatus, setUpdatingAdminStatus] = React.useState(false);
  const [pendingReportStatus, setPendingReportStatus] = React.useState<ReportActionStatus | null>(null);
  const [reportStatusReason, setReportStatusReason] = React.useState("");
  const [reportStatusReasonError, setReportStatusReasonError] = React.useState<string | null>(null);
  const [reportStatusError, setReportStatusError] = React.useState<string | null>(null);
  const [updatingReportStatus, setUpdatingReportStatus] = React.useState<ReportActionStatus | null>(null);
  const [histories, setHistories] = React.useState<VideoOperationHistoryItem[]>([]);
  const [historyMeta, setHistoryMeta] = React.useState<DataTableMeta | null>(null);
  const [historyPage, setHistoryPage] = React.useState(1);
  const [historiesLoading, setHistoriesLoading] = React.useState(false);

  const editPath = React.useMemo(() => {
    const rawReturnTo = searchParams.get("returnTo");
    if (!Number.isFinite(videoId) || videoId <= 0) {
      return "/video-manage/videos";
    }

    return rawReturnTo
      ? `/video-manage/videos/${videoId}/edit?returnTo=${encodeURIComponent(rawReturnTo)}`
      : `/video-manage/videos/${videoId}/edit`;
  }, [videoId, searchParams]);

  const headerAction = React.useMemo(() => {
    if (!Number.isFinite(videoId) || videoId <= 0) return null;

    return (
      <Can permission="beaulab.video.update">
        <Button type="button" variant="brand" size="sm" onClick={() => router.push(editPath)}>
          수정하기
        </Button>
      </Can>
    );
  }, [editPath, router, videoId]);

  const fetchVideo = React.useCallback(async () => {
    if (!Number.isFinite(videoId) || videoId <= 0) {
      setLoadError("잘못된 동영상 경로입니다.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      const response = await api.get<VideoDetailResponse>(`/videos/${videoId}`);
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

  const fetchHistories = React.useCallback(async () => {
    if (!Number.isFinite(videoId) || videoId <= 0) return;

    setHistoriesLoading(true);

    try {
      const response = await api.get<VideoOperationHistoryItem[]>(`/videos/${videoId}/operation-histories`, {
        operation_histories_page: historyPage,
        operation_histories_per_page: HISTORY_PER_PAGE,
      });

      if (isApiSuccess(response)) {
        setHistories(response.data);
        setHistoryMeta((response.meta as DataTableMeta | null) ?? null);
      }
    } finally {
      setHistoriesLoading(false);
    }
  }, [historyPage, videoId]);

  const refreshHistoriesFromFirstPage = React.useCallback(async () => {
    if (historyPage !== 1) {
      setHistoryPage(1);
      return;
    }

    await fetchHistories();
  }, [fetchHistories, historyPage]);

  React.useEffect(() => {
    void fetchVideo();
  }, [fetchVideo]);

  React.useEffect(() => {
    void fetchHistories();
  }, [fetchHistories]);

  usePageHeaderExtra(headerAction);

  const openForcedStopModal = React.useCallback(() => {
    setAdminStatusError(null);
    setAdminStatusReason("");
    setIsForcedStopModalOpen(true);
  }, []);

  const openNormalizeModal = React.useCallback(() => {
    setAdminStatusError(null);
    setAdminStatusReason("");
    setIsNormalizeModalOpen(true);
  }, []);

  const requestAdminStatusChange = React.useCallback(
    (adminStatus: "NORMAL" | "FORCED_STOPPED") => {
      if (adminStatus === "FORCED_STOPPED") {
        openForcedStopModal();
        return;
      }

      openNormalizeModal();
    },
    [openForcedStopModal, openNormalizeModal],
  );

  const closeForcedStopModal = React.useCallback(() => {
    if (updatingAdminStatus) return;

    setIsForcedStopModalOpen(false);
    setAdminStatusError(null);
    setAdminStatusReason("");
  }, [updatingAdminStatus]);

  const closeNormalizeModal = React.useCallback(() => {
    if (updatingAdminStatus) return;

    setIsNormalizeModalOpen(false);
    setAdminStatusError(null);
    setAdminStatusReason("");
  }, [updatingAdminStatus]);

  const submitAdminStatus = React.useCallback(
    async (adminStatus: string) => {
      if (!detail || updatingAdminStatus) return;

      const reason = adminStatusReason.trim();
      if (adminStatus === "FORCED_STOPPED" && !reason) {
        setAdminStatusError("강제중지 사유를 입력해주세요.");
        return;
      }

      setUpdatingAdminStatus(true);
      setAdminStatusError(null);

      try {
        const response = await api.patch<{ updated_count?: number; admin_status?: string; ids?: number[] }>(
          "/videos/admin-status",
          {
            ids: [detail.id],
            admin_status: adminStatus,
            ...(reason ? { reason } : {}),
          },
        );

        if (!isApiSuccess(response)) {
          setAdminStatusError(response.error.message || "강제중지 상태 변경에 실패했습니다.");
          return;
        }

        setDetail((prev) =>
          prev
            ? {
                ...prev,
                admin_status: adminStatus,
                admin_status_label: labelVideoAdminStatus(adminStatus),
              }
            : prev,
        );
        setIsForcedStopModalOpen(false);
        setIsNormalizeModalOpen(false);
        setAdminStatusReason("");
        await refreshHistoriesFromFirstPage();
      } catch {
        setAdminStatusError("강제중지 상태 변경 중 오류가 발생했습니다.");
      } finally {
        setUpdatingAdminStatus(false);
      }
    },
    [adminStatusReason, detail, refreshHistoriesFromFirstPage, updatingAdminStatus],
  );

  const openReportStatusModal = React.useCallback(
    (reportStatus: ReportActionStatus) => {
      if (detail?.report_state?.status === reportStatus || updatingReportStatus !== null) return;

      setPendingReportStatus(reportStatus);
      setReportStatusReason("");
      setReportStatusReasonError(null);
      setReportStatusError(null);
    },
    [detail?.report_state?.status, updatingReportStatus],
  );

  const closeReportStatusModal = React.useCallback(() => {
    if (updatingReportStatus !== null) return;

    setPendingReportStatus(null);
    setReportStatusReason("");
    setReportStatusReasonError(null);
    setReportStatusError(null);
  }, [updatingReportStatus]);

  const submitReportStatus = React.useCallback(async () => {
    if (!detail || !pendingReportStatus || updatingReportStatus !== null) return;

    const normalizedReason = reportStatusReason.trim();
    if (pendingReportStatus === "ADMIN_HIDDEN" && !normalizedReason) {
      setReportStatusReasonError("삭제처리 사유를 입력해주세요.");
      return;
    }

    setUpdatingReportStatus(pendingReportStatus);
    setReportStatusReasonError(null);
    setReportStatusError(null);

    try {
      const response = await api.patch<ReportStatusResponse>("/reported-contents/status", {
        target_type: "hospital_video",
        target_id: detail.id,
        report_status: pendingReportStatus,
        ...(normalizedReason ? { process_reason: normalizedReason } : {}),
      });

      if (!isApiSuccess(response)) {
        setReportStatusError(response.error.message || "신고상태 변경에 실패했습니다.");
        return;
      }

      const nextAdminStatus = pendingReportStatus === "ADMIN_HIDDEN" ? "FORCED_STOPPED" : "NORMAL";

      setDetail((prev) =>
        prev
          ? {
              ...prev,
              admin_status: nextAdminStatus,
              admin_status_label: labelVideoAdminStatus(nextAdminStatus),
              report_state: {
                ...prev.report_state,
                status: response.data.status ?? pendingReportStatus,
                label: response.data.label ?? labelVideoReportStatus(response.data.status ?? pendingReportStatus),
                report_count: response.data.report_count ?? prev.report_state?.report_count ?? 0,
                process_reason: response.data.process_reason ?? normalizedReason,
                updated_at: response.data.updated_at ?? new Date().toISOString(),
              },
            }
          : prev,
      );
      setPendingReportStatus(null);
      setReportStatusReason("");
      await refreshHistoriesFromFirstPage();
    } catch {
      setReportStatusError("신고상태 변경 중 오류가 발생했습니다.");
    } finally {
      setUpdatingReportStatus(null);
    }
  }, [detail, pendingReportStatus, refreshHistoriesFromFirstPage, reportStatusReason, updatingReportStatus]);

  if (isLoading) {
    return <SpinnerBlock className="min-h-[60vh]" spinnerClassName="size-10" label="동영상 정보를 불러오는 중" />;
  }

  if (loadError || !detail) {
    return (
      <LoadErrorState
        title="동영상 정보를 불러오지 못했습니다."
        message={loadError ?? "동영상 정보를 찾을 수 없습니다."}
        onRetry={() => void fetchVideo()}
      />
    );
  }

  return (
    <div className="min-w-0 space-y-4">
      <VideoInfoCard detail={detail} onPreview={setPreviewMedia} />

      <section className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">
        <VideoOperationInfoCard
          detail={detail}
          updatingAdminStatus={updatingAdminStatus}
          updatingReportStatus={updatingReportStatus}
          onAdminStatusChange={requestAdminStatusChange}
          onReportStatusChange={openReportStatusModal}
        />
        <VideoOperationHistoryCard
          histories={histories}
          meta={historyMeta}
          loading={historiesLoading}
          onPageChange={setHistoryPage}
        />
      </section>

      <MediaPreviewModal preview={previewMedia} onChange={setPreviewMedia} onClose={() => setPreviewMedia(null)} />
      <AllowStatusConfirmModal
        pending={isForcedStopModalOpen ? { allowStatus: "FORCED_STOPPED", reason: adminStatusReason } : null}
        title="강제중지 처리"
        subjectLabel="해당 동영상을"
        messageAction="처리"
        labelStatus={labelVideoAdminStatus}
        updating={updatingAdminStatus}
        error={adminStatusError}
        rejectStatus="FORCED_STOPPED"
        reasonInputId="video-forced-stop-reason"
        reasonLabel="강제중지 사유"
        reasonPlaceholder="강제중지 사유를 입력해주세요."
        processingText="처리 중"
        confirmText="등록"
        onReasonChange={setAdminStatusReason}
        onClose={closeForcedStopModal}
        onConfirm={() => void submitAdminStatus("FORCED_STOPPED")}
      />
      <AllowStatusConfirmModal
        pending={isNormalizeModalOpen ? { allowStatus: "NORMAL", reason: "" } : null}
        title="정상 처리"
        subjectLabel="해당 동영상을"
        messageAction="처리"
        labelStatus={labelVideoAdminStatus}
        updating={updatingAdminStatus}
        error={adminStatusError}
        rejectStatus="FORCED_STOPPED"
        reasonInputId="video-normal-reason"
        processingText="처리 중"
        confirmText="확인"
        onReasonChange={() => undefined}
        onClose={closeNormalizeModal}
        onConfirm={() => void submitAdminStatus("NORMAL")}
      />
      <ReportStatusConfirmModal
        pendingStatus={pendingReportStatus}
        reason={reportStatusReason}
        reasonError={reportStatusReasonError}
        error={reportStatusError}
        updating={updatingReportStatus !== null}
        onReasonChange={(value) => {
          setReportStatusReason(value);
          if (reportStatusReasonError) setReportStatusReasonError(null);
          if (reportStatusError) setReportStatusError(null);
        }}
        onClose={closeReportStatusModal}
        onConfirm={() => void submitReportStatus()}
      />
    </div>
  );
}
