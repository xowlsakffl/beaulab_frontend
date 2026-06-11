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
import { isVisibilityLockedByReport } from "@/lib/common/content-report";
import { buildReturnToPath } from "@/lib/common/navigation/buildReturnToPath";
import { resolveMediaUrl, type MediaAsset } from "@/lib/hospital/detail";
import {
  HospitalMediaPreviewModal,
  type HospitalMediaPreviewState,
} from "@/components/hospital/media/HospitalMediaPreviewModal";
import { DetailImageGallery, type DetailImageGalleryItem } from "@/components/common/DetailImageGallery";
import {
  TALK_DETAIL_COMMENT_PER_PAGE_OPTIONS,
  TALK_DETAIL_HISTORY_PER_PAGE,
  formatTalkAuthorName,
  formatTalkDetailCategory,
  formatTalkDetailDateTime,
  formatTalkCommentHistoryReason,
  formatTalkHistoryReason,
  labelTalkCommentHistoryChange,
  labelTalkHistoryChange,
  labelTalkVisibilityStatus,
  type PaginatedBlock,
  type TalkCommentHistory,
  type TalkDetailComment,
  type TalkDetailResponse,
  type TalkMediaAsset,
  type TalkOperationHistory,
  type TalkPollOption,
} from "@/lib/talk/detail";

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
const detailGridClass = "grid grid-cols-[6.25rem_minmax(0,1fr)] items-start gap-4";
const detailLabelClass = "pt-0.5 text-xs font-semibold text-gray-500 ";
const detailValueClass = "min-w-0 break-words text-sm leading-6 text-gray-800 ";

export default function TalkDetailPageClient() {
  const params = useParams<{ id: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawTalkId = Array.isArray(params.id) ? params.id[0] : params.id;
  const talkId = Number(rawTalkId);

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
  const [commentVisibilityUpdatingIds, setCommentVisibilityUpdatingIds] = React.useState<Set<number>>(
    () => new Set(),
  );
  const [pendingVisibilityChange, setPendingVisibilityChange] = React.useState<PendingVisibilityChange | null>(null);
  const [previewMedia, setPreviewMedia] = React.useState<HospitalMediaPreviewState | null>(null);
  const [expandedCommentHistoryIds, setExpandedCommentHistoryIds] = React.useState<Set<number>>(
    () => new Set(),
  );
  const hasLoadedRef = React.useRef(false);

  const getReturnToPath = React.useCallback(
    (highlightId?: number) =>
      buildReturnToPath({
        searchParams,
        fallbackPath: "/talks",
        allowedPrefix: "/talks",
        highlightId,
      }),
    [searchParams],
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

  const refreshTalkPage = React.useCallback(
    async (manualRefresh = false) => {
      await Promise.all([
        fetchTalkDetail(manualRefresh),
        fetchTalkComments(manualRefresh),
        fetchTalkOperationHistories(manualRefresh),
      ]);
    },
    [fetchTalkComments, fetchTalkDetail, fetchTalkOperationHistories],
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

    try {
      const response = await api.patch<VisibilityUpdateResponse>(
        isCommentChange ? "/talk-comments/status" : "/talks/status",
        requestPayload,
      );

      if (!isApiSuccess(response)) {
        setActionError(response.error.message || `${isCommentChange ? "댓글" : "토크"} 노출 상태 변경에 실패했습니다.`);
        return;
      }

      setPendingVisibilityChange(null);
      await refreshTalkPage(true);
    } catch {
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
  }, [pendingVisibilityChange, refreshTalkPage]);

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
          <CardTitle>토크 상세 정보를 불러오지 못했습니다.</CardTitle>
          <CardDescription>{loadError ?? "토크 상세 정보를 찾을 수 없습니다."}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 pt-0">
          <Button type="button" variant="brand" onClick={() => void refreshTalkPage(true)}>
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
  const talkVisibilityLocked = isVisibilityLockedByReport(detail.report);
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
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700   ">
          {actionError}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(400px,0.92fr)]">
        <div className="space-y-6">
          <MemberSummaryCard detail={detail} onBack={() => router.push(getReturnToPath())} />
          <TalkContentCard
            detail={detail}
            visibilityLocked={talkVisibilityLocked}
            visibilityUpdating={talkVisibilityUpdating}
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
            <p className="text-sm font-medium text-gray-800 ">
              {pendingVisibilityMessage}
            </p>

            {pendingVisibilityChange?.status === "INACTIVE" ? (
              <div className="mt-4">
                <label
                  htmlFor="detail-visibility-hidden-reason"
                  className="mb-1.5 block text-sm font-medium text-gray-700 "
                >
                  미노출 사유
                </label>
                <InputField
                  id="detail-visibility-hidden-reason"
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

      <HospitalMediaPreviewModal preview={previewMedia} onChange={setPreviewMedia} onClose={() => setPreviewMedia(null)} />
    </div>
  );
}

function MemberSummaryCard({
  detail,
  onBack,
}: {
  detail: TalkDetailResponse;
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
        <DetailField label="작성자" value={formatTalkAuthorName(detail.author)} />
        <DetailField label="작성일" value={formatTalkDetailDateTime(detail.created_at)} />
        <DetailField label="작성 IP" value={detail.author_ip || "-"} className="md:col-span-2" />
      </CardContent>
    </Card>
  );
}

function TalkContentCard({
  detail,
  visibilityLocked,
  visibilityUpdating,
  onChangeVisibility,
  onPreviewMedia,
}: {
  detail: TalkDetailResponse;
  visibilityLocked: boolean;
  visibilityUpdating: boolean;
  onChangeVisibility: (status: "ACTIVE" | "INACTIVE") => void;
  onPreviewMedia: (preview: HospitalMediaPreviewState) => void;
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
          <VisibilityButtons
            status={detail.status}
            disabled={visibilityLocked || visibilityUpdating}
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
          <p className="text-xs font-semibold text-gray-500 ">내용</p>
          <div className="min-h-36 whitespace-pre-wrap break-words rounded-2xl border border-gray-200 bg-white px-4 py-4 text-sm leading-7 text-gray-800   ">
            {detail.content?.trim() || "-"}
          </div>
        </section>

        <TalkImageGrid images={detail.images ?? []} onPreviewMedia={onPreviewMedia} />

        <section className="space-y-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-500 ">투표</p>
            {detail.poll?.allow_multiple ? (
              <span className="inline-flex rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-600  ">
                중복가능
              </span>
            ) : null}
          </div>
          {detail.poll ? (
            <div className="space-y-3">
              {pollOptions.map((option) => (
                <PollBar
                  key={option.id}
                  option={option}
                  totalVotes={totalPollVotes}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm font-semibold text-gray-800 ">등록된 투표가 없습니다.</p>
          )}
        </section>
      </CardContent>
    </Card>
  );
}

function TalkHistoryCard({
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
    <Card as="section">
      <CardHeader className="pb-4">
        <CardTitle>히스토리</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {histories.length > 0 ? (
          <div className="divide-y divide-gray-200 ">
            {histories.map((history) => (
              <div
                key={history.id}
                className="grid gap-2 py-3 text-sm text-gray-700 md:grid-cols-[10rem_8rem_8rem_minmax(0,1fr)] "
              >
                <span className="whitespace-nowrap text-xs text-gray-500 ">
                  {formatTalkDetailDateTime(history.created_at)}
                </span>
                <span className="truncate font-medium">{history.actor_label?.trim() || "-"}</span>
                <span className="font-medium">{labelTalkHistoryChange(history)}</span>
                <span className="min-w-0 break-words text-sm text-gray-600 ">
                  {formatTalkHistoryReason(history)}
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
  comments: TalkDetailComment[];
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
          <div>
            <CardTitle>댓글 {commentCount.toLocaleString()}개</CardTitle>
          </div>
          <label className="inline-flex items-center gap-2 text-xs font-medium text-gray-500 ">
            <select
              value={perPage}
              onChange={(event) => onChangePerPage(Number(event.target.value))}
              className="h-9 rounded-lg border border-gray-200 bg-white pl-3 pr-8 text-sm text-gray-800 outline-none transition focus:border-brand-400   "
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
  comment: TalkDetailComment;
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
        showSeparator ? "border-t border-gray-200 " : "",
        comment.is_reply
          ? "ml-8 border-l-2 border-gray-200 pl-5 "
          : "",
      ].filter(Boolean).join(" ")}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="text-sm font-semibold text-gray-900 ">
          {formatTalkAuthorName(comment.author)}
        </p>
        <p className="text-xs text-gray-500 ">
          {formatTalkDetailDateTime(comment.created_at)} | {comment.author_ip?.trim() || "-"}
        </p>
      </div>

      <div className="space-y-3">
        <div className="space-y-1 text-sm leading-6 text-gray-800 ">
          {comment.mention?.mention_text?.trim() ? (
            <span className="mr-1 font-semibold text-brand-500 ">
              @{comment.mention.mention_text}
            </span>
          ) : null}
          <span className="whitespace-pre-wrap">{comment.content?.trim() || "-"}</span>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <p className="text-sm text-gray-700 ">
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
        <div className="rounded-2xl bg-gray-50 px-4 py-3 ">
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
                className="-mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-gray-300 bg-white p-0 text-xs font-semibold leading-none text-gray-600 transition hover:border-brand-400 hover:text-brand-600   "
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

function CommentHistoryRow({ history }: { history: TalkCommentHistory }) {
  return (
    <div className="grid gap-2 text-xs text-gray-600 md:grid-cols-[9.5rem_6.5rem_7rem_minmax(0,1fr)] ">
      <span className="whitespace-nowrap text-gray-500 ">
        {formatTalkDetailDateTime(history.created_at)}
      </span>
      <span className="truncate font-medium">{history.actor_label?.trim() || "-"}</span>
      <span className="font-semibold">{labelTalkCommentHistoryChange(history)}</span>
      <span className="min-w-0 break-words">{formatTalkCommentHistoryReason(history)}</span>
    </div>
  );
}

function TalkImageGrid({
  images,
  onPreviewMedia,
}: {
  images: TalkMediaAsset[];
  onPreviewMedia: (preview: HospitalMediaPreviewState) => void;
}) {
  const galleryItems: DetailImageGalleryItem[] = images.map((image, index) => ({
    id: image.id ?? `talk-image-${index}`,
    url: resolveMediaUrl(image as MediaAsset),
    title: `토크 이미지 ${index + 1}`,
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
    <div className="relative h-10 overflow-hidden rounded-lg bg-gray-100 ">
      <div className="absolute inset-0">
        {fillWidth > 0 ? (
          <div
            className="h-full rounded-lg bg-brand-500 transition-[width]"
            style={{ width: `${fillWidth}%` }}
          />
        ) : null}
      </div>
      <div className="relative z-10 flex h-full items-center justify-between gap-3 px-3 text-sm font-semibold text-gray-900 ">
        <span className="min-w-0 truncate">{optionContent}</span>
        <span className="shrink-0 text-xs">
          {votes.toLocaleString()}명 ({percentage}%)
        </span>
      </div>
    </div>
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
    <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500   ">
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
