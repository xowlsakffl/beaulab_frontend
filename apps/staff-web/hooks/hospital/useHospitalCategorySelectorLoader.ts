"use client";

import { useCategorySelectorLoader } from "@/hooks/common/useCategorySelectorLoader";
import type { CategorySelectorItem, CategorySelectorLoadParams } from "@beaulab/ui-admin";
import React from "react";

export function useHospitalCategorySelectorLoader() {
  const loadCategories = useCategorySelectorLoader();

  return React.useCallback(
    async (params: CategorySelectorLoadParams): Promise<CategorySelectorItem[]> => {
      if (params.parentId !== undefined && params.parentId !== null) {
        return [];
      }

      const items = await loadCategories({ ...params, parentId: undefined });

      return items.map((item) => ({
        ...item,
        full_path: item.name,
        has_children: false,
      }));
    },
    [loadCategories],
  );
}
