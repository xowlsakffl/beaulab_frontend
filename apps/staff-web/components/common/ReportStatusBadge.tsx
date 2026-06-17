import { StatusBadge } from "@beaulab/ui-admin";
import type { BadgeColor } from "@beaulab/ui-admin";

export function reportStatusBadgeColor(status?: string | null): BadgeColor {
  if (status === "REPORTED" || status === "RECEIVED") return "yellow";
  if (status === "AUTO_BLOCKED" || status === "INACTIVE") return "red";
  if (status === "ADMIN_HIDDEN") return "orange";
  if (status === "NORMAL_VISIBLE") return "green";
  if (status === "REEXPOSED") return "blue";
  if (status === "VALID") return "red";
  if (status === "INVALID") return "gray";

  return "gray";
}

export function ReportStatusBadge({
  label,
  status,
}: {
  label?: string | null;
  status?: string | null;
}) {
  if (!label) return <span className="text-sm text-gray-400">-</span>;

  return (
    <StatusBadge size="sm" color={reportStatusBadgeColor(status)}>
      {label}
    </StatusBadge>
  );
}
