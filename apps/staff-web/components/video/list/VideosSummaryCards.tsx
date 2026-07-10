"use client";

import { SummaryCountCard } from "@/components/common/SummaryCountCard";
import type { VideoSummary, VideoSummaryFilter } from "@/lib/video/list";

type VideosSummaryCardsProps = {
  summary: VideoSummary | null;
  activeKey?: VideoSummaryFilter | null;
  onSelect?: (key: VideoSummaryFilter) => void;
};

export function VideosSummaryCards({ summary, activeKey = null, onSelect }: VideosSummaryCardsProps) {
  const cards = [
    { key: "normal", label: "정상노출 동영상", value: summary?.normal_videos ?? 0 },
    { key: "limited", label: "노출제한 동영상", value: summary?.limited_videos ?? 0 },
    { key: "reported", label: "신고접수 동영상", value: summary?.reported_videos ?? 0 },
  ] satisfies Array<{ key: VideoSummaryFilter; label: string; value: number }>;

  return (
    <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3">
      {cards.map((card) => (
        <SummaryCountCard
          key={card.key}
          label={card.label}
          value={card.value}
          unit="개"
          pressed={activeKey === card.key}
          onClick={() => onSelect?.(card.key)}
        />
      ))}
    </div>
  );
}
