"use client";

import React from "react";

import {
  Button,
  FormCheckbox,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalPanel,
  ModalTitle,
  TemplateVariableEditor,
  type TemplateMessagePart,
} from "@beaulab/ui-admin";

import { HospitalWalletHospitalListHoverMemo } from "@/components/hospital-wallet/list/HospitalWalletHospitalListHoverMemo";
import {
  cloneHospitalWalletNoticeMessageParts,
  HOSPITAL_WALLET_NOTICE_DEFAULT_PARTS,
  HOSPITAL_WALLET_NOTICE_SMS_MAX_BYTES,
  HOSPITAL_WALLET_NOTICE_VARIABLES,
  renderHospitalWalletNoticeMessage,
  smsByteLength,
  type HospitalWalletRow,
} from "@/lib/hospital-wallet/list";

type HospitalWalletNoticeSubmitPayload = {
  messageParts: TemplateMessagePart[];
  sendToManager: boolean;
  sendToRepresentative: boolean;
};

type HospitalWalletNoticeModalProps = {
  isOpen: boolean;
  selectedRows: HospitalWalletRow[];
  submitting: boolean;
  submitError: string | null;
  onClose: () => void;
  onSubmit: (payload: HospitalWalletNoticeSubmitPayload) => void;
};

export function HospitalWalletNoticeModal({
  isOpen,
  selectedRows,
  submitting,
  submitError,
  onClose,
  onSubmit,
}: HospitalWalletNoticeModalProps) {
  const [messageParts, setMessageParts] = React.useState<TemplateMessagePart[]>(() =>
    cloneHospitalWalletNoticeMessageParts(HOSPITAL_WALLET_NOTICE_DEFAULT_PARTS),
  );
  const [sendToManager, setSendToManager] = React.useState(true);
  const [sendToRepresentative, setSendToRepresentative] = React.useState(true);
  const [messageError, setMessageError] = React.useState<string | null>(null);
  const [recipientError, setRecipientError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;

    setMessageParts(cloneHospitalWalletNoticeMessageParts(HOSPITAL_WALLET_NOTICE_DEFAULT_PARTS));
    setSendToManager(true);
    setSendToRepresentative(true);
    setMessageError(null);
    setRecipientError(null);
  }, [isOpen]);

  const byteLength = Math.max(
    0,
    ...selectedRows.map((hospital) => smsByteLength(renderHospitalWalletNoticeMessage(messageParts, hospital))),
  );
  const isLms = byteLength > HOSPITAL_WALLET_NOTICE_SMS_MAX_BYTES;
  const disabled = submitting;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const hasMessage = messageParts.some(
      (part) => part.type === "VARIABLE" || (part.type === "TEXT" && part.text.trim() !== ""),
    );
    const nextMessageError = !hasMessage ? "문자 내용을 입력해 주세요." : null;
    const nextRecipientError = !sendToManager && !sendToRepresentative ? "수신자를 한 명 이상 선택해 주세요." : null;

    setMessageError(nextMessageError);
    setRecipientError(nextRecipientError);

    if (nextMessageError || nextRecipientError) return;

    onSubmit({
      messageParts,
      sendToManager,
      sendToRepresentative,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={submitting ? () => undefined : onClose}
      showCloseButton={false}
      className="mx-4 w-full max-w-xl"
    >
      <ModalPanel>
        <ModalHeader className="pr-0">
          <ModalTitle>충전금 안내 발송</ModalTitle>
          <HospitalWalletHospitalListHoverMemo
            tooltipId="hospital-wallet-notice-selected-hospitals"
            label={<>선택된 병의원 총 {selectedRows.length.toLocaleString("ko-KR")}개</>}
            hospitals={selectedRows.map((row) => ({ id: row.hospitalId, name: row.hospitalName }))}
            className="mt-3"
          />
        </ModalHeader>

        <form onSubmit={handleSubmit}>
          <ModalBody className="mt-5">
            <div>
              <TemplateVariableEditor
                id="hospital-wallet-notice-message"
                value={messageParts}
                variables={HOSPITAL_WALLET_NOTICE_VARIABLES}
                onChange={(value) => {
                  setMessageParts(value);
                  setMessageError(null);
                }}
                placeholder="문자 내용을 입력해 주세요."
                disabled={disabled}
                error={Boolean(messageError)}
                hint={messageError ?? undefined}
              />
              <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-gray-500">
                <span className={isLms ? "text-warning-600" : ""}>
                  {isLms
                    ? "LMS로 발송됩니다."
                    : `${HOSPITAL_WALLET_NOTICE_SMS_MAX_BYTES.toLocaleString("ko-KR")}bytes 초과 시 자동으로 LMS로 전환됩니다.`}
                </span>
                <span>
                  {byteLength.toLocaleString("ko-KR")}/{HOSPITAL_WALLET_NOTICE_SMS_MAX_BYTES.toLocaleString("ko-KR")}{" "}
                  bytes
                </span>
              </div>
            </div>

            <div>
              <div className="space-y-2">
                <div>
                  <FormCheckbox
                    id="hospital-wallet-notice-manager"
                    label="담당자에게도 발송"
                    labelClassName="whitespace-nowrap text-sm font-medium text-gray-800"
                    checked={sendToManager}
                    disabled={disabled}
                    onChange={(checked) => {
                      setSendToManager(checked);
                      setRecipientError(null);
                    }}
                  />
                </div>
                <div>
                  <FormCheckbox
                    id="hospital-wallet-notice-representative"
                    label="대표자에게도 발송"
                    labelClassName="whitespace-nowrap text-sm font-medium text-gray-800"
                    checked={sendToRepresentative}
                    disabled={disabled}
                    onChange={(checked) => {
                      setSendToRepresentative(checked);
                      setRecipientError(null);
                    }}
                  />
                </div>
              </div>
              {recipientError ? <p className="text-xs text-error-500">{recipientError}</p> : null}
            </div>

            {submitError ? <p className="text-xs text-error-500">{submitError}</p> : null}
          </ModalBody>

          <ModalFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              취소
            </Button>
            <Button type="submit" variant="brand" disabled={disabled || selectedRows.length === 0}>
              {submitting ? "발송 요청 중..." : "발송하기"}
            </Button>
          </ModalFooter>
        </form>
      </ModalPanel>
    </Modal>
  );
}
