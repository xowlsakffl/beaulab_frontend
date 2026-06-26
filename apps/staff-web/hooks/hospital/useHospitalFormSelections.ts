"use client";

import React from "react";

import {
  HOSPITAL_CATEGORY_MAX_SELECTION,
  type HospitalFieldName,
  type HospitalFormErrors,
  type HospitalFormValues,
} from "@/lib/hospital/form";

type UseHospitalFormSelectionsParams = {
  categoryIds: number[];
  setForm: React.Dispatch<React.SetStateAction<HospitalFormValues>>;
  setErrors: React.Dispatch<React.SetStateAction<HospitalFormErrors>>;
  clearError: (field: HospitalFieldName) => void;
};

export function useHospitalFormSelections({
  categoryIds,
  setForm,
  setErrors,
  clearError,
}: UseHospitalFormSelectionsParams) {
  const toggleCategory = React.useCallback(
    (categoryId: number, checked: boolean) => {
      if (checked && !categoryIds.includes(categoryId) && categoryIds.length >= HOSPITAL_CATEGORY_MAX_SELECTION) {
        setErrors((prev) => ({
          ...prev,
          category_ids: `진료과목은 최대 ${HOSPITAL_CATEGORY_MAX_SELECTION}개까지 선택할 수 있습니다.`,
        }));
        return;
      }

      setForm((prev) => ({
        ...prev,
        category_ids: checked
          ? prev.category_ids.includes(categoryId)
            ? prev.category_ids
            : [...prev.category_ids, categoryId]
          : prev.category_ids.filter((item) => item !== categoryId),
      }));
      clearError("category_ids");
    },
    [categoryIds, clearError, setErrors, setForm],
  );

  const toggleFeature = React.useCallback(
    (featureId: number, checked: boolean) => {
      setForm((prev) => ({
        ...prev,
        feature_ids: checked
          ? prev.feature_ids.includes(featureId)
            ? prev.feature_ids
            : [...prev.feature_ids, featureId]
          : prev.feature_ids.filter((item) => item !== featureId),
      }));
      clearError("feature_ids");
    },
    [clearError, setForm],
  );

  return {
    toggleCategory,
    toggleFeature,
  };
}
