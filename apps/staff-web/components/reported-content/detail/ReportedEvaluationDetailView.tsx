"use client";

import React from "react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CircleCheck,
  FormCheckbox,
  InputField,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalPanel,
  ModalTitle,
  Select,
  Star,
  type DataTableMeta,
} from "@beaulab/ui-admin";

import { MediaPreviewModal, type MediaPreviewState } from "@/components/common/MediaPreviewModal";
import {
  REPORTED_EVALUATION_RECEIPT_STATUS_REJECTED,
  REPORTED_EVALUATION_RECEIPT_STATUS_VERIFIED,
  isCurrentReportedEvaluationReceiptDecision,
  useReportedEvaluationReceipt,
} from "@/hooks/reported-content/useReportedEvaluationReceipt";
import {
  HOSPITAL_EVALUATION_RECEIPT_REJECTION_OPTIONS,
  formatHospitalEvaluationAverageRating,
  formatHospitalEvaluationDetailAuthorName,
  formatHospitalEvaluationDetailDate,
  formatHospitalEvaluationDetailDateTime,
  formatHospitalEvaluationDetailRating,
  resolveHospitalEvaluationMediaUrl,
  titleHospitalEvaluationDetailReviewType,
  type HospitalEvaluationAssessment,
  type HospitalEvaluationDetailResponse,
  type HospitalEvaluationMediaAsset,
  type HospitalEvaluationOperationHistory,
  type HospitalEvaluationReceiptDecision,
} from "@/lib/hospital-evaluation/detail";
import type {
  ReportedContentDetailResponse,
  ReportedContentReportsBlock,
  ReportedContentTargetType,
} from "@/lib/reported-content/detail";

import { DetailImageGallery, type DetailImageGalleryItem } from "../../common/DetailImageGallery";
import { DetailField, EmptyDetailState } from "./ReportedDetailShared";
import { ReportedContentDetailPanel } from "./ReportedContentDetailPanel";
import { ReportedOriginalHistoryCard } from "./ReportedOriginalHistoryCard";

type ReportedEvaluationDetailViewProps = {
  detail: HospitalEvaluationDetailResponse;
  histories: HospitalEvaluationOperationHistory[];
  historiesMeta: DataTableMeta | null;
  refreshing: boolean;
  targetType: ReportedContentTargetType;
  targetId: number;
  reportedDetail: ReportedContentDetailResponse | null;
  reportedReports: ReportedContentReportsBlock | null;
  actionError: string | null;
  onActionError: (message: string | null) => void;
  onRefresh: () => Promise<void>;
  onReportedStatusUpdated: () => void;
  onHistoryPageChange: (page: number) => void;
};

export function ReportedEvaluationDetailView({
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
  onRefresh,
  onReportedStatusUpdated,
  onHistoryPageChange,
}: ReportedEvaluationDetailViewProps) {
  const [previewMedia, setPreviewMedia] = React.useState<MediaPreviewState | null>(null);
  const receipt = useReportedEvaluationReceipt({
    evaluation: detail,
    onBeforeSubmit: () => onActionError(null),
    onSaved: onRefresh,
  });
  const receiptImages = detail.receipt_images ?? [];
  const receiptImage = receiptImages[0] ?? null;
  const receiptStatus = receipt.receiptStatus;

  return (
    <div className="space-y-6">
      {actionError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {actionError}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <ReportedEvaluationMemberSummaryCard detail={detail} />
        <ReportedEvaluationHospitalSummaryCard detail={detail} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <ReportedEvaluationContentCard
            detail={detail}
            receiptButtonLabel={receipt.receiptButtonLabel}
            receiptButtonVerified={receiptStatus === REPORTED_EVALUATION_RECEIPT_STATUS_VERIFIED}
            hasReceiptImages={receiptImages.length > 0}
            receiptButtonDisabled={receipt.updating}
            onOpenReceiptModal={receipt.openModal}
            onPreviewMedia={setPreviewMedia}
          />
          <ReportedOriginalHistoryCard
            histories={histories}
            meta={historiesMeta}
            refreshing={refreshing}
            formatDate={(history) => formatHospitalEvaluationDetailDateTime(history.created_at)}
            onGoPage={onHistoryPageChange}
          />
        </div>

        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <ReportedEvaluationRatingScoreCard detail={detail} />
            <ReportedEvaluationAssessmentCard assessment={detail.assessment} />
          </div>
          <ReportedContentDetailPanel
            targetType={targetType}
            targetId={targetId}
            initialDetail={reportedDetail}
            initialReports={reportedReports}
            onStatusUpdated={onReportedStatusUpdated}
          />
        </div>
      </div>

      <ReportedEvaluationReceiptVerificationModal
        isOpen={receipt.isOpen}
        image={receiptImage}
        currentStatus={receiptStatus}
        decision={receipt.decision}
        rejectReason={receipt.rejectReason}
        rejectReasonText={receipt.rejectReasonText}
        error={receipt.error}
        updating={receipt.updating}
        onClose={receipt.closeModal}
        onDecisionChange={receipt.setDecision}
        onRejectReasonChange={receipt.changeRejectReason}
        onRejectReasonTextChange={receipt.setRejectReasonText}
        onSubmit={() => void receipt.submit()}
        onPreviewMedia={setPreviewMedia}
      />

      <MediaPreviewModal preview={previewMedia} onChange={setPreviewMedia} onClose={() => setPreviewMedia(null)} />
    </div>
  );
}

function ReportedEvaluationMemberSummaryCard({ detail }: { detail: HospitalEvaluationDetailResponse }) {
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

function ReportedEvaluationHospitalSummaryCard({ detail }: { detail: HospitalEvaluationDetailResponse }) {
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

function ReportedEvaluationContentCard({
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

function ReportedEvaluationRatingScoreCard({ detail }: { detail: HospitalEvaluationDetailResponse }) {
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
            <ReportedEvaluationStarRating value={Number(row.value ?? 0)} />
            <span className="text-right font-semibold text-gray-700">
              {formatHospitalEvaluationDetailRating(row.value)}점
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ReportedEvaluationAssessmentCard({ assessment }: { assessment?: HospitalEvaluationAssessment | null }) {
  const rows = [
    {
      label: "과잉진료",
      value: normalizeEvaluationAssessmentBoolean(assessment?.overtreatment?.value),
      options: [
        { value: true, label: "있음" },
        { value: false, label: "없음" },
      ],
    },
    {
      label: "대기시간",
      value: normalizeEvaluationAssessmentBoolean(assessment?.waiting_time?.value),
      options: [
        { value: true, label: "길었음" },
        { value: false, label: "짧았음" },
      ],
    },
    {
      label: "지정의사",
      value: normalizeEvaluationAssessmentBoolean(assessment?.doctor_consultation?.value),
      options: [
        { value: false, label: "상담안함" },
        { value: true, label: "상담함" },
      ],
    },
    {
      label: "지인에게",
      value: normalizeEvaluationAssessmentBoolean(assessment?.recommendation?.value),
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
}

function ReportedEvaluationReceiptVerificationModal({
  isOpen,
  image,
  currentStatus,
  decision,
  rejectReason,
  rejectReasonText,
  error,
  updating,
  onClose,
  onDecisionChange,
  onRejectReasonChange,
  onRejectReasonTextChange,
  onSubmit,
  onPreviewMedia,
}: {
  isOpen: boolean;
  image: HospitalEvaluationMediaAsset | null;
  currentStatus: string;
  decision: HospitalEvaluationReceiptDecision;
  rejectReason: string;
  rejectReasonText: string;
  error: string | null;
  updating: boolean;
  onClose: () => void;
  onDecisionChange: (decision: HospitalEvaluationReceiptDecision) => void;
  onRejectReasonChange: (value: string) => void;
  onRejectReasonTextChange: (value: string) => void;
  onSubmit: () => void;
  onPreviewMedia: (preview: MediaPreviewState) => void;
}) {
  const imageUrl = resolveHospitalEvaluationMediaUrl(image);
  const isVerifyCurrent = currentStatus === REPORTED_EVALUATION_RECEIPT_STATUS_VERIFIED;
  const isRejectCurrent = currentStatus === REPORTED_EVALUATION_RECEIPT_STATUS_REJECTED;
  const isCurrentDecision = isCurrentReportedEvaluationReceiptDecision(decision, currentStatus);
  const rejectInputsDisabled = updating || isRejectCurrent;

  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton={false} className="mx-4 w-full max-w-lg">
      <ModalPanel>
        <ModalHeader className="pr-0">
          <ModalTitle>영수증 인증</ModalTitle>
        </ModalHeader>

        <ModalBody className="mt-6 space-y-6">
          <div className="mx-auto flex aspect-square w-full max-w-[15rem] items-center justify-center overflow-hidden rounded-2xl bg-gray-100 text-sm font-medium text-gray-500">
            {imageUrl ? (
              <button
                type="button"
                className="block h-full w-full"
                onClick={() =>
                  onPreviewMedia({
                    url: imageUrl,
                    title: "영수증 사진",
                    isImage: true,
                    items: [{ url: imageUrl, title: "영수증 사진", isImage: true }],
                    index: 0,
                  })
                }
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- runtime storage URL */}
                <img src={imageUrl} alt="영수증 사진" className="h-full w-full object-cover" />
              </button>
            ) : (
              "영수증 사진"
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <ReportedReceiptDecisionOption
              label="인증 적합"
              checked={decision === "verify"}
              disabled={updating || (decision === "verify" && isVerifyCurrent)}
              onClick={() => onDecisionChange("verify")}
            />
            <ReportedReceiptDecisionOption
              label="인증 부적합"
              checked={decision === "reject"}
              disabled={updating || (decision === "reject" && isRejectCurrent)}
              onClick={() => onDecisionChange("reject")}
            />
          </div>

          {decision === "reject" ? (
            <div>
              <label
                htmlFor="reported-hospital-evaluation-receipt-reject-reason"
                className="mb-1.5 block text-sm font-semibold text-gray-800"
              >
                인증 부적합 사유
              </label>
              <Select
                id="reported-hospital-evaluation-receipt-reject-reason"
                value={rejectReason}
                placeholder="없음"
                options={[...HOSPITAL_EVALUATION_RECEIPT_REJECTION_OPTIONS]}
                onChange={onRejectReasonChange}
                disabled={rejectInputsDisabled}
                className="h-11 pl-3"
              />

              {rejectReason === "OTHER" ? (
                <div className="mt-3">
                  <InputField
                    id="reported-hospital-evaluation-receipt-reject-reason-text"
                    name="receipt_rejection_reason_text"
                    placeholder="기타 사유를 입력해주세요"
                    value={rejectReasonText}
                    onChange={(event) => onRejectReasonTextChange(event.target.value)}
                    disabled={rejectInputsDisabled}
                  />
                </div>
              ) : null}

              {error ? <p className="mt-1.5 text-sm font-medium text-error-500">{error}</p> : null}
            </div>
          ) : null}

          {decision !== "reject" && error ? <p className="text-sm font-medium text-error-500">{error}</p> : null}
        </ModalBody>

        <ModalFooter className="justify-center">
          <Button type="button" variant="outline" onClick={onClose} disabled={updating}>
            취소
          </Button>
          <Button type="button" variant="brand" onClick={onSubmit} disabled={updating || isCurrentDecision}>
            {updating ? "처리 중..." : "등록"}
          </Button>
        </ModalFooter>
      </ModalPanel>
    </Modal>
  );
}

function ReportedReceiptDecisionOption({
  label,
  checked,
  disabled,
  onClick,
}: {
  label: string;
  checked: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return <FormCheckbox disabled={disabled} checked={checked} label={label} onChange={onClick} />;
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

function ReportedEvaluationStarRating({ value }: { value: number }) {
  const normalizedValue = Math.max(0, Math.min(5, Math.round(value)));

  return (
    <span className="inline-flex items-center gap-1" aria-label={`${normalizedValue}점`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={[
            "size-5",
            index < normalizedValue ? "fill-brand-500 text-brand-500" : "fill-gray-200 text-gray-300",
          ].join(" ")}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

function normalizeEvaluationAssessmentBoolean(value: unknown) {
  if (value === true || value === 1 || value === "1" || value === "true") return true;
  if (value === false || value === 0 || value === "0" || value === "false") return false;

  return false;
}
