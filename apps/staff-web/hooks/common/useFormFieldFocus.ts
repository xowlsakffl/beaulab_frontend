"use client";

import React from "react";

type FormFieldErrors<FieldName extends string> = Partial<Record<FieldName, string | undefined>>;

type UseFormFieldFocusOptions<FieldName extends string> = {
  focusOrder: readonly FieldName[];
  resolveTarget: (field: FieldName) => HTMLElement | null;
};

export function useFormFieldFocus<FieldName extends string>({
  focusOrder,
  resolveTarget,
}: UseFormFieldFocusOptions<FieldName>) {
  const focusField = React.useCallback(
    (field: FieldName) => {
      const target = resolveTarget(field);
      if (!target) return;

      target.scrollIntoView({ behavior: "smooth", block: "center" });

      window.setTimeout(() => {
        target.focus({ preventScroll: true });
      }, 150);
    },
    [resolveTarget],
  );

  const focusFirstErrorField = React.useCallback(
    (errors: FormFieldErrors<FieldName>) => {
      const firstField =
        focusOrder.find((field) => Boolean(errors[field])) ??
        (Object.keys(errors).find((field): field is FieldName => Boolean(errors[field as FieldName])) ?? null);

      if (!firstField) return;
      focusField(firstField);
    },
    [focusField, focusOrder],
  );

  return {
    focusField,
    focusFirstErrorField,
  };
}
