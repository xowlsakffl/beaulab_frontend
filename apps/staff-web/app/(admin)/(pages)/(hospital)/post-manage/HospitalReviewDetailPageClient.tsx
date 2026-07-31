"use client";

import React from "react";
import dynamic from "next/dynamic";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { isApiSuccess } from "@beaulab/types";
import { SpinnerBlock, type DataTableMeta } from "@beaulab/ui-admin";

import type { MediaPreviewState } from "@/components/common/MediaPreviewModal";
import { LoadErrorState } from "@/components/common/LoadErrorState";
import { VisibilityConfirmModal } from "@/components/common/VisibilityActionButtons";
import {
  CommentsCard,
  HospitalReviewContentCard,
  HospitalReviewHistoryCard,
  HospitalSummaryCard,
  MemberSummaryCard,
} from "@/components/hospital-review/detail/HospitalReviewDetailSections";
import { api } from "@/lib/common/api";
import { isVisibilityLockedByReport } from "@/lib/common/content-report";
import { HOSPITAL_REVIEW_BOARD_CONFIGS, type HospitalReviewBoardType } from "@/lib/hospital-review/list";
import {
  HOSPITAL_REVIEW_DETAIL_COMMENT_PER_PAGE_OPTIONS,
  HOSPITAL_REVIEW_DETAIL_HISTORY_PER_PAGE,
  type PaginatedBlock,
  type HospitalReviewDetailComment,
  type HospitalReviewDetailResponse,
  type HospitalReviewOperationHistory,
} from "@/lib/hospital-review/detail";

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
  target: "review" | "comment";
  id: number;
  status: "ACTIVE" | "INACTIVE";
  hiddenReason?: string;
};

type HospitalReviewDetailPageClientProps = {
  type: HospitalReviewBoardType;
};

const commentsDefaultPage = 1;
const historiesDefaultPage = 1;
const commentsDefaultPerPage = 10;

export default function HospitalReviewDetailPageClient({ type }: HospitalReviewDetailPageClientProps) {
  const config = HOSPITAL_REVIEW_BOARD_CONFIGS[type];
  const params = useParams<{ id: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawReviewId = Array.isArray(params.id) ? params.id[0] : params.id;
  const reviewId = Number(rawReviewId);

  const [detail, setDetail] = React.useState<HospitalReviewDetailResponse | null>(null);
  const [commentsBlock, setCommentsBlock] = React.useState<PaginatedBlock<HospitalReviewDetailComment> | null>(null);
  const [operationHistoriesBlock, setOperationHistoriesBlock] =
    React.useState<PaginatedBlock<HospitalReviewOperationHistory> | null>(null);
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
  const [reviewVisibilityUpdating, setReviewVisibilityUpdating] = React.useState(false);
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

  const fetchReviewDetail = React.useCallback(
    async (manualRefresh = false) => {
      if (!Number.isFinite(reviewId) || reviewId <= 0) {
        setLoadError("올바르지 않은 후기 경로입니다.");
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
        const response = await api.get<HospitalReviewDetailResponse>(`/hospital-reviews/${reviewId}`);

        if (!isApiSuccess(response)) {
          setLoadError(response.error.message || "후기 상세 정보를 불러오지 못했습니다.");
          return;
        }

        setDetail(response.data);
        hasLoadedRef.current = true;
      } catch {
        setLoadError("후기 상세 정보를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [reviewId],
  );

  React.useEffect(() => {
    void fetchReviewDetail(false);
  }, [fetchReviewDetail]);

  const applyVisibilityChangeLocally = React.useCallback((target: "review" | "comment", id: number, status: string) => {
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

  const fetchReviewComments = React.useCallback(
    async (manualRefresh = false) => {
      if (!Number.isFinite(reviewId) || reviewId <= 0) return;

      if (manualRefresh || hasLoadedRef.current) {
        setIsRefreshing(true);
      }

      try {
        const response = await api.get<HospitalReviewDetailComment[]>(`/hospital-reviews/${reviewId}/comments`, {
          comments_page: commentsPage,
          comments_per_page: commentsPerPage,
        });

        if (!isApiSuccess(response)) {
          setActionError(response.error.message || "후기 댓글을 불러오지 못했습니다.");
          return;
        }

        setCommentsBlock({
          items: response.data,
          meta: (response.meta as DataTableMeta | null) ?? null,
        });
      } catch {
        setActionError("후기 댓글을 불러오는 중 오류가 발생했습니다.");
      } finally {
        setIsRefreshing(false);
      }
    },
    [commentsPage, commentsPerPage, reviewId],
  );

  const fetchReviewOperationHistories = React.useCallback(
    async (manualRefresh = false) => {
      if (!Number.isFinite(reviewId) || reviewId <= 0) return;

      if (manualRefresh || hasLoadedRef.current) {
        setIsRefreshing(true);
      }

      try {
        const response = await api.get<HospitalReviewOperationHistory[]>(
          `/hospital-reviews/${reviewId}/operation-histories`,
          {
            operation_histories_page: historiesPage,
            operation_histories_per_page: HOSPITAL_REVIEW_DETAIL_HISTORY_PER_PAGE,
          },
        );

        if (!isApiSuccess(response)) {
          setActionError(response.error.message || "후기 히스토리를 불러오지 못했습니다.");
          return;
        }

        setOperationHistoriesBlock({
          items: response.data,
          meta: (response.meta as DataTableMeta | null) ?? null,
        });
      } catch {
        setActionError("후기 히스토리를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setIsRefreshing(false);
      }
    },
    [historiesPage, reviewId],
  );

  const refreshReviewPage = React.useCallback(
    async (manualRefresh = false) => {
      await Promise.all([
        fetchReviewDetail(manualRefresh),
        fetchReviewComments(manualRefresh),
        fetchReviewOperationHistories(manualRefresh),
      ]);
    },
    [fetchReviewComments, fetchReviewDetail, fetchReviewOperationHistories],
  );

  React.useEffect(() => {
    void fetchReviewComments(false);
  }, [fetchReviewComments]);

  React.useEffect(() => {
    void fetchReviewOperationHistories(false);
  }, [fetchReviewOperationHistories]);

  const requestReviewVisibility = React.useCallback(
    (status: "ACTIVE" | "INACTIVE") => {
      if (!detail) return;

      setPendingVisibilityChange({
        target: "review",
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
    if (reviewVisibilityUpdating) return;
    if (pendingVisibilityChange?.target === "comment" && commentVisibilityUpdatingIds.has(pendingVisibilityChange.id)) {
      return;
    }

    setPendingVisibilityChange(null);
  }, [commentVisibilityUpdatingIds, pendingVisibilityChange, reviewVisibilityUpdating]);

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
      setReviewVisibilityUpdating(true);
    }

    setActionError(null);
    setPendingVisibilityChange(null);
    applyVisibilityChangeLocally(target, id, status);

    try {
      const response = await api.patch<VisibilityUpdateResponse>(
        isCommentChange ? "/hospital-review-comments/status" : "/hospital-reviews/status",
        requestPayload,
      );

      if (!isApiSuccess(response)) {
        if (previousStatus) {
          applyVisibilityChangeLocally(target, id, previousStatus);
        }
        setActionError(response.error.message || `${isCommentChange ? "댓글" : "후기"} 노출 상태 변경에 실패했습니다.`);
        return;
      }

      if (isCommentChange) {
        void fetchReviewComments(true);
      } else {
        void fetchReviewDetail(true);
      }
      void fetchReviewOperationHistories(true);
    } catch {
      if (previousStatus) {
        applyVisibilityChangeLocally(target, id, previousStatus);
      }
      setActionError(`${isCommentChange ? "댓글" : "후기"} 노출 상태 변경 중 오류가 발생했습니다.`);
    } finally {
      if (isCommentChange) {
        setCommentVisibilityUpdatingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      } else {
        setReviewVisibilityUpdating(false);
      }
    }
  }, [
    applyVisibilityChangeLocally,
    commentsBlock,
    detail,
    fetchReviewComments,
    fetchReviewDetail,
    fetchReviewOperationHistories,
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
        title="후기 상세 정보를 불러오지 못했습니다."
        message={loadError ?? "후기 상세 정보를 찾을 수 없습니다."}
        onRetry={() => void refreshReviewPage(true)}
      />
    );
  }

  const commentItems = commentsBlock?.items ?? [];
  const commentsMeta = commentsBlock?.meta ?? null;
  const operationHistories = operationHistoriesBlock?.items ?? [];
  const operationHistoriesMeta = operationHistoriesBlock?.meta ?? null;
  const reviewVisibilityLocked = isVisibilityLockedByReport(detail.report);
  const pendingVisibilityLabel = pendingVisibilityChange?.status === "ACTIVE" ? "노출" : "미노출";
  const pendingVisibilityMessage = pendingVisibilityChange
    ? `해당 ${pendingVisibilityChange.target === "comment" ? "댓글을" : "후기를"} ${pendingVisibilityLabel} 하시겠습니까?`
    : "";
  const pendingVisibilityUpdating = pendingVisibilityChange
    ? pendingVisibilityChange.target === "comment"
      ? commentVisibilityUpdatingIds.has(pendingVisibilityChange.id)
      : reviewVisibilityUpdating
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
          <MemberSummaryCard detail={detail} />
          <HospitalReviewContentCard
            boardTitle={config.title}
            detail={detail}
            visibilityLocked={reviewVisibilityLocked}
            visibilityUpdating={reviewVisibilityUpdating}
            onChangeVisibility={requestReviewVisibility}
            onPreviewMedia={setPreviewMedia}
          />
          <HospitalReviewHistoryCard
            histories={operationHistories}
            meta={operationHistoriesMeta}
            refreshing={isRefreshing}
            onGoPage={changeHistoriesPage}
          />
        </div>

        <div className="space-y-6">
          <HospitalSummaryCard detail={detail} />
          <CommentsCard
            comments={commentItems}
            commentsMeta={commentsMeta}
            commentCount={Number(detail.comment_count ?? commentsMeta?.total ?? 0)}
            perPage={commentsPerPage}
            refreshing={isRefreshing}
            expandedHistoryIds={expandedCommentHistoryIds}
            updatingIds={commentVisibilityUpdatingIds}
            onChangePage={changeCommentsPage}
            onChangePerPage={changeCommentsPerPage}
            onToggleHistory={toggleCommentHistory}
            onChangeVisibility={requestCommentVisibility}
          />
        </div>
      </div>

      <VisibilityConfirmModal
        isOpen={Boolean(pendingVisibilityChange)}
        status={pendingVisibilityChange?.status}
        message={pendingVisibilityMessage}
        hiddenReasonValue={pendingVisibilityChange?.hiddenReason ?? ""}
        updating={pendingVisibilityUpdating}
        reasonInputId="hospital-review-detail-hidden-reason"
        onHiddenReasonChange={updatePendingHiddenReason}
        onClose={closeVisibilityConfirmModal}
        onConfirm={() => void confirmVisibilityChange()}
      />

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
  return HOSPITAL_REVIEW_DETAIL_COMMENT_PER_PAGE_OPTIONS.includes(
    parsed as (typeof HOSPITAL_REVIEW_DETAIL_COMMENT_PER_PAGE_OPTIONS)[number],
  )
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
