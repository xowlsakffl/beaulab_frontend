export type ContentReportSummary = {
  status?: string | null;
  report_status?: string | null;
  label?: string | null;
  report_label?: string | null;
};

export const VISIBILITY_LOCKING_REPORT_STATUS_LABELS: Record<string, string> = {
  AUTO_BLOCKED: "자동차단",
  ADMIN_HIDDEN: "노출중지",
};

export const VISIBILITY_LOCKING_REPORT_STATUS_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "전체" },
  { value: "AUTO_BLOCKED", label: VISIBILITY_LOCKING_REPORT_STATUS_LABELS.AUTO_BLOCKED },
  { value: "ADMIN_HIDDEN", label: VISIBILITY_LOCKING_REPORT_STATUS_LABELS.ADMIN_HIDDEN },
];

export const VISIBILITY_LOCKING_REPORT_STATUS_VALUE_SET = new Set(
  Object.keys(VISIBILITY_LOCKING_REPORT_STATUS_LABELS),
);

export function normalizeReportStatus(report?: ContentReportSummary | null) {
  return (report?.status ?? report?.report_status ?? "").trim();
}

export function isVisibilityLockedByReport(report?: ContentReportSummary | null) {
  return VISIBILITY_LOCKING_REPORT_STATUS_VALUE_SET.has(normalizeReportStatus(report));
}

export function formatVisibleReportStatusLabel(report?: ContentReportSummary | null) {
  const status = normalizeReportStatus(report);
  if (!VISIBILITY_LOCKING_REPORT_STATUS_VALUE_SET.has(status)) return "";

  return report?.label?.trim()
    || report?.report_label?.trim()
    || VISIBILITY_LOCKING_REPORT_STATUS_LABELS[status]
    || "";
}
