"use client";

import React from "react";

import { api } from "@/lib/api";
import { normalizeCategoryItem, type CategoryApiItem } from "@/lib/hospital/form";
import { isApiSuccess } from "@beaulab/types";
import type { CategorySelectorItem, CategorySelectorLoadParams } from "@beaulab/ui-admin";

export function useHospitalCategoryLoader() {
  return React.useCallback(
    async ({ section, parentId, query, perPage }: CategorySelectorLoadParams): Promise<CategorySelectorItem[]> => {
      try {
        const response = await api.get<CategoryApiItem[]>("/categories/selector", {
          domain: section.domain,
          status: ["ACTIVE"],
          ...(query
            ? {
                q: query,
                per_page: perPage ?? 12,
              }
            : {}),
          ...(parentId !== undefined && parentId !== null ? { parent_id: parentId } : {}),
        });

        if (!isApiSuccess(response)) {
          throw new Error(response.error.message || "카테고리 목록을 불러오지 못했습니다.");
        }

        return response.data
          .filter((item) => item.status === "ACTIVE")
          .map(normalizeCategoryItem);
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
