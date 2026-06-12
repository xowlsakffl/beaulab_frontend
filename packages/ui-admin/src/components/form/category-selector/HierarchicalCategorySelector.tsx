"use client";

import React from "react";
import { Check, ChevronRight, Search, X } from "../../../icons";
import { Button } from "../../ui/button/Button";
import { Card } from "../../ui/card/Card";
import { SpinnerBlock } from "../../ui/spinner/Spinner";
import { SegmentedTabs } from "../../ui/tabs/SegmentedTabs";
import { InputField } from "../input/InputField";

export type CategorySelectorItem = {
  id: number;
  name: string;
  full_path?: string | null;
  depth: number;
  parent_id?: number | null;
  has_children?: boolean;
};

export type CategoryTreeNode = CategorySelectorItem;
export type SelectedCategoryDisplayItem = Pick<CategorySelectorItem, "id" | "name" | "full_path"> & {
  domain?: string | null;
};

export type CategorySelectorSection = {
  key: string;
  label: string;
  domain: string;
  usage?: string;
  searchPlaceholder: string;
};

export type CategorySelectorLoadParams = {
  section: CategorySelectorSection;
  parentId?: number | null;
  query?: string;
  perPage?: number;
  depth?: 1 | 2 | 3 | 4;
};

type SelectorText = {
  searchTitle: string;
  directTitle: string;
  largeTitle: string;
  middleTitle: string;
  smallTitle: string;
  loadingText: string;
  noResultsText: string;
  selectedTitle: string;
  primaryTitle: string;
  selectedPlaceholder: string;
  primaryPlaceholder: string;
  emptyLargeText: string;
  emptyMiddleText: string;
  emptySmallText: string;
};

type CategorySelectorSearchMode = "inline" | "dropdown";
type CategorySelectorSelectionMode = "checkbox" | "leaf-click";
type CategorySelectorSelectedDisplay = "badges" | "input";
type CategorySelectorSectionTabsPlacement = "top" | "header";
type CategorySelectorErrorPlacement = "bottom" | "header";

type HierarchicalCategorySelectorProps = {
  sections: CategorySelectorSection[];
  selectedIds: number[];
  selectedItems?: SelectedCategoryDisplayItem[];
  onToggleCategory: (categoryId: number, checked: boolean) => void;
  loadCategories: (params: CategorySelectorLoadParams) => Promise<CategorySelectorItem[]>;
  error?: string;
  initialSectionKey?: string;
  maxSearchResults?: number;
  visibleLevels?: 1 | 2 | 3;
  text?: Partial<SelectorText>;
  className?: string;
  headerTitle?: React.ReactNode;
  headerExtra?: React.ReactNode;
  info?: React.ReactNode;
  afterColumns?: React.ReactNode;
  activeSectionKey?: string;
  onActiveSectionKeyChange?: (sectionKey: string) => void;
  onSectionChangeRequest?: (sectionKey: string, currentSectionKey: string) => boolean | void;
  sectionTabsPlacement?: CategorySelectorSectionTabsPlacement;
  errorPlacement?: CategorySelectorErrorPlacement;
  compactSectionTabs?: boolean;
  searchMode?: CategorySelectorSearchMode;
  showSearchActions?: boolean;
  showSearchTitle?: boolean;
  showDirectTitle?: boolean;
  selectionMode?: CategorySelectorSelectionMode;
  selectedDisplay?: CategorySelectorSelectedDisplay;
  primaryCategoryId?: number | null;
  onPrimaryCategoryChange?: (categoryId: number) => void;
  columnHeightClassName?: string;
  searchInputClassName?: string;
  searchDepth?: 1 | 2 | 3 | 4;
};

type CategoryColumnProps = {
  title: string;
  items: CategorySelectorItem[];
  activeId?: number;
  selectedIdSet: ReadonlySet<number>;
  emptyMessage: string;
  isLoading?: boolean;
  loadingText: string;
  selectionMode: CategorySelectorSelectionMode;
  columnHeightClassName?: string;
  compact?: boolean;
  onActivate: (category: CategorySelectorItem) => void;
  onToggle: (category: CategorySelectorItem, checked: boolean) => void;
};

type SectionState = {
  rootItems: CategorySelectorItem[];
  rootLoaded: boolean;
  isRootLoading: boolean;
  loadError: string | null;
  activeLargeId?: number;
  activeMiddleId?: number;
  middleItemsByParent: Record<number, CategorySelectorItem[]>;
  smallItemsByParent: Record<number, CategorySelectorItem[]>;
  middleLoadingParentIds: Record<number, boolean>;
  smallLoadingParentIds: Record<number, boolean>;
};

const DEFAULT_TEXT: SelectorText = {
  searchTitle: "검색으로 찾기",
  directTitle: "직접 선택하기",
  largeTitle: "대카테고리",
  middleTitle: "중카테고리",
  smallTitle: "소카테고리",
  loadingText: "카테고리를 불러오는 중입니다.",
  noResultsText: "검색 결과가 없습니다.",
  selectedTitle: "선택된 카테고리",
  primaryTitle: "대표 카테고리 선택",
  selectedPlaceholder: "카테고리를 선택해 주세요.",
  primaryPlaceholder: "선택된 카테고리 중 대표 카테고리를 선택해 주세요.",
  emptyLargeText: "대카테고리가 없습니다.",
  emptyMiddleText: "대카테고리를 선택해 주세요.",
  emptySmallText: "중카테고리를 선택해 주세요.",
};

function createSectionState(): SectionState {
  return {
    rootItems: [],
    rootLoaded: false,
    isRootLoading: false,
    loadError: null,
    activeLargeId: undefined,
    activeMiddleId: undefined,
    middleItemsByParent: {},
    smallItemsByParent: {},
    middleLoadingParentIds: {},
    smallLoadingParentIds: {},
  };
}

function getNodeLabel(node: CategorySelectorItem | SelectedCategoryDisplayItem) {
  return node.full_path?.trim() || node.name;
}

function getNodeName(node: CategorySelectorItem | SelectedCategoryDisplayItem) {
  return node.name;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "카테고리를 불러오지 못했습니다.";
}

const CategoryColumn = React.memo(function CategoryColumn({
  title,
  items,
  activeId,
  selectedIdSet,
  emptyMessage,
  isLoading = false,
  loadingText,
  selectionMode,
  columnHeightClassName = "h-[320px]",
  compact = false,
  onActivate,
  onToggle,
}: CategoryColumnProps) {
  return (
    <Card className={`flex flex-col ${compact ? "p-2" : "p-2.5"} ${columnHeightClassName}`}>
      <p className={`${compact ? "mb-1.5" : "mb-2"} text-xs font-semibold text-gray-500 `}>{title}</p>

      {isLoading ? (
        <SpinnerBlock className="min-h-0 flex-1" spinnerClassName="size-5" label={loadingText} />
      ) : items.length > 0 ? (
        <div className={`flex-1 ${compact ? "space-y-0.5" : "space-y-1"} overflow-y-auto pr-1`}>
          {items.map((item) => {
            const isActive = activeId === item.id;
            const isSelected = selectedIdSet.has(item.id);
            const isLeafClickMode = selectionMode === "leaf-click";
            const isLeaf = !item.has_children;
            const rowClick = () => {
              if (isLeafClickMode && isLeaf) {
                onToggle(item, !isSelected);
                return;
              }

              onActivate(item);
            };

            return (
              <button
                key={item.id}
                type="button"
                onClick={rowClick}
                className={`flex w-full items-center gap-2 rounded-lg border px-2 ${compact ? "py-0.5" : "py-1"} text-left ${
                  isActive
                    ? "border-brand-200 bg-brand-50/70  "
                    : isSelected
                      ? "border-brand-200 bg-brand-50 text-brand-700  "
                    : "border-transparent hover:border-gray-200 hover:bg-gray-50  "
                }`}
              >
                {selectionMode === "checkbox" ? (
                  <span
                    role="checkbox"
                    aria-checked={isSelected}
                    tabIndex={-1}
                    onClick={(event) => {
                      event.stopPropagation();
                      onToggle(item, !isSelected);
                    }}
                    className={`flex size-6 shrink-0 items-center justify-center rounded-md border ${
                      isSelected
                        ? "border-brand-500 bg-brand-500 text-white"
                        : "border-gray-300 bg-white text-transparent  "
                    }`}
                    aria-label={isSelected ? `${item.name} 선택 해제` : `${item.name} 선택`}
                  >
                    <Check className="size-3.5" />
                  </span>
                ) : null}

                <span className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-lg py-1">
                  <span
                    className={`min-w-0 break-keep ${compact ? "text-xs" : "text-sm"} ${
                      isSelected
                        ? "font-semibold text-brand-700 "
                        : "text-gray-700 "
                    }`}
                  >
                    {item.name}
                  </span>
                  {item.has_children ? (
                    <ChevronRight
                      className={`size-4 shrink-0 ${
                        isActive ? "text-brand-500 " : "text-gray-300 "
                      }`}
                    />
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className={`flex min-h-0 flex-1 items-center justify-center text-center ${compact ? "text-xs" : "text-sm"} text-gray-400 `}>
          {emptyMessage}
        </div>
      )}
    </Card>
  );
});

export function HierarchicalCategorySelector({
  sections,
  selectedIds,
  selectedItems,
  onToggleCategory,
  loadCategories,
  error,
  initialSectionKey,
  maxSearchResults = 12,
  visibleLevels = 3,
  text,
  className,
  headerTitle,
  headerExtra,
  info,
  afterColumns,
  activeSectionKey: controlledActiveSectionKey,
  onActiveSectionKeyChange,
  onSectionChangeRequest,
  sectionTabsPlacement = "top",
  errorPlacement = "bottom",
  compactSectionTabs = false,
  searchMode = "inline",
  showSearchActions = false,
  showSearchTitle = true,
  showDirectTitle = true,
  selectionMode = "checkbox",
  selectedDisplay = "badges",
  primaryCategoryId,
  onPrimaryCategoryChange,
  columnHeightClassName,
  searchInputClassName,
  searchDepth,
}: HierarchicalCategorySelectorProps) {
  const mergedText = React.useMemo(() => ({ ...DEFAULT_TEXT, ...text }), [text]);
  const fallbackSectionKey = initialSectionKey ?? sections[0]?.key ?? "";
  const searchContainerRef = React.useRef<HTMLDivElement | null>(null);
  const [internalActiveSectionKey, setInternalActiveSectionKey] = React.useState(fallbackSectionKey);
  const activeSectionKey = controlledActiveSectionKey ?? internalActiveSectionKey;
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [isPrimaryOpen, setIsPrimaryOpen] = React.useState(false);
  const [sectionStates, setSectionStates] = React.useState<Record<string, SectionState>>({});
  const [searchResults, setSearchResults] = React.useState<CategorySelectorItem[]>([]);
  const [isSearchLoading, setIsSearchLoading] = React.useState(false);
  const [searchError, setSearchError] = React.useState<string | null>(null);
  const [nodeCache, setNodeCache] = React.useState<Record<number, CategorySelectorItem>>({});
  const sectionStatesRef = React.useRef<Record<string, SectionState>>({});
  const searchRequestIdRef = React.useRef(0);
  const rootRequestRef = React.useRef(new Map<string, Promise<CategorySelectorItem[]>>());
  const childRequestRef = React.useRef(new Map<string, Promise<CategorySelectorItem[]>>());
  const searchCacheRef = React.useRef(new Map<string, CategorySelectorItem[]>());
  const primaryContainerRef = React.useRef<HTMLDivElement | null>(null);

  const mergeNodeCache = React.useCallback((items: CategorySelectorItem[]) => {
    setNodeCache((prev) => {
      let next: Record<number, CategorySelectorItem> | null = null;

      items.forEach((item) => {
        const existing = prev[item.id];
        if (
          existing &&
          existing.name === item.name &&
          existing.full_path === item.full_path &&
          existing.depth === item.depth &&
          existing.parent_id === item.parent_id &&
          existing.has_children === item.has_children
        ) {
          return;
        }

        if (!next) {
          next = { ...prev };
        }

        next[item.id] = item;
      });

      return next ?? prev;
    });
  }, []);

  React.useEffect(() => {
    sectionStatesRef.current = sectionStates;
  }, [sectionStates]);

  React.useEffect(() => {
    if (sections.some((section) => section.key === activeSectionKey)) return;

    const nextKey =
      initialSectionKey && sections.some((section) => section.key === initialSectionKey)
        ? initialSectionKey
        : sections[0]?.key;

    if (nextKey) {
      if (controlledActiveSectionKey === undefined) {
        setInternalActiveSectionKey(nextKey);
      }
    }
  }, [activeSectionKey, controlledActiveSectionKey, initialSectionKey, sections]);

  const activeSection =
    sections.find((section) => section.key === activeSectionKey) ??
    sections.find((section) => section.key === initialSectionKey) ??
    sections[0];

  const activeSectionState = activeSection ? sectionStates[activeSection.key] ?? createSectionState() : createSectionState();
  const activeLargeId = activeSectionState.activeLargeId;
  const activeMiddleId = activeSectionState.activeMiddleId;
  const largeCategories = activeSectionState.rootItems;
  const middleCategories = activeLargeId ? activeSectionState.middleItemsByParent[activeLargeId] ?? [] : [];
  const smallCategories = activeMiddleId ? activeSectionState.smallItemsByParent[activeMiddleId] ?? [] : [];
  const normalizedSearchQuery = searchQuery.trim();
  const selectedIdSet = React.useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedNodes = React.useMemo(() => {
    const selectedItemMap = new Map<number, SelectedCategoryDisplayItem>();
    const nextSelectedNodes: SelectedCategoryDisplayItem[] = [];

    selectedItems?.forEach((item) => {
      selectedItemMap.set(item.id, item);
    });

    selectedIds.forEach((categoryId) => {
      const node = nodeCache[categoryId] ?? selectedItemMap.get(categoryId);
      const selectedItem = selectedItemMap.get(categoryId);
      if (!node) return;

      nextSelectedNodes.push({
        id: node.id,
        name: node.name,
        full_path: node.full_path,
        domain: selectedItem?.domain,
      });
    });

    return nextSelectedNodes;
  }, [nodeCache, selectedIds, selectedItems]);
  const primaryNode = selectedNodes.find((node) => node.id === primaryCategoryId) ?? null;
  const sectionTabItems = React.useMemo(
    () => sections.map((section) => ({ value: section.key, label: section.label })),
    [sections],
  );
  const sectionTabs = (
    <SegmentedTabs
      items={sectionTabItems}
      value={activeSection?.key}
      onValueChange={(sectionKey) => {
        const currentSectionKey = activeSection?.key ?? activeSectionKey;
        if (sectionKey === currentSectionKey) return;

        const shouldChange = onSectionChangeRequest?.(sectionKey, currentSectionKey);
        if (shouldChange === false) return;

        if (controlledActiveSectionKey === undefined) {
          setInternalActiveSectionKey(sectionKey);
        }
        onActiveSectionKeyChange?.(sectionKey);
        setSearchQuery("");
        setSearchResults([]);
        setSearchError(null);
        setIsSearchOpen(false);
      }}
      className={compactSectionTabs ? "w-36 rounded-lg p-0.5" : undefined}
      tabClassName={compactSectionTabs ? "rounded-md px-3 py-1.5 text-xs" : undefined}
    />
  );

  const loadChildCategories = React.useCallback(
    async (section: CategorySelectorSection, parentId: number, level: "middle" | "small") => {
      const currentState = sectionStatesRef.current[section.key] ?? createSectionState();
      const loadedItems =
        level === "middle" ? currentState.middleItemsByParent[parentId] : currentState.smallItemsByParent[parentId];

      if (loadedItems !== undefined) {
        return loadedItems;
      }

      const requestKey = `${section.key}:${level}:${parentId}`;
      const existingRequest = childRequestRef.current.get(requestKey);
      if (existingRequest) return existingRequest;

      setSectionStates((prev) => {
        const current = prev[section.key] ?? createSectionState();

        return {
          ...prev,
          [section.key]: {
            ...current,
            loadError: null,
            middleLoadingParentIds:
              level === "middle"
                ? {
                    ...current.middleLoadingParentIds,
                    [parentId]: true,
                  }
                : current.middleLoadingParentIds,
            smallLoadingParentIds:
              level === "small"
                ? {
                    ...current.smallLoadingParentIds,
                    [parentId]: true,
                  }
                : current.smallLoadingParentIds,
          },
        };
      });

      const request = loadCategories({ section, parentId });
      childRequestRef.current.set(requestKey, request);

      try {
        const items = await request;
        mergeNodeCache(items);

        React.startTransition(() => {
          setSectionStates((prev) => {
            const current = prev[section.key] ?? createSectionState();
            const nextMiddleLoadingParentIds = { ...current.middleLoadingParentIds };
            const nextSmallLoadingParentIds = { ...current.smallLoadingParentIds };
            delete nextMiddleLoadingParentIds[parentId];
            delete nextSmallLoadingParentIds[parentId];

            return {
              ...prev,
              [section.key]: {
                ...current,
                loadError: null,
                middleLoadingParentIds: nextMiddleLoadingParentIds,
                smallLoadingParentIds: nextSmallLoadingParentIds,
                middleItemsByParent:
                  level === "middle"
                    ? {
                        ...current.middleItemsByParent,
                        [parentId]: items,
                      }
                    : current.middleItemsByParent,
                smallItemsByParent:
                  level === "small"
                    ? {
                        ...current.smallItemsByParent,
                        [parentId]: items,
                      }
                    : current.smallItemsByParent,
              },
            };
          });
        });

        return items;
      } catch (nextError) {
        const message = getErrorMessage(nextError);

        setSectionStates((prev) => {
          const current = prev[section.key] ?? createSectionState();
          const nextMiddleLoadingParentIds = { ...current.middleLoadingParentIds };
          const nextSmallLoadingParentIds = { ...current.smallLoadingParentIds };
          delete nextMiddleLoadingParentIds[parentId];
          delete nextSmallLoadingParentIds[parentId];

          return {
            ...prev,
            [section.key]: {
              ...current,
              loadError: message,
              middleLoadingParentIds: nextMiddleLoadingParentIds,
              smallLoadingParentIds: nextSmallLoadingParentIds,
            },
          };
        });
        throw nextError;
      } finally {
        childRequestRef.current.delete(requestKey);
      }
    },
    [loadCategories, mergeNodeCache],
  );

  const loadRootCategories = React.useCallback(
    async (section: CategorySelectorSection) => {
      const existingRequest = rootRequestRef.current.get(section.key);
      if (existingRequest) return existingRequest;

      setSectionStates((prev) => {
        const current = prev[section.key] ?? createSectionState();

        return {
          ...prev,
          [section.key]: {
            ...current,
            isRootLoading: true,
            loadError: null,
          },
        };
      });

      const request = loadCategories({ section });
      rootRequestRef.current.set(section.key, request);

      try {
        const items = await request;
        mergeNodeCache(items);

        React.startTransition(() => {
          setSectionStates((prev) => {
            const current = prev[section.key] ?? createSectionState();

            return {
              ...prev,
              [section.key]: {
                ...current,
                rootItems: items,
                rootLoaded: true,
                isRootLoading: false,
                loadError: null,
              },
            };
          });
        });

        return items;
      } catch (nextError) {
        const message = getErrorMessage(nextError);

        setSectionStates((prev) => {
          const current = prev[section.key] ?? createSectionState();

          return {
            ...prev,
            [section.key]: {
              ...current,
              rootLoaded: true,
              isRootLoading: false,
              loadError: message,
            },
          };
        });
        throw nextError;
      } finally {
        rootRequestRef.current.delete(section.key);
      }
    },
    [loadCategories, mergeNodeCache],
  );

  React.useEffect(() => {
    if (!activeSection) return;
    if (activeSectionState.rootLoaded || activeSectionState.isRootLoading) return;

    void loadRootCategories(activeSection);
  }, [activeSection, activeSectionState.isRootLoading, activeSectionState.rootLoaded, loadRootCategories]);

  React.useEffect(() => {
    if (searchMode !== "dropdown" || !isSearchOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!searchContainerRef.current?.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isSearchOpen, searchMode]);

  React.useEffect(() => {
    if (!isPrimaryOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!primaryContainerRef.current?.contains(event.target as Node)) {
        setIsPrimaryOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isPrimaryOpen]);

  React.useEffect(() => {
    if (!activeSection) return;

    const requestId = searchRequestIdRef.current + 1;
    searchRequestIdRef.current = requestId;

    const shouldSearch = Boolean(normalizedSearchQuery) && (searchMode === "inline" || isSearchOpen);

    if (!shouldSearch) {
      setSearchResults([]);
      setSearchError(null);
      setIsSearchLoading(false);
      return;
    }

    const searchCacheKey = `${activeSection.key}:${normalizedSearchQuery}:${maxSearchResults}`;
    const cachedResults = searchCacheRef.current.get(searchCacheKey);
    if (cachedResults) {
      setSearchResults(cachedResults);
      setSearchError(null);
      setIsSearchLoading(false);
      return;
    }

    setSearchResults([]);
    setSearchError(null);

    const timer = window.setTimeout(async () => {
      setIsSearchLoading(true);

      try {
        const items = await loadCategories({
          section: activeSection,
          query: normalizedSearchQuery,
          perPage: maxSearchResults,
          depth: searchDepth,
        });

        if (searchRequestIdRef.current !== requestId) return;

        mergeNodeCache(items);
        searchCacheRef.current.set(searchCacheKey, items);
        setSearchResults(items);
      } catch (nextError) {
        if (searchRequestIdRef.current !== requestId) return;
        setSearchError(getErrorMessage(nextError));
      } finally {
        if (searchRequestIdRef.current === requestId) {
          setIsSearchLoading(false);
        }
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [activeSection, isSearchOpen, loadCategories, maxSearchResults, mergeNodeCache, normalizedSearchQuery, searchDepth, searchMode]);

  const searchResultsContent = (
    <>
      {isSearchLoading ? (
        <SpinnerBlock className={searchMode === "dropdown" ? "min-h-0 py-5" : "py-2"} spinnerClassName="size-5" label={mergedText.loadingText} />
      ) : searchError ? (
        <p className="px-3 py-4 text-sm text-error-500">{searchError}</p>
      ) : searchResults.length > 0 ? (
        <div className="space-y-1">
          {searchResults.map((node) => {
            const isSelected = selectedIdSet.has(node.id);
            const canSelect = selectionMode !== "leaf-click" || !node.has_children;

            return (
              <button
                key={node.id}
                type="button"
                disabled={!canSelect}
                onClick={() => {
                  if (!canSelect) return;
                  onToggleCategory(node.id, !isSelected);
                  if (searchMode === "dropdown") {
                    setIsSearchOpen(false);
                    setSearchQuery("");
                  }
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${
                  isSelected
                    ? "bg-brand-50 font-semibold text-brand-700"
                    : "text-gray-700 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-60"
                }`}
              >
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-gray-800">{node.name}</span>
                  <span className="block truncate text-xs text-gray-500">{node.full_path || (canSelect ? node.name : "소카테고리만 선택할 수 있습니다.")}</span>
                </span>
                {isSelected ? <Check className="size-4 shrink-0" /> : null}
              </button>
            );
          })}
        </div>
      ) : (
        <p className="px-3 py-4 text-sm text-gray-500 ">{mergedText.noResultsText}</p>
      )}
    </>
  );

  return (
    <div className={["space-y-4", className].filter(Boolean).join(" ")}>
      {headerTitle || headerExtra || sectionTabsPlacement === "header" ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {headerTitle ? <div className="min-w-0">{headerTitle}</div> : null}
            {sectionTabsPlacement === "header" ? sectionTabs : null}
            {error && errorPlacement === "header" ? (
              <p className="min-w-0 text-xs font-medium text-error-500">{error}</p>
            ) : null}
          </div>
          {headerExtra ? <div className="flex flex-wrap items-center justify-end gap-2">{headerExtra}</div> : null}
        </div>
      ) : null}

      {sectionTabsPlacement === "top" ? sectionTabs : null}

      <div className="space-y-2">
        {showSearchTitle ? <p className="text-sm font-semibold text-gray-800 ">{mergedText.searchTitle}</p> : null}
        <div className={showSearchActions ? "grid grid-cols-[minmax(0,1fr)_4rem_4rem] items-center gap-2" : "relative"}>
          <div ref={searchContainerRef} className="relative min-w-0">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <InputField
              value={searchQuery}
              onClick={() => {
                if (searchMode === "dropdown") {
                  setIsSearchOpen(true);
                }
              }}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                if (searchMode === "dropdown") {
                  setIsSearchOpen(true);
                }
              }}
              placeholder={activeSection?.searchPlaceholder || "카테고리를 검색하세요."}
              className={["pl-10", searchInputClassName].filter(Boolean).join(" ")}
            />
            {searchMode === "dropdown" && isSearchOpen && normalizedSearchQuery ? (
              <Card className="absolute left-0 right-0 top-full z-[80] mt-2 max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
                {searchResultsContent}
              </Card>
            ) : null}
          </div>
          {showSearchActions ? (
            <>
              <Button type="button" variant="brand" size="sm" className="h-9 px-3" onClick={() => setIsSearchOpen(true)}>
                검색
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 px-3"
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                  setSearchError(null);
                  setIsSearchOpen(false);
                }}
              >
                초기화
              </Button>
            </>
          ) : null}
        </div>

        {searchMode === "inline" && normalizedSearchQuery ? <Card className="p-3">{searchResultsContent}</Card> : null}
      </div>

      <div className="space-y-3">
        {showDirectTitle ? <p className="text-sm font-semibold text-gray-800 ">{mergedText.directTitle}</p> : null}

        {activeSectionState.loadError ? <p className="text-sm text-error-500">{activeSectionState.loadError}</p> : null}

        <div
          className={
            visibleLevels === 1
              ? "grid gap-4"
              : visibleLevels === 2
                ? "grid gap-4 lg:grid-cols-2"
                : "grid gap-4 lg:grid-cols-3"
          }
        >
          <CategoryColumn
            title={mergedText.largeTitle}
            items={largeCategories}
            activeId={activeLargeId}
            selectedIdSet={selectedIdSet}
            emptyMessage={mergedText.emptyLargeText}
            isLoading={activeSectionState.isRootLoading}
            loadingText={mergedText.loadingText}
            selectionMode={selectionMode}
            columnHeightClassName={columnHeightClassName}
            compact={compactSectionTabs}
            onActivate={(category) => {
              if (!activeSection) return;

              const categoryId = category.id;

              setSectionStates((prev) => {
                const current = prev[activeSection.key] ?? createSectionState();

                return {
                  ...prev,
                  [activeSection.key]: {
                    ...current,
                    activeLargeId: categoryId,
                    activeMiddleId: undefined,
                  },
                };
              });

              if (!category.has_children || activeSectionState.middleItemsByParent[categoryId] !== undefined) {
                return;
              }

              void loadChildCategories(activeSection, categoryId, "middle");
            }}
            onToggle={(category, checked) => onToggleCategory(category.id, checked)}
          />

          {visibleLevels >= 2 ? (
            <CategoryColumn
              title={mergedText.middleTitle}
              items={middleCategories}
              activeId={activeMiddleId}
              selectedIdSet={selectedIdSet}
              emptyMessage={mergedText.emptyMiddleText}
              isLoading={Boolean(activeLargeId) && Boolean(activeLargeId && activeSectionState.middleLoadingParentIds[activeLargeId])}
              loadingText={mergedText.loadingText}
              selectionMode={selectionMode}
              columnHeightClassName={columnHeightClassName}
              compact={compactSectionTabs}
              onActivate={(category) => {
                if (!activeSection) return;

                const categoryId = category.id;

                setSectionStates((prev) => {
                  const current = prev[activeSection.key] ?? createSectionState();

                  return {
                    ...prev,
                    [activeSection.key]: {
                      ...current,
                      activeMiddleId: categoryId,
                    },
                  };
                });

                if (!category.has_children || activeSectionState.smallItemsByParent[categoryId] !== undefined) {
                  return;
                }

                void loadChildCategories(activeSection, categoryId, "small");
              }}
              onToggle={(category, checked) => onToggleCategory(category.id, checked)}
            />
          ) : null}

          {visibleLevels >= 3 ? (
            <CategoryColumn
              title={mergedText.smallTitle}
              items={smallCategories}
              selectedIdSet={selectedIdSet}
              emptyMessage={mergedText.emptySmallText}
              isLoading={Boolean(activeMiddleId) && Boolean(activeMiddleId && activeSectionState.smallLoadingParentIds[activeMiddleId])}
              loadingText={mergedText.loadingText}
              onActivate={() => undefined}
              selectionMode={selectionMode}
              columnHeightClassName={columnHeightClassName}
              compact={compactSectionTabs}
              onToggle={(category, checked) => onToggleCategory(category.id, checked)}
            />
          ) : null}
        </div>

        {afterColumns}
      </div>

      {selectedDisplay === "input" ? (
        <div className="space-y-3">
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500 ">{mergedText.selectedTitle}</p>
            <div className="min-h-10 rounded-lg border border-gray-200 bg-white px-2 py-2">
              {selectedNodes.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedNodes.map((node) => {
                    return (
                    <span
                      key={node.id}
                      className="inline-flex max-w-full items-center rounded-full bg-brand-50 text-xs font-semibold text-brand-600"
                    >
                      <span className="max-w-[15rem] truncate px-2.5 py-1">
                        {getNodeName(node)}
                      </span>
                      <button
                        type="button"
                        onClick={() => onToggleCategory(node.id, false)}
                        className="pr-2 text-current"
                        aria-label={`${getNodeName(node)} 제거`}
                      >
                        <X className="size-3.5" />
                      </button>
                    </span>
                    );
                  })}
                </div>
              ) : (
                <span className="text-sm text-gray-400">{mergedText.selectedPlaceholder}</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500 ">{mergedText.primaryTitle}</p>
            <div ref={primaryContainerRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  if (selectedNodes.length > 0) {
                    setIsPrimaryOpen((prev) => !prev);
                  }
                }}
                className="flex min-h-10 w-full items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-left"
              >
                {primaryNode ? (
                  <span className="inline-flex max-w-full rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-600">
                    <span className="max-w-full truncate">{getNodeLabel(primaryNode)}</span>
                  </span>
                ) : (
                  <span className="min-w-0 truncate text-sm text-gray-400">{mergedText.primaryPlaceholder}</span>
                )}
                {selectedNodes.length > 0 ? <ChevronRight className="size-4 shrink-0 rotate-90 text-gray-500" /> : null}
              </button>

              {isPrimaryOpen ? (
                <Card className="absolute left-0 right-0 top-full z-[80] mt-2 max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
                <div className="space-y-1">
                  {selectedNodes.map((node) => {
                    const isPrimary = node.id === primaryCategoryId;

                    return (
                      <button
                        key={node.id}
                        type="button"
                        onClick={() => {
                          onPrimaryCategoryChange?.(node.id);
                          setIsPrimaryOpen(false);
                        }}
                        className={[
                          "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm",
                          isPrimary ? "bg-brand-50 font-semibold text-brand-700" : "text-gray-700 hover:bg-brand-50",
                        ].join(" ")}
                      >
                        <span className="min-w-0 truncate">{getNodeLabel(node)}</span>
                        {isPrimary ? <span className="shrink-0 text-xs">선택됨</span> : null}
                      </button>
                    );
                  })}
                </div>
                </Card>
              ) : null}
            </div>
          </div>
        </div>
      ) : selectedNodes.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500 ">{mergedText.selectedTitle}</p>
          <div className="flex flex-wrap gap-2">
            {selectedNodes.map((node) => (
              <button
                key={node.id}
                type="button"
                onClick={() => onToggleCategory(node.id, false)}
                className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700  "
              >
                <span className="max-w-[220px] truncate">{getNodeLabel(node)}</span>
                <X className="size-3.5" />
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {error && errorPlacement !== "header" ? <p className="text-sm text-error-500">{error}</p> : null}

      {info ? <div>{info}</div> : null}
    </div>
  );
}

export default HierarchicalCategorySelector;
