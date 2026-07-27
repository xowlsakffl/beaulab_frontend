"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, type DataTableMeta } from "@beaulab/ui-admin";

import { type MediaPreviewState } from "@/components/common/MediaPreviewModal";
import { VisibilityConfirmModal } from "@/components/common/VisibilityActionButtons";
import { useReportedOriginalVisibility } from "@/hooks/reported-content/useReportedOriginalVisibility";
import { resolveMediaUrl, type MediaAsset } from "@/lib/hospital/detail";
import type {
  ReportedContentDetailResponse,
  ReportedContentReportsBlock,
  ReportedContentTargetType,
} from "@/lib/reported-content/detail";
import {
  formatTalkAuthorName,
  formatTalkDetailCategory,
  formatTalkDetailDateTime,
  labelTalkVisibilityStatus,
  type TalkDetailResponse,
  type TalkMediaAsset,
  type TalkOperationHistory,
  type TalkPollOption,
} from "@/lib/talk/detail";

import { DetailImageGallery, type DetailImageGalleryItem } from "../../common/DetailImageGallery";
import { ReportedContentDetailLayout } from "./ReportedContentDetailLayout";
import { DetailField, EmptyDetailState, ReportedOriginalVisibilityButtons } from "./ReportedDetailShared";

type ReportedTalkDetailViewProps = {
  detail: TalkDetailResponse;
  histories: TalkOperationHistory[];
  historiesMeta: DataTableMeta | null;
  refreshing: boolean;
  targetType: ReportedContentTargetType;
  targetId: number;
  reportedDetail: ReportedContentDetailResponse | null;
  reportedReports: ReportedContentReportsBlock | null;
  actionError: string | null;
  onActionError: (message: string | null) => void;
  onRefresh: () => Promise<void>;
  onReportedStatusUpdated: () => void;
  onHistoryPageChange: (page: number) => void;
};

export function ReportedTalkDetailView({
  detail,
  histories,
  historiesMeta,
  refreshing,
  targetType,
  targetId,
  reportedDetail,
  reportedReports,
  actionError,
  onActionError,
  onRefresh,
  onReportedStatusUpdated,
  onHistoryPageChange,
}: ReportedTalkDetailViewProps) {
  const [previewMedia, setPreviewMedia] = React.useState<MediaPreviewState | null>(null);
  const originalVisibility = useReportedOriginalVisibility({
    onSaved: onRefresh,
    onError: onActionError,
  });
  const pendingVisibilityMessage = originalVisibility.pendingChange
    ? `해당 토크를 ${originalVisibility.pendingVisibilityLabel} 하시겠습니까?`
    : "";
  const pendingVisibilityUpdating = Boolean(originalVisibility.pendingChange) && originalVisibility.updating;

  return (
    <ReportedContentDetailLayout
      actionError={actionError}
      leftContent={
        <>
          <ReportedTalkMemberSummaryCard detail={detail} />
          <ReportedTalkContentCard
            detail={detail}
            visibilityUpdating={originalVisibility.updating}
            onChangeVisibility={(status) => originalVisibility.requestChange("talk", detail.id, status)}
            onPreviewMedia={setPreviewMedia}
          />
        </>
      }
      histories={histories}
      historiesMeta={historiesMeta}
      historiesRefreshing={refreshing}
      formatHistoryDate={(history) => formatTalkDetailDateTime(history.created_at)}
      onHistoryPageChange={onHistoryPageChange}
      targetType={targetType}
      targetId={targetId}
      reportedDetail={reportedDetail}
      reportedReports={reportedReports}
      onReportedStatusUpdated={onReportedStatusUpdated}
      previewMedia={previewMedia}
      onPreviewMediaChange={setPreviewMedia}
      onPreviewMediaClose={() => setPreviewMedia(null)}
      modals={
        <VisibilityConfirmModal
          isOpen={Boolean(originalVisibility.pendingChange)}
          status={originalVisibility.pendingChange?.status}
          message={pendingVisibilityMessage}
          hiddenReasonValue={originalVisibility.pendingChange?.hiddenReason ?? ""}
          updating={pendingVisibilityUpdating}
          reasonInputId="reported-talk-detail-hidden-reason"
          onHiddenReasonChange={originalVisibility.updateHiddenReason}
          onClose={originalVisibility.closeModal}
          onConfirm={() => void originalVisibility.confirmChange()}
        />
      }
    />
  );
}

function ReportedTalkMemberSummaryCard({ detail }: { detail: TalkDetailResponse }) {
  return (
    <Card as="section">
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <CardTitle>회원정보</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <DetailField label="작성자" value={formatTalkAuthorName(detail.author)} />
        <DetailField label="작성일" value={formatTalkDetailDateTime(detail.created_at)} />
        <DetailField label="작성 IP" value={detail.author_ip || "-"} className="md:col-span-2" />
      </CardContent>
    </Card>
  );
}

function ReportedTalkContentCard({
  detail,
  visibilityUpdating,
  onChangeVisibility,
  onPreviewMedia,
}: {
  detail: TalkDetailResponse;
  visibilityUpdating: boolean;
  onChangeVisibility: (status: "ACTIVE" | "INACTIVE") => void;
  onPreviewMedia: (preview: MediaPreviewState) => void;
}) {
  const pollOptions = detail.poll?.options ?? [];
  const totalPollVotes = pollOptions.reduce((sum, option) => sum + Number(option.vote_count ?? 0), 0);

  return (
    <Card as="section">
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <CardTitle>토크</CardTitle>
          </div>
          <ReportedOriginalVisibilityButtons
            status={detail.status}
            disabled={visibilityUpdating}
            onChange={onChangeVisibility}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid gap-4">
          <DetailField label="토크유형" value={formatTalkDetailCategory(detail.category)} />
          <DetailField label="토크제목" value={detail.title?.trim() || "-"} />
          <DetailField label="노출상태" value={labelTalkVisibilityStatus(detail.status)} />
        </div>

        <section className="space-y-2">
          <p className="text-xs font-semibold text-gray-500">내용</p>
          <div className="min-h-36 rounded-2xl border border-gray-200 bg-white px-4 py-4 text-sm leading-7 break-words whitespace-pre-wrap text-gray-800">
            {detail.content?.trim() || "-"}
          </div>
        </section>

        <ReportedTalkImageGrid images={detail.images ?? []} onPreviewMedia={onPreviewMedia} />

        <section className="space-y-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-500">투표</p>
            {detail.poll?.allow_multiple ? (
              <span className="inline-flex rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-600">
                중복가능
              </span>
            ) : null}
          </div>
          {detail.poll ? (
            <div className="space-y-3">
              {pollOptions.map((option) => (
                <ReportedTalkPollBar key={option.id} option={option} totalVotes={totalPollVotes} />
              ))}
            </div>
          ) : (
            <p className="text-sm font-semibold text-gray-800">등록된 투표가 없습니다.</p>
          )}
        </section>
      </CardContent>
    </Card>
  );
}

function ReportedTalkImageGrid({
  images,
  onPreviewMedia,
}: {
  images: TalkMediaAsset[];
  onPreviewMedia: (preview: MediaPreviewState) => void;
}) {
  const items: DetailImageGalleryItem[] = images.map((image, index) => ({
    id: image.id ?? `reported-talk-image-${index}`,
    url: resolveMediaUrl(image as MediaAsset),
    title: `이미지 ${index + 1}`,
  }));

  return (
    <DetailImageGallery
      title="이미지"
      items={items}
      layout="grid"
      empty={<EmptyDetailState>등록된 이미지가 없습니다.</EmptyDetailState>}
      onPreview={onPreviewMedia}
    />
  );
}

function ReportedTalkPollBar({ option, totalVotes }: { option: TalkPollOption; totalVotes: number }) {
  const votes = Number(option.vote_count ?? 0);
  const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
  const fillWidth = votes > 0 ? Math.max(percentage, 12) : 0;
  const optionContent = option.content?.trim() || "-";

  return (
    <div className="relative h-10 overflow-hidden rounded-lg bg-gray-100">
      <div className="absolute inset-0">
        {fillWidth > 0 ? (
          <div className="h-full rounded-lg bg-brand-500 transition-[width]" style={{ width: `${fillWidth}%` }} />
        ) : null}
      </div>
      <div className="relative z-10 flex h-full items-center justify-between gap-3 px-3 text-sm font-semibold text-gray-900">
        <span className="min-w-0 truncate">{optionContent}</span>
        <span className="shrink-0 text-xs">
          {votes.toLocaleString()}명 ({percentage}%)
        </span>
      </div>
    </div>
  );
}
