"use client";

import React from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { isApiSuccess } from "@beaulab/types";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  InputField,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalPanel,
  ModalTitle,
  Pagination,
  SpinnerBlock,
  type DataTableMeta,
} from "@beaulab/ui-admin";

import { api } from "@/lib/common/api";
import { buildReturnToPath } from "@/lib/common/navigation/buildReturnToPath";
import {
  HOSPITAL_REVIEW_BOARD_CONFIGS,
  resolveHospitalReviewMediaUrl,
  type HospitalReviewBoardType,
  type HospitalReviewMediaAsset,
} from "@/lib/hospital-review/list";
import {
  HOSPITAL_REVIEW_DETAIL_COMMENT_PER_PAGE_OPTIONS,
  HOSPITAL_REVIEW_DETAIL_HISTORY_PER_PAGE,
  formatHospitalReviewDetailAuthorName,
  formatHospitalReviewDetailDate,
  formatHospitalReviewDetailDateTime,
  formatHospitalReviewCommentHistoryReason,
  formatHospitalReviewHistoryReason,
  getHospitalReviewDetailSmallCategoryNames,
  labelHospitalReviewCommentHistoryChange,
  labelHospitalReviewHistoryChange,
  type PaginatedBlock,
  type HospitalReviewCommentHistory,
  type HospitalReviewDetailComment,
  type HospitalReviewDetailResponse,
  type HospitalReviewOperationHistory,
} from "@/lib/hospital-review/detail";

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
const detailGridClass = "grid grid-cols-[6.25rem_minmax(0,1fr)] items-start gap-4";
const detailLabelClass = "pt-0.5 text-xs font-semibold text-gray-500 dark:text-gray-400";
const detailValueClass = "min-w-0 break-words text-sm leading-6 text-gray-800 dark:text-gray-100";

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
  const [commentVisibilityUpdatingIds, setCommentVisibilityUpdatingIds] = React.useState<Set<number>>(
    () => new Set(),
  );
  const [pendingVisibilityChange, setPendingVisibilityChange] = React.useState<PendingVisibilityChange | null>(null);
  const [expandedCommentHistoryIds, setExpandedCommentHistoryIds] = React.useState<Set<number>>(
    () => new Set(),
  );
  const hasLoadedRef = React.useRef(false);

  const getReturnToPath = React.useCallback(
    (highlightId?: number) =>
      buildReturnToPath({
        searchParams,
        fallbackPath: config.listPath,
        allowedPrefix: config.listPath,
        highlightId,
      }),
    [config.listPath, searchParams],
  );

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

    try {
      const response = await api.patch<VisibilityUpdateResponse>(
        isCommentChange ? "/hospital-review-comments/status" : "/hospital-reviews/status",
        requestPayload,
      );

      if (!isApiSuccess(response)) {
        setActionError(response.error.message || `${isCommentChange ? "댓글" : "후기"} 노출 상태 변경에 실패했습니다.`);
        return;
      }

      setPendingVisibilityChange(null);
      await refreshReviewPage(true);
    } catch {
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
  }, [pendingVisibilityChange, refreshReviewPage]);

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
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>후기 상세 정보를 불러오지 못했습니다.</CardTitle>
          <CardDescription>{loadError ?? "후기 상세 정보를 찾을 수 없습니다."}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 pt-0">
          <Button type="button" variant="brand" onClick={() => void refreshReviewPage(true)}>
            다시 불러오기
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push(getReturnToPath())}>
            목록으로
          </Button>
        </CardContent>
      </Card>
    );
  }

  const commentItems = commentsBlock?.items ?? [];
  const commentsMeta = commentsBlock?.meta ?? null;
  const operationHistories = operationHistoriesBlock?.items ?? [];
  const operationHistoriesMeta = operationHistoriesBlock?.meta ?? null;
  const reviewVisibilityLocked = false;
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
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
          {actionError}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(400px,0.92fr)]">
        <div className="space-y-6">
          <MemberSummaryCard detail={detail} onBack={() => router.push(getReturnToPath(detail.id))} />
          <HospitalReviewContentCard
            boardTitle={config.title}
            detail={detail}
            visibilityLocked={reviewVisibilityLocked}
            visibilityUpdating={reviewVisibilityUpdating}
            onChangeVisibility={requestReviewVisibility}
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

      <Modal
        isOpen={Boolean(pendingVisibilityChange)}
        onClose={closeVisibilityConfirmModal}
        showCloseButton={false}
        className="mx-4 w-full max-w-md"
      >
        <ModalPanel>
          <ModalHeader className="pr-0">
            <ModalTitle>노출여부 변경</ModalTitle>
          </ModalHeader>

          <ModalBody className="mt-5">
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              {pendingVisibilityMessage}
            </p>

            {pendingVisibilityChange?.status === "INACTIVE" ? (
              <div className="mt-4">
                <label
                  htmlFor="hospital-review-detail-hidden-reason"
                  className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
                >
                  미노출 사유
                </label>
                <InputField
                  id="hospital-review-detail-hidden-reason"
                  name="hidden_reason"
                  value={pendingVisibilityChange.hiddenReason ?? ""}
                  onChange={(event) => updatePendingHiddenReason(event.target.value)}
                  disabled={pendingVisibilityUpdating}
                />
              </div>
            ) : null}
          </ModalBody>

          <ModalFooter>
            <Button
              type="button"
              variant="outline"
              onClick={closeVisibilityConfirmModal}
              disabled={pendingVisibilityUpdating}
            >
              취소
            </Button>
            <Button
              type="button"
              variant="brand"
              onClick={() => void confirmVisibilityChange()}
              disabled={pendingVisibilityUpdating}
            >
              {pendingVisibilityUpdating ? "처리 중..." : "확인"}
            </Button>
          </ModalFooter>
        </ModalPanel>
      </Modal>
    </div>
  );
}

function MemberSummaryCard({
  detail,
  onBack,
}: {
  detail: HospitalReviewDetailResponse;
  onBack: () => void;
}) {
  return (
    <Card as="section">
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <CardTitle>회원정보</CardTitle>
          <div className="flex w-full flex-row gap-2 sm:w-auto">
            <Button
              type="button"
              variant="outline"
              className="flex-1 sm:flex-none"
              onClick={onBack}
            >
              목록으로
            </Button>
          </div>
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

function HospitalSummaryCard({ detail }: { detail: HospitalReviewDetailResponse }) {
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

function HospitalReviewContentCard({
  boardTitle,
  detail,
  visibilityLocked,
  visibilityUpdating,
  onChangeVisibility,
}: {
  boardTitle: string;
  detail: HospitalReviewDetailResponse;
  visibilityLocked: boolean;
  visibilityUpdating: boolean;
  onChangeVisibility: (status: "ACTIVE" | "INACTIVE") => void;
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

        <ReviewImageGallery beforeImages={detail.before_images ?? []} afterImages={detail.after_images ?? []} />

        <section className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">내용</p>
          <div className="min-h-36 whitespace-pre-wrap break-words rounded-2xl border border-gray-200 bg-white px-4 py-4 text-sm leading-7 text-gray-800 dark:border-gray-800 dark:bg-gray-950/30 dark:text-gray-100">
            {detail.content?.trim() || "-"}
          </div>
        </section>
      </CardContent>
    </Card>
  );
}

function HospitalReviewHistoryCard({
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
    <Card as="section">
      <CardHeader className="pb-4">
        <CardTitle>히스토리</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {histories.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {histories.map((history) => (
              <div
                key={history.id}
                className="grid gap-2 py-3 text-sm text-gray-700 md:grid-cols-[10rem_8rem_8rem_minmax(0,1fr)] dark:text-gray-200"
              >
                <span className="whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                  {formatHospitalReviewDetailDateTime(history.created_at)}
                </span>
                <span className="truncate font-medium">{history.actor_label?.trim() || "-"}</span>
                <span className="font-medium">{labelHospitalReviewHistoryChange(history)}</span>
                <span className="min-w-0 break-words text-sm text-gray-600 dark:text-gray-300">
                  {formatHospitalReviewHistoryReason(history)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyDetailState>등록된 히스토리가 없습니다.</EmptyDetailState>
        )}

        {meta ? (
          <div className="flex justify-center pt-1">
            <Pagination
              currentPage={meta.current_page}
              totalPages={Math.max(1, meta.last_page)}
              onPageChange={onGoPage}
              disabled={refreshing}
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function CategoryBadges({ detail }: { detail: HospitalReviewDetailResponse }) {
  const categoryNames = getHospitalReviewDetailSmallCategoryNames(detail.categories);

  if (categoryNames.length === 0) {
    return "-";
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {categoryNames.map((categoryName) => (
        <span
          key={categoryName}
          className="inline-flex max-w-full items-center rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-600 ring-1 ring-brand-100 dark:bg-brand-500/15 dark:text-brand-300 dark:ring-brand-500/20"
        >
          #{categoryName}
        </span>
      ))}
    </div>
  );
}

function CommentsCard({
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
          <label className="inline-flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
            <select
              value={perPage}
              onChange={(event) => onChangePerPage(Number(event.target.value))}
              className="h-9 rounded-lg border border-gray-200 bg-white pl-3 pr-8 text-sm text-gray-800 outline-none transition focus:border-brand-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
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
  const visibilityLocked = false;

  return (
    <article
      className={[
        "space-y-4 py-5 first:pt-0 last:pb-0",
        showSeparator ? "border-t border-gray-200 dark:border-gray-800" : "",
        comment.is_reply
          ? "ml-8 border-l-2 border-gray-200 pl-5 dark:border-gray-800"
          : "",
      ].filter(Boolean).join(" ")}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">
          {formatHospitalReviewDetailAuthorName(comment.author)}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {formatHospitalReviewDetailDateTime(comment.created_at)} | {comment.author_ip?.trim() || "-"}
        </p>
      </div>

      <div className="space-y-3">
        <div className="space-y-1 text-sm leading-6 text-gray-800 dark:text-gray-100">
          {comment.mention?.mention_text?.trim() ? (
            <span className="mr-1 font-semibold text-brand-500 dark:text-brand-400">
              @{comment.mention.mention_text}
            </span>
          ) : null}
          <span className="whitespace-pre-wrap">{comment.content?.trim() || "-"}</span>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <p className="text-sm text-gray-700 dark:text-gray-200">
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
        <div className="rounded-2xl bg-gray-50 px-4 py-3 dark:bg-gray-950/40">
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
                className="-mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-gray-300 bg-white p-0 text-xs font-semibold leading-none text-gray-600 transition hover:border-brand-400 hover:text-brand-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
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
  return (
    <div className="grid gap-2 text-xs text-gray-600 md:grid-cols-[9.5rem_6.5rem_7rem_minmax(0,1fr)] dark:text-gray-300">
      <span className="whitespace-nowrap text-gray-500 dark:text-gray-400">
        {formatHospitalReviewDetailDateTime(history.created_at)}
      </span>
      <span className="truncate font-medium">{history.actor_label?.trim() || "-"}</span>
      <span className="font-semibold">{labelHospitalReviewCommentHistoryChange(history)}</span>
      <span className="min-w-0 break-words">{formatHospitalReviewCommentHistoryReason(history)}</span>
    </div>
  );
}

function ReviewImageGallery({
  beforeImages,
  afterImages,
}: {
  beforeImages: HospitalReviewMediaAsset[];
  afterImages: HospitalReviewMediaAsset[];
}) {
  const images = [
    ...beforeImages.map((image) => ({ image, label: "전" })),
    ...afterImages.map((image) => ({ image, label: "후" })),
  ];

  return (
    <section className="space-y-2">
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">이미지</p>
      {images.length > 0 ? (
        <div className="max-w-full overflow-x-auto pb-2" style={{ WebkitOverflowScrolling: "touch" }}>
          <div className="flex min-w-full gap-3">
            {images.map(({ image, label }) => {
              const imageUrl = resolveHospitalReviewMediaUrl(image);

              return (
                <a
                  key={`${label}-${image.id}`}
                  href={imageUrl ?? undefined}
                  target={imageUrl ? "_blank" : undefined}
                  rel={imageUrl ? "noreferrer" : undefined}
                  className="group relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950/30"
                  style={{ flex: "0 0 calc((100% - 2.25rem) / 4)" }}
                >
                  <span className="absolute left-2 top-2 z-10 rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-gray-700 shadow-sm dark:bg-gray-900/90 dark:text-gray-200">
                    {label}
                  </span>
                  {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- runtime storage URL
                    <img
                      src={imageUrl}
                      alt=""
                      className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <span className="px-3 text-center text-xs text-gray-500 dark:text-gray-400">미리보기 없음</span>
                  )}
                </a>
              );
            })}
          </div>
        </div>
      ) : (
        <EmptyDetailState>등록된 이미지가 없습니다.</EmptyDetailState>
      )}
    </section>
  );
}

function VisibilityButtons({
  status,
  disabled,
  onChange,
}: {
  status?: string | null;
  disabled: boolean;
  onChange: (status: "ACTIVE" | "INACTIVE") => void;
}) {
  const visible = status !== "INACTIVE";

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant={visible ? "outline" : "brand"}
        disabled={disabled || visible}
        onClick={() => onChange("ACTIVE")}
        className="min-w-16"
      >
        노출
      </Button>
      <Button
        type="button"
        size="sm"
        variant={visible ? "brand" : "outline"}
        disabled={disabled || !visible}
        onClick={() => onChange("INACTIVE")}
        className="min-w-16"
      >
        미노출
      </Button>
    </div>
  );
}

function DetailField({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={[detailGridClass, className].filter(Boolean).join(" ")}>
      <p className={detailLabelClass}>{label}</p>
      <div className={detailValueClass}>{value}</div>
    </div>
  );
}

function EmptyDetailState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-950/30 dark:text-gray-400">
      {children}
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
