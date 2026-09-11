"use client";

import React from "react";
import { isApiSuccess } from "@beaulab/types";
import { useGlobalAlert } from "@beaulab/ui-admin";

import { useObjectUrl } from "@beaulab/ui-admin/hooks";
import { api, downloadFile } from "@/lib/common/api";
import type { WalletOperationRow } from "@/lib/hospital-wallet/history";
import {
  refundDocumentFileName,
  refundDocumentUrl,
  validateRefundDocumentFile,
  type RefundDocuments,
} from "@/lib/hospital-wallet/refund-documents";

type DocumentField = "businessRegistration" | "bankbook";
type FieldErrors = Partial<Record<DocumentField, string>>;
type RefundDocumentsResponse = { documents: RefundDocuments };

export function useHospitalWalletRefundDocuments({
  row,
  canManage,
  onUpdated,
}: {
  row: WalletOperationRow | null;
  canManage: boolean;
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

  const downloadDocument = React.useCallback(async (url: string, fileName: string) => {
    setSubmitError(null);
    try {
      await downloadFile(url, fileName);
    } catch {
      setSubmitError("첨부서류 다운로드에 실패했습니다.");
    }
  }, []);

  const changeFile = React.useCallback((field: DocumentField, file: File | null) => {
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
  }, []);

  const clearFile = React.useCallback(
    (field: DocumentField) => {
      if (field === "businessRegistration") {
        setBusinessFile(null);
        setRemoveBusinessFile(Boolean(documents?.business_registration_file));
      } else {
        setBankbookFile(null);
        setRemoveBankbookFile(Boolean(documents?.bankbook_file));
      }
      setErrors((current) => ({ ...current, [field]: undefined }));
    },
    [documents],
  );

  const submit = React.useCallback(async () => {
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

      showAlert({ variant: "success", title: "첨부서류 저장", message: "환불 첨부서류를 저장했습니다." });
      onUpdated();
    } catch {
      setSubmitError("첨부서류 저장 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }, [
    bankbookFile,
    businessFile,
    canEdit,
    hasChanges,
    onUpdated,
    removeBankbookFile,
    removeBusinessFile,
    row,
    showAlert,
    submitting,
  ]);

  return {
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
  };
}
