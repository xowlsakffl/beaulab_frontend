import React from "react";

import {
  Button,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  DataTable,
  Select,
  StatusBadge,
  type DataTableColumn,
  type DataTableMeta,
} from "@beaulab/ui-admin";

import {
  PER_PAGE_OPTIONS,
  labelVideoApprovalStatus,
  labelVideoOperatingStatus,
  type SortField,
  type SortState,
  type VideoRow,
} from "@/lib/video/list";

function renderSortMark(field: SortField, sortState: SortState) {
  if (!sortState.enabled || sortState.field !== field) {
    return <ChevronsUpDown className="size-4" />;
  }

  return sortState.direction === "desc"
    ? <ChevronDown className="size-4" />
    : <ChevronUp className="size-4" />;
}

function buildVideoColumns({
  sortState,
  onToggleSort,
}: {
  sortState: SortState;
  onToggleSort: (field: SortField) => void;
}): DataTableColumn<VideoRow>[] {
  const headerBaseClass =
    "px-3 py-3 text-left font-semibold text-gray-600 text-theme-xs dark:text-gray-300";
  const cellBaseClass = "px-3 py-4 text-start align-top dark:text-gray-200";
  const nowrapCellClass = `${cellBaseClass} whitespace-nowrap`;

  return [
    {
      key: "id",
      headerClassName: `${headerBaseClass} lg:w-[72px]`,
      cellClassName: `${nowrapCellClass} lg:w-[72px]`,
      header: (
        <Button type="button" variant="ghost" size="sm" onClick={() => onToggleSort("id")} className="inline-flex items-center gap-1 px-0 text-xs">
          ID <span className="text-xs text-gray-400">{renderSortMark("id", sortState)}</span>
        </Button>
      ),
      render: (row) => row.id,
    },
    {
      key: "hospitalName",
      headerClassName: `${headerBaseClass} lg:w-[180px]`,
      cellClassName: `${cellBaseClass} lg:w-[180px]`,
      header: "병의원명",
      render: (row) => (
        <span className="block truncate font-medium text-gray-800 dark:text-white/90" title={row.hospitalName}>
          {row.hospitalName}
        </span>
      ),
    },
    {
      key: "doctorName",
      headerClassName: `${headerBaseClass} lg:w-[140px]`,
      cellClassName: `${cellBaseClass} lg:w-[140px]`,
      header: "의료진이름",
      render: (row) => (
        <span className="block truncate" title={row.doctorName}>
          {row.doctorName}
        </span>
      ),
    },
    {
      key: "title",
      headerClassName: `${headerBaseClass} lg:w-[260px]`,
      cellClassName: `${cellBaseClass} lg:w-[260px]`,
      header: (
        <Button type="button" variant="ghost" size="sm" onClick={() => onToggleSort("title")} className="inline-flex items-center gap-1 px-0 text-xs">
          제목 <span className="text-xs text-gray-400">{renderSortMark("title", sortState)}</span>
        </Button>
      ),
      render: (row) => (
        <div className="flex items-start gap-2">
          {row.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- image domains come from runtime API/storage configuration
            <img
              src={row.thumbnailUrl}
              alt={row.title}
              className="h-10 w-10 shrink-0 rounded-md border border-gray-200 object-cover dark:border-white/[0.08]"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-dashed border-gray-300 text-[10px] text-gray-400 dark:border-white/[0.08] dark:text-gray-500">
              없음
            </div>
          )}
          <span className="block min-w-0 truncate font-medium text-gray-800 dark:text-white/90" title={row.title}>
            {row.title}
          </span>
        </div>
      ),
    },
    {
      key: "distributionChannel",
      headerClassName: `${headerBaseClass} lg:w-[120px]`,
      cellClassName: `${nowrapCellClass} lg:w-[120px]`,
      header: (
        <Button type="button" variant="ghost" size="sm" onClick={() => onToggleSort("distribution_channel")} className="inline-flex items-center gap-1 px-0 text-xs">
          배포채널 <span className="text-xs text-gray-400">{renderSortMark("distribution_channel", sortState)}</span>
        </Button>
      ),
      render: (row) => row.distributionChannelLabel,
    },
    {
      key: "viewCount",
      headerClassName: `${headerBaseClass} lg:w-[100px]`,
      cellClassName: `${nowrapCellClass} lg:w-[100px]`,
      header: (
        <Button type="button" variant="ghost" size="sm" onClick={() => onToggleSort("view_count")} className="inline-flex items-center gap-1 px-0 text-xs">
          조회수 <span className="text-xs text-gray-400">{renderSortMark("view_count", sortState)}</span>
        </Button>
      ),
      render: (row) => row.viewCount.toLocaleString(),
    },
    {
      key: "likeCount",
      headerClassName: `${headerBaseClass} lg:w-[110px]`,
      cellClassName: `${nowrapCellClass} lg:w-[110px]`,
      header: (
        <Button type="button" variant="ghost" size="sm" onClick={() => onToggleSort("like_count")} className="inline-flex items-center gap-1 px-0 text-xs">
          좋아요 수 <span className="text-xs text-gray-400">{renderSortMark("like_count", sortState)}</span>
        </Button>
      ),
      render: (row) => row.likeCount.toLocaleString(),
    },
    {
      key: "operatingStatus",
      headerClassName: `${headerBaseClass} lg:w-[110px]`,
      cellClassName: `${nowrapCellClass} lg:w-[110px]`,
      header: (
        <Button type="button" variant="ghost" size="sm" onClick={() => onToggleSort("status")} className="inline-flex items-center gap-1 px-0 text-xs">
          운영 상태 <span className="text-xs text-gray-400">{renderSortMark("status", sortState)}</span>
        </Button>
      ),
      render: (row) => (
        <StatusBadge size="sm" color={row.operatingStatus === "ACTIVE" ? "success" : "error"}>
          {labelVideoOperatingStatus(row.operatingStatus)}
        </StatusBadge>
      ),
    },
    {
      key: "approvalStatus",
      headerClassName: `${headerBaseClass} lg:w-[120px]`,
      cellClassName: `${nowrapCellClass} lg:w-[120px]`,
      header: (
        <Button type="button" variant="ghost" size="sm" onClick={() => onToggleSort("allow_status")} className="inline-flex items-center gap-1 px-0 text-xs">
          검수 상태 <span className="text-xs text-gray-400">{renderSortMark("allow_status", sortState)}</span>
        </Button>
      ),
      render: (row) => (
        <StatusBadge
          size="sm"
          color={
            row.approvalStatus === "APPROVED"
              ? "success"
              : row.approvalStatus === "IN_REVIEW" || row.approvalStatus === "SUBMITTED"
                ? "warning"
                : "error"
          }
        >
          {labelVideoApprovalStatus(row.approvalStatus)}
        </StatusBadge>
      ),
    },
    {
      key: "requestedAt",
      headerClassName: `${headerBaseClass} lg:w-[150px]`,
      cellClassName: `${nowrapCellClass} lg:w-[150px]`,
      header: (
        <Button type="button" variant="ghost" size="sm" onClick={() => onToggleSort("created_at")} className="inline-flex items-center gap-1 px-0 text-xs">
          등록신청일 <span className="text-xs text-gray-400">{renderSortMark("created_at", sortState)}</span>
        </Button>
      ),
      render: (row) => row.requestedAt,
    },
    {
      key: "completedAt",
      headerClassName: `${headerBaseClass} lg:w-[150px]`,
      cellClassName: `${nowrapCellClass} lg:w-[150px]`,
      header: (
        <Button type="button" variant="ghost" size="sm" onClick={() => onToggleSort("allowed_at")} className="inline-flex items-center gap-1 px-0 text-xs">
          등록완료일 <span className="text-xs text-gray-400">{renderSortMark("allowed_at", sortState)}</span>
        </Button>
      ),
      render: (row) => row.completedAt,
    },
  ];
}

type VideosDataTableProps = {
  rows: VideoRow[];
  meta: DataTableMeta | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  highlightedRowId: number | null;
  sortState: SortState;
  perPage: number;
  onToggleSort: (field: SortField) => void;
  onRefresh: () => void;
  onGoPage: (page: number) => void;
  onPerPageChange: (value: number) => void;
  onRowClick: (row: VideoRow) => void;
};

export function VideosDataTable({
  rows,
  meta,
  loading,
  refreshing,
  error,
  highlightedRowId,
  sortState,
  perPage,
  onToggleSort,
  onRefresh,
  onGoPage,
  onPerPageChange,
  onRowClick,
}: VideosDataTableProps) {
  const columns = React.useMemo(
    () => buildVideoColumns({ sortState, onToggleSort }),
    [sortState, onToggleSort],
  );

  return (
    <DataTable
      title="동영상 목록"
      description="병의원 파트너가 신청한 동영상의 검수 상태와 배포 정보를 확인할 수 있습니다."
      tableClassName="min-w-[1760px] w-full lg:min-w-0 lg:table-fixed"
      columns={columns}
      rows={rows}
      getRowKey={(row) => row.id}
      getRowClassName={(row) =>
        row.id === highlightedRowId
          ? "bg-emerald-50/90 transition-colors duration-500 dark:bg-emerald-500/10"
          : undefined
      }
      loadingVariant="spinner"
      loadingLabel="동영상 목록 불러오는 중"
      loading={loading}
      refreshing={refreshing}
      error={error}
      meta={meta}
      onRefresh={onRefresh}
      onGoPage={onGoPage}
      onRowClick={onRowClick}
      rightActions={(
        <div className="flex items-center gap-2">
          <Select
            defaultValue={String(perPage)}
            options={PER_PAGE_OPTIONS}
            showPlaceholderOption={false}
            onChange={(value) => onPerPageChange(Number(value))}
            placeholder="개수 선택"
            className="w-[70px] px-2 text-xs"
          />
        </div>
      )}
      emptyText="조건에 맞는 동영상이 없습니다."
    />
  );
}
