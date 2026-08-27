import React from "react";
import { Button, Card, CheckboxFilterDropdown, InputField, SquarePlus } from "@beaulab/ui-admin";

import { HASHTAG_STATUS_OPTIONS, type Filters } from "@/lib/hashtag/list";

type HashtagsFilterPanelProps = {
  searchInput: string;
  draftFilters: Filters;
  isStatusDropdownOpen: boolean;
  statusDropdownRef: React.RefObject<HTMLDivElement | null>;
  onSearchChange: (value: string) => void;
  onOpenCreate: () => void;
  onToggleStatusDropdown: () => void;
  onToggleStatus: (value: string) => void;
  onToggleAllStatus: () => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
};

export function HashtagsFilterPanel({
  searchInput,
  draftFilters,
  isStatusDropdownOpen,
  statusDropdownRef,
  onSearchChange,
  onOpenCreate,
  onToggleStatusDropdown,
  onToggleStatus,
  onToggleAllStatus,
  onApplyFilters,
  onResetFilters,
}: HashtagsFilterPanelProps) {
  const filterRowClass = "flex min-w-0 items-center gap-3";
  const inlineLabelClass = "w-[72px] shrink-0 whitespace-nowrap text-right text-sm font-medium text-gray-600";

  return (
    <Card className="min-w-0 rounded-xl p-3">
      <div className="space-y-3">
        <div className="grid min-w-0 gap-x-4 gap-y-3 md:grid-cols-2 xl:grid-cols-4">
          <div className={filterRowClass}>
            <span className={inlineLabelClass}>운영 상태</span>
            <div className="min-w-0 flex-1">
              <CheckboxFilterDropdown
                label="운영 상태"
                hideLabel
                containerRef={statusDropdownRef}
                selectedValues={draftFilters.statuses}
                options={HASHTAG_STATUS_OPTIONS}
                isOpen={isStatusDropdownOpen}
                onToggleOpen={onToggleStatusDropdown}
                onToggleValue={onToggleStatus}
                onToggleAll={onToggleAllStatus}
              />
            </div>
          </div>
          <div className="flex min-w-0 flex-col gap-3 py-1.5 md:col-span-2 xl:col-span-3 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span className={inlineLabelClass}>검색</span>
              <div className="min-w-0 flex-1">
                <InputField
                  value={searchInput}
                  onChange={(event) => onSearchChange(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      onApplyFilters();
                    }
                  }}
                  placeholder="해시태그명 검색"
                  className="bg-white"
                />
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
              <Button type="button" variant="brand" onClick={onApplyFilters} size="filter" className="shrink-0">
                검색
              </Button>
              <Button type="button" variant="brandOutline" size="filter" onClick={onResetFilters} className="shrink-0">
                검색 초기화
              </Button>
              <Button type="button" variant="brand" size="filter" onClick={onOpenCreate}>
                <SquarePlus className="size-5" />
                <span>해시태그 등록</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
