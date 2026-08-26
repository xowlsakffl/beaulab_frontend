"use client";

import React from "react";
import dynamic from "next/dynamic";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { hasPermission } from "@beaulab/auth";
import { isApiSuccess } from "@beaulab/types";
import { SpinnerBlock, type DataTableMeta } from "@beaulab/ui-admin";

import { api } from "@/lib/common/api";
import { getSession } from "@/lib/common/auth/session";
import { STAFF_STATUS_PERMISSIONS } from "@/lib/common/status-permissions";
import type { MediaPreviewState } from "@/components/common/MediaPreviewModal";
import { LoadErrorState } from "@/components/common/LoadErrorState";
import { VisibilityConfirmModal } from "@/components/common/VisibilityActionButtons";
import {
  TalkCommentsCard,
  TalkContentCard,
  TalkHistoryCard,
  TalkMemberSummaryCard,
} from "@/components/talk/detail/TalkDetailSections";
import {
  TALK_DETAIL_COMMENT_PER_PAGE_OPTIONS,
  TALK_DETAIL_HISTORY_PER_PAGE,
  type PaginatedBlock,
  type TalkDetailComment,
  type TalkDetailResponse,
  type TalkOperationHistory,
} from "@/lib/talk/detail";

const MediaPreviewModal = dynamic(() =>
  import("@/components/common/MediaPreviewModal").then((module) => module.MediaPreviewModal),
);

type VisibilityUpdateResponse = {
  updated_count: number;
  status: string;
  ids: number[];
};

type VisibilityUpdatePayload = {
  ids: number[];
  status: "ACTIVE" | "INACTIVE";
  hidden_reason?: string;
};

type PendingVisibilityChange = {
  target: "talk" | "comment";
  id: number;
  status: "ACTIVE" | "INACTIVE";
  hiddenReason?: string;
};

const commentsDefaultPage = 1;
const historiesDefaultPage = 1;
const commentsDefaultPerPage = 10;

export default function TalkDetailPageClient() {
  const params = useParams<{ id: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawTalkId = Array.isArray(params.id) ? params.id[0] : params.id;
  const talkId = Number(rawTalkId);
  const canUpdateStatus = hasPermission(getSession()?.auth, STAFF_STATUS_PERMISSIONS.talk);

  const [detail, setDetail] = React.useState<TalkDetailResponse | null>(null);
  const [commentsBlock, setCommentsBlock] = React.useState<PaginatedBlock<TalkDetailComment> | null>(null);
  const [operationHistoriesBlock, setOperationHistoriesBlock] =
    React.useState<PaginatedBlock<TalkOperationHistory> | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [commentsPage, setCommentsPage] = React.useState(() =>
    parsePositivePage(searchParams.get("comments_page"), commentsDefaultPage),
  );
  const [commentsPerPage, setCommentsPerPage] = React.useState(() =>
    parseCommentsPerPage(searchParams.get("comments_per_page")),
  );
  const [historiesPage, setHistoriesPage] = React.useState(() =>
    parsePositivePage(searchParams.get("operation_histories_page"), historiesDefaultPage),
  );
  const [talkVisibilityUpdating, setTalkVisibilityUpdating] = React.useState(false);
  const [commentVisibilityUpdatingIds, setCommentVisibilityUpdatingIds] = React.useState<Set<number>>(() => new Set());
  const [pendingVisibilityChange, setPendingVisibilityChange] = React.useState<PendingVisibilityChange | null>(null);
  const [previewMedia, setPreviewMedia] = React.useState<MediaPreviewState | null>(null);
  const [expandedCommentHistoryIds, setExpandedCommentHistoryIds] = React.useState<Set<number>>(() => new Set());
  const hasLoadedRef = React.useRef(false);

  const syncDetailQuery = React.useCallback(
    ({
      nextCommentsPage = commentsPage,
      nextCommentsPerPage = commentsPerPage,
      nextHistoriesPage = historiesPage,
    }: {
      nextCommentsPage?: number;
      nextCommentsPerPage?: number;
      nextHistoriesPage?: number;
    }) => {
      const nextSearchParams = new URLSearchParams(searchParams.toString());

      syncPageParam(nextSearchParams, "comments_page", nextCommentsPage, commentsDefaultPage);
      syncPageParam(nextSearchParams, "comments_per_page", nextCommentsPerPage, commentsDefaultPerPage);
      syncPageParam(nextSearchParams, "operation_histories_page", nextHistoriesPage, historiesDefaultPage);

      const nextQuery = nextSearchParams.toString();
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
    },
    [commentsPage, commentsPerPage, historiesPage, pathname, router, searchParams],
  );

  const fetchTalkDetail = React.useCallback(
    async (manualRefresh = false) => {
      if (!Number.isFinite(talkId) || talkId <= 0) {
        setLoadError("올바르지 않은 토크 경로입니다.");
        setIsLoading(false);
        return;
      }

      if (!hasLoadedRef.current) {
        setIsLoading(true);
      } else if (manualRefresh) {
        setIsRefreshing(true);
      }

      setLoadError(null);

      try {
        const response = await api.get<TalkDetailResponse>(`/talks/${talkId}`);

        if (!isApiSuccess(response)) {
          setLoadError(response.error.message || "토크 상세 정보를 불러오지 못했습니다.");
          return;
        }

        setDetail(response.data);
        hasLoadedRef.current = true;
      } catch {
        setLoadError("토크 상세 정보를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [talkId],
  );

  React.useEffect(() => {
    void fetchTalkDetail(false);
  }, [fetchTalkDetail]);

  const applyVisibilityChangeLocally = React.useCallback((target: "talk" | "comment", id: number, status: string) => {
    if (target === "comment") {
      setCommentsBlock((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          items: (prev.items ?? []).map((comment) => (comment.id === id ? { ...comment, status } : comment)),
        };
      });
      return;
    }

    setDetail((prev) => (prev ? { ...prev, status } : prev));
  }, []);

  const fetchTalkComments = React.useCallback(
    async (manualRefresh = false) => {
      if (!Number.isFinite(talkId) || talkId <= 0) return;

      if (manualRefresh || hasLoadedRef.current) {
        setIsRefreshing(true);
      }

      try {
        const response = await api.get<TalkDetailComment[]>(`/talks/${talkId}/comments`, {
          comments_page: commentsPage,
          comments_per_page: commentsPerPage,
        });

        if (!isApiSuccess(response)) {
          setActionError(response.error.message || "토크 댓글을 불러오지 못했습니다.");
          return;
        }

        setCommentsBlock({
          items: response.data,
          meta: (response.meta as DataTableMeta | null) ?? null,
        });
      } catch {
        setActionError("토크 댓글을 불러오는 중 오류가 발생했습니다.");
      } finally {
        setIsRefreshing(false);
      }
    },
    [commentsPage, commentsPerPage, talkId],
  );

  const fetchTalkOperationHistories = React.useCallback(
    async (manualRefresh = false) => {
      if (!Number.isFinite(talkId) || talkId <= 0) return;

      if (manualRefresh || hasLoadedRef.current) {
        setIsRefreshing(true);
      }

      try {
        const response = await api.get<TalkOperationHistory[]>(`/talks/${talkId}/operation-histories`, {
          operation_histories_page: historiesPage,
          operation_histories_per_page: TALK_DETAIL_HISTORY_PER_PAGE,
        });

        if (!isApiSuccess(response)) {
          setActionError(response.error.message || "토크 히스토리를 불러오지 못했습니다.");
          return;
        }

        setOperationHistoriesBlock({
          items: response.data,
          meta: (response.meta as DataTableMeta | null) ?? null,
        });
      } catch {
        setActionError("토크 히스토리를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setIsRefreshing(false);
      }
    },
    [historiesPage, talkId],
  );

  React.useEffect(() => {
    void fetchTalkComments(false);
  }, [fetchTalkComments]);

  React.useEffect(() => {
    void fetchTalkOperationHistories(false);
  }, [fetchTalkOperationHistories]);

  const requestTalkVisibility = React.useCallback(
    (status: "ACTIVE" | "INACTIVE") => {
      if (!detail) return;

      setPendingVisibilityChange({
        target: "talk",
        id: detail.id,
        status,
        hiddenReason: "",
      });
    },
    [detail],
  );

  const requestCommentVisibility = React.useCallback(
    (commentId: number, status: "ACTIVE" | "INACTIVE") => {
      const comment = commentsBlock?.items?.find((item) => item.id === commentId);
      if (!comment) return;

      setPendingVisibilityChange({
        target: "comment",
        id: commentId,
        status,
        hiddenReason: "",
      });
    },
    [commentsBlock],
  );

  const closeVisibilityConfirmModal = React.useCallback(() => {
    if (talkVisibilityUpdating) return;
    if (pendingVisibilityChange?.target === "comment" && commentVisibilityUpdatingIds.has(pendingVisibilityChange.id)) {
      return;
    }

    setPendingVisibilityChange(null);
  }, [commentVisibilityUpdatingIds, pendingVisibilityChange, talkVisibilityUpdating]);

  const updatePendingHiddenReason = React.useCallback((value: string) => {
    setPendingVisibilityChange((prev) => (prev ? { ...prev, hiddenReason: value } : prev));
  }, []);

  const confirmVisibilityChange = React.useCallback(async () => {
    if (!pendingVisibilityChange) return;

    const { target, id, status, hiddenReason } = pendingVisibilityChange;
    const isCommentChange = target === "comment";
    const previousStatus = isCommentChange
      ? commentsBlock?.items?.find((comment) => comment.id === id)?.status
      : detail?.status;
    const normalizedHiddenReason = status === "INACTIVE" ? hiddenReason?.trim() : "";
    const requestPayload: VisibilityUpdatePayload = {
      ids: [id],
      status,
    };

    if (normalizedHiddenReason) {
      requestPayload.hidden_reason = normalizedHiddenReason;
    }

    if (isCommentChange) {
      setCommentVisibilityUpdatingIds((prev) => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
    } else {
      setTalkVisibilityUpdating(true);
    }

    setActionError(null);
    setPendingVisibilityChange(null);
    applyVisibilityChangeLocally(target, id, status);

    try {
      const response = await api.patch<VisibilityUpdateResponse>(
        isCommentChange ? "/talk-comments/status" : "/talks/status",
        requestPayload,
      );

      if (!isApiSuccess(response)) {
        if (previousStatus) {
          applyVisibilityChangeLocally(target, id, previousStatus);
        }
        setActionError(response.error.message || `${isCommentChange ? "댓글" : "토크"} 노출 상태 변경에 실패했습니다.`);
        return;
      }

      if (isCommentChange) {
        void fetchTalkComments(true);
      } else {
        void fetchTalkDetail(true);
      }
      void fetchTalkOperationHistories(true);
    } catch {
      if (previousStatus) {
        applyVisibilityChangeLocally(target, id, previousStatus);
      }
      setActionError(`${isCommentChange ? "댓글" : "토크"} 노출 상태 변경 중 오류가 발생했습니다.`);
    } finally {
      if (isCommentChange) {
        setCommentVisibilityUpdatingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      } else {
        setTalkVisibilityUpdating(false);
      }
    }
  }, [
    applyVisibilityChangeLocally,
    commentsBlock,
    detail,
    fetchTalkComments,
    fetchTalkDetail,
    fetchTalkOperationHistories,
    pendingVisibilityChange,
  ]);

  const changeCommentsPage = React.useCallback(
    (page: number) => {
      setCommentsPage(page);
      syncDetailQuery({ nextCommentsPage: page });
    },
    [syncDetailQuery],
  );

  const changeHistoriesPage = React.useCallback(
    (page: number) => {
      setHistoriesPage(page);
      syncDetailQuery({ nextHistoriesPage: page });
    },
    [syncDetailQuery],
  );

  const changeCommentsPerPage = React.useCallback(
    (value: number) => {
      setCommentsPerPage(value);
      setCommentsPage(commentsDefaultPage);
      syncDetailQuery({
        nextCommentsPage: commentsDefaultPage,
        nextCommentsPerPage: value,
      });
    },
    [syncDetailQuery],
  );

  const toggleCommentHistory = React.useCallback((commentId: number) => {
    setExpandedCommentHistoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) next.delete(commentId);
      else next.add(commentId);
      return next;
    });
  }, []);

  if (isLoading) {
    return <SpinnerBlock className="min-h-[60vh]" spinnerClassName="size-10" />;
  }

  if (loadError || !detail) {
    return (
      <LoadErrorState
        title="토크 상세 정보를 불러오지 못했습니다."
        message={loadError ?? "토크 상세 정보를 찾을 수 없습니다."}
      />
    );
  }

  const commentItems = commentsBlock?.items ?? [];
  const commentsMeta = commentsBlock?.meta ?? null;
  const operationHistories = operationHistoriesBlock?.items ?? [];
  const operationHistoriesMeta = operationHistoriesBlock?.meta ?? null;
  const pendingVisibilityLabel = pendingVisibilityChange?.status === "ACTIVE" ? "노출" : "미노출";
  const pendingVisibilityMessage = pendingVisibilityChange
    ? `해당 ${pendingVisibilityChange.target === "comment" ? "댓글을" : "토크를"} ${pendingVisibilityLabel} 하시겠습니까?`
    : "";
  const pendingVisibilityUpdating = pendingVisibilityChange
    ? pendingVisibilityChange.target === "comment"
      ? commentVisibilityUpdatingIds.has(pendingVisibilityChange.id)
      : talkVisibilityUpdating
    : false;

  return (
    <div className="space-y-6">
      {actionError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {actionError}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(400px,0.92fr)]">
        <div className="space-y-6">
          <TalkMemberSummaryCard detail={detail} />
          <TalkContentCard
            detail={detail}
            visibilityUpdating={talkVisibilityUpdating}
            canUpdateStatus={canUpdateStatus}
            onChangeVisibility={requestTalkVisibility}
            onPreviewMedia={setPreviewMedia}
          />
          <TalkHistoryCard
            histories={operationHistories}
            meta={operationHistoriesMeta}
            refreshing={isRefreshing}
            onGoPage={changeHistoriesPage}
          />
        </div>

        <TalkCommentsCard
          comments={commentItems}
          commentsMeta={commentsMeta}
          commentCount={Number(detail.comment_count ?? commentsMeta?.total ?? 0)}
          perPage={commentsPerPage}
          refreshing={isRefreshing}
          expandedHistoryIds={expandedCommentHistoryIds}
          updatingIds={commentVisibilityUpdatingIds}
          canUpdateStatus={canUpdateStatus}
          onChangePage={changeCommentsPage}
          onChangePerPage={changeCommentsPerPage}
          onToggleHistory={toggleCommentHistory}
          onChangeVisibility={requestCommentVisibility}
        />
      </div>

      {canUpdateStatus ? (
        <VisibilityConfirmModal
          isOpen={Boolean(pendingVisibilityChange)}
          status={pendingVisibilityChange?.status}
          message={pendingVisibilityMessage}
          hiddenReasonValue={pendingVisibilityChange?.hiddenReason ?? ""}
          updating={pendingVisibilityUpdating}
          reasonInputId="detail-visibility-hidden-reason"
          onHiddenReasonChange={updatePendingHiddenReason}
          onClose={closeVisibilityConfirmModal}
          onConfirm={() => void confirmVisibilityChange()}
        />
      ) : null}

      {previewMedia ? (
        <MediaPreviewModal preview={previewMedia} onChange={setPreviewMedia} onClose={() => setPreviewMedia(null)} />
      ) : null}
    </div>
  );
}

function parsePositivePage(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parseCommentsPerPage(value: string | null) {
  const parsed = Number(value);
  return TALK_DETAIL_COMMENT_PER_PAGE_OPTIONS.includes(parsed as (typeof TALK_DETAIL_COMMENT_PER_PAGE_OPTIONS)[number])
    ? parsed
    : commentsDefaultPerPage;
}

function syncPageParam(params: URLSearchParams, key: string, value: number, defaultValue: number) {
  if (value === defaultValue) {
    params.delete(key);
    return;
  }

  params.set(key, String(value));
}
