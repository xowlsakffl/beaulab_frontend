"use client";

import React from "react";

import { Button, Card, InputField } from "@beaulab/ui-admin";

type HospitalWalletsFilterPanelProps = {
  searchInput: string;
  onSearchChange: (value: string) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
};

export function HospitalWalletsFilterPanel({
  searchInput,
  onSearchChange,
  onApplyFilters,
  onResetFilters,
}: HospitalWalletsFilterPanelProps) {
  return (
    <Card className="min-w-0 rounded-xl p-3">
      <div className="flex min-w-0 flex-col gap-3 py-1.5 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="w-[72px] shrink-0 text-right text-sm font-medium whitespace-nowrap text-gray-600">검색</span>
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
              placeholder="HID 또는 병의원명을 입력해 주세요."
              className="bg-white"
            />
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <Button type="button" variant="brand" size="filter" onClick={onApplyFilters} className="shrink-0">
            검색
          </Button>
          <Button type="button" variant="brandOutline" size="filter" onClick={onResetFilters} className="shrink-0">
            검색 초기화
          </Button>
        </div>
      </div>
    </Card>
  );
}
