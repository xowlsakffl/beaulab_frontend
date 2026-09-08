"use client";

import React from "react";
import {
  Button,
  InlineFileSelect,
  Label,
  Modal,
  ModalBody,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalPanel,
  ModalTitle,
  Spinner,
} from "@beaulab/ui-admin";

import { useHospitalWalletRefundDocuments } from "@/hooks/hospital-wallet/useHospitalWalletRefundDocuments";
import type { WalletOperationRow } from "@/lib/hospital-wallet/history";
import { REFUND_DOCUMENT_ACCEPT, REFUND_DOCUMENT_HELP_TEXT } from "@/lib/hospital-wallet/refund-documents";

export function HospitalWalletRefundDocumentsModal({
  row,
  canManage,
  onClose,
  onUpdated,
}: {
  row: WalletOperationRow | null;
  canManage: boolean;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const {
    canEdit,
    errors,
    loadError,
    submitError,
    loading,
    submitting,
    businessFileName,
    bankbookFileName,
    businessPreviewUrl,
    bankbookPreviewUrl,
    hasChanges,
    changeFile,
    clearFile,
    downloadDocument,
    submit,
  } = useHospitalWalletRefundDocuments({ row, canManage, onUpdated });

  return (
    <Modal isOpen={row !== null} onClose={submitting ? () => undefined : onClose} className="mx-4 w-full max-w-xl">
      <ModalPanel>
        <ModalHeader>
          <ModalTitle>첨부 서류</ModalTitle>
          <ModalDescription>
            {row ? `${row.hospitalName} · ID ${row.hospitalId ?? "-"}` : "환불 첨부서류"}
          </ModalDescription>
        </ModalHeader>

        <ModalBody className="space-y-5">
          {loading ? (
            <div className="flex min-h-48 items-center justify-center">
              <Spinner className="size-8 text-brand-500" label="첨부서류 불러오는 중" />
            </div>
          ) : loadError ? (
            <div className="flex min-h-48 items-center justify-center text-sm text-error-500">{loadError}</div>
          ) : (
            <>
              <div>
                <Label htmlFor="refund-documents-business-registration">첨부서류1 (사업자등록증)</Label>
                <InlineFileSelect
                  id="refund-documents-business-registration"
                  accept={REFUND_DOCUMENT_ACCEPT}
                  fileName={businessFileName}
                  placeholder="등록된 사업자등록증이 없습니다."
                  helperText={REFUND_DOCUMENT_HELP_TEXT}
                  previewLabel="다운로드"
                  previewFirst
                  error={Boolean(errors.businessRegistration)}
                  disabled={submitting}
                  readOnly={!canEdit}
                  onChange={(file) => changeFile("businessRegistration", file)}
                  onPreview={
                    businessPreviewUrl
                      ? () => void downloadDocument(businessPreviewUrl, businessFileName || "사업자등록증")
                      : undefined
                  }
                  onClear={
                    canEdit && businessFileName
                      ? () => {
                          clearFile("businessRegistration");
                        }
                      : undefined
                  }
                />
                {errors.businessRegistration ? (
                  <p className="mt-1 text-xs text-error-500">{errors.businessRegistration}</p>
                ) : null}
              </div>

              <div>
                <Label htmlFor="refund-documents-bankbook">첨부서류2 (통장 사본)</Label>
                <InlineFileSelect
                  id="refund-documents-bankbook"
                  accept={REFUND_DOCUMENT_ACCEPT}
                  fileName={bankbookFileName}
                  placeholder="등록된 통장 사본이 없습니다."
                  helperText={REFUND_DOCUMENT_HELP_TEXT}
                  previewLabel="다운로드"
                  previewFirst
                  error={Boolean(errors.bankbook)}
                  disabled={submitting}
                  readOnly={!canEdit}
                  onChange={(file) => changeFile("bankbook", file)}
                  onPreview={
                    bankbookPreviewUrl
                      ? () => void downloadDocument(bankbookPreviewUrl, bankbookFileName || "통장 사본")
                      : undefined
                  }
                  onClear={
                    canEdit && bankbookFileName
                      ? () => {
                          clearFile("bankbook");
                        }
                      : undefined
                  }
                />
                {errors.bankbook ? <p className="mt-1 text-xs text-error-500">{errors.bankbook}</p> : null}
              </div>

              {row?.status !== "PENDING" ? (
                <p className="text-xs text-gray-500">처리 완료된 환불 건은 첨부서류를 변경할 수 없습니다.</p>
              ) : null}
              {submitError ? <p className="text-xs text-error-500">{submitError}</p> : null}
            </>
          )}
        </ModalBody>

        <ModalFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            닫기
          </Button>
          {canEdit && !loading && !loadError ? (
            <Button type="button" variant="brand" onClick={() => void submit()} disabled={!hasChanges || submitting}>
              {submitting ? "저장 중..." : "저장"}
            </Button>
          ) : null}
        </ModalFooter>
      </ModalPanel>
    </Modal>
  );
}

export default HospitalWalletRefundDocumentsModal;
