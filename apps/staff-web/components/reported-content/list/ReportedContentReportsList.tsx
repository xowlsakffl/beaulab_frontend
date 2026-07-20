"use client";

import { Pagination, SpinnerBlock } from "@beaulab/ui-admin";

import {
  formatReportedContentDetailDateTime,
  formatReportedContentReason,
  formatReportedContentReporterName,
  type ReportedContentDetailReportItem,
  type ReportedContentReportsMeta,
} from "@/lib/reported-content/detail";

type ReportedContentReportsListProps = {
  reports: ReportedContentDetailReportItem[];
  meta: ReportedContentReportsMeta | null;
  loading: boolean;
  error: string | null;
  page: number;
  loadingLabel?: string;
  emptyLabel?: string;
  onPageChange: (page: number) => void;
};

export function reportedContentReportsTotal(
  meta: ReportedContentReportsMeta | null,
  reports: ReportedContentDetailReportItem[],
  totalFallback?: number,
) {
  return Number(meta?.total ?? totalFallback ?? reports.length);
}

export function ReportedContentReportsList({
  reports,
  meta,
  loading,
  error,
  page,
  loadingLabel = "신고목록을 불러오는 중",
  emptyLabel = "신고목록이 없습니다.",
  onPageChange,
}: ReportedContentReportsListProps) {
  const currentPage = Number(meta?.current_page ?? page);
  const lastPage = Math.max(1, Number(meta?.last_page ?? 1));

  if (loading) {
    return <SpinnerBlock className="min-h-[14rem]" spinnerClassName="size-10" label={loadingLabel} />;
  }

  if (error) {
    return <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>;
  }

  if (reports.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
        {emptyLabel}
      </div>
    );
  }

  return (
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
        <Pagination currentPage={currentPage} totalPages={lastPage} onPageChange={onPageChange} disabled={loading} />
      </div>
    </div>
  );
}
