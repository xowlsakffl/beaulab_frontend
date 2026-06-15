"use client";

import * as React from "react";
import { X } from "../../../icons";
import { cn } from "../../../lib/utils";

export type CircleRemoveButtonProps = React.ComponentProps<"button"> & {
  iconClassName?: string;
};

export function CircleRemoveButton({
  className,
  iconClassName,
  type = "button",
  "aria-label": ariaLabel = "삭제",
  ...props
}: CircleRemoveButtonProps) {
  return (
    <button
      type={type}
      aria-label={ariaLabel}
      className={cn(
        "inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-500 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <X className={cn("size-3.5", iconClassName)} />
    </button>
  );
}

export default CircleRemoveButton;
