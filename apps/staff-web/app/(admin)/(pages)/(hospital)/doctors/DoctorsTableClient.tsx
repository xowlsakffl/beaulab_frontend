"use client";

import { DoctorsDataTable } from "@/components/doctor/list/DoctorsDataTable";
import { DoctorsFilterPanel } from "@/components/doctor/list/DoctorsFilterPanel";
import { DoctorsToolbar } from "@/components/doctor/list/DoctorsToolbar";
import { api } from "@/lib/common/api";
import {
  DATE_PRESET_OPTIONS,
  DEFAULT_FILTERS,
  DOCTOR_APPROVAL_STATUS_OPTIONS,
  DOCTOR_POSITION_OPTIONS,
  DOCTOR_STATUS_OPTIONS,
  buildPresetDateRange,
  buildDoctorsQuery,
  buildDoctorsQueryString,
  buildDoctorsReturnToPath,
  mapDateRangeToFilter,
  nextSortState,
  normalizeRangeDate,
  normalizeDoctor,
  parseDoctorsTableState,
  type DateFilterKey,
  type DatePresetKey,
  type DoctorApiItem,
  type Filters,
  type SortField,
  type SortState,
} from "@/lib/doctor/list";
import { isApiSuccess } from "@beaulab/types";
import type { DataTableMeta } from "@beaulab/ui-admin";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React from "react";
import type { DateRange } from "react-day-picker";

export default function DoctorsTableClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialTableStateRef = React.useRef<ReturnType<typeof parseDoctorsTableState> | null>(null);

  if (!initialTableStateRef.current) {
    initialTableStateRef.current = parseDoctorsTableState(new URLSearchParams(searchParams.toString()));
  }

  const initialTableState = initialTableStateRef.current;

  const [searchInput, setSearchInput] = React.useState(initialTableState.searchKeyword);
  const [searchKeyword, setSearchKeyword] = React.useState(initialTableState.searchKeyword);
  const [isFilterOpen, setIsFilterOpen] = React.useState(true);
  const [draftFilters, setDraftFilters] = React.useState<Filters>(initialTableState.filters);
  const [appliedFilters, setAppliedFilters] = React.useState<Filters>(initialTableState.filters);
  const [isOperatingStatusDropdownOpen, setIsOperatingStatusDropdownOpen] = React.useState(false);
  const [isApprovalStatusDropdownOpen, setIsApprovalStatusDropdownOpen] = React.useState(false);
  const [isPositionDropdownOpen, setIsPositionDropdownOpen] = React.useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);
  const [isUpdatedDatePickerOpen, setIsUpdatedDatePickerOpen] = React.useState(false);
  const [draftDateRange, setDraftDateRange] = React.useState<DateRange | undefined>(initialTableState.draftDateRange);
  const [draftUpdatedDateRange, setDraftUpdatedDateRange] = React.useState<DateRange | undefined>(initialTableState.draftUpdatedDateRange);
  const operatingStatusDropdownRef = React.useRef<HTMLDivElement | null>(null);
  const approvalStatusDropdownRef = React.useRef<HTMLDivElement | null>(null);
  const positionDropdownRef = React.useRef<HTMLDivElement | null>(null);
  const datePickerRef = React.useRef<HTMLDivElement | null>(null);
  const updatedDatePickerRef = React.useRef<HTMLDivElement | null>(null);

  const [sortState, setSortState] = React.useState<SortState>(initialTableState.sortState);
  const [perPage, setPerPage] = React.useState(initialTableState.perPage);
  const [page, setPage] = React.useState(initialTableState.page);

  const [rows, setRows] = React.useState<ReturnType<typeof normalizeDoctor>[]>([]);
  const [highlightedRowId, setHighlightedRowId] = React.useState<number | null>(null);
  const [meta, setMeta] = React.useState<DataTableMeta | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const requestKeyRef = React.useRef("");
  const hasFetchedRef = React.useRef(false);

  const query = React.useMemo(
    () =>
      buildDoctorsQuery({
        searchKeyword,
        appliedFilters,
        sortState,
        perPage,
        page,
      }),
    [appliedFilters, page, perPage, searchKeyword, sortState],
  );

  const queryString = React.useMemo(() => buildDoctorsQueryString(query), [query]);
  const buildReturnToPath = React.useCallback(() => buildDoctorsReturnToPath(pathname, query), [pathname, query]);

  React.useEffect(() => {
    const currentQueryString = searchParams.toString();
    if (queryString === currentQueryString) return;

    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  }, [pathname, queryString, router, searchParams]);

  const fetchDoctors = React.useCallback(
    async (manualRefresh = false) => {
      const requestKey = JSON.stringify(query);
      if (!manualRefresh && requestKeyRef.current === requestKey) return;
      requestKeyRef.current = requestKey;

      if (!hasFetchedRef.current) setLoading(true);
      else setRefreshing(true);
      if (manualRefresh) setRefreshing(true);

      setError(null);

      try {
        const response = await api.get<DoctorApiItem[]>("/doctors", query);
        if (!isApiSuccess(response)) {
          setError(response.error.message || "의료진 목록 조회에 실패했습니다.");
          return;
        }

        const responseMeta = (response.meta as DataTableMeta | null) ?? null;

        setRows(response.data.map(normalizeDoctor));
        setMeta(
          responseMeta
            ? {
                current_page: responseMeta.current_page,
                per_page: responseMeta.per_page,
                total: responseMeta.total,
                last_page: responseMeta.last_page,
              }
            : null,
        );
        hasFetchedRef.current = true;
      } catch {
        setError("의료진 목록 조회 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [query],
  );

  React.useEffect(() => {
    fetchDoctors(false);
  }, [fetchDoctors]);

  React.useEffect(() => {
    rows.slice(0, 15).forEach((row) => {
      router.prefetch(`/doctors/${row.id}`);
    });
  }, [router, rows]);

  React.useEffect(() => {
    const highlightParam = searchParams.get("highlight");
    if (!highlightParam) return;

    const parsedHighlightId = Number(highlightParam);
    if (!Number.isFinite(parsedHighlightId)) return;

    setHighlightedRowId(parsedHighlightId);

    const nextSearchParams = new URLSearchParams(searchParams.toString());
    nextSearchParams.delete("highlight");

    const nextQuery = nextSearchParams.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  React.useEffect(() => {
    if (searchInput.trim() === searchKeyword) return;

    const timer = window.setTimeout(() => {
      setPage(1);
      setSearchKeyword(searchInput.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchInput, searchKeyword]);

  React.useEffect(() => {
    const onOutsideClick = (event: MouseEvent) => {
      if (!operatingStatusDropdownRef.current?.contains(event.target as Node)) {
        setIsOperatingStatusDropdownOpen(false);
      }

      if (!approvalStatusDropdownRef.current?.contains(event.target as Node)) {
        setIsApprovalStatusDropdownOpen(false);
      }

      if (!positionDropdownRef.current?.contains(event.target as Node)) {
        setIsPositionDropdownOpen(false);
      }

      if (!datePickerRef.current?.contains(event.target as Node)) {
        setIsDatePickerOpen(false);
      }

      if (!updatedDatePickerRef.current?.contains(event.target as Node)) {
        setIsUpdatedDatePickerOpen(false);
      }
    };

    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, []);

  const applyFilters = React.useCallback(() => {
    setPage(1);
    setAppliedFilters({
      operatingStatuses: [...draftFilters.operatingStatuses],
      approvalStatuses: [...draftFilters.approvalStatuses],
      positions: [...draftFilters.positions],
      dateRange: draftFilters.dateRange,
      startDate: draftFilters.startDate,
      endDate: draftFilters.endDate,
      updatedDateRange: draftFilters.updatedDateRange,
      updatedStartDate: draftFilters.updatedStartDate,
      updatedEndDate: draftFilters.updatedEndDate,
    });
  }, [draftFilters]);

  const resetFilters = React.useCallback(() => {
    setPage(1);
    setDraftFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setDraftDateRange(undefined);
    setDraftUpdatedDateRange(undefined);
    setIsOperatingStatusDropdownOpen(false);
    setIsApprovalStatusDropdownOpen(false);
    setIsPositionDropdownOpen(false);
    setIsDatePickerOpen(false);
    setIsUpdatedDatePickerOpen(false);
  }, []);

  const applyDateRange = React.useCallback(
    (
      key: DateFilterKey,
      nextRange?: DateRange,
      options?: {
        closePicker?: boolean;
      },
    ) => {
      const normalizedRange =
        nextRange?.from || nextRange?.to
          ? {
              from: nextRange?.from ? normalizeRangeDate(nextRange.from) : undefined,
              to: nextRange?.to ? normalizeRangeDate(nextRange.to) : undefined,
            }
          : undefined;
      const mapped = mapDateRangeToFilter(normalizedRange);

      if (key === "created") {
        setDraftDateRange(normalizedRange);
        setDraftFilters((prev) => ({
          ...prev,
          dateRange: mapped.label,
          startDate: mapped.startDate,
          endDate: mapped.endDate,
        }));

        if (options?.closePicker) {
          setIsDatePickerOpen(false);
        }

        return;
      }

      setDraftUpdatedDateRange(normalizedRange);
      setDraftFilters((prev) => ({
        ...prev,
        updatedDateRange: mapped.label,
        updatedStartDate: mapped.startDate,
        updatedEndDate: mapped.endDate,
      }));

      if (options?.closePicker) {
        setIsUpdatedDatePickerOpen(false);
      }
    },
    [],
  );

  const applyDatePreset = React.useCallback((key: DateFilterKey, preset: DatePresetKey) => {
    applyDateRange(key, buildPresetDateRange(preset), { closePicker: true });
  }, [applyDateRange]);

  const toggleSort = React.useCallback((field: SortField) => {
    setPage(1);
    setSortState((prev) => nextSortState(prev, field));
  }, []);

  const toggleOperatingStatus = React.useCallback((value: string) => {
    setDraftFilters((prev) => {
      const exists = prev.operatingStatuses.includes(value);

      return {
        ...prev,
        operatingStatuses: exists
          ? prev.operatingStatuses.filter((item) => item !== value)
          : [...prev.operatingStatuses, value],
      };
    });
  }, []);

  const toggleApprovalStatus = React.useCallback((value: string) => {
    setDraftFilters((prev) => {
      const exists = prev.approvalStatuses.includes(value);

      return {
        ...prev,
        approvalStatuses: exists
          ? prev.approvalStatuses.filter((item) => item !== value)
          : [...prev.approvalStatuses, value],
      };
    });
  }, []);

  const togglePosition = React.useCallback((value: string) => {
    setDraftFilters((prev) => {
      const exists = prev.positions.includes(value);

      return {
        ...prev,
        positions: exists
          ? prev.positions.filter((item) => item !== value)
          : [...prev.positions, value],
      };
    });
  }, []);

  return (
    <div className="min-w-0 space-y-4">
      <DoctorsToolbar
        searchInput={searchInput}
        isFilterOpen={isFilterOpen}
        onSearchChange={setSearchInput}
        onToggleFilters={() => setIsFilterOpen((prev) => !prev)}
      />

      <DoctorsFilterPanel
        isOpen={isFilterOpen}
        draftFilters={draftFilters}
        draftDateRange={draftDateRange}
        draftUpdatedDateRange={draftUpdatedDateRange}
        positionOptions={DOCTOR_POSITION_OPTIONS}
        isOperatingStatusDropdownOpen={isOperatingStatusDropdownOpen}
        isApprovalStatusDropdownOpen={isApprovalStatusDropdownOpen}
        isPositionDropdownOpen={isPositionDropdownOpen}
        isDatePickerOpen={isDatePickerOpen}
        isUpdatedDatePickerOpen={isUpdatedDatePickerOpen}
        operatingStatusDropdownRef={operatingStatusDropdownRef}
        approvalStatusDropdownRef={approvalStatusDropdownRef}
        positionDropdownRef={positionDropdownRef}
        datePickerRef={datePickerRef}
        updatedDatePickerRef={updatedDatePickerRef}
        operatingStatusOptions={DOCTOR_STATUS_OPTIONS}
        approvalStatusOptions={DOCTOR_APPROVAL_STATUS_OPTIONS}
        datePresetOptions={DATE_PRESET_OPTIONS}
        onToggleFilters={() => setIsFilterOpen((prev) => !prev)}
        onToggleOperatingStatusDropdown={() => {
          setIsApprovalStatusDropdownOpen(false);
          setIsPositionDropdownOpen(false);
          setIsDatePickerOpen(false);
          setIsUpdatedDatePickerOpen(false);
          setIsOperatingStatusDropdownOpen((prev) => !prev);
        }}
        onToggleApprovalStatusDropdown={() => {
          setIsOperatingStatusDropdownOpen(false);
          setIsPositionDropdownOpen(false);
          setIsDatePickerOpen(false);
          setIsUpdatedDatePickerOpen(false);
          setIsApprovalStatusDropdownOpen((prev) => !prev);
        }}
        onTogglePositionDropdown={() => {
          setIsOperatingStatusDropdownOpen(false);
          setIsApprovalStatusDropdownOpen(false);
          setIsDatePickerOpen(false);
          setIsUpdatedDatePickerOpen(false);
          setIsPositionDropdownOpen((prev) => !prev);
        }}
        onToggleDatePicker={() => {
          setIsOperatingStatusDropdownOpen(false);
          setIsApprovalStatusDropdownOpen(false);
          setIsPositionDropdownOpen(false);
          setIsUpdatedDatePickerOpen(false);
          setIsDatePickerOpen((prev) => !prev);
        }}
        onToggleUpdatedDatePicker={() => {
          setIsOperatingStatusDropdownOpen(false);
          setIsApprovalStatusDropdownOpen(false);
          setIsPositionDropdownOpen(false);
          setIsDatePickerOpen(false);
          setIsUpdatedDatePickerOpen((prev) => !prev);
        }}
        onToggleOperatingStatus={toggleOperatingStatus}
        onToggleApprovalStatus={toggleApprovalStatus}
        onTogglePosition={togglePosition}
        onToggleAllOperatingStatus={() =>
          setDraftFilters((prev) => ({
            ...prev,
            operatingStatuses:
              prev.operatingStatuses.length === DOCTOR_STATUS_OPTIONS.length
                ? []
                : DOCTOR_STATUS_OPTIONS.map((item) => item.value),
          }))
        }
        onToggleAllApprovalStatus={() =>
          setDraftFilters((prev) => ({
            ...prev,
            approvalStatuses:
              prev.approvalStatuses.length === DOCTOR_APPROVAL_STATUS_OPTIONS.length
                ? []
                : DOCTOR_APPROVAL_STATUS_OPTIONS.map((item) => item.value),
          }))
        }
        onToggleAllPosition={() =>
          setDraftFilters((prev) => ({
            ...prev,
              positions:
              prev.positions.length === DOCTOR_POSITION_OPTIONS.length
                ? []
                : DOCTOR_POSITION_OPTIONS.map((item) => item.value),
          }))
        }
        onApplyDateRange={(key, nextRange) => applyDateRange(key, nextRange)}
        onApplyDatePreset={applyDatePreset}
        onApplyFilters={applyFilters}
        onResetFilters={resetFilters}
      />

      <DoctorsDataTable
        rows={rows}
        meta={meta}
        loading={loading}
        refreshing={refreshing}
        error={error}
        highlightedRowId={highlightedRowId}
        sortState={sortState}
        perPage={perPage}
        onToggleSort={toggleSort}
        onRefresh={() => fetchDoctors(true)}
        onGoPage={(nextPage) => setPage(nextPage)}
        onPerPageChange={(value) => {
          setPage(1);
          setPerPage(value);
        }}
        onRowClick={(row) => {
          const returnTo = buildReturnToPath();
          router.push(`/doctors/${row.id}?returnTo=${encodeURIComponent(returnTo)}`);
        }}
      />
    </div>
  );
}
