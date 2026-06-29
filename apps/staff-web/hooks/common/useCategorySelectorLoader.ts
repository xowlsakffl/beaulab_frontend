"use client";

import React from "react";

import { api } from "@/lib/common/api";
import { normalizeCategorySelectorItem, type CategoryApiItem } from "@/lib/common/category";
import { getTimedCache, setTimedCache } from "@/lib/common/request-cache";
import { isApiSuccess } from "@beaulab/types";
import type { CategorySelectorItem, CategorySelectorLoadParams } from "@beaulab/ui-admin";

const CATEGORY_SELECTOR_CACHE_TTL_MS = 5 * 60 * 1000;
const categorySelectorCache = new Map<string, { expiresAt: number; value: CategorySelectorItem[] }>();

function buildCategorySelectorCacheKey({ section, parentId, query, perPage, depth }: CategorySelectorLoadParams) {
  return JSON.stringify({
    domain: section.domain,
    usage: section.usage ?? "",
    parentId: parentId ?? null,
    query: query?.trim() ?? "",
    perPage: perPage ?? null,
    depth: depth ?? null,
  });
}

export function useCategorySelectorLoader() {
  return React.useCallback(
    async ({
      section,
      parentId,
      query,
      perPage,
      depth,
    }: CategorySelectorLoadParams): Promise<CategorySelectorItem[]> => {
      try {
        const cacheKey = buildCategorySelectorCacheKey({ section, parentId, query, perPage, depth });
        const cachedItems = getTimedCache(categorySelectorCache, cacheKey);

        if (cachedItems) {
          return cachedItems;
        }

        const isRootRequest = parentId === undefined || parentId === null;
        const response = await api.get<CategoryApiItem[]>("/categories/selector", {
          domain: section.domain,
          ...(isRootRequest && section.usage ? { usage: section.usage } : {}),
          status: ["ACTIVE"],
          ...(query
            ? {
                q: query,
                per_page: perPage ?? 12,
              }
            : {}),
          ...(depth ? { depth } : {}),
          ...(parentId !== undefined && parentId !== null ? { parent_id: parentId } : {}),
        });

        if (!isApiSuccess(response)) {
          throw new Error(response.error.message || "카테고리 목록을 불러오지 못했습니다.");
        }

        const items = response.data.filter((item) => item.status === "ACTIVE").map(normalizeCategorySelectorItem);
        setTimedCache(categorySelectorCache, cacheKey, items, CATEGORY_SELECTOR_CACHE_TTL_MS);

        return items;
      } catch (error) {
        if (error instanceof Error && error.message) {
          throw error;
        }

        throw new Error("카테고리 목록을 불러오는 중 오류가 발생했습니다.");
      }
    },
    [],
  );
}
