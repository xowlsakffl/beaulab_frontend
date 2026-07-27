"use client";

import React from "react";
import { isApiSuccess } from "@beaulab/types";

import { api } from "@/lib/common/api";
import type { ReportedContentDetailReportState, ReportedContentProcessPayload } from "@/lib/reported-content/detail";
import type { ReportedContentRow } from "@/lib/reported-content/list";

export type ReportActionStatus = "ADMIN_HIDDEN" | "NORMAL_VISIBLE";
export type WarningActionStatus = "WARNED" | "IGNORED";
export type ReportedContentProcessStep = "status" | "warning";

function isNormalVisibleStatus(status?: string | null) {
  return status === "NORMAL_VISIBLE" || status === "REEXPOSED";
}

export function useReportedContentProcessModal({
  row,
  onClose,
  onProcessed,
}: {
  row: ReportedContentRow | null;
  onClose: () => void;
  onProcessed: () => void;
}) {
  const [step, setStep] = React.useState<ReportedContentProcessStep>("status");
  const [reportStatus, setReportStatus] = React.useState<ReportActionStatus | null>(null);
  const [processReason, setProcessReason] = React.useState("");
  const [warningStatus, setWarningStatus] = React.useState<WarningActionStatus | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [reasonError, setReasonError] = React.useState<string | null>(null);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setStep("status");
    setReportStatus(null);
    setProcessReason("");
    setWarningStatus(null);
    setSubmitting(false);
    setReasonError(null);
    setSubmitError(null);
  }, [row]);

  const close = React.useCallback(() => {
    if (submitting) return;
    onClose();
  }, [onClose, submitting]);

  const selectReportStatus = React.useCallback((nextReportStatus: ReportActionStatus) => {
    setReportStatus(nextReportStatus);
    setReasonError(null);
    setSubmitError(null);
  }, []);

  const changeProcessReason = React.useCallback((value: string) => {
    setProcessReason(value);
    setReasonError(null);
    setSubmitError(null);
  }, []);

  const selectWarningStatus = React.useCallback((nextWarningStatus: WarningActionStatus) => {
    setWarningStatus(nextWarningStatus);
    setSubmitError(null);
  }, []);

  const submit = React.useCallback(async () => {
    if (!row || !reportStatus) return;

    const payload: ReportedContentProcessPayload = {
      target_type: row.targetType,
      target_id: row.id,
      report_status: reportStatus,
    };

    if (reportStatus === "ADMIN_HIDDEN") {
      const normalizedReason = processReason.trim();
      if (!normalizedReason) {
        setReasonError("노출중지 사유를 입력해주세요.");
        return;
      }

      if (!warningStatus) {
        setSubmitError("경고여부를 선택해주세요.");
        return;
      }

      payload.process_reason = normalizedReason;
      payload.warning_status = warningStatus;
    }

    setSubmitting(true);
    setReasonError(null);
    setSubmitError(null);

    try {
      const response = await api.patch<ReportedContentDetailReportState>("/reported-contents/process", payload);

      if (!isApiSuccess(response)) {
        setSubmitError(response.error.message || "신고 조치 처리에 실패했습니다.");
        return;
      }

      onProcessed();
      onClose();
    } catch {
      setSubmitError("신고 조치 처리 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }, [onClose, onProcessed, processReason, reportStatus, row, warningStatus]);

  const moveNext = React.useCallback(() => {
    if (reportStatus !== "ADMIN_HIDDEN") return;

    if (!processReason.trim()) {
      setReasonError("노출중지 사유를 입력해주세요.");
      return;
    }

    setReasonError(null);
    setSubmitError(null);
    setStep("warning");
  }, [processReason, reportStatus]);

  return {
    step,
    reportStatus,
    processReason,
    warningStatus,
    submitting,
    reasonError,
    submitError,
    title: step === "warning" ? "경고여부" : "조치유형",
    adminHiddenDisabled: row?.status === "ADMIN_HIDDEN" || submitting,
    normalVisibleDisabled: isNormalVisibleStatus(row?.status) || submitting,
    warningDisabled: row?.warningStatus === "WARNED" || submitting,
    ignoredDisabled: row?.warningStatus === "IGNORED" || submitting,
    close,
    submit,
    moveNext,
    selectReportStatus,
    changeProcessReason,
    selectWarningStatus,
  };
}
