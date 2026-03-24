"use client";

import React from "react";
import { Check, ChevronRight, Search, X } from "../../../icons";
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
  searchPlaceholder: string;
};

export type CategorySelectorLoadParams = {
  section: CategorySelectorSection;
  parentId?: number | null;
  query?: string;
  perPage?: number;
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
  emptyLargeText: string;
  emptyMiddleText: string;
  emptySmallText: string;
};

type HierarchicalCategorySelectorProps = {
  sections: CategorySelectorSection[];
  selectedIds: number[];
  selectedItems?: SelectedCategoryDisplayItem[];
  onToggleCategory: (categoryId: number, checked: boolean) => void;
  loadCategories: (params: CategorySelectorLoadParams) => Promise<CategorySelectorItem[]>;
  error?: string;
  initialSectionKey?: string;
  maxSearchResults?: number;
  text?: Partial<SelectorText>;
};

type CategoryColumnProps = {
  title: string;
  items: CategorySelectorItem[];
  activeId?: number;
  selectedIdSet: ReadonlySet<number>;
  emptyMessage: string;
  isLoading?: boolean;
  loadingText: string;
  onActivate: (categoryId: number) => void;
  onToggle: (categoryId: number, checked: boolean) => void;
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
  onActivate,
  onToggle,
}: CategoryColumnProps) {
  return (
    <Card className="flex h-[320px] flex-col p-3">
      <p className="mb-3 text-xs font-semibold text-gray-500 dark:text-gray-400">{title}</p>

      {isLoading ? (
        <SpinnerBlock className="min-h-0 flex-1" spinnerClassName="size-5" label={loadingText} />
      ) : items.length > 0 ? (
        <div className="flex-1 space-y-1 overflow-y-auto pr-1">
          {items.map((item) => {
            const isActive = activeId === item.id;
            const isSelected = selectedIdSet.has(item.id);

            return (
              <div
                key={item.id}
                className={`flex items-center gap-2 rounded-xl border px-2 py-1.5 ${
                  isActive
                    ? "border-brand-200 bg-brand-50/70 dark:border-brand-500/40 dark:bg-brand-500/10"
                    : "border-transparent hover:border-gray-200 hover:bg-gray-50 dark:hover:border-gray-700 dark:hover:bg-white/[0.04]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onToggle(item.id, !isSelected)}
                  className={`flex size-6 shrink-0 items-center justify-center rounded-md border ${
                    isSelected
                      ? "border-brand-500 bg-brand-500 text-white"
                      : "border-gray-300 bg-white text-transparent dark:border-gray-700 dark:bg-gray-900"
                  }`}
                  aria-label={isSelected ? `${item.name} 선택 해제` : `${item.name} 선택`}
                >
                  <Check className="size-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => onActivate(item.id)}
                  className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-lg py-1 text-left"
                >
                  <span
                    className={`truncate text-sm ${
                      isSelected
                        ? "font-semibold text-brand-700 dark:text-brand-300"
                        : "text-gray-700 dark:text-gray-200"
                    }`}
                  >
                    {item.name}
                  </span>
                  {item.has_children ? (
                    <ChevronRight
                      className={`size-4 shrink-0 ${
                        isActive ? "text-brand-500 dark:text-brand-300" : "text-gray-300 dark:text-gray-600"
                      }`}
                    />
                  ) : null}
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 items-center justify-center text-center text-sm text-gray-400 dark:text-gray-500">
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
  text,
}: HierarchicalCategorySelectorProps) {
  const mergedText = React.useMemo(() => ({ ...DEFAULT_TEXT, ...text }), [text]);
  const fallbackSectionKey = initialSectionKey ?? sections[0]?.key ?? "";
  const [activeSectionKey, setActiveSectionKey] = React.useState(fallbackSectionKey);
  const [searchQuery, setSearchQuery] = React.useState("");
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
      setActiveSectionKey(nextKey);
    }
  }, [activeSectionKey, initialSectionKey, sections]);

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
  const sectionTabItems = React.useMemo(
    () => sections.map((section) => ({ value: section.key, label: section.label })),
    [sections],
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
    if (!activeSection) return;

    const requestId = searchRequestIdRef.current + 1;
    searchRequestIdRef.current = requestId;

    if (!normalizedSearchQuery) {
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
  }, [activeSection, loadCategories, maxSearchResults, mergeNodeCache, normalizedSearchQuery]);

  return (
    <div className="space-y-4">
      <SegmentedTabs
        items={sectionTabItems}
        value={activeSection?.key}
        onValueChange={(sectionKey) => {
          setActiveSectionKey(sectionKey);
          setSearchQuery("");
          setSearchResults([]);
          setSearchError(null);
        }}
      />

      <div className="space-y-2">
        <p className="text-sm font-semibold text-gray-800 dark:text-white/90">{mergedText.searchTitle}</p>
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
          <InputField
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={activeSection?.searchPlaceholder || "카테고리를 검색하세요."}
            className="pl-10"
          />
        </div>

        {normalizedSearchQuery ? (
          <Card className="p-3">
            {isSearchLoading ? (
              <SpinnerBlock className="py-2" spinnerClassName="size-5" label={mergedText.loadingText} />
            ) : searchError ? (
              <p className="text-sm text-error-500">{searchError}</p>
            ) : searchResults.length > 0 ? (
              <div className="space-y-2">
                {searchResults.map((node) => {
                  const isSelected = selectedIdSet.has(node.id);

                  return (
                    <button
                      key={node.id}
                      type="button"
                      onClick={() => onToggleCategory(node.id, !isSelected)}
                      className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm ${
                        isSelected
                          ? "border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-500/40 dark:bg-brand-500/10 dark:text-brand-300"
                          : "border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-white/[0.04]"
                      }`}
                    >
                      <span className="truncate">{getNodeLabel(node)}</span>
                      {isSelected ? <Check className="size-4 shrink-0" /> : null}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">{mergedText.noResultsText}</p>
            )}
          </Card>
        ) : null}
      </div>

      <div className="space-y-3">
        <p className="text-sm font-semibold text-gray-800 dark:text-white/90">{mergedText.directTitle}</p>

        {activeSectionState.loadError ? <p className="text-sm text-error-500">{activeSectionState.loadError}</p> : null}

        <div className="grid gap-4 lg:grid-cols-3">
          <CategoryColumn
            title={mergedText.largeTitle}
            items={largeCategories}
            activeId={activeLargeId}
            selectedIdSet={selectedIdSet}
            emptyMessage={mergedText.emptyLargeText}
            isLoading={activeSectionState.isRootLoading}
            loadingText={mergedText.loadingText}
            onActivate={(categoryId) => {
              if (!activeSection) return;

              const nextLarge = largeCategories.find((item) => item.id === categoryId);

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

              if (!nextLarge?.has_children || activeSectionState.middleItemsByParent[categoryId] !== undefined) {
                return;
              }

              void loadChildCategories(activeSection, categoryId, "middle");
            }}
            onToggle={onToggleCategory}
          />

          <CategoryColumn
            title={mergedText.middleTitle}
            items={middleCategories}
            activeId={activeMiddleId}
            selectedIdSet={selectedIdSet}
            emptyMessage={mergedText.emptyMiddleText}
            isLoading={Boolean(activeLargeId) && Boolean(activeLargeId && activeSectionState.middleLoadingParentIds[activeLargeId])}
            loadingText={mergedText.loadingText}
            onActivate={(categoryId) => {
              if (!activeSection) return;

              const nextMiddle = middleCategories.find((item) => item.id === categoryId);

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

              if (!nextMiddle?.has_children || activeSectionState.smallItemsByParent[categoryId] !== undefined) {
                return;
              }

              void loadChildCategories(activeSection, categoryId, "small");
            }}
            onToggle={onToggleCategory}
          />

          <CategoryColumn
            title={mergedText.smallTitle}
            items={smallCategories}
            selectedIdSet={selectedIdSet}
            emptyMessage={mergedText.emptySmallText}
            isLoading={Boolean(activeMiddleId) && Boolean(activeMiddleId && activeSectionState.smallLoadingParentIds[activeMiddleId])}
            loadingText={mergedText.loadingText}
            onActivate={() => undefined}
            onToggle={onToggleCategory}
          />
        </div>
      </div>

      {selectedNodes.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{mergedText.selectedTitle}</p>
          <div className="flex flex-wrap gap-2">
            {selectedNodes.map((node) => (
              <button
                key={node.id}
                type="button"
                onClick={() => onToggleCategory(node.id, false)}
                className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
              >
                <span className="max-w-[220px] truncate">{getNodeLabel(node)}</span>
                <X className="size-3.5" />
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {error ? <p className="text-sm text-error-500">{error}</p> : null}
    </div>
  );
}

export default HierarchicalCategorySelector;
