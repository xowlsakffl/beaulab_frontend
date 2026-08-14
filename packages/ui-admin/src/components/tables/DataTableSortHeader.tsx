"use client";

import React from "react";

import { ChevronDown, ChevronUp, ChevronsUpDown } from "../../icons";
import { Button } from "../ui";

export function DataTableSortHeader({
  label,
  active,
  direction,
  onClick,
}: {
  label: React.ReactNode;
  active: boolean;
  direction: "asc" | "desc";
  onClick: () => void;
}) {
  const icon = !active ? (
    <ChevronsUpDown className="size-4" />
  ) : direction === "desc" ? (
    <ChevronDown className="size-4" />
  ) : (
    <ChevronUp className="size-4" />
  );

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="inline-flex items-center gap-1 px-0 text-xs"
    >
      {label} <span className="text-gray-400">{icon}</span>
    </Button>
  );
}
