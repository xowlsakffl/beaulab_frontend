"use client";

import React from "react";
import { isApiSuccess } from "@beaulab/types";
import { Button, Modal, ModalBody, ModalFooter, ModalHeader, ModalPanel, ModalTitle } from "@beaulab/ui-admin";

import { api } from "@/lib/common/api";
import { type ReportedContentDetailReportItem, type ReportedContentReportsMeta } from "@/lib/reported-content/detail";
import type { ReportedContentRow } from "@/lib/reported-content/list";

import { ReportedContentReportsList, reportedContentReportsTotal } from "./ReportedContentReportsList";

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
  const total = reportedContentReportsTotal(meta, reports);

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
          <ReportedContentReportsList
            reports={reports}
            meta={meta}
            loading={loading}
            error={error}
            page={currentPage}
            onPageChange={setPage}
          />
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
