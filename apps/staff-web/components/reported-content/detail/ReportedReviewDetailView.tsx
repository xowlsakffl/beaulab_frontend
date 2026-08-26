"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CategoryBadgeList, type DataTableMeta } from "@beaulab/ui-admin";

import { type MediaPreviewState } from "@/components/common/MediaPreviewModal";
import { VisibilityConfirmModal } from "@/components/common/VisibilityActionButtons";
import { useReportedOriginalVisibility } from "@/hooks/reported-content/useReportedOriginalVisibility";
import {
  formatHospitalReviewDetailAuthorName,
  formatHospitalReviewDetailDate,
  formatHospitalReviewDetailDateTime,
  getHospitalReviewDetailCategoryFullPaths,
  type HospitalReviewDetailResponse,
  type HospitalReviewOperationHistory,
} from "@/lib/hospital-review/detail";
import {
  HOSPITAL_REVIEW_BOARD_CONFIGS,
  resolveHospitalReviewMediaUrl,
  type HospitalReviewMediaAsset,
} from "@/lib/hospital-review/list";
import type {
  ReportedContentDetailResponse,
  ReportedContentReportsBlock,
  ReportedContentTargetType,
} from "@/lib/reported-content/detail";
import type { ReportedContentBoardType } from "@/lib/reported-content/list";

import { DetailImageGallery, type DetailImageGalleryItem } from "../../common/DetailImageGallery";
import { ReportedContentDetailLayout } from "./ReportedContentDetailLayout";
import { DetailField, EmptyDetailState, ReportedOriginalVisibilityButtons } from "./ReportedDetailShared";

type ReportedReviewDetailViewProps = {
  boardType: ReportedContentBoardType;
  detail: HospitalReviewDetailResponse;
  histories: HospitalReviewOperationHistory[];
  historiesMeta: DataTableMeta | null;
  refreshing: boolean;
  targetType: ReportedContentTargetType;
  targetId: number;
  reportedDetail: ReportedContentDetailResponse | null;
  reportedReports: ReportedContentReportsBlock | null;
  actionError: string | null;
  onActionError: (message: string | null) => void;
  onSaved: () => Promise<void>;
  onReportedStatusUpdated: () => void;
  onHistoryPageChange: (page: number) => void;
  canUpdateReportedStatus: boolean;
  canUpdateOriginalStatus: boolean;
};

export function ReportedReviewDetailView({
  boardType,
  detail,
  histories,
  historiesMeta,
  refreshing,
  targetType,
  targetId,
  reportedDetail,
  reportedReports,
  actionError,
  onActionError,
  onSaved,
  onReportedStatusUpdated,
  onHistoryPageChange,
  canUpdateReportedStatus,
  canUpdateOriginalStatus,
}: ReportedReviewDetailViewProps) {
  const [previewMedia, setPreviewMedia] = React.useState<MediaPreviewState | null>(null);
  const originalVisibility = useReportedOriginalVisibility({
    onSaved,
    onError: onActionError,
  });
  const pendingVisibilityMessage = originalVisibility.pendingChange
    ? `해당 후기를 ${originalVisibility.pendingVisibilityLabel} 하시겠습니까?`
    : "";
  const pendingVisibilityUpdating = Boolean(originalVisibility.pendingChange) && originalVisibility.updating;
  const boardTitle = HOSPITAL_REVIEW_BOARD_CONFIGS[boardType === "treatment-reviews" ? "treatment" : "surgery"].title;

  return (
    <ReportedContentDetailLayout
      actionError={actionError}
      leftContent={
        <>
          <ReportedReviewMemberSummaryCard detail={detail} />
          <ReportedReviewContentCard
            boardTitle={boardTitle}
            detail={detail}
            visibilityUpdating={originalVisibility.updating}
            canUpdateStatus={canUpdateOriginalStatus}
            onChangeVisibility={(status) => originalVisibility.requestChange("review", detail.id, status)}
            onPreviewMedia={setPreviewMedia}
          />
        </>
      }
      rightContent={<ReportedReviewHospitalSummaryCard detail={detail} />}
      histories={histories}
      historiesMeta={historiesMeta}
      historiesRefreshing={refreshing}
      formatHistoryDate={(history) => formatHospitalReviewDetailDateTime(history.created_at)}
      onHistoryPageChange={onHistoryPageChange}
      targetType={targetType}
      targetId={targetId}
      reportedDetail={reportedDetail}
      reportedReports={reportedReports}
      onReportedStatusUpdated={onReportedStatusUpdated}
      canUpdateReportedStatus={canUpdateReportedStatus}
      previewMedia={previewMedia}
      onPreviewMediaChange={setPreviewMedia}
      onPreviewMediaClose={() => setPreviewMedia(null)}
      modals={
        canUpdateOriginalStatus ? (
          <VisibilityConfirmModal
            isOpen={Boolean(originalVisibility.pendingChange)}
            status={originalVisibility.pendingChange?.status}
            message={pendingVisibilityMessage}
            hiddenReasonValue={originalVisibility.pendingChange?.hiddenReason ?? ""}
            updating={pendingVisibilityUpdating}
            reasonInputId="reported-hospital-review-detail-hidden-reason"
            onHiddenReasonChange={originalVisibility.updateHiddenReason}
            onClose={originalVisibility.closeModal}
            onConfirm={() => void originalVisibility.confirmChange()}
          />
        ) : null
      }
    />
  );
}

function ReportedReviewMemberSummaryCard({ detail }: { detail: HospitalReviewDetailResponse }) {
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

function ReportedReviewHospitalSummaryCard({ detail }: { detail: HospitalReviewDetailResponse }) {
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

function ReportedReviewContentCard({
  boardTitle,
  detail,
  visibilityUpdating,
  canUpdateStatus,
  onChangeVisibility,
  onPreviewMedia,
}: {
  boardTitle: string;
  detail: HospitalReviewDetailResponse;
  visibilityUpdating: boolean;
  canUpdateStatus: boolean;
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
          <ReportedOriginalVisibilityButtons
            status={detail.status}
            disabled={visibilityUpdating}
            canUpdate={canUpdateStatus}
            onChange={onChangeVisibility}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid gap-4">
          <DetailField label="카테고리" value={<ReportedReviewCategoryBadges detail={detail} />} />
          <DetailField label="제목" value={detail.title?.trim() || "-"} />
        </div>

        <ReportedReviewImageGallery
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

function ReportedReviewCategoryBadges({ detail }: { detail: HospitalReviewDetailResponse }) {
  return <CategoryBadgeList values={getHospitalReviewDetailCategoryFullPaths(detail.categories)} />;
}

function ReportedReviewImageGallery({
  beforeImages,
  afterImages,
  onPreviewMedia,
}: {
  beforeImages: HospitalReviewMediaAsset[];
  afterImages: HospitalReviewMediaAsset[];
  onPreviewMedia: (preview: MediaPreviewState) => void;
}) {
  const items: DetailImageGalleryItem[] = [
    ...beforeImages.map((image, index) => ({
      id: `before-${image.id ?? index}`,
      url: resolveHospitalReviewMediaUrl(image),
      title: `전 이미지 ${index + 1}`,
      badge: "전",
    })),
    ...afterImages.map((image, index) => ({
      id: `after-${image.id ?? index}`,
      url: resolveHospitalReviewMediaUrl(image),
      title: `후 이미지 ${index + 1}`,
      badge: "후",
    })),
  ];

  return (
    <DetailImageGallery
      title="이미지"
      items={items}
      empty={<EmptyDetailState>등록된 이미지가 없습니다.</EmptyDetailState>}
      onPreview={onPreviewMedia}
    />
  );
}
