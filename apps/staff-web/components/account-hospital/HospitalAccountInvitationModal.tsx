"use client";

import React from "react";
import {
  ArrowLeft,
  Button,
  InputField,
  Label,
  Mail,
  Modal,
  ModalBody,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalPanel,
  ModalTitle,
  Pagination,
  Send,
  SpinnerBlock,
  type DataTableMeta,
  StatusValueBadge,
} from "@beaulab/ui-admin";

import { useHospitalAccountInvitations } from "@/hooks/account-hospital/useHospitalAccountInvitations";
import {
  formatHospitalAccountInvitationDateTime,
  hospitalAccountInvitationStatusColor,
  type HospitalAccountInvitation,
  type HospitalAccountInvitationSourceType,
} from "@/lib/account-hospital/invitation";

type HospitalAccountInvitationModalProps = {
  isOpen: boolean;
  sourceType: HospitalAccountInvitationSourceType;
  sourceId: number;
  hospitalName: string;
  initialEmail?: string | null;
  canSend: boolean;
  onClose: () => void;
};

type InvitationModalFlow = "history" | "send";

export function HospitalAccountInvitationModal({
  isOpen,
  sourceType,
  sourceId,
  hospitalName,
  initialEmail,
  canSend,
  onClose,
}: HospitalAccountInvitationModalProps) {
  const [flow, setFlow] = React.useState<InvitationModalFlow>("history");
  const {
    invitations,
    meta,
    recipientEmail,
    setRecipientEmail,
    emailError,
    setEmailError,
    loadError,
    isLoading,
    isSubmitting,
    reset,
    sendInvitation,
    setPage,
  } = useHospitalAccountInvitations({
    enabled: isOpen && flow === "history",
    sourceType,
    sourceId,
    initialEmail,
  });

  React.useEffect(() => {
    if (!isOpen) return;

    setFlow("history");
    reset();
  }, [isOpen, reset]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSend || isSubmitting) return;

    if (await sendInvitation()) {
      setFlow("history");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isSubmitting ? () => undefined : onClose}
      className={`mx-4 w-[calc(100%-2rem)] ${flow === "send" && canSend ? "max-w-lg" : "max-w-3xl"}`}
    >
      <ModalPanel>
        <ModalHeader>
          <ModalTitle>{flow === "history" ? "계정 생성 이메일 내역" : "계정 생성 이메일 전송"}</ModalTitle>
          <ModalDescription>{hospitalName || "병의원"}</ModalDescription>
        </ModalHeader>

        {flow === "history" || !canSend ? (
          <>
            <ModalBody>
              <InvitationHistoryList
                invitations={invitations}
                meta={meta}
                loading={isLoading}
                error={loadError}
                onPageChange={setPage}
              />
            </ModalBody>
            {canSend ? (
              <ModalFooter>
                <Button
                  type="button"
                  variant="brand"
                  size="sm"
                  onClick={() => {
                    setEmailError(null);
                    setFlow("send");
                  }}
                >
                  <Mail className="size-4" />
                  계정 생성 이메일 전송
                </Button>
              </ModalFooter>
            ) : null}
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <ModalBody>
              <div>
                <Label htmlFor="hospital-account-invitation-email">수신 이메일</Label>
                <InputField
                  id="hospital-account-invitation-email"
                  type="email"
                  value={recipientEmail}
                  placeholder="계정 생성 링크를 받을 이메일을 입력해 주세요."
                  error={Boolean(emailError)}
                  className="mt-2 h-11 bg-white px-4"
                  disabled={isSubmitting}
                  onChange={(event) => {
                    setRecipientEmail(event.target.value);
                    setEmailError(null);
                  }}
                />
                {emailError ? <p className="mt-1 text-xs text-error-500">{emailError}</p> : null}
              </div>
            </ModalBody>
            <ModalFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isSubmitting}
                onClick={() => {
                  setEmailError(null);
                  setFlow("history");
                }}
              >
                <ArrowLeft className="size-4" />
                이전
              </Button>
              <Button type="submit" variant="brand" size="sm" disabled={isSubmitting}>
                {isSubmitting ? <Mail className="size-4 animate-pulse" /> : <Send className="size-4" />}
                {isSubmitting ? "전송 중..." : "전송"}
              </Button>
            </ModalFooter>
          </form>
        )}
      </ModalPanel>
    </Modal>
  );
}

type InvitationHistoryListProps = {
  invitations: HospitalAccountInvitation[];
  meta: DataTableMeta | null;
  loading: boolean;
  error: string | null;
  onPageChange: (page: number) => void;
};

function InvitationHistoryList({ invitations, meta, loading, error, onPageChange }: InvitationHistoryListProps) {
  if (loading) {
    return <SpinnerBlock className="min-h-64" spinnerClassName="size-7" label="발송 내역 불러오는 중" />;
  }

  if (error) {
    return <div className="flex min-h-64 items-center justify-center text-center text-sm text-error-500">{error}</div>;
  }

  if (invitations.length === 0) {
    return <div className="flex min-h-64 items-center justify-center text-sm text-gray-500">발송 내역이 없습니다.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="border-y border-gray-200">
        <div className="hidden grid-cols-[5rem_minmax(0,1.5fr)_minmax(6.5rem,1fr)_minmax(6.5rem,1fr)_minmax(5rem,0.75fr)] gap-3 border-b border-gray-200 bg-gray-50 px-3 py-3 text-xs font-semibold text-gray-600 md:grid">
          <span>상태</span>
          <span>수신 이메일</span>
          <span>발송일</span>
          <span>만료일</span>
          <span>발송 관리자</span>
        </div>
        <div className="divide-y divide-gray-100">
          {invitations.map((invitation) => (
            <div
              key={invitation.id}
              className="grid min-w-0 grid-cols-[5rem_minmax(0,1fr)] items-center gap-x-3 gap-y-2 px-3 py-3 text-sm text-gray-800 md:grid-cols-[5rem_minmax(0,1.5fr)_minmax(6.5rem,1fr)_minmax(6.5rem,1fr)_minmax(5rem,0.75fr)] md:gap-y-0"
            >
              <span className="text-xs font-medium text-gray-500 md:hidden">상태</span>
              <div>
                <StatusValueBadge
                  label={invitation.status.label}
                  color={hospitalAccountInvitationStatusColor(invitation.status.code)}
                />
              </div>

              <span className="text-xs font-medium text-gray-500 md:hidden">수신 이메일</span>
              <span className="min-w-0 break-all md:truncate" title={invitation.recipient_email}>
                {invitation.recipient_email || "-"}
              </span>

              <span className="text-xs font-medium text-gray-500 md:hidden">발송일</span>
              <span className="min-w-0 text-xs text-gray-600">
                {formatHospitalAccountInvitationDateTime(invitation.sent_at ?? invitation.created_at)}
              </span>

              <span className="text-xs font-medium text-gray-500 md:hidden">만료일</span>
              <span className="min-w-0 text-xs text-gray-600">
                {formatHospitalAccountInvitationDateTime(invitation.expires_at)}
              </span>

              <span className="text-xs font-medium text-gray-500 md:hidden">발송 관리자</span>
              <span className="min-w-0 truncate" title={invitation.created_by_staff?.name?.trim() || "-"}>
                {invitation.created_by_staff?.name?.trim() || "-"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {meta ? (
        <div className="flex justify-center">
          <Pagination
            currentPage={meta.current_page}
            totalPages={Math.max(1, meta.last_page)}
            onPageChange={onPageChange}
          />
        </div>
      ) : null}
    </div>
  );
}
