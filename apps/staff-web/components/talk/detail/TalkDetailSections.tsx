"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Pagination,
  type DataTableMeta,
  StatusValueBadge,
} from "@beaulab/ui-admin";

import { DetailImageGallery, type DetailImageGalleryItem } from "@/components/common/DetailImageGallery";
import type { MediaPreviewState } from "@/components/common/MediaPreviewModal";
import { OperationHistoryCard as CommonOperationHistoryCard } from "@/components/common/OperationHistoryCard";
import { OperationHistoryActionBadge, OperationHistoryReason } from "@/components/common/OperationHistoryDisplay";
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
  type TalkCommentHistory,
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
    <Card as="aside" className="min-w-0">
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>댓글 {commentCount.toLocaleString()}개</CardTitle>
          <label className="inline-flex items-center gap-2 text-xs font-medium text-gray-500">
            <select
              value={perPage}
              onChange={(event) => onChangePerPage(Number(event.target.value))}
              className="h-11 rounded-lg border border-gray-200 bg-white pr-8 pl-4 text-sm text-gray-800 transition outline-none focus:border-brand-400"
            >
              {TALK_DETAIL_COMMENT_PER_PAGE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {comments.length > 0 ? (
          <div>
            {comments.map((comment, index) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                showSeparator={index > 0 && !comment.is_reply}
                expanded={expandedHistoryIds.has(comment.id)}
                updating={updatingIds.has(comment.id)}
                canUpdateStatus={canUpdateStatus}
                onToggleHistory={onToggleHistory}
                onChangeVisibility={onChangeVisibility}
              />
            ))}
          </div>
        ) : (
          <EmptyDetailState>등록된 댓글이 없습니다.</EmptyDetailState>
        )}

        {commentsMeta ? (
          <div className="flex justify-center pt-1">
            <Pagination
              currentPage={commentsMeta.current_page}
              totalPages={Math.max(1, commentsMeta.last_page)}
              onPageChange={onChangePage}
              disabled={refreshing}
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
});

const CommentItem = React.memo(function CommentItem({
  comment,
  showSeparator,
  expanded,
  updating,
  canUpdateStatus,
  onToggleHistory,
  onChangeVisibility,
}: {
  comment: TalkDetailComment;
  showSeparator: boolean;
  expanded: boolean;
  updating: boolean;
  canUpdateStatus: boolean;
  onToggleHistory: (commentId: number) => void;
  onChangeVisibility: (commentId: number, status: "ACTIVE" | "INACTIVE") => void;
}) {
  const histories = comment.operation_histories ?? [];
  const visibleHistories = expanded ? histories : histories.slice(0, 1);
  const visibilityLocked = isVisibilityLockedByReport(comment.report);

  return (
    <article
      className={[
        "space-y-4 py-5 first:pt-0 last:pb-0",
        showSeparator ? "border-t border-gray-200" : "",
        comment.is_reply ? "ml-8 border-l-2 border-gray-200 pl-5" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="text-sm font-semibold text-gray-900">{formatTalkAuthorName(comment.author)}</p>
        <p className="text-xs text-gray-500">
          {formatTalkDetailDateTime(comment.created_at)} | {comment.author_ip?.trim() || "-"}
        </p>
      </div>

      <div className="space-y-3">
        <div className="space-y-1 text-sm leading-6 text-gray-800">
          {comment.mention?.mention_text?.trim() ? (
            <span className="mr-1 font-semibold text-brand-500">@{comment.mention.mention_text}</span>
          ) : null}
          <span className="whitespace-pre-wrap">{comment.content?.trim() || "-"}</span>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <p className="text-sm text-gray-700">
            좋아요 <span className="font-semibold">{Number(comment.like_count ?? 0).toLocaleString()}</span>
          </p>
          {canUpdateStatus ? (
            <VisibilityButtons
              status={comment.status}
              disabled={visibilityLocked || updating}
              onChange={(status) => onChangeVisibility(comment.id, status)}
            />
          ) : (
            <StatusValueBadge
              label={labelTalkVisibilityStatus(comment.status)}
              color={ownerVisibilityStatusColor(comment.status)}
            />
          )}
        </div>
      </div>

      {histories.length > 0 ? (
        <div className="rounded-2xl bg-gray-50 px-4 py-3">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              {visibleHistories.map((history, index) => (
                <CommentHistoryRow key={`${comment.id}-${history.created_at ?? index}`} history={history} />
              ))}
            </div>
            {histories.length > 1 ? (
              <button
                type="button"
                onClick={() => onToggleHistory(comment.id)}
                className="-mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-gray-300 bg-white p-0 text-xs leading-none font-semibold text-gray-600 transition hover:border-brand-400 hover:text-brand-600"
                aria-label={expanded ? "댓글 히스토리 접기" : "댓글 히스토리 펼치기"}
              >
                {expanded ? "-" : "+"}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </article>
  );
});

function CommentHistoryRow({ history }: { history: TalkCommentHistory }) {
  const historyForDisplay = {
    ...history,
    action: history.action ?? "STATE_UPDATED",
    field: history.field ?? "status",
    after_value: history.after_value ?? history.status,
  };

  return (
    <div className="grid gap-2 text-xs text-gray-600 md:grid-cols-[9.5rem_6.5rem_7rem_minmax(0,1fr)]">
      <span className="whitespace-nowrap text-gray-500">{formatTalkDetailDateTime(history.created_at)}</span>
      <span className="truncate font-medium">{history.actor_label?.trim() || "-"}</span>
      <span>
        <OperationHistoryActionBadge history={historyForDisplay} />
      </span>
      <span className="min-w-0 break-words">
        <OperationHistoryReason history={historyForDisplay} />
      </span>
    </div>
  );
}

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
