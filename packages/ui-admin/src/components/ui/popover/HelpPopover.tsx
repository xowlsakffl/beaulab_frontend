"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { CircleHelp } from "../../../icons";
import { cn } from "../../../lib/utils";
import { Button } from "../button/Button";

type HelpPopoverProps = {
  label: string;
  children: React.ReactNode;
  className?: string;
};

export function HelpPopover({ label, children, className }: HelpPopoverProps) {
  const id = React.useId();
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const [position, setPosition] = React.useState<React.CSSProperties>();
  const isPositioned = Boolean(position);

  const updatePosition = React.useCallback(() => {
    const trigger = triggerRef.current;
    const panel = panelRef.current;
    if (!trigger || !panel) return;

    const rect = trigger.getBoundingClientRect();
    const margin = 16;
    const gap = 6;
    const height = Math.min(panel.scrollHeight, window.innerHeight - margin * 2);
    const left = Math.max(margin, Math.min(rect.left, window.innerWidth - panel.offsetWidth - margin));
    const top =
      rect.bottom + gap + height <= window.innerHeight - margin
        ? rect.bottom + gap
        : Math.max(margin, rect.top - height - gap);

    setPosition({ top, left });
  }, []);

  React.useLayoutEffect(() => {
    if (!isOpen) {
      setPosition(undefined);
      return;
    }

    updatePosition();
  }, [isOpen, children, updatePosition]);

  React.useEffect(() => {
    if (isOpen && isPositioned) panelRef.current?.focus({ preventScroll: true });
  }, [isOpen, isPositioned]);

  React.useEffect(() => {
    if (!isOpen) return;

    const isInside = (target: EventTarget | null) =>
      target instanceof Node && (triggerRef.current?.contains(target) || panelRef.current?.contains(target));
    const handleOutside = (event: Event) => {
      if (!isInside(event.target)) setIsOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setIsOpen(false);
      triggerRef.current?.focus();
    };

    document.addEventListener("pointerdown", handleOutside);
    document.addEventListener("focusin", handleOutside);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      document.removeEventListener("pointerdown", handleOutside);
      document.removeEventListener("focusin", handleOutside);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen, updatePosition]);

  return (
    <>
      <Button
        ref={triggerRef}
        type="button"
        variant="ghost"
        size="icon"
        className={cn("size-6 shrink-0 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700", className)}
        title={label}
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={isOpen ? id : undefined}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <CircleHelp className="size-4" />
      </Button>
      {isOpen && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={panelRef}
              id={id}
              role="dialog"
              aria-label={label}
              tabIndex={-1}
              className="fixed z-[100002] max-h-[calc(100vh-32px)] w-[380px] max-w-[calc(100vw-32px)] overflow-y-auto overscroll-contain rounded-lg border border-gray-200 bg-white p-3 text-xs leading-5 break-words text-gray-600 shadow-lg outline-none"
              style={{ ...position, visibility: position ? "visible" : "hidden" }}
            >
              {children}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
