"use client";

import type { ComponentProps } from "react";
import { Button, Plus } from "@beaulab/ui-admin";

type AddCircleButtonProps = Omit<ComponentProps<typeof Button>, "children" | "variant" | "size"> & {
  label: string;
  fullWidth?: boolean;
};

const circleClassName = "size-7 rounded-full border border-gray-300 bg-white text-[#FA2875]";

export function AddCircleIcon() {
  return (
    <span aria-hidden="true" className={`inline-flex shrink-0 items-center justify-center ${circleClassName}`}>
      <Plus className="size-3.5" strokeWidth={2.25} />
    </span>
  );
}

export function AddCircleButton({ label, fullWidth = false, className = "", ...props }: AddCircleButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size={fullWidth ? "default" : "icon"}
      aria-label={label}
      title={label}
      className={[
        "p-0 shadow-none",
        fullWidth
          ? "h-11 w-full rounded-md border border-gray-200 bg-gray-50 hover:bg-brand-50"
          : `${circleClassName} hover:border-gray-300 hover:bg-white hover:text-[#FA2875]`,
        className,
      ].join(" ")}
      {...props}
    >
      {fullWidth ? <AddCircleIcon /> : <Plus className="size-3.5" strokeWidth={2.25} />}
    </Button>
  );
}
