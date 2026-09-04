"use client";

import React from "react";
import { hasPermission } from "@beaulab/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { isApiSuccess } from "@beaulab/types";
import { Button, useGlobalAlert } from "@beaulab/ui-admin";

import { NoticeAttachmentSection } from "@/components/notice/form/NoticeAttachmentSection";
import { usePageHeaderExtra } from "@/lib/common/routing/page-header-extra";
import { NoticeSettingsSection } from "@/components/notice/form/NoticeSettingsSection";
import { NoticeMainSection } from "@/components/notice/form/NoticeMainSection";
import { useNoticeEditorTempImages } from "@/hooks/notice/useNoticeEditorTempImages";
import { useNoticeFieldFocus } from "@/hooks/notice/useNoticeFieldFocus";
import { buildReturnToPath } from "@/lib/common/navigation/buildReturnToPath";
import { api } from "@/lib/common/api";
import { getSession } from "@/lib/common/auth/session";
import { STAFF_STATUS_PERMISSIONS } from "@/lib/common/status-permissions";
import type { NoticeDetailResponse } from "@/lib/notice/detail";
import {
  buildCreateNoticeFormData,
  extractNoticeFieldErrors,
  INITIAL_NOTICE_FORM,
  validateNoticeForm,
  type NoticeFieldName,
  type NoticeFormErrors,
  type NoticeFormValues,
} from "@/lib/notice/form";

export default function NoticesCreateFormClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = buildReturnToPath({ searchParams, fallbackPath: "/notice-manage/notices" });
  const { showAlert } = useGlobalAlert();
  const { focusFirstErrorField } = useNoticeFieldFocus();
  const canUpdateStatus = hasPermission(getSession()?.auth, STAFF_STATUS_PERMISSIONS.notice);
  const { uploadImage, cleanupRemovedTempImages, cleanupAllTempImages, clearTrackedTempImages } =
    useNoticeEditorTempImages();

  const shouldCleanupOnUnmountRef = React.useRef(true);

  const [form, setForm] = React.useState<NoticeFormValues>(INITIAL_NOTICE_FORM);
  const [attachments, setAttachments] = React.useState<File[]>([]);
  const [errors, setErrors] = React.useState<NoticeFormErrors>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    return () => {
      if (shouldCleanupOnUnmountRef.current) {
        void cleanupAllTempImages();
      }
    };
  }, [cleanupAllTempImages]);

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

  const handleContentChange = React.useCallback(
    (value: string) => {
      setField("content", value);
      void cleanupRemovedTempImages(value);
    },
    [cleanupRemovedTempImages, setField],
  );

  const validate = React.useCallback(() => {
    const nextErrors = validateNoticeForm(form, attachments);

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      focusFirstErrorField(nextErrors);
      return false;
    }

    return true;
  }, [attachments, focusFirstErrorField, form]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting || !validate()) return;

    const formData = buildCreateNoticeFormData({ form, attachments, includeStatus: canUpdateStatus });

    setIsSubmitting(true);

    try {
      const response = await api.post<NoticeDetailResponse>("/notices", formData);
      if (!isApiSuccess(response)) {
        const nextErrors = extractNoticeFieldErrors(response.error.details);
        if (Object.keys(nextErrors).length > 0) {
          setErrors(nextErrors);
          focusFirstErrorField(nextErrors);
        }

        showAlert({
          variant: "error",
          title: "공지사항 등록 실패",
          message: response.error.message || "공지사항 등록에 실패했습니다.",
        });
        return;
      }

      shouldCleanupOnUnmountRef.current = false;
      clearTrackedTempImages();

      showAlert({
        variant: "success",
        title: "공지사항 등록 완료",
        message: "등록된 공지사항을 목록에서 확인할 수 있습니다.",
      });
      router.push(
        buildReturnToPath({ searchParams, fallbackPath: "/notice-manage/notices", highlightId: response.data.id }),
      );
    } catch {
      showAlert({
        variant: "error",
        title: "공지사항 등록 실패",
        message: "공지사항 등록 중 오류가 발생했습니다.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const headerActions = React.useMemo(
    () => (
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" disabled={isSubmitting} onClick={() => router.push(returnTo)}>
          취소
        </Button>
        <Button type="submit" form="notice-create-form" size="sm" variant="brand" disabled={isSubmitting}>
          {isSubmitting ? "등록 중..." : "등록"}
        </Button>
      </div>
    ),
    [isSubmitting, returnTo, router],
  );
  usePageHeaderExtra(headerActions);

  return (
    <form
      id="notice-create-form"
      onSubmit={handleSubmit}
      className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-start"
    >
      <div className="min-w-0">
        <NoticeMainSection
          form={form}
          errors={errors}
          onFieldChange={setField}
          onContentChange={handleContentChange}
          onUploadEditorImage={(file) => uploadImage(file)}
        />
      </div>

      <NoticeSettingsSection form={form} errors={errors} onFieldChange={setField} canUpdateStatus={canUpdateStatus}>
        <NoticeAttachmentSection
          attachments={attachments}
          errors={errors}
          onAttachmentsChange={(files) => {
            setAttachments(files);
            clearError("attachments");
          }}
        />
      </NoticeSettingsSection>
    </form>
  );
}
