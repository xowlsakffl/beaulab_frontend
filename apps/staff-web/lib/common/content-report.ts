export type ContentReportSummary = {
  status?: string | null;
  report_status?: string | null;
  label?: string | null;
  report_label?: string | null;
};

export const VISIBLE_REPORT_STATUS_LABELS: Record<string, string> = {
  AUTO_BLOCKED: "자동차단",
  ADMIN_HIDDEN: "노출중지",
  NORMAL_VISIBLE: "정상노출",
  REEXPOSED: "재노출",
};

export const VISIBILITY_LOCKING_REPORT_STATUS_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "전체" },
  { value: "AUTO_BLOCKED", label: VISIBLE_REPORT_STATUS_LABELS.AUTO_BLOCKED },
  { value: "ADMIN_HIDDEN", label: VISIBLE_REPORT_STATUS_LABELS.ADMIN_HIDDEN },
  { value: "NORMAL_VISIBLE", label: VISIBLE_REPORT_STATUS_LABELS.NORMAL_VISIBLE },
  { value: "REEXPOSED", label: VISIBLE_REPORT_STATUS_LABELS.REEXPOSED },
];

export const VISIBLE_REPORT_STATUS_VALUE_SET = new Set(
  Object.keys(VISIBLE_REPORT_STATUS_LABELS),
);

export const VISIBILITY_LOCKING_REPORT_STATUS_VALUE_SET = new Set(
  ["AUTO_BLOCKED", "ADMIN_HIDDEN"],
);

export function normalizeReportStatus(report?: ContentReportSummary | null) {
  return (report?.status ?? report?.report_status ?? "").trim();
}

export function isVisibilityLockedByReport(report?: ContentReportSummary | null) {
  return VISIBILITY_LOCKING_REPORT_STATUS_VALUE_SET.has(normalizeReportStatus(report));
}

export function formatVisibleReportStatusLabel(report?: ContentReportSummary | null) {
  const status = normalizeReportStatus(report);
  if (!VISIBLE_REPORT_STATUS_VALUE_SET.has(status)) return "";

  return report?.label?.trim()
    || report?.report_label?.trim()
    || VISIBLE_REPORT_STATUS_LABELS[status]
    || "";
}

export function normalizePostManagementStatus(
  report?: ContentReportSummary | null,
  contentStatus?: string | null,
) {
  const reportStatus = normalizeReportStatus(report);
  if (VISIBLE_REPORT_STATUS_VALUE_SET.has(reportStatus)) return reportStatus;

  return contentStatus?.trim() === "INACTIVE" ? "INACTIVE" : "";
}

export function formatPostManagementStatusLabel(
  report?: ContentReportSummary | null,
  contentStatus?: string | null,
) {
  const reportLabel = formatVisibleReportStatusLabel(report);
  if (reportLabel) return reportLabel;

  return contentStatus?.trim() === "INACTIVE" ? "미노출" : "";
}
