import React from "react";
import {
  Button,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  DataTable,
  Pagination,
  StatusBadge,
  type DataTableColumn,
  type DataTableMeta,
} from "@beaulab/ui-admin";

import {
  formatAccountUserStatusColor,
  type AccountUserRow,
  type AccountUserSortField,
  type AccountUserSortState,
} from "@/lib/account-user/list";

type AccountUsersDataTableProps = {
  rows: AccountUserRow[];
  meta: DataTableMeta | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  sortState: AccountUserSortState;
  onToggleSort: (field: AccountUserSortField) => void;
  onRefresh: () => void;
  onGoPage: (page: number) => void;
};

function renderSortMark(field: AccountUserSortField, sortState: AccountUserSortState) {
  if (!sortState.enabled || sortState.field !== field) return <ChevronsUpDown className="size-4" />;

  return sortState.direction === "desc" ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />;
}

function SortHeader({
  label,
  field,
  sortState,
  onToggleSort,
}: {
  label: string;
  field: AccountUserSortField;
  sortState: AccountUserSortState;
  onToggleSort: (field: AccountUserSortField) => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => onToggleSort(field)}
      className="inline-flex items-center gap-1 px-0 text-xs"
    >
      {label} <span className="text-xs text-gray-400">{renderSortMark(field, sortState)}</span>
    </Button>
  );
}

function buildColumns({
  sortState,
  onToggleSort,
}: {
  sortState: AccountUserSortState;
  onToggleSort: (field: AccountUserSortField) => void;
}): DataTableColumn<AccountUserRow>[] {
  const headerBaseClass = "px-3 py-3 text-left font-semibold text-theme-xs text-gray-600 ";
  const cellBaseClass = "px-3 py-4 text-start align-top ";
  const nowrapCellClass = `${cellBaseClass} whitespace-nowrap`;

  return [
    {
      key: "id",
      headerClassName: `${headerBaseClass} w-[72px]`,
      cellClassName: `${nowrapCellClass} w-[72px]`,
      header: <SortHeader label="UID" field="id" sortState={sortState} onToggleSort={onToggleSort} />,
      render: (row) => row.id,
    },
    {
      key: "signupChannel",
      headerClassName: `${headerBaseClass} w-[110px]`,
      cellClassName: `${nowrapCellClass} w-[110px]`,
      header: <SortHeader label="가입경로" field="signup_channel" sortState={sortState} onToggleSort={onToggleSort} />,
      render: (row) => row.signupChannelLabel,
    },
    {
      key: "email",
      headerClassName: `${headerBaseClass} w-[210px]`,
      cellClassName: `${cellBaseClass} w-[210px]`,
      header: <SortHeader label="이메일" field="email" sortState={sortState} onToggleSort={onToggleSort} />,
      render: (row) => (
        <span className="block break-words font-medium text-gray-800 " title={row.email}>
          {row.email}
        </span>
      ),
    },
    {
      key: "nickname",
      headerClassName: `${headerBaseClass} w-[150px]`,
      cellClassName: `${cellBaseClass} w-[150px]`,
      header: <SortHeader label="닉네임" field="nickname" sortState={sortState} onToggleSort={onToggleSort} />,
      render: (row) => (
        <span className="block break-words text-gray-800 " title={row.nickname}>
          {row.nickname}
        </span>
      ),
    },
    {
      key: "name",
      headerClassName: `${headerBaseClass} w-[110px]`,
      cellClassName: `${cellBaseClass} w-[110px]`,
      header: <SortHeader label="이름" field="name" sortState={sortState} onToggleSort={onToggleSort} />,
      render: (row) => row.name,
    },
    {
      key: "phone",
      headerClassName: `${headerBaseClass} w-[130px]`,
      cellClassName: `${nowrapCellClass} w-[130px]`,
      header: "전화번호",
      render: (row) => row.phone,
    },
    {
      key: "status",
      headerClassName: `${headerBaseClass} w-[94px]`,
      cellClassName: `${nowrapCellClass} w-[94px]`,
      header: <SortHeader label="회원상태" field="status" sortState={sortState} onToggleSort={onToggleSort} />,
      render: (row) => (
        <StatusBadge size="sm" color={formatAccountUserStatusColor(row.status)}>
          {row.statusLabel}
        </StatusBadge>
      ),
    },
    {
      key: "createdAt",
      headerClassName: `${headerBaseClass} w-[138px]`,
      cellClassName: `${nowrapCellClass} w-[138px]`,
      header: <SortHeader label="가입일" field="created_at" sortState={sortState} onToggleSort={onToggleSort} />,
      render: (row) => row.createdAt,
    },
    {
      key: "lastAccessedAt",
      headerClassName: `${headerBaseClass} w-[138px]`,
      cellClassName: `${nowrapCellClass} w-[138px]`,
      header: <SortHeader label="최근 접속일" field="last_accessed_at" sortState={sortState} onToggleSort={onToggleSort} />,
      render: (row) => row.lastAccessedAt,
    },
    {
      key: "lastAccessIp",
      headerClassName: `${headerBaseClass} w-[128px]`,
      cellClassName: `${nowrapCellClass} w-[128px]`,
      header: "접속IP",
      render: (row) => row.lastAccessIp,
    },
    {
      key: "warningCount",
      headerClassName: `${headerBaseClass} w-[92px]`,
      cellClassName: `${nowrapCellClass} w-[92px]`,
      header: <SortHeader label="경고횟수" field="warning_count" sortState={sortState} onToggleSort={onToggleSort} />,
      render: (row) => row.warningCount.toLocaleString(),
    },
  ];
}

export function AccountUsersDataTable({
  rows,
  meta,
  loading,
  refreshing,
  error,
  sortState,
  onToggleSort,
  onRefresh,
  onGoPage,
}: AccountUsersDataTableProps) {
  const columns = React.useMemo(
    () => buildColumns({ sortState, onToggleSort }),
    [sortState, onToggleSort],
  );

  return (
    <DataTable
      title="일반회원 목록"
      tableClassName="min-w-[1370px] w-full xl:table-fixed"
      columns={columns}
      rows={rows}
      getRowKey={(row) => row.id}
      loadingVariant="spinner"
      loadingLabel="일반회원 목록 불러오는 중"
      loading={loading}
      refreshing={refreshing}
      error={error}
      meta={meta}
      onRefresh={onRefresh}
      onGoPage={onGoPage}
      footerCenter={
        meta ? (
          <Pagination
            currentPage={meta.current_page}
            totalPages={Math.max(1, meta.last_page)}
            onPageChange={onGoPage}
            disabled={refreshing}
          />
        ) : null
      }
    />
  );
}
