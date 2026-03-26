"use client";

import React from "react";
import { Card, CardDescription, CardHeader, CardTitle, FormFileInput, Label, X } from "@beaulab/ui-admin";

import { DetailEmptyState } from "@/components/common/DetailMediaCard";
import {
  formatBytes,
  getNoticeAttachmentFilename,
  resolveNoticeAttachmentUrl,
  type NoticeAttachment,
  type NoticeFormErrors,
} from "@/lib/notice/form";

type NoticeAttachmentSectionProps = {
  attachments: File[];
  existingAttachments?: NoticeAttachment[];
  errors: NoticeFormErrors;
  onAttachmentsChange: (files: File[]) => void;
  onExistingAttachmentsChange?: (attachments: NoticeAttachment[]) => void;
};

export function NoticeAttachmentSection({
  attachments,
  existingAttachments = [],
  errors,
  onAttachmentsChange,
  onExistingAttachmentsChange,
}: NoticeAttachmentSectionProps) {
  return (
    <Card as="section">
      <CardHeader className="pb-6">
        <CardTitle>첨부파일</CardTitle>
        <CardDescription>기존 첨부파일을 개별 삭제하거나 새 파일을 추가할 수 있습니다. 최대 5개까지 가능합니다.</CardDescription>
      </CardHeader>

      <div className="space-y-4" data-field-target="attachments" tabIndex={-1}>
        <div className="space-y-2">
          <Label htmlFor="attachments">첨부파일</Label>
          <FormFileInput
            id="attachments"
            name="attachments"
            multiple
            onChange={(event) => {
              const nextFiles = event.target.files ? Array.from(event.target.files) : [];
              onAttachmentsChange(nextFiles);
            }}
          />
        </div>

        {existingAttachments.length > 0 || attachments.length > 0 ? (
          <div className="space-y-3">
            {existingAttachments.map((attachment) => (
              <div
                key={`existing-${attachment.id}`}
                className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-xl bg-gray-50 text-sm text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                  파일
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100"
                    title={getNoticeAttachmentFilename(attachment)}
                  >
                    {getNoticeAttachmentFilename(attachment)}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {(formatBytes(attachment.size) ?? "-") + " · 현재 파일"}
                    </p>
                    {resolveNoticeAttachmentUrl(attachment) ? (
                      <a
                        href={resolveNoticeAttachmentUrl(attachment) ?? undefined}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-medium text-brand-600 underline underline-offset-2 dark:text-brand-400"
                      >
                        파일 보기
                      </a>
                    ) : null}
                  </div>
                </div>
                {onExistingAttachmentsChange ? (
                  <button
                    type="button"
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-red-600 dark:hover:bg-white/[0.06]"
                    onClick={() => onExistingAttachmentsChange(existingAttachments.filter((item) => item.id !== attachment.id))}
                    aria-label="기존 첨부파일 제거"
                    title="첨부파일 제거"
                  >
                    <X className="size-4" />
                  </button>
                ) : null}
              </div>
            ))}

            {attachments.map((file, index) => (
              <div
                key={`${file.name}-${file.size}-${index}`}
                className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100" title={file.name}>
                    {file.name}
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{formatBytes(file.size) ?? "-"}</p>
                </div>
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-red-600 dark:hover:bg-white/[0.06]"
                  onClick={() => onAttachmentsChange(attachments.filter((_, fileIndex) => fileIndex !== index))}
                  aria-label="선택한 첨부파일 제거"
                  title="첨부파일 제거"
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <DetailEmptyState>등록된 첨부파일이 없습니다.</DetailEmptyState>
        )}

        {errors.attachments ? <p className="text-xs text-error-500">{errors.attachments}</p> : null}
      </div>
    </Card>
  );
}
