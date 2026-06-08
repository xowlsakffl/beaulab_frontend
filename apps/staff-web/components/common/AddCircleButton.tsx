"use client";

import type { ComponentProps } from "react";
import { Button, Plus } from "@beaulab/ui-admin";

type AddCircleButtonProps = Omit<ComponentProps<typeof Button>, "children" | "variant" | "size"> & {
  label: string;
};

export function AddCircleButton({ label, className = "", ...props }: AddCircleButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={label}
      className={[
        "rounded-full border border-gray-300 bg-white text-[#FA2875] shadow-none hover:border-gray-300 hover:bg-white hover:text-[#FA2875]",
        className,
      ].join(" ")}
      {...props}
    >
      <Plus className="size-4" strokeWidth={2.25} />
    </Button>
  );
}
