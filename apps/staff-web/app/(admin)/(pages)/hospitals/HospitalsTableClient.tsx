"use client";

import { Can } from "@/components/guard";
import { api } from "@/lib/api";
import { isApiSuccess } from "@beaulab/types";
import {
  SquarePlus,
  Download,
  SlidersHorizontal,
  StatusBadge,
  Button,
  DataTable,
  FormCheckbox,
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
  approvalStatuses: string[];
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
  approvalStatuses: [],
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
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = React.useState(false);
  const [isReviewDropdownOpen, setIsReviewDropdownOpen] = React.useState(false);
  const [draftFilters, setDraftFilters] = React.useState<Filters>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = React.useState<Filters>(DEFAULT_FILTERS);
  const [resetKey, setResetKey] = React.useState(0);
  const statusDropdownRef = React.useRef<HTMLDivElement | null>(null);
  const reviewDropdownRef = React.useRef<HTMLDivElement | null>(null);

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
    if (appliedFilters.approvalStatuses.length > 0) q.status = appliedFilters.approvalStatuses.join(",");
    if (appliedFilters.reviewStatuses.length > 0) q.allow_status = appliedFilters.reviewStatuses.join(",");

    return q;
  }, [appliedFilters.approvalStatuses, appliedFilters.reviewStatuses, page, perPage, searchKeyword, sortState]);

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

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setSearchKeyword(searchInput.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  React.useEffect(() => {
    const onOutsideClick = (event: MouseEvent) => {
      if (!statusDropdownRef.current?.contains(event.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
      if (!reviewDropdownRef.current?.contains(event.target as Node)) {
        setIsReviewDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, []);

  const applyFilters = () => {
    setPage(1);
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
    setIsFilterOpen((prev) => !prev);
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

  const toggleApprovalStatus = (value: string) => {
    setDraftFilters((prev) => {
      const exists = prev.approvalStatuses.includes(value);
      return {
        ...prev,
        approvalStatuses: exists
          ? prev.approvalStatuses.filter((item) => item !== value)
          : [...prev.approvalStatuses, value],
      };
    });
  };

  const toggleAllApprovalStatus = () => {
    setDraftFilters((prev) => ({
      ...prev,
      approvalStatuses:
        prev.approvalStatuses.length === APPROVAL_STATUS_OPTIONS.length
          ? []
          : APPROVAL_STATUS_OPTIONS.map((item) => item.value),
    }));
  };

  const toggleAllReviewStatus = () => {
    setDraftFilters((prev) => ({
      ...prev,
      reviewStatuses:
        prev.reviewStatuses.length === REVIEW_STATUS_OPTIONS.length
          ? []
          : REVIEW_STATUS_OPTIONS.map((item) => item.value),
    }));
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
        <Button type="button" variant="ghost" size="sm" onClick={() => toggleSort("id")} className="inline-flex items-center gap-1 px-0">
          ID <span className="text-xs text-gray-400">{sortMark("id")}</span>
        </Button>
      ),
      render: (row) => row.id,
    },
    {
      key: "name",
      header: (
        <Button type="button" variant="ghost" size="sm" onClick={() => toggleSort("name")} className="inline-flex items-center gap-1 px-0">
          병원명 <span className="text-xs text-gray-400">{sortMark("name")}</span>
        </Button>
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
      render: (row) => (
        <StatusBadge size="sm" color={row.approvalStatus === "ACTIVE" ? "success" : row.approvalStatus === "SUSPENDED" ? "warning" : "error"}>
          {labelApprovalStatus(row.approvalStatus)}
        </StatusBadge>
      ),
    },
    {
      key: "reviewStatus",
      header: "병원 검수 상태",
      render: (row) => (
        <StatusBadge size="sm" color={row.reviewStatus === "APPROVED" ? "success" : row.reviewStatus === "PENDING" ? "warning" : "error"}>
          {labelReviewStatus(row.reviewStatus)}
        </StatusBadge>
      ),
    },
    {
      key: "viewCount",
      header: (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => toggleSort("view_count")}
          className="inline-flex items-center gap-1 px-0"
        >
          조회수 <span className="text-xs text-gray-400">{sortMark("view_count")}</span>
        </Button>
      ),
      render: (row) => row.viewCount.toLocaleString(),
    },
    {
      key: "createdAt",
      header: (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => toggleSort("created_at")}
          className="inline-flex items-center gap-1 px-0"
        >
          등록일 <span className="text-xs text-gray-400">{sortMark("created_at")}</span>
        </Button>
      ),
      render: (row) => row.createdAt,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="w-full">
          <InputField
              key={`search-${resetKey}`}
              defaultValue={searchInput}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => setSearchInput(event.target.value)}
              placeholder="병원명, 연락처, 주소 검색"
              className="bg-white dark:bg-gray-800"
          />
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2">
          <Button type="button" variant="outline" onClick={toggleFilters} size="sm" className="h-11 px-4">
            <SlidersHorizontal className="size-5" />
            <span>필터</span>
          </Button>
          <Button type="button" variant="outline" size="sm" className="h-11 px-4">
            <Download className="size-5" />
            <span>다운로드</span>
          </Button>
          <Can permission="beaulab.hostpital.create">
            <Link href="/hospitals/create">
              <Button type="button" size="sm" className="h-11 px-4">
                <SquarePlus className="size-5" />
                <span>병원 등록</span>
              </Button>
            </Link>
          </Can>
        </div>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="overflow-hidden rounded-xl">
          <Button
            type="button"
            variant="ghost"
            onClick={toggleFilters}
            className="flex h-11 w-full items-center justify-between rounded-none bg-white px-3 text-left text-sm font-medium text-gray-700 dark:bg-transparent dark:text-white/90"
          >
            <span>필터</span>
            <span className={["text-xs transition-transform", isFilterOpen ? "rotate-180" : "rotate-0"].join(" ")}>▾</span>
          </Button>

          <div
            className={[
              "grid transition-all duration-300",
              isFilterOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-100",
            ].join(" ")}
          >
            <div className="overflow-hidden">
              <div className="flex items-center justify-end gap-2 px-3 pt-3">
                <Button type="button" onClick={applyFilters} size="sm" className="h-10 px-4">
                  필터 적용
                </Button>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={() => resetFilters(true)}
                  className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-300"
                >
                  필터 초기화
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-3 p-3 md:grid-cols-3">
                <div>
                  <p className="mb-1 text-xs font-medium text-gray-500">승인상태</p>
                  <div className="relative" ref={statusDropdownRef}>
                    <Button
                      type="button"
                      variant="outline"
                      size="default"
                      onClick={() => setIsStatusDropdownOpen((prev) => !prev)}
                      className="flex h-11 w-full items-center justify-between rounded-lg border border-gray-300 px-3 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-300"
                    >
                      {draftFilters.approvalStatuses.length > 0
                        ? `${draftFilters.approvalStatuses.length}개 선택`
                        : "전체"}
                      <span className="text-xs">▾</span>
                    </Button>

                    {isStatusDropdownOpen && (
                      <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                        <div className="px-1 py-1 text-sm">
                          <FormCheckbox
                            label="전체"
                            checked={draftFilters.approvalStatuses.length === APPROVAL_STATUS_OPTIONS.length}
                            onChange={() => toggleAllApprovalStatus()}
                          />
                        </div>
                        {APPROVAL_STATUS_OPTIONS.map((item) => (
                          <div key={item.value} className="px-1 py-1 text-sm">
                            <FormCheckbox
                              label={item.label}
                              checked={draftFilters.approvalStatuses.includes(item.value)}
                              onChange={() => toggleApprovalStatus(item.value)}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
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
                  <div className="relative" ref={reviewDropdownRef}>
                    <Button
                      type="button"
                      variant="outline"
                      size="default"
                      onClick={() => setIsReviewDropdownOpen((prev) => !prev)}
                      className="flex h-11 w-full items-center justify-between rounded-lg border border-gray-300 px-3 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-300"
                    >
                      {draftFilters.reviewStatuses.length > 0
                        ? `${draftFilters.reviewStatuses.length}개 선택`
                        : "전체"}
                      <span className="text-xs">▾</span>
                    </Button>

                    {isReviewDropdownOpen && (
                      <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                        <div className="px-1 py-1 text-sm">
                          <FormCheckbox
                            label="전체"
                            checked={draftFilters.reviewStatuses.length === REVIEW_STATUS_OPTIONS.length}
                            onChange={() => toggleAllReviewStatus()}
                          />
                        </div>
                        {REVIEW_STATUS_OPTIONS.map((item) => (
                          <div key={item.value} className="px-1 py-1 text-sm">
                            <FormCheckbox
                              label={item.label}
                              checked={draftFilters.reviewStatuses.includes(item.value)}
                              onChange={() => toggleReviewStatus(item.value)}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DataTable
        title="병원 목록"
        description="종합검색은 입력 시 자동 반영되며, 필터는 '필터 적용' 버튼으로 적용됩니다."
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
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">페이지당</span>
            <Select
              defaultValue={String(perPage)}
              options={PER_PAGE_OPTIONS}
              onChange={(value) => {
                setPage(1);
                setPerPage(Number(value));
              }}
              className="h-9 w-[88px] px-2 text-xs"
            />
          </div>
        }
        emptyText="조건에 맞는 병원이 없습니다."
      />
    </div>
  );
}
