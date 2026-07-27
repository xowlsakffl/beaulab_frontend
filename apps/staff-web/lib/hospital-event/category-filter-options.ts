import { isApiSuccess } from "@beaulab/types";

import { api } from "@/lib/common/api";
import type { CategoryApiItem } from "@/lib/common/category";
import { getTimedCache, setTimedCache } from "@/lib/common/request-cache";

const HOSPITAL_EVENT_CATEGORY_FILTER_OPTIONS_CACHE_TTL_MS = 5 * 60 * 1000;

export type HospitalEventCategoryFilterOptions = {
  major_categories: CategoryApiItem[];
  middle_categories_by_parent: Record<string, CategoryApiItem[]>;
};

type HospitalEventCategoryFilterOptionsApiResponse = {
  major_categories?: CategoryApiItem[] | null;
  middle_categories_by_parent?: Record<string, CategoryApiItem[]> | null;
};

const categoryFilterOptionsCache = new Map<string, { expiresAt: number; value: HospitalEventCategoryFilterOptions }>();

export async function fetchHospitalEventCategoryFilterOptions(): Promise<HospitalEventCategoryFilterOptions> {
  const cacheKey = "hospital-event:category-filter-options";
  const cachedOptions = getTimedCache(categoryFilterOptionsCache, cacheKey);

  if (cachedOptions) {
    return cachedOptions;
  }

  const response = await api.get<HospitalEventCategoryFilterOptionsApiResponse>(
    "/hospital-events/category-filter-options",
  );

  if (!isApiSuccess(response)) {
    throw new Error(response.error.message || "카테고리 필터를 불러오지 못했습니다.");
  }

  const options = {
    major_categories: response.data.major_categories ?? [],
    middle_categories_by_parent: response.data.middle_categories_by_parent ?? {},
  };

  setTimedCache(categoryFilterOptionsCache, cacheKey, options, HOSPITAL_EVENT_CATEGORY_FILTER_OPTIONS_CACHE_TTL_MS);

  return options;
}
