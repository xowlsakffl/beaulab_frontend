"use client";

import React from "react";
import type { CategorySelectorItem, CategorySelectorLoadParams } from "@beaulab/ui-admin";

import { useCategorySelectorLoader } from "@/hooks/common/useCategorySelectorLoader";
import {
  HOSPITAL_EVENT_CATEGORY_SECTIONS,
  INITIAL_HOSPITAL_EVENT_CATEGORY_SECTION_KEY,
  normalizeHospitalEventCategoryUsage,
  type HospitalEventCategoryUsage,
  type HospitalEventFieldName,
  type HospitalEventFormErrors,
  type HospitalEventFormValues,
} from "@/lib/hospital-event/form";
import type { HospitalEventCategory } from "@/lib/hospital-event/list";

export type HospitalEventCachedCategoryItem = CategorySelectorItem & {
  usage?: HospitalEventCategoryUsage;
};

type UseHospitalEventCategorySelectionParams = {
  categoryIds: number[];
  setForm: React.Dispatch<React.SetStateAction<HospitalEventFormValues>>;
  setErrors: React.Dispatch<React.SetStateAction<HospitalEventFormErrors>>;
  clearError: (field: HospitalEventFieldName) => void;
};

export function useHospitalEventCategorySelection({
  categoryIds,
  setForm,
  setErrors,
  clearError,
}: UseHospitalEventCategorySelectionParams) {
  const baseLoadCategories = useCategorySelectorLoader();
  const [categoryCache, setCategoryCache] = React.useState<Record<number, HospitalEventCachedCategoryItem>>({});
  const [categorySectionKey, setCategorySectionKey] = React.useState(INITIAL_HOSPITAL_EVENT_CATEGORY_SECTION_KEY);
  const [pendingCategorySectionKey, setPendingCategorySectionKey] = React.useState<string | null>(null);

  const selectedCategoryItems = React.useMemo(
    () => categoryIds.map((categoryId) => categoryCache[categoryId]).filter(Boolean),
    [categoryCache, categoryIds],
  );

  const selectedCategoryUsage = React.useMemo<HospitalEventCategoryUsage | null>(() => {
    const usages = new Set(
      categoryIds
        .map((categoryId) => categoryCache[categoryId]?.usage)
        .filter((usage): usage is HospitalEventCategoryUsage => Boolean(usage)),
    );

    return usages.size === 1 ? Array.from(usages)[0] : null;
  }, [categoryCache, categoryIds]);

  const isTreatmentEvent = categorySectionKey === "treatment" || selectedCategoryUsage === "HOSPITAL_EVENT_TREATMENT";

  const loadEventCategories = React.useCallback(
    async (params: CategorySelectorLoadParams): Promise<CategorySelectorItem[]> => {
      const items = await baseLoadCategories(params);
      const usage = params.section.usage as HospitalEventCategoryUsage | undefined;

      setCategoryCache((prev) => {
        let changed = false;
        const next = { ...prev };

        items.forEach((item) => {
          const cached = next[item.id];
          if (cached && cached.name === item.name && cached.full_path === item.full_path && cached.usage === usage) {
            return;
          }

          changed = true;
          next[item.id] = { ...item, usage };
        });

        return changed ? next : prev;
      });

      return items;
    },
    [baseLoadCategories],
  );

  const applyDetailCategories = React.useCallback((categories: HospitalEventCategory[] | null | undefined) => {
    const detailCategories = categories ?? [];

    setCategoryCache((prev) => {
      const next = { ...prev };

      detailCategories.forEach((category) => {
        if (!category.id) return;

        next[category.id] = {
          id: category.id,
          name: category.name?.trim() || "-",
          full_path: category.full_path?.trim() || category.name?.trim() || "-",
          depth: Number(category.depth ?? 3),
          has_children: false,
          usage: normalizeHospitalEventCategoryUsage(category.usage),
        };
      });

      return next;
    });

    const categoryUsage = normalizeHospitalEventCategoryUsage(
      detailCategories.find((category) => category.usage)?.usage,
    );
    const sectionKey = HOSPITAL_EVENT_CATEGORY_SECTIONS.find((section) => section.usage === categoryUsage)?.key;
    setCategorySectionKey(sectionKey ?? INITIAL_HOSPITAL_EVENT_CATEGORY_SECTION_KEY);
  }, []);

  const toggleCategory = React.useCallback(
    (categoryId: number, checked: boolean) => {
      const category = categoryCache[categoryId];
      const nextUsage = category?.usage;

      if (checked && category?.has_children) {
        setErrors((prev) => ({ ...prev, category_ids: "이벤트 카테고리는 소분류만 선택할 수 있습니다." }));
        return;
      }

      if (checked && categoryIds.length >= 3 && !categoryIds.includes(categoryId)) {
        setErrors((prev) => ({ ...prev, category_ids: "카테고리는 최대 3개까지 선택할 수 있습니다." }));
        return;
      }

      if (checked && selectedCategoryUsage && nextUsage && selectedCategoryUsage !== nextUsage) return;

      setForm((prev) => {
        if (checked) {
          if (prev.category_ids.includes(categoryId)) return prev;

          return {
            ...prev,
            category_ids: [...prev.category_ids, categoryId],
          };
        }

        const nextCategoryIds = prev.category_ids.filter((id) => id !== categoryId);
        return {
          ...prev,
          category_ids: nextCategoryIds,
          primary_category_id: prev.primary_category_id === categoryId ? null : prev.primary_category_id,
          has_options: nextCategoryIds.length === 0 ? false : prev.has_options,
        };
      });
      clearError("category_ids");
      clearError("primary_category_id");
    },
    [categoryCache, categoryIds, clearError, selectedCategoryUsage, setErrors, setForm],
  );

  const requestCategorySectionChange = React.useCallback(
    (sectionKey: string, currentSectionKey: string) => {
      if (sectionKey === currentSectionKey) return true;

      if (categoryIds.length > 0) {
        setPendingCategorySectionKey(sectionKey);
        return false;
      }

      setCategorySectionKey(sectionKey);
      return true;
    },
    [categoryIds.length],
  );

  const closeCategorySectionConfirmModal = React.useCallback(() => {
    setPendingCategorySectionKey(null);
  }, []);

  const confirmCategorySectionChange = React.useCallback(() => {
    if (!pendingCategorySectionKey) return;

    setForm((prev) => ({
      ...prev,
      category_ids: [],
      primary_category_id: null,
      has_options: false,
    }));
    setErrors((prev) => {
      if (!prev.category_ids && !prev.primary_category_id) return prev;

      const next = { ...prev };
      delete next.category_ids;
      delete next.primary_category_id;
      return next;
    });
    setCategorySectionKey(pendingCategorySectionKey);
    setPendingCategorySectionKey(null);
  }, [pendingCategorySectionKey, setErrors, setForm]);

  return {
    categorySectionKey,
    pendingCategorySectionKey,
    selectedCategoryItems,
    selectedCategoryUsage,
    isTreatmentEvent,
    loadEventCategories,
    applyDetailCategories,
    toggleCategory,
    requestCategorySectionChange,
    closeCategorySectionConfirmModal,
    confirmCategorySectionChange,
  };
}
