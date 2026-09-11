import { isApiSuccess } from "@beaulab/types";

import { api } from "@/lib/common/api";
import type { CategoryApiItem } from "@/lib/common/category";
import { createCachedRequest } from "@/lib/common/request-cache";

export const CATEGORY_SELECTOR_CACHE_TTL_MS = 5 * 60 * 1000;

type FetchCategorySelectorItemsParams = {
  domain: string;
  usage?: string | null;
  parentId?: string | number | null;
  query?: string | null;
  perPage?: number | null;
  depth?: number | null;
  status?: readonly string[];
  cacheTtlMs?: number;
};

const loadCategorySelectorItems = createCachedRequest<CategoryApiItem[]>(CATEGORY_SELECTOR_CACHE_TTL_MS, "categories");

function buildCategorySelectorCacheKey({
  domain,
  usage,
  parentId,
  query,
  perPage,
  depth,
  status,
}: Required<Omit<FetchCategorySelectorItemsParams, "cacheTtlMs">>) {
  return JSON.stringify({
    domain,
    usage,
    parentId,
    query,
    perPage,
    depth,
    status,
  });
}

export async function fetchCategorySelectorItems({
  domain,
  usage = null,
  parentId = null,
  query = null,
  perPage = null,
  depth = null,
  status = ["ACTIVE"],
  cacheTtlMs = CATEGORY_SELECTOR_CACHE_TTL_MS,
}: FetchCategorySelectorItemsParams): Promise<CategoryApiItem[]> {
  const trimmedQuery = query?.trim() ?? "";
  const normalizedStatus = [...status].sort();
  const cacheKey = buildCategorySelectorCacheKey({
    domain,
    usage: usage ?? "",
    parentId: parentId ?? null,
    query: trimmedQuery,
    perPage,
    depth,
    status: normalizedStatus,
  });
  return loadCategorySelectorItems(
    cacheKey,
    async (signal) => {
      const response = await api.get<CategoryApiItem[]>(
        "/categories/selector",
        {
          domain,
          status: normalizedStatus,
          ...(usage && parentId === null ? { usage } : {}),
          ...(trimmedQuery ? { q: trimmedQuery, per_page: perPage ?? 12 } : {}),
          ...(!trimmedQuery && perPage ? { per_page: perPage } : {}),
          ...(depth ? { depth } : {}),
          ...(parentId !== null ? { parent_id: parentId } : {}),
        },
        { signal },
      );

      if (!isApiSuccess(response)) {
        throw new Error(response.error.message || "카테고리 목록을 불러오지 못했습니다.");
      }

      return response.data;
    },
    cacheTtlMs,
  );
}
