export type NoticeAttachment = {
  id: number;
  collection?: string | null;
  disk?: string | null;
  path?: string | null;
  mime_type?: string | null;
  size?: number | null;
  width?: number | null;
  height?: number | null;
  sort_order?: number | null;
  is_primary?: boolean;
  created_at?: string | null;
  updated_at?: string | null;
};

export type NoticeDetailResponse = {
  id: number;
  channel: string;
  title: string;
  content: string;
  status: string;
  is_pinned: boolean;
  is_publish_period_unlimited: boolean;
  publish_start_at?: string | null;
  publish_end_at?: string | null;
  is_important: boolean;
  view_count: number;
  attachments?: NoticeAttachment[] | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type NoticeFormValues = {
  channel: string;
  title: string;
  content: string;
  status: string;
  is_pinned: boolean;
  is_publish_period_unlimited: boolean;
  publish_start_at: string;
  publish_end_at: string;
  is_important: boolean;
};

export type NoticeFieldName = keyof NoticeFormValues | "attachments";
export type NoticeFormErrors = Partial<Record<NoticeFieldName, string>>;

export const INITIAL_NOTICE_FORM: NoticeFormValues = {
  channel: "ALL",
  title: "",
  content: "",
  status: "ACTIVE",
  is_pinned: false,
  is_publish_period_unlimited: true,
  publish_start_at: "",
  publish_end_at: "",
  is_important: false,
};

export const NOTICE_CHANNEL_OPTIONS = [
  { value: "ALL", label: "전체 채널" },
  { value: "APP_WEB", label: "앱/웹" },
  { value: "HOSPITAL", label: "병의원" },
  { value: "BEAUTY", label: "뷰티" },
] as const;

export const NOTICE_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "정상" },
  { value: "INACTIVE", label: "비활성" },
] as const;

export const FIELD_FOCUS_ORDER: readonly NoticeFieldName[] = [
  "title",
  "channel",
  "status",
  "content",
  "publish_start_at",
  "publish_end_at",
  "attachments",
] as const;

const FIELD_NAMES: readonly NoticeFieldName[] = [
  "channel",
  "title",
  "content",
  "status",
  "is_pinned",
  "is_publish_period_unlimited",
  "publish_start_at",
  "publish_end_at",
  "is_important",
  "attachments",
] as const;

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

export function labelNoticeChannel(channel?: string | null) {
  if (channel === "ALL") return "전체 채널";
  if (channel === "APP_WEB") return "앱/웹";
  if (channel === "HOSPITAL") return "병의원";
  if (channel === "BEAUTY") return "뷰티";
  return channel?.trim() || "-";
}

export function labelNoticeStatus(status?: string | null) {
  if (status === "ACTIVE") return "정상";
  if (status === "INACTIVE") return "비활성";
  return status?.trim() || "-";
}

export function formatLocalDateTime(isoString?: string | null) {
  if (!isoString) return "-";

  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "-";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

export function toDateTimeLocalValue(isoString?: string | null) {
  if (!isoString) return "";

  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function mapNoticeDetailToForm(detail: NoticeDetailResponse): NoticeFormValues {
  return {
    channel: detail.channel || INITIAL_NOTICE_FORM.channel,
    title: detail.title || "",
    content: detail.content || "",
    status: detail.status || INITIAL_NOTICE_FORM.status,
    is_pinned: Boolean(detail.is_pinned),
    is_publish_period_unlimited: Boolean(detail.is_publish_period_unlimited),
    publish_start_at: toDateTimeLocalValue(detail.publish_start_at),
    publish_end_at: toDateTimeLocalValue(detail.publish_end_at),
    is_important: Boolean(detail.is_important),
  };
}

export function resolveNoticeAttachmentUrl(attachment?: NoticeAttachment | null) {
  const path = attachment?.path?.trim();
  if (!path || !API_BASE_URL) return null;
  return `${API_BASE_URL}/storage/${path.replace(/^\/+/, "")}`;
}

export function getNoticeAttachmentFilename(attachment?: NoticeAttachment | null) {
  const path = attachment?.path?.trim();
  if (!path) return "파일";

  const segments = path.split("/");
  return segments[segments.length - 1] || "파일";
}

export function formatBytes(bytes?: number | null) {
  if (!bytes || bytes <= 0) return null;

  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function isNoticeFieldName(value: string): value is NoticeFieldName {
  return (FIELD_NAMES as readonly string[]).includes(value);
}

export function normalizeNoticeErrorField(key: string): NoticeFieldName | null {
  if (key.startsWith("attachments")) return "attachments";
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

export function validateNoticeForm(form: NoticeFormValues): NoticeFormErrors {
  const nextErrors: NoticeFormErrors = {};

  if (!form.title.trim()) {
    nextErrors.title = "제목을 입력해 주세요.";
  }

  if (!form.channel.trim()) {
    nextErrors.channel = "공지 채널을 선택해 주세요.";
  }

  if (!form.status.trim()) {
    nextErrors.status = "운영 상태를 선택해 주세요.";
  }

  if (!isNoticeContentMeaningful(form.content)) {
    nextErrors.content = "내용을 입력해 주세요.";
  }

  if (!form.is_publish_period_unlimited) {
    if (!form.publish_start_at) {
      nextErrors.publish_start_at = "게시 시작 일시를 입력해 주세요.";
    }

    if (!form.publish_end_at) {
      nextErrors.publish_end_at = "게시 종료 일시를 입력해 주세요.";
    }

    if (form.publish_start_at && form.publish_end_at && form.publish_end_at < form.publish_start_at) {
      nextErrors.publish_end_at = "게시 종료 일시는 시작 일시보다 빠를 수 없습니다.";
    }
  }

  return nextErrors;
}

export function appendNoticeFormData(
  formData: FormData,
  form: NoticeFormValues,
  attachments: File[] | null,
  existingAttachmentIds?: Array<number | string>,
) {
  formData.append("channel", form.channel);
  formData.append("title", form.title.trim());
  formData.append("content", form.content.trim());
  formData.append("status", form.status);
  formData.append("is_pinned", form.is_pinned ? "1" : "0");
  formData.append("is_publish_period_unlimited", form.is_publish_period_unlimited ? "1" : "0");
  formData.append("is_important", form.is_important ? "1" : "0");

  if (!form.is_publish_period_unlimited) {
    if (form.publish_start_at) {
      formData.append("publish_start_at", form.publish_start_at);
    }

    if (form.publish_end_at) {
      formData.append("publish_end_at", form.publish_end_at);
    }
  }

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
