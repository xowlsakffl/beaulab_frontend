"use client";

import React from "react";
import { CATEGORY_DOMAINS, type CategoryApiItem } from "@/lib/common/category";
import { fetchCategorySelectorItems } from "@/lib/common/category-selector";
import { getRequestCacheVersion, subscribeRequestCache } from "@/lib/common/request-cache";
import type { HospitalReviewFilters } from "@/lib/hospital-review/list";

type SetFilters = React.Dispatch<React.SetStateAction<HospitalReviewFilters>>;

export function useReviewCategoryFilters(
  usage: string,
  filters: HospitalReviewFilters,
  setFilters: SetFilters,
  setAppliedFilters: SetFilters,
) {
  const majorItems = useCategoryItems(usage, null);
  const middleItems = useCategoryItems(null, filters.majorCategoryId);
  const smallItems = useCategoryItems(null, filters.middleCategoryId);
  const selectedId = filters.categoryIds[0] ?? "";

  React.useEffect(() => {
    if (!selectedId || filters.majorCategoryId || !majorItems.length) return;
    let active = true;
    const restore = async () => {
      const root = majorItems.find((item) => String(item.id) === selectedId);
      let chain = root ? [root] : [];
      if (!root) {
        // Older list URLs contain only the selected leaf ID, not its ancestors.
        const levels = await Promise.all(
          [1, 2, 3, 4].map((depth) => fetchCategorySelectorItems({ domain: CATEGORY_DOMAINS.HOSPITAL_MEDICAL, depth })),
        );
        const byId = new Map(levels.flat().map((item) => [String(item.id), item]));
        let item = byId.get(selectedId);
        const visited = new Set<number>();
        while (item && !visited.has(item.id)) {
          visited.add(item.id);
          chain.unshift(item);
          if (majorItems.some((major) => major.id === item?.id)) break;
          item = item.parent_id ? byId.get(String(item.parent_id)) : undefined;
        }
        if (!majorItems.some((major) => major.id === chain[0]?.id)) chain = [];
      }
      if (!active || !chain.length) return;
      const hydrate = (current: HospitalReviewFilters) =>
        current.categoryIds[0] === selectedId && !current.majorCategoryId
          ? {
              ...current,
              majorCategoryId: String(chain[0].id),
              middleCategoryId: chain[1] ? String(chain[1].id) : "",
              smallCategoryId: chain[2] ? String(chain[2].id) : "",
            }
          : current;
      setFilters(hydrate);
      setAppliedFilters(hydrate);
    };
    void restore().catch(() => {
      /* Keep the URL filter when category options are unavailable. */
    });
    return () => {
      active = false;
    };
  }, [filters.majorCategoryId, majorItems, selectedId, setAppliedFilters, setFilters]);

  const changeMajorCategory = React.useCallback(
    (value: string) =>
      setFilters((current) => ({
        ...current,
        majorCategoryId: value,
        middleCategoryId: "",
        smallCategoryId: "",
        categoryIds: value ? [value] : [],
      })),
    [setFilters],
  );
  const changeMiddleCategory = React.useCallback(
    (value: string) =>
      setFilters((current) => {
        const selected = current.majorCategoryId ? value : "";
        return {
          ...current,
          middleCategoryId: selected,
          smallCategoryId: "",
          categoryIds: selected ? [selected] : current.majorCategoryId ? [current.majorCategoryId] : [],
        };
      }),
    [setFilters],
  );
  const changeSmallCategory = React.useCallback(
    (value: string) =>
      setFilters((current) => {
        const selected = current.middleCategoryId ? value : "";
        const category = selected || current.middleCategoryId || current.majorCategoryId;
        return { ...current, smallCategoryId: selected, categoryIds: category ? [category] : [] };
      }),
    [setFilters],
  );

  return {
    majorCategoryOptions: options(majorItems, "전체"),
    middleCategoryOptions: options(middleItems, filters.majorCategoryId ? "전체" : "대분류 선택"),
    smallCategoryOptions: options(smallItems, filters.middleCategoryId ? "전체" : "중분류 선택"),
    changeMajorCategory,
    changeMiddleCategory,
    changeSmallCategory,
  };
}

function useCategoryItems(usage: string | null, parentId: string | null) {
  const [state, setState] = React.useState<{ key: string; items: CategoryApiItem[] }>({ key: "", items: [] });
  const getCategoryVersion = React.useCallback(() => getRequestCacheVersion("categories"), []);
  const version = React.useSyncExternalStore(subscribeRequestCache, getCategoryVersion, getCategoryVersion);
  const key = JSON.stringify([usage, parentId, version]);
  React.useEffect(() => {
    let active = true;
    if (!usage && !parentId) return;
    void fetchCategorySelectorItems({ domain: CATEGORY_DOMAINS.HOSPITAL_MEDICAL, usage, parentId, perPage: 100 })
      .then((items) => {
        if (active) setState({ key, items });
      })
      .catch(() => {
        if (active) setState({ key, items: [] });
      });
    return () => {
      active = false;
    };
  }, [key, parentId, usage]);
  return state.key === key ? state.items : EMPTY_ITEMS;
}

const EMPTY_ITEMS: CategoryApiItem[] = [];
function options(items: CategoryApiItem[], placeholder: string) {
  return [{ value: "", label: placeholder }, ...items.map((item) => ({ value: String(item.id), label: item.name }))];
}
