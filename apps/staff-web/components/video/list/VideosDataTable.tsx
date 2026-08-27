import React from "react";
import Link from "next/link";
import {
  Button,
  CategoryBadgeList,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  DataTable,
  Pagination,
  type DataTableColumn,
  type DataTableMeta,
  StatusValueBadge,
} from "@beaulab/ui-admin";

import { reportStatusBadgeColor, reportStatusBadgeLabel } from "@/lib/common/report-status";
import { adminStatusColor } from "@/lib/common/status-labels";
import {
  labelVideoAdminStatus,
  labelVideoHospitalStatus,
  videoHospitalStatusColor,
  type SortField,
  type SortState,
  type VideoRow,
} from "@/lib/video/list";

function renderSortMark(field: SortField, sortState: SortState) {
  if (!sortState.enabled || sortState.field !== field) return <ChevronsUpDown className="size-4" />;

  return sortState.direction === "desc" ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />;
}

function categoryBadges(row: VideoRow) {
  return (
    <CategoryBadgeList
      values={
        row.categoryBadges.length > 0 ? row.categoryBadges.map((category) => category.label) : [row.categoryLabel]
      }
      title={row.categoryLabel}
    />
  );
}

function DetailLink({
  href,
  title,
  children,
  className,
}: {
  href?: string | null;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  const composedClassName = [
    "inline text-gray-800 underline decoration-gray-300 underline-offset-4 transition hover:text-brand-500 hover:decoration-brand-500",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (!href) {
    return (
      <span className={className} title={title}>
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={composedClassName}
      title={title}
      onClick={(event) => {
        event.stopPropagation();
      }}
    >
      {children}
    </Link>
  );
}

function buildVideoColumns({
  sortState,
  onToggleSort,
}: {
  sortState: SortState;
  onToggleSort: (field: SortField) => void;
}): DataTableColumn<VideoRow>[] {
  const headerBaseClass = "px-2 py-3 text-left font-semibold text-theme-xs text-gray-600 ";
  const cellBaseClass = "px-2 py-4 text-start align-top ";
  const nowrapCellClass = `${cellBaseClass} overflow-hidden text-ellipsis whitespace-nowrap`;

  return [
    {
      key: "id",
      headerClassName: `${headerBaseClass} lg:w-[56px]`,
      cellClassName: `${nowrapCellClass} lg:w-[56px]`,
      header: (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onToggleSort("id")}
          className="inline-flex items-center gap-1 px-0 text-xs"
        >
          VID <span className="text-xs text-gray-400">{renderSortMark("id", sortState)}</span>
        </Button>
      ),
      render: (row) => row.id,
    },
    {
      key: "uploadedAt",
      headerClassName: `${headerBaseClass} lg:w-[126px]`,
      cellClassName: `${nowrapCellClass} lg:w-[126px]`,
      header: (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onToggleSort("created_at")}
          className="inline-flex items-center gap-1 px-0 text-xs"
        >
          업로드일 <span className="text-xs text-gray-400">{renderSortMark("created_at", sortState)}</span>
        </Button>
      ),
      render: (row) => row.uploadedAt,
    },
    {
      key: "hospitalName",
      headerClassName: `${headerBaseClass} lg:w-[128px]`,
      cellClassName: `${cellBaseClass} lg:w-[128px]`,
      header: "병의원",
      render: (row) => (
        <DetailLink
          href={row.hospitalId ? `/hospital-manage/hospitals/${row.hospitalId}` : null}
          title={row.hospitalName}
          className="line-clamp-2 font-medium break-words"
        >
          {row.hospitalName}
        </DetailLink>
      ),
    },
    {
      key: "categories",
      headerClassName: `${headerBaseClass} lg:w-[154px]`,
      cellClassName: `${cellBaseClass} lg:w-[154px]`,
      header: "카테고리",
      render: (row) => categoryBadges(row),
    },
    {
      key: "doctorName",
      headerClassName: `${headerBaseClass} lg:w-[92px]`,
      cellClassName: `${cellBaseClass} lg:w-[92px]`,
      header: "의료진",
      render: (row) => (
        <span className="line-clamp-2 break-words text-gray-700" title={row.doctorName}>
          {row.doctorName}
        </span>
      ),
    },
    {
      key: "title",
      headerClassName: `${headerBaseClass} lg:w-[210px]`,
      cellClassName: `${cellBaseClass} lg:w-[210px]`,
      header: (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onToggleSort("title")}
          className="inline-flex items-center gap-1 px-0 text-xs"
        >
          제목 <span className="text-xs text-gray-400">{renderSortMark("title", sortState)}</span>
        </Button>
      ),
      render: (row) => (
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50 text-[11px] font-semibold text-gray-400">
            {row.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- runtime storage URL
              <img
                src={row.thumbnailUrl}
                alt={`${row.title} 썸네일`}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            ) : (
              "썸네일"
            )}
          </div>
          <span className="line-clamp-2 min-w-0 font-medium break-words text-gray-800" title={row.title}>
            {row.title}
          </span>
        </div>
      ),
    },
    {
      key: "hospitalStatus",
      headerClassName: `${headerBaseClass} lg:w-[82px]`,
      cellClassName: `${nowrapCellClass} lg:w-[82px]`,
      header: (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onToggleSort("hospital_status")}
          className="inline-flex items-center gap-1 px-0 text-xs"
        >
          공개여부 <span className="text-xs text-gray-400">{renderSortMark("hospital_status", sortState)}</span>
        </Button>
      ),
      render: (row) => (
        <StatusValueBadge
          label={row.hospitalStatusLabel || labelVideoHospitalStatus(row.hospitalStatus)}
          color={videoHospitalStatusColor(row.hospitalStatus)}
        />
      ),
    },
    {
      key: "reportCount",
      headerClassName: `${headerBaseClass} lg:w-[72px]`,
      cellClassName: `${nowrapCellClass} lg:w-[72px]`,
      header: "신고횟수",
      render: (row) => row.reportCount.toLocaleString(),
    },
    {
      key: "reportStatus",
      headerClassName: `${headerBaseClass} lg:w-[86px]`,
      cellClassName: `${nowrapCellClass} lg:w-[86px]`,
      header: "신고상태",
      render: (row) =>
        row.reportStatus === "NONE" ? (
          <span className="text-gray-500">-</span>
        ) : (
          <StatusValueBadge
            label={row.reportStatusLabel || reportStatusBadgeLabel(row.reportStatus)}
            color={reportStatusBadgeColor(row.reportStatus)}
          />
        ),
    },
    {
      key: "adminStatus",
      headerClassName: `${headerBaseClass} lg:w-[82px]`,
      cellClassName: `${nowrapCellClass} lg:w-[82px]`,
      header: (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onToggleSort("admin_status")}
          className="inline-flex items-center gap-1 px-0 text-xs"
        >
          강제중지 <span className="text-xs text-gray-400">{renderSortMark("admin_status", sortState)}</span>
        </Button>
      ),
      render: (row) => (
        <StatusValueBadge
          label={row.adminStatusLabel || labelVideoAdminStatus(row.adminStatus)}
          color={adminStatusColor(row.adminStatus)}
        />
      ),
    },
    {
      key: "viewCount",
      headerClassName: `${headerBaseClass} lg:w-[70px]`,
      cellClassName: `${nowrapCellClass} lg:w-[70px]`,
      header: (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onToggleSort("view_count")}
          className="inline-flex items-center gap-1 px-0 text-xs"
        >
          조회수 <span className="text-xs text-gray-400">{renderSortMark("view_count", sortState)}</span>
        </Button>
      ),
      render: (row) => row.viewCount.toLocaleString(),
    },
    {
      key: "likeCount",
      headerClassName: `${headerBaseClass} lg:w-[78px]`,
      cellClassName: `${nowrapCellClass} lg:w-[78px]`,
      header: (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onToggleSort("like_count")}
          className="inline-flex items-center gap-1 px-0 text-xs"
        >
          좋아요수 <span className="text-xs text-gray-400">{renderSortMark("like_count", sortState)}</span>
        </Button>
      ),
      render: (row) => row.likeCount.toLocaleString(),
    },
    {
      key: "manager",
      headerClassName: `${headerBaseClass} lg:w-[88px]`,
      cellClassName: `${cellBaseClass} lg:w-[88px]`,
      header: "담당자",
      render: (row) => (
        <span className="line-clamp-2 break-words text-gray-700" title={row.managerName}>
          {row.managerName}
        </span>
      ),
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
  onToggleSort: (field: SortField) => void;
  onGoPage: (page: number) => void;
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
  onToggleSort,
  onGoPage,
  onRowClick,
}: VideosDataTableProps) {
  const columns = React.useMemo(() => buildVideoColumns({ sortState, onToggleSort }), [sortState, onToggleSort]);

  return (
    <DataTable
      tableClassName="w-[1540px] min-w-[1540px] table-fixed"
      columns={columns}
      rows={rows}
      getRowKey={(row) => row.id}
      getRowClassName={(row) =>
        row.id === highlightedRowId ? "bg-emerald-50/90 transition-colors duration-500 " : undefined
      }
      loadingVariant="spinner"
      loadingLabel="동영상 목록 불러오는 중"
      loading={loading}
      refreshing={refreshing}
      error={error}
      meta={meta}

      onGoPage={onGoPage}
      onRowClick={onRowClick}
      footerCenter={
        meta ? (
          <Pagination
            currentPage={meta.current_page}
            totalPages={Math.max(1, meta.last_page)}
            onPageChange={onGoPage}
            disabled={refreshing || !onGoPage}
          />
        ) : null
      }
      emptyText="조건에 맞는 동영상이 없습니다."
    />
  );
}
