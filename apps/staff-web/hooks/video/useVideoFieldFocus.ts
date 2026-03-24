"use client";

import React from "react";

import { useFormFieldFocus } from "@/hooks/common/useFormFieldFocus";
import { FIELD_FOCUS_ORDER, type VideoFieldName, type VideoFormErrors } from "@/lib/video/form";

export function useVideoFieldFocus() {
  const resolveTarget = React.useCallback((field: VideoFieldName) => {
    if (field === "hospital_id") {
      return document.querySelector<HTMLElement>('[data-field-target="hospital_id"]');
    }

    if (field === "doctor_id") {
      return document.getElementById("doctor_id");
    }

    if (field === "category_ids") {
      return document.querySelector<HTMLElement>('[data-field-target="category_ids"]');
    }

    if (field === "thumbnail_file") {
      return document.querySelector<HTMLElement>('[data-media-collection="thumbnail_file"]');
    }

    return document.getElementById(field);
  }, []);

  return useFormFieldFocus<VideoFieldName>({
    focusOrder: FIELD_FOCUS_ORDER,
    resolveTarget,
  }) as {
    focusField: (field: VideoFieldName) => void;
    focusFirstErrorField: (errors: VideoFormErrors) => void;
  };
}
