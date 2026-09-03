"use client";

import { useRef, useState } from "react";
import { isApiSuccess } from "@beaulab/types";
import {
  Button,
  Modal,
  ModalBody,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalPanel,
  ModalTitle,
  Send,
  useGlobalAlert,
} from "@beaulab/ui-admin";

import { sendHospitalAccountPasswordResetLink } from "@/lib/account-hospital/password-reset";

type Props = {
  hospitalId: number;
  hospitalName: string;
  phone: string;
  onClose: () => void;
};

export function HospitalAccountPasswordResetModal({ hospitalId, hospitalName, phone, onClose }: Props) {
  const { showAlert } = useGlobalAlert();
  const inFlight = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendLink = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await sendHospitalAccountPasswordResetLink(hospitalId);
      if (!isApiSuccess(response)) {
        setError(response.error.message || "재설정 링크를 전송하지 못했습니다.");
        return;
      }
      showAlert({
        variant: "success",
        title: "비밀번호 재설정 링크 발송 접수",
        message: `${response.data.phone} 번호로 문자 발송을 접수했습니다.`,
      });
      onClose();
    } catch {
      setError("재설정 링크 전송 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      inFlight.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen onClose={isSubmitting ? () => undefined : onClose} className="mx-4 w-[calc(100%-2rem)] max-w-md">
      <ModalPanel>
        <ModalHeader>
          <ModalTitle>비밀번호 재설정 링크 전송</ModalTitle>
          <ModalDescription>{hospitalName}</ModalDescription>
        </ModalHeader>
        <ModalBody>
          <dl className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <dt className="text-gray-500">인증된 휴대폰 번호</dt>
            <dd className="font-medium text-gray-900">{phone}</dd>
          </dl>
          {error ? (
            <p role="alert" className="mt-2 text-xs leading-5 text-error-500">
              {error}
            </p>
          ) : null}
        </ModalBody>
        <ModalFooter>
          <Button type="button" variant="outline" size="sm" disabled={isSubmitting} onClick={onClose}>
            취소
          </Button>
          <Button type="button" variant="brand" size="sm" disabled={isSubmitting} onClick={() => void sendLink()}>
            <Send className="size-4" />
            {isSubmitting ? "전송 중..." : "전송"}
          </Button>
        </ModalFooter>
      </ModalPanel>
    </Modal>
  );
}
