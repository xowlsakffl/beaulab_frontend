"use client";

import React from "react";

import { fetchCategorySelectorItems } from "@/lib/common/category-selector";
import { normalizeCategorySelectorItem, type CategoryApiItem } from "@/lib/common/category";
import type { CategorySelectorItem, CategorySelectorLoadParams } from "@beaulab/ui-admin";

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
        const isRootRequest = parentId === undefined || parentId === null;
        const items = await fetchCategorySelectorItems({
          domain: section.domain,
          usage: isRootRequest ? section.usage : null,
          parentId: parentId ?? null,
          query,
          perPage,
          depth,
        });

        return items.filter((item: CategoryApiItem) => item.status === "ACTIVE").map(normalizeCategorySelectorItem);
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
