"use client";

import React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { isApiSuccess } from "@beaulab/types";
import { useGlobalAlert, type DataTableMeta } from "@beaulab/ui-admin";

import { HashtagUpsertModal } from "@/components/hashtag/list/HashtagUpsertModal";
import { HashtagsDataTable } from "@/components/hashtag/list/HashtagsDataTable";
import { HashtagsFilterPanel } from "@/components/hashtag/list/HashtagsFilterPanel";
import { useListData } from "@/hooks/common/useListData";
import { api } from "@/lib/common/api";
import {
  DEFAULT_FILTERS,
  HASHTAG_STATUS_OPTIONS,
  buildHashtagsQuery,
  buildHashtagsQueryString,
  nextSortState,
  normalizeHashtag,
  parseHashtagsTableState,
  sanitizeHashtagName,
  type Filters,
  type HashtagApiItem,
  type HashtagRow,
  type SortField,
  type SortState,
} from "@/lib/hashtag/list";

export default function HashtagsPageClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { showAlert } = useGlobalAlert();
  const [initialTableState] = React.useState(() =>
    parseHashtagsTableState(new URLSearchParams(searchParams.toString())),
  );

  const [searchInput, setSearchInput] = React.useState(initialTableState.searchKeyword);
  const [searchKeyword, setSearchKeyword] = React.useState(initialTableState.searchKeyword);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = React.useState(false);
  const [draftFilters, setDraftFilters] = React.useState<Filters>(initialTableState.filters);
  const [appliedFilters, setAppliedFilters] = React.useState<Filters>(initialTableState.filters);
  const statusDropdownRef = React.useRef<HTMLDivElement | null>(null);
  const [sortState, setSortState] = React.useState<SortState>(initialTableState.sortState);
  const perPage = initialTableState.perPage;
  const [page, setPage] = React.useState(initialTableState.page);

  const [highlightedRowId, setHighlightedRowId] = React.useState<number | null>(null);

  const [upsertMode, setUpsertMode] = React.useState<"create" | "edit" | null>(null);
  const [selectedRow, setSelectedRow] = React.useState<HashtagRow | null>(null);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const query = React.useMemo(
    () =>
      buildHashtagsQuery({
        searchKeyword,
        appliedFilters,
        sortState,
        perPage,
        page,
      }),
    [appliedFilters, page, perPage, searchKeyword, sortState],
  );

  const queryString = React.useMemo(() => buildHashtagsQueryString(query), [query]);

  const fetchHashtagRows = React.useCallback(async (nextQuery: typeof query) => {
    const response = await api.get<HashtagApiItem[]>("/hashtags", nextQuery, {
      latestKey: "hashtags:list",
    });
    if (!isApiSuccess(response)) {
      throw new Error(response.error.message || "해시태그 목록 조회에 실패했습니다.");
    }

    const responseMeta = (response.meta as DataTableMeta | null) ?? null;

    return {
      rows: response.data.map(normalizeHashtag),
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
    fetchList: fetchHashtags,
  } = useListData({
    cacheNamespace: "hashtags",
    query,
    fetchRows: fetchHashtagRows,
    errorMessage: "해시태그 목록 조회 중 오류가 발생했습니다.",
  });

  React.useEffect(() => {
    const currentQueryString = searchParams.toString();
    if (queryString === currentQueryString) return;

    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  }, [pathname, queryString, router, searchParams]);

  React.useEffect(() => {
    const onOutsideClick = (event: MouseEvent) => {
      if (!statusDropdownRef.current?.contains(event.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, []);

  React.useEffect(() => {
    if (!highlightedRowId) return;

    const timer = window.setTimeout(() => {
      setHighlightedRowId((current) => (current === highlightedRowId ? null : current));
    }, 2600);

    return () => window.clearTimeout(timer);
  }, [highlightedRowId]);

  const closeUpsertModal = React.useCallback(() => {
    if (isSubmitting) return;

    setUpsertMode(null);
    setSelectedRow(null);
    setSubmitError(null);
  }, [isSubmitting]);

  const openCreateModal = React.useCallback(() => {
    setUpsertMode("create");
    setSelectedRow(null);
    setSubmitError(null);
  }, []);

  const openEditModal = React.useCallback((row: HashtagRow) => {
    setUpsertMode("edit");
    setSelectedRow(row);
    setSubmitError(null);
  }, []);

  const applyFilters = React.useCallback(() => {
    setPage(1);
    setSearchKeyword(searchInput.trim());
    setAppliedFilters({
      statuses: [...draftFilters.statuses],
    });
  }, [draftFilters, searchInput]);

  const resetFilters = React.useCallback((applyNow = true) => {
    setIsStatusDropdownOpen(false);
    setDraftFilters(DEFAULT_FILTERS);
    if (applyNow) {
      setPage(1);
      setSearchInput("");
      setSearchKeyword("");
      setAppliedFilters(DEFAULT_FILTERS);
    }
  }, []);

  const toggleStatus = React.useCallback((value: string) => {
    setDraftFilters((prev) => {
      const exists = prev.statuses.includes(value);
      return {
        ...prev,
        statuses: exists ? prev.statuses.filter((item) => item !== value) : [...prev.statuses, value],
      };
    });
  }, []);

  const toggleAllStatus = React.useCallback(() => {
    setDraftFilters((prev) => ({
      ...prev,
      statuses:
        prev.statuses.length === HASHTAG_STATUS_OPTIONS.length ? [] : HASHTAG_STATUS_OPTIONS.map((item) => item.value),
    }));
  }, []);

  const handleSubmitHashtag = React.useCallback(
    async (name: string, status: string) => {
      const sanitizedName = sanitizeHashtagName(name);
      if (!sanitizedName) return;

      const isEditMode = upsertMode === "edit" && selectedRow !== null;
      setIsSubmitting(true);
      setSubmitError(null);

      try {
        const response = isEditMode
          ? await api.patch<HashtagApiItem>(`/hashtags/${selectedRow.id}`, { name: sanitizedName, status })
          : await api.post<HashtagApiItem>("/hashtags", { name: sanitizedName, status });

        if (!isApiSuccess(response)) {
          setSubmitError(
            response.error.message || (isEditMode ? "해시태그 수정에 실패했습니다." : "해시태그 등록에 실패했습니다."),
          );
          return;
        }

        const savedRow = normalizeHashtag(response.data);
        setHighlightedRowId(savedRow.id);
        setUpsertMode(null);
        setSelectedRow(null);
        setSubmitError(null);

        showAlert({
          variant: "success",
          title: isEditMode ? "해시태그 수정 완료" : "해시태그 등록 완료",
          message: isEditMode
            ? "변경된 해시태그를 목록에서 확인할 수 있습니다."
            : "새 해시태그를 목록에서 확인할 수 있습니다.",
        });

        await fetchHashtags(true);
      } catch {
        setSubmitError(isEditMode ? "해시태그 수정 중 오류가 발생했습니다." : "해시태그 등록 중 오류가 발생했습니다.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [fetchHashtags, selectedRow, showAlert, upsertMode],
  );

  return (
    <>
      <div className="space-y-4">
        <HashtagsFilterPanel
          searchInput={searchInput}
          onSearchChange={setSearchInput}
          onOpenCreate={openCreateModal}
          draftFilters={draftFilters}
          isStatusDropdownOpen={isStatusDropdownOpen}
          statusDropdownRef={statusDropdownRef}
          onToggleStatusDropdown={() => setIsStatusDropdownOpen((prev) => !prev)}
          onToggleStatus={toggleStatus}
          onToggleAllStatus={toggleAllStatus}
          onApplyFilters={applyFilters}
          onResetFilters={() => resetFilters(true)}
        />

        <HashtagsDataTable
          rows={rows}
          meta={meta}
          loading={loading}
          refreshing={refreshing}
          error={error}
          highlightedRowId={highlightedRowId}
          sortState={sortState}
          onToggleSort={(field: SortField) => {
            setPage(1);
            setSortState((current) => nextSortState(current, field));
          }}
          onRefresh={() => void fetchHashtags(true)}
          onGoPage={setPage}
          onRowClick={openEditModal}
        />
      </div>

      <HashtagUpsertModal
        isOpen={upsertMode !== null}
        mode={upsertMode ?? "create"}
        initialName={selectedRow?.name ?? ""}
        initialStatus={selectedRow?.status ?? "ACTIVE"}
        submitting={isSubmitting}
        submitError={submitError}
        onClose={closeUpsertModal}
        onSubmit={(name, status) => void handleSubmitHashtag(name, status)}
      />
    </>
  );
}
