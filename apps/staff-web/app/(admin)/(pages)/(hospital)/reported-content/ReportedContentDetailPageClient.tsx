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

import { ReportedContentDetailPanel } from "@/components/reported-content/detail/ReportedContentDetailPanel";
import { api } from "@/lib/common/api";
import { buildReturnToPath } from "@/lib/common/navigation/buildReturnToPath";
import { resolveMediaUrl, type MediaAsset } from "@/lib/hospital/detail";
import {
  HOSPITAL_EVALUATION_DETAIL_HISTORY_PER_PAGE,
  HOSPITAL_EVALUATION_RECEIPT_REJECTION_OPTIONS,
  formatHospitalEvaluationAverageRating,
  formatHospitalEvaluationDetailAuthorName,
  formatHospitalEvaluationDetailDate,
  formatHospitalEvaluationDetailDateTime,
  formatHospitalEvaluationDetailRating,
  formatHospitalEvaluationHistoryReason,
  labelHospitalEvaluationHistoryChange,
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
  formatHospitalReviewHistoryReason,
  getHospitalReviewDetailSmallCategoryNames,
  labelHospitalReviewHistoryChange,
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
  formatTalkHistoryReason,
  labelTalkHistoryChange,
  labelTalkVisibilityStatus,
  type TalkDetailResponse,
  type TalkMediaAsset,
  type TalkOperationHistory,
  type TalkPollOption,
} from "@/lib/talk/detail";
import type { ReportedContentTargetType } from "@/lib/reported-content/detail";
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
    listPath: "/reported-content/surgery-reviews",
    targetType: "hospital_review",
    historyPerPage: HOSPITAL_REVIEW_DETAIL_HISTORY_PER_PAGE,
    sourceApiPath: (id) => `/hospital-reviews/${id}`,
    historyApiPath: (id) => `/hospital-reviews/${id}/operation-histories`,
  },
  "treatment-reviews": {
    boardType: "treatment-reviews",
    kind: "review",
    title: "시술후기 신고게시물",
    listPath: "/reported-content/treatment-reviews",
    targetType: "hospital_review",
    historyPerPage: HOSPITAL_REVIEW_DETAIL_HISTORY_PER_PAGE,
    sourceApiPath: (id) => `/hospital-reviews/${id}`,
    historyApiPath: (id) => `/hospital-reviews/${id}/operation-histories`,
  },
  "hospital-evaluations": {
    boardType: "hospital-evaluations",
    kind: "evaluation",
    title: "병의원 평가 신고게시물",
    listPath: "/reported-content/hospital-evaluations",
    targetType: "hospital_evaluation",
    historyPerPage: HOSPITAL_EVALUATION_DETAIL_HISTORY_PER_PAGE,
    sourceApiPath: (id) => `/hospital-evaluations/${id}`,
    historyApiPath: (id) => `/hospital-evaluations/${id}/operation-histories`,
  },
  talks: {
    boardType: "talks",
    kind: "talk",
    title: "토크 신고게시물",
    listPath: "/reported-content/talks",
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
  const [historyBlock, setHistoryBlock] = React.useState<DetailHistoryBlock | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [historiesPage, setHistoriesPage] = React.useState(() =>
    parsePositivePage(searchParams.get("operation_histories_page"), historiesDefaultPage),
  );
  const [reviewVisibilityUpdating, setReviewVisibilityUpdating] = React.useState(false);
  const [pendingReviewVisibilityChange, setPendingReviewVisibilityChange] = React.useState<PendingReviewVisibilityChange>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = React.useState(false);
  const [receiptDecision, setReceiptDecision] = React.useState<HospitalEvaluationReceiptDecision>("verify");
  const [receiptRejectReason, setReceiptRejectReason] = React.useState("");
  const [receiptRejectReasonText, setReceiptRejectReasonText] = React.useState("");
  const [receiptUpdating, setReceiptUpdating] = React.useState(false);
  const [receiptModalError, setReceiptModalError] = React.useState<string | null>(null);
  const hasLoadedRef = React.useRef(false);

  const getReturnToPath = React.useCallback(
    (highlightId?: number) =>
      buildReturnToPath({
        searchParams,
        fallbackPath: config.listPath,
        allowedPrefix: config.listPath,
        highlightId,
      }),
    [config.listPath, searchParams],
  );

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

      try {
        const response = await api.get<DetailResponse>(config.sourceApiPath(targetId));

        if (!isApiSuccess(response)) {
          setError(response.error.message || "신고게시물 상세 정보를 불러오지 못했습니다.");
          return;
        }

        setDetail(response.data);
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
      await Promise.all([
        fetchDetail(manualRefresh),
        fetchHistories(manualRefresh),
      ]);
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

  const requestTalkVisibility = React.useCallback((status: "ACTIVE" | "INACTIVE") => {
    if (config.kind !== "talk" || !detail) return;

    setPendingReviewVisibilityChange({
      target: "talk",
      id: (detail as TalkDetailResponse).id,
      status,
      hiddenReason: "",
    });
  }, [config.kind, detail]);

  const requestReviewVisibility = React.useCallback((status: "ACTIVE" | "INACTIVE") => {
    if (config.kind !== "review" || !detail) return;

    setPendingReviewVisibilityChange({
      target: "review",
      id: (detail as HospitalReviewDetailResponse).id,
      status,
      hiddenReason: "",
    });
  }, [config.kind, detail]);

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
      const response = await api.patch<VisibilityUpdateResponse>(
        endpoint,
        payload,
      );

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
    setReceiptDecision("verify");
    setReceiptRejectReason("");
    setReceiptRejectReasonText("");
    setReceiptModalError(null);
    setIsReceiptModalOpen(true);
  }, []);

  const closeReceiptModal = React.useCallback(() => {
    if (receiptUpdating) return;
    setIsReceiptModalOpen(false);
  }, [receiptUpdating]);

  const submitReceiptDecision = React.useCallback(async () => {
    if (config.kind !== "evaluation" || !detail) return;

    const evaluation = detail as HospitalEvaluationDetailResponse;

    setReceiptModalError(null);

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
      const response = receiptDecision === "verify"
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
    return <SpinnerBlock label="신고게시물 상세 정보를 불러오는 중" />;
  }

  if (error || !detail) {
    return (
      <Card>
        <CardContent className="space-y-4 py-10">
          <p className="text-sm text-rose-600 ">{error || "신고게시물 상세 정보가 없습니다."}</p>
          <Button type="button" variant="outline" onClick={() => router.push(getReturnToPath())}>
            목록으로
          </Button>
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
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700   ">
            {actionError}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(400px,0.92fr)]">
          <div className="space-y-6">
            <ReportedTalkMemberSummaryCard detail={talk} onBack={() => router.push(getReturnToPath())} />
            <ReportedTalkContentCard
              detail={talk}
              visibilityUpdating={reviewVisibilityUpdating}
              onChangeVisibility={requestTalkVisibility}
            />
            <ReportedOriginalHistoryCard
              kind={config.kind}
              histories={histories}
              meta={historiesMeta}
              refreshing={refreshing}
              onGoPage={changeHistoriesPage}
            />
          </div>

          <div className="space-y-6">
            <ReportedContentDetailPanel
              targetType={config.targetType}
              targetId={targetId}
              onStatusUpdated={() => void refreshDetail(true)}
            />
          </div>
        </div>

        <Modal
          isOpen={Boolean(pendingReviewVisibilityChange)}
          onClose={closeReviewVisibilityModal}
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

              {pendingReviewVisibilityChange?.status === "INACTIVE" ? (
                <div className="mt-4">
                  <label
                    htmlFor="reported-talk-detail-hidden-reason"
                    className="mb-1.5 block text-sm font-medium text-gray-700 "
                  >
                    미노출 사유
                  </label>
                  <InputField
                    id="reported-talk-detail-hidden-reason"
                    name="hidden_reason"
                    value={pendingReviewVisibilityChange.hiddenReason ?? ""}
                    onChange={(event) => updatePendingReviewHiddenReason(event.target.value)}
                    disabled={pendingVisibilityUpdating}
                  />
                </div>
              ) : null}
            </ModalBody>

            <ModalFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeReviewVisibilityModal}
                disabled={pendingVisibilityUpdating}
              >
                취소
              </Button>
              <Button
                type="button"
                variant="brand"
                onClick={() => void confirmReviewVisibilityChange()}
                disabled={pendingVisibilityUpdating}
              >
                {pendingVisibilityUpdating ? "처리 중..." : "확인"}
              </Button>
            </ModalFooter>
          </ModalPanel>
        </Modal>
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
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700   ">
            {actionError}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(400px,0.92fr)]">
          <div className="space-y-6">
            <ReportedReviewMemberSummaryCard detail={review} onBack={() => router.push(getReturnToPath(review.id))} />
            <ReportedReviewContentCard
              boardTitle={HOSPITAL_REVIEW_BOARD_CONFIGS[config.boardType === "treatment-reviews" ? "treatment" : "surgery"].title}
              detail={review}
              visibilityUpdating={reviewVisibilityUpdating}
              onChangeVisibility={requestReviewVisibility}
            />
            <ReportedOriginalHistoryCard
              kind={config.kind}
              histories={histories}
              meta={historiesMeta}
              refreshing={refreshing}
              onGoPage={changeHistoriesPage}
            />
          </div>

          <div className="space-y-6">
            <ReportedReviewHospitalSummaryCard detail={review} />
            <ReportedContentDetailPanel
              targetType={config.targetType}
              targetId={targetId}
              onStatusUpdated={() => void refreshDetail(true)}
            />
          </div>
        </div>

        <Modal
          isOpen={Boolean(pendingReviewVisibilityChange)}
          onClose={closeReviewVisibilityModal}
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

              {pendingReviewVisibilityChange?.status === "INACTIVE" ? (
                <div className="mt-4">
                  <label
                    htmlFor="reported-hospital-review-detail-hidden-reason"
                    className="mb-1.5 block text-sm font-medium text-gray-700 "
                  >
                    미노출 사유
                  </label>
                  <InputField
                    id="reported-hospital-review-detail-hidden-reason"
                    name="hidden_reason"
                    value={pendingReviewVisibilityChange.hiddenReason ?? ""}
                    onChange={(event) => updatePendingReviewHiddenReason(event.target.value)}
                    disabled={pendingVisibilityUpdating}
                  />
                </div>
              ) : null}
            </ModalBody>

            <ModalFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeReviewVisibilityModal}
                disabled={pendingVisibilityUpdating}
              >
                취소
              </Button>
              <Button
                type="button"
                variant="brand"
                onClick={() => void confirmReviewVisibilityChange()}
                disabled={pendingVisibilityUpdating}
              >
                {pendingVisibilityUpdating ? "처리 중..." : "확인"}
              </Button>
            </ModalFooter>
          </ModalPanel>
        </Modal>
      </div>
    );
  }

  if (config.kind === "evaluation") {
    const evaluation = detail as HospitalEvaluationDetailResponse;
    const receiptImages = evaluation.receipt_images ?? [];
    const receiptImage = receiptImages[0] ?? null;
    const receiptStatus = evaluation.receipt?.status?.trim() || "NONE";
    const receiptButtonLabel = receiptStatus === "VERIFIED" ? "영수증 인증" : "영수증 등록";

    return (
      <div className="space-y-6">
        {actionError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700   ">
            {actionError}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-2">
          <ReportedEvaluationMemberSummaryCard detail={evaluation} onBack={() => router.push(getReturnToPath(evaluation.id))} />
          <ReportedEvaluationHospitalSummaryCard detail={evaluation} />
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="space-y-6">
            <ReportedEvaluationContentCard
              detail={evaluation}
              receiptButtonLabel={receiptButtonLabel}
              receiptVerified={receiptStatus === "VERIFIED"}
              hasReceiptImages={receiptImages.length > 0}
              receiptButtonDisabled={receiptUpdating}
              onOpenReceiptModal={openReceiptModal}
            />
            <ReportedOriginalHistoryCard
              kind={config.kind}
              histories={histories}
              meta={historiesMeta}
              refreshing={refreshing}
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
              onStatusUpdated={() => void refreshDetail(true)}
            />
          </div>
        </div>

        <ReportedEvaluationReceiptVerificationModal
          isOpen={isReceiptModalOpen}
          image={receiptImage}
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
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div />
        <Button type="button" variant="outline" onClick={() => router.push(getReturnToPath(Number(detail.id)))}>
          목록으로
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(400px,0.92fr)]">
        <div className="space-y-6">
          {renderOriginalSummary(config, detail)}
          {renderOriginalContent(config, detail)}
          <ReportedOriginalHistoryCard
            kind={config.kind}
            histories={histories}
            meta={historiesMeta}
            refreshing={refreshing}
            onGoPage={changeHistoriesPage}
          />
        </div>

        <ReportedContentDetailPanel
          targetType={config.targetType}
          targetId={targetId}
          onStatusUpdated={() => void refreshDetail(true)}
        />
      </div>
    </div>
  );
}

function ReportedTalkMemberSummaryCard({
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

function ReportedTalkContentCard({
  detail,
  visibilityUpdating,
  onChangeVisibility,
}: {
  detail: TalkDetailResponse;
  visibilityUpdating: boolean;
  onChangeVisibility: (status: "ACTIVE" | "INACTIVE") => void;
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
          <p className="text-xs font-semibold text-gray-500 ">내용</p>
          <div className="min-h-36 whitespace-pre-wrap break-words rounded-2xl border border-gray-200 bg-white px-4 py-4 text-sm leading-7 text-gray-800   ">
            {detail.content?.trim() || "-"}
          </div>
        </section>

        <ReportedTalkImageGrid images={detail.images ?? []} />

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
                <ReportedTalkPollBar
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

function ReportedTalkImageGrid({ images }: { images: TalkMediaAsset[] }) {
  return (
    <section className="space-y-2">
      <p className="text-xs font-semibold text-gray-500 ">이미지</p>
      {images.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {images.map((image) => {
            const imageUrl = resolveMediaUrl(image as MediaAsset);

            return (
              <a
                key={image.id}
                href={imageUrl ?? undefined}
                target={imageUrl ? "_blank" : undefined}
                rel={imageUrl ? "noreferrer" : undefined}
                className="group flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-50  "
              >
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- runtime storage URL
                  <img
                    src={imageUrl}
                    alt=""
                    className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.03]"
                  />
                ) : (
                  <span className="px-3 text-center text-xs text-gray-500 ">미리보기 없음</span>
                )}
              </a>
            );
          })}
        </div>
      ) : (
        <EmptyDetailState>등록된 이미지가 없습니다.</EmptyDetailState>
      )}
    </section>
  );
}

function ReportedTalkPollBar({ option, totalVotes }: { option: TalkPollOption; totalVotes: number }) {
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

function ReportedReviewMemberSummaryCard({
  detail,
  onBack,
}: {
  detail: HospitalReviewDetailResponse;
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
}: {
  boardTitle: string;
  detail: HospitalReviewDetailResponse;
  visibilityUpdating: boolean;
  onChangeVisibility: (status: "ACTIVE" | "INACTIVE") => void;
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

        <ReportedReviewImageGallery beforeImages={detail.before_images ?? []} afterImages={detail.after_images ?? []} />

        <section className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 ">내용</p>
          <div className="min-h-36 whitespace-pre-wrap break-words rounded-2xl border border-gray-200 bg-white px-4 py-4 text-sm leading-7 text-gray-800   ">
            {detail.content?.trim() || "-"}
          </div>
        </section>
      </CardContent>
    </Card>
  );
}

function ReportedReviewCategoryBadges({ detail }: { detail: HospitalReviewDetailResponse }) {
  const categoryNames = getHospitalReviewDetailSmallCategoryNames(detail.categories);

  if (categoryNames.length === 0) {
    return "-";
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {categoryNames.map((categoryName) => (
        <span
          key={categoryName}
          className="inline-flex max-w-full items-center rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-600 ring-1 ring-brand-100   "
        >
          #{categoryName}
        </span>
      ))}
    </div>
  );
}

function ReportedReviewImageGallery({
  beforeImages,
  afterImages,
}: {
  beforeImages: HospitalReviewMediaAsset[];
  afterImages: HospitalReviewMediaAsset[];
}) {
  const images = [
    ...beforeImages.map((image) => ({ image, label: "전" })),
    ...afterImages.map((image) => ({ image, label: "후" })),
  ];

  return (
    <section className="space-y-2">
      <p className="text-xs font-semibold text-gray-500 ">이미지</p>
      {images.length > 0 ? (
        <div className="max-w-full overflow-x-auto pb-2" style={{ WebkitOverflowScrolling: "touch" }}>
          <div className="flex min-w-full gap-3">
            {images.map(({ image, label }) => {
              const imageUrl = resolveHospitalReviewMediaUrl(image);

              return (
                <a
                  key={`${label}-${image.id}`}
                  href={imageUrl ?? undefined}
                  target={imageUrl ? "_blank" : undefined}
                  rel={imageUrl ? "noreferrer" : undefined}
                  className="group relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-50  "
                  style={{ flex: "0 0 calc((100% - 2.25rem) / 4)" }}
                >
                  <span className="absolute left-2 top-2 z-10 rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-gray-700 shadow-sm  ">
                    {label}
                  </span>
                  {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- runtime storage URL
                    <img
                      src={imageUrl}
                      alt=""
                      className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <span className="px-3 text-center text-xs text-gray-500 ">미리보기 없음</span>
                  )}
                </a>
              );
            })}
          </div>
        </div>
      ) : (
        <EmptyDetailState>등록된 이미지가 없습니다.</EmptyDetailState>
      )}
    </section>
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

function ReportedEvaluationMemberSummaryCard({
  detail,
  onBack,
}: {
  detail: HospitalEvaluationDetailResponse;
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
  receiptVerified,
  hasReceiptImages,
  receiptButtonDisabled,
  onOpenReceiptModal,
}: {
  detail: HospitalEvaluationDetailResponse;
  receiptButtonLabel: string;
  receiptVerified: boolean;
  hasReceiptImages: boolean;
  receiptButtonDisabled: boolean;
  onOpenReceiptModal: () => void;
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
              {receiptVerified ? <CircleCheck className="mr-1 size-4" aria-hidden="true" /> : null}
              {receiptButtonLabel}
            </Button>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <section className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 ">내용</p>
          <div className="min-h-48 whitespace-pre-wrap break-words rounded-2xl border border-gray-200 bg-white px-4 py-4 text-sm leading-7 text-gray-800   ">
            {detail.content?.trim() || "-"}
          </div>
        </section>

        <ReportedEvaluationImageGallery title="평가 이미지" images={detail.images ?? []} />
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
          <span className="text-sm font-semibold text-gray-900 ">
            {formatHospitalEvaluationAverageRating(ratings.average)}점
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-[5.5rem_minmax(0,1fr)_2.5rem] items-center gap-3 text-sm">
            <span className="font-medium text-gray-700 ">{row.label}</span>
            <ReportedEvaluationStarRating value={Number(row.value ?? 0)} />
            <span className="text-right font-semibold text-gray-700 ">
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
            <span className="font-semibold text-gray-700 ">{row.label}</span>
            <div className="grid grid-cols-2 gap-2">
              {row.options.map((option) => (
                <span
                  key={option.label}
                  className={[
                    "inline-flex h-10 w-full items-center justify-center rounded-lg px-3 text-sm font-semibold ring-1",
                    option.value === row.value
                      ? "bg-brand-500 text-white ring-brand-500"
                      : "bg-white text-gray-600 ring-gray-200   ",
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
}: {
  isOpen: boolean;
  image: HospitalEvaluationMediaAsset | null;
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
}) {
  const imageUrl = resolveHospitalEvaluationMediaUrl(image);

  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton={false} className="mx-4 w-full max-w-lg">
      <ModalPanel>
        <ModalHeader className="pr-0">
          <ModalTitle>영수증 인증</ModalTitle>
        </ModalHeader>

        <ModalBody className="mt-6 space-y-6">
          <div className="mx-auto flex aspect-square w-full max-w-[15rem] items-center justify-center overflow-hidden rounded-2xl bg-gray-100 text-sm font-medium text-gray-500  ">
            {imageUrl ? (
              <a href={imageUrl} target="_blank" rel="noreferrer" className="block h-full w-full">
                {/* eslint-disable-next-line @next/next/no-img-element -- runtime storage URL */}
                <img src={imageUrl} alt="영수증 사진" className="h-full w-full object-cover" />
              </a>
            ) : (
              "영수증 사진"
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <ReportedReceiptDecisionOption
              label="인증적합"
              checked={decision === "verify"}
              disabled={updating}
              onClick={() => onDecisionChange("verify")}
            />
            <ReportedReceiptDecisionOption
              label="인증 부적합"
              checked={decision === "reject"}
              disabled={updating}
              onClick={() => onDecisionChange("reject")}
            />
          </div>

          {decision === "reject" ? (
            <div className="space-y-3">
              <label
                htmlFor="reported-hospital-evaluation-receipt-reject-reason"
                className="block text-sm font-semibold text-gray-800 "
              >
                인증 부적합 사유
              </label>
              <select
                id="reported-hospital-evaluation-receipt-reject-reason"
                value={rejectReason}
                onChange={(event) => onRejectReasonChange(event.target.value)}
                disabled={updating}
                className="h-11 w-full rounded-lg border border-gray-200 bg-gray-100 px-3 text-sm text-gray-800 outline-none transition focus:border-brand-400   "
              >
                <option value="">없음</option>
                {HOSPITAL_EVALUATION_RECEIPT_REJECTION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {rejectReason === "OTHER" ? (
                <InputField
                  id="reported-hospital-evaluation-receipt-reject-reason-text"
                  name="receipt_rejection_reason_text"
                  placeholder="기타 사유를 입력해주세요"
                  value={rejectReasonText}
                  onChange={(event) => onRejectReasonTextChange(event.target.value)}
                  disabled={updating}
                />
              ) : null}
            </div>
          ) : null}

          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700   ">
              {error}
            </div>
          ) : null}
        </ModalBody>

        <ModalFooter className="justify-center">
          <Button type="button" variant="outline" onClick={onClose} disabled={updating}>
            취소
          </Button>
          <Button type="button" variant="brand" onClick={onSubmit} disabled={updating}>
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
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex items-center gap-2 text-sm font-semibold text-gray-800 transition disabled:opacity-60 "
    >
      <CircleCheck
        className={checked ? "size-5 text-brand-500" : "size-5 text-gray-400"}
        aria-hidden="true"
      />
      {label}
    </button>
  );
}

function ReportedEvaluationImageGallery({ title, images }: { title: string; images: HospitalEvaluationMediaAsset[] }) {
  return (
    <section className="space-y-2">
      <p className="text-xs font-semibold text-gray-500 ">{title}</p>
      {images.length > 0 ? (
        <div className="max-w-full overflow-x-auto pb-2" style={{ WebkitOverflowScrolling: "touch" }}>
          <div className="flex min-w-full gap-3">
            {images.map((image) => {
              const imageUrl = resolveHospitalEvaluationMediaUrl(image);

              return (
                <a
                  key={image.id}
                  href={imageUrl ?? undefined}
                  target={imageUrl ? "_blank" : undefined}
                  rel={imageUrl ? "noreferrer" : undefined}
                  className="group relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-50  "
                  style={{ flex: "0 0 calc((100% - 2.25rem) / 4)" }}
                >
                  {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- runtime storage URL
                    <img
                      src={imageUrl}
                      alt=""
                      className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <span className="px-3 text-center text-xs text-gray-500 ">미리보기 없음</span>
                  )}
                </a>
              );
            })}
          </div>
        </div>
      ) : (
        <EmptyDetailState>등록된 이미지가 없습니다.</EmptyDetailState>
      )}
    </section>
  );
}

function ReportedEvaluationStarRating({ value }: { value: number }) {
  const normalizedValue = Math.max(0, Math.min(5, Math.round(value)));

  return (
    <span className="inline-flex items-center gap-1 text-2xl leading-none" aria-label={`${normalizedValue}점`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <span
          key={index}
          className={index < normalizedValue ? "text-brand-500" : "text-gray-300 "}
        >
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

function renderOriginalContent(config: ReportedContentDetailConfig, detail: DetailResponse) {
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
          <ImageStrip images={talk.images ?? []} resolveUrl={(image) => resolveMediaUrl(image)} />
          {talk.poll ? <TalkPollSummary options={talk.poll.options ?? []} allowMultiple={Boolean(talk.poll.allow_multiple)} /> : null}
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
          <ImageStrip images={evaluation.images ?? []} resolveUrl={resolveHospitalEvaluationMediaUrl} />
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
    ...((review.before_images ?? []).map((image) => ({ ...image, collection: image.collection || "before" }))),
    ...((review.after_images ?? []).map((image) => ({ ...image, collection: image.collection || "after" }))),
  ];

  return (
    <Card as="section">
      <CardHeader className="pb-4">
        <CardTitle>{HOSPITAL_REVIEW_BOARD_CONFIGS[config.boardType === "treatment-reviews" ? "treatment" : "surgery"].title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <DetailField label="카테고리" value={formatHospitalReviewDetailCategories(review.categories)} />
        <DetailField label="제목" value={review.title?.trim() || "-"} />
        <DetailField label="시/수술비용" value={formatHospitalReviewDetailCost(review.cost)} />
        <DetailField label="평점" value={formatHospitalReviewDetailRating(review.rating)} />
        <ContentBox content={review.content} />
        <ImageStrip images={imageGroups} resolveUrl={resolveHospitalReviewMediaUrl} />
      </CardContent>
    </Card>
  );
}

function ReportedOriginalHistoryCard({
  kind,
  histories,
  meta,
  refreshing,
  onGoPage,
}: {
  kind: ReportedContentDetailKind;
  histories: DetailHistory[];
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
                  {formatHistoryDate(kind, history)}
                </span>
                <span className="truncate font-medium">{history.actor_label?.trim() || "-"}</span>
                <span className="font-medium">{labelHistoryChange(kind, history)}</span>
                <span className="min-w-0 break-words text-sm text-gray-600 ">
                  {formatHistoryReason(kind, history)}
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

function ContentBox({ content }: { content?: string | null }) {
  return (
    <section className="space-y-2">
      <p className="text-xs font-semibold text-gray-500 ">내용</p>
      <div className="min-h-44 whitespace-pre-wrap break-words rounded-2xl border border-gray-200 bg-white px-4 py-4 text-sm leading-7 text-gray-800   ">
        {content?.trim() || "-"}
      </div>
    </section>
  );
}

function ImageStrip<TImage>({ images, resolveUrl }: { images: TImage[]; resolveUrl: (image: TImage) => string | null }) {
  if (images.length === 0) {
    return (
      <section className="space-y-2">
        <p className="text-xs font-semibold text-gray-500 ">이미지</p>
        <EmptyDetailState>등록된 이미지가 없습니다.</EmptyDetailState>
      </section>
    );
  }

  return (
    <section className="space-y-2">
      <p className="text-xs font-semibold text-gray-500 ">이미지</p>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {images.map((image, index) => {
          const imageUrl = resolveUrl(image);

          return (
            <div
              key={getImageKey(image, index)}
              className="relative h-32 w-32 shrink-0 overflow-hidden rounded-2xl border border-gray-200 bg-gray-100  "
            >
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- backend returns storage URLs
                <img src={imageUrl} alt={`신고게시물 이미지 ${index + 1}`} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">이미지</div>
              )}
            </div>
          );
        })}
      </div>
    </section>
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
        <p className="text-xs font-semibold text-gray-500 ">투표</p>
        {allowMultiple ? <span className="text-xs font-semibold text-brand-500">중복가능</span> : null}
      </div>
      <div className="space-y-2">
        {options.map((option) => {
          const voteCount = Number(option.vote_count ?? 0);
          const percent = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;

          return (
            <div key={option.id} className="overflow-hidden rounded-xl bg-gray-100 ">
              <div
                className="min-h-9 rounded-xl bg-brand-500/70 px-3 py-2 text-sm font-semibold text-white"
                style={{ width: totalVotes > 0 ? `${percent}%` : "0%" }}
              >
                <span className="text-gray-900 ">{option.content?.trim() || "-"} {voteCount.toLocaleString()}명</span>
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
    <div className="rounded-2xl border border-gray-200 bg-white p-4  ">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-gray-900 ">평가점수</p>
        <span className="text-sm font-semibold text-gray-900 ">
          {formatHospitalEvaluationAverageRating(ratings.average)}점
        </span>
      </div>
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-gray-700 ">{row.label}</span>
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
    <div className="rounded-2xl border border-gray-200 bg-white p-4  ">
      <p className="mb-4 text-sm font-semibold text-gray-900 ">평가 항목</p>
      <div className="grid grid-cols-2 gap-2">
        {rows.map((row) => (
          <div key={row.label} className="rounded-xl bg-gray-100 px-3 py-2 text-sm ">
            <p className="text-xs font-semibold text-gray-500 ">{row.label}</p>
            <p className="mt-1 font-semibold text-gray-900 ">{row.value?.trim() || "-"}</p>
          </div>
        ))}
      </div>
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

function formatHistoryDate(kind: ReportedContentDetailKind, history: DetailHistory) {
  if (kind === "talk") return formatTalkDetailDateTime(history.created_at);
  if (kind === "evaluation") return formatHospitalEvaluationDetailDateTime(history.created_at);

  return formatHospitalReviewDetailDateTime(history.created_at);
}

function labelHistoryChange(kind: ReportedContentDetailKind, history: DetailHistory) {
  if (kind === "talk") return labelTalkHistoryChange(history as TalkOperationHistory);
  if (kind === "evaluation") return labelHospitalEvaluationHistoryChange(history as HospitalEvaluationOperationHistory);

  return labelHospitalReviewHistoryChange(history as HospitalReviewOperationHistory);
}

function formatHistoryReason(kind: ReportedContentDetailKind, history: DetailHistory) {
  if (kind === "talk") return formatTalkHistoryReason(history as TalkOperationHistory);
  if (kind === "evaluation") return formatHospitalEvaluationHistoryReason(history as HospitalEvaluationOperationHistory);

  return formatHospitalReviewHistoryReason(history as HospitalReviewOperationHistory);
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
