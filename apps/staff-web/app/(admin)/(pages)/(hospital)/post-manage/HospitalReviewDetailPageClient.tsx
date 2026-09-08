"use client";

import React from "react";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { hasPermission } from "@beaulab/auth";
import { SpinnerBlock } from "@beaulab/ui-admin";

import { LoadErrorState } from "@/components/common/LoadErrorState";
import { ActionErrorBanner } from "@/components/common/ActionErrorBanner";
import type { MediaPreviewState } from "@/components/common/MediaPreviewModal";
import { VisibilityConfirmModal } from "@/components/common/VisibilityActionButtons";
import {
  CommentsCard,
  HospitalReviewContentCard,
  HospitalReviewHistoryCard,
  HospitalSummaryCard,
  MemberSummaryCard,
} from "@/components/hospital-review/detail/HospitalReviewDetailSections";
import { useManagedContentDetail } from "@/hooks/post-content/useManagedContentDetail";
import { getSession } from "@/lib/common/auth/session";
import { isVisibilityLockedByReport } from "@/lib/common/content-report";
import { STAFF_STATUS_PERMISSIONS } from "@/lib/common/status-permissions";
import {
  HOSPITAL_REVIEW_DETAIL_COMMENT_PER_PAGE_OPTIONS,
  HOSPITAL_REVIEW_DETAIL_HISTORY_PER_PAGE,
  type HospitalReviewDetailComment,
  type HospitalReviewDetailResponse,
  type HospitalReviewOperationHistory,
} from "@/lib/hospital-review/detail";
import { HOSPITAL_REVIEW_BOARD_CONFIGS, type HospitalReviewBoardType } from "@/lib/hospital-review/list";

const MediaPreviewModal = dynamic(() =>
  import("@/components/common/MediaPreviewModal").then((module) => module.MediaPreviewModal),
);

const hospitalReviewDetailConfig = {
  contentLabel: "후기",
  invalidPathMessage: "올바르지 않은 후기 경로입니다.",
  detailLoadMessage: "후기 상세 정보를 불러오지 못했습니다.",
  commentsLoadMessage: "후기 댓글을 불러오지 못했습니다.",
  historiesLoadMessage: "후기 히스토리를 불러오지 못했습니다.",
  detailPath: (id: number) => `/hospital-reviews/${id}`,
  commentsPath: (id: number) => `/hospital-reviews/${id}/comments`,
  historiesPath: (id: number) => `/hospital-reviews/${id}/operation-histories`,
  contentStatusPath: "/hospital-reviews/status",
  commentStatusPath: "/hospital-review-comments/status",
  commentPerPageOptions: HOSPITAL_REVIEW_DETAIL_COMMENT_PER_PAGE_OPTIONS,
  historyPerPage: HOSPITAL_REVIEW_DETAIL_HISTORY_PER_PAGE,
} as const;

type HospitalReviewDetailPageClientProps = { type: HospitalReviewBoardType };

export default function HospitalReviewDetailPageClient({ type }: HospitalReviewDetailPageClientProps) {
  const config = HOSPITAL_REVIEW_BOARD_CONFIGS[type];
  const params = useParams<{ id: string }>();
  const rawReviewId = Array.isArray(params.id) ? params.id[0] : params.id;
  const reviewId = Number(rawReviewId);
  const canUpdateStatus = hasPermission(getSession()?.auth, STAFF_STATUS_PERMISSIONS.hospitalReview);
  const [previewMedia, setPreviewMedia] = React.useState<MediaPreviewState | null>(null);
  const state = useManagedContentDetail<
    HospitalReviewDetailResponse,
    HospitalReviewDetailComment,
    HospitalReviewOperationHistory
  >({ id: reviewId, config: hospitalReviewDetailConfig });

  if (state.isLoading) {
    return <SpinnerBlock className="min-h-[60vh]" spinnerClassName="size-10" />;
  }

  if (state.loadError || !state.detail) {
    return (
      <LoadErrorState
        title="후기 상세 정보를 불러오지 못했습니다."
        message={state.loadError ?? "후기 상세 정보를 찾을 수 없습니다."}
      />
    );
  }

  const { detail } = state;
  const reviewVisibilityLocked = isVisibilityLockedByReport(detail.report);

  return (
    <div className="space-y-6">
      <ActionErrorBanner message={state.actionError} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(400px,0.92fr)]">
        <div className="space-y-6">
          <MemberSummaryCard detail={detail} />
          <HospitalReviewContentCard
            boardTitle={config.title}
            detail={detail}
            canUpdateStatus={canUpdateStatus}
            visibilityLocked={reviewVisibilityLocked}
            visibilityUpdating={state.contentVisibilityUpdating}
            onChangeVisibility={state.requestContentVisibility}
            onPreviewMedia={setPreviewMedia}
          />
          <HospitalReviewHistoryCard
            histories={state.histories}
            meta={state.historiesMeta}
            refreshing={state.isRefreshing}
            onGoPage={state.changeHistoriesPage}
          />
        </div>

        <div className="space-y-6">
          <HospitalSummaryCard detail={detail} />
          <CommentsCard
            comments={state.comments}
            canUpdateStatus={canUpdateStatus}
            commentsMeta={state.commentsMeta}
            commentCount={Number(detail.comment_count ?? state.commentsMeta?.total ?? 0)}
            perPage={state.commentsPerPage}
            refreshing={state.isRefreshing}
            expandedHistoryIds={state.expandedCommentHistoryIds}
            updatingIds={state.commentVisibilityUpdatingIds}
            onChangePage={state.changeCommentsPage}
            onChangePerPage={state.changeCommentsPerPage}
            onToggleHistory={state.toggleCommentHistory}
            onChangeVisibility={state.requestCommentVisibility}
          />
        </div>
      </div>

      {canUpdateStatus ? (
        <VisibilityConfirmModal
          isOpen={Boolean(state.pendingVisibilityChange)}
          status={state.pendingVisibilityChange?.status}
          message={state.pendingVisibilityMessage}
          hiddenReasonValue={state.pendingVisibilityChange?.hiddenReason ?? ""}
          updating={state.pendingVisibilityUpdating}
          reasonInputId="hospital-review-detail-hidden-reason"
          onHiddenReasonChange={state.updatePendingHiddenReason}
          onClose={state.closeVisibilityConfirmModal}
          onConfirm={() => void state.confirmVisibilityChange()}
        />
      ) : null}

      {previewMedia ? (
        <MediaPreviewModal preview={previewMedia} onChange={setPreviewMedia} onClose={() => setPreviewMedia(null)} />
      ) : null}
    </div>
  );
}
