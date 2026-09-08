"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, type DataTableMeta, StatusValueBadge } from "@beaulab/ui-admin";

import { DetailImageGallery, type DetailImageGalleryItem } from "@/components/common/DetailImageGallery";
import { ManagedCommentsCard } from "@/components/post-content/ManagedCommentsCard";
import type { MediaPreviewState } from "@/components/common/MediaPreviewModal";
import { OperationHistoryCard as CommonOperationHistoryCard } from "@/components/common/OperationHistoryCard";
import { VisibilityActionButtons as VisibilityButtons } from "@/components/common/VisibilityActionButtons";
import { isVisibilityLockedByReport } from "@/lib/common/content-report";
import { ownerVisibilityStatusColor } from "@/lib/common/status-labels";
import { resolveMediaUrl, type MediaAsset } from "@/lib/hospital/detail";
import {
  TALK_DETAIL_COMMENT_PER_PAGE_OPTIONS,
  formatTalkAuthorName,
  formatTalkDetailCategory,
  formatTalkDetailDateTime,
  labelTalkVisibilityStatus,
  type TalkDetailComment,
  type TalkDetailResponse,
  type TalkMediaAsset,
  type TalkOperationHistory,
  type TalkPollOption,
} from "@/lib/talk/detail";

const detailGridClass = "grid grid-cols-[6.25rem_minmax(0,1fr)] items-start gap-4";
const detailLabelClass = "pt-0.5 text-xs font-semibold text-gray-500";
const detailValueClass = "min-w-0 break-words text-sm leading-6 text-gray-800";

export const TalkMemberSummaryCard = React.memo(function TalkMemberSummaryCard({
  detail,
}: {
  detail: TalkDetailResponse;
}) {
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
});

export const TalkContentCard = React.memo(function TalkContentCard({
  detail,
  visibilityUpdating,
  canUpdateStatus,
  onChangeVisibility,
  onPreviewMedia,
}: {
  detail: TalkDetailResponse;
  visibilityUpdating: boolean;
  canUpdateStatus: boolean;
  onChangeVisibility: (status: "ACTIVE" | "INACTIVE") => void;
  onPreviewMedia: (preview: MediaPreviewState) => void;
}) {
  const pollOptions = detail.poll?.options ?? [];
  const totalPollVotes = pollOptions.reduce((sum, option) => sum + Number(option.vote_count ?? 0), 0);
  const visibilityLocked = isVisibilityLockedByReport(detail.report);

  return (
    <Card as="section">
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <CardTitle>토크</CardTitle>
          </div>
          {canUpdateStatus ? (
            <VisibilityButtons
              status={detail.status}
              disabled={visibilityLocked || visibilityUpdating}
              onChange={onChangeVisibility}
            />
          ) : (
            <StatusValueBadge
              label={labelTalkVisibilityStatus(detail.status)}
              color={ownerVisibilityStatusColor(detail.status)}
            />
          )}
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

        <TalkImageGrid images={detail.images ?? []} onPreviewMedia={onPreviewMedia} />

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
                <PollBar key={option.id} option={option} totalVotes={totalPollVotes} />
              ))}
            </div>
          ) : (
            <p className="text-sm font-semibold text-gray-800">등록된 투표가 없습니다.</p>
          )}
        </section>
      </CardContent>
    </Card>
  );
});

export const TalkHistoryCard = React.memo(function TalkHistoryCard({
  histories,
  meta,
  refreshing,
  onGoPage,
}: {
  histories: TalkOperationHistory[];
  meta: DataTableMeta | null;
  refreshing: boolean;
  onGoPage: (page: number) => void;
}) {
  return (
    <CommonOperationHistoryCard
      histories={histories}
      meta={meta}
      loading={refreshing}
      onPageChange={onGoPage}
      formatDateTime={formatTalkDetailDateTime}
    />
  );
});

export const TalkCommentsCard = React.memo(function TalkCommentsCard({
  comments,
  commentsMeta,
  commentCount,
  perPage,
  refreshing,
  expandedHistoryIds,
  updatingIds,
  canUpdateStatus,
  onChangePage,
  onChangePerPage,
  onToggleHistory,
  onChangeVisibility,
}: {
  comments: TalkDetailComment[];
  commentsMeta: DataTableMeta | null;
  commentCount: number;
  perPage: number;
  refreshing: boolean;
  expandedHistoryIds: Set<number>;
  updatingIds: Set<number>;
  canUpdateStatus: boolean;
  onChangePage: (page: number) => void;
  onChangePerPage: (value: number) => void;
  onToggleHistory: (commentId: number) => void;
  onChangeVisibility: (commentId: number, status: "ACTIVE" | "INACTIVE") => void;
}) {
  return (
    <ManagedCommentsCard
      comments={comments}
      commentsMeta={commentsMeta}
      commentCount={commentCount}
      perPage={perPage}
      perPageOptions={TALK_DETAIL_COMMENT_PER_PAGE_OPTIONS}
      refreshing={refreshing}
      expandedHistoryIds={expandedHistoryIds}
      updatingIds={updatingIds}
      canUpdateStatus={canUpdateStatus}
      formatAuthor={formatTalkAuthorName}
      formatDateTime={formatTalkDetailDateTime}
      statusLabel={labelTalkVisibilityStatus}
      statusColor={ownerVisibilityStatusColor}
      onChangePage={onChangePage}
      onChangePerPage={onChangePerPage}
      onToggleHistory={onToggleHistory}
      onChangeVisibility={onChangeVisibility}
    />
  );
});

function TalkImageGrid({
  images,
  onPreviewMedia,
}: {
  images: TalkMediaAsset[];
  onPreviewMedia: (preview: MediaPreviewState) => void;
}) {
  const galleryItems: DetailImageGalleryItem[] = images.map((image, index) => ({
    id: image.id ?? `talk-image-${index}`,
    url: resolveMediaUrl(image as MediaAsset),
    title: `이미지 ${index + 1}`,
  }));

  return (
    <DetailImageGallery
      title="이미지"
      items={galleryItems}
      empty={<EmptyDetailState>등록된 이미지가 없습니다.</EmptyDetailState>}
      layout="grid"
      onPreview={onPreviewMedia}
    />
  );
}

function PollBar({ option, totalVotes }: { option: TalkPollOption; totalVotes: number }) {
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

function DetailField({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={[detailGridClass, className].filter(Boolean).join(" ")}>
      <p className={detailLabelClass}>{label}</p>
      <div className={detailValueClass}>{value}</div>
    </div>
  );
}

function EmptyDetailState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
      {children}
    </div>
  );
}
