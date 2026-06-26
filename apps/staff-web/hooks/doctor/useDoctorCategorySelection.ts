"use client";

import React from "react";
import type { CategorySelectorItem } from "@beaulab/ui-admin";

import { useCategorySelectorLoader } from "@/hooks/common/useCategorySelectorLoader";
import {
  DOCTOR_CATEGORY_SECTIONS,
  MAX_DOCTOR_CATEGORY_SELECTION,
  type DoctorFieldName,
  type DoctorFormErrors,
  type DoctorFormValues,
} from "@/lib/doctor/form";

type DoctorCategoryOption = CategorySelectorItem & {
  domain?: string | null;
};

type UseDoctorCategorySelectionParams = {
  categoryIds: number[];
  setForm: React.Dispatch<React.SetStateAction<DoctorFormValues>>;
  setErrors: React.Dispatch<React.SetStateAction<DoctorFormErrors>>;
  clearError: (field: DoctorFieldName) => void;
};

export function useDoctorCategorySelection({
  categoryIds,
  setForm,
  setErrors,
  clearError,
}: UseDoctorCategorySelectionParams) {
  const loadCategories = useCategorySelectorLoader();
  const [categoryOptions, setCategoryOptions] = React.useState<DoctorCategoryOption[]>([]);
  const [isCategoryLoading, setIsCategoryLoading] = React.useState(false);
  const [categoryLoadError, setCategoryLoadError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    const loadRootCategories = async () => {
      setIsCategoryLoading(true);
      setCategoryLoadError(null);

      try {
        const results = await Promise.all(
          DOCTOR_CATEGORY_SECTIONS.map(async (section) => {
            const items = await loadCategories({ section });

            return items.map((item) => ({
              ...item,
              domain: section.domain,
              full_path: item.name,
              has_children: false,
            }));
          }),
        );

        if (!isMounted) return;

        setCategoryOptions(results.flat());
      } catch {
        if (!isMounted) return;

        setCategoryLoadError("진료분야를 불러오지 못했습니다.");
      } finally {
        if (isMounted) {
          setIsCategoryLoading(false);
        }
      }
    };

    void loadRootCategories();

    return () => {
      isMounted = false;
    };
  }, [loadCategories]);

  const toggleCategory = React.useCallback(
    (categoryId: number, checked: boolean) => {
      if (checked && !categoryIds.includes(categoryId) && categoryIds.length >= MAX_DOCTOR_CATEGORY_SELECTION) {
        setErrors((current) => ({
          ...current,
          category_ids: `진료분야는 최대 ${MAX_DOCTOR_CATEGORY_SELECTION}개까지 선택할 수 있습니다.`,
        }));
        return;
      }

      setForm((prev) => {
        if (checked) {
          if (prev.category_ids.includes(categoryId)) return prev;

          return {
            ...prev,
            category_ids: [...prev.category_ids, categoryId],
          };
        }

        return {
          ...prev,
          category_ids: prev.category_ids.filter((item) => item !== categoryId),
        };
      });
      clearError("category_ids");
    },
    [categoryIds, clearError, setErrors, setForm],
  );

  return {
    categoryOptions,
    isCategoryLoading,
    categoryLoadError,
    toggleCategory,
  };
}
