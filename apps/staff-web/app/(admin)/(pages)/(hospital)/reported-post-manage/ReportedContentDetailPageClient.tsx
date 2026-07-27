"use client";

import React from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { isApiSuccess } from "@beaulab/types";
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
  SpinnerBlock,
  type DataTableMeta,
} from "@beaulab/ui-admin";

import { CategoryBadgeList } from "@beaulab/ui-admin";
import { DetailImageGallery, type DetailImageGalleryItem } from "@/components/common/DetailImageGallery";
import {
  ReportedContentDetailPanel,
  type ReportedContentReportsBlock,
} from "@/components/reported-content/detail/ReportedContentDetailPanel";
import { ReportedOriginalHistoryCard } from "@/components/reported-content/detail/ReportedOriginalHistoryCard";
import { VisibilityActionButtons, VisibilityConfirmModal } from "@/components/common/VisibilityActionButtons";
import { MediaPreviewModal, type MediaPreviewState } from "@/components/common/MediaPreviewModal";
import { api } from "@/lib/common/api";
import { resolveMediaUrl, type MediaAsset } from "@/lib/hospital/detail";
import {
  HOSPITAL_EVALUATION_DETAIL_HISTORY_PER_PAGE,
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
import {
  HOSPITAL_REVIEW_DETAIL_HISTORY_PER_PAGE,
  formatHospitalReviewDetailAuthorName,
  formatHospitalReviewDetailCategories,
  formatHospitalReviewDetailCost,
  formatHospitalReviewDetailDate,
  formatHospitalReviewDetailDateTime,
  formatHospitalReviewDetailRating,
  getHospitalReviewDetailCategoryFullPaths,
  type HospitalReviewDetailResponse,
  type HospitalReviewOperationHistory,
} from "@/lib/hospital-review/detail";
import {
  HOSPITAL_REVIEW_BOARD_CONFIGS,
  labelHospitalReviewVisibilityStatus,
  resolveHospitalReviewMediaUrl,
  type HospitalReviewMediaAsset,
} from "@/lib/hospital-review/list";
import {
  TALK_DETAIL_HISTORY_PER_PAGE,
  formatTalkAuthorName,
  formatTalkDetailCategory,
  formatTalkDetailDateTime,
  labelTalkVisibilityStatus,
  type TalkDetailResponse,
  type TalkMediaAsset,
  type TalkOperationHistory,
  type TalkPollOption,
} from "@/lib/talk/detail";
import type {
  ReportedContentDetailReportItem,
  ReportedContentDetailResponse,
  ReportedContentReportsMeta,
  ReportedContentTargetType,
} from "@/lib/reported-content/detail";
import type { ReportedContentBoardType } from "@/lib/reported-content/list";

type ReportedContentDetailKind = "talk" | "review" | "evaluation";

type ReportedContentDetailConfig = {
  boardType: ReportedContentBoardType;
  kind: ReportedContentDetailKind;
  title: string;
  listPath: string;
  targetType: ReportedContentTargetType;
  historyPerPage: number;
  sourceApiPath: (id: number) => string;
  historyApiPath: (id: number) => string;
};

type ReportedContentDetailBoardType = Exclude<ReportedContentBoardType, "chats">;

type ReportedContentDetailPageClientProps = {
  type: ReportedContentDetailBoardType;
};

type DetailResponse = TalkDetailResponse | HospitalReviewDetailResponse | HospitalEvaluationDetailResponse;
type DetailHistory = TalkOperationHistory | HospitalReviewOperationHistory | HospitalEvaluationOperationHistory;
type DetailHistoryBlock = {
  items?: DetailHistory[] | null;
  meta?: DataTableMeta | null;
};
type ReceiptUpdateResponse = {
  id: number;
  receipt?: {
    status?: string | null;
    label?: string | null;
    rejection_reason?: string | null;
    rejection_reason_label?: string | null;
    rejection_reason_text?: string | null;
  } | null;
};

type ReceiptRejectPayload = {
  reason: string;
  reason_text?: string;
};

const RECEIPT_STATUS_VERIFIED = "VERIFIED";
const RECEIPT_STATUS_REJECTED = "REJECTED";

function getHospitalEvaluationReceiptStatus(detail: HospitalEvaluationDetailResponse | null): string {
  return detail?.receipt?.status?.trim() || "NONE";
}

function getHospitalEvaluationReceiptDecision(status: string): HospitalEvaluationReceiptDecision {
  return status === RECEIPT_STATUS_REJECTED ? "reject" : "verify";
}

function getHospitalEvaluationReceiptButtonLabel(status: string): string {
  if (status === RECEIPT_STATUS_VERIFIED) return "영수증 인증";
  if (status === RECEIPT_STATUS_REJECTED) return "영수증 부적합";

  return "영수증 등록";
}

function isCurrentHospitalEvaluationReceiptDecision(
  decision: HospitalEvaluationReceiptDecision,
  status: string,
): boolean {
  return (
    (decision === "verify" && status === RECEIPT_STATUS_VERIFIED) ||
    (decision === "reject" && status === RECEIPT_STATUS_REJECTED)
  );
}
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
type PendingReviewVisibilityChange = {
  target: "talk" | "review";
  id: number;
  status: "ACTIVE" | "INACTIVE";
  hiddenReason?: string;
} | null;

const historiesDefaultPage = 1;
const detailGridClass = "grid grid-cols-[6.25rem_minmax(0,1fr)] items-start gap-4";
const detailLabelClass = "pt-0.5 text-xs font-semibold text-gray-500 ";
const detailValueClass = "min-w-0 break-words text-sm leading-6 text-gray-800 ";

const DETAIL_CONFIGS: Record<ReportedContentDetailBoardType, ReportedContentDetailConfig> = {
  "surgery-reviews": {
    boardType: "surgery-reviews",
    kind: "review",
    title: "성형후기 신고게시물",
    listPath: "/reported-post-manage/surgery-reviews",
    targetType: "hospital_review",
    historyPerPage: HOSPITAL_REVIEW_DETAIL_HISTORY_PER_PAGE,
    sourceApiPath: (id) => `/hospital-reviews/${id}`,
    historyApiPath: (id) => `/hospital-reviews/${id}/operation-histories`,
  },
  "treatment-reviews": {
    boardType: "treatment-reviews",
    kind: "review",
    title: "시술후기 신고게시물",
    listPath: "/reported-post-manage/treatment-reviews",
    targetType: "hospital_review",
    historyPerPage: HOSPITAL_REVIEW_DETAIL_HISTORY_PER_PAGE,
    sourceApiPath: (id) => `/hospital-reviews/${id}`,
    historyApiPath: (id) => `/hospital-reviews/${id}/operation-histories`,
  },
  "hospital-evaluations": {
    boardType: "hospital-evaluations",
    kind: "evaluation",
    title: "병의원 평가 신고게시물",
    listPath: "/reported-post-manage/hospital-evaluations",
    targetType: "hospital_evaluation",
    historyPerPage: HOSPITAL_EVALUATION_DETAIL_HISTORY_PER_PAGE,
    sourceApiPath: (id) => `/hospital-evaluations/${id}`,
    historyApiPath: (id) => `/hospital-evaluations/${id}/operation-histories`,
  },
  talks: {
    boardType: "talks",
    kind: "talk",
    title: "토크 신고게시물",
    listPath: "/reported-post-manage/talks",
    targetType: "talk",
    historyPerPage: TALK_DETAIL_HISTORY_PER_PAGE,
    sourceApiPath: (id) => `/talks/${id}`,
    historyApiPath: (id) => `/talks/${id}/operation-histories`,
  },
};

export default function ReportedContentDetailPageClient({ type }: ReportedContentDetailPageClientProps) {
  const config = DETAIL_CONFIGS[type];
  const params = useParams<{ id: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const targetId = Number(rawId);
  const [detail, setDetail] = React.useState<DetailResponse | null>(null);
  const [reportedDetail, setReportedDetail] = React.useState<ReportedContentDetailResponse | null>(null);
  const [reportedReports, setReportedReports] = React.useState<ReportedContentReportsBlock | null>(null);
  const [historyBlock, setHistoryBlock] = React.useState<DetailHistoryBlock | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [historiesPage, setHistoriesPage] = React.useState(() =>
    parsePositivePage(searchParams.get("operation_histories_page"), historiesDefaultPage),
  );
  const [reviewVisibilityUpdating, setReviewVisibilityUpdating] = React.useState(false);
  const [pendingReviewVisibilityChange, setPendingReviewVisibilityChange] =
    React.useState<PendingReviewVisibilityChange>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = React.useState(false);
  const [receiptDecision, setReceiptDecision] = React.useState<HospitalEvaluationReceiptDecision>("verify");
  const [receiptRejectReason, setReceiptRejectReason] = React.useState("");
  const [receiptRejectReasonText, setReceiptRejectReasonText] = React.useState("");
  const [receiptUpdating, setReceiptUpdating] = React.useState(false);
  const [receiptModalError, setReceiptModalError] = React.useState<string | null>(null);
  const [previewMedia, setPreviewMedia] = React.useState<MediaPreviewState | null>(null);
  const hasLoadedRef = React.useRef(false);

  const syncDetailQuery = React.useCallback(
    (nextHistoriesPage: number) => {
      const nextSearchParams = new URLSearchParams(searchParams.toString());
      syncPageParam(nextSearchParams, "operation_histories_page", nextHistoriesPage, historiesDefaultPage);

      const nextQuery = nextSearchParams.toString();
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const fetchDetail = React.useCallback(
    async (manualRefresh = false) => {
      if (!Number.isFinite(targetId) || targetId <= 0) {
        setError("올바르지 않은 신고게시물 경로입니다.");
        setLoading(false);
        return;
      }

      if (!hasLoadedRef.current) {
        setLoading(true);
      } else if (manualRefresh) {
        setRefreshing(true);
      }

      setError(null);
      setReportedDetail(null);
      setReportedReports(null);

      try {
        const [response, reportedDetailResponse, reportedReportsResponse] = await Promise.all([
          api.get<DetailResponse>(config.sourceApiPath(targetId)),
          api
            .get<ReportedContentDetailResponse>(`/reported-contents/detail/${config.targetType}/${targetId}`, {
              include_target: 0,
            })
            .catch(() => null),
          api
            .get<ReportedContentDetailReportItem[]>(`/reported-contents/${config.targetType}/${targetId}/reports`, {
              reports_page: 1,
            })
            .catch(() => null),
        ]);

        if (!isApiSuccess(response)) {
          setError(response.error.message || "신고게시물 상세 정보를 불러오지 못했습니다.");
          return;
        }

        setDetail(response.data);
        setReportedDetail(
          reportedDetailResponse && isApiSuccess(reportedDetailResponse) ? reportedDetailResponse.data : null,
        );
        setReportedReports(
          reportedReportsResponse && isApiSuccess(reportedReportsResponse)
            ? {
                items: reportedReportsResponse.data ?? [],
                meta: (reportedReportsResponse.meta as ReportedContentReportsMeta | null) ?? null,
                page: 1,
              }
            : null,
        );
        hasLoadedRef.current = true;
      } catch {
        setError("신고게시물 상세 정보를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [config, targetId],
  );

  React.useEffect(() => {
    void fetchDetail(false);
  }, [fetchDetail]);

  const fetchHistories = React.useCallback(
    async (manualRefresh = false) => {
      if (!Number.isFinite(targetId) || targetId <= 0) return;

      if (manualRefresh || hasLoadedRef.current) {
        setRefreshing(true);
      }

      try {
        const response = await api.get<DetailHistory[]>(config.historyApiPath(targetId), {
          operation_histories_page: historiesPage,
          operation_histories_per_page: config.historyPerPage,
        });

        if (!isApiSuccess(response)) {
          setActionError(response.error.message || "신고게시물 히스토리를 불러오지 못했습니다.");
          return;
        }

        setHistoryBlock({
          items: response.data,
          meta: (response.meta as DataTableMeta | null) ?? null,
        });
      } catch {
        setActionError("신고게시물 히스토리를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setRefreshing(false);
      }
    },
    [config, historiesPage, targetId],
  );

  const refreshDetail = React.useCallback(
    async (manualRefresh = false) => {
      await Promise.all([fetchDetail(manualRefresh), fetchHistories(manualRefresh)]);
    },
    [fetchDetail, fetchHistories],
  );

  React.useEffect(() => {
    void fetchHistories(false);
  }, [fetchHistories]);

  const changeHistoriesPage = React.useCallback(
    (nextPage: number) => {
      setHistoriesPage(nextPage);
      syncDetailQuery(nextPage);
    },
    [syncDetailQuery],
  );

  const requestTalkVisibility = React.useCallback(
    (status: "ACTIVE" | "INACTIVE") => {
      if (config.kind !== "talk" || !detail) return;

      setPendingReviewVisibilityChange({
        target: "talk",
        id: (detail as TalkDetailResponse).id,
        status,
        hiddenReason: "",
      });
    },
    [config.kind, detail],
  );

  const requestReviewVisibility = React.useCallback(
    (status: "ACTIVE" | "INACTIVE") => {
      if (config.kind !== "review" || !detail) return;

      setPendingReviewVisibilityChange({
        target: "review",
        id: (detail as HospitalReviewDetailResponse).id,
        status,
        hiddenReason: "",
      });
    },
    [config.kind, detail],
  );

  const updatePendingReviewHiddenReason = React.useCallback((value: string) => {
    setPendingReviewVisibilityChange((prev) => (prev ? { ...prev, hiddenReason: value } : prev));
  }, []);

  const closeReviewVisibilityModal = React.useCallback(() => {
    if (reviewVisibilityUpdating) return;

    setPendingReviewVisibilityChange(null);
  }, [reviewVisibilityUpdating]);

  const confirmReviewVisibilityChange = React.useCallback(async () => {
    if (!pendingReviewVisibilityChange) return;

    const { target, id, status, hiddenReason } = pendingReviewVisibilityChange;
    const normalizedHiddenReason = status === "INACTIVE" ? hiddenReason?.trim() : "";
    const payload: VisibilityUpdatePayload = {
      ids: [id],
      status,
      ...(normalizedHiddenReason ? { hidden_reason: normalizedHiddenReason } : {}),
    };

    setReviewVisibilityUpdating(true);
    setActionError(null);

    try {
      const endpoint = target === "talk" ? "/talks/status" : "/hospital-reviews/status";
      const label = target === "talk" ? "토크" : "후기";
      const response = await api.patch<VisibilityUpdateResponse>(endpoint, payload);

      if (!isApiSuccess(response)) {
        setActionError(response.error.message || `${label} 노출 상태 변경에 실패했습니다.`);
        return;
      }

      setPendingReviewVisibilityChange(null);
      await refreshDetail(true);
    } catch {
      const label = target === "talk" ? "토크" : "후기";
      setActionError(`${label} 노출 상태 변경 중 오류가 발생했습니다.`);
    } finally {
      setReviewVisibilityUpdating(false);
    }
  }, [pendingReviewVisibilityChange, refreshDetail]);

  const openReceiptModal = React.useCallback(() => {
    const evaluation = config.kind === "evaluation" ? (detail as HospitalEvaluationDetailResponse | null) : null;
    const receiptStatus = getHospitalEvaluationReceiptStatus(evaluation);
    const nextDecision = getHospitalEvaluationReceiptDecision(receiptStatus);

    setReceiptDecision(nextDecision);
    setReceiptRejectReason(nextDecision === "reject" ? evaluation?.receipt?.rejection_reason?.trim() || "" : "");
    setReceiptRejectReasonText(
      nextDecision === "reject" ? evaluation?.receipt?.rejection_reason_text?.trim() || "" : "",
    );
    setReceiptModalError(null);
    setIsReceiptModalOpen(true);
  }, [config.kind, detail]);

  const closeReceiptModal = React.useCallback(() => {
    if (receiptUpdating) return;
    setIsReceiptModalOpen(false);
  }, [receiptUpdating]);

  const submitReceiptDecision = React.useCallback(async () => {
    if (config.kind !== "evaluation" || !detail) return;

    const evaluation = detail as HospitalEvaluationDetailResponse;

    setReceiptModalError(null);

    const receiptStatus = getHospitalEvaluationReceiptStatus(evaluation);

    if (isCurrentHospitalEvaluationReceiptDecision(receiptDecision, receiptStatus)) {
      setReceiptModalError(
        receiptDecision === "verify" ? "이미 인증 적합 처리된 영수증입니다." : "이미 인증 부적합 처리된 영수증입니다.",
      );
      return;
    }

    if (receiptDecision === "reject" && !receiptRejectReason) {
      setReceiptModalError("인증 부적합 사유를 선택해주세요.");
      return;
    }

    if (receiptDecision === "reject" && receiptRejectReason === "OTHER" && !receiptRejectReasonText.trim()) {
      setReceiptModalError("기타 사유를 입력해주세요.");
      return;
    }

    setReceiptUpdating(true);
    setActionError(null);

    try {
      const response =
        receiptDecision === "verify"
          ? await api.patch<ReceiptUpdateResponse>(`/hospital-evaluations/${evaluation.id}/receipt/verify`, {})
          : await api.patch<ReceiptUpdateResponse>(
              `/hospital-evaluations/${evaluation.id}/receipt/reject`,
              buildReceiptRejectPayload(receiptRejectReason, receiptRejectReasonText),
            );

      if (!isApiSuccess(response)) {
        setReceiptModalError(response.error.message || "영수증 인증 상태 저장에 실패했습니다.");
        return;
      }

      setIsReceiptModalOpen(false);
      await refreshDetail(true);
    } catch {
      setReceiptModalError("영수증 인증 상태 저장 중 오류가 발생했습니다.");
    } finally {
      setReceiptUpdating(false);
    }
  }, [config.kind, detail, receiptDecision, receiptRejectReason, receiptRejectReasonText, refreshDetail]);

  if (loading && !detail) {
    return (
      <SpinnerBlock className="min-h-[60vh]" spinnerClassName="size-10" label="신고게시물 상세 정보를 불러오는 중" />
    );
  }

  if (error || !detail) {
    return (
      <Card>
        <CardContent className="space-y-4 py-10">
          <p className="text-sm text-rose-600">{error || "신고게시물 상세 정보가 없습니다."}</p>
        </CardContent>
      </Card>
    );
  }

  const histories = historyBlock?.items ?? [];
  const historiesMeta = historyBlock?.meta ?? null;

  if (config.kind === "talk") {
    const talk = detail as TalkDetailResponse;
    const pendingVisibilityLabel = pendingReviewVisibilityChange?.status === "ACTIVE" ? "노출" : "미노출";
    const pendingVisibilityMessage = pendingReviewVisibilityChange
      ? `해당 토크를 ${pendingVisibilityLabel} 하시겠습니까?`
      : "";
    const pendingVisibilityUpdating = Boolean(pendingReviewVisibilityChange) && reviewVisibilityUpdating;

    return (
      <div className="space-y-6">
        {actionError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {actionError}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(400px,0.92fr)]">
          <div className="space-y-6">
            <ReportedTalkMemberSummaryCard detail={talk} />
            <ReportedTalkContentCard
              detail={talk}
              visibilityUpdating={reviewVisibilityUpdating}
              onChangeVisibility={requestTalkVisibility}
              onPreviewMedia={setPreviewMedia}
            />
            <ReportedOriginalHistoryCard
              histories={histories}
              meta={historiesMeta}
              refreshing={refreshing}
              formatDate={(history) => formatHistoryDate(config.kind, history)}
              onGoPage={changeHistoriesPage}
            />
          </div>

          <div className="space-y-6">
            <ReportedContentDetailPanel
              targetType={config.targetType}
              targetId={targetId}
              initialDetail={reportedDetail}
              initialReports={reportedReports}
              onStatusUpdated={() => void fetchHistories(true)}
            />
          </div>
        </div>

        <VisibilityConfirmModal
          isOpen={Boolean(pendingReviewVisibilityChange)}
          status={pendingReviewVisibilityChange?.status}
          message={pendingVisibilityMessage}
          hiddenReasonValue={pendingReviewVisibilityChange?.hiddenReason ?? ""}
          updating={pendingVisibilityUpdating}
          reasonInputId="reported-talk-detail-hidden-reason"
          onHiddenReasonChange={updatePendingReviewHiddenReason}
          onClose={closeReviewVisibilityModal}
          onConfirm={() => void confirmReviewVisibilityChange()}
        />

        <MediaPreviewModal preview={previewMedia} onChange={setPreviewMedia} onClose={() => setPreviewMedia(null)} />
      </div>
    );
  }

  if (config.kind === "review") {
    const review = detail as HospitalReviewDetailResponse;
    const pendingVisibilityLabel = pendingReviewVisibilityChange?.status === "ACTIVE" ? "노출" : "미노출";
    const pendingVisibilityMessage = pendingReviewVisibilityChange
      ? `해당 후기를 ${pendingVisibilityLabel} 하시겠습니까?`
      : "";
    const pendingVisibilityUpdating = Boolean(pendingReviewVisibilityChange) && reviewVisibilityUpdating;

    return (
      <div className="space-y-6">
        {actionError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {actionError}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(400px,0.92fr)]">
          <div className="space-y-6">
            <ReportedReviewMemberSummaryCard detail={review} />
            <ReportedReviewContentCard
              boardTitle={
                HOSPITAL_REVIEW_BOARD_CONFIGS[config.boardType === "treatment-reviews" ? "treatment" : "surgery"].title
              }
              detail={review}
              visibilityUpdating={reviewVisibilityUpdating}
              onChangeVisibility={requestReviewVisibility}
              onPreviewMedia={setPreviewMedia}
            />
            <ReportedOriginalHistoryCard
              histories={histories}
              meta={historiesMeta}
              refreshing={refreshing}
              formatDate={(history) => formatHistoryDate(config.kind, history)}
              onGoPage={changeHistoriesPage}
            />
          </div>

          <div className="space-y-6">
            <ReportedReviewHospitalSummaryCard detail={review} />
            <ReportedContentDetailPanel
              targetType={config.targetType}
              targetId={targetId}
              initialDetail={reportedDetail}
              initialReports={reportedReports}
              onStatusUpdated={() => void fetchHistories(true)}
            />
          </div>
        </div>

        <VisibilityConfirmModal
          isOpen={Boolean(pendingReviewVisibilityChange)}
          status={pendingReviewVisibilityChange?.status}
          message={pendingVisibilityMessage}
          hiddenReasonValue={pendingReviewVisibilityChange?.hiddenReason ?? ""}
          updating={pendingVisibilityUpdating}
          reasonInputId="reported-hospital-review-detail-hidden-reason"
          onHiddenReasonChange={updatePendingReviewHiddenReason}
          onClose={closeReviewVisibilityModal}
          onConfirm={() => void confirmReviewVisibilityChange()}
        />

        <MediaPreviewModal preview={previewMedia} onChange={setPreviewMedia} onClose={() => setPreviewMedia(null)} />
      </div>
    );
  }

  if (config.kind === "evaluation") {
    const evaluation = detail as HospitalEvaluationDetailResponse;
    const receiptImages = evaluation.receipt_images ?? [];
    const receiptImage = receiptImages[0] ?? null;
    const receiptStatus = getHospitalEvaluationReceiptStatus(evaluation);
    const receiptButtonLabel = getHospitalEvaluationReceiptButtonLabel(receiptStatus);

    return (
      <div className="space-y-6">
        {actionError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {actionError}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-2">
          <ReportedEvaluationMemberSummaryCard detail={evaluation} />
          <ReportedEvaluationHospitalSummaryCard detail={evaluation} />
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="space-y-6">
            <ReportedEvaluationContentCard
              detail={evaluation}
              receiptButtonLabel={receiptButtonLabel}
              receiptButtonVerified={receiptStatus === RECEIPT_STATUS_VERIFIED}
              hasReceiptImages={receiptImages.length > 0}
              receiptButtonDisabled={receiptUpdating}
              onOpenReceiptModal={openReceiptModal}
              onPreviewMedia={setPreviewMedia}
            />
            <ReportedOriginalHistoryCard
              histories={histories}
              meta={historiesMeta}
              refreshing={refreshing}
              formatDate={(history) => formatHistoryDate(config.kind, history)}
              onGoPage={changeHistoriesPage}
            />
          </div>

          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <ReportedEvaluationRatingScoreCard detail={evaluation} />
              <ReportedEvaluationAssessmentCard assessment={evaluation.assessment} />
            </div>
            <ReportedContentDetailPanel
              targetType={config.targetType}
              targetId={targetId}
              initialDetail={reportedDetail}
              initialReports={reportedReports}
              onStatusUpdated={() => void fetchHistories(true)}
            />
          </div>
        </div>

        <ReportedEvaluationReceiptVerificationModal
          isOpen={isReceiptModalOpen}
          image={receiptImage}
          currentStatus={receiptStatus}
          decision={receiptDecision}
          rejectReason={receiptRejectReason}
          rejectReasonText={receiptRejectReasonText}
          error={receiptModalError}
          updating={receiptUpdating}
          onClose={closeReceiptModal}
          onDecisionChange={setReceiptDecision}
          onRejectReasonChange={(value) => {
            setReceiptRejectReason(value);
            if (value !== "OTHER") setReceiptRejectReasonText("");
          }}
          onRejectReasonTextChange={setReceiptRejectReasonText}
          onSubmit={() => void submitReceiptDecision()}
          onPreviewMedia={setPreviewMedia}
        />

        <MediaPreviewModal preview={previewMedia} onChange={setPreviewMedia} onClose={() => setPreviewMedia(null)} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(400px,0.92fr)]">
        <div className="space-y-6">
          {renderOriginalSummary(config, detail)}
          {renderOriginalContent(config, detail, setPreviewMedia)}
          <ReportedOriginalHistoryCard
            histories={histories}
            meta={historiesMeta}
            refreshing={refreshing}
            formatDate={(history) => formatHistoryDate(config.kind, history)}
            onGoPage={changeHistoriesPage}
          />
        </div>

        <ReportedContentDetailPanel
          targetType={config.targetType}
          targetId={targetId}
          initialDetail={reportedDetail}
          initialReports={reportedReports}
          onStatusUpdated={() => void fetchHistories(true)}
        />
      </div>

      <MediaPreviewModal preview={previewMedia} onChange={setPreviewMedia} onClose={() => setPreviewMedia(null)} />
    </div>
  );
}

function ReportedTalkMemberSummaryCard({ detail }: { detail: TalkDetailResponse }) {
  return (
    <Card as="section">
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <CardTitle>회원정보</CardTitle>
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

function ReportedTalkContentCard({
  detail,
  visibilityUpdating,
  onChangeVisibility,
  onPreviewMedia,
}: {
  detail: TalkDetailResponse;
  visibilityUpdating: boolean;
  onChangeVisibility: (status: "ACTIVE" | "INACTIVE") => void;
  onPreviewMedia: (preview: MediaPreviewState) => void;
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
          <ReportedReviewVisibilityButtons
            status={detail.status}
            disabled={visibilityUpdating}
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
          <p className="text-xs font-semibold text-gray-500">내용</p>
          <div className="min-h-36 rounded-2xl border border-gray-200 bg-white px-4 py-4 text-sm leading-7 break-words whitespace-pre-wrap text-gray-800">
            {detail.content?.trim() || "-"}
          </div>
        </section>

        <ReportedTalkImageGrid images={detail.images ?? []} onPreviewMedia={onPreviewMedia} />

        <section className="space-y-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-500">투표</p>
            {detail.poll?.allow_multiple ? (
              <span className="inline-flex rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-600">
                중복가능
              </span>
            ) : null}
          </div>
          {detail.poll ? (
            <div className="space-y-3">
              {pollOptions.map((option) => (
                <ReportedTalkPollBar key={option.id} option={option} totalVotes={totalPollVotes} />
              ))}
            </div>
          ) : (
            <p className="text-sm font-semibold text-gray-800">등록된 투표가 없습니다.</p>
          )}
        </section>
      </CardContent>
    </Card>
  );
}

function ReportedTalkImageGrid({
  images,
  onPreviewMedia,
}: {
  images: TalkMediaAsset[];
  onPreviewMedia: (preview: MediaPreviewState) => void;
}) {
  const items: DetailImageGalleryItem[] = images.map((image, index) => ({
    id: image.id ?? `reported-talk-image-${index}`,
    url: resolveMediaUrl(image as MediaAsset),
    title: `이미지 ${index + 1}`,
  }));

  return (
    <DetailImageGallery
      title="이미지"
      items={items}
      layout="grid"
      empty={<EmptyDetailState>등록된 이미지가 없습니다.</EmptyDetailState>}
      onPreview={onPreviewMedia}
    />
  );
}

function ReportedTalkPollBar({ option, totalVotes }: { option: TalkPollOption; totalVotes: number }) {
  const votes = Number(option.vote_count ?? 0);
  const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
  const fillWidth = votes > 0 ? Math.max(percentage, 12) : 0;
  const optionContent = option.content?.trim() || "-";

  return (
    <div className="relative h-10 overflow-hidden rounded-lg bg-gray-100">
      <div className="absolute inset-0">
        {fillWidth > 0 ? (
          <div className="h-full rounded-lg bg-brand-500 transition-[width]" style={{ width: `${fillWidth}%` }} />
        ) : null}
      </div>
      <div className="relative z-10 flex h-full items-center justify-between gap-3 px-3 text-sm font-semibold text-gray-900">
        <span className="min-w-0 truncate">{optionContent}</span>
        <span className="shrink-0 text-xs">
          {votes.toLocaleString()}명 ({percentage}%)
        </span>
      </div>
    </div>
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
  onChangeVisibility,
  onPreviewMedia,
}: {
  boardTitle: string;
  detail: HospitalReviewDetailResponse;
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
          <ReportedReviewVisibilityButtons
            status={detail.status}
            disabled={visibilityUpdating}
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

function ReportedReviewVisibilityButtons({
  status,
  disabled,
  onChange,
}: {
  status?: string | null;
  disabled: boolean;
  onChange: (status: "ACTIVE" | "INACTIVE") => void;
}) {
  return <VisibilityActionButtons status={status} disabled={disabled} onChange={onChange} />;
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
  const isVerifyCurrent = currentStatus === RECEIPT_STATUS_VERIFIED;
  const isRejectCurrent = currentStatus === RECEIPT_STATUS_REJECTED;
  const isCurrentDecision = isCurrentHospitalEvaluationReceiptDecision(decision, currentStatus);
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
    <span className="inline-flex items-center gap-1 text-2xl leading-none" aria-label={`${normalizedValue}점`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <span key={index} className={index < normalizedValue ? "text-brand-500" : "text-gray-300"}>
          ★
        </span>
      ))}
    </span>
  );
}

function normalizeEvaluationAssessmentBoolean(value: unknown) {
  if (value === true || value === 1 || value === "1" || value === "true") return true;
  if (value === false || value === 0 || value === "0" || value === "false") return false;

  return false;
}

function renderOriginalSummary(config: ReportedContentDetailConfig, detail: DetailResponse) {
  if (config.kind === "talk") {
    const talk = detail as TalkDetailResponse;

    return (
      <Card as="section">
        <CardHeader className="pb-4">
          <CardTitle>작성자 정보</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <DetailField label="작성자" value={formatTalkAuthorName(talk.author)} />
          <DetailField label="작성일" value={formatTalkDetailDateTime(talk.created_at)} />
          <DetailField label="작성 IP" value={talk.author_ip?.trim() || "-"} />
          <DetailField label="노출여부" value={labelTalkVisibilityStatus(talk.status)} />
        </CardContent>
      </Card>
    );
  }

  if (config.kind === "evaluation") {
    const evaluation = detail as HospitalEvaluationDetailResponse;

    return (
      <div className="grid gap-6 lg:grid-cols-2">
        <Card as="section">
          <CardHeader className="pb-4">
            <CardTitle>작성자 정보</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <DetailField label="작성자" value={formatHospitalEvaluationDetailAuthorName(evaluation.author)} />
            <DetailField label="전화번호" value={evaluation.phone?.trim() || "-"} />
            <DetailField label="작성 IP" value={evaluation.author_ip?.trim() || "-"} />
            <DetailField label="작성일" value={formatHospitalEvaluationDetailDate(evaluation.created_at)} />
          </CardContent>
        </Card>
        <Card as="section">
          <CardHeader className="pb-4">
            <CardTitle>병의원 정보</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <DetailField label="병의원" value={evaluation.hospital?.name?.trim() || "-"} />
            <DetailField label="사업자등록번호" value={evaluation.hospital?.business_number?.trim() || "-"} />
            <DetailField label="의료진" value={evaluation.doctor?.name?.trim() || "-"} />
            <DetailField label="직책" value={evaluation.doctor?.position?.trim() || "-"} />
          </CardContent>
        </Card>
      </div>
    );
  }

  const review = detail as HospitalReviewDetailResponse;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card as="section">
        <CardHeader className="pb-4">
          <CardTitle>작성자 정보</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <DetailField label="작성자" value={formatHospitalReviewDetailAuthorName(review.author)} />
          <DetailField label="작성일" value={formatHospitalReviewDetailDate(review.created_at)} />
          <DetailField label="작성 IP" value={review.author_ip?.trim() || "-"} />
          <DetailField label="노출여부" value={labelHospitalReviewVisibilityStatus(review.status)} />
        </CardContent>
      </Card>
      <Card as="section">
        <CardHeader className="pb-4">
          <CardTitle>병의원 정보</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <DetailField label="병의원" value={review.hospital?.name?.trim() || "-"} />
          <DetailField label="사업자등록번호" value={review.hospital?.business_number?.trim() || "-"} />
          <DetailField label="의료진" value={review.doctor?.name?.trim() || "-"} />
          <DetailField label="직책" value={review.doctor?.position?.trim() || "-"} />
        </CardContent>
      </Card>
    </div>
  );
}

function renderOriginalContent(
  config: ReportedContentDetailConfig,
  detail: DetailResponse,
  onPreviewMedia: (preview: MediaPreviewState) => void,
) {
  if (config.kind === "talk") {
    const talk = detail as TalkDetailResponse;

    return (
      <Card as="section">
        <CardHeader className="pb-4">
          <CardTitle>토크</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <DetailField label="토크유형" value={formatTalkDetailCategory(talk.category)} />
          <DetailField label="토크제목" value={talk.title?.trim() || "-"} />
          <ContentBox content={talk.content} />
          <ImageStrip
            images={talk.images ?? []}
            resolveUrl={(image) => resolveMediaUrl(image)}
            onPreviewMedia={onPreviewMedia}
          />
          {talk.poll ? (
            <TalkPollSummary options={talk.poll.options ?? []} allowMultiple={Boolean(talk.poll.allow_multiple)} />
          ) : null}
        </CardContent>
      </Card>
    );
  }

  if (config.kind === "evaluation") {
    const evaluation = detail as HospitalEvaluationDetailResponse;

    return (
      <Card as="section">
        <CardHeader className="pb-4">
          <CardTitle>{titleHospitalEvaluationDetailReviewType(evaluation.categories)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <ContentBox content={evaluation.content} />
          <ImageStrip
            images={evaluation.images ?? []}
            resolveUrl={resolveHospitalEvaluationMediaUrl}
            onPreviewMedia={onPreviewMedia}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <EvaluationRatingsCard detail={evaluation} />
            <EvaluationAssessmentCard assessment={evaluation.assessment} />
          </div>
        </CardContent>
      </Card>
    );
  }

  const review = detail as HospitalReviewDetailResponse;
  const imageGroups = [
    ...(review.before_images ?? []).map((image) => ({ ...image, collection: image.collection || "before" })),
    ...(review.after_images ?? []).map((image) => ({ ...image, collection: image.collection || "after" })),
  ];

  return (
    <Card as="section">
      <CardHeader className="pb-4">
        <CardTitle>
          {HOSPITAL_REVIEW_BOARD_CONFIGS[config.boardType === "treatment-reviews" ? "treatment" : "surgery"].title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <DetailField label="카테고리" value={formatHospitalReviewDetailCategories(review.categories)} />
        <DetailField label="제목" value={review.title?.trim() || "-"} />
        <DetailField label="시/수술비용" value={formatHospitalReviewDetailCost(review.cost)} />
        <DetailField label="평점" value={formatHospitalReviewDetailRating(review.rating)} />
        <ContentBox content={review.content} />
        <ImageStrip images={imageGroups} resolveUrl={resolveHospitalReviewMediaUrl} onPreviewMedia={onPreviewMedia} />
      </CardContent>
    </Card>
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

function ContentBox({ content }: { content?: string | null }) {
  return (
    <section className="space-y-2">
      <p className="text-xs font-semibold text-gray-500">내용</p>
      <div className="min-h-44 rounded-2xl border border-gray-200 bg-white px-4 py-4 text-sm leading-7 break-words whitespace-pre-wrap text-gray-800">
        {content?.trim() || "-"}
      </div>
    </section>
  );
}

function ImageStrip<TImage>({
  images,
  resolveUrl,
  onPreviewMedia,
}: {
  images: TImage[];
  resolveUrl: (image: TImage) => string | null;
  onPreviewMedia: (preview: MediaPreviewState) => void;
}) {
  const items: DetailImageGalleryItem[] = images.map((image, index) => ({
    id: getImageKey(image, index),
    url: resolveUrl(image),
    title: `신고게시물 이미지 ${index + 1}`,
  }));

  if (images.length === 0) {
    return (
      <section className="space-y-2">
        <p className="text-xs font-semibold text-gray-500">이미지</p>
        <EmptyDetailState>등록된 이미지가 없습니다.</EmptyDetailState>
      </section>
    );
  }

  return (
    <DetailImageGallery
      title="이미지"
      items={items}
      empty={<EmptyDetailState>등록된 이미지가 없습니다.</EmptyDetailState>}
      onPreview={onPreviewMedia}
    />
  );
}

function TalkPollSummary({
  options,
  allowMultiple,
}: {
  options: Array<{ id: number; content?: string | null; vote_count?: number | null }>;
  allowMultiple: boolean;
}) {
  const totalVotes = options.reduce((sum, option) => sum + Number(option.vote_count ?? 0), 0);

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <p className="text-xs font-semibold text-gray-500">투표</p>
        {allowMultiple ? <span className="text-xs font-semibold text-brand-500">중복가능</span> : null}
      </div>
      <div className="space-y-2">
        {options.map((option) => {
          const voteCount = Number(option.vote_count ?? 0);
          const percent = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;

          return (
            <div key={option.id} className="overflow-hidden rounded-xl bg-gray-100">
              <div
                className="min-h-9 rounded-xl bg-brand-500/70 px-3 py-2 text-sm font-semibold text-white"
                style={{ width: totalVotes > 0 ? `${percent}%` : "0%" }}
              >
                <span className="text-gray-900">
                  {option.content?.trim() || "-"} {voteCount.toLocaleString()}명
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function EvaluationRatingsCard({ detail }: { detail: HospitalEvaluationDetailResponse }) {
  const ratings = detail.ratings ?? {};
  const rows = [
    { label: "직원 친절도", value: ratings.staff_kindness },
    { label: "수술 만족도", value: ratings.surgery_satisfaction },
    { label: "병원시설", value: ratings.facility },
    { label: "사후관리", value: ratings.aftercare },
    { label: "비용", value: ratings.cost },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-gray-900">평가점수</p>
        <span className="text-sm font-semibold text-gray-900">
          {formatHospitalEvaluationAverageRating(ratings.average)}점
        </span>
      </div>
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-gray-700">{row.label}</span>
            <span className="font-semibold text-brand-500">
              {"★".repeat(Number(row.value ?? 0)).padEnd(5, "☆")} {formatHospitalEvaluationDetailRating(row.value)}점
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EvaluationAssessmentCard({ assessment }: { assessment?: HospitalEvaluationAssessment | null }) {
  const rows = [
    { label: "과잉진료", value: assessment?.overtreatment?.label },
    { label: "대기시간", value: assessment?.waiting_time?.label },
    { label: "지정의사", value: assessment?.doctor_consultation?.label },
    { label: "지인에게", value: assessment?.recommendation?.label },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <p className="mb-4 text-sm font-semibold text-gray-900">평가 항목</p>
      <div className="grid grid-cols-2 gap-2">
        {rows.map((row) => (
          <div key={row.label} className="rounded-xl bg-gray-100 px-3 py-2 text-sm">
            <p className="text-xs font-semibold text-gray-500">{row.label}</p>
            <p className="mt-1 font-semibold text-gray-900">{row.value?.trim() || "-"}</p>
          </div>
        ))}
      </div>
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

function formatHistoryDate(kind: ReportedContentDetailKind, history: DetailHistory) {
  if (kind === "talk") return formatTalkDetailDateTime(history.created_at);
  if (kind === "evaluation") return formatHospitalEvaluationDetailDateTime(history.created_at);

  return formatHospitalReviewDetailDateTime(history.created_at);
}

function getImageKey(image: unknown, index: number) {
  if (typeof image === "object" && image !== null && "id" in image) {
    return String((image as { id?: number | string | null }).id ?? index);
  }

  return String(index);
}

function buildReceiptRejectPayload(reason: string, reasonText: string): ReceiptRejectPayload {
  return {
    reason,
    ...(reason === "OTHER" ? { reason_text: reasonText.trim() } : {}),
  };
}

function parsePositivePage(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function syncPageParam(params: URLSearchParams, key: string, value: number, defaultValue: number) {
  if (value === defaultValue) {
    params.delete(key);
    return;
  }

  params.set(key, String(value));
}
