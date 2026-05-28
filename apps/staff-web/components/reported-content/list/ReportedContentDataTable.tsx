"use client";

import React from "react";
import {
  Button,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  DataTable,
  type DataTableColumn,
  type DataTableMeta,
} from "@beaulab/ui-admin";

import {
  resolveReportedReviewImageUrl,
  type ReportedContentKind,
  type ReportedContentRow,
  type ReportedContentSortField,
  type ReportedContentSortState,
} from "@/lib/reported-content/list";

type ReportedContentDataTableProps = {
  kind: ReportedContentKind;
  rows: ReportedContentRow[];
  meta: DataTableMeta | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  sortState: ReportedContentSortState;
  onToggleSort: (field: ReportedContentSortField) => void;
  onGoPage: (page: number) => void;
  onRefresh: () => void;
  onOpenDetail?: (row: ReportedContentRow) => void;
};

function renderSortMark(field: ReportedContentSortField, sortState: ReportedContentSortState) {
  if (!sortState.enabled || sortState.field !== field) {
    return <ChevronsUpDown className="size-4" />;
  }

  return sortState.direction === "desc"
    ? <ChevronDown className="size-4" />
    : <ChevronUp className="size-4" />;
}

function SortHeader({
  field,
  label,
  sortState,
  onToggleSort,
}: {
  field: ReportedContentSortField;
  label: string;
  sortState: ReportedContentSortState;
  onToggleSort: (field: ReportedContentSortField) => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => onToggleSort(field)}
      className="inline-flex min-w-0 items-center gap-1 px-0 text-xs leading-tight whitespace-normal"
    >
      <span className="min-w-0 break-keep">{label}</span>
      <span className="shrink-0 text-xs text-gray-400">{renderSortMark(field, sortState)}</span>
    </Button>
  );
}

function StatusBadge({ label, tone }: { label: string; tone: "yellow" | "orange" | "red" | "green" | "blue" | "gray" }) {
  const toneClassName = {
    yellow: "bg-yellow-100 text-yellow-800  ",
    orange: "bg-orange-100 text-orange-800  ",
    red: "bg-red-100 text-red-700  ",
    green: "bg-green-100 text-green-700  ",
    blue: "bg-blue-100 text-blue-700  ",
    gray: "bg-gray-100 text-gray-700  ",
  }[tone];

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${toneClassName}`}>
      {label}
    </span>
  );
}

function reportStatusTone(status: string): "yellow" | "orange" | "red" | "green" | "blue" | "gray" {
  if (status === "REPORTED") return "yellow";
  if (status === "AUTO_BLOCKED") return "red";
  if (status === "ADMIN_HIDDEN") return "orange";
  if (status === "NORMAL_VISIBLE") return "green";
  if (status === "REEXPOSED") return "blue";

  return "gray";
}

function renderImagePreview(row: ReportedContentRow) {
  const imageUrl = resolveReportedReviewImageUrl(row.image);

  if (!imageUrl) {
    return (
      <div className="flex h-[86px] w-[86px] items-center justify-center rounded-lg border border-dashed border-gray-300 text-xs text-gray-400  ">
        {row.imageCount > 0 ? `${row.imageCount}+` : "0"}
      </div>
    );
  }

  return (
    <div className="relative h-[86px] w-[86px] overflow-hidden rounded-lg border border-gray-200 bg-gray-50  ">
      {/* eslint-disable-next-line @next/next/no-img-element -- image URL is provided by backend storage configuration */}
      <img src={imageUrl} alt={`신고 후기 ${row.id} 이미지`} loading="lazy" className="h-full w-full object-cover" />
      {row.imageCount > 0 ? (
        <span className="absolute right-0 bottom-0 rounded-tl-md bg-black/70 px-1.5 py-0.5 text-xs font-semibold text-white">
          {row.imageCount}+
        </span>
      ) : null}
    </div>
  );
}

function buildColumns({
  kind,
  sortState,
  onToggleSort,
}: {
  kind: ReportedContentKind;
  sortState: ReportedContentSortState;
  onToggleSort: (field: ReportedContentSortField) => void;
}): DataTableColumn<ReportedContentRow>[] {
  const headerBaseClass = "px-2 py-3 text-left font-semibold text-theme-xs text-gray-600 ";
  const cellBaseClass = "px-2 py-4 text-start align-top text-sm ";
  const nowrapCellClass = `${cellBaseClass} whitespace-nowrap`;
  const warningColumn: DataTableColumn<ReportedContentRow> = {
    key: "warning",
    headerClassName: `${headerBaseClass} w-[70px]`,
    cellClassName: `${nowrapCellClass} w-[70px]`,
    header: "경고",
    render: (row) => {
      if (row.hasWarning) return <StatusBadge label="경고" tone="red" />;
      if (row.hasIgnoredWarning) return <StatusBadge label="무시" tone="gray" />;

      return "-";
    },
  };
  const commonReportColumns: DataTableColumn<ReportedContentRow>[] = [
    {
      key: "reportReason",
      headerClassName: `${headerBaseClass} w-[120px]`,
      cellClassName: `${cellBaseClass} w-[120px]`,
      header: "신고사유",
      render: (row) => (
        <span className="block line-clamp-2 break-words" title={row.reportReason}>
          {row.reportReason}
        </span>
      ),
    },
    {
      key: "reportCount",
      headerClassName: `${headerBaseClass} w-[86px]`,
      cellClassName: `${nowrapCellClass} w-[86px]`,
      header: <SortHeader field="report_count" label="신고횟수" sortState={sortState} onToggleSort={onToggleSort} />,
      render: (row) => row.reportCount.toLocaleString(),
    },
    {
      key: "firstReportedAt",
      headerClassName: `${headerBaseClass} w-[132px]`,
      cellClassName: `${nowrapCellClass} w-[132px]`,
      header: <SortHeader field="first_reported_at" label="최초신고일" sortState={sortState} onToggleSort={onToggleSort} />,
      render: (row) => row.firstReportedAt,
    },
    {
      key: "visibility",
      headerClassName: `${headerBaseClass} w-[86px]`,
      cellClassName: `${nowrapCellClass} w-[86px]`,
      header: "노출여부",
      render: (row) => <span className={row.isVisible ? "font-semibold text-gray-900 " : "font-semibold text-gray-500"}>{row.visibilityLabel}</span>,
    },
    {
      key: "reportStatus",
      headerClassName: `${headerBaseClass} w-[96px]`,
      cellClassName: `${nowrapCellClass} w-[96px]`,
      header: <SortHeader field="report_status" label="신고상태" sortState={sortState} onToggleSort={onToggleSort} />,
      render: (row) => <StatusBadge label={row.statusLabel} tone={reportStatusTone(row.status)} />,
    },
    warningColumn,
  ];

  if (kind === "chat") {
    return [
      {
        key: "chatRoomId",
        headerClassName: `${headerBaseClass} w-[92px]`,
        cellClassName: `${nowrapCellClass} w-[92px]`,
        header: "채팅방ID",
        render: (row) => row.chatRoomId ?? "-",
      },
      {
        key: "lastMessageAt",
        headerClassName: `${headerBaseClass} w-[132px]`,
        cellClassName: `${nowrapCellClass} w-[132px]`,
        header: "대화일",
        render: (row) => row.createdAt,
      },
      {
        key: "nickname",
        headerClassName: `${headerBaseClass} w-[128px]`,
        cellClassName: `${cellBaseClass} w-[128px]`,
        header: "작성자",
        render: (row) => row.nickname,
      },
      {
        key: "content",
        headerClassName: `${headerBaseClass} min-w-[280px]`,
        cellClassName: `${cellBaseClass} min-w-[280px]`,
        header: "채팅내용",
        render: (row) => (
          <span className="block line-clamp-2 break-words" title={row.content}>
            {row.content}
          </span>
        ),
      },
      {
        key: "reporterNickname",
        headerClassName: `${headerBaseClass} w-[128px]`,
        cellClassName: `${cellBaseClass} w-[128px]`,
        header: "신고자",
        render: (row) => row.reporterNickname,
      },
      {
        key: "reportReason",
        headerClassName: `${headerBaseClass} w-[130px]`,
        cellClassName: `${cellBaseClass} w-[130px]`,
        header: "신고사유",
        render: (row) => (
          <span className="block line-clamp-2 break-words" title={row.reportReason}>
            {row.reportReason}
          </span>
        ),
      },
      {
        key: "firstReportedAt",
        headerClassName: `${headerBaseClass} w-[132px]`,
        cellClassName: `${nowrapCellClass} w-[132px]`,
        header: "신고일",
        render: (row) => row.firstReportedAt,
      },
      warningColumn,
    ];
  }

  if (kind === "talk") {
    return [
      {
        key: "id",
        headerClassName: `${headerBaseClass} w-[76px]`,
        cellClassName: `${nowrapCellClass} w-[76px]`,
        header: <SortHeader field="target_id" label="토크ID" sortState={sortState} onToggleSort={onToggleSort} />,
        render: (row) => row.id,
      },
      {
        key: "createdAt",
        headerClassName: `${headerBaseClass} w-[132px]`,
        cellClassName: `${nowrapCellClass} w-[132px]`,
        header: "작성일",
        render: (row) => row.createdAt,
      },
      {
        key: "category",
        headerClassName: `${headerBaseClass} w-[120px]`,
        cellClassName: `${cellBaseClass} w-[120px]`,
        header: "토크유형",
        render: (row) => row.categoryLabel,
      },
      {
        key: "nickname",
        headerClassName: `${headerBaseClass} w-[116px]`,
        cellClassName: `${cellBaseClass} w-[116px]`,
        header: "닉네임",
        render: (row) => row.nickname,
      },
      {
        key: "title",
        headerClassName: `${headerBaseClass} min-w-[260px]`,
        cellClassName: `${cellBaseClass} min-w-[260px]`,
        header: "제목",
        render: (row) => (
          <span className="block line-clamp-2 break-words font-medium text-gray-800 " title={row.title}>
            {row.title}
          </span>
        ),
      },
      ...commonReportColumns,
    ];
  }

  if (kind === "talk-comment") {
    return [
      {
        key: "id",
        headerClassName: `${headerBaseClass} w-[80px]`,
        cellClassName: `${nowrapCellClass} w-[80px]`,
        header: <SortHeader field="target_id" label="댓글ID" sortState={sortState} onToggleSort={onToggleSort} />,
        render: (row) => row.id,
      },
      {
        key: "createdAt",
        headerClassName: `${headerBaseClass} w-[132px]`,
        cellClassName: `${nowrapCellClass} w-[132px]`,
        header: "댓글 작성일",
        render: (row) => row.createdAt,
      },
      {
        key: "category",
        headerClassName: `${headerBaseClass} w-[120px]`,
        cellClassName: `${cellBaseClass} w-[120px]`,
        header: "토크유형",
        render: (row) => row.categoryLabel,
      },
      {
        key: "nickname",
        headerClassName: `${headerBaseClass} w-[116px]`,
        cellClassName: `${cellBaseClass} w-[116px]`,
        header: "댓글 닉네임",
        render: (row) => row.nickname,
      },
      {
        key: "content",
        headerClassName: `${headerBaseClass} min-w-[220px]`,
        cellClassName: `${cellBaseClass} min-w-[220px]`,
        header: "댓글 내용",
        render: (row) => (
          <span className="block line-clamp-2 break-words" title={row.content}>
            {row.content}
          </span>
        ),
      },
      {
        key: "parentTitle",
        headerClassName: `${headerBaseClass} min-w-[180px]`,
        cellClassName: `${cellBaseClass} min-w-[180px]`,
        header: "토크 제목",
        render: (row) => (
          <span className="block line-clamp-2 break-words font-medium text-gray-800 " title={row.parentTitle}>
            {row.parentTitle}
          </span>
        ),
      },
      ...commonReportColumns,
    ];
  }

  if (kind === "evaluation") {
    return [
      {
        key: "id",
        headerClassName: `${headerBaseClass} w-[76px]`,
        cellClassName: `${nowrapCellClass} w-[76px]`,
        header: <SortHeader field="target_id" label="평가ID" sortState={sortState} onToggleSort={onToggleSort} />,
        render: (row) => row.id,
      },
      {
        key: "createdAt",
        headerClassName: `${headerBaseClass} w-[132px]`,
        cellClassName: `${nowrapCellClass} w-[132px]`,
        header: "작성일",
        render: (row) => row.createdAt,
      },
      {
        key: "category",
        headerClassName: `${headerBaseClass} w-[112px]`,
        cellClassName: `${cellBaseClass} w-[112px]`,
        header: "후기유형",
        render: (row) => row.categoryLabel,
      },
      {
        key: "hospital",
        headerClassName: `${headerBaseClass} min-w-[150px]`,
        cellClassName: `${cellBaseClass} min-w-[150px]`,
        header: "병의원명",
        render: (row) => row.hospitalName,
      },
      {
        key: "nickname",
        headerClassName: `${headerBaseClass} w-[116px]`,
        cellClassName: `${cellBaseClass} w-[116px]`,
        header: "닉네임",
        render: (row) => row.nickname,
      },
      {
        key: "phone",
        headerClassName: `${headerBaseClass} w-[132px]`,
        cellClassName: `${nowrapCellClass} w-[132px]`,
        header: "전화번호",
        render: (row) => row.phone,
      },
      ...commonReportColumns,
    ];
  }

  if (kind === "review-comment") {
    return [
      {
        key: "id",
        headerClassName: `${headerBaseClass} w-[80px]`,
        cellClassName: `${nowrapCellClass} w-[80px]`,
        header: <SortHeader field="target_id" label="댓글ID" sortState={sortState} onToggleSort={onToggleSort} />,
        render: (row) => row.id,
      },
      {
        key: "createdAt",
        headerClassName: `${headerBaseClass} w-[132px]`,
        cellClassName: `${nowrapCellClass} w-[132px]`,
        header: "댓글 작성일",
        render: (row) => row.createdAt,
      },
      {
        key: "category",
        headerClassName: `${headerBaseClass} min-w-[150px]`,
        cellClassName: `${cellBaseClass} min-w-[150px]`,
        header: "카테고리",
        render: (row) => (
          <div className="flex flex-wrap gap-1.5">
            {row.categoryLabel.split("\n").filter(Boolean).map((category) => (
              <span
                key={category}
                className="inline-flex max-w-full items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 ring-1 ring-gray-200   "
              >
                <span className="line-clamp-1 break-all">{category}</span>
              </span>
            ))}
          </div>
        ),
      },
      {
        key: "nickname",
        headerClassName: `${headerBaseClass} w-[116px]`,
        cellClassName: `${cellBaseClass} w-[116px]`,
        header: "댓글작성자",
        render: (row) => row.nickname,
      },
      {
        key: "content",
        headerClassName: `${headerBaseClass} min-w-[220px]`,
        cellClassName: `${cellBaseClass} min-w-[220px]`,
        header: "댓글내용",
        render: (row) => (
          <span className="block line-clamp-2 break-words" title={row.content}>
            {row.content}
          </span>
        ),
      },
      {
        key: "image",
        headerClassName: `${headerBaseClass} w-[98px]`,
        cellClassName: `${cellBaseClass} w-[98px]`,
        header: "게시글 이미지",
        render: renderImagePreview,
      },
      ...commonReportColumns,
    ];
  }

  return [
    {
      key: "id",
      headerClassName: `${headerBaseClass} w-[76px]`,
      cellClassName: `${nowrapCellClass} w-[76px]`,
      header: <SortHeader field="target_id" label="후기ID" sortState={sortState} onToggleSort={onToggleSort} />,
      render: (row) => row.id,
    },
    {
      key: "createdAt",
      headerClassName: `${headerBaseClass} w-[132px]`,
      cellClassName: `${nowrapCellClass} w-[132px]`,
      header: "작성일",
      render: (row) => row.createdAt,
    },
    {
      key: "category",
      headerClassName: `${headerBaseClass} min-w-[150px]`,
      cellClassName: `${cellBaseClass} min-w-[150px]`,
      header: "카테고리",
      render: (row) => (
        <div className="flex flex-wrap gap-1.5">
          {row.categoryLabel.split("\n").filter(Boolean).map((category) => (
            <span
              key={category}
              className="inline-flex max-w-full items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 ring-1 ring-gray-200   "
            >
              <span className="line-clamp-1 break-all">{category}</span>
            </span>
          ))}
        </div>
      ),
    },
    {
      key: "image",
      headerClassName: `${headerBaseClass} w-[98px]`,
      cellClassName: `${cellBaseClass} w-[98px]`,
      header: "이미지",
      render: renderImagePreview,
    },
    {
      key: "nickname",
      headerClassName: `${headerBaseClass} w-[116px]`,
      cellClassName: `${cellBaseClass} w-[116px]`,
      header: "닉네임",
      render: (row) => row.nickname,
    },
    {
      key: "hospital",
      headerClassName: `${headerBaseClass} min-w-[150px]`,
      cellClassName: `${cellBaseClass} min-w-[150px]`,
      header: "병의원명",
      render: (row) => row.hospitalName,
    },
    ...commonReportColumns,
  ];
}

export function ReportedContentDataTable({
  kind,
  rows,
  meta,
  loading,
  refreshing,
  error,
  sortState,
  onToggleSort,
  onGoPage,
  onRefresh,
  onOpenDetail,
}: ReportedContentDataTableProps) {
  const columns = React.useMemo(
    () => buildColumns({ kind, sortState, onToggleSort }),
    [kind, onToggleSort, sortState],
  );

  return (
    <DataTable
      tableClassName="min-w-full table-fixed"
      columns={columns}
      rows={rows}
      getRowKey={(row) => row.id}
      loading={loading}
      refreshing={refreshing}
      error={error}
      emptyText="신고된 게시물이 없습니다."
      meta={meta}
      onGoPage={onGoPage}
      onRefresh={onRefresh}
      refreshPlacement="left"
      onRowClick={onOpenDetail}
    />
  );
}
