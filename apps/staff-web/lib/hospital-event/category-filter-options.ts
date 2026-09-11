import { isApiSuccess } from "@beaulab/types";

import { api } from "@/lib/common/api";
import type { CategoryApiItem } from "@/lib/common/category";
import { createCachedRequest } from "@/lib/common/request-cache";

const HOSPITAL_EVENT_CATEGORY_FILTER_OPTIONS_CACHE_TTL_MS = 5 * 60 * 1000;

export type HospitalEventCategoryFilterOptions = {
  major_categories: CategoryApiItem[];
  middle_categories_by_parent: Record<string, CategoryApiItem[]>;
};

type HospitalEventCategoryFilterOptionsApiResponse = {
  major_categories?: CategoryApiItem[] | null;
  middle_categories_by_parent?: Record<string, CategoryApiItem[]> | null;
};

const loadCategoryFilterOptions = createCachedRequest<HospitalEventCategoryFilterOptions>(
  HOSPITAL_EVENT_CATEGORY_FILTER_OPTIONS_CACHE_TTL_MS,
  "categories",
);

export async function fetchHospitalEventCategoryFilterOptions(): Promise<HospitalEventCategoryFilterOptions> {
  return loadCategoryFilterOptions("hospital-event:category-filter-options", async (signal) => {
    const response = await api.get<HospitalEventCategoryFilterOptionsApiResponse>(
      "/hospital-events/category-filter-options",
      undefined,
      { signal },
    );

    if (!isApiSuccess(response)) {
      throw new Error(response.error.message || "카테고리 필터를 불러오지 못했습니다.");
    }

    const options = {
      major_categories: response.data.major_categories ?? [],
      middle_categories_by_parent: response.data.middle_categories_by_parent ?? {},
    };

    return options;
  });
}
