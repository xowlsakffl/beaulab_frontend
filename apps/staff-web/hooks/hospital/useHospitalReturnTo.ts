"use client";

import React from "react";
import type { ReadonlyURLSearchParams } from "next/navigation";

export function useHospitalReturnTo(searchParams: ReadonlyURLSearchParams, fallbackPath = "/hospitals") {
  return React.useCallback(
    (highlightId?: number) => {
      const rawReturnTo = searchParams.get("returnTo");
      const safeBasePath = rawReturnTo?.startsWith("/hospitals") ? rawReturnTo : fallbackPath;
      const [basePath, rawQuery = ""] = safeBasePath.split("?");
      const nextSearchParams = new URLSearchParams(rawQuery);

      if (highlightId !== undefined) {
        nextSearchParams.set("highlight", String(highlightId));
      }

      const nextQuery = nextSearchParams.toString();
      return nextQuery ? `${basePath}?${nextQuery}` : basePath;
    },
    [fallbackPath, searchParams],
  );
}
