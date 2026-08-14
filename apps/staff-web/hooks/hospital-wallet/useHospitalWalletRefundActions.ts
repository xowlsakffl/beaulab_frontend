"use client";

import React from "react";
import { isApiSuccess } from "@beaulab/types";
import { useGlobalAlert } from "@beaulab/ui-admin";

import { usePersistentIdempotencyKeys } from "@/hooks/common/usePersistentIdempotencyKeys";
import { api } from "@/lib/common/api";
import type {
  HospitalWalletBalanceChange,
  HospitalWalletRefundCreateResult,
  HospitalWalletRefundSubmitPayload,
  HospitalWalletRow,
} from "@/lib/hospital-wallet/list";

type Params = {
  selectedRows: HospitalWalletRow[];
  selectedHospitalCount: number;
  clearSelection: () => void;
  setRows: React.Dispatch<React.SetStateAction<HospitalWalletRow[]>>;
  setRecentChanges: React.Dispatch<React.SetStateAction<Map<number, HospitalWalletBalanceChange>>>;
  refreshRows: () => void;
};

export function useHospitalWalletRefundActions({
  selectedRows,
  selectedHospitalCount,
  clearSelection,
  setRows,
  setRecentChanges,
  refreshRows,
}: Params) {
  const { showAlert } = useGlobalAlert();
  const idempotency = usePersistentIdempotencyKeys("hospital-wallet-refund");
  const [isOpen, setIsOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const open = React.useCallback(() => {
    if (selectedHospitalCount === 0) return;
    if (selectedHospitalCount > 1) {
      showAlert({
        variant: "warning",
        title: "병의원 선택 확인",
        message: "충전금 환불은 1개의 병의원만 선택할 수 있습니다.",
      });
      return;
    }

    setSubmitError(null);
    setIsOpen(true);
  }, [selectedHospitalCount, showAlert]);

  const close = React.useCallback(() => {
    if (submitting) return;

    setSubmitError(null);
    setIsOpen(false);
  }, [submitting]);

  const submit = React.useCallback(
    async (payload: HospitalWalletRefundSubmitPayload) => {
      const hospital = selectedRows[0];
      if (!hospital) return;

      const signature = JSON.stringify({
        hospitalId: hospital.hospitalId,
        points: payload.points,
        reason: payload.reason,
        bankName: payload.bankName,
        accountNumber: payload.accountNumber,
        businessFile: payload.businessRegistrationFile
          ? [
              payload.businessRegistrationFile.name,
              payload.businessRegistrationFile.size,
              payload.businessRegistrationFile.lastModified,
            ]
          : null,
        bankbookFile: payload.bankbookFile
          ? [payload.bankbookFile.name, payload.bankbookFile.size, payload.bankbookFile.lastModified]
          : null,
      });
      const idempotencyKey = idempotency.getOrCreate(signature);
      const formData = new FormData();
      formData.append("hospital_id", String(hospital.hospitalId));
      formData.append("amount", String(payload.points));
      formData.append("reason", payload.reason);
      formData.append("bank_name", payload.bankName);
      formData.append("account_number", payload.accountNumber);
      if (payload.businessRegistrationFile) {
        formData.append("business_registration_file", payload.businessRegistrationFile);
      }
      if (payload.bankbookFile) {
        formData.append("bankbook_file", payload.bankbookFile);
      }
      formData.append("idempotency_key", idempotencyKey);

      setSubmitting(true);
      setSubmitError(null);

      try {
        const response = await api.post<HospitalWalletRefundCreateResult>("/hospital-wallets/refunds", formData);
        if (!isApiSuccess(response)) {
          setSubmitError(response.error.message || "충전금 환불 처리에 실패했습니다.");
          return;
        }

        const wallet = response.data.wallet;
        setRows((currentRows) =>
          currentRows.map((row) =>
            row.hospitalId === hospital.hospitalId
              ? {
                  ...row,
                  totalBalance: Number(wallet.total_balance),
                  paidBalance: Number(wallet.paid_balance),
                  ownedPaidBalance: Number(wallet.owned_paid_balance),
                  reservedPaidBalance: Number(wallet.reserved_paid_balance),
                  serviceBalance: Number(wallet.service_balance),
                }
              : row,
          ),
        );
        setRecentChanges(new Map([[hospital.hospitalId, { mode: "refund", amount: payload.points }]]));
        idempotency.confirm(signature);
        setIsOpen(false);
        clearSelection();
        showAlert({
          variant: "success",
          title: response.data.direct_processed ? "충전금 환불 완료" : "충전금 환불 신청 완료",
          message: response.data.direct_processed
            ? `${hospital.hospitalName}의 충전금 ${payload.points.toLocaleString("ko-KR")} P를 환불 처리했습니다.`
            : `${hospital.hospitalName}의 충전금 환불을 신청했습니다.`,
        });
        refreshRows();
      } catch {
        setSubmitError("충전금 환불 처리 중 오류가 발생했습니다.");
      } finally {
        setSubmitting(false);
      }
    },
    [clearSelection, idempotency, refreshRows, selectedRows, setRecentChanges, setRows, showAlert],
  );

  return { isOpen, submitting, submitError, open, close, submit };
}
