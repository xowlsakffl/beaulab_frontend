"use client";

import React from "react";
import { Button, Modal, ModalBody, ModalFooter, ModalHeader, ModalPanel, ModalTitle } from "@beaulab/ui-admin";

import { useReportedContentReports } from "@/hooks/reported-content/useReportedContentReports";
import type { ReportedContentRow } from "@/lib/reported-content/list";

import { ReportedContentReportsList, reportedContentReportsTotal } from "./ReportedContentReportsList";

type ReportedContentReportsModalProps = {
  row: ReportedContentRow | null;
  onClose: () => void;
};

export function ReportedContentReportsModal({ row, onClose }: ReportedContentReportsModalProps) {
  const { reports, meta, loading, error, page, setPage } = useReportedContentReports({
    targetType: row?.targetType ?? null,
    targetId: row?.id ?? null,
    enabled: row !== null,
    latestKey: row ? `reported-content:reports:${row.targetType}:${row.id}` : undefined,
  });

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
