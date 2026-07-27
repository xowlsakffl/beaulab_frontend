"use client";

import React from "react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  InputField,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalPanel,
  ModalTitle,
  SpinnerBlock,
} from "@beaulab/ui-admin";

import { useReportedContentDetailPanel } from "@/hooks/reported-content/useReportedContentDetailPanel";
import {
  type ReportedContentDetailResponse,
  type ReportedContentReportsBlock,
  type ReportedContentTargetType,
} from "@/lib/reported-content/detail";

import { ReportedContentReportsList } from "../list/ReportedContentReportsList";

type ReportedContentDetailPanelProps = {
  targetType: ReportedContentTargetType;
  targetId: number;
  initialDetail?: ReportedContentDetailResponse | null;
  initialReports?: ReportedContentReportsBlock | null;
  onStatusUpdated?: () => void;
};

export function ReportedContentDetailPanel({
  targetType,
  targetId,
  initialDetail = null,
  initialReports = null,
  onStatusUpdated,
}: ReportedContentDetailPanelProps) {
  const {
    loading,
    error,
    reports,
    reportsMeta,
    reportsLoading,
    reportsError,
    reportsCurrentPage,
    reportsTotal,
    setReportsPage,
    reportStatus,
    warningStatus,
    warningCount,
    updatingStatus,
    updatingWarningStatus,
    pendingStatus,
    pendingWarningStatus,
    isWarningUnavailableModalOpen,
    processReason,
    modalError,
    warningModalError,
    isAdminHiddenButtonDisabled,
    isNormalVisibleButtonDisabled,
    isWarningButtonDisabled,
    isIgnoreButtonDisabled,
    changeProcessReason,
    setIsWarningUnavailableModalOpen,
    openStatusModal,
    closeStatusModal,
    openWarningModal,
    closeWarningModal,
    submitStatusChange,
    submitWarningStatusChange,
  } = useReportedContentDetailPanel({
    targetType,
    targetId,
    initialDetail,
    initialReports,
    onStatusUpdated,
  });

  const pendingStatusLabel = pendingStatus === "ADMIN_HIDDEN" ? "노출중지" : "정상노출";
  const targetNoun = targetType.includes("comment") ? "댓글" : "게시물";
  const statusModalMessage = pendingStatus ? `해당 ${targetNoun}을 ${pendingStatusLabel} 하시겠습니까?` : "";
  const warningModalMessage =
    pendingWarningStatus === "WARNED"
      ? warningStatus === "IGNORED"
        ? "무시를 경고로 변경하시겠습니까?"
        : "해당 유저에게 경고하시겠습니까?"
      : warningStatus === "WARNED"
        ? "해당 경고를 무시로 변경하시겠습니까?"
        : `해당 ${targetNoun}의 경고 처리를 무시하시겠습니까?`;
  const warningDisabledTitle = warningStatus === "WARNED" ? "이미 경고 처리된 신고입니다." : undefined;
  const ignoreDisabledTitle = warningStatus === "IGNORED" ? "이미 무시 처리된 신고입니다." : undefined;

  return (
    <>
      <Card as="aside" className="min-w-0">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between gap-3">
            <CardTitle>신고 내용 상세</CardTitle>
            {!loading && !error ? (
              <span className="text-sm font-semibold text-gray-800">{reportsTotal.toLocaleString()}회</span>
            ) : null}
          </div>
        </CardHeader>

        <CardContent className="space-y-8">
          {loading ? (
            <SpinnerBlock className="min-h-[12rem]" spinnerClassName="size-10" label="신고 상세 불러오는 중" />
          ) : error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
          ) : (
            <>
              <section className="space-y-4">
                <ReportedContentReportsList
                  reports={reports}
                  meta={reportsMeta}
                  loading={reportsLoading}
                  error={reportsError}
                  page={reportsCurrentPage}
                  loadingLabel="신고 내역 불러오는 중"
                  emptyLabel="신고 내역이 없습니다."
                  disabled={updatingStatus !== null}
                  onPageChange={setReportsPage}
                />
              </section>

              <section className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900">조치유형</h3>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant={reportStatus === "ADMIN_HIDDEN" ? "brand" : "outline"}
                      disabled={isAdminHiddenButtonDisabled}
                      onClick={() => openStatusModal("ADMIN_HIDDEN")}
                      className={[
                        "h-12 px-5 text-base font-semibold",
                        reportStatus === "ADMIN_HIDDEN" ? "" : "text-gray-500",
                      ].join(" ")}
                    >
                      {updatingStatus === "ADMIN_HIDDEN" ? "처리 중" : "노출중지"}
                    </Button>
                    <Button
                      type="button"
                      variant={reportStatus === "NORMAL_VISIBLE" ? "brand" : "outline"}
                      disabled={isNormalVisibleButtonDisabled}
                      onClick={() => openStatusModal("NORMAL_VISIBLE")}
                      className={[
                        "h-12 px-5 text-base font-semibold",
                        reportStatus === "NORMAL_VISIBLE" ? "" : "text-gray-500",
                      ].join(" ")}
                    >
                      {updatingStatus === "NORMAL_VISIBLE" ? "처리 중" : "정상노출"}
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900">경고여부</h3>
                  <div className="flex flex-row flex-wrap gap-2">
                    <Button
                      type="button"
                      variant={warningStatus === "WARNED" ? "brand" : "outline"}
                      disabled={isWarningButtonDisabled}
                      title={warningDisabledTitle}
                      onClick={() => openWarningModal("WARNED")}
                      className={[
                        "h-12 px-6 text-base font-semibold",
                        warningStatus === "WARNED" ? "" : "text-gray-500",
                      ].join(" ")}
                    >
                      {updatingWarningStatus === "WARNED" ? "처리 중" : "경고"}
                    </Button>
                    <Button
                      type="button"
                      variant={warningStatus === "IGNORED" ? "brand" : "outline"}
                      disabled={isIgnoreButtonDisabled}
                      title={ignoreDisabledTitle}
                      onClick={() => openWarningModal("IGNORED")}
                      className={[
                        "h-12 px-6 text-base font-semibold",
                        warningStatus === "IGNORED" ? "" : "text-gray-500",
                      ].join(" ")}
                    >
                      {updatingWarningStatus === "IGNORED" ? "처리 중" : "무시"}
                    </Button>
                  </div>
                </div>
              </section>
            </>
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={pendingStatus !== null}
        onClose={closeStatusModal}
        showCloseButton={false}
        className="mx-4 w-full max-w-md"
      >
        <ModalPanel>
          <ModalHeader className="pr-0">
            <ModalTitle>신고 처리</ModalTitle>
          </ModalHeader>

          <ModalBody className="mt-5 space-y-4">
            <p className="text-sm font-medium text-gray-800">{statusModalMessage}</p>

            {pendingStatus === "ADMIN_HIDDEN" ? (
              <div>
                <label
                  htmlFor="reported-content-admin-hidden-reason"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  노출중지 사유
                </label>
                <InputField
                  id="reported-content-admin-hidden-reason"
                  value={processReason}
                  onChange={(event) => changeProcessReason(event.target.value)}
                  disabled={updatingStatus !== null}
                  placeholder="노출중지 사유를 입력해주세요"
                />
              </div>
            ) : null}

            {modalError ? <p className="text-sm font-medium text-rose-600">{modalError}</p> : null}
          </ModalBody>

          <ModalFooter>
            <Button type="button" variant="outline" onClick={closeStatusModal} disabled={updatingStatus !== null}>
              취소
            </Button>
            <Button type="button" variant="brand" onClick={submitStatusChange} disabled={updatingStatus !== null}>
              {updatingStatus !== null ? "처리 중..." : "확인"}
            </Button>
          </ModalFooter>
        </ModalPanel>
      </Modal>

      <Modal
        isOpen={isWarningUnavailableModalOpen}
        onClose={() => setIsWarningUnavailableModalOpen(false)}
        showCloseButton={false}
        className="mx-4 w-full max-w-sm"
      >
        <ModalPanel>
          <ModalBody className="mt-2">
            <p className="text-sm font-medium text-gray-800">해당 상태에서는 경고여부를 선택할 수 없습니다.</p>
          </ModalBody>

          <ModalFooter>
            <Button type="button" variant="brand" onClick={() => setIsWarningUnavailableModalOpen(false)}>
              확인
            </Button>
          </ModalFooter>
        </ModalPanel>
      </Modal>

      <Modal
        isOpen={pendingWarningStatus !== null}
        onClose={closeWarningModal}
        showCloseButton={false}
        className="mx-4 w-full max-w-md"
      >
        <ModalPanel>
          <ModalHeader className="pr-0">
            <ModalTitle>경고 처리</ModalTitle>
          </ModalHeader>

          <ModalBody className="mt-5 space-y-3">
            <p className="text-sm font-medium text-gray-800">{warningModalMessage}</p>
            {pendingWarningStatus === "WARNED" ? (
              <div className="space-y-1 text-sm text-gray-500">
                <p>경고가 누적 10회가 되면 해당 회원은 차단됩니다.</p>
                <p>
                  현재누적 <span className="font-semibold text-red-500">{warningCount.toLocaleString()}</span>건
                </p>
              </div>
            ) : null}

            {warningModalError ? <p className="text-sm font-medium text-rose-600">{warningModalError}</p> : null}
          </ModalBody>

          <ModalFooter>
            <Button
              type="button"
              variant="outline"
              onClick={closeWarningModal}
              disabled={updatingWarningStatus !== null}
            >
              취소
            </Button>
            <Button
              type="button"
              variant="brand"
              onClick={submitWarningStatusChange}
              disabled={updatingWarningStatus !== null}
            >
              {updatingWarningStatus !== null ? "처리 중..." : "확인"}
            </Button>
          </ModalFooter>
        </ModalPanel>
      </Modal>
    </>
  );
}
