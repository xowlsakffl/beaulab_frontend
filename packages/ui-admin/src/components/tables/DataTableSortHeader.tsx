"use client";

import React from "react";

import { ChevronDown, ChevronUp, ChevronsUpDown } from "../../icons";
import { Button } from "../ui";

function DataTableSortMark({ active, direction }: { active: boolean; direction: "asc" | "desc" }) {
  if (!active) return <ChevronsUpDown className="size-4" />;

  return direction === "desc" ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />;
}

export function DataTableSortHeader({
  label,
  active,
  direction,
  onClick,
  className = "inline-flex items-center gap-1 px-0 text-xs",
  labelClassName,
  iconClassName = "text-gray-400",
}: {
  label: React.ReactNode;
  active: boolean;
  direction: "asc" | "desc";
  onClick: () => void;
  className?: string;
  labelClassName?: string;
  iconClassName?: string;
}) {
  return (
    <Button type="button" variant="ghost" size="sm" onClick={onClick} className={className}>
      {labelClassName ? <span className={labelClassName}>{label}</span> : label}
      <span className={iconClassName}>
        <DataTableSortMark active={active} direction={direction} />
      </span>
    </Button>
  );
}
