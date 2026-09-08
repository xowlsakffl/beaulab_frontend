"use client";

import React from "react";
import { isApiSuccess } from "@beaulab/types";
import { api } from "@/lib/common/api";

export type VisiblePostEntity = { id: number; status?: string | null };
type VisibilityStatus = "ACTIVE" | "INACTIVE";
type Target = "content" | "comment";
type PendingVisibilityChange = { target: Target; id: number; status: VisibilityStatus; hiddenReason: string };

export function usePostVisibility({
  id,
  detail,
  comments,
  contentLabel,
  contentStatusPath,
  commentStatusPath,
  apply,
  refresh,
}: {
  id: number;
  detail: VisiblePostEntity | null;
  comments: VisiblePostEntity[];
  contentLabel: string;
  contentStatusPath: string;
  commentStatusPath: string;
  apply: (target: Target, id: number, status: string) => void;
  refresh: (target: Target) => void;
}) {
  const [pendingVisibilityChange, setPendingVisibilityChange] = React.useState<PendingVisibilityChange | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [contentVisibilityUpdating, setContentVisibilityUpdating] = React.useState(false);
  const [commentVisibilityUpdatingIds, setCommentVisibilityUpdatingIds] = React.useState<Set<number>>(new Set());
  const currentIdRef = React.useRef(id);
  React.useLayoutEffect(() => {
    currentIdRef.current = id;
  }, [id]);
  const lifetimeRef = React.useRef(0);
  const inFlightRef = React.useRef(new Set<string>());
  const refreshRef = React.useRef(refresh);
  React.useLayoutEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  React.useEffect(() => {
    lifetimeRef.current += 1;
    inFlightRef.current.clear();
    setPendingVisibilityChange(null);
    setActionError(null);
    setContentVisibilityUpdating(false);
    setCommentVisibilityUpdatingIds(new Set());
    return () => {
      lifetimeRef.current += 1;
    };
  }, [id]);

  const requestContentVisibility = React.useCallback(
    (status: VisibilityStatus) => {
      if (detail) setPendingVisibilityChange({ target: "content", id: detail.id, status, hiddenReason: "" });
    },
    [detail],
  );
  const requestCommentVisibility = React.useCallback(
    (commentId: number, status: VisibilityStatus) => {
      if (comments.some((comment) => comment.id === commentId)) {
        setPendingVisibilityChange({ target: "comment", id: commentId, status, hiddenReason: "" });
      }
    },
    [comments],
  );
  const closeVisibilityConfirmModal = React.useCallback(() => setPendingVisibilityChange(null), []);
  const updatePendingHiddenReason = React.useCallback((hiddenReason: string) => {
    setPendingVisibilityChange((current) => (current ? { ...current, hiddenReason } : current));
  }, []);

  const confirmVisibilityChange = React.useCallback(async () => {
    if (!pendingVisibilityChange) return;
    const { target, id: targetId, status, hiddenReason } = pendingVisibilityChange;
    const key = `${target}:${targetId}`;
    if (inFlightRef.current.has(key)) return;
    inFlightRef.current.add(key);
    const lifetime = lifetimeRef.current;
    const isCurrent = () => currentIdRef.current === id && lifetimeRef.current === lifetime;
    const isComment = target === "comment";
    const previousStatus = isComment ? comments.find((comment) => comment.id === targetId)?.status : detail?.status;
    if (isComment) setCommentVisibilityUpdatingIds((current) => new Set(current).add(targetId));
    else setContentVisibilityUpdating(true);
    setPendingVisibilityChange(null);
    setActionError(null);
    apply(target, targetId, status);
    try {
      const response = await api.patch(isComment ? commentStatusPath : contentStatusPath, {
        ids: [targetId],
        status,
        ...(status === "INACTIVE" && hiddenReason.trim() ? { hidden_reason: hiddenReason.trim() } : {}),
      });
      if (!isCurrent()) return;
      if (!isApiSuccess(response)) throw new Error(response.error.message || "노출 상태 변경에 실패했습니다.");
      refreshRef.current(target);
    } catch (error) {
      if (!isCurrent()) return;
      if (previousStatus) apply(target, targetId, previousStatus);
      setActionError(
        error instanceof Error
          ? error.message
          : `${isComment ? "댓글" : contentLabel} 노출 상태 변경 중 오류가 발생했습니다.`,
      );
    } finally {
      if (isCurrent()) {
        inFlightRef.current.delete(key);
        if (isComment)
          setCommentVisibilityUpdatingIds((current) => {
            const next = new Set(current);
            next.delete(targetId);
            return next;
          });
        else setContentVisibilityUpdating(false);
      }
    }
  }, [apply, commentStatusPath, comments, contentLabel, contentStatusPath, detail, id, pendingVisibilityChange]);

  const pendingVisibilityUpdating =
    pendingVisibilityChange?.target === "comment"
      ? commentVisibilityUpdatingIds.has(pendingVisibilityChange.id)
      : contentVisibilityUpdating;
  const pendingVisibilityMessage = pendingVisibilityChange
    ? `해당 ${pendingVisibilityChange.target === "comment" ? "댓글을" : `${contentLabel}를`} ${pendingVisibilityChange.status === "ACTIVE" ? "노출" : "미노출"} 하시겠습니까?`
    : "";

  return {
    actionError,
    contentVisibilityUpdating,
    commentVisibilityUpdatingIds,
    pendingVisibilityChange,
    pendingVisibilityUpdating,
    pendingVisibilityMessage,
    requestContentVisibility,
    requestCommentVisibility,
    closeVisibilityConfirmModal,
    updatePendingHiddenReason,
    confirmVisibilityChange,
  };
}
