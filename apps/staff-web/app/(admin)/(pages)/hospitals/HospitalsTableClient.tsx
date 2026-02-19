"use client";

import { DataTable, type DataTableColumn, type DataTableMeta } from "@beaulab/ui-admin";
import { isApiSuccess } from "@beaulab/types";
import React from "react";

import { api } from "@/lib/api";

type HospitalApiItem = {
  id: number;
  name: string;
  address: string;
  tel: string;
  view_count?: number;
  viewCount?: number;
  allow_status?: string;
  allowStatus?: string;
  status: string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
};

type HospitalRow = {
  id: number;
  name: string;
  address: string;
  tel: string;
  viewCount: number;
  allowStatus: string;
  status: string;
  createdAt: string;
};

type HospitalsQuery = {
  q?: string;
  status?: string;
  allow_status?: string;
  sort: "id" | "name" | "created_at" | "view_count";
  direction: "asc" | "desc";
  per_page: number;
  page: number;
};

const columns: DataTableColumn<HospitalRow>[] = [
  {
    key: "name",
    header: "병원명",
    render: (row) => <span className="font-medium text-gray-800 dark:text-white/90">{row.name}</span>,
  },
  { key: "tel", header: "연락처", render: (row) => row.tel },
  {
    key: "address",
    header: "주소",
    render: (row) => <span className="whitespace-pre-line">{row.address}</span>,
  },
  { key: "viewCount", header: "조회수", render: (row) => row.viewCount.toLocaleString() },
  {
    key: "allowStatus",
    header: "승인상태",
    render: (row) => {
      const approved = row.allowStatus === "APPROVED";
      return (
        <span
          className={[
            "inline-flex rounded-full px-2 py-1 text-xs font-medium",
            approved
              ? "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400"
              : "bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400",
          ].join(" ")}
        >
          {row.allowStatus}
        </span>
      );
    },
  },
  {
    key: "status",
    header: "노출상태",
    render: (row) => {
      const active = row.status === "ACTIVE";
      return (
        <span
          className={[
            "inline-flex rounded-full px-2 py-1 text-xs font-medium",
            active
              ? "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400"
              : "bg-gray-100 text-gray-700 dark:bg-gray-700/40 dark:text-gray-300",
          ].join(" ")}
        >
          {row.status}
        </span>
      );
    },
  },
  {
    key: "createdAt",
    header: "등록일",
    render: (row) => row.createdAt,
  },
];

function normalizeHospital(item: HospitalApiItem): HospitalRow {
  const createdRaw = item.createdAt ?? item.created_at ?? "";
  const createdDate = createdRaw ? new Date(createdRaw) : null;

  return {
    id: item.id,
    name: item.name,
    address: item.address,
    tel: item.tel,
    viewCount: item.viewCount ?? item.view_count ?? 0,
    allowStatus: item.allowStatus ?? item.allow_status ?? "UNKNOWN",
    status: item.status,
    createdAt: createdDate && !Number.isNaN(createdDate.getTime()) ? createdDate.toLocaleString("ko-KR") : "-",
  };
}

export default function HospitalsTableClient() {
  const [qInput, setQInput] = React.useState("");
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [allowStatus, setAllowStatus] = React.useState("");
  const [sort, setSort] = React.useState<HospitalsQuery["sort"]>("id");
  const [direction, setDirection] = React.useState<HospitalsQuery["direction"]>("desc");
  const [perPage, setPerPage] = React.useState(15);
  const [page, setPage] = React.useState(1);

  const [rows, setRows] = React.useState<HospitalRow[]>([]);
  const [meta, setMeta] = React.useState<DataTableMeta | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const fetchHospitals = React.useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const query: HospitalsQuery = {
        sort,
        direction,
        per_page: perPage,
        page,
      };

      if (q.trim()) query.q = q.trim();
      if (status) query.status = status;
      if (allowStatus) query.allow_status = allowStatus;

      try {
        const response = await api.get<HospitalApiItem[]>("/hospitals", query);
        if (!isApiSuccess(response)) {
          setError(response.error.message || "병원 목록 조회에 실패했습니다.");
          return;
        }

        setRows(response.data.map(normalizeHospital));
        setMeta((response.meta as DataTableMeta | null) ?? null);
      } catch {
        setError("병원 목록 조회 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [allowStatus, direction, page, perPage, q, sort, status],
  );

  React.useEffect(() => {
    fetchHospitals(false);
  }, [fetchHospitals]);

  const onSubmitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setQ(qInput);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmitSearch} className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-white p-4 md:grid-cols-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
        <input
          value={qInput}
          onChange={(event) => setQInput(event.target.value)}
          placeholder="병원명 검색"
          className="h-10 rounded-lg border border-gray-200 bg-transparent px-3 text-sm outline-none focus:border-brand-500 dark:border-white/[0.1]"
        />

        <select
          value={status}
          onChange={(event) => {
            setPage(1);
            setStatus(event.target.value);
          }}
          className="h-10 rounded-lg border border-gray-200 bg-transparent px-3 text-sm outline-none dark:border-white/[0.1]"
        >
          <option value="">전체 노출상태</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="SUSPENDED">SUSPENDED</option>
        </select>

        <select
          value={allowStatus}
          onChange={(event) => {
            setPage(1);
            setAllowStatus(event.target.value);
          }}
          className="h-10 rounded-lg border border-gray-200 bg-transparent px-3 text-sm outline-none dark:border-white/[0.1]"
        >
          <option value="">전체 승인상태</option>
          <option value="APPROVED">APPROVED</option>
          <option value="PENDING">PENDING</option>
          <option value="REJECTED">REJECTED</option>
        </select>

        <select
          value={sort}
          onChange={(event) => {
            setPage(1);
            setSort(event.target.value as HospitalsQuery["sort"]);
          }}
          className="h-10 rounded-lg border border-gray-200 bg-transparent px-3 text-sm outline-none dark:border-white/[0.1]"
        >
          <option value="id">정렬: ID</option>
          <option value="name">정렬: 이름</option>
          <option value="created_at">정렬: 등록일</option>
          <option value="view_count">정렬: 조회수</option>
        </select>

        <select
          value={direction}
          onChange={(event) => {
            setPage(1);
            setDirection(event.target.value as HospitalsQuery["direction"]);
          }}
          className="h-10 rounded-lg border border-gray-200 bg-transparent px-3 text-sm outline-none dark:border-white/[0.1]"
        >
          <option value="desc">내림차순</option>
          <option value="asc">오름차순</option>
        </select>

        <button
          type="submit"
          className="h-10 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white hover:bg-brand-600"
        >
          검색
        </button>
      </form>

      <DataTable
        title="병원 목록"
        description="서버 데이터 기반으로 병원 리스트를 조회합니다."
        columns={columns}
        rows={rows}
        getRowKey={(row) => row.id}
        loading={loading}
        refreshing={refreshing}
        error={error}
        meta={meta}
        onRefresh={() => fetchHospitals(true)}
        onGoPage={(nextPage) => setPage(nextPage)}
        rightActions={
          <select
            value={perPage}
            onChange={(event) => {
              setPage(1);
              setPerPage(Number(event.target.value));
            }}
            className="h-9 rounded-lg border border-gray-200 bg-transparent px-2 text-xs outline-none dark:border-white/[0.1]"
          >
            <option value={15}>15개</option>
            <option value={30}>30개</option>
            <option value={50}>50개</option>
          </select>
        }
        emptyText="조건에 맞는 병원이 없습니다."
      />
    </div>
  );
}
