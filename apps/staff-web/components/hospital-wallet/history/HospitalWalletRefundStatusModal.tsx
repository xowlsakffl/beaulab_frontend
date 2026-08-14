"use client";

import React from "react";
import { isApiSuccess } from "@beaulab/types";
import {
  Button,
  FormRadio,
  InputField,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalPanel,
  ModalTitle,
  useGlobalAlert,
} from "@beaulab/ui-admin";

import { api } from "@/lib/common/api";
import type { WalletOperationRow } from "@/lib/hospital-wallet/history";

type RefundTargetStatus = "COMPLETED" | "REJECTED";

type RefundProcessResponse = {
  refund: {
    operation_id: number;
    status: string;
  };
};

export function HospitalWalletRefundStatusModal({
  row,
  onClose,
  onProcessed,
}: {
  row: WalletOperationRow | null;
  onClose: () => void;
  onProcessed: () => void;
}) {
  const { showAlert } = useGlobalAlert();
  const [targetStatus, setTargetStatus] = React.useState<RefundTargetStatus | null>(null);
  const [rejectionReason, setRejectionReason] = React.useState("");
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const processAttemptRef = React.useRef<{ signature: string; key: string } | null>(null);

  React.useEffect(() => {
    setTargetStatus(null);
    setRejectionReason("");
    setSubmitError(null);
    processAttemptRef.current = null;
  }, [row?.id]);

  const submitProcess = async () => {
    if (!row || !targetStatus || submitting) return;

    const trimmedReason = rejectionReason.trim();
    if (targetStatus === "REJECTED" && !trimmedReason) {
      setSubmitError("환불 반려 사유를 입력해 주세요.");
      return;
    }

    const signature = JSON.stringify({ operationId: row.id, targetStatus, reason: trimmedReason });
    const previousAttempt = processAttemptRef.current;
    const idempotencyKey = previousAttempt?.signature === signature ? previousAttempt.key : window.crypto.randomUUID();
    processAttemptRef.current = { signature, key: idempotencyKey };
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

      processAttemptRef.current = null;
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
  };

  return (
    <Modal isOpen={row !== null} onClose={submitting ? () => undefined : onClose} className="mx-4 w-full max-w-md">
      <ModalPanel>
        <ModalHeader>
          <ModalTitle>환불상태 변경</ModalTitle>
        </ModalHeader>
        <ModalBody className="space-y-6">
          <p className="text-sm text-gray-600">
            {row?.hospitalName ?? "-"} · HID {row?.hospitalId ?? "-"}
          </p>

          <div className="space-y-4">
            <FormRadio
              id="hospital-wallet-refund-completed"
              name="hospital-wallet-refund-status"
              value="COMPLETED"
              label="환불완료"
              checked={targetStatus === "COMPLETED"}
              disabled={submitting}
              onChange={() => {
                setTargetStatus("COMPLETED");
                setRejectionReason("");
                setSubmitError(null);
              }}
            />
            <FormRadio
              id="hospital-wallet-refund-rejected"
              name="hospital-wallet-refund-status"
              value="REJECTED"
              label="환불반려"
              checked={targetStatus === "REJECTED"}
              disabled={submitting}
              onChange={() => {
                setTargetStatus("REJECTED");
                setSubmitError(null);
              }}
            />
          </div>

          {targetStatus === "REJECTED" ? (
            <div>
              <Label htmlFor="hospital-wallet-refund-rejection-reason">반려사유</Label>
              <InputField
                id="hospital-wallet-refund-rejection-reason"
                value={rejectionReason}
                placeholder="반려사유를 입력해 주세요."
                error={Boolean(submitError && !rejectionReason.trim())}
                maxLength={500}
                disabled={submitting}
                onChange={(event) => {
                  setRejectionReason(event.target.value);
                  setSubmitError(null);
                }}
                className="bg-white"
              />
            </div>
          ) : null}

          {submitError ? <p className="text-xs text-error-500">{submitError}</p> : null}
        </ModalBody>
        <ModalFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            취소
          </Button>
          <Button
            type="button"
            variant="brand"
            disabled={!targetStatus || submitting}
            onClick={() => void submitProcess()}
          >
            {submitting ? "저장 중..." : "저장"}
          </Button>
        </ModalFooter>
      </ModalPanel>
    </Modal>
  );
}

export default HospitalWalletRefundStatusModal;
