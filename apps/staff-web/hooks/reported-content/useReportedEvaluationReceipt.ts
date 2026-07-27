"use client";

import React from "react";
import { isApiSuccess } from "@beaulab/types";

import { api } from "@/lib/common/api";
import type {
  HospitalEvaluationDetailResponse,
  HospitalEvaluationReceiptDecision,
} from "@/lib/hospital-evaluation/detail";

export const REPORTED_EVALUATION_RECEIPT_STATUS_VERIFIED = "VERIFIED";
export const REPORTED_EVALUATION_RECEIPT_STATUS_REJECTED = "REJECTED";

type ReceiptUpdateResponse = {
  id: number;
  receipt?: {
    status?: string | null;
    label?: string | null;
    rejection_reason?: string | null;
    rejection_reason_label?: string | null;
    rejection_reason_text?: string | null;
  } | null;
};

type ReceiptRejectPayload = {
  reason: string;
  reason_text?: string;
};

export function getReportedEvaluationReceiptStatus(detail: HospitalEvaluationDetailResponse | null): string {
  return detail?.receipt?.status?.trim() || "NONE";
}

function getReportedEvaluationReceiptDecision(status: string): HospitalEvaluationReceiptDecision {
  return status === REPORTED_EVALUATION_RECEIPT_STATUS_REJECTED ? "reject" : "verify";
}

export function getReportedEvaluationReceiptButtonLabel(status: string): string {
  if (status === REPORTED_EVALUATION_RECEIPT_STATUS_VERIFIED) return "영수증 인증";
  if (status === REPORTED_EVALUATION_RECEIPT_STATUS_REJECTED) return "영수증 부적합";

  return "영수증 등록";
}

export function isCurrentReportedEvaluationReceiptDecision(
  decision: HospitalEvaluationReceiptDecision,
  status: string,
): boolean {
  return (
    (decision === "verify" && status === REPORTED_EVALUATION_RECEIPT_STATUS_VERIFIED) ||
    (decision === "reject" && status === REPORTED_EVALUATION_RECEIPT_STATUS_REJECTED)
  );
}

function buildReceiptRejectPayload(reason: string, reasonText: string): ReceiptRejectPayload {
  return {
    reason,
    ...(reason === "OTHER" ? { reason_text: reasonText.trim() } : {}),
  };
}

export function useReportedEvaluationReceipt({
  evaluation,
  onBeforeSubmit,
  onSaved,
}: {
  evaluation: HospitalEvaluationDetailResponse | null;
  onBeforeSubmit?: () => void;
  onSaved: () => Promise<void>;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [decision, setDecision] = React.useState<HospitalEvaluationReceiptDecision>("verify");
  const [rejectReason, setRejectReason] = React.useState("");
  const [rejectReasonText, setRejectReasonText] = React.useState("");
  const [updating, setUpdating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const receiptStatus = getReportedEvaluationReceiptStatus(evaluation);
  const receiptButtonLabel = getReportedEvaluationReceiptButtonLabel(receiptStatus);

  const openModal = React.useCallback(() => {
    const nextDecision = getReportedEvaluationReceiptDecision(receiptStatus);

    setDecision(nextDecision);
    setRejectReason(nextDecision === "reject" ? evaluation?.receipt?.rejection_reason?.trim() || "" : "");
    setRejectReasonText(nextDecision === "reject" ? evaluation?.receipt?.rejection_reason_text?.trim() || "" : "");
    setError(null);
    setIsOpen(true);
  }, [evaluation?.receipt?.rejection_reason, evaluation?.receipt?.rejection_reason_text, receiptStatus]);

  const closeModal = React.useCallback(() => {
    if (updating) return;

    setIsOpen(false);
  }, [updating]);

  const changeRejectReason = React.useCallback((value: string) => {
    setRejectReason(value);
    if (value !== "OTHER") setRejectReasonText("");
  }, []);

  const submit = React.useCallback(async () => {
    if (!evaluation) return;

    setError(null);

    const currentStatus = getReportedEvaluationReceiptStatus(evaluation);

    if (isCurrentReportedEvaluationReceiptDecision(decision, currentStatus)) {
      setError(decision === "verify" ? "이미 인증 적합 처리된 영수증입니다." : "이미 인증 부적합 처리된 영수증입니다.");
      return;
    }

    if (decision === "reject" && !rejectReason) {
      setError("인증 부적합 사유를 선택해주세요.");
      return;
    }

    if (decision === "reject" && rejectReason === "OTHER" && !rejectReasonText.trim()) {
      setError("기타 사유를 입력해주세요.");
      return;
    }

    setUpdating(true);
    onBeforeSubmit?.();

    try {
      const response =
        decision === "verify"
          ? await api.patch<ReceiptUpdateResponse>(`/hospital-evaluations/${evaluation.id}/receipt/verify`, {})
          : await api.patch<ReceiptUpdateResponse>(
              `/hospital-evaluations/${evaluation.id}/receipt/reject`,
              buildReceiptRejectPayload(rejectReason, rejectReasonText),
            );

      if (!isApiSuccess(response)) {
        setError(response.error.message || "영수증 인증 상태 저장에 실패했습니다.");
        return;
      }

      setIsOpen(false);
      await onSaved();
    } catch {
      setError("영수증 인증 상태 저장 중 오류가 발생했습니다.");
    } finally {
      setUpdating(false);
    }
  }, [decision, evaluation, onBeforeSubmit, onSaved, rejectReason, rejectReasonText]);

  return {
    isOpen,
    decision,
    rejectReason,
    rejectReasonText,
    updating,
    error,
    receiptStatus,
    receiptButtonLabel,
    openModal,
    closeModal,
    setDecision,
    changeRejectReason,
    setRejectReasonText,
    submit,
  };
}
