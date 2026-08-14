"use client";

import React from "react";

import { Hospital } from "@beaulab/ui-admin";

export type HospitalWalletHospitalListItem = {
  id: number;
  name: string;
};

type HospitalWalletHospitalListHoverMemoProps = {
  tooltipId: string;
  label: React.ReactNode;
  hospitals: HospitalWalletHospitalListItem[];
  variant?: "default" | "error";
  className?: string;
};

export function HospitalWalletHospitalListHoverMemo({
  tooltipId,
  label,
  hospitals,
  variant = "default",
  className = "",
}: HospitalWalletHospitalListHoverMemoProps) {
  const triggerClassName =
    variant === "error"
      ? "text-xs font-normal text-error-500 underline decoration-error-300 underline-offset-2 hover:text-error-600 focus-visible:text-error-600"
      : "text-sm font-semibold text-gray-600 hover:text-brand-500 focus-visible:text-brand-500";

  return (
    <div className={"group relative inline-flex " + className}>
      <button
        type="button"
        className={"inline-flex items-center gap-1.5 transition-colors focus-visible:outline-none " + triggerClassName}
        aria-describedby={tooltipId}
      >
        {variant === "default" ? <Hospital className="size-4" /> : null}
        {label}
      </button>
      <div
        id={tooltipId}
        role="tooltip"
        className="invisible absolute top-full left-0 z-20 min-w-64 pt-2 opacity-0 transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100"
      >
        <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
          <p className="mb-2 text-xs font-semibold text-gray-700">병의원 목록</p>
          <div className="space-y-1">
            {hospitals.map((hospital) => (
              <p key={hospital.id} className="text-xs leading-5 break-words text-gray-600">
                {hospital.name}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
