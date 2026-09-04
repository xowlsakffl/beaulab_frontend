export type NoticeAttachment = {
  id: number;
  file_name?: string | null;
  download_path?: string | null;
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

export type NoticeStaffUser = {
  id: number;
  name?: string | null;
  email?: string | null;
};

export type NoticeDetailResponse = {
  id: number;
  channel: string;
  title: string;
  content: string;
  status: string;
  is_pinned: boolean;
  view_count: number;
  creator?: NoticeStaffUser | null;
  updater?: NoticeStaffUser | null;
  attachments?: NoticeAttachment[] | null;
  created_at?: string | null;
  updated_at?: string | null;
};

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

export function getNoticeAttachmentFilename(attachment?: NoticeAttachment | null) {
  const originalName = attachment?.file_name?.trim();
  if (originalName) return originalName;

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
