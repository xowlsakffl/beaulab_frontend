"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CategoryBadgeList,
  Pagination,
  type DataTableMeta,
} from "@beaulab/ui-admin";

import { DetailImageGallery, type DetailImageGalleryItem } from "@/components/common/DetailImageGallery";
import { MediaPreviewState } from "@/components/common/MediaPreviewModal";
import { OperationHistoryCard as CommonOperationHistoryCard } from "@/components/common/OperationHistoryCard";
import { OperationHistoryActionBadge, OperationHistoryReason } from "@/components/common/OperationHistoryDisplay";
import { VisibilityActionButtons as VisibilityButtons } from "@/components/common/VisibilityActionButtons";
import { isVisibilityLockedByReport } from "@/lib/common/content-report";
import {
  HOSPITAL_REVIEW_DETAIL_COMMENT_PER_PAGE_OPTIONS,
  formatHospitalReviewDetailAuthorName,
  formatHospitalReviewDetailDate,
  formatHospitalReviewDetailDateTime,
  getHospitalReviewDetailCategoryFullPaths,
  type HospitalReviewCommentHistory,
  type HospitalReviewDetailComment,
  type HospitalReviewDetailResponse,
  type HospitalReviewOperationHistory,
} from "@/lib/hospital-review/detail";
import { resolveHospitalReviewMediaUrl, type HospitalReviewMediaAsset } from "@/lib/hospital-review/list";

const detailGridClass = "grid grid-cols-[6.25rem_minmax(0,1fr)] items-start gap-4";
const detailLabelClass = "pt-0.5 text-xs font-semibold text-gray-500 ";
const detailValueClass = "min-w-0 break-words text-sm leading-6 text-gray-800 ";

export function MemberSummaryCard({ detail }: { detail: HospitalReviewDetailResponse }) {
  return (
    <Card as="section">
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <CardTitle>회원정보</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <DetailField label="작성자" value={formatHospitalReviewDetailAuthorName(detail.author)} />
        <DetailField label="전화번호" value={detail.author?.phone?.trim() || "-"} />
        <DetailField label="작성일" value={formatHospitalReviewDetailDate(detail.created_at)} />
        <DetailField label="작성 IP" value={detail.author_ip?.trim() || "-"} />
      </CardContent>
    </Card>
  );
}

export function HospitalSummaryCard({ detail }: { detail: HospitalReviewDetailResponse }) {
  return (
    <Card as="section">
      <CardHeader className="pb-4">
        <CardTitle>병의원정보</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <DetailField label="병의원" value={detail.hospital?.name?.trim() || "-"} />
        <DetailField label="사업자등록번호" value={detail.hospital?.business_number?.trim() || "-"} />
        <DetailField label="의료진" value={detail.doctor?.name?.trim() || "-"} />
        <DetailField label="직책" value={detail.doctor?.position?.trim() || "-"} />
      </CardContent>
    </Card>
  );
}

export function HospitalReviewContentCard({
  boardTitle,
  detail,
  visibilityLocked,
  visibilityUpdating,
  onChangeVisibility,
  onPreviewMedia,
}: {
  boardTitle: string;
  detail: HospitalReviewDetailResponse;
  visibilityLocked: boolean;
  visibilityUpdating: boolean;
  onChangeVisibility: (status: "ACTIVE" | "INACTIVE") => void;
  onPreviewMedia: (preview: MediaPreviewState) => void;
}) {
  return (
    <Card as="section">
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <CardTitle>{boardTitle}</CardTitle>
          </div>
          <VisibilityButtons
            status={detail.status}
            disabled={visibilityLocked || visibilityUpdating}
            onChange={onChangeVisibility}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid gap-4">
          <DetailField label="카테고리" value={<CategoryBadges detail={detail} />} />
          <DetailField label="제목" value={detail.title?.trim() || "-"} />
        </div>

        <ReviewImageGallery
          beforeImages={detail.before_images ?? []}
          afterImages={detail.after_images ?? []}
          onPreviewMedia={onPreviewMedia}
        />

        <section className="space-y-2">
          <p className="text-xs font-semibold text-gray-500">내용</p>
          <div className="min-h-36 rounded-2xl border border-gray-200 bg-white px-4 py-4 text-sm leading-7 break-words whitespace-pre-wrap text-gray-800">
            {detail.content?.trim() || "-"}
          </div>
        </section>
      </CardContent>
    </Card>
  );
}

export function HospitalReviewHistoryCard({
  histories,
  meta,
  refreshing,
  onGoPage,
}: {
  histories: HospitalReviewOperationHistory[];
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
      formatDateTime={formatHospitalReviewDetailDateTime}
    />
  );
}

export function CommentsCard({
  comments,
  commentsMeta,
  commentCount,
  perPage,
  refreshing,
  expandedHistoryIds,
  updatingIds,
  onChangePage,
  onChangePerPage,
  onToggleHistory,
  onChangeVisibility,
}: {
  comments: HospitalReviewDetailComment[];
  commentsMeta: DataTableMeta | null;
  commentCount: number;
  perPage: number;
  refreshing: boolean;
  expandedHistoryIds: Set<number>;
  updatingIds: Set<number>;
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
              className="h-9 rounded-lg border border-gray-200 bg-white pr-8 pl-3 text-sm text-gray-800 transition outline-none focus:border-brand-400"
            >
              {HOSPITAL_REVIEW_DETAIL_COMMENT_PER_PAGE_OPTIONS.map((option) => (
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
                onToggleHistory={() => onToggleHistory(comment.id)}
                onChangeVisibility={(status) => onChangeVisibility(comment.id, status)}
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
}

function CategoryBadges({ detail }: { detail: HospitalReviewDetailResponse }) {
  return <CategoryBadgeList values={getHospitalReviewDetailCategoryFullPaths(detail.categories)} />;
}

function CommentItem({
  comment,
  showSeparator,
  expanded,
  updating,
  onToggleHistory,
  onChangeVisibility,
}: {
  comment: HospitalReviewDetailComment;
  showSeparator: boolean;
  expanded: boolean;
  updating: boolean;
  onToggleHistory: () => void;
  onChangeVisibility: (status: "ACTIVE" | "INACTIVE") => void;
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
        <p className="text-sm font-semibold text-gray-900">{formatHospitalReviewDetailAuthorName(comment.author)}</p>
        <p className="text-xs text-gray-500">
          {formatHospitalReviewDetailDateTime(comment.created_at)} | {comment.author_ip?.trim() || "-"}
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
          <VisibilityButtons
            status={comment.status}
            disabled={visibilityLocked || updating}
            onChange={onChangeVisibility}
          />
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
                onClick={onToggleHistory}
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
}

function CommentHistoryRow({ history }: { history: HospitalReviewCommentHistory }) {
  const historyForDisplay = {
    ...history,
    action: history.action ?? "STATE_UPDATED",
    field: history.field ?? "status",
    after_value: history.after_value ?? history.status,
  };

  return (
    <div className="grid gap-2 text-xs text-gray-600 md:grid-cols-[9.5rem_6.5rem_7rem_minmax(0,1fr)]">
      <span className="whitespace-nowrap text-gray-500">{formatHospitalReviewDetailDateTime(history.created_at)}</span>
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

function ReviewImageGallery({
  beforeImages,
  afterImages,
  onPreviewMedia,
}: {
  beforeImages: HospitalReviewMediaAsset[];
  afterImages: HospitalReviewMediaAsset[];
  onPreviewMedia: (preview: MediaPreviewState) => void;
}) {
  const images = [
    ...beforeImages.map((image, index) => ({ image, label: "전", index })),
    ...afterImages.map((image, index) => ({ image, label: "후", index })),
  ];
  const galleryItems: DetailImageGalleryItem[] = images.map(({ image, label, index }, imageIndex) => ({
    id: `${label}-${image.id ?? imageIndex}`,
    url: resolveHospitalReviewMediaUrl(image),
    title: `${label} 이미지 ${index + 1}`,
    badge: label,
  }));

  return (
    <DetailImageGallery
      title="이미지"
      items={galleryItems}
      empty={<EmptyDetailState>등록된 이미지가 없습니다.</EmptyDetailState>}
      onPreview={onPreviewMedia}
    />
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
