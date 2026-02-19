"use client";

import { Can } from "@/components/guard";
import { api } from "@/lib/api";
import { isApiSuccess } from "@beaulab/types";
import {
  Button,
  DataTable,
  InputField,
  Select,
  type DataTableColumn,
  type DataTableMeta,
} from "@beaulab/ui-admin";
import Link from "next/link";
import React from "react";

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

type Filters = {
  status: string;
  allowStatus: string;
  startDate: string;
  endDate: string;
};

type SortField = "id" | "name" | "created_at" | "view_count";
type SortDirection = "asc" | "desc";

type HospitalsQuery = {
  q?: string;
  status?: string;
  allow_status?: string;
  sort: SortField;
  direction: SortDirection;
  per_page: number;
  page: number;
};

const DEFAULT_FILTERS: Filters = {
  status: "",
  allowStatus: "",
  startDate: "",
  endDate: "",
};

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "ACTIVE" },
  { value: "SUSPENDED", label: "SUSPENDED" },
];

const ALLOW_STATUS_OPTIONS = [
  { value: "APPROVED", label: "APPROVED" },
  { value: "PENDING", label: "PENDING" },
  { value: "REJECTED", label: "REJECTED" },
];

const PER_PAGE_OPTIONS = [
  { value: "15", label: "15개" },
  { value: "30", label: "30개" },
  { value: "50", label: "50개" },
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
    createdAt:
      createdDate && !Number.isNaN(createdDate.getTime())
        ? createdDate.toLocaleString("ko-KR")
        : "-",
  };
}

export default function HospitalsTableClient() {
  const [searchInput, setSearchInput] = React.useState("");
  const [searchKeyword, setSearchKeyword] = React.useState("");

  const [isFilterOpen, setIsFilterOpen] = React.useState(true);
  const [draftFilters, setDraftFilters] = React.useState<Filters>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = React.useState<Filters>(DEFAULT_FILTERS);
  const [filterFormKey, setFilterFormKey] = React.useState(0);

  const [sort, setSort] = React.useState<SortField>("id");
  const [direction, setDirection] = React.useState<SortDirection>("desc");
  const [perPage, setPerPage] = React.useState(15);
  const [page, setPage] = React.useState(1);

  const [rows, setRows] = React.useState<HospitalRow[]>([]);
  const [meta, setMeta] = React.useState<DataTableMeta | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const hasFetchedRef = React.useRef(false);

  const fetchHospitals = React.useCallback(
    async (manualRefresh = false) => {
      if (!hasFetchedRef.current) setLoading(true);
      else setRefreshing(true);
      if (manualRefresh) setRefreshing(true);

      setError(null);

      const query: HospitalsQuery = {
        sort,
        direction,
        per_page: perPage,
        page,
      };

      if (searchKeyword.trim()) query.q = searchKeyword.trim();
      if (appliedFilters.status) query.status = appliedFilters.status;
      if (appliedFilters.allowStatus) query.allow_status = appliedFilters.allowStatus;

      try {
        const response = await api.get<HospitalApiItem[]>("/hospitals", query);
        if (!isApiSuccess(response)) {
          setError(response.error.message || "병원 목록 조회에 실패했습니다.");
          return;
        }

        setRows(response.data.map(normalizeHospital));
        setMeta((response.meta as DataTableMeta | null) ?? null);
        hasFetchedRef.current = true;
      } catch {
        setError("병원 목록 조회 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [appliedFilters, direction, page, perPage, searchKeyword, sort],
  );

  React.useEffect(() => {
    fetchHospitals(false);
  }, [fetchHospitals]);

  const applySearch = (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    setPage(1);
    setSearchKeyword(searchInput);
    setAppliedFilters(draftFilters);
  };

  const resetFilters = (applyNow = true) => {
    setDraftFilters(DEFAULT_FILTERS);
    setFilterFormKey((prev) => prev + 1);
    if (applyNow) {
      setPage(1);
      setAppliedFilters(DEFAULT_FILTERS);
    }
  };

  const toggleFilters = () => {
    if (isFilterOpen) {
      resetFilters(true);
      setIsFilterOpen(false);
      return;
    }

    setIsFilterOpen(true);
  };

  const toggleSort = (field: SortField) => {
    setPage(1);

    if (sort !== field) {
      setSort(field);
      setDirection("desc");
      return;
    }

    setDirection((prev) => (prev === "desc" ? "asc" : "desc"));
  };

  const renderSortIcon = (field: SortField) => {
    if (sort !== field) return "↕";
    return direction === "asc" ? "↑" : "↓";
  };

  const columns: DataTableColumn<HospitalRow>[] = [
    {
      key: "id",
      header: (
        <button type="button" onClick={() => toggleSort("id")} className="inline-flex items-center gap-1">
          ID <span className="text-xs text-gray-400">{renderSortIcon("id")}</span>
        </button>
      ),
      render: (row) => row.id,
    },
    {
      key: "name",
      header: (
        <button type="button" onClick={() => toggleSort("name")} className="inline-flex items-center gap-1">
          병원명 <span className="text-xs text-gray-400">{renderSortIcon("name")}</span>
        </button>
      ),
      render: (row) => <span className="font-medium text-gray-800 dark:text-white/90">{row.name}</span>,
    },
    { key: "tel", header: "연락처", render: (row) => row.tel },
    {
      key: "address",
      header: "주소",
      render: (row) => <span className="whitespace-pre-line">{row.address}</span>,
    },
    {
      key: "viewCount",
      header: (
        <button
          type="button"
          onClick={() => toggleSort("view_count")}
          className="inline-flex items-center gap-1"
        >
          조회수 <span className="text-xs text-gray-400">{renderSortIcon("view_count")}</span>
        </button>
      ),
      render: (row) => row.viewCount.toLocaleString(),
    },
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
      header: (
        <button
          type="button"
          onClick={() => toggleSort("created_at")}
          className="inline-flex items-center gap-1"
        >
          등록일 <span className="text-xs text-gray-400">{renderSortIcon("created_at")}</span>
        </button>
      ),
      render: (row) => row.createdAt,
    },
  ];

  return (
    <div className="space-y-4">
      <form
        onSubmit={applySearch}
        className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-white/[0.05] dark:bg-white/[0.03]"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full">
            <InputField
              key={`search-${filterFormKey}`}
              defaultValue={searchInput}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => setSearchInput(event.target.value)}
              placeholder="종합검색"
              className="pr-10"
            />
            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-gray-400">⌕</span>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={toggleFilters}
              className="h-11 border border-brand-200 px-4 text-brand-500"
            >
              ⛭ Filter
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-11 border border-brand-200 px-4 text-brand-500"
            >
              ⇩ Export
            </Button>

            <Can permission="beaulab.hostpital.create">
              <Link href="/hospitals/create">
                <Button type="button" size="sm" className="h-11 px-4">
                  + 병원 등록
                </Button>
              </Link>
            </Can>
          </div>
        </div>

        <div
          className={[
            "grid transition-all duration-300",
            isFilterOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
          ].join(" ")}
        >
          <div className="overflow-hidden">
            <div className="grid grid-cols-1 gap-3 pt-1 md:grid-cols-6">
              <div>
                <p className="mb-1 text-xs font-medium text-gray-500">노출상태</p>
                <Select
                  key={`status-${filterFormKey}`}
                  placeholder="전체"
                  options={STATUS_OPTIONS}
                  defaultValue={draftFilters.status}
                  onChange={(value: string) => setDraftFilters((prev) => ({ ...prev, status: value }))}
                />
              </div>

              <div>
                <p className="mb-1 text-xs font-medium text-gray-500">승인상태</p>
                <Select
                  key={`allow-${filterFormKey}`}
                  placeholder="전체"
                  options={ALLOW_STATUS_OPTIONS}
                  defaultValue={draftFilters.allowStatus}
                  onChange={(value: string) => setDraftFilters((prev) => ({ ...prev, allowStatus: value }))}
                />
              </div>

              <div>
                <p className="mb-1 text-xs font-medium text-gray-500">시작일</p>
                <InputField
                  key={`start-${filterFormKey}`}
                  type="date"
                  defaultValue={draftFilters.startDate}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    setDraftFilters((prev) => ({ ...prev, startDate: event.target.value }))
                  }
                />
              </div>

              <div>
                <p className="mb-1 text-xs font-medium text-gray-500">종료일</p>
                <InputField
                  key={`end-${filterFormKey}`}
                  type="date"
                  defaultValue={draftFilters.endDate}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    setDraftFilters((prev) => ({ ...prev, endDate: event.target.value }))
                  }
                />
              </div>

              <div className="flex items-end">
                <Button type="submit" size="sm" className="h-11 w-full px-4">
                  검색
                </Button>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => resetFilters(true)}
                  className="h-11 w-full rounded-lg border border-gray-200 px-4 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-white/[0.05] dark:text-gray-300 dark:hover:bg-white/[0.06]"
                >
                  필터 초기화
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>

      <DataTable
        title="병원 목록"
        description="Enter 또는 검색 버튼으로 조건을 적용합니다."
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
          <Select
            key={`per-page-${perPage}`}
            options={PER_PAGE_OPTIONS}
            defaultValue={String(perPage)}
            onChange={(value: string) => {
              setPage(1);
              setPerPage(Number(value));
            }}
            className="h-9 w-[88px] py-0 text-xs"
          />
        }
        emptyText="조건에 맞는 병원이 없습니다."
      />
    </div>
  );
}
