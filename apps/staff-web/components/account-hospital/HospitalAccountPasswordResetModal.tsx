"use client";

import { useRef, useState } from "react";
import { isApiSuccess } from "@beaulab/types";
import {
  Button,
  InputField,
  Label,
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
  email: string;
  onClose: () => void;
};

export function HospitalAccountPasswordResetModal({ hospitalId, hospitalName, email, onClose }: Props) {
  const { showAlert } = useGlobalAlert();
  const inFlight = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState(email);
  const [error, setError] = useState<string | null>(null);

  const sendLink = async () => {
    if (inFlight.current) return;
    const normalizedEmail = recipientEmail.trim().toLowerCase();
    if (!normalizedEmail) {
      setError("수신 이메일을 입력해 주세요.");
      return;
    }
    inFlight.current = true;
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await sendHospitalAccountPasswordResetLink(hospitalId, normalizedEmail);
      if (!isApiSuccess(response)) {
        setError(response.error.message || "재설정 링크를 전송하지 못했습니다.");
        return;
      }
      showAlert({
        variant: "success",
        title: "비밀번호 재설정 링크 발송 접수",
        message: `${response.data.email}로 이메일 발송을 접수했습니다.`,
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
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void sendLink();
          }}
        >
          <ModalBody>
            <Label htmlFor="hospital-account-password-reset-email">수신 이메일</Label>
            <InputField
              id="hospital-account-password-reset-email"
              type="email"
              autoComplete="email"
              maxLength={254}
              value={recipientEmail}
              placeholder="재설정 링크를 받을 이메일을 입력해 주세요."
              error={Boolean(error)}
              className="mt-2 h-11 bg-white px-4"
              disabled={isSubmitting}
              onChange={(event) => {
                setRecipientEmail(event.target.value);
                setError(null);
              }}
            />
            {error ? (
              <p
                id="hospital-account-password-reset-error"
                role="alert"
                className="mt-2 text-xs leading-5 text-error-500"
              >
                {error}
              </p>
            ) : null}
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="outline" size="sm" disabled={isSubmitting} onClick={onClose}>
              취소
            </Button>
            <Button type="submit" variant="brand" size="sm" disabled={isSubmitting || !recipientEmail.trim()}>
              <Send className="size-4" />
              {isSubmitting ? "전송 중..." : "전송"}
            </Button>
          </ModalFooter>
        </form>
      </ModalPanel>
    </Modal>
  );
}
