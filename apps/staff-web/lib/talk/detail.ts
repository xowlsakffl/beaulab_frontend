import type { DataTableMeta } from "@beaulab/ui-admin";

import {
  formatTalkCategoryName,
  labelTalkPostStatus,
  type TalkAuthor,
  type TalkCategory,
} from "@/lib/talk/list";

export type TalkMediaAsset = {
  id: number;
  collection?: string | null;
  disk?: string | null;
  path?: string | null;
  url?: string | null;
  mime_type?: string | null;
  size?: number | null;
  width?: number | null;
  height?: number | null;
  sort_order?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type TalkPollOption = {
  id: number;
  content?: string | null;
  sort_order?: number | null;
  vote_count?: number | null;
};

export type TalkPoll = {
  id: number;
  allow_multiple?: boolean | null;
  options?: TalkPollOption[] | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type TalkOperationHistory = {
  id: number;
  actor_label?: string | null;
  action?: string | null;
  field?: string | null;
  before_value?: unknown;
  after_value?: unknown;
  reason?: string | null;
  created_at?: string | null;
};

export type TalkCommentHistory = {
  actor_label?: string | null;
  status?: string | null;
  post_status?: string | null;
  created_at?: string | null;
  reason?: string | null;
};

export type TalkCommentMention = {
  id?: number | null;
  mentioned_user_id?: number | null;
  mentioned_by_user_id?: number | null;
  mention_text?: string | null;
  mentioned_user_name?: string | null;
};

export type TalkDetailComment = {
  id: number;
  parent_id?: number | null;
  is_reply?: boolean | null;
  author?: TalkAuthor | null;
  content?: string | null;
  status?: string | null;
  post_status?: string | null;
  author_ip?: string | null;
  like_count?: number | null;
  mention?: TalkCommentMention | null;
  operation_histories?: TalkCommentHistory[] | null;
  created_at?: string | null;
  updated_at?: string | null;
  deleted_at?: string | null;
};

export type PaginatedBlock<T> = {
  items?: T[] | null;
  meta?: DataTableMeta | null;
};

export type TalkDetailResponse = {
  id: number;
  author?: TalkAuthor | null;
  category?: TalkCategory | null;
  title?: string | null;
  content?: string | null;
  status?: string | null;
  post_status?: string | null;
  author_ip?: string | null;
  is_pinned?: boolean | null;
  pinned_order?: number | null;
  view_count?: number | null;
  comment_count?: number | null;
  like_count?: number | null;
  save_count?: number | null;
  images?: TalkMediaAsset[] | null;
  poll?: TalkPoll | null;
  operation_histories?: PaginatedBlock<TalkOperationHistory> | null;
  comments?: PaginatedBlock<TalkDetailComment> | null;
  created_at?: string | null;
  updated_at?: string | null;
  deleted_at?: string | null;
};

export const TALK_DETAIL_COMMENT_PER_PAGE_OPTIONS = [10, 20, 50] as const;
export const TALK_DETAIL_HISTORY_PER_PAGE = 15;

export function formatTalkDetailDateTime(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function formatTalkDetailCategory(category?: TalkCategory | null) {
  return formatTalkCategoryName(category) || category?.name?.trim() || "-";
}

export function formatTalkAuthorName(author?: TalkAuthor | null) {
  return author?.nickname?.trim() || author?.name?.trim() || "-";
}

export function labelTalkVisibilityStatus(status?: string | null) {
  return status === "INACTIVE" ? "미노출" : "노출";
}

export function labelTalkDetailPostStatus(status?: string | null) {
  return labelTalkPostStatus(status?.trim() || "POST_NORMAL");
}

export function labelTalkHistoryChange(history: TalkOperationHistory) {
  if (history.field === "status") {
    return labelTalkVisibilityStatus(stringifyHistoryValue(history.after_value));
  }

  if (history.field === "post_status") {
    return labelTalkDetailPostStatus(stringifyHistoryValue(history.after_value));
  }

  return history.action?.trim() || "-";
}

export function labelTalkCommentHistoryChange(history: TalkCommentHistory) {
  if (history.status) {
    return labelTalkVisibilityStatus(history.status);
  }

  if (history.post_status) {
    return labelTalkDetailPostStatus(history.post_status);
  }

  return "-";
}

function stringifyHistoryValue(value: unknown) {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}
