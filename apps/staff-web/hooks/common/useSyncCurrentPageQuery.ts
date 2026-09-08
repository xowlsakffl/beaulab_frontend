"use client";

import React from "react";

import { replaceCurrentPageUrl } from "@/lib/common/navigation/replaceCurrentPageUrl";

type SearchParamsLike = {
  toString: () => string;
};

export function useSyncCurrentPageQuery({
  pathname,
  queryString,
  searchParams,
  onNavigate,
}: {
  pathname: string;
  queryString: string;
  searchParams: SearchParamsLike;
  onNavigate: (params: URLSearchParams) => void;
}) {
  const search = searchParams.toString();
  const previousUrlRef = React.useRef(normalizeQuery(search));
  const onNavigateRef = React.useRef(onNavigate);
  React.useLayoutEffect(() => {
    onNavigateRef.current = onNavigate;
  }, [onNavigate]);

  React.useEffect(() => {
    const currentParams = new URLSearchParams(window.location.search);
    const currentUrl = normalizeQuery(currentParams.toString());
    if (currentUrl !== previousUrlRef.current) {
      previousUrlRef.current = currentUrl;
      onNavigateRef.current(currentParams);
      return;
    }

    const nextUrl = normalizeQuery(queryString);
    if (nextUrl === currentUrl) return;

    previousUrlRef.current = nextUrl;
    replaceCurrentPageUrl(queryString ? `${pathname}?${queryString}` : pathname);
  }, [pathname, queryString, search]);
}

function normalizeQuery(query: string) {
  const params = new URLSearchParams(query);
  params.delete("highlight");
  params.sort();
  return params.toString();
}
