"use client";

import React from "react";
import dynamic from "next/dynamic";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { isApiSuccess } from "@beaulab/types";
import { SpinnerBlock, type DataTableMeta } from "@beaulab/ui-admin";

import type { MediaPreviewState } from "@/components/common/MediaPreviewModal";
import { LoadErrorState } from "@/components/common/LoadErrorState";
import {
  VisibilityActionButtons as VisibilityButtons,
  VisibilityConfirmModal,
} from "@/components/common/VisibilityActionButtons";
import {
  HospitalEvaluationAssessmentCard,
  HospitalEvaluationContentCard,
  HospitalEvaluationHistoryCard,
  HospitalEvaluationHospitalSummaryCard,
  HospitalEvaluationMemberSummaryCard,
  HospitalEvaluationRatingScoreCard,
} from "@/components/hospital-evaluation/detail/HospitalEvaluationDetailSections";
import { api } from "@/lib/common/api";
import { isVisibilityLockedByReport } from "@/lib/common/content-report";
import { usePageHeaderExtra } from "@/lib/common/routing/page-header-extra";
import {
  HOSPITAL_EVALUATION_DETAIL_HISTORY_PER_PAGE,
  type HospitalEvaluationDetailResponse,
  type HospitalEvaluationOperationHistory,
  type HospitalEvaluationReceiptDecision,
  type PaginatedBlock,
} from "@/lib/hospital-evaluation/detail";

const MediaPreviewModal = dynamic(() =>
  import("@/components/common/MediaPreviewModal").then((module) => module.MediaPreviewModal),
);
const HospitalEvaluationReceiptModal = dynamic(
  () => import("@/components/hospital-evaluation/detail/HospitalEvaluationReceiptModal"),
);

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

type PendingVisibilityChange = {
  status: "ACTIVE" | "INACTIVE";
  hiddenReason?: string;
} | null;

const historiesDefaultPage = 1;

export default function HospitalEvaluationDetailPageClient() {
  const params = useParams<{ id: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawEvaluationId = Array.isArray(params.id) ? params.id[0] : params.id;
  const evaluationId = Number(rawEvaluationId);

  const [detail, setDetail] = React.useState<HospitalEvaluationDetailResponse | null>(null);
  const [operationHistoriesBlock, setOperationHistoriesBlock] =
    React.useState<PaginatedBlock<HospitalEvaluationOperationHistory> | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [historiesPage, setHistoriesPage] = React.useState(() =>
    parsePositivePage(searchParams.get("operation_histories_page"), historiesDefaultPage),
  );
  const [isReceiptModalOpen, setIsReceiptModalOpen] = React.useState(false);
  const [receiptDecision, setReceiptDecision] = React.useState<HospitalEvaluationReceiptDecision>("verify");
  const [receiptRejectReason, setReceiptRejectReason] = React.useState("");
  const [receiptRejectReasonText, setReceiptRejectReasonText] = React.useState("");
  const [receiptUpdating, setReceiptUpdating] = React.useState(false);
  const [receiptModalError, setReceiptModalError] = React.useState<string | null>(null);
  const [visibilityUpdating, setVisibilityUpdating] = React.useState(false);
  const [pendingVisibilityChange, setPendingVisibilityChange] = React.useState<PendingVisibilityChange>(null);
  const [previewMedia, setPreviewMedia] = React.useState<MediaPreviewState | null>(null);
  const hasLoadedRef = React.useRef(false);

  const syncDetailQuery = React.useCallback(
    ({ nextHistoriesPage = historiesPage }: { nextHistoriesPage?: number }) => {
      const nextSearchParams = new URLSearchParams(searchParams.toString());

      syncPageParam(nextSearchParams, "operation_histories_page", nextHistoriesPage, historiesDefaultPage);

      const nextQuery = nextSearchParams.toString();
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
    },
    [historiesPage, pathname, router, searchParams],
  );

  const fetchEvaluationDetail = React.useCallback(
    async (manualRefresh = false) => {
      if (!Number.isFinite(evaluationId) || evaluationId <= 0) {
        setLoadError("올바르지 않은 평가 경로입니다.");
        setIsLoading(false);
        return;
      }

      if (!hasLoadedRef.current) {
        setIsLoading(true);
      } else if (manualRefresh) {
        setIsRefreshing(true);
      }

      setLoadError(null);

      try {
        const response = await api.get<HospitalEvaluationDetailResponse>(`/hospital-evaluations/${evaluationId}`);

        if (!isApiSuccess(response)) {
          setLoadError(response.error.message || "평가 상세 정보를 불러오지 못했습니다.");
          return;
        }

        setDetail(response.data);
        hasLoadedRef.current = true;
      } catch {
        setLoadError("평가 상세 정보를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [evaluationId],
  );

  React.useEffect(() => {
    void fetchEvaluationDetail(false);
  }, [fetchEvaluationDetail]);

  const fetchEvaluationOperationHistories = React.useCallback(
    async (manualRefresh = false) => {
      if (!Number.isFinite(evaluationId) || evaluationId <= 0) return;

      if (manualRefresh || hasLoadedRef.current) {
        setIsRefreshing(true);
      }

      try {
        const response = await api.get<HospitalEvaluationOperationHistory[]>(
          `/hospital-evaluations/${evaluationId}/operation-histories`,
          {
            operation_histories_page: historiesPage,
            operation_histories_per_page: HOSPITAL_EVALUATION_DETAIL_HISTORY_PER_PAGE,
          },
        );

        if (!isApiSuccess(response)) {
          setActionError(response.error.message || "평가 히스토리를 불러오지 못했습니다.");
          return;
        }

        setOperationHistoriesBlock({
          items: response.data,
          meta: (response.meta as DataTableMeta | null) ?? null,
        });
      } catch {
        setActionError("평가 히스토리를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setIsRefreshing(false);
      }
    },
    [evaluationId, historiesPage],
  );

  const refreshEvaluationPage = React.useCallback(
    async (manualRefresh = false) => {
      await Promise.all([fetchEvaluationDetail(manualRefresh), fetchEvaluationOperationHistories(manualRefresh)]);
    },
    [fetchEvaluationDetail, fetchEvaluationOperationHistories],
  );

  React.useEffect(() => {
    void fetchEvaluationOperationHistories(false);
  }, [fetchEvaluationOperationHistories]);

  const requestVisibilityChange = React.useCallback(
    (status: "ACTIVE" | "INACTIVE") => {
      if (!detail || detail.status === status) return;

      setActionError(null);
      setPendingVisibilityChange({
        status,
        hiddenReason: "",
      });
    },
    [detail],
  );

  const closeVisibilityConfirmModal = React.useCallback(() => {
    if (visibilityUpdating) return;
    setPendingVisibilityChange(null);
  }, [visibilityUpdating]);

  const updatePendingHiddenReason = React.useCallback((value: string) => {
    setPendingVisibilityChange((prev) => (prev ? { ...prev, hiddenReason: value } : prev));
  }, []);

  const confirmVisibilityChange = React.useCallback(async () => {
    if (!detail || !pendingVisibilityChange) return;

    const { status, hiddenReason } = pendingVisibilityChange;
    const previousStatus = detail.status;
    const normalizedHiddenReason = status === "INACTIVE" ? hiddenReason?.trim() : "";
    const payload: VisibilityUpdatePayload = {
      ids: [detail.id],
      status,
      ...(normalizedHiddenReason ? { hidden_reason: normalizedHiddenReason } : {}),
    };

    setVisibilityUpdating(true);
    setActionError(null);
    setPendingVisibilityChange(null);
    setDetail((prev) => (prev ? { ...prev, status } : prev));

    try {
      const response = await api.patch<VisibilityUpdateResponse>("/hospital-evaluations/status", payload);

      if (!isApiSuccess(response)) {
        setDetail((prev) => (prev ? { ...prev, status: previousStatus } : prev));
        setActionError(response.error.message || "평가 노출 상태 변경에 실패했습니다.");
        return;
      }

      void refreshEvaluationPage(true);
    } catch {
      setDetail((prev) => (prev ? { ...prev, status: previousStatus } : prev));
      setActionError("평가 노출 상태 변경 중 오류가 발생했습니다.");
    } finally {
      setVisibilityUpdating(false);
    }
  }, [detail, pendingVisibilityChange, refreshEvaluationPage]);

  const headerActions = React.useMemo(() => {
    if (!detail || loadError) return null;

    return (
      <VisibilityButtons
        status={detail.status}
        disabled={visibilityUpdating || isVisibilityLockedByReport(detail.report)}
        onChange={requestVisibilityChange}
      />
    );
  }, [detail, loadError, requestVisibilityChange, visibilityUpdating]);

  usePageHeaderExtra(headerActions);

  const openReceiptModal = React.useCallback(() => {
    const receiptStatus = getHospitalEvaluationReceiptStatus(detail);
    const nextDecision = getHospitalEvaluationReceiptDecision(receiptStatus);

    setReceiptDecision(nextDecision);
    setReceiptRejectReason(nextDecision === "reject" ? detail?.receipt?.rejection_reason?.trim() || "" : "");
    setReceiptRejectReasonText(nextDecision === "reject" ? detail?.receipt?.rejection_reason_text?.trim() || "" : "");
    setReceiptModalError(null);
    setIsReceiptModalOpen(true);
  }, [detail]);

  const closeReceiptModal = React.useCallback(() => {
    if (receiptUpdating) return;
    setIsReceiptModalOpen(false);
  }, [receiptUpdating]);

  const submitReceiptDecision = React.useCallback(async () => {
    if (!detail) return;

    setReceiptModalError(null);

    const receiptStatus = getHospitalEvaluationReceiptStatus(detail);

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
          ? await api.patch<ReceiptUpdateResponse>(`/hospital-evaluations/${detail.id}/receipt/verify`, {})
          : await api.patch<ReceiptUpdateResponse>(
              `/hospital-evaluations/${detail.id}/receipt/reject`,
              buildReceiptRejectPayload(receiptRejectReason, receiptRejectReasonText),
            );

      if (!isApiSuccess(response)) {
        setReceiptModalError(response.error.message || "영수증 인증 상태 저장에 실패했습니다.");
        return;
      }

      setIsReceiptModalOpen(false);
      await refreshEvaluationPage(true);
    } catch {
      setReceiptModalError("영수증 인증 상태 저장 중 오류가 발생했습니다.");
    } finally {
      setReceiptUpdating(false);
    }
  }, [detail, receiptDecision, receiptRejectReason, receiptRejectReasonText, refreshEvaluationPage]);

  const changeHistoriesPage = React.useCallback(
    (page: number) => {
      setHistoriesPage(page);
      syncDetailQuery({ nextHistoriesPage: page });
    },
    [syncDetailQuery],
  );

  if (isLoading) {
    return <SpinnerBlock className="min-h-[60vh]" spinnerClassName="size-10" />;
  }

  if (loadError || !detail) {
    return (
      <LoadErrorState
        title="평가 상세 정보를 불러오지 못했습니다."
        message={loadError ?? "평가 상세 정보를 찾을 수 없습니다."}
        onRetry={() => void refreshEvaluationPage(true)}
      />
    );
  }

  const operationHistories = operationHistoriesBlock?.items ?? [];
  const operationHistoriesMeta = operationHistoriesBlock?.meta ?? null;
  const receiptImages = detail.receipt_images ?? [];
  const receiptImage = receiptImages[0] ?? null;
  const receiptStatus = getHospitalEvaluationReceiptStatus(detail);
  const receiptButtonLabel = getHospitalEvaluationReceiptButtonLabel(receiptStatus);
  const pendingVisibilityLabel = pendingVisibilityChange?.status === "ACTIVE" ? "노출" : "미노출";
  const pendingVisibilityMessage = pendingVisibilityChange ? `해당 평가를 ${pendingVisibilityLabel} 하시겠습니까?` : "";

  return (
    <div className="space-y-6">
      {actionError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {actionError}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <HospitalEvaluationMemberSummaryCard detail={detail} />
        <HospitalEvaluationHospitalSummaryCard detail={detail} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <HospitalEvaluationContentCard
            detail={detail}
            receiptButtonLabel={receiptButtonLabel}
            receiptButtonVerified={receiptStatus === RECEIPT_STATUS_VERIFIED}
            hasReceiptImages={receiptImages.length > 0}
            receiptButtonDisabled={receiptUpdating}
            onOpenReceiptModal={openReceiptModal}
            onPreviewMedia={setPreviewMedia}
          />
        </div>

        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <HospitalEvaluationRatingScoreCard detail={detail} />
            <HospitalEvaluationAssessmentCard assessment={detail.assessment} />
          </div>
          <HospitalEvaluationHistoryCard
            histories={operationHistories}
            meta={operationHistoriesMeta}
            refreshing={isRefreshing}
            onGoPage={changeHistoriesPage}
          />
        </div>
      </div>

      {isReceiptModalOpen ? (
        <HospitalEvaluationReceiptModal
          isOpen
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
      ) : null}

      <VisibilityConfirmModal
        isOpen={Boolean(pendingVisibilityChange)}
        status={pendingVisibilityChange?.status}
        message={pendingVisibilityMessage}
        hiddenReasonValue={pendingVisibilityChange?.hiddenReason ?? ""}
        updating={visibilityUpdating}
        reasonInputId="hospital-evaluation-detail-hidden-reason"
        onHiddenReasonChange={updatePendingHiddenReason}
        onClose={closeVisibilityConfirmModal}
        onConfirm={() => void confirmVisibilityChange()}
      />

      {previewMedia ? (
        <MediaPreviewModal preview={previewMedia} onChange={setPreviewMedia} onClose={() => setPreviewMedia(null)} />
      ) : null}
    </div>
  );
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
