export type ContentReportSummary = {
  status?: string | null;
  report_status?: string | null;
  label?: string | null;
  report_label?: string | null;
};

const VISIBILITY_LOCKING_REPORT_STATUS_LABELS: Record<string, string> = {
  AUTO_BLOCKED: "자동차단",
  ADMIN_HIDDEN: "노출중지",
};

export function normalizeReportStatus(report?: ContentReportSummary | null) {
  return (report?.status ?? report?.report_status ?? "").trim();
}

export function isVisibilityLockedByReport(report?: ContentReportSummary | null) {
  return Object.prototype.hasOwnProperty.call(VISIBILITY_LOCKING_REPORT_STATUS_LABELS, normalizeReportStatus(report));
}

export function formatVisibleReportStatusLabel(report?: ContentReportSummary | null) {
  const status = normalizeReportStatus(report);
  if (!Object.prototype.hasOwnProperty.call(VISIBILITY_LOCKING_REPORT_STATUS_LABELS, status)) return "";

  return report?.label?.trim()
    || report?.report_label?.trim()
    || VISIBILITY_LOCKING_REPORT_STATUS_LABELS[status]
    || "";
}
