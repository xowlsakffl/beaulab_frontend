"use client";

import React from "react";

import { VisibilityActionButtons } from "@/components/common/VisibilityActionButtons";

const detailGridClass = "grid grid-cols-[6.25rem_minmax(0,1fr)] items-start gap-4";
const detailLabelClass = "pt-0.5 text-xs font-semibold text-gray-500 ";
const detailValueClass = "min-w-0 break-words text-sm leading-6 text-gray-800 ";

export function DetailField({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={[detailGridClass, className].filter(Boolean).join(" ")}>
      <p className={detailLabelClass}>{label}</p>
      <div className={detailValueClass}>{value}</div>
    </div>
  );
}

export function EmptyDetailState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
      {children}
    </div>
  );
}

export function ReportedOriginalVisibilityButtons({
  status,
  disabled,
  onChange,
}: {
  status?: string | null;
  disabled: boolean;
  onChange: (status: "ACTIVE" | "INACTIVE") => void;
}) {
  return <VisibilityActionButtons status={status} disabled={disabled} onChange={onChange} />;
}
