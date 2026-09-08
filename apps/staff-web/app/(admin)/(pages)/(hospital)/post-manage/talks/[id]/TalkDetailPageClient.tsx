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
  TalkCommentsCard,
  TalkContentCard,
  TalkHistoryCard,
  TalkMemberSummaryCard,
} from "@/components/talk/detail/TalkDetailSections";
import { useManagedContentDetail } from "@/hooks/post-content/useManagedContentDetail";
import { getSession } from "@/lib/common/auth/session";
import { STAFF_STATUS_PERMISSIONS } from "@/lib/common/status-permissions";
import {
  TALK_DETAIL_COMMENT_PER_PAGE_OPTIONS,
  TALK_DETAIL_HISTORY_PER_PAGE,
  type TalkDetailComment,
  type TalkDetailResponse,
  type TalkOperationHistory,
} from "@/lib/talk/detail";

const MediaPreviewModal = dynamic(() =>
  import("@/components/common/MediaPreviewModal").then((module) => module.MediaPreviewModal),
);

const talkDetailConfig = {
  contentLabel: "토크",
  invalidPathMessage: "올바르지 않은 토크 경로입니다.",
  detailLoadMessage: "토크 상세 정보를 불러오지 못했습니다.",
  commentsLoadMessage: "토크 댓글을 불러오지 못했습니다.",
  historiesLoadMessage: "토크 히스토리를 불러오지 못했습니다.",
  detailPath: (id: number) => `/talks/${id}`,
  commentsPath: (id: number) => `/talks/${id}/comments`,
  historiesPath: (id: number) => `/talks/${id}/operation-histories`,
  contentStatusPath: "/talks/status",
  commentStatusPath: "/talk-comments/status",
  commentPerPageOptions: TALK_DETAIL_COMMENT_PER_PAGE_OPTIONS,
  historyPerPage: TALK_DETAIL_HISTORY_PER_PAGE,
} as const;

export default function TalkDetailPageClient() {
  const params = useParams<{ id: string }>();
  const rawTalkId = Array.isArray(params.id) ? params.id[0] : params.id;
  const talkId = Number(rawTalkId);
  const canUpdateStatus = hasPermission(getSession()?.auth, STAFF_STATUS_PERMISSIONS.talk);
  const [previewMedia, setPreviewMedia] = React.useState<MediaPreviewState | null>(null);
  const state = useManagedContentDetail<TalkDetailResponse, TalkDetailComment, TalkOperationHistory>({
    id: talkId,
    config: talkDetailConfig,
  });

  if (state.isLoading) {
    return <SpinnerBlock className="min-h-[60vh]" spinnerClassName="size-10" />;
  }

  if (state.loadError || !state.detail) {
    return (
      <LoadErrorState
        title="토크 상세 정보를 불러오지 못했습니다."
        message={state.loadError ?? "토크 상세 정보를 찾을 수 없습니다."}
      />
    );
  }

  const { detail } = state;

  return (
    <div className="space-y-6">
      <ActionErrorBanner message={state.actionError} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(400px,0.92fr)]">
        <div className="space-y-6">
          <TalkMemberSummaryCard detail={detail} />
          <TalkContentCard
            detail={detail}
            visibilityUpdating={state.contentVisibilityUpdating}
            canUpdateStatus={canUpdateStatus}
            onChangeVisibility={state.requestContentVisibility}
            onPreviewMedia={setPreviewMedia}
          />
          <TalkHistoryCard
            histories={state.histories}
            meta={state.historiesMeta}
            refreshing={state.isRefreshing}
            onGoPage={state.changeHistoriesPage}
          />
        </div>

        <TalkCommentsCard
          comments={state.comments}
          commentsMeta={state.commentsMeta}
          commentCount={Number(detail.comment_count ?? state.commentsMeta?.total ?? 0)}
          perPage={state.commentsPerPage}
          refreshing={state.isRefreshing}
          expandedHistoryIds={state.expandedCommentHistoryIds}
          updatingIds={state.commentVisibilityUpdatingIds}
          canUpdateStatus={canUpdateStatus}
          onChangePage={state.changeCommentsPage}
          onChangePerPage={state.changeCommentsPerPage}
          onToggleHistory={state.toggleCommentHistory}
          onChangeVisibility={state.requestCommentVisibility}
        />
      </div>

      {canUpdateStatus ? (
        <VisibilityConfirmModal
          isOpen={Boolean(state.pendingVisibilityChange)}
          status={state.pendingVisibilityChange?.status}
          message={state.pendingVisibilityMessage}
          hiddenReasonValue={state.pendingVisibilityChange?.hiddenReason ?? ""}
          updating={state.pendingVisibilityUpdating}
          reasonInputId="detail-visibility-hidden-reason"
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
