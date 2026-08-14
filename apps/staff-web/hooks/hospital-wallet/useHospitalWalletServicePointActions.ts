"use client";

import React from "react";
import { isApiSuccess } from "@beaulab/types";
import { useGlobalAlert } from "@beaulab/ui-admin";

import { usePersistentIdempotencyKeys } from "@/hooks/common/usePersistentIdempotencyKeys";
import { api } from "@/lib/common/api";
import {
  parseHospitalWalletInsufficientHospitals,
  type HospitalWalletBalanceChange,
  type HospitalWalletInsufficientHospital,
  type HospitalWalletRow,
  type HospitalWalletServicePointMode,
  type HospitalWalletServicePointResult,
} from "@/lib/hospital-wallet/list";

type Params = {
  selectedHospitalIds: Set<number>;
  clearSelection: () => void;
  setRows: React.Dispatch<React.SetStateAction<HospitalWalletRow[]>>;
  setRecentChanges: React.Dispatch<React.SetStateAction<Map<number, HospitalWalletBalanceChange>>>;
  refreshRows: () => void;
};

export function useHospitalWalletServicePointActions({
  selectedHospitalIds,
  clearSelection,
  setRows,
  setRecentChanges,
  refreshRows,
}: Params) {
  const { showAlert } = useGlobalAlert();
  const idempotency = usePersistentIdempotencyKeys("hospital-wallet-service-point");
  const [mode, setMode] = React.useState<HospitalWalletServicePointMode | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [insufficientHospitals, setInsufficientHospitals] = React.useState<HospitalWalletInsufficientHospital[]>([]);

  const open = React.useCallback(
    (nextMode: HospitalWalletServicePointMode) => {
      if (selectedHospitalIds.size === 0) return;

      setSubmitError(null);
      setInsufficientHospitals([]);
      setMode(nextMode);
    },
    [selectedHospitalIds.size],
  );

  const close = React.useCallback(() => {
    if (submitting) return;

    setSubmitError(null);
    setInsufficientHospitals([]);
    setMode(null);
  }, [submitting]);

  const submit = React.useCallback(
    async (amount: number, reason: string) => {
      if (!mode || selectedHospitalIds.size === 0) return;

      const hospitalIds = Array.from(selectedHospitalIds).sort((a, b) => a - b);
      const signature = JSON.stringify({ mode, hospitalIds, amount, reason });
      const idempotencyKey = idempotency.getOrCreate(signature);

      setSubmitting(true);
      setSubmitError(null);
      setInsufficientHospitals([]);

      try {
        const response = await api.post<HospitalWalletServicePointResult>(
          mode === "grant" ? "/hospital-wallets/service-grants" : "/hospital-wallets/service-reclaims",
          {
            hospital_ids: hospitalIds,
            amount,
            reason,
            idempotency_key: idempotencyKey,
          },
        );

        if (!isApiSuccess(response)) {
          const nextInsufficientHospitals =
            mode === "reclaim" ? parseHospitalWalletInsufficientHospitals(response.error.details) : [];

          setInsufficientHospitals(nextInsufficientHospitals);
          setSubmitError(
            nextInsufficientHospitals.length > 0
              ? "회수 포인트가 서비스 잔여 포인트를 초과할 수 없습니다."
              : response.error.message ||
                  (mode === "grant" ? "서비스 포인트 지급에 실패했습니다." : "서비스 포인트 회수에 실패했습니다."),
          );
          return;
        }

        const balancesByHospitalId = new Map(
          response.data.items
            .filter((item) => item.hospital?.id)
            .map((item) => [
              Number(item.hospital?.id),
              {
                totalBalance: Number(item.total_balance),
                paidBalance: Number(item.paid_balance),
                serviceBalance: Number(item.service_balance),
              },
            ]),
        );

        setRows((currentRows) =>
          currentRows.map((row) => {
            const balances = balancesByHospitalId.get(row.hospitalId);
            return balances ? { ...row, ...balances } : row;
          }),
        );

        const completedMode = mode;
        const completedChanges = new Map<number, HospitalWalletBalanceChange>();
        response.data.items.forEach((item) => {
          const hospitalId = Number(item.hospital?.id ?? 0);
          if (hospitalId > 0) {
            completedChanges.set(hospitalId, {
              mode: completedMode,
              amount: Math.abs(Number(item.amount ?? amount)),
            });
          }
        });

        idempotency.confirm(signature);
        setMode(null);
        setInsufficientHospitals([]);
        setRecentChanges(completedChanges);
        clearSelection();
        showAlert({
          variant: "success",
          title: completedMode === "grant" ? "서비스 포인트 지급 완료" : "서비스 포인트 회수 완료",
          message: `${Number(response.data.processed_count ?? hospitalIds.length).toLocaleString("ko-KR")}개 병의원에 서비스 포인트 ${amount.toLocaleString("ko-KR")} P를 ${completedMode === "grant" ? "지급했습니다." : "회수했습니다."}`,
        });
        refreshRows();
      } catch {
        setSubmitError(
          mode === "grant"
            ? "서비스 포인트 지급 중 오류가 발생했습니다."
            : "서비스 포인트 회수 중 오류가 발생했습니다.",
        );
      } finally {
        setSubmitting(false);
      }
    },
    [clearSelection, idempotency, mode, refreshRows, selectedHospitalIds, setRecentChanges, setRows, showAlert],
  );

  return {
    mode,
    submitting,
    submitError,
    insufficientHospitals,
    open,
    close,
    submit,
  };
}
