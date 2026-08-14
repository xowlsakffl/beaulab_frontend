"use client";

import type { ReactNode } from "react";
import {
  Button,
  InputField,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalPanel,
  ModalTitle,
} from "@beaulab/ui-admin";

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
  const activeButtonVariant = mode === "current" ? (visible ? "brand" : "outline") : visible ? "outline" : "brand";
  const inactiveButtonVariant = mode === "current" ? (visible ? "outline" : "brand") : visible ? "brand" : "outline";
  const activeButtonDisabled = disabled || visible;
  const inactiveButtonDisabled = disabled || !visible;

  return (
    <div className={["flex items-center gap-2", className].filter(Boolean).join(" ")}>
      <Button
        type="button"
        size="sm"
        variant={activeButtonVariant}
        disabled={activeButtonDisabled}
        onClick={() => onChange("ACTIVE")}
        className={buttonClassName}
      >
        노출
      </Button>
      <Button
        type="button"
        size="sm"
        variant={inactiveButtonVariant}
        disabled={inactiveButtonDisabled}
        onClick={() => onChange("INACTIVE")}
        className={buttonClassName}
      >
        미노출
      </Button>
    </div>
  );
}

export function VisibilityConfirmModal({
  isOpen,
  status,
  message,
  hiddenReasonValue = "",
  updating,
  reasonInputId,
  reasonPlaceholder,
  showReasonInput,
  onHiddenReasonChange,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  status?: VisibilityStatus;
  message: ReactNode;
  hiddenReasonValue?: string;
  updating: boolean;
  reasonInputId: string;
  reasonPlaceholder?: string;
  showReasonInput?: boolean;
  onHiddenReasonChange: (reason: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const requiresReason = showReasonInput ?? status === "INACTIVE";

  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton={false} className="mx-4 w-full max-w-md">
      <ModalPanel>
        <ModalHeader className="pr-0">
          <ModalTitle>공개여부 변경</ModalTitle>
        </ModalHeader>

        <ModalBody className="mt-5">
          <p className="text-sm font-medium text-gray-800">{message}</p>

          {requiresReason ? (
            <div className="mt-4">
              <label htmlFor={reasonInputId} className="mb-1.5 block text-sm font-medium text-gray-700">
                미노출 사유
              </label>
              <InputField
                id={reasonInputId}
                name="hidden_reason"
                value={hiddenReasonValue}
                onChange={(event) => onHiddenReasonChange(event.target.value)}
                disabled={updating}
                placeholder={reasonPlaceholder}
              />
            </div>
          ) : null}
        </ModalBody>

        <ModalFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={updating}>
            취소
          </Button>
          <Button type="button" variant="brand" onClick={onConfirm} disabled={updating}>
            {updating ? "처리 중..." : "확인"}
          </Button>
        </ModalFooter>
      </ModalPanel>
    </Modal>
  );
}
