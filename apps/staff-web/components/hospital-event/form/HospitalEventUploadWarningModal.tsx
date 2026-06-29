"use client";

import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalPanel,
  ModalTitle,
} from "@beaulab/ui-admin";

export function UploadWarningModal({ message, onClose }: { message: string | null; onClose: () => void }) {
  return (
    <Modal isOpen={Boolean(message)} onClose={onClose} showCloseButton={false} className="mx-4 w-[calc(100%-2rem)] max-w-sm">
      <ModalPanel>
        <ModalHeader className="pr-0">
          <ModalTitle className="text-base">이미지 업로드 조건 확인</ModalTitle>
        </ModalHeader>
        <ModalBody className="mt-5">
          <p className="whitespace-pre-line text-sm font-medium leading-6 text-gray-800">{message}</p>
        </ModalBody>
        <ModalFooter>
          <Button type="button" variant="brand" onClick={onClose}>
            확인
          </Button>
        </ModalFooter>
      </ModalPanel>
    </Modal>
  );
}
