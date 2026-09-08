"use client";

import React from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { replaceCurrentPageUrl } from "@/lib/common/navigation/replaceCurrentPageUrl";

export function usePostDetailPagination(perPageOptions: readonly number[]) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const defaultPerPage = perPageOptions.includes(10) ? 10 : (perPageOptions[0] ?? 10);
  const requestedPerPage = Number(searchParams.get("comments_per_page"));
  const commentsPerPage = perPageOptions.includes(requestedPerPage) ? requestedPerPage : defaultPerPage;
  const commentsPage = parsePage(searchParams.get("comments_page"));
  const historiesPage = parsePage(searchParams.get("operation_histories_page"));

  const navigate = React.useCallback(
    (values: Record<string, number>) => {
      const params = new URLSearchParams(window.location.search);
      for (const [name, value] of Object.entries(values)) {
        if (value === (name === "comments_per_page" ? defaultPerPage : 1)) params.delete(name);
        else params.set(name, String(value));
      }
      const query = params.toString();
      replaceCurrentPageUrl(query ? `${pathname}?${query}` : pathname);
    },
    [defaultPerPage, pathname],
  );

  const changeCommentsPage = React.useCallback((page: number) => navigate({ comments_page: page }), [navigate]);
  const changeHistoriesPage = React.useCallback(
    (page: number) => navigate({ operation_histories_page: page }),
    [navigate],
  );
  const changeCommentsPerPage = React.useCallback(
    (value: number) => {
      if (perPageOptions.includes(value)) navigate({ comments_page: 1, comments_per_page: value });
    },
    [navigate, perPageOptions],
  );

  return {
    commentsPage,
    historiesPage,
    commentsPerPage,
    changeCommentsPage,
    changeHistoriesPage,
    changeCommentsPerPage,
  };
}

function parsePage(value: string | null) {
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}
