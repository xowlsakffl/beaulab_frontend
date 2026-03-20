"use client";

import React from "react";

import { FIELD_FOCUS_ORDER, type HospitalFieldName, type HospitalFormErrors } from "@/lib/hospital/form";

export function useHospitalFieldFocus() {
  const focusField = React.useCallback((field: HospitalFieldName) => {
    const normalizedField: HospitalFieldName = field === "latitude" || field === "longitude" ? "address" : field;

    const target =
      normalizedField === "category_ids"
        ? document.querySelector<HTMLElement>('[data-field-target="category_ids"]')
        : normalizedField === "logo" || normalizedField === "gallery"
          ? document.querySelector<HTMLElement>(`[data-media-collection="${normalizedField}"]`)
          : document.getElementById(normalizedField);

    if (!target) return;

    target.scrollIntoView({ behavior: "smooth", block: "center" });

    window.setTimeout(() => {
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLButtonElement) {
        target.focus({ preventScroll: true });
        return;
      }

      if ("focus" in target) {
        target.focus({ preventScroll: true });
      }
    }, 150);
  }, []);

  const focusFirstErrorField = React.useCallback(
    (nextErrors: HospitalFormErrors) => {
      const firstField =
        FIELD_FOCUS_ORDER.find((field) => Boolean(nextErrors[field])) ??
        (Object.keys(nextErrors).find((field): field is HospitalFieldName => Boolean(nextErrors[field as HospitalFieldName])) ?? null);

      if (!firstField) return;
      focusField(firstField);
    },
    [focusField],
  );

  return {
    focusField,
    focusFirstErrorField,
  };
}
