"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { isApiSuccess } from "@beaulab/types";
import { Button, useGlobalAlert } from "@beaulab/ui-admin";

import { NoticeAttachmentSection } from "@/components/notice/form/NoticeAttachmentSection";
import { NoticeMainSection } from "@/components/notice/form/NoticeMainSection";
import { useNoticeEditorTempImages } from "@/hooks/notice/useNoticeEditorTempImages";
import { useNoticeFieldFocus } from "@/hooks/notice/useNoticeFieldFocus";
import { api } from "@/lib/common/api";
import {
  appendNoticeFormData,
  extractNoticeFieldErrors,
  INITIAL_NOTICE_FORM,
  validateNoticeForm,
  type NoticeDetailResponse,
  type NoticeFieldName,
  type NoticeFormErrors,
  type NoticeFormValues,
} from "@/lib/notice/form";

export default function NoticesCreateFormClient() {
  const router = useRouter();
  const { showAlert } = useGlobalAlert();
  const { focusFirstErrorField } = useNoticeFieldFocus();
  const {
    uploadImage,
    cleanupRemovedTempImages,
    cleanupAllTempImages,
    clearTrackedTempImages,
  } = useNoticeEditorTempImages();

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
    const nextErrors = validateNoticeForm(form);

    if (attachments.length > 5) {
      nextErrors.attachments = "첨부파일은 최대 5개까지 업로드할 수 있습니다.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      focusFirstErrorField(nextErrors);
      return false;
    }

    return true;
  }, [attachments.length, focusFirstErrorField, form]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    const formData = new FormData();
    appendNoticeFormData(formData, form, attachments);

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
      router.push(`/notices?highlight=${response.data.id}`);
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

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:items-start lg:grid-cols-[minmax(0,1.36fr)_minmax(240px,0.64fr)]">
      <div className="min-w-0">
        <NoticeMainSection
          form={form}
          errors={errors}
          onFieldChange={setField}
          onContentChange={handleContentChange}
          onUploadEditorImage={(file) => uploadImage(file)}
        />
      </div>

      <div className="min-w-0 space-y-6">
        <NoticeAttachmentSection
          attachments={attachments}
          errors={errors}
          onAttachmentsChange={(files) => {
            setAttachments(files);
            clearError("attachments");
          }}
        />

        <div className="flex flex-col gap-3">
          <Button type="button" variant="outline" size="auth" className="w-full" onClick={() => router.push("/notices")}>
            목록으로
          </Button>
          <Button type="submit" variant="brand" size="auth" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "등록 중..." : "공지사항 등록"}
          </Button>
        </div>
      </div>
    </form>
  );
}
