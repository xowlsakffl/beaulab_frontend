"use client";

import React from "react";

import {
  Button,
  InputField,
  Label,
  Modal,
  ModalBody,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalPanel,
  ModalTitle,
} from "@beaulab/ui-admin";

import { HospitalWalletHospitalListHoverMemo } from "@/components/hospital-wallet/list/HospitalWalletHospitalListHoverMemo";
import type {
  HospitalWalletInsufficientHospital,
  HospitalWalletRow,
  HospitalWalletServicePointMode,
} from "@/lib/hospital-wallet/list";

type HospitalWalletServicePointModalProps = {
  isOpen: boolean;
  mode: HospitalWalletServicePointMode;
  selectedRows: HospitalWalletRow[];
  insufficientHospitals: HospitalWalletInsufficientHospital[];
  submitting: boolean;
  submitError: string | null;
  onClose: () => void;
  onSubmit: (amount: number, reason: string) => void;
};

function digitsOnly(value: string) {
  return value.replace(/[^0-9]/g, "").replace(/^0+(?=\d)/, "");
}

export function HospitalWalletServicePointModal({
  isOpen,
  mode,
  selectedRows,
  insufficientHospitals,
  submitting,
  submitError,
  onClose,
  onSubmit,
}: HospitalWalletServicePointModalProps) {
  const [amountInput, setAmountInput] = React.useState("");
  const [reasonInput, setReasonInput] = React.useState("");
  const [amountError, setAmountError] = React.useState<string | null>(null);
  const [reasonError, setReasonError] = React.useState<string | null>(null);
  const isGrant = mode === "grant";

  React.useEffect(() => {
    if (!isOpen) return;

    setAmountInput("");
    setReasonInput("");
    setAmountError(null);
    setReasonError(null);
  }, [isOpen, mode]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const amount = Number(amountInput);
    const nextAmountError =
      !amountInput || !Number.isSafeInteger(amount) || amount < 1 ? "1 이상의 서비스 포인트를 입력해 주세요." : null;
    const trimmedReason = reasonInput.trim();
    const nextReasonError = !trimmedReason
      ? "처리 사유를 입력해 주세요."
      : trimmedReason.length > 500
        ? "처리 사유는 500자 이하로 입력해 주세요."
        : null;

    setAmountError(nextAmountError);
    setReasonError(nextReasonError);

    if (nextAmountError || nextReasonError) return;

    onSubmit(amount, trimmedReason);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={submitting ? () => undefined : onClose}
      showCloseButton={false}
      className="mx-4 w-full max-w-lg"
    >
      <ModalPanel>
        <ModalHeader className="pr-0">
          <ModalTitle>{isGrant ? "서비스 포인트 지급" : "서비스 포인트 회수"}</ModalTitle>
          <ModalDescription>선택한 병의원에 동일한 포인트를 {isGrant ? "지급합니다." : "회수합니다."}</ModalDescription>
          <HospitalWalletHospitalListHoverMemo
            tooltipId="hospital-wallet-selected-hospitals"
            label={<>선택된 병의원 총 {selectedRows.length.toLocaleString("ko-KR")}개</>}
            hospitals={selectedRows.map((row) => ({ id: row.hospitalId, name: row.hospitalName }))}
            className="mt-3"
          />
        </ModalHeader>

        <form onSubmit={handleSubmit}>
          <ModalBody>
            <div>
              <Label htmlFor="hospital-wallet-service-point">서비스 포인트</Label>
              <div className="relative">
                <InputField
                  id="hospital-wallet-service-point"
                  value={amountInput ? Number(amountInput).toLocaleString("ko-KR") : ""}
                  inputMode="numeric"
                  placeholder="포인트를 입력해 주세요."
                  error={Boolean(amountError)}
                  hint={amountError ?? undefined}
                  disabled={submitting}
                  onChange={(event) => {
                    setAmountInput(digitsOnly(event.target.value));
                    setAmountError(null);
                  }}
                  className="bg-white pr-10"
                />
                <span className="pointer-events-none absolute top-3 right-4 text-sm font-medium text-gray-500">P</span>
              </div>
            </div>

            <div>
              <Label htmlFor="hospital-wallet-service-reason">처리 사유</Label>
              <InputField
                id="hospital-wallet-service-reason"
                value={reasonInput}
                placeholder={
                  isGrant ? "서비스 포인트 지급 사유를 입력해 주세요." : "서비스 포인트 회수 사유를 입력해 주세요."
                }
                error={Boolean(reasonError)}
                hint={reasonError ?? undefined}
                disabled={submitting}
                maxLength={500}
                onChange={(event) => {
                  setReasonInput(event.target.value);
                  setReasonError(null);
                }}
                className="bg-white"
              />
              {submitError ? (
                insufficientHospitals.length > 0 ? (
                  <HospitalWalletHospitalListHoverMemo
                    tooltipId="hospital-wallet-insufficient-hospitals"
                    label="회수 포인트가 서비스 잔여 포인트를 초과할 수 없습니다."
                    hospitals={insufficientHospitals}
                    variant="error"
                  />
                ) : (
                  <p className="text-xs text-error-500">{submitError}</p>
                )
              ) : null}
            </div>
          </ModalBody>

          <ModalFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              취소
            </Button>
            <Button type="submit" variant="brand" disabled={submitting || selectedRows.length === 0}>
              {submitting
                ? isGrant
                  ? "지급 중..."
                  : "회수 중..."
                : isGrant
                  ? "서비스 포인트 지급"
                  : "서비스 포인트 회수"}
            </Button>
          </ModalFooter>
        </form>
      </ModalPanel>
    </Modal>
  );
}
