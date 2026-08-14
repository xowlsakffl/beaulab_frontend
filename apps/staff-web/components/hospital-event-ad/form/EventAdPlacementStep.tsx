"use client";

import { Card, SegmentedTabs } from "@beaulab/ui-admin";

import {
  EVENT_AD_PLACEMENT_GROUPS,
  type EventAdPlacementGroupKey,
  type EventAdPlacementOption,
} from "@/lib/hospital-event-ad/form";

export function EventAdPlacementStep({
  activeGroup,
  placementOptions,
  onGroupChange,
  onSelectPlacement,
}: {
  activeGroup: EventAdPlacementGroupKey;
  placementOptions: EventAdPlacementOption[];
  onGroupChange: (group: EventAdPlacementGroupKey) => void;
  onSelectPlacement: (placement: EventAdPlacementOption) => void;
}) {
  return (
    <Card className="rounded-xl p-8">
      <div className="space-y-8">
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-gray-900">원하는 광고 위치를 선택해주세요</h2>
          <p className="text-sm text-gray-500">원하는 위치의 광고를 일주일동안 노출시켜드립니다.</p>
        </div>

        <SegmentedTabs
          items={EVENT_AD_PLACEMENT_GROUPS.map((group) => ({ value: group.key, label: group.label }))}
          value={activeGroup}
          onValueChange={onGroupChange}
          className="w-fit min-w-[27rem] rounded-lg border border-gray-200 p-0.5"
          tabClassName="h-11 min-w-24 rounded-md px-4 py-2.5 text-sm font-semibold"
          activeTabClassName="bg-brand-500 text-white shadow-sm"
          inactiveTabClassName="text-gray-500 hover:text-brand-500"
        />

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {placementOptions.map((placement) => (
            <PlacementCard key={placement.value} placement={placement} onClick={() => onSelectPlacement(placement)} />
          ))}
        </div>
      </div>
    </Card>
  );
}

function PlacementCard({ placement, onClick }: { placement: EventAdPlacementOption; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group min-h-32 min-w-0 rounded-xl border border-gray-200 bg-white p-5 text-left transition hover:border-brand-400 hover:bg-brand-50/40 hover:shadow-md"
    >
      <div className="space-y-2">
        <p className="text-sm font-bold text-gray-900">{placement.label}</p>
      </div>
    </button>
  );
}
