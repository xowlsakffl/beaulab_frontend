import React from "react";

import {
  DataTable,
  DataTableSortHeader,
  StatusValueBadge,
  type DataTableColumn,
  type DataTableMeta,
} from "@beaulab/ui-admin";

import { ownerVisibilityStatusColor } from "@/lib/common/status-labels";
import type { NoticeRow, SortField, SortState } from "@/lib/notice/list";
import { labelNoticeStatus } from "@/lib/notice/options";

function buildNoticeColumns({
  sortState,
  onToggleSort,
}: {
  sortState: SortState;
  onToggleSort: (field: SortField) => void;
}): DataTableColumn<NoticeRow>[] {
  const headerClass = "px-2 py-3 text-left text-theme-xs font-semibold text-gray-600";
  const cellClass = "px-2 py-4 text-start align-top";
  const sortHeader = (field: SortField, label: string) => (
    <DataTableSortHeader
      label={label}
      active={sortState.enabled && sortState.field === field}
      direction={sortState.direction}
      onClick={() => onToggleSort(field)}
    />
  );

  return [
    {
      key: "id",
      header: sortHeader("id", "ID"),
      headerClassName: `${headerClass} w-[80px]`,
      cellClassName: cellClass,
      render: (row) => row.id,
    },
    {
      key: "createdAt",
      header: sortHeader("created_at", "등록일"),
      headerClassName: `${headerClass} w-[130px]`,
      cellClassName: `${cellClass} whitespace-nowrap`,
      render: (row) => row.createdAt,
    },
    {
      key: "channel",
      header: sortHeader("channel", "채널"),
      headerClassName: `${headerClass} w-[120px]`,
      cellClassName: cellClass,
      render: (row) => row.channel,
    },
    {
      key: "title",
      header: sortHeader("title", "제목"),
      headerClassName: headerClass,
      cellClassName: cellClass,
      render: (row) => (
        <span className="block truncate font-medium text-gray-800" title={row.title}>
          {row.title}
        </span>
      ),
    },
    {
      key: "status",
      header: sortHeader("status", "공개여부"),
      headerClassName: `${headerClass} w-[110px]`,
      cellClassName: cellClass,
      render: (row) => (
        <StatusValueBadge label={labelNoticeStatus(row.status)} color={ownerVisibilityStatusColor(row.status)} />
      ),
    },
    {
      key: "viewCount",
      header: sortHeader("view_count", "조회수"),
      headerClassName: `${headerClass} w-[100px]`,
      cellClassName: cellClass,
      render: (row) => row.viewCount.toLocaleString(),
    },
    {
      key: "creatorName",
      header: "관리자",
      headerClassName: `${headerClass} w-[140px]`,
      cellClassName: `${cellClass} break-words`,
      render: (row) => row.creatorName,
    },
  ];
}

type NoticesDataTableProps = {
  rows: NoticeRow[];
  meta: DataTableMeta | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  highlightedRowId: number | null;
  sortState: SortState;
  onToggleSort: (field: SortField) => void;
  onGoPage: (page: number) => void;
  onRowClick: (row: NoticeRow) => void;
};

export function NoticesDataTable({ sortState, onToggleSort, highlightedRowId, ...props }: NoticesDataTableProps) {
  const columns = React.useMemo(() => buildNoticeColumns({ sortState, onToggleSort }), [sortState, onToggleSort]);

  return (
    <DataTable
      {...props}
      tableClassName="w-full min-w-[1000px] table-fixed"
      columns={columns}
      getRowKey={(row) => row.id}
      getRowClassName={(row) =>
        row.id === highlightedRowId ? "bg-emerald-50/90 transition-colors duration-500" : undefined
      }
      loadingVariant="spinner"
      loadingLabel="공지사항 목록 불러오는 중"
      emptyText="조건에 맞는 공지사항이 없습니다."
    />
  );
}
