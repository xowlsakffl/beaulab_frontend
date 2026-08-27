"use client";

import { SummaryCardsGrid, SummaryCountCard } from "@/components/common/SummaryCountCard";
import { STATUS_BADGE_COLORS } from "@/lib/common/status-badge-colors";
import type { VideoSummary, VideoSummaryFilter } from "@/lib/video/list";
import { CirclePlay, EyeOff, Siren, type BadgeColor, type LucideIcon } from "@beaulab/ui-admin";

type VideosSummaryCardsProps = {
  summary: VideoSummary | null;
  activeKey?: VideoSummaryFilter | null;
  onSelect?: (key: VideoSummaryFilter) => void;
};

export function VideosSummaryCards({ summary, activeKey = null, onSelect }: VideosSummaryCardsProps) {
  const cards = [
    {
      key: "normal",
      label: "정상노출 동영상",
      value: summary?.normal_videos ?? "-",
      icon: CirclePlay,
      color: STATUS_BADGE_COLORS.active,
    },
    {
      key: "limited",
      label: "노출제한 동영상",
      value: summary?.limited_videos ?? "-",
      icon: EyeOff,
      color: STATUS_BADGE_COLORS.inactive,
    },
    {
      key: "reported",
      label: "신고접수 동영상",
      value: summary?.reported_videos ?? "-",
      icon: Siren,
      color: STATUS_BADGE_COLORS.reportReceived,
    },
  ] satisfies ReadonlyArray<{
    key: VideoSummaryFilter;
    label: string;
    value: number | string;
    icon: LucideIcon;
    color: BadgeColor;
  }>;

  return (
    <SummaryCardsGrid className="grid-cols-1 sm:grid-cols-3">
      {cards.map((card) => (
        <SummaryCountCard
          key={card.key}
          label={card.label}
          value={card.value}
          unit="개"
          icon={card.icon}
          iconColor={card.color}
          pressed={activeKey === card.key}
          onClick={() => onSelect?.(card.key)}
        />
      ))}
    </SummaryCardsGrid>
  );
}
