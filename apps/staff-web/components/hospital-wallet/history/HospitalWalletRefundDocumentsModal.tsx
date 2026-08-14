"use client";

import React from "react";
import { isApiSuccess } from "@beaulab/types";
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
  useGlobalAlert,
} from "@beaulab/ui-admin";

import { useObjectUrl } from "@/hooks/common/useObjectUrl";
import { api, downloadFile } from "@/lib/common/api";
import type { WalletOperationRow } from "@/lib/hospital-wallet/history";
import {
  REFUND_DOCUMENT_ACCEPT,
  REFUND_DOCUMENT_HELP_TEXT,
  refundDocumentFileName,
  refundDocumentUrl,
  type RefundDocuments,
  validateRefundDocumentFile,
} from "@/lib/hospital-wallet/refund-documents";

type DocumentField = "businessRegistration" | "bankbook";
type FieldErrors = Partial<Record<DocumentField, string>>;

type RefundDocumentsResponse = {
  documents: RefundDocuments;
};

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
  const { showAlert } = useGlobalAlert();
  const [documents, setDocuments] = React.useState<RefundDocuments | null>(null);
  const [businessFile, setBusinessFile] = React.useState<File | null>(null);
  const [bankbookFile, setBankbookFile] = React.useState<File | null>(null);
  const [removeBusinessFile, setRemoveBusinessFile] = React.useState(false);
  const [removeBankbookFile, setRemoveBankbookFile] = React.useState(false);
  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const businessObjectUrl = useObjectUrl(businessFile);
  const bankbookObjectUrl = useObjectUrl(bankbookFile);

  React.useEffect(() => {
    if (!row) return;

    let active = true;
    setDocuments(null);
    setBusinessFile(null);
    setBankbookFile(null);
    setRemoveBusinessFile(false);
    setRemoveBankbookFile(false);
    setErrors({});
    setLoadError(null);
    setSubmitError(null);
    setLoading(true);

    void api
      .get<RefundDocumentsResponse>(`/hospital-wallet-operations/${row.id}/refund-documents`)
      .then((response) => {
        if (!active) return;
        if (!isApiSuccess(response)) {
          setLoadError(response.error.message || "첨부서류 조회에 실패했습니다.");
          return;
        }
        setDocuments(response.data.documents);
      })
      .catch(() => {
        if (active) setLoadError("첨부서류 조회 중 오류가 발생했습니다.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [row]);

  const canEdit = canManage && row?.status === "PENDING";
  const existingBusinessFile = removeBusinessFile ? null : documents?.business_registration_file;
  const existingBankbookFile = removeBankbookFile ? null : documents?.bankbook_file;
  const businessFileName = businessFile?.name || refundDocumentFileName(existingBusinessFile);
  const bankbookFileName = bankbookFile?.name || refundDocumentFileName(existingBankbookFile);
  const businessPreviewUrl = businessObjectUrl || refundDocumentUrl(existingBusinessFile);
  const bankbookPreviewUrl = bankbookObjectUrl || refundDocumentUrl(existingBankbookFile);
  const hasChanges = Boolean(businessFile || bankbookFile || removeBusinessFile || removeBankbookFile);

  const downloadDocument = async (url: string, fileName: string) => {
    setSubmitError(null);

    try {
      await downloadFile(url, fileName);
    } catch {
      setSubmitError("첨부서류 다운로드에 실패했습니다.");
    }
  };

  const changeFile = (field: DocumentField, file: File | null) => {
    const error = validateRefundDocumentFile(file);
    setErrors((current) => ({ ...current, [field]: error ?? undefined }));
    if (error) return;

    if (field === "businessRegistration") {
      setBusinessFile(file);
      if (file) setRemoveBusinessFile(false);
    } else {
      setBankbookFile(file);
      if (file) setRemoveBankbookFile(false);
    }
    setSubmitError(null);
  };

  const submit = async () => {
    if (!row || !canEdit || !hasChanges || submitting) return;

    setSubmitting(true);
    setSubmitError(null);
    const formData = new FormData();
    if (businessFile) formData.append("business_registration_file", businessFile);
    if (bankbookFile) formData.append("bankbook_file", bankbookFile);
    if (removeBusinessFile) formData.append("remove_business_registration_file", "1");
    if (removeBankbookFile) formData.append("remove_bankbook_file", "1");

    try {
      const response = await api.post<RefundDocumentsResponse>(
        `/hospital-wallet-operations/${row.id}/refund-documents`,
        formData,
      );
      if (!isApiSuccess(response)) {
        setSubmitError(response.error.message || "첨부서류 저장에 실패했습니다.");
        return;
      }

      showAlert({
        variant: "success",
        title: "첨부서류 저장",
        message: "환불 첨부서류를 저장했습니다.",
      });
      onUpdated();
    } catch {
      setSubmitError("첨부서류 저장 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

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
                          setBusinessFile(null);
                          setRemoveBusinessFile(Boolean(documents?.business_registration_file));
                          setErrors((current) => ({ ...current, businessRegistration: undefined }));
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
                          setBankbookFile(null);
                          setRemoveBankbookFile(Boolean(documents?.bankbook_file));
                          setErrors((current) => ({ ...current, bankbook: undefined }));
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
