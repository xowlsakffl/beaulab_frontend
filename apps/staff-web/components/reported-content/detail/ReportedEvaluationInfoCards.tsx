"use client";

import React from "react";
import { Button, Card, CardContent, CardHeader, CardTitle, CircleCheck } from "@beaulab/ui-admin";

import type { MediaPreviewState } from "@/components/common/MediaPreviewModal";
import {
  formatHospitalEvaluationDetailAuthorName,
  formatHospitalEvaluationDetailDate,
  resolveHospitalEvaluationMediaUrl,
  titleHospitalEvaluationDetailReviewType,
  type HospitalEvaluationDetailResponse,
  type HospitalEvaluationMediaAsset,
} from "@/lib/hospital-evaluation/detail";

import { DetailImageGallery, type DetailImageGalleryItem } from "../../common/DetailImageGallery";
import { DetailField, EmptyDetailState } from "./ReportedDetailShared";

export function ReportedEvaluationMemberSummaryCard({ detail }: { detail: HospitalEvaluationDetailResponse }) {
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
}

export function ReportedEvaluationHospitalSummaryCard({ detail }: { detail: HospitalEvaluationDetailResponse }) {
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

export function ReportedEvaluationContentCard({
  detail,
  receiptButtonLabel,
  receiptButtonVerified,
  hasReceiptImages,
  receiptButtonDisabled,
  onOpenReceiptModal,
  onPreviewMedia,
}: {
  detail: HospitalEvaluationDetailResponse;
  receiptButtonLabel: string;
  receiptButtonVerified: boolean;
  hasReceiptImages: boolean;
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
          {hasReceiptImages ? (
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

        <ReportedEvaluationImageGallery
          title="평가 이미지"
          images={detail.images ?? []}
          onPreviewMedia={onPreviewMedia}
        />
      </CardContent>
    </Card>
  );
}

function ReportedEvaluationImageGallery({
  title,
  images,
  onPreviewMedia,
}: {
  title: string;
  images: HospitalEvaluationMediaAsset[];
  onPreviewMedia: (preview: MediaPreviewState) => void;
}) {
  const items: DetailImageGalleryItem[] = images.map((image, index) => ({
    id: image.id ?? `reported-hospital-evaluation-image-${index}`,
    url: resolveHospitalEvaluationMediaUrl(image),
    title: `${title} ${index + 1}`,
  }));

  return (
    <DetailImageGallery
      title={title}
      items={items}
      empty={<EmptyDetailState>등록된 이미지가 없습니다.</EmptyDetailState>}
      onPreview={onPreviewMedia}
    />
  );
}
