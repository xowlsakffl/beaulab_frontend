export type AccountUserNotificationSettings = {
  comment_notification_enabled?: boolean | null;
  note_notification_enabled?: boolean | null;
  marketing_sms_agreed?: boolean | null;
  marketing_email_agreed?: boolean | null;
  marketing_push_agreed?: boolean | null;
  marketing_night_push_agreed?: boolean | null;
};

export type AccountUserConsultationInfo = {
  event_applications?: number | null;
  remote_consultations?: number | null;
  real_model_applications?: number | null;
};

export type AccountUserActivityBlock = {
  posts?: number | null;
  comments?: number | null;
  total?: number | null;
};

export type AccountUserReportedChatBlock = {
  warned?: number | null;
  total?: number | null;
};

export type AccountUserReportedWarningBlock = {
  count?: number | null;
};

export type AccountUserAccessLog = {
  ip?: string | null;
  accessed_at?: string | null;
};

export type AccountUserDetail = {
  id?: number | null;
  name?: string | null;
  nickname?: string | null;
  email?: string | null;
  phone?: string | null;
  signup_channel?: string | null;
  signup_channel_label?: string | null;
  status?: string | null;
  status_label?: string | null;
  warning_count?: number | null;
  blocked_at?: string | null;
  withdrawal_reason?: string | null;
  email_verified_at?: string | null;
  last_login_at?: string | null;
  last_accessed_at?: string | null;
  last_access_ip?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  deleted_at?: string | null;
  notification_settings?: AccountUserNotificationSettings | null;
  consultation_info?: AccountUserConsultationInfo | null;
  activity_info?: {
    hospital_reviews?: AccountUserActivityBlock | null;
    talks?: AccountUserActivityBlock | null;
    hospital_evaluations?: AccountUserActivityBlock | null;
  } | null;
  reported_info?: {
    hospital_reviews?: AccountUserActivityBlock | null;
    talks?: AccountUserActivityBlock | null;
    hospital_evaluations?: AccountUserActivityBlock | null;
    chats?: AccountUserReportedChatBlock | null;
    warnings?: AccountUserReportedWarningBlock | null;
  } | null;
  access_logs?: AccountUserAccessLog[] | null;
};

export type AccountUserDetailResponse = AccountUserDetail;

export type AdminNoteItem = {
  id?: number | null;
  target_type?: string | null;
  target_id?: number | null;
  note?: string | null;
  is_internal?: boolean | null;
  creator_name?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type AdminNoteListResponse = AdminNoteItem[];

export type AdminNoteCreateResponse = AdminNoteItem;

export const ACCOUNT_USER_ADMIN_NOTE_TARGET_TYPE = "account_user";

export function formatAccountUserDetailDateTime(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}.${month}.${day} ${hours}:${minutes}`;
}

export function formatAgreementLabel(value?: boolean | null) {
  return value ? "동의" : "동의안함";
}

export function numberValue(value?: number | null) {
  return Number(value ?? 0).toLocaleString();
}

export function compactPostCommentCount(block?: AccountUserActivityBlock | null) {
  return `${Number(block?.posts ?? 0).toLocaleString()}/${Number(block?.comments ?? 0).toLocaleString()}`;
}

export function totalCount(block?: AccountUserActivityBlock | AccountUserReportedChatBlock | null) {
  return Number(block?.total ?? 0).toLocaleString();
}
