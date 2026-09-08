"use client";

import React from "react";
import { isApiSuccess } from "@beaulab/types";
import { useGlobalAlert } from "@beaulab/ui-admin";

import { usePersistentIdempotencyKeys } from "@/hooks/common/usePersistentIdempotencyKeys";
import { api } from "@/lib/common/api";
import type { WalletOperationRow } from "@/lib/hospital-wallet/history";

export type RefundTargetStatus = "COMPLETED" | "REJECTED";

type RefundProcessResponse = {
  refund: { operation_id: number; status: string };
};

export function useHospitalWalletRefundStatus({
  row,
  onProcessed,
}: {
  row: WalletOperationRow | null;
  onProcessed: () => void;
}) {
  const { showAlert } = useGlobalAlert();
  const [targetStatus, setTargetStatus] = React.useState<RefundTargetStatus | null>(null);
  const [rejectionReason, setRejectionReason] = React.useState("");
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const processIdempotency = usePersistentIdempotencyKeys("hospital-wallet-refund-process");

  React.useEffect(() => {
    setTargetStatus(null);
    setRejectionReason("");
    setSubmitError(null);
  }, [row?.id]);

  const selectStatus = React.useCallback((status: RefundTargetStatus) => {
    setTargetStatus(status);
    if (status === "COMPLETED") setRejectionReason("");
    setSubmitError(null);
  }, []);

  const changeRejectionReason = React.useCallback((value: string) => {
    setRejectionReason(value);
    setSubmitError(null);
  }, []);

  const submit = React.useCallback(async () => {
    if (!row || !targetStatus || submitting) return;

    const trimmedReason = rejectionReason.trim();
    if (targetStatus === "REJECTED" && !trimmedReason) {
      setSubmitError("환불 반려 사유를 입력해 주세요.");
      return;
    }

    const signature = JSON.stringify({ operationId: row.id, targetStatus, reason: trimmedReason });
    const idempotencyKey = processIdempotency.getOrCreate(signature);
    setSubmitting(true);
    setSubmitError(null);

    try {
      const response = await api.patch<RefundProcessResponse>(`/hospital-wallet-operations/${row.id}/refund`, {
        status: targetStatus,
        rejection_reason: targetStatus === "REJECTED" ? trimmedReason : null,
        idempotency_key: idempotencyKey,
      });

      if (!isApiSuccess(response)) {
        setSubmitError(response.error.message || "환불 상태 변경에 실패했습니다.");
        return;
      }

      processIdempotency.confirm(signature);
      showAlert({
        variant: "success",
        title: "환불상태 변경",
        message: `환불 상태를 ${targetStatus === "COMPLETED" ? "환불완료" : "환불반려"}로 변경했습니다.`,
      });
      onProcessed();
    } catch {
      setSubmitError("환불 상태 변경 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }, [onProcessed, processIdempotency, rejectionReason, row, showAlert, submitting, targetStatus]);

  return {
    targetStatus,
    rejectionReason,
    submitError,
    submitting,
    selectStatus,
    changeRejectionReason,
    submit,
  };
}
