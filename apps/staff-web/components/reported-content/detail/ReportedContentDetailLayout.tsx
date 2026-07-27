"use client";

import React from "react";
import { type DataTableMeta } from "@beaulab/ui-admin";

import { MediaPreviewModal, type MediaPreviewState } from "@/components/common/MediaPreviewModal";
import { type OperationHistoryLike } from "@/components/common/OperationHistoryDisplay";
import type {
  ReportedContentDetailResponse,
  ReportedContentReportsBlock,
  ReportedContentTargetType,
} from "@/lib/reported-content/detail";

import { ReportedContentDetailPanel } from "./ReportedContentDetailPanel";
import { ReportedOriginalHistoryCard } from "./ReportedOriginalHistoryCard";

type ReportedContentDetailLayoutHistory = OperationHistoryLike & {
  id?: number | string | null;
  actor_label?: string | null;
};

type ReportedContentDetailLayoutProps<THistory extends ReportedContentDetailLayoutHistory> = {
  actionError: string | null;
  topContent?: React.ReactNode;
  leftContent: React.ReactNode;
  rightContent?: React.ReactNode;
  gridClassName?: string;
  histories: THistory[];
  historiesMeta: DataTableMeta | null;
  historiesRefreshing: boolean;
  formatHistoryDate: (history: THistory) => string;
  onHistoryPageChange: (page: number) => void;
  targetType: ReportedContentTargetType;
  targetId: number;
  reportedDetail: ReportedContentDetailResponse | null;
  reportedReports: ReportedContentReportsBlock | null;
  onReportedStatusUpdated: () => void;
  previewMedia: MediaPreviewState | null;
  onPreviewMediaChange: (preview: MediaPreviewState) => void;
  onPreviewMediaClose: () => void;
  modals?: React.ReactNode;
};

export function ReportedContentDetailLayout<THistory extends ReportedContentDetailLayoutHistory>({
  actionError,
  topContent,
  leftContent,
  rightContent,
  gridClassName = "grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(400px,0.92fr)]",
  histories,
  historiesMeta,
  historiesRefreshing,
  formatHistoryDate,
  onHistoryPageChange,
  targetType,
  targetId,
  reportedDetail,
  reportedReports,
  onReportedStatusUpdated,
  previewMedia,
  onPreviewMediaChange,
  onPreviewMediaClose,
  modals,
}: ReportedContentDetailLayoutProps<THistory>) {
  return (
    <div className="space-y-6">
      {actionError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {actionError}
        </div>
      ) : null}

      {topContent}

      <div className={gridClassName}>
        <div className="space-y-6">
          {leftContent}
          <ReportedOriginalHistoryCard
            histories={histories}
            meta={historiesMeta}
            refreshing={historiesRefreshing}
            formatDate={formatHistoryDate}
            onGoPage={onHistoryPageChange}
          />
        </div>

        <div className="space-y-6">
          {rightContent}
          <ReportedContentDetailPanel
            targetType={targetType}
            targetId={targetId}
            initialDetail={reportedDetail}
            initialReports={reportedReports}
            onStatusUpdated={onReportedStatusUpdated}
          />
        </div>
      </div>

      {modals}

      <MediaPreviewModal preview={previewMedia} onChange={onPreviewMediaChange} onClose={onPreviewMediaClose} />
    </div>
  );
}
