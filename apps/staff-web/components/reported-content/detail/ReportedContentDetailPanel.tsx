"use client";

import React from "react";
import { isApiSuccess } from "@beaulab/types";
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
  Pagination,
  SpinnerBlock,
} from "@beaulab/ui-admin";

import { api } from "@/lib/common/api";
import {
  formatReportedContentAuthorName,
  formatReportedContentDetailDate,
  formatReportedContentDetailDateTime,
  formatReportedContentReason,
  formatReportedContentReporterName,
  type ReportedContentDetailReportItem,
  type ReportedContentDetailResponse,
  type ReportedContentReportsMeta,
  type ReportedContentStatusUpdatePayload,
  type ReportedContentTargetType,
  type ReportedContentWarningStatusUpdatePayload,
} from "@/lib/reported-content/detail";

type ReportedContentDetailPanelProps = {
  targetType: ReportedContentTargetType;
  targetId: number;
  onStatusUpdated?: () => void;
};

type ReportActionStatus = "ADMIN_HIDDEN" | "NORMAL_VISIBLE";
type WarningActionStatus = "WARNED" | "IGNORED";

const panelLabelClass = "text-xs font-semibold text-gray-500 dark:text-gray-400";
const panelValueClass = "text-sm font-medium text-gray-800 dark:text-white/90";

export function ReportedContentDetailPanel({
  targetType,
  targetId,
  onStatusUpdated,
}: ReportedContentDetailPanelProps) {
  const [detail, setDetail] = React.useState<ReportedContentDetailResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [updatingStatus, setUpdatingStatus] = React.useState<ReportActionStatus | null>(null);
  const [pendingStatus, setPendingStatus] = React.useState<ReportActionStatus | null>(null);
  const [updatingWarningStatus, setUpdatingWarningStatus] = React.useState<WarningActionStatus | null>(null);
  const [pendingWarningStatus, setPendingWarningStatus] = React.useState<WarningActionStatus | null>(null);
  const [isWarningUnavailableModalOpen, setIsWarningUnavailableModalOpen] = React.useState(false);
  const [processReason, setProcessReason] = React.useState("");
  const [modalError, setModalError] = React.useState<string | null>(null);
  const [warningModalError, setWarningModalError] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [reports, setReports] = React.useState<ReportedContentDetailReportItem[]>([]);
  const [reportsMeta, setReportsMeta] = React.useState<ReportedContentReportsMeta | null>(null);
  const [reportsLoading, setReportsLoading] = React.useState(true);
  const [reportsError, setReportsError] = React.useState<string | null>(null);
  const [reportsPage, setReportsPage] = React.useState(1);

  const fetchDetail = React.useCallback(async () => {
    if (!Number.isFinite(targetId) || targetId <= 0) return;

    setLoading(true);
    setError(null);

    try {
      const response = await api.get<ReportedContentDetailResponse>(
        `/reported-contents/detail/${targetType}/${targetId}`,
      );

      if (!isApiSuccess(response)) {
        setError(response.error.message || "신고 상세 조회에 실패했습니다.");
        return;
      }

      setDetail(response.data);
    } catch {
      setError("신고 상세 조회 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [targetId, targetType]);

  const fetchReports = React.useCallback(async () => {
    if (!Number.isFinite(targetId) || targetId <= 0) return;

    setReportsLoading(true);
    setReportsError(null);

    try {
      const response = await api.get<ReportedContentDetailReportItem[]>(
        `/reported-contents/${targetType}/${targetId}/reports`,
        { reports_page: reportsPage },
      );

      if (!isApiSuccess(response)) {
        setReports([]);
        setReportsMeta(null);
        setReportsError(response.error.message || "신고 내역 조회에 실패했습니다.");
        return;
      }

      setReports(response.data ?? []);
      setReportsMeta((response.meta as ReportedContentReportsMeta | null) ?? null);
    } catch {
      setReports([]);
      setReportsMeta(null);
      setReportsError("신고 내역 조회 중 오류가 발생했습니다.");
    } finally {
      setReportsLoading(false);
    }
  }, [reportsPage, targetId, targetType]);

  React.useEffect(() => {
    setReportsPage(1);
    setReports([]);
    setReportsMeta(null);
  }, [targetId, targetType]);

  React.useEffect(() => {
    void fetchDetail();
  }, [fetchDetail]);

  React.useEffect(() => {
    void fetchReports();
  }, [fetchReports]);

  const author = detail?.author ?? null;
  const authorStats = detail?.author_stats ?? null;
  const reportState = detail?.report ?? null;
  const reportsTotal = Number(reportsMeta?.total ?? reports.length);
  const reportsCurrentPage = Number(reportsMeta?.current_page ?? reportsPage);
  const reportsLastPage = Math.max(1, Number(reportsMeta?.last_page ?? 1));
  const postTotal = Number(authorStats?.posts?.total ?? 0);
  const reportedPostTotal = Number(authorStats?.posts?.reported ?? 0);
  const commentTotal = Number(authorStats?.comments?.total ?? 0);
  const reportedCommentTotal = Number(authorStats?.comments?.reported ?? 0);
  const warningCount = Number(author?.warning_count ?? 0);
  const reportStatus = reportState?.status?.trim() || "";
  const warningStatus = reportState?.warning_status?.trim() || "NONE";
  const isWarningButtonDisabled = warningStatus === "WARNED" || updatingWarningStatus !== null;
  const isIgnoreButtonDisabled = warningStatus === "IGNORED" || updatingWarningStatus !== null;

  const updateReportStatus = React.useCallback(
    async (reportStatus: ReportActionStatus, reason?: string) => {
      setUpdatingStatus(reportStatus);
      setModalError(null);

      const payload: ReportedContentStatusUpdatePayload = {
        target_type: targetType,
        target_id: targetId,
        report_status: reportStatus,
      };
      const normalizedReason = reason?.trim();
      if (normalizedReason) payload.process_reason = normalizedReason;

      try {
        const response = await api.patch("/reported-contents/status", payload);

        if (!isApiSuccess(response)) {
          setModalError(response.error.message || "신고 처리 상태 변경에 실패했습니다.");
          return;
        }

        await fetchDetail();
        onStatusUpdated?.();
        setPendingStatus(null);
        setProcessReason("");
      } catch {
        setModalError("신고 처리 상태 변경 중 오류가 발생했습니다.");
      } finally {
        setUpdatingStatus(null);
      }
    },
    [fetchDetail, onStatusUpdated, targetId, targetType],
  );

  const updateWarningStatus = React.useCallback(
    async (warningStatus: WarningActionStatus) => {
      setUpdatingWarningStatus(warningStatus);
      setWarningModalError(null);

      const payload: ReportedContentWarningStatusUpdatePayload = {
        target_type: targetType,
        target_id: targetId,
        warning_status: warningStatus,
      };

      try {
        const response = await api.patch("/reported-contents/warning-status", payload);

        if (!isApiSuccess(response)) {
          setWarningModalError(response.error.message || "경고 처리 상태 변경에 실패했습니다.");
          return;
        }

        await fetchDetail();
        onStatusUpdated?.();
        setPendingWarningStatus(null);
      } catch {
        setWarningModalError("경고 처리 상태 변경 중 오류가 발생했습니다.");
      } finally {
        setUpdatingWarningStatus(null);
      }
    },
    [fetchDetail, onStatusUpdated, targetId, targetType],
  );

  const openStatusModal = React.useCallback((reportStatus: ReportActionStatus) => {
    setPendingStatus(reportStatus);
    setProcessReason("");
    setModalError(null);
  }, []);

  const closeStatusModal = React.useCallback(() => {
    if (updatingStatus !== null) return;

    setPendingStatus(null);
    setProcessReason("");
    setModalError(null);
  }, [updatingStatus]);

  const openWarningModal = React.useCallback((warningStatus: WarningActionStatus) => {
    if (reportState?.status?.trim() !== "ADMIN_HIDDEN") {
      setIsWarningUnavailableModalOpen(true);
      return;
    }

    setPendingWarningStatus(warningStatus);
    setWarningModalError(null);
  }, [reportState?.status]);

  const closeWarningModal = React.useCallback(() => {
    if (updatingWarningStatus !== null) return;

    setPendingWarningStatus(null);
    setWarningModalError(null);
  }, [updatingWarningStatus]);

  const submitStatusChange = React.useCallback(() => {
    if (!pendingStatus) return;

    if (pendingStatus === "ADMIN_HIDDEN" && processReason.trim() === "") {
      setModalError("노출중지 사유를 입력해주세요.");
      return;
    }

    void updateReportStatus(pendingStatus, pendingStatus === "ADMIN_HIDDEN" ? processReason : undefined);
  }, [pendingStatus, processReason, updateReportStatus]);

  const submitWarningStatusChange = React.useCallback(() => {
    if (!pendingWarningStatus) return;

    void updateWarningStatus(pendingWarningStatus);
  }, [pendingWarningStatus, updateWarningStatus]);

  const pendingStatusLabel = pendingStatus === "ADMIN_HIDDEN" ? "노출중지" : "정상노출";
  const targetNoun = targetType.includes("comment") ? "댓글" : "게시물";
  const statusModalMessage = pendingStatus
    ? `해당 ${targetNoun}을 ${pendingStatusLabel} 하시겠습니까?`
    : "";
  const warningModalMessage = pendingWarningStatus === "WARNED"
    ? warningStatus === "IGNORED"
      ? "무시를 경고로 변경하시겠습니까?"
      : "해당 유저에게 경고하시겠습니까?"
    : warningStatus === "WARNED"
      ? "해당 경고를 무시로 변경하시겠습니까?"
      : `해당 ${targetNoun}의 경고 처리를 무시하시겠습니까?`;
  const warningDisabledTitle = warningStatus === "WARNED"
    ? "이미 경고 처리된 신고입니다."
    : undefined;
  const ignoreDisabledTitle = warningStatus === "IGNORED"
    ? "이미 무시 처리된 신고입니다."
    : undefined;

  return (
    <>
      <Card as="aside" className="min-w-0">
        <CardHeader className="pb-4">
          <CardTitle>작성자 정보</CardTitle>
        </CardHeader>

        <CardContent className="space-y-8">
          {loading ? (
            <SpinnerBlock label="신고 상세 불러오는 중" />
          ) : error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
              {error}
            </div>
          ) : (
            <>
            <section className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <DetailValue label="작성자" value={formatReportedContentAuthorName(author)} />
                <DetailValue label="가입일" value={formatReportedContentDetailDate(author?.created_at)} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <AuthorStatBox
                  label="게시글/댓글"
                  value={`${postTotal.toLocaleString()}/${commentTotal.toLocaleString()}`}
                />
                <AuthorStatBox
                  label="신고된 게시글/댓글"
                  value={`${reportedPostTotal.toLocaleString()}/${reportedCommentTotal.toLocaleString()}`}
                />
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">신고 내용 상세</h3>
                <span className="text-sm font-semibold text-gray-800 dark:text-white/90">
                  {reportsTotal.toLocaleString()}회
                </span>
              </div>

              <div className="grid grid-cols-[minmax(5rem,0.8fr)_minmax(0,1.35fr)_minmax(6.5rem,0.9fr)] gap-3 text-xs font-semibold text-gray-500 dark:text-gray-400">
                <span>신고자목록</span>
                <span>신고 사유</span>
                <span>신고일</span>
              </div>

              {reportsLoading ? (
                <SpinnerBlock label="신고 내역 불러오는 중" />
              ) : reportsError ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
                  {reportsError}
                </div>
              ) : reports.length > 0 ? (
                <div className="space-y-2">
                  {reports.map((report) => (
                    <div
                      key={report.id ?? `${report.created_at}-${report.reason}`}
                      className="grid grid-cols-[minmax(5rem,0.8fr)_minmax(0,1.35fr)_minmax(6.5rem,0.9fr)] gap-3 text-sm text-gray-800 dark:text-gray-100"
                    >
                      <span className="min-w-0 truncate">{formatReportedContentReporterName(report)}</span>
                      <span className="min-w-0 break-words">{formatReportedContentReason(report)}</span>
                      <span className="whitespace-nowrap text-xs text-gray-600 dark:text-gray-300">
                        {formatReportedContentDetailDateTime(report.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-950/30 dark:text-gray-400">
                  신고 내역이 없습니다.
                </div>
              )}

              {reportsLastPage > 1 ? (
                <div className="flex justify-center pt-2">
                  <Pagination
                    currentPage={reportsCurrentPage}
                    totalPages={reportsLastPage}
                    onPageChange={setReportsPage}
                    disabled={reportsLoading || updatingStatus !== null}
                  />
                </div>
              ) : null}
            </section>

            <section className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">조치유형</h3>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={reportStatus === "ADMIN_HIDDEN" ? "brand" : "outline"}
                    disabled={updatingStatus !== null}
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
                    disabled={updatingStatus !== null}
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
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">경고여부</h3>
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
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              {statusModalMessage}
            </p>

            {pendingStatus === "ADMIN_HIDDEN" ? (
              <div>
                <label
                  htmlFor="reported-content-admin-hidden-reason"
                  className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
                >
                  노출중지 사유
                </label>
                <InputField
                  id="reported-content-admin-hidden-reason"
                  value={processReason}
                  onChange={(event) => {
                    setProcessReason(event.target.value);
                    if (modalError) setModalError(null);
                  }}
                  disabled={updatingStatus !== null}
                  placeholder="노출중지 사유를 입력해주세요"
                />
              </div>
            ) : null}

            {modalError ? (
              <p className="text-sm font-medium text-rose-600 dark:text-rose-300">
                {modalError}
              </p>
            ) : null}
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
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              해당 상태에서는 경고여부를 선택할 수 없습니다.
            </p>
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
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              {warningModalMessage}
            </p>
            {pendingWarningStatus === "WARNED" ? (
              <div className="space-y-1 text-sm text-gray-500 dark:text-gray-400">
                <p>경고가 누적 10회가 되면 해당 회원은 차단됩니다.</p>
                <p>
                  현재누적 <span className="font-semibold text-red-500">{warningCount.toLocaleString()}</span>건
                </p>
              </div>
            ) : null}

            {warningModalError ? (
              <p className="text-sm font-medium text-rose-600 dark:text-rose-300">
                {warningModalError}
              </p>
            ) : null}
          </ModalBody>

          <ModalFooter>
            <Button type="button" variant="outline" onClick={closeWarningModal} disabled={updatingWarningStatus !== null}>
              취소
            </Button>
            <Button type="button" variant="brand" onClick={submitWarningStatusChange} disabled={updatingWarningStatus !== null}>
              {updatingWarningStatus !== null ? "처리 중..." : "확인"}
            </Button>
          </ModalFooter>
        </ModalPanel>
      </Modal>
    </>
  );
}

function DetailValue({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className={panelLabelClass}>{label}</p>
      <div className={panelValueClass}>{value}</div>
    </div>
  );
}

function AuthorStatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-center dark:border-white/[0.08] dark:bg-white/[0.04]">
      <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">{label}</p>
      <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}
