"use client";

import React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button, SpinnerBlock } from "@beaulab/ui-admin";
import { PromotionFilterPanel } from "@/components/hospital-promotion/list/PromotionFilterPanel";
import { PromotionDataTable, promotionRows } from "@/components/hospital-promotion/list/PromotionDataTable";
import { useSyncCurrentPageQuery } from "@/hooks/common/useSyncCurrentPageQuery";
import { useHospitalPromotionList } from "@/hooks/hospital-promotion/useHospitalPromotionList";
import {
  EMPTY_PROMOTION_FILTERS,
  parsePromotionListQuery,
  promotionFilters,
  promotionListSearch,
  type PromotionFilters,
} from "@/lib/hospital-promotion/list";
import { PROMOTION_PATH, type HospitalPromotion } from "@/lib/hospital-promotion/types";

const TABS = [
  { value: "active", label: "진행중·진행예정" },
  { value: "ended", label: "진행종료" },
] as const;

export default function HospitalPromotionsClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = React.useState(() => parsePromotionListQuery(new URLSearchParams(searchParams.toString())));
  const [filters, setFilters] = React.useState<PromotionFilters>(() => promotionFilters(query));
  const [highlightedId] = React.useState(() => Number(searchParams.get("highlight")) || null);
  const { result, loading, refreshing, error, retry } = useHospitalPromotionList(query);
  const queryString = promotionListSearch(query);
  const returnTo = queryString ? `${pathname}?${queryString}` : pathname;
  const openDetail = (promotion: HospitalPromotion) => {
    router.push(`${PROMOTION_PATH}/${promotion.id}?returnTo=${encodeURIComponent(returnTo)}`);
  };

  useSyncCurrentPageQuery({
    pathname,
    queryString,
    searchParams,
    onNavigate: (params) => {
      const next = parsePromotionListQuery(params);
      setQuery(next);
      setFilters(promotionFilters(next));
    },
  });

  const changePage = (key: "left_page" | "right_page" | "page", page: number) => {
    setQuery((previous) => ({ ...previous, [key]: page }));
  };

  const applyFilters = (next: PromotionFilters) => {
    setQuery((previous) => ({ ...previous, ...next, q: next.q.trim(), left_page: 1, right_page: 1, page: 1 }));
  };

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-wrap items-center gap-2" aria-label="프로모션 진행상태">
        {TABS.map((tab) => (
          <Button
            key={tab.value}
            type="button"
            variant={query.tab === tab.value ? "brand" : "outline"}
            size="sm"
            className="h-10 min-w-[88px] px-5"
            aria-pressed={query.tab === tab.value}
            onClick={() =>
              setQuery((previous) => ({ ...previous, tab: tab.value, left_page: 1, right_page: 1, page: 1 }))
            }
          >
            {tab.label}
          </Button>
        ))}
      </div>
      <PromotionFilterPanel
        filters={filters}
        onChange={setFilters}
        onSearch={() => applyFilters(filters)}
        onReset={() => {
          setFilters(EMPTY_PROMOTION_FILTERS);
          applyFilters(EMPTY_PROMOTION_FILTERS);
        }}
        onCreate={
          query.tab === "active"
            ? () => router.push(`${PROMOTION_PATH}/new?returnTo=${encodeURIComponent(returnTo)}`)
            : undefined
        }
      />

      {loading ? (
        <SpinnerBlock className="min-h-[360px]" spinnerClassName="size-9" />
      ) : error ? (
        <div role="alert" className="flex min-h-[260px] flex-col items-center justify-center gap-4">
          <p className="text-sm text-error-600">{error}</p>
          <Button variant="outline" size="sm" onClick={() => void retry()}>
            다시 불러오기
          </Button>
        </div>
      ) : result?.tab === "active" ? (
        <div className="grid min-w-0 grid-cols-1 items-start gap-x-6 gap-y-5 xl:grid-cols-2">
          {(["left", "right"] as const).map((side) => {
            const section = result.board[side];
            return (
              <section
                key={side}
                className="min-w-0 space-y-4"
                aria-label={side === "left" ? "좌측 배너" : "우측 배너"}
              >
                <PromotionDataTable
                  title={`공지사항 배너 [${side === "left" ? "좌" : "우"}]`}
                  description="진행중"
                  rows={section.current.map((slot) => ({ ...slot, id: `${side}-${slot.slot}` }))}
                  onOpenDetail={openDetail}
                  highlightedId={highlightedId}
                />
              </section>
            );
          })}
          <hr className="col-span-full my-1 border-gray-200" />
          {(["left", "right"] as const).map((side) => {
            const upcoming = result.board[side].upcoming;
            return (
              <section
                key={side}
                className="min-w-0 space-y-4"
                aria-label={`${side === "left" ? "좌측" : "우측"} 배너 대기목록`}
              >
                <PromotionDataTable
                  title={`[${side === "left" ? "좌" : "우"}] 배너 대기목록`}
                  upcoming
                  rows={promotionRows(upcoming.items)}
                  meta={upcoming.meta}
                  onGoPage={(page) => changePage(side === "left" ? "left_page" : "right_page", page)}
                  refreshing={refreshing}
                  onOpenDetail={openDetail}
                  highlightedId={highlightedId}
                />
              </section>
            );
          })}
        </div>
      ) : result?.tab === "ended" ? (
        <PromotionDataTable
          rows={promotionRows(result.items)}
          ended
          meta={result.meta}
          onGoPage={(page) => changePage("page", page)}
          refreshing={refreshing}
          onOpenDetail={openDetail}
          highlightedId={highlightedId}
        />
      ) : null}
    </div>
  );
}
