"use client";

import React from "react";
import { type DataTableMeta } from "@beaulab/ui-admin";

import { type MediaPreviewState } from "@/components/common/MediaPreviewModal";
import {
  REPORTED_EVALUATION_RECEIPT_STATUS_VERIFIED,
  useReportedEvaluationReceipt,
} from "@/hooks/reported-content/useReportedEvaluationReceipt";
import {
  formatHospitalEvaluationDetailDateTime,
  type HospitalEvaluationDetailResponse,
  type HospitalEvaluationOperationHistory,
} from "@/lib/hospital-evaluation/detail";
import type {
  ReportedContentDetailResponse,
  ReportedContentReportsBlock,
  ReportedContentTargetType,
} from "@/lib/reported-content/detail";

import { ReportedContentDetailLayout } from "./ReportedContentDetailLayout";
import {
  ReportedEvaluationContentCard,
  ReportedEvaluationHospitalSummaryCard,
  ReportedEvaluationMemberSummaryCard,
} from "./ReportedEvaluationInfoCards";
import { ReportedEvaluationReceiptVerificationModal } from "./ReportedEvaluationReceiptVerificationModal";
import { ReportedEvaluationAssessmentCard, ReportedEvaluationRatingScoreCard } from "./ReportedEvaluationScoreCards";

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
    <ReportedContentDetailLayout
      actionError={actionError}
      topContent={
        <div className="grid gap-6 xl:grid-cols-2">
          <ReportedEvaluationMemberSummaryCard detail={detail} />
          <ReportedEvaluationHospitalSummaryCard detail={detail} />
        </div>
      }
      gridClassName="grid gap-6 xl:grid-cols-2"
      leftContent={
        <ReportedEvaluationContentCard
          detail={detail}
          receiptButtonLabel={receipt.receiptButtonLabel}
          receiptButtonVerified={receiptStatus === REPORTED_EVALUATION_RECEIPT_STATUS_VERIFIED}
          hasReceiptImages={receiptImages.length > 0}
          receiptButtonDisabled={receipt.updating}
          onOpenReceiptModal={receipt.openModal}
          onPreviewMedia={setPreviewMedia}
        />
      }
      rightContent={
        <div className="grid gap-6 md:grid-cols-2">
          <ReportedEvaluationRatingScoreCard detail={detail} />
          <ReportedEvaluationAssessmentCard assessment={detail.assessment} />
        </div>
      }
      histories={histories}
      historiesMeta={historiesMeta}
      historiesRefreshing={refreshing}
      formatHistoryDate={(history) => formatHospitalEvaluationDetailDateTime(history.created_at)}
      onHistoryPageChange={onHistoryPageChange}
      targetType={targetType}
      targetId={targetId}
      reportedDetail={reportedDetail}
      reportedReports={reportedReports}
      onReportedStatusUpdated={onReportedStatusUpdated}
      previewMedia={previewMedia}
      onPreviewMediaChange={setPreviewMedia}
      onPreviewMediaClose={() => setPreviewMedia(null)}
      modals={
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
      }
    />
  );
}
