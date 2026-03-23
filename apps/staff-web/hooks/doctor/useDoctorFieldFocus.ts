"use client";

import React from "react";

import { useFormFieldFocus } from "@/hooks/common/useFormFieldFocus";
import { FIELD_FOCUS_ORDER, type DoctorFieldName, type DoctorFormErrors } from "@/lib/doctor/form";

export function useDoctorFieldFocus() {
  const resolveTarget = React.useCallback((field: DoctorFieldName) => {
    if (field === "hospital_id") {
      return document.querySelector<HTMLElement>('[data-field-target="hospital_id"]');
    }

    if (field === "category_ids") {
      return document.querySelector<HTMLElement>('[data-field-target="category_ids"]');
    }

    if (field === "profile_image") {
      return document.querySelector<HTMLElement>('[data-media-collection="profile_image"]');
    }

    if (["license_image", "specialist_certificate_image", "education_certificate_image", "etc_certificate_image"].includes(field)) {
      return document.querySelector<HTMLElement>(`[data-field-target="${field}"]`);
    }

    return document.getElementById(field);
  }, []);

  return useFormFieldFocus<DoctorFieldName>({
    focusOrder: FIELD_FOCUS_ORDER,
    resolveTarget,
  }) as {
    focusField: (field: DoctorFieldName) => void;
    focusFirstErrorField: (errors: DoctorFormErrors) => void;
  };
}
