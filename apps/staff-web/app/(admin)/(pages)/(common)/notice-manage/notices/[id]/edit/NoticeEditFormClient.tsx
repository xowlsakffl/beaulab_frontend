"use client";

import React from "react";
import { hasPermission } from "@beaulab/auth";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { isApiSuccess } from "@beaulab/types";
import { Button, SpinnerBlock, useGlobalAlert } from "@beaulab/ui-admin";

import { LoadErrorState } from "@/components/common/LoadErrorState";
import { NoticeAttachmentSection } from "@/components/notice/form/NoticeAttachmentSection";
import { usePageHeaderExtra } from "@/lib/common/routing/page-header-extra";
import { NoticeSettingsSection } from "@/components/notice/form/NoticeSettingsSection";
import { NoticeMainSection } from "@/components/notice/form/NoticeMainSection";
import { useNoticeDetail } from "@/hooks/notice/useNoticeDetail";
import { useNoticeEditorTempImages } from "@/hooks/notice/useNoticeEditorTempImages";
import { useNoticeFieldFocus } from "@/hooks/notice/useNoticeFieldFocus";
import { api } from "@/lib/common/api";
import { getSession } from "@/lib/common/auth/session";
import { STAFF_STATUS_PERMISSIONS } from "@/lib/common/status-permissions";
import type { NoticeAttachment, NoticeDetailResponse } from "@/lib/notice/detail";
import {
  buildUpdateNoticeFormData,
  extractNoticeFieldErrors,
  INITIAL_NOTICE_FORM,
  mapNoticeDetailToForm,
  validateNoticeForm,
  type NoticeFieldName,
  type NoticeFormErrors,
  type NoticeFormValues,
} from "@/lib/notice/form";

export default function NoticeEditFormClient() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showAlert } = useGlobalAlert();
  const { focusFirstErrorField } = useNoticeFieldFocus();
  const canUpdateStatus = hasPermission(getSession()?.auth, STAFF_STATUS_PERMISSIONS.notice);
  const { uploadImage, cleanupRemovedTempImages, cleanupAllTempImages, clearTrackedTempImages } =
    useNoticeEditorTempImages();

  const rawNoticeId = Array.isArray(params.id) ? params.id[0] : params.id;
  const noticeId = Number(rawNoticeId);
  const shouldCleanupOnUnmountRef = React.useRef(true);

  const [form, setForm] = React.useState<NoticeFormValues>(INITIAL_NOTICE_FORM);
  const [attachments, setAttachments] = React.useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = React.useState<NoticeAttachment[]>([]);
  const [errors, setErrors] = React.useState<NoticeFormErrors>({});
  const { detail, isLoading, loadError } = useNoticeDetail(noticeId);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    return () => {
      if (shouldCleanupOnUnmountRef.current) {
        void cleanupAllTempImages();
      }
    };
  }, [cleanupAllTempImages]);

  const detailPath = React.useMemo(() => {
    if (!Number.isSafeInteger(noticeId) || noticeId <= 0) return "/notice-manage/notices";

    const rawReturnTo = searchParams.get("returnTo");
    return rawReturnTo
      ? `/notice-manage/notices/${noticeId}?returnTo=${encodeURIComponent(rawReturnTo)}`
      : `/notice-manage/notices/${noticeId}`;
  }, [noticeId, searchParams]);

  const clearError = React.useCallback((field: NoticeFieldName) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;

      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const setField = React.useCallback(
    <K extends keyof NoticeFormValues>(key: K, value: NoticeFormValues[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      clearError(key);
    },
    [clearError],
  );

  React.useEffect(() => {
    if (!detail) return;
    setForm(mapNoticeDetailToForm(detail));
    setExistingAttachments(detail.attachments ?? []);
    setAttachments([]);
    setErrors({});
  }, [detail]);

  const handleContentChange = React.useCallback(
    (value: string) => {
      setField("content", value);
      void cleanupRemovedTempImages(value);
    },
    [cleanupRemovedTempImages, setField],
  );

  const validate = React.useCallback(() => {
    const nextErrors = validateNoticeForm(form, attachments, existingAttachments.length);

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      focusFirstErrorField(nextErrors);
      return false;
    }

    return true;
  }, [attachments, existingAttachments.length, focusFirstErrorField, form]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting || !validate()) return;
    if (!Number.isSafeInteger(noticeId) || noticeId <= 0) return;

    const formData = buildUpdateNoticeFormData({
      form,
      attachments,
      existingAttachmentIds: existingAttachments.map((attachment) => attachment.id),
      includeStatus: canUpdateStatus,
    });

    setIsSubmitting(true);

    try {
      const response = await api.post<NoticeDetailResponse>(`/notices/${noticeId}`, formData);
      if (!isApiSuccess(response)) {
        const nextErrors = extractNoticeFieldErrors(response.error.details);
        if (Object.keys(nextErrors).length > 0) {
          setErrors(nextErrors);
          focusFirstErrorField(nextErrors);
        }

        showAlert({
          variant: "error",
          title: "공지사항 수정 실패",
          message: response.error.message || "공지사항 수정에 실패했습니다.",
        });
        return;
      }

      shouldCleanupOnUnmountRef.current = false;
      clearTrackedTempImages();

      showAlert({
        variant: "success",
        title: "공지사항 수정 완료",
        message: "수정된 공지사항을 확인할 수 있습니다.",
      });
      router.push(detailPath);
    } catch {
      showAlert({
        variant: "error",
        title: "공지사항 수정 실패",
        message: "공지사항 수정 중 오류가 발생했습니다.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const headerActions = React.useMemo(
    () => (
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" disabled={isSubmitting} onClick={() => router.push(detailPath)}>
          취소
        </Button>
        <Button type="submit" form="notice-edit-form" size="sm" variant="brand" disabled={isSubmitting}>
          {isSubmitting ? "저장 중..." : "저장"}
        </Button>
      </div>
    ),
    [detailPath, isSubmitting, router],
  );
  usePageHeaderExtra(isLoading || loadError ? null : headerActions);

  if (isLoading) {
    return <SpinnerBlock className="min-h-[60vh]" spinnerClassName="size-10" />;
  }

  if (loadError) {
    return <LoadErrorState title="공지사항 정보를 불러오지 못했습니다." message={loadError} />;
  }

  return (
    <form
      id="notice-edit-form"
      onSubmit={handleSubmit}
      className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-start"
    >
      <div className="min-w-0">
        <NoticeMainSection
          form={form}
          errors={errors}
          onFieldChange={setField}
          onContentChange={handleContentChange}
          onUploadEditorImage={(file) => uploadImage(file, noticeId)}
        />
      </div>

      <NoticeSettingsSection form={form} errors={errors} onFieldChange={setField} canUpdateStatus={canUpdateStatus}>
        <NoticeAttachmentSection
          attachments={attachments}
          existingAttachments={existingAttachments}
          errors={errors}
          onAttachmentsChange={(files) => {
            setAttachments(files);
            clearError("attachments");
          }}
          onExistingAttachmentsChange={(nextAttachments) => {
            setExistingAttachments(nextAttachments);
            clearError("attachments");
          }}
        />
      </NoticeSettingsSection>
    </form>
  );
}
