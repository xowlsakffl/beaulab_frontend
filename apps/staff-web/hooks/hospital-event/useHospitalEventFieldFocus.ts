"use client";

import React from "react";

import { useFormFieldFocus } from "@/hooks/common/useFormFieldFocus";
import {
  HOSPITAL_EVENT_FIELD_FOCUS_ORDER,
  type HospitalEventFieldName,
  type HospitalEventFormErrors,
} from "@/lib/hospital-event/form";

export function useHospitalEventFieldFocus() {
  const resolveTarget = React.useCallback((field: HospitalEventFieldName) => {
    if (field === "primary_category_id") {
      return document.querySelector<HTMLElement>('[data-field-target="category_ids"]');
    }

    return document.querySelector<HTMLElement>(`[data-field-target="${field}"]`) ?? document.getElementById(field);
  }, []);

  return useFormFieldFocus<HospitalEventFieldName>({
    focusOrder: HOSPITAL_EVENT_FIELD_FOCUS_ORDER,
    resolveTarget,
  }) as {
    focusField: (field: HospitalEventFieldName) => void;
    focusFirstErrorField: (errors: HospitalEventFormErrors) => void;
  };
}
