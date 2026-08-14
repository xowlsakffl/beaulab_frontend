"use client";

import React from "react";
import { ChevronDown } from "../../../icons";
import { Button } from "../../ui/button/Button";
import { Card } from "../../ui/card/Card";
import Checkbox from "../input/Checkbox";
import type { CheckboxFilterOption } from "./CheckboxFilterDropdown";

type SingleCheckboxFilterDropdownProps = {
  label: string;
  value: string;
  options: readonly CheckboxFilterOption[];
  onChange: (value: string) => void;
  emptyLabel?: string;
  allLabel?: string;
  hideLabel?: boolean;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
};

const filterFieldLabelClass = "mb-1 text-xs font-medium text-gray-500";
const filterTriggerClass =
  "flex h-11 w-full min-w-0 items-center justify-between rounded-lg border border-gray-300 px-4 text-sm text-gray-700";

export function SingleCheckboxFilterDropdown({
  label,
  value,
  options,
  onChange,
  emptyLabel = "전체",
  allLabel = "전체",
  hideLabel = false,
  disabled = false,
  className,
  triggerClassName,
}: SingleCheckboxFilterDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const selectedLabel = React.useMemo(
    () => options.find((option) => option.value === value)?.label ?? emptyLabel,
    [emptyLabel, options, value],
  );

  React.useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);

    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isOpen]);

  const handleChange = (nextValue: string) => {
    onChange(nextValue);
    setIsOpen(false);
  };

  return (
    <div className={["w-full min-w-0", className].filter(Boolean).join(" ")}>
      {!hideLabel ? <p className={filterFieldLabelClass}>{label}</p> : null}
      <div ref={containerRef} className="relative">
        <Button
          type="button"
          variant="outline"
          size="default"
          disabled={disabled}
          onClick={() => setIsOpen((current) => !current)}
          className={[filterTriggerClass, disabled ? "cursor-not-allowed opacity-60" : "", triggerClassName, "h-11"]
            .filter(Boolean)
            .join(" ")}
        >
          <span className="min-w-0 flex-1 truncate text-left">{selectedLabel}</span>
          <ChevronDown className="size-4" />
        </Button>

        {isOpen ? (
          <Card className="absolute z-20 mt-1 w-full rounded-lg p-2 shadow-lg">
            <div className="px-1 py-1 text-sm">
              <Checkbox label={allLabel} checked={!value} onChange={() => handleChange("")} />
            </div>
            {options
              .filter((option) => option.value !== "")
              .map((option) => (
                <div key={option.value} className="px-1 py-1 text-sm">
                  <Checkbox
                    label={option.label}
                    checked={value === option.value}
                    onChange={() => handleChange(option.value)}
                  />
                </div>
              ))}
          </Card>
        ) : null}
      </div>
    </div>
  );
}

export default SingleCheckboxFilterDropdown;
