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

import { REVIEW_ALLOW_STATUS_ACTION_OPTIONS } from "@/lib/common/review-status";

type AllowStatusLike = string | { code?: string | null; value?: string | null } | null | undefined;

export type AllowStatusActionOption = {
  value: string;
  label: string;
  className?: string;
};

export type PendingAllowStatusChange = {
  allowStatus: string;
  reason: string;
};

export const REVIEW_ALLOW_STATUS_ACTIONS = REVIEW_ALLOW_STATUS_ACTION_OPTIONS satisfies readonly AllowStatusActionOption[];

const defaultButtonClassName = "h-10 min-w-16 px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40";

export function resolveAllowStatusValue(status: AllowStatusLike): string {
  if (typeof status === "string") {
    return status;
  }

  return status?.code ?? status?.value ?? "";
}

export function AllowStatusActionButtons({
  currentStatus,
  options = REVIEW_ALLOW_STATUS_ACTIONS,
  disabled = false,
  disableActive = true,
  className,
  buttonClassName = defaultButtonClassName,
  onChange,
}: {
  currentStatus?: AllowStatusLike;
  options?: readonly AllowStatusActionOption[];
  disabled?: boolean;
  disableActive?: boolean;
  className?: string;
  buttonClassName?: string;
  onChange: (status: string) => void;
}) {
  const currentStatusCode = resolveAllowStatusValue(currentStatus);

  return (
    <div className={["flex flex-wrap items-center gap-2", className].filter(Boolean).join(" ")}>
      {options.map((option) => {
        const active = currentStatusCode === option.value;

        return (
          <Button
            key={option.value}
            type="button"
            variant={active ? "brand" : "outline"}
            disabled={disabled || (disableActive && active)}
            onClick={() => onChange(option.value)}
            className={[buttonClassName, option.className].filter(Boolean).join(" ")}
          >
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}

export function AllowStatusConfirmModal({
  pending,
  title = "검수상태 변경",
  subjectLabel,
  messageAction = "처리",
  labelStatus,
  updating,
  error,
  rejectStatus = "REJECTED",
  reasonInputId,
  reasonLabel = "반려 사유",
  reasonPlaceholder = "반려 사유를 입력해주세요.",
  processingText = "처리 중...",
  confirmText = "확인",
  onReasonChange,
  onClose,
  onConfirm,
}: {
  pending: PendingAllowStatusChange | null;
  title?: string;
  subjectLabel: string;
  messageAction?: string;
  labelStatus: (status: string) => ReactNode;
  updating: boolean;
  error: string | null;
  rejectStatus?: string;
  reasonInputId: string;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  processingText?: string;
  confirmText?: string;
  onReasonChange: (reason: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const statusLabel = pending ? labelStatus(pending.allowStatus) : "";
  const requiresReason = pending?.allowStatus === rejectStatus;

  return (
    <Modal isOpen={pending !== null} onClose={onClose} className="mx-4 max-w-md" showCloseButton={false}>
      <ModalPanel>
        <ModalHeader className="pr-0">
          <ModalTitle>{title}</ModalTitle>
        </ModalHeader>
        <ModalBody className="mt-5 space-y-4">
          <p className="text-sm font-medium text-gray-800">
            {subjectLabel} {statusLabel} {messageAction}하시겠습니까?
          </p>
          {requiresReason ? (
            <div className="mt-4">
              <label htmlFor={reasonInputId} className="mb-1.5 block text-sm font-medium text-gray-700">
                {reasonLabel}
              </label>
              <InputField
                id={reasonInputId}
                name="rejected_reason"
                value={pending?.reason ?? ""}
                onChange={(event) => onReasonChange(event.target.value)}
                disabled={updating}
                placeholder={reasonPlaceholder}
                error={Boolean(error)}
                hint={error ?? undefined}
              />
            </div>
          ) : null}
          {error && !requiresReason ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
        </ModalBody>
        <ModalFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={updating}>
            취소
          </Button>
          <Button type="button" variant="brand" onClick={onConfirm} disabled={updating}>
            {updating ? processingText : confirmText}
          </Button>
        </ModalFooter>
      </ModalPanel>
    </Modal>
  );
}
