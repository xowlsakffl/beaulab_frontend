"use client";

import React from "react";
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

import { useReportedContentProcessModal } from "@/hooks/reported-content/useReportedContentProcessModal";
import type { ReportedContentRow } from "@/lib/reported-content/list";

type ReportedContentProcessModalProps = {
  row: ReportedContentRow | null;
  onClose: () => void;
  onProcessed: () => void;
};

function actionButtonClassName(active: boolean) {
  return ["h-11 min-w-24 px-6 text-sm font-semibold", active ? "" : "text-gray-500"].join(" ");
}

export function ReportedContentProcessModal({ row, onClose, onProcessed }: ReportedContentProcessModalProps) {
  const {
    step,
    reportStatus,
    processReason,
    warningStatus,
    submitting,
    reasonError,
    submitError,
    title,
    adminHiddenDisabled,
    normalVisibleDisabled,
    warningDisabled,
    ignoredDisabled,
    close,
    submit,
    moveNext,
    selectReportStatus,
    changeProcessReason,
    selectWarningStatus,
  } = useReportedContentProcessModal({ row, onClose, onProcessed });

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
                  onClick={() => selectReportStatus("ADMIN_HIDDEN")}
                  className={actionButtonClassName(reportStatus === "ADMIN_HIDDEN")}
                >
                  노출중지
                </Button>
                <Button
                  type="button"
                  variant={reportStatus === "NORMAL_VISIBLE" ? "brand" : "outline"}
                  disabled={normalVisibleDisabled}
                  onClick={() => selectReportStatus("NORMAL_VISIBLE")}
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
                    onChange={(event) => changeProcessReason(event.target.value)}
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
                onClick={() => selectWarningStatus("WARNED")}
                className={actionButtonClassName(warningStatus === "WARNED")}
              >
                경고
              </Button>
              <Button
                type="button"
                variant={warningStatus === "IGNORED" ? "brand" : "outline"}
                disabled={ignoredDisabled}
                onClick={() => selectWarningStatus("IGNORED")}
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
