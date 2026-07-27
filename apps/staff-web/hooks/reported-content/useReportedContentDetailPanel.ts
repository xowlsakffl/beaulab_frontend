"use client";

import React from "react";
import { isApiSuccess } from "@beaulab/types";

import { api } from "@/lib/common/api";
import type {
  ReportedContentDetailReportState,
  ReportedContentDetailResponse,
  ReportedContentReportsBlock,
  ReportedContentStatusUpdatePayload,
  ReportedContentTargetType,
  ReportedContentWarningStatusUpdatePayload,
} from "@/lib/reported-content/detail";

import { useReportedContentReports } from "./useReportedContentReports";

export type ReportActionStatus = "ADMIN_HIDDEN" | "NORMAL_VISIBLE";
export type WarningActionStatus = "WARNED" | "IGNORED";

function isValidTarget(targetId: number) {
  return Number.isFinite(targetId) && targetId > 0;
}

function isMatchingInitialDetail(
  detail: ReportedContentDetailResponse | null | undefined,
  targetType: ReportedContentTargetType,
  targetId: number,
) {
  return detail?.target_type === targetType && Number(detail.target_id) === targetId;
}

function mergeReportState(
  detail: ReportedContentDetailResponse | null,
  report: ReportedContentDetailReportState,
): ReportedContentDetailResponse | null {
  if (!detail) return detail;

  return {
    ...detail,
    report: {
      ...(detail.report ?? {}),
      ...report,
    },
  };
}

function resolveWarningCount(currentCount: number, beforeStatus: string, afterStatus: string) {
  if (afterStatus === "WARNED" && beforeStatus !== "WARNED") return currentCount + 1;
  if (beforeStatus === "WARNED" && afterStatus !== "WARNED") return Math.max(0, currentCount - 1);

  return currentCount;
}

function mergeWarningState(
  detail: ReportedContentDetailResponse | null,
  report: ReportedContentDetailReportState,
  beforeStatus: string,
  afterStatus: string,
): ReportedContentDetailResponse | null {
  const nextDetail = mergeReportState(detail, report);
  if (!nextDetail?.author) return nextDetail;

  const currentWarningCount = Number(nextDetail.author.warning_count ?? 0);

  return {
    ...nextDetail,
    author: {
      ...nextDetail.author,
      warning_count: resolveWarningCount(currentWarningCount, beforeStatus, afterStatus),
    },
  };
}

export function useReportedContentDetailPanel({
  targetType,
  targetId,
  initialDetail = null,
  initialReports = null,
  onStatusUpdated,
}: {
  targetType: ReportedContentTargetType;
  targetId: number;
  initialDetail?: ReportedContentDetailResponse | null;
  initialReports?: ReportedContentReportsBlock | null;
  onStatusUpdated?: () => void;
}) {
  const hasInitialDetail = isMatchingInitialDetail(initialDetail, targetType, targetId);
  const [detail, setDetail] = React.useState<ReportedContentDetailResponse | null>(
    hasInitialDetail ? initialDetail : null,
  );
  const [loading, setLoading] = React.useState(!hasInitialDetail);
  const [error, setError] = React.useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = React.useState<ReportActionStatus | null>(null);
  const [pendingStatus, setPendingStatus] = React.useState<ReportActionStatus | null>(null);
  const [updatingWarningStatus, setUpdatingWarningStatus] = React.useState<WarningActionStatus | null>(null);
  const [pendingWarningStatus, setPendingWarningStatus] = React.useState<WarningActionStatus | null>(null);
  const [isWarningUnavailableModalOpen, setIsWarningUnavailableModalOpen] = React.useState(false);
  const [processReason, setProcessReason] = React.useState("");
  const [modalError, setModalError] = React.useState<string | null>(null);
  const [warningModalError, setWarningModalError] = React.useState<string | null>(null);

  const reportsState = useReportedContentReports({
    targetType,
    targetId,
    initialReports,
    errorMessage: "신고 내역 조회에 실패했습니다.",
  });

  const fetchDetail = React.useCallback(async () => {
    if (!isValidTarget(targetId)) return;

    setLoading(true);
    setError(null);

    try {
      const response = await api.get<ReportedContentDetailResponse>(
        `/reported-contents/detail/${targetType}/${targetId}`,
        { include_target: 0 },
      );

      if (!isApiSuccess(response)) {
        setError(response.error.message || "신고 상세 조회에 실패했습니다.");
        return;
      }

      setDetail(response.data);
    } catch {
      setError("신고 상세 조회 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [targetId, targetType]);

  React.useEffect(() => {
    if (hasInitialDetail) {
      setDetail(initialDetail);
      setLoading(false);
      setError(null);
      return;
    }

    setDetail(null);
    setLoading(isValidTarget(targetId));
    setError(null);
  }, [hasInitialDetail, initialDetail, targetId, targetType]);

  React.useEffect(() => {
    if (hasInitialDetail) return;

    void fetchDetail();
  }, [fetchDetail, hasInitialDetail]);

  const reportState = detail?.report ?? null;
  const reportsTotal = Number(reportsState.meta?.total ?? reportsState.reports.length);
  const reportsCurrentPage = Number(reportsState.meta?.current_page ?? reportsState.page);
  const reportsLastPage = Math.max(1, Number(reportsState.meta?.last_page ?? 1));
  const reportStatus = reportState?.status?.trim() || "";
  const warningStatus = reportState?.warning_status?.trim() || "NONE";
  const warningCount = Number(detail?.author?.warning_count ?? 0);

  const updateReportStatus = React.useCallback(
    async (nextReportStatus: ReportActionStatus, reason?: string) => {
      setUpdatingStatus(nextReportStatus);
      setModalError(null);

      const payload: ReportedContentStatusUpdatePayload = {
        target_type: targetType,
        target_id: targetId,
        report_status: nextReportStatus,
      };
      const normalizedReason = reason?.trim();
      if (normalizedReason) payload.process_reason = normalizedReason;

      try {
        const response = await api.patch<ReportedContentDetailReportState>("/reported-contents/status", payload);

        if (!isApiSuccess(response)) {
          setModalError(response.error.message || "신고 처리 상태 변경에 실패했습니다.");
          return;
        }

        setDetail((current) => mergeReportState(current, response.data));
        onStatusUpdated?.();
        setPendingStatus(null);
        setProcessReason("");
      } catch {
        setModalError("신고 처리 상태 변경 중 오류가 발생했습니다.");
      } finally {
        setUpdatingStatus(null);
      }
    },
    [onStatusUpdated, targetId, targetType],
  );

  const updateWarningStatus = React.useCallback(
    async (nextWarningStatus: WarningActionStatus) => {
      setUpdatingWarningStatus(nextWarningStatus);
      setWarningModalError(null);

      const previousWarningStatus = warningStatus;
      const payload: ReportedContentWarningStatusUpdatePayload = {
        target_type: targetType,
        target_id: targetId,
        warning_status: nextWarningStatus,
      };

      try {
        const response = await api.patch<ReportedContentDetailReportState>(
          "/reported-contents/warning-status",
          payload,
        );

        if (!isApiSuccess(response)) {
          setWarningModalError(response.error.message || "경고 처리 상태 변경에 실패했습니다.");
          return;
        }

        setDetail((current) => mergeWarningState(current, response.data, previousWarningStatus, nextWarningStatus));
        onStatusUpdated?.();
        setPendingWarningStatus(null);
      } catch {
        setWarningModalError("경고 처리 상태 변경 중 오류가 발생했습니다.");
      } finally {
        setUpdatingWarningStatus(null);
      }
    },
    [onStatusUpdated, targetId, targetType, warningStatus],
  );

  const openStatusModal = React.useCallback(
    (nextReportStatus: ReportActionStatus) => {
      if (reportStatus === nextReportStatus) return;

      setPendingStatus(nextReportStatus);
      setProcessReason("");
      setModalError(null);
    },
    [reportStatus],
  );

  const closeStatusModal = React.useCallback(() => {
    if (updatingStatus !== null) return;

    setPendingStatus(null);
    setProcessReason("");
    setModalError(null);
  }, [updatingStatus]);

  const openWarningModal = React.useCallback(
    (nextWarningStatus: WarningActionStatus) => {
      if (reportState?.status?.trim() !== "ADMIN_HIDDEN") {
        setIsWarningUnavailableModalOpen(true);
        return;
      }

      setPendingWarningStatus(nextWarningStatus);
      setWarningModalError(null);
    },
    [reportState?.status],
  );

  const closeWarningModal = React.useCallback(() => {
    if (updatingWarningStatus !== null) return;

    setPendingWarningStatus(null);
    setWarningModalError(null);
  }, [updatingWarningStatus]);

  const changeProcessReason = React.useCallback((value: string) => {
    setProcessReason(value);
    setModalError(null);
  }, []);

  const submitStatusChange = React.useCallback(() => {
    if (!pendingStatus) return;

    void updateReportStatus(pendingStatus, pendingStatus === "ADMIN_HIDDEN" ? processReason : undefined);
  }, [pendingStatus, processReason, updateReportStatus]);

  const submitWarningStatusChange = React.useCallback(() => {
    if (!pendingWarningStatus) return;

    void updateWarningStatus(pendingWarningStatus);
  }, [pendingWarningStatus, updateWarningStatus]);

  return {
    detail,
    loading,
    error,
    reports: reportsState.reports,
    reportsMeta: reportsState.meta,
    reportsLoading: reportsState.loading,
    reportsError: reportsState.error,
    reportsCurrentPage,
    reportsLastPage,
    reportsTotal,
    setReportsPage: reportsState.setPage,
    reportState,
    reportStatus,
    warningStatus,
    warningCount,
    updatingStatus,
    updatingWarningStatus,
    pendingStatus,
    pendingWarningStatus,
    isWarningUnavailableModalOpen,
    processReason,
    modalError,
    warningModalError,
    isAdminHiddenButtonDisabled: reportStatus === "ADMIN_HIDDEN" || updatingStatus !== null,
    isNormalVisibleButtonDisabled: reportStatus === "NORMAL_VISIBLE" || updatingStatus !== null,
    isWarningButtonDisabled: warningStatus === "WARNED" || updatingWarningStatus !== null,
    isIgnoreButtonDisabled: warningStatus === "IGNORED" || updatingWarningStatus !== null,
    changeProcessReason,
    setIsWarningUnavailableModalOpen,
    openStatusModal,
    closeStatusModal,
    openWarningModal,
    closeWarningModal,
    submitStatusChange,
    submitWarningStatusChange,
  };
}
