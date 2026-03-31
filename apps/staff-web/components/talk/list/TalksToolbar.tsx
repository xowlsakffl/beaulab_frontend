import type { ChangeEvent } from "react";

import { Button, InputField, SlidersHorizontal } from "@beaulab/ui-admin";

type TalksToolbarProps = {
  searchInput: string;
  isFilterOpen: boolean;
  onSearchChange: (value: string) => void;
  onToggleFilters: () => void;
};

export function TalksToolbar({
  searchInput,
  isFilterOpen,
  onSearchChange,
  onToggleFilters,
}: TalksToolbarProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <div className="w-full">
        <InputField
          value={searchInput}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onSearchChange(event.target.value)}
          placeholder="제목, 내용 검색"
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
      </div>
    </div>
  );
}
