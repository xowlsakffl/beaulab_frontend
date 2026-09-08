"use client";

import React from "react";
import { isApiSuccess } from "@beaulab/types";
import { useGlobalAlert, type DataTableMeta } from "@beaulab/ui-admin";

import { api } from "@/lib/common/api";
import {
  HOSPITAL_ACCOUNT_INVITATIONS_PER_PAGE,
  validateHospitalAccountInvitationEmail,
  type HospitalAccountInvitation,
  type HospitalAccountInvitationSendResponse,
  type HospitalAccountInvitationSourceType,
} from "@/lib/account-hospital/invitation";

type UseHospitalAccountInvitationsParams = {
  enabled: boolean;
  sourceType: HospitalAccountInvitationSourceType;
  sourceId: number;
  initialEmail?: string | null;
};

export function useHospitalAccountInvitations({
  enabled,
  sourceType,
  sourceId,
  initialEmail,
}: UseHospitalAccountInvitationsParams) {
  const { showAlert } = useGlobalAlert();
  const [page, setPage] = React.useState(1);
  const [invitations, setInvitations] = React.useState<HospitalAccountInvitation[]>([]);
  const [meta, setMeta] = React.useState<DataTableMeta | null>(null);
  const [recipientEmail, setRecipientEmail] = React.useState("");
  const [emailError, setEmailError] = React.useState<string | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const reset = React.useCallback(() => {
    setPage(1);
    setInvitations([]);
    setMeta(null);
    setRecipientEmail(initialEmail?.trim() ?? "");
    setEmailError(null);
    setLoadError(null);
  }, [initialEmail]);

  React.useEffect(() => {
    reset();
  }, [reset, sourceId, sourceType]);

  React.useEffect(() => {
    if (!enabled) return;

    let active = true;
    setInvitations([]);
    setMeta(null);
    setLoadError(null);
    setIsLoading(true);

    void api
      .get<HospitalAccountInvitation[]>(
        "/hospital-account-invitations",
        {
          source_type: sourceType,
          source_id: sourceId,
          page,
          per_page: HOSPITAL_ACCOUNT_INVITATIONS_PER_PAGE,
        },
        { latestKey: `hospital-account-invitations:${sourceType}:${sourceId}` },
      )
      .then((response) => {
        if (!active) return;

        if (!isApiSuccess(response)) {
          setLoadError(response.error.message || "계정 생성 이메일 내역을 불러오지 못했습니다.");
          return;
        }

        setInvitations(response.data);
        setMeta((response.meta as DataTableMeta | null) ?? null);
        setRecipientEmail((current) => current.trim() || response.data[0]?.recipient_email || "");
      })
      .catch(() => {
        if (active) setLoadError("계정 생성 이메일 내역을 불러오는 중 오류가 발생했습니다.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [enabled, page, sourceId, sourceType]);

  const sendInvitation = React.useCallback(async () => {
    if (isSubmitting) return false;

    const nextEmailError = validateHospitalAccountInvitationEmail(recipientEmail);
    setEmailError(nextEmailError);
    if (nextEmailError) return false;

    setIsSubmitting(true);

    try {
      const response = await api.post<HospitalAccountInvitationSendResponse>("/hospital-account-invitations", {
        source_type: sourceType,
        source_id: sourceId,
        recipient_email: recipientEmail.trim(),
      });

      if (!isApiSuccess(response)) {
        setEmailError(response.error.message || "계정 생성 이메일을 전송하지 못했습니다.");
        return false;
      }

      setRecipientEmail(response.data.invitation.recipient_email);
      setEmailError(null);
      setPage(1);
      showAlert({
        variant: "success",
        title: "계정 생성 이메일 전송 완료",
        message: response.data.message || "계정 생성 링크를 전송했습니다.",
      });
      return true;
    } catch {
      setEmailError("계정 생성 이메일을 전송하는 중 오류가 발생했습니다.");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, recipientEmail, showAlert, sourceId, sourceType]);

  return {
    page,
    setPage,
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
  };
}
