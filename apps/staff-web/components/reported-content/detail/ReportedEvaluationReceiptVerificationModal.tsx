"use client";

import React from "react";
import {
  Button,
  FormCheckbox,
  InputField,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalPanel,
  ModalTitle,
  Select,
} from "@beaulab/ui-admin";

import type { MediaPreviewState } from "@/components/common/MediaPreviewModal";
import {
  REPORTED_EVALUATION_RECEIPT_STATUS_REJECTED,
  REPORTED_EVALUATION_RECEIPT_STATUS_VERIFIED,
  isCurrentReportedEvaluationReceiptDecision,
} from "@/hooks/reported-content/useReportedEvaluationReceipt";
import {
  HOSPITAL_EVALUATION_RECEIPT_REJECTION_OPTIONS,
  resolveHospitalEvaluationMediaUrl,
  type HospitalEvaluationMediaAsset,
  type HospitalEvaluationReceiptDecision,
} from "@/lib/hospital-evaluation/detail";

export function ReportedEvaluationReceiptVerificationModal({
  isOpen,
  image,
  currentStatus,
  decision,
  rejectReason,
  rejectReasonText,
  error,
  updating,
  onClose,
  onDecisionChange,
  onRejectReasonChange,
  onRejectReasonTextChange,
  onSubmit,
  onPreviewMedia,
}: {
  isOpen: boolean;
  image: HospitalEvaluationMediaAsset | null;
  currentStatus: string;
  decision: HospitalEvaluationReceiptDecision;
  rejectReason: string;
  rejectReasonText: string;
  error: string | null;
  updating: boolean;
  onClose: () => void;
  onDecisionChange: (decision: HospitalEvaluationReceiptDecision) => void;
  onRejectReasonChange: (value: string) => void;
  onRejectReasonTextChange: (value: string) => void;
  onSubmit: () => void;
  onPreviewMedia: (preview: MediaPreviewState) => void;
}) {
  const imageUrl = resolveHospitalEvaluationMediaUrl(image);
  const isVerifyCurrent = currentStatus === REPORTED_EVALUATION_RECEIPT_STATUS_VERIFIED;
  const isRejectCurrent = currentStatus === REPORTED_EVALUATION_RECEIPT_STATUS_REJECTED;
  const isCurrentDecision = isCurrentReportedEvaluationReceiptDecision(decision, currentStatus);
  const rejectInputsDisabled = updating || isRejectCurrent;

  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton={false} className="mx-4 w-full max-w-lg">
      <ModalPanel>
        <ModalHeader className="pr-0">
          <ModalTitle>영수증 인증</ModalTitle>
        </ModalHeader>

        <ModalBody className="mt-6 space-y-6">
          <div className="mx-auto flex aspect-square w-full max-w-[15rem] items-center justify-center overflow-hidden rounded-2xl bg-gray-100 text-sm font-medium text-gray-500">
            {imageUrl ? (
              <button
                type="button"
                className="block h-full w-full"
                onClick={() =>
                  onPreviewMedia({
                    url: imageUrl,
                    title: "영수증 사진",
                    isImage: true,
                    items: [{ url: imageUrl, title: "영수증 사진", isImage: true }],
                    index: 0,
                  })
                }
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- runtime storage URL */}
                <img src={imageUrl} alt="영수증 사진" className="h-full w-full object-cover" />
              </button>
            ) : (
              "영수증 사진"
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <ReportedReceiptDecisionOption
              label="인증 적합"
              checked={decision === "verify"}
              disabled={updating || (decision === "verify" && isVerifyCurrent)}
              onClick={() => onDecisionChange("verify")}
            />
            <ReportedReceiptDecisionOption
              label="인증 부적합"
              checked={decision === "reject"}
              disabled={updating || (decision === "reject" && isRejectCurrent)}
              onClick={() => onDecisionChange("reject")}
            />
          </div>

          {decision === "reject" ? (
            <div>
              <label
                htmlFor="reported-hospital-evaluation-receipt-reject-reason"
                className="mb-1.5 block text-sm font-semibold text-gray-800"
              >
                인증 부적합 사유
              </label>
              <Select
                id="reported-hospital-evaluation-receipt-reject-reason"
                value={rejectReason}
                placeholder="없음"
                options={[...HOSPITAL_EVALUATION_RECEIPT_REJECTION_OPTIONS]}
                onChange={onRejectReasonChange}
                disabled={rejectInputsDisabled}
                className="h-11 pl-3"
              />

              {rejectReason === "OTHER" ? (
                <div className="mt-3">
                  <InputField
                    id="reported-hospital-evaluation-receipt-reject-reason-text"
                    name="receipt_rejection_reason_text"
                    placeholder="기타 사유를 입력해주세요"
                    value={rejectReasonText}
                    onChange={(event) => onRejectReasonTextChange(event.target.value)}
                    disabled={rejectInputsDisabled}
                  />
                </div>
              ) : null}

              {error ? <p className="mt-1.5 text-sm font-medium text-error-500">{error}</p> : null}
            </div>
          ) : null}

          {decision !== "reject" && error ? <p className="text-sm font-medium text-error-500">{error}</p> : null}
        </ModalBody>

        <ModalFooter className="justify-center">
          <Button type="button" variant="outline" onClick={onClose} disabled={updating}>
            취소
          </Button>
          <Button type="button" variant="brand" onClick={onSubmit} disabled={updating || isCurrentDecision}>
            {updating ? "처리 중..." : "등록"}
          </Button>
        </ModalFooter>
      </ModalPanel>
    </Modal>
  );
}

function ReportedReceiptDecisionOption({
  label,
  checked,
  disabled,
  onClick,
}: {
  label: string;
  checked: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return <FormCheckbox disabled={disabled} checked={checked} label={label} onChange={onClick} />;
}
