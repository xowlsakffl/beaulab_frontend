"use client";

import React from "react";
import {
  Button,
  InlineFileSelect,
  InputField,
  Label,
  Modal,
  ModalBody,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalPanel,
  ModalTitle,
  Select,
} from "@beaulab/ui-admin";

import { BANK_OPTIONS } from "@/lib/common/banks";
import {
  REFUND_DOCUMENT_ACCEPT,
  REFUND_DOCUMENT_HELP_TEXT,
  validateRefundDocumentFile,
} from "@/lib/hospital-wallet/refund-documents";
import type { HospitalWalletRefundSubmitPayload, HospitalWalletRow } from "@/lib/hospital-wallet/list";

type FieldErrors = Partial<
  Record<"points" | "reason" | "bankName" | "accountNumber" | "businessRegistrationFile" | "bankbookFile", string>
>;

function digitsOnly(value: string) {
  return value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
}

export function HospitalWalletRefundModal({
  isOpen,
  hospital,
  directProcess,
  submitting,
  submitError,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  hospital: HospitalWalletRow | null;
  directProcess: boolean;
  submitting: boolean;
  submitError: string | null;
  onClose: () => void;
  onSubmit: (payload: HospitalWalletRefundSubmitPayload) => void;
}) {
  const [pointsInput, setPointsInput] = React.useState("");
  const [moneyInput, setMoneyInput] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [bankName, setBankName] = React.useState("");
  const [accountNumber, setAccountNumber] = React.useState("");
  const [businessRegistrationFile, setBusinessRegistrationFile] = React.useState<File | null>(null);
  const [bankbookFile, setBankbookFile] = React.useState<File | null>(null);
  const [errors, setErrors] = React.useState<FieldErrors>({});

  React.useEffect(() => {
    if (!isOpen) return;
    setPointsInput("");
    setMoneyInput("");
    setReason("");
    setBankName("");
    setAccountNumber("");
    setBusinessRegistrationFile(null);
    setBankbookFile(null);
    setErrors({});
  }, [isOpen, hospital?.hospitalId]);

  const points = Number(pointsInput || 0);
  const refundAmount = points > 0 ? Math.round(points * 1.1) : 0;
  const vatAmount = refundAmount - points;
  const exceedsBalance = Boolean(hospital && points > hospital.paidBalance);
  const actionLabel = directProcess ? "충전금 환불" : "충전금 환불 신청";

  const handlePointsChange = (value: string) => {
    const next = digitsOnly(value);
    const nextPoints = Number(next || 0);
    setPointsInput(next);
    setMoneyInput(nextPoints > 0 ? String(Math.round(nextPoints * 1.1)) : "");
    setErrors((current) => ({ ...current, points: undefined }));
  };

  const handleMoneyChange = (value: string) => {
    const next = digitsOnly(value);
    const nextMoney = Number(next || 0);
    const nextPoints = nextMoney > 0 ? Math.round(nextMoney / 1.1) : 0;
    setMoneyInput(next);
    setPointsInput(nextPoints > 0 ? String(nextPoints) : "");
    setErrors((current) => ({ ...current, points: undefined }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!hospital) return;

    const nextErrors: FieldErrors = {};
    if (!Number.isSafeInteger(points) || points < 1) nextErrors.points = "1 이상의 환불 포인트를 입력해 주세요.";
    else if (exceedsBalance) nextErrors.points = "보유 포인트를 초과했습니다.";
    if (!reason.trim()) nextErrors.reason = "환불 사유를 입력해 주세요.";
    if (!bankName.trim()) nextErrors.bankName = "환불계좌를 선택해 주세요.";
    if (!/^\d{6,30}$/.test(accountNumber)) nextErrors.accountNumber = "계좌번호를 숫자 6~30자리로 입력해 주세요.";
    const businessFileError = validateRefundDocumentFile(businessRegistrationFile);
    const bankbookFileError = validateRefundDocumentFile(bankbookFile);
    if (businessFileError) nextErrors.businessRegistrationFile = businessFileError;
    if (bankbookFileError) nextErrors.bankbookFile = bankbookFileError;
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    onSubmit({
      points,
      reason: reason.trim(),
      bankName: bankName.trim(),
      accountNumber,
      businessRegistrationFile,
      bankbookFile,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={submitting ? () => undefined : onClose}
      showCloseButton={false}
      className="mx-4 w-full max-w-xl"
    >
      <ModalPanel className="max-h-[92vh] overflow-y-auto">
        <ModalHeader className="pr-0">
          <ModalTitle>{actionLabel}</ModalTitle>
          <ModalDescription>
            {hospital ? `${hospital.hospitalName} · HID ${hospital.hospitalId}` : "병의원 정보"}
          </ModalDescription>
        </ModalHeader>

        <form onSubmit={handleSubmit}>
          <ModalBody>
            <div>
              <Label htmlFor="hospital-wallet-refund-points">포인트</Label>
              <div className="relative">
                <InputField
                  id="hospital-wallet-refund-points"
                  value={pointsInput ? points.toLocaleString("ko-KR") : ""}
                  inputMode="numeric"
                  placeholder="포인트"
                  error={Boolean(errors.points)}
                  disabled={submitting}
                  onChange={(event) => handlePointsChange(event.target.value)}
                  className="h-11 bg-white px-4 py-2.5 pr-9"
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-gray-500">
                  P
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                보유 유상 포인트 {hospital?.paidBalance.toLocaleString("ko-KR") ?? 0} P
              </p>
            </div>
            <div>
              <Label htmlFor="hospital-wallet-refund-money">금액</Label>
              <div className="relative">
                <InputField
                  id="hospital-wallet-refund-money"
                  value={moneyInput ? Number(moneyInput).toLocaleString("ko-KR") : ""}
                  inputMode="numeric"
                  placeholder="금액"
                  error={Boolean(errors.points)}
                  disabled={submitting}
                  onChange={(event) => handleMoneyChange(event.target.value)}
                  className="h-11 bg-white px-4 py-2.5 pr-10"
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-gray-500">
                  원
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500">부가세 10% 포함 금액이 자동 계산됩니다.</p>
            </div>

            {refundAmount > 0 ? (
              <div className="space-y-2 rounded-lg bg-gray-50 px-4 py-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>공급가액</span>
                  <span>{points.toLocaleString("ko-KR")}원</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>부가세(10%)</span>
                  <span>{vatAmount.toLocaleString("ko-KR")}원</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-2 font-semibold text-gray-900">
                  <span>환불 금액</span>
                  <span>{refundAmount.toLocaleString("ko-KR")}원</span>
                </div>
                {exceedsBalance ? <p className="text-xs text-error-500">보유 포인트를 초과했습니다.</p> : null}
              </div>
            ) : null}

            <div>
              <Label htmlFor="hospital-wallet-refund-reason">환불 사유</Label>
              <InputField
                id="hospital-wallet-refund-reason"
                value={reason}
                placeholder="환불 사유를 입력해 주세요."
                error={Boolean(errors.reason)}
                hint={errors.reason}
                maxLength={500}
                disabled={submitting}
                onChange={(event) => {
                  setReason(event.target.value);
                  setErrors((current) => ({ ...current, reason: undefined }));
                }}
                className="h-11 bg-white px-4 py-2.5"
              />
            </div>

            <div>
              <Label>환불 입금 계좌</Label>
              <div className="grid grid-cols-[9rem_minmax(0,1fr)] gap-2">
                <Select
                  value={bankName}
                  placeholder="환불계좌"
                  options={BANK_OPTIONS}
                  disabled={submitting}
                  onChange={(value) => {
                    setBankName(value);
                    setErrors((current) => ({ ...current, bankName: undefined }));
                  }}
                  className={
                    errors.bankName ? "h-11 border-error-500 bg-white px-4 py-2.5" : "h-11 bg-white px-4 py-2.5"
                  }
                />
                <InputField
                  value={accountNumber}
                  inputMode="numeric"
                  placeholder="환불받을 계좌번호"
                  error={Boolean(errors.accountNumber)}
                  disabled={submitting}
                  onChange={(event) => {
                    setAccountNumber(event.target.value.replace(/\D/g, "").slice(0, 30));
                    setErrors((current) => ({ ...current, accountNumber: undefined }));
                  }}
                  className="h-11 bg-white px-4 py-2.5"
                />
              </div>
              {errors.bankName || errors.accountNumber ? (
                <p className="mt-1 text-xs text-error-500">{errors.bankName ?? errors.accountNumber}</p>
              ) : null}
            </div>

            <div>
              <Label htmlFor="hospital-wallet-refund-business-file">첨부서류1 (사업자등록증)</Label>
              <InlineFileSelect
                id="hospital-wallet-refund-business-file"
                accept={REFUND_DOCUMENT_ACCEPT}
                fileName={businessRegistrationFile?.name}
                placeholder="사업자등록증 파일을 선택해 주세요."
                helperText={REFUND_DOCUMENT_HELP_TEXT}
                error={Boolean(errors.businessRegistrationFile)}
                disabled={submitting}
                onChange={(file) => {
                  setBusinessRegistrationFile(file);
                  setErrors((current) => ({ ...current, businessRegistrationFile: undefined }));
                }}
                onClear={businessRegistrationFile ? () => setBusinessRegistrationFile(null) : undefined}
              />
              {errors.businessRegistrationFile ? (
                <p className="mt-1 text-xs text-error-500">{errors.businessRegistrationFile}</p>
              ) : null}
            </div>
            <div>
              <Label htmlFor="hospital-wallet-refund-bankbook-file">첨부서류2 (통장 사본)</Label>
              <InlineFileSelect
                id="hospital-wallet-refund-bankbook-file"
                accept={REFUND_DOCUMENT_ACCEPT}
                fileName={bankbookFile?.name}
                placeholder="통장 사본 파일을 선택해 주세요."
                helperText={REFUND_DOCUMENT_HELP_TEXT}
                error={Boolean(errors.bankbookFile)}
                disabled={submitting}
                onChange={(file) => {
                  setBankbookFile(file);
                  setErrors((current) => ({ ...current, bankbookFile: undefined }));
                }}
                onClear={bankbookFile ? () => setBankbookFile(null) : undefined}
              />
              {errors.bankbookFile ? <p className="mt-1 text-xs text-error-500">{errors.bankbookFile}</p> : null}
            </div>

            {submitError ? <p className="text-xs text-error-500">{submitError}</p> : null}
          </ModalBody>

          <ModalFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              취소
            </Button>
            <Button type="submit" variant="brand" disabled={submitting || exceedsBalance || !hospital}>
              {submitting ? "처리 중..." : actionLabel}
            </Button>
          </ModalFooter>
        </form>
      </ModalPanel>
    </Modal>
  );
}
