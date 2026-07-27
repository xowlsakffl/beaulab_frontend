"use client";

import {
  Button,
  FormTextArea,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalPanel,
  ModalTitle,
} from "@beaulab/ui-admin";

type AdminNoteCreateModalProps = {
  isOpen: boolean;
  value: string;
  saving: boolean;
  onChange: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
  title?: string;
  placeholder?: string;
  errorMessage?: string | null;
  maxLength?: number;
};

export function AdminNoteCreateModal({
  isOpen,
  value,
  saving,
  onChange,
  onClose,
  onSave,
  title = "관리자 메모 등록",
  placeholder = "관리자 메모를 입력해 주세요.",
  errorMessage = null,
  maxLength = 1000,
}: AdminNoteCreateModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton={false} className="mx-4 w-full max-w-lg">
      <ModalPanel>
        <ModalHeader className="pr-0">
          <ModalTitle>{title}</ModalTitle>
        </ModalHeader>
        <ModalBody className="mt-5">
          <FormTextArea
            value={value}
            onChange={(next) => onChange(next.slice(0, maxLength))}
            rows={5}
            placeholder={placeholder}
            error={Boolean(errorMessage)}
            hint={errorMessage ?? undefined}
          />
        </ModalBody>
        <ModalFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            취소
          </Button>
          <Button type="button" variant="brand" onClick={onSave} disabled={saving || !value.trim()}>
            등록
          </Button>
        </ModalFooter>
      </ModalPanel>
    </Modal>
  );
}
