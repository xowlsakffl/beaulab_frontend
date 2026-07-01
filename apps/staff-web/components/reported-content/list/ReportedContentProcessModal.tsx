"use client";

import React from "react";
import { isApiSuccess } from "@beaulab/types";
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

import { api } from "@/lib/common/api";
import type { ReportedContentDetailReportState, ReportedContentProcessPayload } from "@/lib/reported-content/detail";
import type { ReportedContentRow } from "@/lib/reported-content/list";

type ReportActionStatus = "ADMIN_HIDDEN" | "NORMAL_VISIBLE";
type WarningActionStatus = "WARNED" | "IGNORED";
type ProcessStep = "status" | "warning";

type ReportedContentProcessModalProps = {
  row: ReportedContentRow | null;
  onClose: () => void;
  onProcessed: () => void;
};

function isNormalVisibleStatus(status?: string | null) {
  return status === "NORMAL_VISIBLE" || status === "REEXPOSED";
}

function actionButtonClassName(active: boolean) {
  return ["h-11 min-w-24 px-6 text-sm font-semibold", active ? "" : "text-gray-500"].join(" ");
}

export function ReportedContentProcessModal({ row, onClose, onProcessed }: ReportedContentProcessModalProps) {
  const [step, setStep] = React.useState<ProcessStep>("status");
  const [reportStatus, setReportStatus] = React.useState<ReportActionStatus | null>(null);
  const [processReason, setProcessReason] = React.useState("");
  const [warningStatus, setWarningStatus] = React.useState<WarningActionStatus | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [reasonError, setReasonError] = React.useState<string | null>(null);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setStep("status");
    setReportStatus(null);
    setProcessReason("");
    setWarningStatus(null);
    setSubmitting(false);
    setReasonError(null);
    setSubmitError(null);
  }, [row]);

  const close = React.useCallback(() => {
    if (submitting) return;
    onClose();
  }, [onClose, submitting]);

  const submit = React.useCallback(async () => {
    if (!row || !reportStatus) return;

    const payload: ReportedContentProcessPayload = {
      target_type: row.targetType,
      target_id: row.id,
      report_status: reportStatus,
    };

    if (reportStatus === "ADMIN_HIDDEN") {
      const normalizedReason = processReason.trim();
      if (!normalizedReason) {
        setReasonError("노출중지 사유를 입력해주세요.");
        return;
      }

      if (!warningStatus) {
        setSubmitError("경고여부를 선택해주세요.");
        return;
      }

      payload.process_reason = normalizedReason;
      payload.warning_status = warningStatus;
    }

    setSubmitting(true);
    setReasonError(null);
    setSubmitError(null);

    try {
      const response = await api.patch<ReportedContentDetailReportState>("/reported-contents/process", payload);

      if (!isApiSuccess(response)) {
        setSubmitError(response.error.message || "신고 조치 처리에 실패했습니다.");
        return;
      }

      onProcessed();
      onClose();
    } catch {
      setSubmitError("신고 조치 처리 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }, [onClose, onProcessed, processReason, reportStatus, row, warningStatus]);

  const moveNext = React.useCallback(() => {
    if (reportStatus !== "ADMIN_HIDDEN") return;

    if (!processReason.trim()) {
      setReasonError("노출중지 사유를 입력해주세요.");
      return;
    }

    setReasonError(null);
    setSubmitError(null);
    setStep("warning");
  }, [processReason, reportStatus]);

  const adminHiddenDisabled = row?.status === "ADMIN_HIDDEN" || submitting;
  const normalVisibleDisabled = isNormalVisibleStatus(row?.status) || submitting;
  const warningDisabled = row?.warningStatus === "WARNED" || submitting;
  const ignoredDisabled = row?.warningStatus === "IGNORED" || submitting;
  const title = step === "warning" ? "경고여부" : "조치유형";

  return (
    <Modal isOpen={row !== null} onClose={close} showCloseButton={false} className="mx-4 w-full max-w-md">
      <ModalPanel>
        <ModalHeader className="pr-0">
          <ModalTitle>{title}</ModalTitle>
        </ModalHeader>

        <ModalBody className="mt-6 space-y-5">
          {step === "status" ? (
            <>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={reportStatus === "ADMIN_HIDDEN" ? "brand" : "outline"}
                  disabled={adminHiddenDisabled}
                  onClick={() => {
                    setReportStatus("ADMIN_HIDDEN");
                    setReasonError(null);
                    setSubmitError(null);
                  }}
                  className={actionButtonClassName(reportStatus === "ADMIN_HIDDEN")}
                >
                  노출중지
                </Button>
                <Button
                  type="button"
                  variant={reportStatus === "NORMAL_VISIBLE" ? "brand" : "outline"}
                  disabled={normalVisibleDisabled}
                  onClick={() => {
                    setReportStatus("NORMAL_VISIBLE");
                    setReasonError(null);
                    setSubmitError(null);
                  }}
                  className={actionButtonClassName(reportStatus === "NORMAL_VISIBLE")}
                >
                  정상노출
                </Button>
              </div>

              {reportStatus === "ADMIN_HIDDEN" ? (
                <div>
                  <label
                    htmlFor="reported-content-process-reason"
                    className="mb-1.5 block text-sm font-semibold text-gray-800"
                  >
                    노출중지 사유
                  </label>
                  <InputField
                    id="reported-content-process-reason"
                    value={processReason}
                    onChange={(event) => {
                      setProcessReason(event.target.value);
                      if (reasonError) setReasonError(null);
                      if (submitError) setSubmitError(null);
                    }}
                    disabled={submitting}
                    error={Boolean(reasonError)}
                    hint={reasonError ?? undefined}
                  />
                </div>
              ) : null}
            </>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={warningStatus === "WARNED" ? "brand" : "outline"}
                disabled={warningDisabled}
                onClick={() => {
                  setWarningStatus("WARNED");
                  setSubmitError(null);
                }}
                className={actionButtonClassName(warningStatus === "WARNED")}
              >
                경고
              </Button>
              <Button
                type="button"
                variant={warningStatus === "IGNORED" ? "brand" : "outline"}
                disabled={ignoredDisabled}
                onClick={() => {
                  setWarningStatus("IGNORED");
                  setSubmitError(null);
                }}
                className={actionButtonClassName(warningStatus === "IGNORED")}
              >
                무시
              </Button>
            </div>
          )}

          {submitError ? <p className="text-sm font-medium text-rose-600">{submitError}</p> : null}
        </ModalBody>

        <ModalFooter>
          <Button type="button" variant="outline" onClick={close} disabled={submitting}>
            취소
          </Button>
          {step === "status" && reportStatus === "ADMIN_HIDDEN" ? (
            <Button type="button" variant="brand" onClick={moveNext} disabled={submitting}>
              다음
            </Button>
          ) : (
            <Button
              type="button"
              variant="brand"
              onClick={submit}
              disabled={submitting || reportStatus === null || (step === "warning" && warningStatus === null)}
            >
              {submitting ? "처리 중..." : "등록"}
            </Button>
          )}
        </ModalFooter>
      </ModalPanel>
    </Modal>
  );
}
