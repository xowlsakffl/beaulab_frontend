"use client";

import React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { isApiSuccess } from "@beaulab/types";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, SpinnerBlock, useGlobalAlert } from "@beaulab/ui-admin";

import { NoticeAttachmentSection } from "@/components/notice/form/NoticeAttachmentSection";
import { NoticeMainSection } from "@/components/notice/form/NoticeMainSection";
import { useNoticeEditorTempImages } from "@/hooks/notice/useNoticeEditorTempImages";
import { useNoticeFieldFocus } from "@/hooks/notice/useNoticeFieldFocus";
import { api } from "@/lib/common/api";
import { buildReturnToPath } from "@/lib/common/navigation/buildReturnToPath";
import {
  appendNoticeFormData,
  extractNoticeFieldErrors,
  INITIAL_NOTICE_FORM,
  mapNoticeDetailToForm,
  validateNoticeForm,
  type NoticeAttachment,
  type NoticeDetailResponse,
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
  const {
    uploadImage,
    cleanupRemovedTempImages,
    cleanupAllTempImages,
    clearTrackedTempImages,
  } = useNoticeEditorTempImages();

  const rawNoticeId = Array.isArray(params.id) ? params.id[0] : params.id;
  const noticeId = Number(rawNoticeId);
  const shouldCleanupOnUnmountRef = React.useRef(true);

  const [form, setForm] = React.useState<NoticeFormValues>(INITIAL_NOTICE_FORM);
  const [attachments, setAttachments] = React.useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = React.useState<NoticeAttachment[]>([]);
  const [errors, setErrors] = React.useState<NoticeFormErrors>({});
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    return () => {
      if (shouldCleanupOnUnmountRef.current) {
        void cleanupAllTempImages();
      }
    };
  }, [cleanupAllTempImages]);

  const getReturnToPath = React.useCallback(
    (highlightId?: number) =>
      buildReturnToPath({
        searchParams,
        fallbackPath: "/notices",
        allowedPrefix: "/notices",
        highlightId,
      }),
    [searchParams],
  );

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

  const fetchNotice = React.useCallback(async () => {
    if (!Number.isFinite(noticeId) || noticeId <= 0) {
      setLoadError("잘못된 공지사항 경로입니다.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      const response = await api.get<NoticeDetailResponse>(`/notices/${noticeId}`);
      if (!isApiSuccess(response)) {
        setLoadError(response.error.message || "공지사항 정보를 불러오지 못했습니다.");
        return;
      }

      setForm(mapNoticeDetailToForm(response.data));
      setExistingAttachments(response.data.attachments ?? []);
    } catch {
      setLoadError("공지사항 정보를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [noticeId]);

  React.useEffect(() => {
    void fetchNotice();
  }, [fetchNotice]);

  const handleContentChange = React.useCallback(
    (value: string) => {
      setField("content", value);
      void cleanupRemovedTempImages(value);
    },
    [cleanupRemovedTempImages, setField],
  );

  const validate = React.useCallback(() => {
    const nextErrors = validateNoticeForm(form);

    if (existingAttachments.length + attachments.length > 5) {
      nextErrors.attachments = "첨부파일은 최대 5개까지 업로드할 수 있습니다.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      focusFirstErrorField(nextErrors);
      return false;
    }

    return true;
  }, [attachments.length, existingAttachments.length, focusFirstErrorField, form]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;
    if (!Number.isFinite(noticeId) || noticeId <= 0) return;

    const formData = new FormData();
    formData.append("_method", "PATCH");
    appendNoticeFormData(
      formData,
      form,
      attachments.length > 0 ? attachments : null,
      existingAttachments.map((attachment) => attachment.id),
    );

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
        message: "수정된 공지사항을 목록에서 확인할 수 있습니다.",
      });
      router.push(getReturnToPath(noticeId));
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

  if (isLoading) {
    return <SpinnerBlock className="min-h-[60vh]" spinnerClassName="size-10" />;
  }

  if (loadError) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>공지사항 정보를 불러오지 못했습니다.</CardTitle>
          <CardDescription>{loadError}</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2 pt-0">
          <Button type="button" variant="brand" onClick={() => void fetchNotice()}>
            다시 불러오기
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push(getReturnToPath())}>
            목록으로
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:items-start lg:grid-cols-[minmax(0,1.36fr)_minmax(240px,0.64fr)]">
      <div className="min-w-0">
        <NoticeMainSection
          form={form}
          errors={errors}
          onFieldChange={setField}
          onContentChange={handleContentChange}
          onUploadEditorImage={(file) => uploadImage(file, noticeId)}
        />
      </div>

      <div className="min-w-0 space-y-6">
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

        <div className="flex flex-col gap-3">
          <Button type="button" variant="outline" size="auth" className="w-full" onClick={() => router.push(getReturnToPath())}>
            목록으로
          </Button>
          <Button type="submit" variant="brand" size="auth" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "저장 중..." : "공지사항 저장"}
          </Button>
        </div>
      </div>
    </form>
  );
}
