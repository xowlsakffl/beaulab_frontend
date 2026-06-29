"use client";

import React from "react";
import { ArrowRight, StatusBadge } from "@beaulab/ui-admin";
import type { BadgeColor } from "@beaulab/ui-admin";

import { reportStatusBadgeColor } from "@/components/common/ReportStatusBadge";
import { hospitalEventAllowStatusColor, labelHospitalEventAllowStatus } from "@/lib/hospital-event/list";

export type OperationHistoryChangeLike = {
  field_key?: string | null;
  field_label?: string | null;
  before_value?: unknown;
  after_value?: unknown;
  before_display?: string | null;
  after_display?: string | null;
};

export type OperationHistoryLike = {
  action?: string | null;
  action_label?: string | null;
  field?: string | null;
  before_value?: unknown;
  after_value?: unknown;
  reason?: string | null;
  metadata?: Record<string, unknown> | null;
  changes?: OperationHistoryChangeLike[] | null;
};

type OperationHistoryActionBadgeProps = {
  history: OperationHistoryLike;
  fallbackAction?: string;
  actionLabelOverride?: (history: OperationHistoryLike, label: string) => string | null | undefined;
};

export function OperationHistoryActionBadge({
  history,
  fallbackAction,
  actionLabelOverride,
}: OperationHistoryActionBadgeProps) {
  const action = normalizeAction(history.action, fallbackAction);
  const baseLabel = history.action_label?.trim() || labelHistoryAction(action) || fallbackAction || "-";
  const label = actionLabelOverride?.(history, baseLabel) || baseLabel;

  return <span className="text-xs font-medium whitespace-nowrap text-gray-700">{label}</span>;
}

type OperationHistoryReasonProps = {
  history: OperationHistoryLike;
  fallbackReason?: string | null;
  statusLabel?: (status: string, fallbackLabel?: string) => string;
  statusBadgeColor?: (status: string) => BadgeColor;
  allowStatusLabel?: (status: string, fallbackLabel?: string) => string;
};

export function OperationHistoryReason({
  history,
  fallbackReason,
  statusLabel,
  statusBadgeColor,
  allowStatusLabel,
}: OperationHistoryReasonProps) {
  const transition = resolveTransition(history);
  const reason = normalizeDisplayReason(history.reason?.trim() || fallbackReason?.trim() || "");

  if (transition && isStatusField(transition.field)) {
    return (
      <span className="inline-flex min-w-0 flex-col gap-1">
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
          <HistoryStatusValueBadge
            transition={transition}
            side="before"
            statusLabel={statusLabel}
            statusBadgeColor={statusBadgeColor}
            allowStatusLabel={allowStatusLabel}
          />
          {transition.beforeLabel !== "-" && transition.afterLabel !== "-" ? (
            <ArrowRight className="size-3 text-brand-500" strokeWidth={2.4} />
          ) : null}
          <HistoryStatusValueBadge
            transition={transition}
            side="after"
            statusLabel={statusLabel}
            statusBadgeColor={statusBadgeColor}
            allowStatusLabel={allowStatusLabel}
          />
        </span>
        {reason ? <HistoryReasonNote reason={reason} /> : null}
      </span>
    );
  }

  if (reason) return <HistoryReasonNote reason={reason} />;

  if (normalizeAction(history.action) === "UPDATED") {
    const labels = (history.changes ?? [])
      .map((change) => (change.field_label || change.field_key || "").trim())
      .filter(Boolean);

    if (labels.length > 0) {
      return `${Array.from(new Set(labels)).join(", ")} 수정`;
    }

    return "수정";
  }

  return "-";
}

function HistoryReasonNote({ reason }: { reason: string }) {
  return (
    <span className="ml-1 inline-flex max-w-full items-start gap-1.5 text-xs leading-5 text-gray-500">
      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-400" aria-hidden="true" />
      <span className="shrink-0 font-medium text-gray-500">사유:</span>
      <span className="min-w-0 break-words text-gray-600">{reason}</span>
    </span>
  );
}

function normalizeDisplayReason(reason: string) {
  if (!reason) return "";

  const legacyPrefixes = ["신고 처리 노출중지 - ", "신고 처리 - ", "신고 무시 처리 - "];

  for (const prefix of legacyPrefixes) {
    if (reason.startsWith(prefix)) {
      return reason.slice(prefix.length).trim();
    }
  }

  const systemReasons = new Set([
    "신고 처리 노출중지",
    "신고 처리 정상노출",
    "신고 처리 재노출",
    "신고 처리",
    "신고 무시 처리",
    "신고 경고 처리",
    "신고 경고 처리 - 누적 10회 차단",
    "신고 경고 무시",
    "신고 경고 무시 - 누적 차단 해제",
  ]);

  return systemReasons.has(reason) ? "" : reason;
}

function normalizeAction(action?: string | null, fallbackAction?: string) {
  return action?.trim() || fallbackAction?.trim() || "";
}

function labelHistoryAction(action?: string | null) {
  switch (action) {
    case "CREATED":
      return "생성";
    case "UPDATED":
      return "수정";
    case "STATUS_UPDATED":
      return "상태 변경";
    case "DELETED":
      return "삭제";
    default:
      return action?.trim() || "";
  }
}

function resolveTransition(history: OperationHistoryLike) {
  const reportStatusTransition = resolveReportStatusTransition(history);
  if (reportStatusTransition) {
    return reportStatusTransition;
  }

  const firstChange = history.changes?.[0] ?? null;
  if (firstChange) {
    const field = firstChange.field_key ?? history.field ?? null;

    return {
      field,
      beforeRaw: firstChange.before_value,
      afterRaw: firstChange.after_value,
      beforeLabel: stringifyHistoryValue(firstChange.before_display ?? firstChange.before_value),
      afterLabel: stringifyHistoryValue(firstChange.after_display ?? firstChange.after_value),
    };
  }

  const field = history.field ?? null;
  if (!field) return null;

  return {
    field,
    beforeRaw: history.before_value,
    afterRaw: history.after_value,
    beforeLabel: statusDisplayLabel(field, history.before_value),
    afterLabel: statusDisplayLabel(field, history.after_value),
  };
}

function resolveReportStatusTransition(history: OperationHistoryLike) {
  const metadata = history.metadata;
  if (!metadata || typeof metadata !== "object") return null;

  const beforeRaw = metadata.report_status_before;
  const afterRaw = metadata.report_status_after;
  const beforeLabel = statusDisplayLabel("report_status", beforeRaw);
  const afterLabel = statusDisplayLabel("report_status", afterRaw);

  if (beforeLabel === "-" || afterLabel === "-" || beforeLabel === afterLabel) {
    return null;
  }

  return {
    field: "report_status",
    beforeRaw,
    afterRaw,
    beforeLabel,
    afterLabel,
  };
}

function isStatusField(field?: string | null) {
  return (
    field === "status" ||
    field === "allow_status" ||
    field === "receipt_status" ||
    field === "warning_status" ||
    field === "report_status"
  );
}

function HistoryStatusValueBadge({
  transition,
  side,
  statusLabel,
  statusBadgeColor,
  allowStatusLabel,
}: {
  transition: NonNullable<ReturnType<typeof resolveTransition>>;
  side: "before" | "after";
  statusLabel?: (status: string, fallbackLabel?: string) => string;
  statusBadgeColor?: (status: string) => BadgeColor;
  allowStatusLabel?: (status: string, fallbackLabel?: string) => string;
}) {
  const rawValue = side === "before" ? transition.beforeRaw : transition.afterRaw;
  const label = side === "before" ? transition.beforeLabel : transition.afterLabel;

  if (label === "-") {
    return null;
  }

  if (transition.field === "report_status") {
    return (
      <StatusBadge
        size="sm"
        color={reportStatusBadgeColor(stringifyHistoryValue(rawValue))}
        className="h-5 px-2 text-[11px] leading-none"
      >
        {statusDisplayLabel(transition.field, rawValue, label, statusLabel, allowStatusLabel)}
      </StatusBadge>
    );
  }

  return (
    <StatusBadge
      size="sm"
      color={statusColor(transition.field, rawValue, statusBadgeColor)}
      className="h-5 px-2 text-[11px] leading-none"
    >
      {statusDisplayLabel(transition.field, rawValue, label, statusLabel, allowStatusLabel)}
    </StatusBadge>
  );
}

function statusDisplayLabel(
  field?: string | null,
  value?: unknown,
  fallbackLabel?: string,
  statusLabel?: (status: string, fallbackLabel?: string) => string,
  allowStatusLabel?: (status: string, fallbackLabel?: string) => string,
) {
  const normalized = stringifyHistoryValue(value);
  if (field === "status") {
    if (statusLabel) {
      return statusLabel(normalized, fallbackLabel) || fallbackLabel || normalized || "-";
    }

    return normalized === "INACTIVE" ? "미노출" : normalized === "ACTIVE" ? "노출" : fallbackLabel || normalized || "-";
  }

  if (field === "allow_status") {
    if (allowStatusLabel) {
      return allowStatusLabel(normalized, fallbackLabel) || fallbackLabel || normalized || "-";
    }

    const label = labelHospitalEventAllowStatus(normalized);
    return label === "-" ? fallbackLabel || normalized || "-" : label;
  }

  if (field === "receipt_status") {
    return labelReceiptStatus(normalized, fallbackLabel);
  }

  if (field === "warning_status") {
    return labelWarningStatus(normalized, fallbackLabel);
  }

  if (field === "report_status") {
    return labelReportStatus(normalized, fallbackLabel);
  }

  return fallbackLabel || normalized || "-";
}

function statusColor(
  field?: string | null,
  value?: unknown,
  statusBadgeColor?: (status: string) => BadgeColor,
): BadgeColor {
  const normalized = stringifyHistoryValue(value);
  if (field === "status") {
    if (statusBadgeColor) {
      return statusBadgeColor(normalized);
    }

    return normalized === "ACTIVE" ? "success" : normalized === "INACTIVE" ? "error" : "light";
  }

  if (field === "allow_status") {
    return hospitalEventAllowStatusColor(normalized);
  }

  if (field === "receipt_status") {
    if (normalized === "VERIFIED") return "success";
    if (normalized === "REJECTED") return "error";
    if (normalized === "UPLOADED") return "warning";
    return "light";
  }

  if (field === "warning_status") {
    if (normalized === "WARNED") return "error";
    if (normalized === "IGNORED") return "light";
    return "light";
  }

  if (field === "report_status") {
    if (normalized === "NORMAL_VISIBLE" || normalized === "REEXPOSED" || normalized === "VALID") return "success";
    if (normalized === "AUTO_BLOCKED" || normalized === "INVALID") return "error";
    if (normalized === "ADMIN_HIDDEN" || normalized === "REPORTED" || normalized === "RECEIVED") return "warning";
    return "light";
  }

  return "light";
}

function labelReceiptStatus(value: string, fallbackLabel?: string) {
  switch (value) {
    case "UPLOADED":
      return "영수증";
    case "VERIFIED":
      return "영수증 인증";
    case "REJECTED":
      return "영수증 부적합";
    case "NONE":
      return "없음";
    default:
      return fallbackLabel || value || "-";
  }
}

function labelWarningStatus(value: string, fallbackLabel?: string) {
  switch (value) {
    case "WARNED":
      return "경고";
    case "IGNORED":
      return "무시";
    case "NONE":
      return "미처리";
    default:
      return fallbackLabel || value || "-";
  }
}

function labelReportStatus(value: string, fallbackLabel?: string) {
  switch (value) {
    case "NONE":
      return "미처리";
    case "REPORTED":
    case "RECEIVED":
      return "신고접수";
    case "AUTO_BLOCKED":
      return "자동차단";
    case "ADMIN_HIDDEN":
      return "노출중지";
    case "NORMAL_VISIBLE":
      return "정상노출";
    case "REEXPOSED":
      return "재노출";
    case "VALID":
      return "신고";
    case "INVALID":
      return "무시";
    default:
      return fallbackLabel || value || "-";
  }
}

function stringifyHistoryValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
