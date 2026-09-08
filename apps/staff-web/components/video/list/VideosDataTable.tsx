import React from "react";
import Link from "next/link";
import {
  CategoryBadgeList,
  DataTable,
  DataTableSortHeader,
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
        <DataTableSortHeader
          label="VID"
          active={sortState.enabled && sortState.field === "id"}
          direction={sortState.direction}
          onClick={() => onToggleSort("id")}
        />
      ),
      render: (row) => row.id,
    },
    {
      key: "uploadedAt",
      headerClassName: `${headerBaseClass} lg:w-[126px]`,
      cellClassName: `${nowrapCellClass} lg:w-[126px]`,
      header: (
        <DataTableSortHeader
          label="업로드일"
          active={sortState.enabled && sortState.field === "created_at"}
          direction={sortState.direction}
          onClick={() => onToggleSort("created_at")}
        />
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
        <DataTableSortHeader
          label="제목"
          active={sortState.enabled && sortState.field === "title"}
          direction={sortState.direction}
          onClick={() => onToggleSort("title")}
        />
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
        <DataTableSortHeader
          label="공개여부"
          active={sortState.enabled && sortState.field === "hospital_status"}
          direction={sortState.direction}
          onClick={() => onToggleSort("hospital_status")}
        />
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
        <DataTableSortHeader
          label="강제중지"
          active={sortState.enabled && sortState.field === "admin_status"}
          direction={sortState.direction}
          onClick={() => onToggleSort("admin_status")}
        />
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
        <DataTableSortHeader
          label="조회수"
          active={sortState.enabled && sortState.field === "view_count"}
          direction={sortState.direction}
          onClick={() => onToggleSort("view_count")}
        />
      ),
      render: (row) => row.viewCount.toLocaleString(),
    },
    {
      key: "likeCount",
      headerClassName: `${headerBaseClass} lg:w-[78px]`,
      cellClassName: `${nowrapCellClass} lg:w-[78px]`,
      header: (
        <DataTableSortHeader
          label="좋아요수"
          active={sortState.enabled && sortState.field === "like_count"}
          direction={sortState.direction}
          onClick={() => onToggleSort("like_count")}
        />
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
      emptyText="조건에 맞는 동영상이 없습니다."
    />
  );
}
