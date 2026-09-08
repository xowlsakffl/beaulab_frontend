"use client";

import React from "react";
import { usePostDetailPagination } from "./usePostDetailPagination";
import { usePostDetailResource } from "./usePostDetailResource";
import { usePostVisibility, type VisiblePostEntity } from "./usePostVisibility";

type ManagedContentDetailConfig = {
  contentLabel: string;
  invalidPathMessage: string;
  detailLoadMessage: string;
  commentsLoadMessage: string;
  historiesLoadMessage: string;
  detailPath: (id: number) => string;
  commentsPath: (id: number) => string;
  historiesPath: (id: number) => string;
  contentStatusPath: string;
  commentStatusPath: string;
  commentPerPageOptions: readonly number[];
  historyPerPage: number;
};

export function useManagedContentDetail<
  TDetail extends VisiblePostEntity,
  TComment extends VisiblePostEntity,
  THistory,
>({ id, config }: { id: number; config: ManagedContentDetailConfig }) {
  const validId = Number.isSafeInteger(id) && id > 0;
  const pagination = usePostDetailPagination(config.commentPerPageOptions);
  const detail = usePostDetailResource<TDetail>(validId ? config.detailPath(id) : null, {}, config.detailLoadMessage);
  const comments = usePostDetailResource<TComment[]>(
    validId ? config.commentsPath(id) : null,
    {
      comments_page: pagination.commentsPage,
      comments_per_page: pagination.commentsPerPage,
    },
    config.commentsLoadMessage,
  );
  const histories = usePostDetailResource<THistory[]>(
    validId ? config.historiesPath(id) : null,
    {
      operation_histories_page: pagination.historiesPage,
      operation_histories_per_page: config.historyPerPage,
    },
    config.historiesLoadMessage,
  );
  const visibility = usePostVisibility({
    id,
    detail: detail.data,
    comments: comments.data ?? [],
    ...config,
    apply: (target, targetId, status) => {
      if (target === "comment")
        comments.update(
          (items) => items.map((item) => (item.id === targetId ? { ...item, status } : item)),
          comments.key,
        );
      else detail.update((item) => (item.id === targetId ? { ...item, status } : item), detail.key);
    },
    refresh: (target) => {
      if (target === "comment") void comments.reload();
      else void detail.reload();
      void histories.reload();
    },
  });
  const [expandedCommentHistoryIds, setExpandedCommentHistoryIds] = React.useState<Set<number>>(new Set());
  React.useEffect(
    () => setExpandedCommentHistoryIds(new Set()),
    [id, pagination.commentsPage, pagination.commentsPerPage],
  );
  const toggleCommentHistory = React.useCallback((commentId: number) => {
    setExpandedCommentHistoryIds((current) => {
      const next = new Set(current);
      if (next.has(commentId)) next.delete(commentId);
      else next.add(commentId);
      return next;
    });
  }, []);

  return {
    ...visibility,
    ...pagination,
    detail: detail.data,
    comments: comments.data ?? [],
    commentsMeta: comments.meta,
    histories: histories.data ?? [],
    historiesMeta: histories.meta,
    isLoading: validId && !detail.data && (detail.loading || comments.loading || histories.loading),
    isRefreshing: detail.loading || comments.loading || histories.loading,
    loadError: validId ? detail.error : config.invalidPathMessage,
    actionError: visibility.actionError || comments.error || histories.error,
    expandedCommentHistoryIds,
    toggleCommentHistory,
  };
}
