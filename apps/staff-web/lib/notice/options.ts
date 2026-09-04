export const NOTICE_CHANNEL_OPTIONS = [
  { value: "ALL", label: "전체 채널" },
  { value: "APP_WEB", label: "앱/웹" },
  { value: "HOSPITAL", label: "병의원" },
  { value: "BEAUTY", label: "뷰티" },
];

export const NOTICE_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "공개" },
  { value: "INACTIVE", label: "비공개" },
];

export function labelNoticeChannel(value?: string | null) {
  return NOTICE_CHANNEL_OPTIONS.find((option) => option.value === value)?.label ?? (value?.trim() || "-");
}

export function labelNoticeStatus(value?: string | null) {
  return NOTICE_STATUS_OPTIONS.find((option) => option.value === value)?.label ?? (value?.trim() || "-");
}
