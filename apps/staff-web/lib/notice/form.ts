import type { NoticeDetailResponse } from "./detail";
import { NOTICE_CHANNEL_OPTIONS, NOTICE_STATUS_OPTIONS } from "./options";

export const NOTICE_MAX_ATTACHMENTS = 5;
export const NOTICE_MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024;

export type NoticeFormValues = {
  channel: string;
  title: string;
  content: string;
  status: string;
  is_pinned: boolean;
};

export type NoticeFieldName = keyof NoticeFormValues | "attachments";
export type NoticeFormErrors = Partial<Record<NoticeFieldName, string>>;

export const INITIAL_NOTICE_FORM: NoticeFormValues = {
  channel: "ALL",
  title: "",
  content: "",
  status: "INACTIVE",
  is_pinned: false,
};

export const FIELD_FOCUS_ORDER: readonly NoticeFieldName[] = [
  "title",
  "channel",
  "status",
  "content",
  "attachments",
] as const;

const FIELD_NAMES: readonly NoticeFieldName[] = [
  "channel",
  "title",
  "content",
  "status",
  "is_pinned",
  "attachments",
] as const;

export function mapNoticeDetailToForm(detail: NoticeDetailResponse): NoticeFormValues {
  return {
    channel: detail.channel || INITIAL_NOTICE_FORM.channel,
    title: detail.title || "",
    content: detail.content || "",
    status: detail.status || INITIAL_NOTICE_FORM.status,
    is_pinned: Boolean(detail.is_pinned),
  };
}

export function isNoticeFieldName(value: string): value is NoticeFieldName {
  return (FIELD_NAMES as readonly string[]).includes(value);
}

export function normalizeNoticeErrorField(key: string): NoticeFieldName | null {
  if (key.startsWith("attachments") || key.startsWith("existing_attachment_ids")) return "attachments";
  if (isNoticeFieldName(key)) return key;
  return null;
}

export function extractNoticeFieldErrors(details: unknown): NoticeFormErrors {
  if (!details || typeof details !== "object" || !("errors" in details)) {
    return {};
  }

  const rawErrors = (details as { errors?: unknown }).errors;
  if (!rawErrors || typeof rawErrors !== "object") {
    return {};
  }

  const nextErrors: NoticeFormErrors = {};

  for (const [key, value] of Object.entries(rawErrors as Record<string, unknown>)) {
    const normalizedField = normalizeNoticeErrorField(key);
    if (!normalizedField) continue;

    if (Array.isArray(value)) {
      const firstMessage = value.find((item): item is string => typeof item === "string" && item.trim().length > 0);
      if (firstMessage) {
        nextErrors[normalizedField] = firstMessage;
      }
      continue;
    }

    if (typeof value === "string" && value.trim()) {
      nextErrors[normalizedField] = value;
    }
  }

  return nextErrors;
}

export function isNoticeContentMeaningful(content: string) {
  const normalized = content
    .replace(/<p><\/p>/gi, "")
    .replace(/<p><br\s*\/?><\/p>/gi, "")
    .replace(/&nbsp;/gi, " ")
    .trim();

  if (normalized === "") return false;
  if (/<img\b/i.test(normalized)) return true;

  const textOnly = normalized.replace(/<[^>]+>/g, "").trim();
  return textOnly.length > 0;
}

export function validateNoticeForm(
  form: NoticeFormValues,
  attachments: File[],
  existingAttachmentCount = 0,
): NoticeFormErrors {
  const nextErrors: NoticeFormErrors = {};

  if (!form.title.trim()) {
    nextErrors.title = "제목을 입력해 주세요.";
  } else if (Array.from(form.title.trim()).length > 255) {
    nextErrors.title = "제목은 255자 이하로 입력해 주세요.";
  }

  if (!NOTICE_CHANNEL_OPTIONS.some((option) => option.value === form.channel)) {
    nextErrors.channel = "공지 채널을 선택해 주세요.";
  }

  if (!NOTICE_STATUS_OPTIONS.some((option) => option.value === form.status)) {
    nextErrors.status = "공개여부를 선택해 주세요.";
  }

  if (!isNoticeContentMeaningful(form.content)) {
    nextErrors.content = "내용을 입력해 주세요.";
  }

  if (attachments.length + existingAttachmentCount > NOTICE_MAX_ATTACHMENTS) {
    nextErrors.attachments = "첨부파일은 최대 5개까지 업로드할 수 있습니다.";
  } else if (attachments.some((file) => file.size > NOTICE_MAX_ATTACHMENT_BYTES)) {
    nextErrors.attachments = "첨부파일은 파일당 20MB 이하로 등록해 주세요.";
  }

  return nextErrors;
}

export type BuildCreateNoticeFormDataParams = {
  form: NoticeFormValues;
  attachments: File[];
  includeStatus: boolean;
};

export function buildCreateNoticeFormData({
  form,
  attachments,
  includeStatus,
}: BuildCreateNoticeFormDataParams): FormData {
  const formData = new FormData();

  appendNoticeFormData(formData, form, attachments, undefined, includeStatus);

  return formData;
}

export type BuildUpdateNoticeFormDataParams = {
  form: NoticeFormValues;
  attachments: File[];
  existingAttachmentIds: Array<number | string>;
  includeStatus: boolean;
};

export function buildUpdateNoticeFormData({
  form,
  attachments,
  existingAttachmentIds,
  includeStatus,
}: BuildUpdateNoticeFormDataParams): FormData {
  const formData = new FormData();

  formData.append("_method", "PATCH");
  appendNoticeFormData(
    formData,
    form,
    attachments.length > 0 ? attachments : null,
    existingAttachmentIds,
    includeStatus,
  );

  return formData;
}

function appendNoticeFormData(
  formData: FormData,
  form: NoticeFormValues,
  attachments: File[] | null,
  existingAttachmentIds?: Array<number | string>,
  includeStatus = false,
) {
  formData.append("channel", form.channel);
  formData.append("title", form.title.trim());
  formData.append("content", form.content.trim());
  if (includeStatus) {
    formData.append("status", form.status);
  }
  formData.append("is_pinned", form.is_pinned ? "1" : "0");
  attachments?.forEach((file) => {
    formData.append("attachments[]", file);
  });

  if (existingAttachmentIds !== undefined) {
    formData.append(
      "existing_attachment_ids",
      existingAttachmentIds.map((attachmentId) => String(attachmentId)).join(","),
    );
  }
}

export function extractTempNoticeEditorImageUrls(content: string) {
  const matches = content.matchAll(/<img[^>]+src=["']([^"']+)["']/gi);
  const urls = new Set<string>();

  for (const match of matches) {
    const src = match[1]?.trim();
    if (!src) continue;
    if (!src.includes("/storage/notice/editor-images/temp/")) continue;
    urls.add(src);
  }

  return Array.from(urls);
}
