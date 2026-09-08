"use client";

import React from "react";
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
} from "@beaulab/ui-admin";

import { useHospitalWalletRefundStatus } from "@/hooks/hospital-wallet/useHospitalWalletRefundStatus";
import type { WalletOperationRow } from "@/lib/hospital-wallet/history";

export function HospitalWalletRefundStatusModal({
  row,
  onClose,
  onProcessed,
}: {
  row: WalletOperationRow | null;
  onClose: () => void;
  onProcessed: () => void;
}) {
  const { targetStatus, rejectionReason, submitError, submitting, selectStatus, changeRejectionReason, submit } =
    useHospitalWalletRefundStatus({ row, onProcessed });

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
              onChange={() => selectStatus("COMPLETED")}
            />
            <FormRadio
              id="hospital-wallet-refund-rejected"
              name="hospital-wallet-refund-status"
              value="REJECTED"
              label="환불반려"
              checked={targetStatus === "REJECTED"}
              disabled={submitting}
              onChange={() => selectStatus("REJECTED")}
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
                onChange={(event) => changeRejectionReason(event.target.value)}
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
          <Button type="button" variant="brand" disabled={!targetStatus || submitting} onClick={() => void submit()}>
            {submitting ? "저장 중..." : "저장"}
          </Button>
        </ModalFooter>
      </ModalPanel>
    </Modal>
  );
}

export default HospitalWalletRefundStatusModal;
