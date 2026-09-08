"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CategoryBadgeList,
  type DataTableMeta,
  StatusValueBadge,
} from "@beaulab/ui-admin";

import { DetailImageGallery, type DetailImageGalleryItem } from "@/components/common/DetailImageGallery";
import { ManagedCommentsCard } from "@/components/post-content/ManagedCommentsCard";
import type { MediaPreviewState } from "@/components/common/MediaPreviewModal";
import { OperationHistoryCard as CommonOperationHistoryCard } from "@/components/common/OperationHistoryCard";
import { VisibilityActionButtons as VisibilityButtons } from "@/components/common/VisibilityActionButtons";
import { labelOwnerVisibilityStatus, ownerVisibilityStatusColor } from "@/lib/common/status-labels";
import {
  HOSPITAL_REVIEW_DETAIL_COMMENT_PER_PAGE_OPTIONS,
  formatHospitalReviewDetailAuthorName,
  formatHospitalReviewDetailDate,
  formatHospitalReviewDetailDateTime,
  getHospitalReviewDetailCategoryFullPaths,
  type HospitalReviewDetailComment,
  type HospitalReviewDetailResponse,
  type HospitalReviewOperationHistory,
} from "@/lib/hospital-review/detail";
import { resolveHospitalReviewMediaUrl, type HospitalReviewMediaAsset } from "@/lib/hospital-review/list";

const detailGridClass = "grid grid-cols-[6.25rem_minmax(0,1fr)] items-start gap-4";
const detailLabelClass = "pt-0.5 text-xs font-semibold text-gray-500 ";
const detailValueClass = "min-w-0 break-words text-sm leading-6 text-gray-800 ";

export const MemberSummaryCard = React.memo(function MemberSummaryCard({
  detail,
}: {
  detail: HospitalReviewDetailResponse;
}) {
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
});

export const HospitalSummaryCard = React.memo(function HospitalSummaryCard({
  detail,
}: {
  detail: HospitalReviewDetailResponse;
}) {
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
});

export const HospitalReviewContentCard = React.memo(function HospitalReviewContentCard({
  boardTitle,
  detail,
  canUpdateStatus,
  visibilityLocked,
  visibilityUpdating,
  onChangeVisibility,
  onPreviewMedia,
}: {
  boardTitle: string;
  detail: HospitalReviewDetailResponse;
  canUpdateStatus: boolean;
  visibilityLocked: boolean;
  visibilityUpdating: boolean;
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
          {canUpdateStatus ? (
            <VisibilityButtons
              status={detail.status}
              disabled={visibilityLocked || visibilityUpdating}
              onChange={onChangeVisibility}
            />
          ) : (
            <StatusValueBadge
              label={labelOwnerVisibilityStatus(detail.status)}
              color={ownerVisibilityStatusColor(detail.status)}
            />
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid gap-4">
          <DetailField label="카테고리" value={<CategoryBadges detail={detail} />} />
          <DetailField label="제목" value={detail.title?.trim() || "-"} />
        </div>

        <ReviewImageGallery
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
});

export const HospitalReviewHistoryCard = React.memo(function HospitalReviewHistoryCard({
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
    <CommonOperationHistoryCard
      histories={histories}
      meta={meta}
      loading={refreshing}
      onPageChange={onGoPage}
      formatDateTime={formatHospitalReviewDetailDateTime}
    />
  );
});

export const CommentsCard = React.memo(function CommentsCard({
  comments,
  canUpdateStatus,
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
  canUpdateStatus: boolean;
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
    <ManagedCommentsCard
      comments={comments}
      commentsMeta={commentsMeta}
      commentCount={commentCount}
      perPage={perPage}
      perPageOptions={HOSPITAL_REVIEW_DETAIL_COMMENT_PER_PAGE_OPTIONS}
      refreshing={refreshing}
      expandedHistoryIds={expandedHistoryIds}
      updatingIds={updatingIds}
      canUpdateStatus={canUpdateStatus}
      formatAuthor={formatHospitalReviewDetailAuthorName}
      formatDateTime={formatHospitalReviewDetailDateTime}
      statusLabel={labelOwnerVisibilityStatus}
      statusColor={ownerVisibilityStatusColor}
      onChangePage={onChangePage}
      onChangePerPage={onChangePerPage}
      onToggleHistory={onToggleHistory}
      onChangeVisibility={onChangeVisibility}
    />
  );
});

function CategoryBadges({ detail }: { detail: HospitalReviewDetailResponse }) {
  return <CategoryBadgeList values={getHospitalReviewDetailCategoryFullPaths(detail.categories)} />;
}

function ReviewImageGallery({
  beforeImages,
  afterImages,
  onPreviewMedia,
}: {
  beforeImages: HospitalReviewMediaAsset[];
  afterImages: HospitalReviewMediaAsset[];
  onPreviewMedia: (preview: MediaPreviewState) => void;
}) {
  const images = [
    ...beforeImages.map((image, index) => ({ image, label: "전", index })),
    ...afterImages.map((image, index) => ({ image, label: "후", index })),
  ];
  const galleryItems: DetailImageGalleryItem[] = images.map(({ image, label, index }, imageIndex) => ({
    id: `${label}-${image.id ?? imageIndex}`,
    url: resolveHospitalReviewMediaUrl(image),
    title: `${label} 이미지 ${index + 1}`,
    badge: label,
  }));

  return (
    <DetailImageGallery
      title="이미지"
      items={galleryItems}
      empty={<EmptyDetailState>등록된 이미지가 없습니다.</EmptyDetailState>}
      onPreview={onPreviewMedia}
    />
  );
}

function DetailField({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={[detailGridClass, className].filter(Boolean).join(" ")}>
      <p className={detailLabelClass}>{label}</p>
      <div className={detailValueClass}>{value}</div>
    </div>
  );
}

function EmptyDetailState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
      {children}
    </div>
  );
}
