import type { ChangeEvent } from "react";
import Link from "next/link";

import { Can } from "@/components/guard";
import { Button, Download, InputField, SlidersHorizontal, SquarePlus } from "@beaulab/ui-admin";

type HospitalsToolbarProps = {
  resetKey: number;
  searchInput: string;
  isFilterOpen: boolean;
  onSearchChange: (value: string) => void;
  onToggleFilters: () => void;
};

export function HospitalsToolbar({
  resetKey,
  searchInput,
  isFilterOpen,
  onSearchChange,
  onToggleFilters,
}: HospitalsToolbarProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <div className="w-full">
        <InputField
          key={`search-${resetKey}`}
          defaultValue={searchInput}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onSearchChange(event.target.value)}
          placeholder="ID, 병의원명, 연락처, 주소 검색"
          className="bg-white dark:bg-gray-800"
        />
      </div>

      <div className="flex shrink-0 items-center justify-end gap-2">
        <Button
          type="button"
          onClick={onToggleFilters}
          variant="outline"
          size="sm"
          className={[
            "h-11 border-brand-500 px-5",
            isFilterOpen ? "bg-brand-500 text-white hover:bg-brand-600" : "text-brand-500 hover:bg-gray-100",
          ].join(" ")}
        >
          <SlidersHorizontal className="size-5" />
          <span>필터</span>
        </Button>
        <Button type="button" variant="outline" size="sm" className="h-11 border-brand-500 px-5 text-brand-500 hover:bg-gray-100 dark:hover:bg-white/[0.06]">
          <Download className="size-5" />
          <span>다운로드</span>
        </Button>
        <Can permission="beaulab.hospital.create">
          <Link href="/hospitals/new">
            <Button type="button" variant="brand" size="sm" className="h-11 px-5">
              <SquarePlus className="size-5" />
              <span>병의원 등록</span>
            </Button>
          </Link>
        </Can>
      </div>
    </div>
  );
}
