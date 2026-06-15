"use client";

import { Button } from "@beaulab/ui-admin";

type VisibilityStatus = "ACTIVE" | "INACTIVE" | string | null | undefined;

type VisibilityActionButtonsProps = {
  status?: VisibilityStatus;
  disabled?: boolean;
  mode?: "action" | "current";
  className?: string;
  onChange: (status: "ACTIVE" | "INACTIVE") => void;
};

const buttonClassName = "h-9 min-w-16 px-3 text-sm";

export function VisibilityActionButtons({
  status,
  disabled = false,
  mode = "action",
  className = "",
  onChange,
}: VisibilityActionButtonsProps) {
  const visible = status !== "INACTIVE";
  const activeButtonVariant = mode === "current"
    ? (visible ? "brand" : "outline")
    : (visible ? "outline" : "brand");
  const inactiveButtonVariant = mode === "current"
    ? (visible ? "outline" : "brand")
    : (visible ? "brand" : "outline");

  return (
    <div className={["flex items-center gap-2", className].filter(Boolean).join(" ")}>
      <Button
        type="button"
        size="sm"
        variant={activeButtonVariant}
        disabled={disabled || (mode === "action" && visible)}
        onClick={() => onChange("ACTIVE")}
        className={buttonClassName}
      >
        노출
      </Button>
      <Button
        type="button"
        size="sm"
        variant={inactiveButtonVariant}
        disabled={disabled || (mode === "action" && !visible)}
        onClick={() => onChange("INACTIVE")}
        className={buttonClassName}
      >
        미노출
      </Button>
    </div>
  );
}
