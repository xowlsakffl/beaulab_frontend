"use client";

import React from "react";

import { useFormFieldFocus } from "@/hooks/common/useFormFieldFocus";
import { FIELD_FOCUS_ORDER, type HospitalFieldName, type HospitalFormErrors } from "@/lib/hospital/form";

export function useHospitalFieldFocus() {
  const resolveTarget = React.useCallback((field: HospitalFieldName) => {
    const normalizedField: HospitalFieldName = field === "latitude" || field === "longitude" ? "address" : field;

    if (normalizedField === "category_ids") {
      return document.querySelector<HTMLElement>('[data-field-target="category_ids"]');
    }

    if (normalizedField === "feature_ids") {
      return document.querySelector<HTMLElement>('[data-field-target="feature_ids"]');
    }

    if (normalizedField === "logo" || normalizedField === "gallery") {
      return document.querySelector<HTMLElement>(`[data-media-collection="${normalizedField}"]`);
    }

    return document.getElementById(normalizedField);
  }, []);

  return useFormFieldFocus<HospitalFieldName>({
    focusOrder: FIELD_FOCUS_ORDER,
    resolveTarget,
  }) as {
    focusField: (field: HospitalFieldName) => void;
    focusFirstErrorField: (errors: HospitalFormErrors) => void;
  };
}
