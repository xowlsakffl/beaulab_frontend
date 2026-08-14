"use client";

import React from "react";
import { isApiSuccess } from "@beaulab/types";
import { useGlobalAlert, type TemplateMessagePart } from "@beaulab/ui-admin";

import { usePersistentIdempotencyKeys } from "@/hooks/common/usePersistentIdempotencyKeys";
import { api } from "@/lib/common/api";
import type { HospitalWalletNoticeBatchApiItem } from "@/lib/hospital-wallet/list";

type Params = {
  selectedHospitalIds: Set<number>;
  clearSelection: () => void;
};

export function useHospitalWalletNoticeActions({ selectedHospitalIds, clearSelection }: Params) {
  const { showAlert } = useGlobalAlert();
  const idempotency = usePersistentIdempotencyKeys("hospital-wallet-balance-notice");
  const [isOpen, setIsOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const open = React.useCallback(() => {
    if (selectedHospitalIds.size === 0) return;

    setSubmitError(null);
    setIsOpen(true);
  }, [selectedHospitalIds.size]);

  const close = React.useCallback(() => {
    if (submitting) return;

    setSubmitError(null);
    setIsOpen(false);
  }, [submitting]);

  const submit = React.useCallback(
    async ({
      messageParts,
      sendToManager,
      sendToRepresentative,
    }: {
      messageParts: TemplateMessagePart[];
      sendToManager: boolean;
      sendToRepresentative: boolean;
    }) => {
      if (selectedHospitalIds.size === 0) return;

      const hospitalIds = Array.from(selectedHospitalIds).sort((a, b) => a - b);
      const signature = JSON.stringify({ hospitalIds, messageParts, sendToManager, sendToRepresentative });
      const idempotencyKey = idempotency.getOrCreate(signature);

      setSubmitting(true);
      setSubmitError(null);

      try {
        const response = await api.post<HospitalWalletNoticeBatchApiItem>("/hospital-wallets/balance-notices", {
          hospital_ids: hospitalIds,
          message_parts: messageParts,
          send_to_manager: sendToManager,
          send_to_representative: sendToRepresentative,
          idempotency_key: idempotencyKey,
        });

        if (!isApiSuccess(response)) {
          setSubmitError(response.error.message || "충전금 안내 문자 발송 요청에 실패했습니다.");
          return;
        }

        const hospitalCount = Number(response.data.hospital_count ?? hospitalIds.length);
        const recipientCount = Number(response.data.recipient_count ?? 0);
        const skippedCount = Number(response.data.skipped_count ?? 0);
        const queuedCount = Math.max(0, recipientCount - skippedCount);
        const skippedRecipientCounts = (response.data.deliveries ?? [])
          .filter((delivery) => delivery.status === "SKIPPED")
          .flatMap((delivery) => delivery.recipient_kind_labels ?? [])
          .reduce<Map<string, number>>((counts, label) => {
            counts.set(label, (counts.get(label) ?? 0) + 1);
            return counts;
          }, new Map());
        const skippedRecipients = Array.from(skippedRecipientCounts.entries())
          .map(([label, count]) => `${label} ${count.toLocaleString("ko-KR")}개`)
          .join(", ");
        const skippedMessage = skippedCount
          ? ` 미등록 연락처: ${skippedRecipients || `${skippedCount.toLocaleString("ko-KR")}개`}.`
          : "";

        idempotency.confirm(signature);
        setIsOpen(false);
        clearSelection();
        showAlert({
          variant: "success",
          title: "충전금 안내 발송 요청 완료",
          message: `${hospitalCount.toLocaleString("ko-KR")}개 병의원의 발송 가능한 연락처 ${queuedCount.toLocaleString("ko-KR")}개를 대기열에 등록했습니다.${skippedMessage}`,
        });
      } catch {
        setSubmitError("충전금 안내 문자 발송 요청 중 오류가 발생했습니다.");
      } finally {
        setSubmitting(false);
      }
    },
    [clearSelection, idempotency, selectedHospitalIds, showAlert],
  );

  return { isOpen, submitting, submitError, open, close, submit };
}
