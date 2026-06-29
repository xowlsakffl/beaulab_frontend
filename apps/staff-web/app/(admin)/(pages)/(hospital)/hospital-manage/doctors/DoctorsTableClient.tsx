"use client";

import { DoctorsDataTable } from "@/components/doctor/list/DoctorsDataTable";
import { DoctorsFilterPanel } from "@/components/doctor/list/DoctorsFilterPanel";
import { useListData } from "@/hooks/common/useListData";
import { api } from "@/lib/common/api";
import { CATEGORY_DOMAINS, CATEGORY_USAGES, type CategoryApiItem } from "@/lib/common/category";
import { preloadImageUrls } from "@/lib/common/media";
import {
  DEFAULT_FILTERS,
  DOCTORS_PER_PAGE,
  DOCTOR_APPROVAL_STATUS_OPTIONS,
  DOCTOR_POSITION_OPTIONS,
  DOCTOR_SPECIALIST_FIELD_OPTIONS,
  buildDoctorsQuery,
  buildDoctorsQueryString,
  buildDoctorsReturnToPath,
  buildPresetDateRange,
  expandDoctorCategoryIds,
  mapDateRangeToFilter,
  nextSortState,
  normalizeDoctor,
  normalizeRangeDate,
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

type CategoryFilterOption = {
  value: string;
  label: string;
};

let cachedDoctorCategoryOptions: CategoryFilterOption[] | null = null;

function normalizeDoctorCategoryOptions(items: CategoryApiItem[]): CategoryFilterOption[] {
  const groupedOptions = items
    .filter((item) => item.status === "ACTIVE")
    .map((item) => ({
      value: String(item.id),
      label: item.name,
    }))
    .reduce<Map<string, string[]>>((map, item) => {
      const label = item.label.trim();
      if (!label) return map;

      const values = map.get(label) ?? [];
      values.push(item.value);
      map.set(label, values);

      return map;
    }, new Map());

  return Array.from(groupedOptions.entries()).map(([label, values]) => ({
    value: values.join("|"),
    label,
  }));
}

export default function DoctorsTableClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [initialTableState] = React.useState(() =>
    parseDoctorsTableState(new URLSearchParams(searchParams.toString())),
  );

  const [searchInput, setSearchInput] = React.useState(initialTableState.searchKeyword);
  const [searchKeyword, setSearchKeyword] = React.useState(initialTableState.searchKeyword);
  const [draftFilters, setDraftFilters] = React.useState<Filters>(initialTableState.filters);
  const [appliedFilters, setAppliedFilters] = React.useState<Filters>(initialTableState.filters);
  const [categoryOptions, setCategoryOptions] = React.useState<CategoryFilterOption[]>([]);
  const [isApprovalStatusDropdownOpen, setIsApprovalStatusDropdownOpen] = React.useState(false);
  const [isPositionDropdownOpen, setIsPositionDropdownOpen] = React.useState(false);
  const [isSpecialistFieldDropdownOpen, setIsSpecialistFieldDropdownOpen] = React.useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = React.useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);
  const [draftDateRange, setDraftDateRange] = React.useState<DateRange | undefined>(initialTableState.draftDateRange);
  const approvalStatusDropdownRef = React.useRef<HTMLDivElement | null>(null);
  const positionDropdownRef = React.useRef<HTMLDivElement | null>(null);
  const specialistFieldDropdownRef = React.useRef<HTMLDivElement | null>(null);
  const categoryDropdownRef = React.useRef<HTMLDivElement | null>(null);
  const datePickerRef = React.useRef<HTMLDivElement | null>(null);

  const [sortState, setSortState] = React.useState<SortState>(initialTableState.sortState);
  const [page, setPage] = React.useState(initialTableState.page);

  const [highlightedRowId, setHighlightedRowId] = React.useState<number | null>(null);

  const query = React.useMemo(
    () =>
      buildDoctorsQuery({
        searchKeyword,
        appliedFilters,
        sortState,
        perPage: DOCTORS_PER_PAGE,
        page,
      }),
    [appliedFilters, page, searchKeyword, sortState],
  );

  const queryString = React.useMemo(() => buildDoctorsQueryString(query), [query]);
  const buildReturnToPath = React.useCallback(() => buildDoctorsReturnToPath(pathname, query), [pathname, query]);

  const fetchDoctorRows = React.useCallback(async (nextQuery: typeof query) => {
    const response = await api.get<DoctorApiItem[]>(
      "/doctors",
      {
        ...nextQuery,
        category_ids: expandDoctorCategoryIds(nextQuery.category_ids),
      },
      {
        latestKey: "doctors:list",
      },
    );
    if (!isApiSuccess(response)) {
      throw new Error(response.error.message || "의료진 목록 조회에 실패했습니다.");
    }

    const responseMeta = (response.meta as DataTableMeta | null) ?? null;
    const normalizedRows = response.data.map(normalizeDoctor);
    void preloadImageUrls(normalizedRows.map((row) => row.profileImageUrl));

    return {
      rows: normalizedRows,
      meta: responseMeta
        ? {
            current_page: responseMeta.current_page,
            per_page: responseMeta.per_page,
            total: responseMeta.total,
            last_page: responseMeta.last_page,
          }
        : null,
    };
  }, []);

  const {
    rows,
    meta,
    error,
    loading,
    refreshing,
    fetchList: fetchDoctors,
  } = useListData({
    query,
    fetchRows: fetchDoctorRows,
    errorMessage: "의료진 목록 조회 중 오류가 발생했습니다.",
  });

  const fetchCategoryOptions = React.useCallback(async () => {
    if (cachedDoctorCategoryOptions) {
      setCategoryOptions(cachedDoctorCategoryOptions);
      return;
    }

    try {
      const response = await api.get<CategoryApiItem[]>("/categories/selector", {
        domain: CATEGORY_DOMAINS.HOSPITAL_MEDICAL,
        usage: CATEGORY_USAGES.HOSPITAL_DOCTOR_SUBJECT,
        status: ["ACTIVE"],
      });

      if (!isApiSuccess(response)) {
        setCategoryOptions([]);
        return;
      }

      const options = normalizeDoctorCategoryOptions(response.data);
      cachedDoctorCategoryOptions = options;
      setCategoryOptions(options);
    } catch {
      setCategoryOptions([]);
    }
  }, []);

  React.useEffect(() => {
    const currentQueryString = searchParams.toString();
    if (queryString === currentQueryString) return;

    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  }, [pathname, queryString, router, searchParams]);

  React.useEffect(() => {
    void fetchCategoryOptions();
  }, [fetchCategoryOptions]);

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
    const onOutsideClick = (event: MouseEvent) => {
      if (!approvalStatusDropdownRef.current?.contains(event.target as Node)) {
        setIsApprovalStatusDropdownOpen(false);
      }

      if (!positionDropdownRef.current?.contains(event.target as Node)) {
        setIsPositionDropdownOpen(false);
      }

      if (!specialistFieldDropdownRef.current?.contains(event.target as Node)) {
        setIsSpecialistFieldDropdownOpen(false);
      }

      if (!categoryDropdownRef.current?.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }

      if (!datePickerRef.current?.contains(event.target as Node)) {
        setIsDatePickerOpen(false);
      }
    };

    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, []);

  const applyFilters = React.useCallback(() => {
    setPage(1);
    setSearchKeyword(searchInput.trim());
    setAppliedFilters({
      approvalStatuses: [...draftFilters.approvalStatuses],
      positions: [...draftFilters.positions],
      specialistFields: [...draftFilters.specialistFields],
      categoryIds: [...draftFilters.categoryIds],
      metric: draftFilters.metric,
      metricMin: draftFilters.metricMin,
      metricMax: draftFilters.metricMax,
      dateRange: draftFilters.dateRange,
      startDate: draftFilters.startDate,
      endDate: draftFilters.endDate,
    });
  }, [draftFilters, searchInput]);

  const resetFilters = React.useCallback(() => {
    setDraftFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setDraftDateRange(undefined);
    setSearchInput("");
    setSearchKeyword("");
    setIsApprovalStatusDropdownOpen(false);
    setIsPositionDropdownOpen(false);
    setIsSpecialistFieldDropdownOpen(false);
    setIsCategoryDropdownOpen(false);
    setIsDatePickerOpen(false);
    setPage(1);
  }, []);

  const applyDateRange = React.useCallback(
    (
      _key: DateFilterKey,
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
    },
    [],
  );

  const applyDatePreset = React.useCallback(
    (key: DateFilterKey, preset: DatePresetKey) => {
      applyDateRange(key, buildPresetDateRange(preset), { closePicker: true });
    },
    [applyDateRange],
  );

  const toggleSort = React.useCallback((field: SortField) => {
    setPage(1);
    setSortState((prev) => nextSortState(prev, field));
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
        positions: exists ? prev.positions.filter((item) => item !== value) : [...prev.positions, value],
      };
    });
  }, []);

  const toggleSpecialistField = React.useCallback((value: string) => {
    setDraftFilters((prev) => {
      const exists = prev.specialistFields.includes(value);

      return {
        ...prev,
        specialistFields: exists
          ? prev.specialistFields.filter((item) => item !== value)
          : [...prev.specialistFields, value],
      };
    });
  }, []);

  const toggleCategory = React.useCallback((value: string) => {
    setDraftFilters((prev) => {
      const exists = prev.categoryIds.includes(value);

      return {
        ...prev,
        categoryIds: exists ? prev.categoryIds.filter((item) => item !== value) : [...prev.categoryIds, value],
      };
    });
  }, []);

  const closeDropdowns = React.useCallback(() => {
    setIsApprovalStatusDropdownOpen(false);
    setIsPositionDropdownOpen(false);
    setIsSpecialistFieldDropdownOpen(false);
    setIsCategoryDropdownOpen(false);
    setIsDatePickerOpen(false);
  }, []);

  return (
    <div className="min-w-0 space-y-4">
      <DoctorsFilterPanel
        draftFilters={draftFilters}
        draftDateRange={draftDateRange}
        isApprovalStatusDropdownOpen={isApprovalStatusDropdownOpen}
        isPositionDropdownOpen={isPositionDropdownOpen}
        isSpecialistFieldDropdownOpen={isSpecialistFieldDropdownOpen}
        isCategoryDropdownOpen={isCategoryDropdownOpen}
        isDatePickerOpen={isDatePickerOpen}
        approvalStatusDropdownRef={approvalStatusDropdownRef}
        positionDropdownRef={positionDropdownRef}
        specialistFieldDropdownRef={specialistFieldDropdownRef}
        categoryDropdownRef={categoryDropdownRef}
        datePickerRef={datePickerRef}
        categoryOptions={categoryOptions}
        searchInput={searchInput}
        onSearchChange={setSearchInput}
        onToggleApprovalStatusDropdown={() => {
          const wasOpen = isApprovalStatusDropdownOpen;
          closeDropdowns();
          setIsApprovalStatusDropdownOpen(!wasOpen);
        }}
        onTogglePositionDropdown={() => {
          const wasOpen = isPositionDropdownOpen;
          closeDropdowns();
          setIsPositionDropdownOpen(!wasOpen);
        }}
        onToggleSpecialistFieldDropdown={() => {
          const wasOpen = isSpecialistFieldDropdownOpen;
          closeDropdowns();
          setIsSpecialistFieldDropdownOpen(!wasOpen);
        }}
        onToggleCategoryDropdown={() => {
          const wasOpen = isCategoryDropdownOpen;
          closeDropdowns();
          setIsCategoryDropdownOpen(!wasOpen);
        }}
        onToggleDatePicker={() => {
          const wasOpen = isDatePickerOpen;
          closeDropdowns();
          setIsDatePickerOpen(!wasOpen);
        }}
        onToggleApprovalStatus={toggleApprovalStatus}
        onTogglePosition={togglePosition}
        onToggleSpecialistField={toggleSpecialistField}
        onToggleCategory={toggleCategory}
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
        onToggleAllSpecialistField={() =>
          setDraftFilters((prev) => ({
            ...prev,
            specialistFields:
              prev.specialistFields.length === DOCTOR_SPECIALIST_FIELD_OPTIONS.length
                ? []
                : DOCTOR_SPECIALIST_FIELD_OPTIONS.map((item) => item.value),
          }))
        }
        onToggleAllCategory={() =>
          setDraftFilters((prev) => ({
            ...prev,
            categoryIds:
              prev.categoryIds.length === categoryOptions.length ? [] : categoryOptions.map((item) => item.value),
          }))
        }
        onMetricChange={(value) => setDraftFilters((prev) => ({ ...prev, metric: value }))}
        onMetricMinChange={(value) => setDraftFilters((prev) => ({ ...prev, metricMin: value }))}
        onMetricMaxChange={(value) => setDraftFilters((prev) => ({ ...prev, metricMax: value }))}
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
        onToggleSort={toggleSort}
        onRefresh={() => fetchDoctors(true)}
        onGoPage={(nextPage) => setPage(nextPage)}
        onRowClick={(row) => {
          const returnTo = buildReturnToPath();
          router.push(`/hospital-manage/doctors/${row.id}?returnTo=${encodeURIComponent(returnTo)}`);
        }}
      />
    </div>
  );
}
