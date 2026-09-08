"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Pagination,
  Select,
  StatusValueBadge,
  type BadgeColor,
  type DataTableMeta,
} from "@beaulab/ui-admin";

import {
  OperationHistoryActionBadge,
  OperationHistoryReason,
  type OperationHistoryLike,
} from "@/components/common/OperationHistoryDisplay";
import { VisibilityActionButtons } from "@/components/common/VisibilityActionButtons";
import { isVisibilityLockedByReport, type ContentReportSummary } from "@/lib/common/content-report";

type CommentHistoryLike = OperationHistoryLike & {
  actor_label?: string | null;
  status?: string | null;
  created_at?: string | null;
};

type ManagedComment<TAuthor> = {
  id: number;
  is_reply?: boolean | null;
  author?: TAuthor | null;
  content?: string | null;
  status?: string | null;
  author_ip?: string | null;
  like_count?: number | null;
  mention?: { mention_text?: string | null } | null;
  report?: ContentReportSummary | null;
  operation_histories?: CommentHistoryLike[] | null;
  created_at?: string | null;
};

type ManagedCommentsCardProps<TAuthor, TComment extends ManagedComment<TAuthor>> = {
  comments: TComment[];
  commentsMeta: DataTableMeta | null;
  commentCount: number;
  perPage: number;
  perPageOptions: readonly number[];
  refreshing: boolean;
  expandedHistoryIds: Set<number>;
  updatingIds: Set<number>;
  canUpdateStatus: boolean;
  formatAuthor: (author?: TAuthor | null) => string;
  formatDateTime: (value?: string | null) => string;
  statusLabel: (status?: string | null) => string;
  statusColor: (status?: string | null) => BadgeColor;
  onChangePage: (page: number) => void;
  onChangePerPage: (value: number) => void;
  onToggleHistory: (commentId: number) => void;
  onChangeVisibility: (commentId: number, status: "ACTIVE" | "INACTIVE") => void;
};

export function ManagedCommentsCard<TAuthor, TComment extends ManagedComment<TAuthor>>({
  comments,
  commentsMeta,
  commentCount,
  perPage,
  perPageOptions,
  refreshing,
  expandedHistoryIds,
  updatingIds,
  canUpdateStatus,
  formatAuthor,
  formatDateTime,
  statusLabel,
  statusColor,
  onChangePage,
  onChangePerPage,
  onToggleHistory,
  onChangeVisibility,
}: ManagedCommentsCardProps<TAuthor, TComment>) {
  return (
    <Card as="aside" className="min-w-0">
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>댓글 {commentCount.toLocaleString()}개</CardTitle>
          <Select
            value={String(perPage)}
            options={perPageOptions.map((option) => ({ value: String(option), label: String(option) }))}
            showPlaceholderOption={false}
            onChange={(value) => onChangePerPage(Number(value))}
            className="w-24"
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {comments.length > 0 ? (
          <div>
            {comments.map((comment, index) => (
              <ManagedCommentItem
                key={comment.id}
                comment={comment}
                index={index}
                expanded={expandedHistoryIds.has(comment.id)}
                updating={updatingIds.has(comment.id)}
                canUpdateStatus={canUpdateStatus}
                formatAuthor={formatAuthor}
                formatDateTime={formatDateTime}
                statusLabel={statusLabel}
                statusColor={statusColor}
                onToggleHistory={onToggleHistory}
                onChangeVisibility={onChangeVisibility}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-400">
            등록된 댓글이 없습니다.
          </div>
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

type CommentItemProps<TAuthor, TComment extends ManagedComment<TAuthor>> = Pick<
  ManagedCommentsCardProps<TAuthor, TComment>,
  | "canUpdateStatus"
  | "formatAuthor"
  | "formatDateTime"
  | "statusLabel"
  | "statusColor"
  | "onToggleHistory"
  | "onChangeVisibility"
> & {
  comment: TComment;
  index: number;
  expanded: boolean;
  updating: boolean;
};

function ManagedCommentItemComponent<TAuthor, TComment extends ManagedComment<TAuthor>>({
  comment,
  index,
  expanded,
  updating,
  canUpdateStatus,
  formatAuthor,
  formatDateTime,
  statusLabel,
  statusColor,
  onToggleHistory,
  onChangeVisibility,
}: CommentItemProps<TAuthor, TComment>) {
  const histories = comment.operation_histories ?? [];
  return (
    <article
      className={[
        "space-y-4 py-5 first:pt-0 last:pb-0",
        index > 0 && !comment.is_reply ? "border-t border-gray-200" : "",
        comment.is_reply ? "ml-8 border-l-2 border-gray-200 pl-5" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="text-sm font-semibold text-gray-900">{formatAuthor(comment.author)}</p>
        <p className="text-xs text-gray-500">
          {formatDateTime(comment.created_at)} | {comment.author_ip?.trim() || "-"}
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
            <VisibilityActionButtons
              status={comment.status}
              disabled={isVisibilityLockedByReport(comment.report) || updating}
              onChange={(status) => onChangeVisibility(comment.id, status)}
            />
          ) : (
            <StatusValueBadge label={statusLabel(comment.status)} color={statusColor(comment.status)} />
          )}
        </div>
      </div>

      {histories.length > 0 ? (
        <div className="rounded-2xl bg-gray-50 px-4 py-3">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              {(expanded ? histories : histories.slice(0, 1)).map((history, historyIndex) => {
                const historyForDisplay = {
                  ...history,
                  action: history.action ?? "STATE_UPDATED",
                  field: history.field ?? "status",
                  after_value: history.after_value ?? history.status,
                };
                return (
                  <div
                    key={`${comment.id}-${history.created_at ?? historyIndex}`}
                    className="grid gap-2 text-xs text-gray-600 md:grid-cols-[9.5rem_6.5rem_7rem_minmax(0,1fr)]"
                  >
                    <span className="whitespace-nowrap text-gray-500">{formatDateTime(history.created_at)}</span>
                    <span className="truncate font-medium">{history.actor_label?.trim() || "-"}</span>
                    <span>
                      <OperationHistoryActionBadge history={historyForDisplay} />
                    </span>
                    <span className="min-w-0 break-words">
                      <OperationHistoryReason history={historyForDisplay} />
                    </span>
                  </div>
                );
              })}
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
}

const ManagedCommentItem = React.memo(ManagedCommentItemComponent) as typeof ManagedCommentItemComponent;
