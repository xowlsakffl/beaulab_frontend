"use client";

import React from "react";

import { useFormFieldFocus } from "@/hooks/common/useFormFieldFocus";
import { FIELD_FOCUS_ORDER, type NoticeFieldName, type NoticeFormErrors } from "@/lib/notice/form";

export function useNoticeFieldFocus() {
  const resolveTarget = React.useCallback((field: NoticeFieldName) => {
    if (field === "content") {
      return document.querySelector<HTMLElement>('[data-field-target="content"]');
    }

    if (field === "attachments") {
      return document.querySelector<HTMLElement>('[data-field-target="attachments"]');
    }

    return document.getElementById(field);
  }, []);

  return useFormFieldFocus<NoticeFieldName>({
    focusOrder: FIELD_FOCUS_ORDER,
    resolveTarget,
  }) as {
    focusField: (field: NoticeFieldName) => void;
    focusFirstErrorField: (errors: NoticeFormErrors) => void;
  };
}
