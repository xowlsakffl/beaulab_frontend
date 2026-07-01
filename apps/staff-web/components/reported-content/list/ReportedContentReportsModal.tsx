"use client";

import React from "react";
import { isApiSuccess } from "@beaulab/types";
import {
  Button,
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
  formatReportedContentDetailDateTime,
  formatReportedContentReason,
  formatReportedContentReporterName,
  type ReportedContentDetailReportItem,
  type ReportedContentReportsMeta,
} from "@/lib/reported-content/detail";
import type { ReportedContentRow } from "@/lib/reported-content/list";

type ReportedContentReportsModalProps = {
  row: ReportedContentRow | null;
  onClose: () => void;
};

export function ReportedContentReportsModal({ row, onClose }: ReportedContentReportsModalProps) {
  const [page, setPage] = React.useState(1);
  const [reports, setReports] = React.useState<ReportedContentDetailReportItem[]>([]);
  const [meta, setMeta] = React.useState<ReportedContentReportsMeta | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setPage(1);
    setReports([]);
    setMeta(null);
    setError(null);
  }, [row?.id, row?.targetType]);

  React.useEffect(() => {
    if (!row) return;

    let isMounted = true;

    const fetchReports = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get<ReportedContentDetailReportItem[]>(
          `/reported-contents/${row.targetType}/${row.id}/reports`,
          { reports_page: page },
          { latestKey: `reported-content:reports:${row.targetType}:${row.id}` },
        );

        if (!isMounted) return;

        if (!isApiSuccess(response)) {
          setReports([]);
          setMeta(null);
          setError(response.error.message || "신고목록을 불러오지 못했습니다.");
          return;
        }

        setReports(response.data ?? []);
        setMeta((response.meta as ReportedContentReportsMeta | null) ?? null);
      } catch {
        if (!isMounted) return;

        setReports([]);
        setMeta(null);
        setError("신고목록 조회 중 오류가 발생했습니다.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void fetchReports();

    return () => {
      isMounted = false;
    };
  }, [page, row]);

  const currentPage = Number(meta?.current_page ?? page);
  const lastPage = Math.max(1, Number(meta?.last_page ?? 1));
  const total = Number(meta?.total ?? reports.length);

  return (
    <Modal isOpen={row !== null} onClose={onClose} showCloseButton={false} className="mx-4 w-full max-w-2xl">
      <ModalPanel>
        <ModalHeader className="pr-0">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <ModalTitle>신고목록</ModalTitle>
            <span className="text-sm font-semibold text-gray-700">{total.toLocaleString()}건</span>
          </div>
        </ModalHeader>

        <ModalBody className="mt-5">
          {loading ? (
            <SpinnerBlock className="min-h-[14rem]" spinnerClassName="size-10" label="신고목록을 불러오는 중" />
          ) : error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
          ) : reports.length > 0 ? (
            <div className="space-y-3">
              <div className="grid grid-cols-[8rem_minmax(0,1fr)_8rem] gap-3 border-b border-gray-200 pb-2 text-xs font-semibold text-gray-500">
                <span>신고자</span>
                <span>신고사유</span>
                <span>신고일</span>
              </div>
              {reports.map((report) => (
                <div
                  key={report.id ?? `${report.created_at}-${report.reason}`}
                  className="grid grid-cols-[8rem_minmax(0,1fr)_8rem] gap-3 text-sm text-gray-800"
                >
                  <span className="min-w-0 truncate">{formatReportedContentReporterName(report)}</span>
                  <span className="min-w-0 break-words">{formatReportedContentReason(report)}</span>
                  <span className="text-xs whitespace-nowrap text-gray-600">
                    {formatReportedContentDetailDateTime(report.created_at)}
                  </span>
                </div>
              ))}

              <div className="flex justify-center pt-2">
                <Pagination currentPage={currentPage} totalPages={lastPage} onPageChange={setPage} disabled={loading} />
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
              신고목록이 없습니다.
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          <Button type="button" variant="brand" onClick={onClose}>
            확인
          </Button>
        </ModalFooter>
      </ModalPanel>
    </Modal>
  );
}
