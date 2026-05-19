export type ReportedContentTargetType =
  | "talk"
  | "talk_comment"
  | "hospital_review"
  | "hospital_review_comment"
  | "hospital_evaluation"
  | "chat_message";

export type ReportedContentDetailAuthor = {
  id?: number | null;
  name?: string | null;
  nickname?: string | null;
  email?: string | null;
  phone?: string | null;
  warning_count?: number | null;
  created_at?: string | null;
};

export type ReportedContentDetailReportState = {
  status?: string | null;
  label?: string | null;
  report_count?: number | null;
  warning_status?: string | null;
  warning_label?: string | null;
  warning?: boolean | null;
  warning_ignored?: boolean | null;
  warning_processed_at?: string | null;
  latest_report?: ReportedContentDetailReportItem | null;
};

export type ReportedContentDetailReportItem = {
  id?: number | null;
  reason?: string | null;
  reason_label?: string | null;
  reason_text?: string | null;
  reporter_ip?: string | null;
  items?: ReportedContentDetailReportSubItem[] | null;
  created_at?: string | null;
  reporter?: {
    id?: number | null;
    name?: string | null;
    nickname?: string | null;
    email?: string | null;
    phone?: string | null;
    warning_count?: number | null;
    created_at?: string | null;
  } | null;
};

export type ReportedContentDetailReportSubItem = {
  id?: number | null;
  target_type?: string | null;
  target_id?: number | null;
  target_author_id?: number | null;
  content_snapshot?: string | null;
  target?: ReportedChatMessageDetailTarget | null;
  created_at?: string | null;
};

export type ReportedChatMessageDetailTarget = {
  id?: number | null;
  chat_id?: number | null;
  created_at?: string | null;
  last_message_at?: string | null;
  author_ip?: string | null;
  sender?: {
    id?: number | null;
    name?: string | null;
    nickname?: string | null;
    email?: string | null;
  } | null;
  body?: string | null;
  body_preview?: string | null;
  message_type?: string | null;
};

export type ReportedContentDetailResponse = {
  target_type?: ReportedContentTargetType | null;
  target_id?: number | null;
  target?: unknown;
  author?: ReportedContentDetailAuthor | null;
  report?: ReportedContentDetailReportState | null;
};

export type ReportedContentReportsMeta = {
  total?: number | null;
  current_page?: number | null;
  per_page?: number | null;
  last_page?: number | null;
};

export type ReportedContentStatusUpdatePayload = {
  target_type: ReportedContentTargetType;
  target_id: number;
  report_status: "ADMIN_HIDDEN" | "NORMAL_VISIBLE" | "REEXPOSED" | "VALID" | "INVALID";
  process_reason?: string;
};

export type ReportedContentWarningStatusUpdatePayload = {
  target_type: ReportedContentTargetType;
  target_id: number;
  warning_status: "WARNED" | "IGNORED";
};

export function formatReportedContentDetailDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("ko-KR", {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function formatReportedContentDetailDateTime(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("ko-KR", {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function formatReportedContentAuthorName(author?: ReportedContentDetailAuthor | null) {
  return author?.nickname?.trim() || author?.name?.trim() || author?.email?.trim() || "-";
}

export function formatReportedContentReporterName(item: ReportedContentDetailReportItem) {
  return item.reporter?.nickname?.trim() || item.reporter?.name?.trim() || item.reporter?.email?.trim() || "-";
}

export function formatReportedContentReason(item: ReportedContentDetailReportItem) {
  const label = item.reason_label?.trim() || item.reason?.trim() || "-";
  const text = item.reason_text?.trim();

  return text ? `${label} - ${text}` : label;
}
