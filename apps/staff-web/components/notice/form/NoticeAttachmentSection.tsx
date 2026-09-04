"use client";

import React from "react";
import { Button, InlineFileSelect, useGlobalAlert } from "@beaulab/ui-admin";
import { downloadFile } from "@/lib/common/api";
import { formatBytes, getNoticeAttachmentFilename, type NoticeAttachment } from "@/lib/notice/detail";
import { NOTICE_MAX_ATTACHMENTS, NOTICE_MAX_ATTACHMENT_BYTES, type NoticeFormErrors } from "@/lib/notice/form";
import { NoticeFormField } from "./NoticeFormField";

type NoticeAttachmentSectionProps = {
  attachments?: File[];
  existingAttachments?: NoticeAttachment[];
  errors?: NoticeFormErrors;
  readOnly?: boolean;
  onAttachmentsChange?: (files: File[]) => void;
  onExistingAttachmentsChange?: (attachments: NoticeAttachment[]) => void;
};

export function NoticeAttachmentSection({
  attachments = [],
  existingAttachments = [],
  errors,
  readOnly = false,
  onAttachmentsChange,
  onExistingAttachmentsChange,
}: NoticeAttachmentSectionProps) {
  const { showAlert } = useGlobalAlert();
  const [downloadingId, setDownloadingId] = React.useState<number | null>(null);
  const count = existingAttachments.length + attachments.length;

  const downloadAttachment = async (attachment: NoticeAttachment) => {
    const url = attachment.download_path;
    if (!url || downloadingId !== null) return;
    setDownloadingId(attachment.id);
    try {
      await downloadFile(url, getNoticeAttachmentFilename(attachment));
    } catch {
      showAlert({ variant: "error", title: "첨부파일 다운로드 실패", message: "파일을 다운로드하지 못했습니다." });
    } finally {
      setDownloadingId(null);
    }
  };

  if (readOnly) {
    if (existingAttachments.length === 0) return <p className="text-sm leading-6 text-gray-800">-</p>;

    return (
      <ul className="space-y-3">
        {existingAttachments.map((attachment) => (
          <li key={attachment.id} className="flex min-w-0 items-center gap-2">
            <p
              className="min-w-0 truncate text-sm leading-6 text-gray-800"
              title={getNoticeAttachmentFilename(attachment)}
            >
              {getNoticeAttachmentFilename(attachment)}
            </p>
            {attachment.download_path ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 shrink-0 px-2 text-xs"
                disabled={downloadingId !== null}
                onClick={() => void downloadAttachment(attachment)}
              >
                다운로드
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
    );
  }

  const fileList = (
    <div className="space-y-2">
      {count < NOTICE_MAX_ATTACHMENTS ? (
        <InlineFileSelect
          id="attachments"
          accept=""
          placeholder="파일을 선택해 주세요."
          helperText="파일당 20MB 이하 · 최대 5개"
          error={Boolean(errors?.attachments)}
          onChange={(file) => {
            if (file) onAttachmentsChange?.([...attachments, file]);
          }}
        />
      ) : null}
      {existingAttachments.map((attachment) => (
        <InlineFileSelect
          key={attachment.id}
          accept=""
          fileName={getNoticeAttachmentFilename(attachment)}
          placeholder="파일을 선택해 주세요."
          helperText={formatBytes(attachment.size) ?? undefined}
          disabled={downloadingId !== null}
          previewLabel="다운로드"
          onPreview={attachment.download_path ? () => void downloadAttachment(attachment) : undefined}
          onClear={() => onExistingAttachmentsChange?.(existingAttachments.filter((item) => item.id !== attachment.id))}
          onChange={(file) => {
            if (!file) return;
            onExistingAttachmentsChange?.(existingAttachments.filter((item) => item.id !== attachment.id));
            onAttachmentsChange?.([...attachments, file]);
          }}
        />
      ))}
      {attachments.map((file, index) => (
        <InlineFileSelect
          key={index}
          accept=""
          fileName={file.name}
          placeholder="파일을 선택해 주세요."
          helperText={formatBytes(file.size) ?? undefined}
          error={file.size > NOTICE_MAX_ATTACHMENT_BYTES}
          onChange={(nextFile) => {
            if (nextFile)
              onAttachmentsChange?.(attachments.map((item, fileIndex) => (fileIndex === index ? nextFile : item)));
          }}
          onClear={() => onAttachmentsChange?.(attachments.filter((_, fileIndex) => fileIndex !== index))}
        />
      ))}
    </div>
  );

  return (
    <NoticeFormField label="첨부파일" target="attachments" error={errors?.attachments}>
      {fileList}
    </NoticeFormField>
  );
}
