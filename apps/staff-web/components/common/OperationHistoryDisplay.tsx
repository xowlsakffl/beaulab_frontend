"use client";

import React from "react";
import { ArrowRight, StatusBadge } from "@beaulab/ui-admin";
import type { BadgeColor } from "@beaulab/ui-admin";

import { reportStatusBadgeColor } from "@/components/common/ReportStatusBadge";
import {
  hospitalEventAdminStatusColor,
  hospitalEventAllowStatusColor,
  hospitalEventHospitalStatusColor,
  labelHospitalEventAdminStatus,
  labelHospitalEventHospitalStatus,
} from "@/lib/hospital-event/list";

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
  const action = normalizeAction(history.action);
  const transitions = resolveTransitions(history);
  const reason = normalizeDisplayReason(history.reason?.trim() || fallbackReason?.trim() || "");

  if (isStateAction(action) && transitions.length > 0) {
    return (
      <span className="inline-flex min-w-0 flex-col gap-1">
        {transitions.map((transition, index) => (
          <HistoryTransitionLine
            key={`${transition.field ?? "field"}-${index}`}
            transition={transition}
            statusLabel={statusLabel}
            statusBadgeColor={statusBadgeColor}
            allowStatusLabel={allowStatusLabel}
          />
        ))}
        {reason ? <HistoryReasonNote reason={reason} /> : null}
      </span>
    );
  }

  if (reason) return <HistoryReasonNote reason={reason} />;

  if (action === "UPDATED") {
    return summarizeUpdatedChanges(history.changes);
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
    case "STATE_UPDATED":
      return "상태 변경";
    case "DELETED":
      return "삭제";
    default:
      return action?.trim() || "";
  }
}

function summarizeUpdatedChanges(changes?: OperationHistoryChangeLike[] | null) {
  const labels = Array.from(
    new Set(
      (changes ?? [])
        .map((change) => normalizeOperationHistoryFieldLabel(change.field_label, change.field_key))
        .filter(Boolean),
    ),
  );

  if (labels.length === 0) {
    return "수정";
  }

  if (labels.length === 1) {
    return `${labels[0]} 변경`;
  }

  return `${labels[0]} 외 ${labels.length - 1}개 변경`;
}

type HistoryTransition = {
  field: string | null;
  fieldLabel: string;
  beforeRaw: unknown;
  afterRaw: unknown;
  beforeLabel: string;
  afterLabel: string;
};

function resolveTransitions(history: OperationHistoryLike): HistoryTransition[] {
  const changes = history.changes ?? [];

  if (changes.length > 0) {
    return changes.map((change) => {
      const field = change.field_key ?? history.field ?? null;
      const contentReportAdminStatus = isContentReportHistory(history) && field === "admin_status";

      return {
        field,
        fieldLabel: contentReportAdminStatus
          ? "강제중지"
          : normalizeOperationHistoryFieldLabel(change.field_label, defaultFieldLabel(field)),
        beforeRaw: change.before_value,
        afterRaw: change.after_value,
        beforeLabel: contentReportAdminStatus
          ? contentReportTargetStatusLabel(change.before_value, change.before_display)
          : stringifyHistoryValue(change.before_display ?? change.before_value),
        afterLabel: contentReportAdminStatus
          ? contentReportTargetStatusLabel(change.after_value, change.after_display)
          : stringifyHistoryValue(change.after_display ?? change.after_value),
      };
    });
  }

  const reportStatusTransition = resolveReportStatusTransition(history);
  if (reportStatusTransition) {
    return [reportStatusTransition];
  }

  const field = history.field ?? null;
  if (!field) return [];

  return [
    {
      field,
      fieldLabel: defaultFieldLabel(field),
      beforeRaw: history.before_value,
      afterRaw: history.after_value,
      beforeLabel: statusDisplayLabel(field, history.before_value),
      afterLabel: statusDisplayLabel(field, history.after_value),
    },
  ];
}

function isContentReportHistory(history: OperationHistoryLike) {
  const source = history.metadata?.source;

  return typeof source === "string" && source.includes("content_report");
}

function contentReportTargetStatusLabel(value: unknown, display?: string | null) {
  const normalized = stringifyHistoryValue(value);
  const displayLabel = display?.trim();

  if (normalized === "NORMAL" || displayLabel === "정상") {
    return "정상";
  }

  if (normalized === "FORCED_STOPPED" || displayLabel === "강제중지") {
    return "강제중지";
  }

  return displayLabel || normalized || "-";
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
    fieldLabel: defaultFieldLabel("report_status"),
    beforeRaw,
    afterRaw,
    beforeLabel,
    afterLabel,
  };
}

function HistoryTransitionLine({
  transition,
  statusLabel,
  statusBadgeColor,
  allowStatusLabel,
}: {
  transition: HistoryTransition;
  statusLabel?: (status: string, fallbackLabel?: string) => string;
  statusBadgeColor?: (status: string) => BadgeColor;
  allowStatusLabel?: (status: string, fallbackLabel?: string) => string;
}) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 whitespace-nowrap">
      <span className="shrink-0 font-medium text-gray-700">{transition.fieldLabel}:</span>
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
  );
}

function HistoryStatusValueBadge({
  transition,
  side,
  statusLabel,
  statusBadgeColor,
  allowStatusLabel,
}: {
  transition: HistoryTransition;
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
        className="h-5 px-2 text-xs leading-none"
      >
        {statusDisplayLabel(transition.field, rawValue, label, statusLabel, allowStatusLabel)}
      </StatusBadge>
    );
  }

  return (
    <StatusBadge
      size="sm"
      color={statusColor(transition.field, rawValue, statusBadgeColor)}
      className="h-5 px-2 text-xs leading-none"
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
  const displayLabel = fallbackLabel?.trim();

  if (field === "report_status" && statusLabel) {
    return statusLabel(normalized, displayLabel || fallbackLabel) || displayLabel || normalized || "-";
  }

  if (displayLabel && displayLabel !== "-" && displayLabel !== normalized) {
    return displayLabel;
  }

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

    return fallbackLabel || normalized || "-";
  }

  if (field === "admin_status") {
    return labelHospitalEventAdminStatus(displayLabel || normalized);
  }

  if (field === "hospital_status") {
    return labelHospitalEventHospitalStatus(displayLabel || normalized);
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

  if (field === "admin_status") {
    return hospitalEventAdminStatusColor(normalized);
  }

  if (field === "hospital_status") {
    return hospitalEventHospitalStatusColor(normalized);
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

function isStateAction(action?: string | null) {
  return action === "STATE_UPDATED";
}

export function normalizeOperationHistoryFieldLabel(fieldLabel?: string | null, fallback?: string | null) {
  const label = (fieldLabel || fallback || "").trim();
  if (!label) return "";

  return label.endsWith(" 변경") ? label.slice(0, -" 변경".length).trim() : label;
}

function defaultFieldLabel(field?: string | null) {
  switch (field) {
    case "status":
      return "노출여부";
    case "allow_status":
      return "검수상태";
    case "admin_status":
      return "강제중지";
    case "hospital_status":
      return "공개여부";
    case "receipt_status":
      return "영수증 상태";
    case "warning_status":
      return "경고여부";
    case "report_status":
      return "조치유형";
    default:
      return field?.trim() || "변경 항목";
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
