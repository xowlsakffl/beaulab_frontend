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
  reviewStatus: string;
  approvalStatus: string;
  createdAt: string;
};

type SortField = "id" | "name" | "created_at" | "view_count";
type SortDirection = "asc" | "desc";

type SortState = {
  field: SortField;
  direction: SortDirection;
  enabled: boolean;
};

type Filters = {
  approvalStatus: string;
  reviewStatuses: string[];
  dateRange: string;
};

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
  approvalStatus: "",
  reviewStatuses: [],
  dateRange: "",
};

const DEFAULT_SORT: SortState = { field: "id", direction: "desc", enabled: true };

const APPROVAL_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "정상" },
  { value: "SUSPENDED", label: "정지" },
  { value: "WITHDRAWN", label: "탈퇴" },
];

const PER_PAGE_OPTIONS = [
  { value: "15", label: "15개" },
  { value: "30", label: "30개" },
  { value: "50", label: "50개" },
];

const REVIEW_STATUS_OPTIONS = [
  { value: "PENDING", label: "검수신청" },
  { value: "APPROVED", label: "검수완료" },
  { value: "REJECTED", label: "검수반려" },
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
    reviewStatus: item.allowStatus ?? item.allow_status ?? "UNKNOWN",
    approvalStatus: item.status,
    createdAt:
      createdDate && !Number.isNaN(createdDate.getTime())
        ? createdDate.toLocaleString("ko-KR")
        : "-",
  };
}

function labelApprovalStatus(status: string) {
  if (status === "ACTIVE") return "정상";
  if (status === "SUSPENDED") return "정지";
  if (status === "WITHDRAWN") return "탈퇴";
  return status;
}

function labelReviewStatus(status: string) {
  if (status === "PENDING") return "검수신청";
  if (status === "APPROVED") return "검수완료";
  if (status === "REJECTED") return "검수반려";
  return status;
}

function nextSortState(prev: SortState, field: SortField): SortState {
  if (prev.field !== field) return { field, direction: "desc", enabled: true };
  if (prev.enabled && prev.direction === "desc") return { field, direction: "asc", enabled: true };
  if (prev.enabled && prev.direction === "asc") return { field: "id", direction: "desc", enabled: false };
  return { field, direction: "desc", enabled: true };
}

export default function HospitalsTableClient() {
  const [searchInput, setSearchInput] = React.useState("");
  const [searchKeyword, setSearchKeyword] = React.useState("");

  const [isFilterOpen, setIsFilterOpen] = React.useState(true);
  const [draftFilters, setDraftFilters] = React.useState<Filters>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = React.useState<Filters>(DEFAULT_FILTERS);
  const [resetKey, setResetKey] = React.useState(0);

  const [sortState, setSortState] = React.useState<SortState>(DEFAULT_SORT);
  const [perPage, setPerPage] = React.useState(15);
  const [page, setPage] = React.useState(1);

  const [rows, setRows] = React.useState<HospitalRow[]>([]);
  const [meta, setMeta] = React.useState<DataTableMeta | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const requestKeyRef = React.useRef("");
  const hasFetchedRef = React.useRef(false);

  const query = React.useMemo(() => {
    const q: HospitalsQuery = {
      sort: sortState.enabled ? sortState.field : DEFAULT_SORT.field,
      direction: sortState.enabled ? sortState.direction : DEFAULT_SORT.direction,
      per_page: perPage,
      page,
    };

    if (searchKeyword.trim()) q.q = searchKeyword.trim();
    if (appliedFilters.approvalStatus) q.status = appliedFilters.approvalStatus;
    if (appliedFilters.reviewStatuses.length > 0) q.allow_status = appliedFilters.reviewStatuses.join(",");

    return q;
  }, [appliedFilters.approvalStatus, appliedFilters.reviewStatuses, page, perPage, searchKeyword, sortState]);

  const fetchHospitals = React.useCallback(
    async (manualRefresh = false) => {
      const requestKey = JSON.stringify(query);
      if (!manualRefresh && requestKeyRef.current === requestKey) return;
      requestKeyRef.current = requestKey;

      if (!hasFetchedRef.current) setLoading(true);
      else setRefreshing(true);
      if (manualRefresh) setRefreshing(true);

      setError(null);

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
    [query],
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
    setResetKey((prev) => prev + 1);
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

  const toggleReviewStatus = (value: string) => {
    setDraftFilters((prev) => {
      const exists = prev.reviewStatuses.includes(value);
      return {
        ...prev,
        reviewStatuses: exists
          ? prev.reviewStatuses.filter((item) => item !== value)
          : [...prev.reviewStatuses, value],
      };
    });
  };

  const toggleSort = (field: SortField) => {
    setPage(1);
    setSortState((prev) => nextSortState(prev, field));
  };

  const sortMark = (field: SortField) => {
    if (!sortState.enabled || sortState.field !== field) return "↕";
    return sortState.direction === "desc" ? "↓" : "↑";
  };

  const columns: DataTableColumn<HospitalRow>[] = [
    {
      key: "id",
      header: (
        <button type="button" onClick={() => toggleSort("id")} className="inline-flex items-center gap-1">
          ID <span className="text-xs text-gray-400">{sortMark("id")}</span>
        </button>
      ),
      render: (row) => row.id,
    },
    {
      key: "name",
      header: (
        <button type="button" onClick={() => toggleSort("name")} className="inline-flex items-center gap-1">
          병원명 <span className="text-xs text-gray-400">{sortMark("name")}</span>
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
      key: "approvalStatus",
      header: "승인상태",
      render: (row) => labelApprovalStatus(row.approvalStatus),
    },
    {
      key: "reviewStatus",
      header: "병원 검수 상태",
      render: (row) => labelReviewStatus(row.reviewStatus),
    },
    {
      key: "viewCount",
      header: (
        <button
          type="button"
          onClick={() => toggleSort("view_count")}
          className="inline-flex items-center gap-1"
        >
          조회수 <span className="text-xs text-gray-400">{sortMark("view_count")}</span>
        </button>
      ),
      render: (row) => row.viewCount.toLocaleString(),
    },
    {
      key: "createdAt",
      header: (
        <button
          type="button"
          onClick={() => toggleSort("created_at")}
          className="inline-flex items-center gap-1"
        >
          등록일 <span className="text-xs text-gray-400">{sortMark("created_at")}</span>
        </button>
      ),
      render: (row) => row.createdAt,
    },
  ];

  return (
    <div className="space-y-4">
      <form
        onSubmit={applySearch}
        className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/[0.05] dark:bg-white/[0.03]"
      >
        <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="w-full">
            <InputField
              key={`search-${resetKey}`}
              defaultValue={searchInput}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => setSearchInput(event.target.value)}
              placeholder="종합검색 (병원명, 주소, 연락처)"
            />
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button type="submit" size="sm" className="h-11 px-4">
              검색
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-11 px-4">
              Export
            </Button>
            <Can permission="beaulab.hostpital.create">
              <Link href="/hospitals/create">
                <Button type="button" size="sm" className="h-11 px-4">
                  병원 등록
                </Button>
              </Link>
            </Can>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={toggleFilters}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 dark:border-white/[0.05] dark:text-white/90"
          >
            {isFilterOpen ? "필터 닫기" : "필터 열기"}
          </button>
          <button
            type="button"
            onClick={() => resetFilters(true)}
            className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-300"
          >
            필터 초기화
          </button>
        </div>

        <div
          className={[
            "grid transition-all duration-300",
            isFilterOpen ? "mt-3 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
          ].join(" ")}
        >
          <div className="overflow-hidden">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div>
                <p className="mb-1 text-xs font-medium text-gray-500">승인상태</p>
                <Select
                  key={`approval-${resetKey}`}
                  placeholder="전체"
                  options={APPROVAL_STATUS_OPTIONS}
                  defaultValue={draftFilters.approvalStatus}
                  onChange={(value: string) => setDraftFilters((prev) => ({ ...prev, approvalStatus: value }))}
                />
              </div>

              <div>
                <p className="mb-1 text-xs font-medium text-gray-500">기간(react-day-picker 예정)</p>
                <InputField
                  key={`range-${resetKey}`}
                  defaultValue={draftFilters.dateRange}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    setDraftFilters((prev) => ({ ...prev, dateRange: event.target.value }))
                  }
                  placeholder="예: 2026-01-01 ~ 2026-01-31"
                />
              </div>

              <div>
                <p className="mb-1 text-xs font-medium text-gray-500">병원 검수 상태</p>
                <div className="flex h-11 items-center gap-4 rounded-lg border border-gray-300 px-3 dark:border-gray-700">
                  {REVIEW_STATUS_OPTIONS.map((item) => (
                    <label key={item.value} className="inline-flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={draftFilters.reviewStatuses.includes(item.value)}
                        onChange={() => toggleReviewStatus(item.value)}
                      />
                      {item.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>

      <DataTable
        title="병원 목록"
        description="검색/필터는 Enter 또는 검색 버튼으로 적용됩니다."
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