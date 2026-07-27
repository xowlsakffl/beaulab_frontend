"use client";

import React from "react";
import { isApiSuccess } from "@beaulab/types";

import { api } from "@/lib/common/api";

export type ReportedOriginalVisibilityStatus = "ACTIVE" | "INACTIVE";
export type ReportedOriginalVisibilityTarget = "talk" | "review";

export type PendingReportedOriginalVisibilityChange = {
  target: ReportedOriginalVisibilityTarget;
  id: number;
  status: ReportedOriginalVisibilityStatus;
  hiddenReason?: string;
} | null;

type VisibilityUpdateResponse = {
  updated_count: number;
  status: string;
  ids: number[];
};

type VisibilityUpdatePayload = {
  ids: number[];
  status: ReportedOriginalVisibilityStatus;
  hidden_reason?: string;
};

function endpointFor(target: ReportedOriginalVisibilityTarget) {
  return target === "talk" ? "/talks/status" : "/hospital-reviews/status";
}

function labelFor(target: ReportedOriginalVisibilityTarget) {
  return target === "talk" ? "토크" : "후기";
}

export function useReportedOriginalVisibility({
  onSaved,
  onError,
}: {
  onSaved: () => Promise<void>;
  onError: (message: string | null) => void;
}) {
  const [pendingChange, setPendingChange] = React.useState<PendingReportedOriginalVisibilityChange>(null);
  const [updating, setUpdating] = React.useState(false);

  const requestChange = React.useCallback(
    (target: ReportedOriginalVisibilityTarget, id: number, status: ReportedOriginalVisibilityStatus) => {
      setPendingChange({
        target,
        id,
        status,
        hiddenReason: "",
      });
    },
    [],
  );

  const updateHiddenReason = React.useCallback((value: string) => {
    setPendingChange((prev) => (prev ? { ...prev, hiddenReason: value } : prev));
  }, []);

  const closeModal = React.useCallback(() => {
    if (updating) return;

    setPendingChange(null);
  }, [updating]);

  const confirmChange = React.useCallback(async () => {
    if (!pendingChange) return;

    const { target, id, status, hiddenReason } = pendingChange;
    const normalizedHiddenReason = status === "INACTIVE" ? hiddenReason?.trim() : "";
    const payload: VisibilityUpdatePayload = {
      ids: [id],
      status,
      ...(normalizedHiddenReason ? { hidden_reason: normalizedHiddenReason } : {}),
    };

    setUpdating(true);
    onError(null);

    try {
      const response = await api.patch<VisibilityUpdateResponse>(endpointFor(target), payload);

      if (!isApiSuccess(response)) {
        onError(response.error.message || `${labelFor(target)} 노출 상태 변경에 실패했습니다.`);
        return;
      }

      setPendingChange(null);
      await onSaved();
    } catch {
      onError(`${labelFor(target)} 노출 상태 변경 중 오류가 발생했습니다.`);
    } finally {
      setUpdating(false);
    }
  }, [onError, onSaved, pendingChange]);

  return {
    pendingChange,
    updating,
    pendingVisibilityLabel: pendingChange?.status === "ACTIVE" ? "노출" : "미노출",
    requestChange,
    updateHiddenReason,
    closeModal,
    confirmChange,
  };
}
