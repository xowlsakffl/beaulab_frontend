"use client";

import React from "react";
import { Button, Card, CardContent, CardHeader, CardTitle, CircleCheck, StatusBadge, type DataTableMeta } from "@beaulab/ui-admin";

import { DetailImageGallery, type DetailImageGalleryItem } from "@/components/common/DetailImageGallery";
import type { MediaPreviewState } from "@/components/common/MediaPreviewModal";
import { OperationHistoryCard as CommonOperationHistoryCard } from "@/components/common/OperationHistoryCard";
import {
  formatHospitalEvaluationAverageRating,
  formatHospitalEvaluationDetailAuthorName,
  formatHospitalEvaluationDetailDate,
  formatHospitalEvaluationDetailDateTime,
  formatHospitalEvaluationDetailRating,
  labelHospitalEvaluationReceiptStatus,
  resolveHospitalEvaluationMediaUrl,
  titleHospitalEvaluationDetailReviewType,
  type HospitalEvaluationAssessment,
  type HospitalEvaluationDetailResponse,
  type HospitalEvaluationMediaAsset,
  type HospitalEvaluationOperationHistory,
} from "@/lib/hospital-evaluation/detail";

const detailGridClass = "grid grid-cols-[6.25rem_minmax(0,1fr)] items-start gap-4";
const detailLabelClass = "pt-0.5 text-xs font-semibold text-gray-500";
const detailValueClass = "min-w-0 break-words text-sm leading-6 text-gray-800";

export const HospitalEvaluationMemberSummaryCard = React.memo(function HospitalEvaluationMemberSummaryCard({
  detail,
}: {
  detail: HospitalEvaluationDetailResponse;
}) {
  return (
    <Card as="section">
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <CardTitle>회원정보</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <DetailField label="작성자" value={formatHospitalEvaluationDetailAuthorName(detail.author)} />
        <DetailField label="전화번호" value={detail.phone?.trim() || "-"} />
        <DetailField label="작성IP" value={detail.author_ip?.trim() || "-"} />
        <DetailField label="작성일" value={formatHospitalEvaluationDetailDate(detail.created_at)} />
      </CardContent>
    </Card>
  );
});

export const HospitalEvaluationHospitalSummaryCard = React.memo(function HospitalEvaluationHospitalSummaryCard({
  detail,
}: {
  detail: HospitalEvaluationDetailResponse;
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

export const HospitalEvaluationContentCard = React.memo(function HospitalEvaluationContentCard({
  detail,
  receiptButtonLabel,
  receiptButtonVerified,
  hasReceiptImages,
  canUpdateReceiptStatus,
  receiptButtonDisabled,
  onOpenReceiptModal,
  onPreviewMedia,
}: {
  detail: HospitalEvaluationDetailResponse;
  receiptButtonLabel: string;
  receiptButtonVerified: boolean;
  hasReceiptImages: boolean;
  canUpdateReceiptStatus: boolean;
  receiptButtonDisabled: boolean;
  onOpenReceiptModal: () => void;
  onPreviewMedia: (preview: MediaPreviewState) => void;
}) {
  return (
    <Card as="section">
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <CardTitle>{titleHospitalEvaluationDetailReviewType(detail.categories)}</CardTitle>
          </div>
          {hasReceiptImages && canUpdateReceiptStatus ? (
            <Button
              type="button"
              variant="brand"
              size="sm"
              disabled={receiptButtonDisabled}
              onClick={onOpenReceiptModal}
              className="min-w-[7.5rem]"
            >
              {receiptButtonVerified ? <CircleCheck className="size-4" aria-hidden="true" /> : null}
              {receiptButtonLabel}
            </Button>
          ) : hasReceiptImages ? (
            <StatusBadge
              size="sm"
              color={detail.receipt?.status === "VERIFIED" ? "success" : detail.receipt?.status === "REJECTED" ? "error" : "light"}
            >
              {labelHospitalEvaluationReceiptStatus(detail.receipt?.status)}
            </StatusBadge>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <section className="space-y-2">
          <p className="text-xs font-semibold text-gray-500">내용</p>
          <div className="min-h-48 rounded-2xl border border-gray-200 bg-white px-4 py-4 text-sm leading-7 break-words whitespace-pre-wrap text-gray-800">
            {detail.content?.trim() || "-"}
          </div>
        </section>

        <ImageGallery title="평가 이미지" images={detail.images ?? []} onPreviewMedia={onPreviewMedia} />
      </CardContent>
    </Card>
  );
});

export const HospitalEvaluationRatingScoreCard = React.memo(function HospitalEvaluationRatingScoreCard({
  detail,
}: {
  detail: HospitalEvaluationDetailResponse;
}) {
  const ratings = detail.ratings ?? {};
  const rows = [
    { label: "직원 친절도", value: ratings.staff_kindness },
    { label: "수술 만족도", value: ratings.surgery_satisfaction },
    { label: "병원시설", value: ratings.facility },
    { label: "사후관리", value: ratings.aftercare },
    { label: "비용", value: ratings.cost },
  ];

  return (
    <Card as="section">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-3">
          <CardTitle>평가점수</CardTitle>
          <span className="text-sm font-semibold text-gray-900">
            {formatHospitalEvaluationAverageRating(ratings.average)}점
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-[5.5rem_minmax(0,1fr)_2.5rem] items-center gap-3 text-sm">
            <span className="font-medium text-gray-700">{row.label}</span>
            <StarRating value={Number(row.value ?? 0)} />
            <span className="text-right font-semibold text-gray-700">
              {formatHospitalEvaluationDetailRating(row.value)}점
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
});

export const HospitalEvaluationAssessmentCard = React.memo(function HospitalEvaluationAssessmentCard({
  assessment,
}: {
  assessment?: HospitalEvaluationAssessment | null;
}) {
  const rows = [
    {
      label: "과잉진료",
      value: normalizeAssessmentBoolean(assessment?.overtreatment?.value),
      options: [
        { value: true, label: "있음" },
        { value: false, label: "없음" },
      ],
    },
    {
      label: "대기시간",
      value: normalizeAssessmentBoolean(assessment?.waiting_time?.value),
      options: [
        { value: true, label: "길었음" },
        { value: false, label: "짧았음" },
      ],
    },
    {
      label: "지정의사",
      value: normalizeAssessmentBoolean(assessment?.doctor_consultation?.value),
      options: [
        { value: false, label: "상담안함" },
        { value: true, label: "상담함" },
      ],
    },
    {
      label: "지인에게",
      value: normalizeAssessmentBoolean(assessment?.recommendation?.value),
      options: [
        { value: false, label: "비추천" },
        { value: true, label: "추천" },
      ],
    },
  ];

  return (
    <Card as="section">
      <CardHeader className="pb-4">
        <CardTitle>평가 항목</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-2 text-sm">
            <span className="font-semibold text-gray-700">{row.label}</span>
            <div className="grid grid-cols-2 gap-2">
              {row.options.map((option) => (
                <span
                  key={option.label}
                  className={[
                    "inline-flex h-10 w-full items-center justify-center rounded-lg px-3 text-sm font-semibold ring-1",
                    option.value === row.value
                      ? "bg-brand-500 text-white ring-brand-500"
                      : "bg-white text-gray-600 ring-gray-200",
                  ].join(" ")}
                >
                  {option.label}
                </span>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
});

export const HospitalEvaluationHistoryCard = React.memo(function HospitalEvaluationHistoryCard({
  histories,
  meta,
  refreshing,
  onGoPage,
}: {
  histories: HospitalEvaluationOperationHistory[];
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
      formatDateTime={formatHospitalEvaluationDetailDateTime}
    />
  );
});

function ImageGallery({
  title,
  images,
  onPreviewMedia,
}: {
  title: string;
  images: HospitalEvaluationMediaAsset[];
  onPreviewMedia: (preview: MediaPreviewState) => void;
}) {
  const galleryItems: DetailImageGalleryItem[] = images.map((image, index) => ({
    id: image.id ?? `hospital-evaluation-image-${index}`,
    url: resolveHospitalEvaluationMediaUrl(image),
    title: `${title} ${index + 1}`,
  }));

  return (
    <DetailImageGallery
      title={title}
      items={galleryItems}
      empty={<EmptyDetailState>등록된 이미지가 없습니다.</EmptyDetailState>}
      onPreview={onPreviewMedia}
    />
  );
}

function StarRating({ value }: { value: number }) {
  const normalizedValue = Math.max(0, Math.min(5, Math.round(value)));

  return (
    <span className="inline-flex items-center gap-1 text-2xl leading-none" aria-label={`${normalizedValue}점`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <span key={index} className={index < normalizedValue ? "text-brand-500" : "text-gray-300"}>
          ★
        </span>
      ))}
    </span>
  );
}

function normalizeAssessmentBoolean(value: unknown) {
  if (value === true || value === 1 || value === "1" || value === "true") return true;
  if (value === false || value === 0 || value === "0" || value === "false") return false;

  return false;
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
