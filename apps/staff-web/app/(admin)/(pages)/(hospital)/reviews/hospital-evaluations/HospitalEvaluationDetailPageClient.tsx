"use client";

import React from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { isApiSuccess } from "@beaulab/types";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
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

import { api } from "@/lib/common/api";
import { isVisibilityLockedByReport } from "@/lib/common/content-report";
import { buildReturnToPath } from "@/lib/common/navigation/buildReturnToPath";
import { usePageHeaderExtra } from "@/lib/common/routing/page-header-extra";
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
  type PaginatedBlock,
} from "@/lib/hospital-evaluation/detail";

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

type PendingVisibilityChange = {
  status: "ACTIVE" | "INACTIVE";
  hiddenReason?: string;
} | null;

const historiesDefaultPage = 1;
const detailListPath = "/reviews/hospital-evaluations";
const detailGridClass = "grid grid-cols-[6.25rem_minmax(0,1fr)] items-start gap-4";
const detailLabelClass = "pt-0.5 text-xs font-semibold text-gray-500 dark:text-gray-400";
const detailValueClass = "min-w-0 break-words text-sm leading-6 text-gray-800 dark:text-gray-100";

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
  const hasLoadedRef = React.useRef(false);

  const getReturnToPath = React.useCallback(
    (highlightId?: number) =>
      buildReturnToPath({
        searchParams,
        fallbackPath: detailListPath,
        allowedPrefix: detailListPath,
        highlightId,
      }),
    [searchParams],
  );

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
      await Promise.all([
        fetchEvaluationDetail(manualRefresh),
        fetchEvaluationOperationHistories(manualRefresh),
      ]);
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
    setPendingVisibilityChange((prev) => prev ? { ...prev, hiddenReason: value } : prev);
  }, []);

  const confirmVisibilityChange = React.useCallback(async () => {
    if (!detail || !pendingVisibilityChange) return;

    const { status, hiddenReason } = pendingVisibilityChange;
    const normalizedHiddenReason = status === "INACTIVE" ? hiddenReason?.trim() : "";
    const payload: VisibilityUpdatePayload = {
      ids: [detail.id],
      status,
      ...(normalizedHiddenReason ? { hidden_reason: normalizedHiddenReason } : {}),
    };

    setVisibilityUpdating(true);
    setActionError(null);

    try {
      const response = await api.patch<VisibilityUpdateResponse>("/hospital-evaluations/status", payload);

      if (!isApiSuccess(response)) {
        setActionError(response.error.message || "평가 노출 상태 변경에 실패했습니다.");
        return;
      }

      setPendingVisibilityChange(null);
      await refreshEvaluationPage(true);
    } catch {
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
    if (!detail) return;

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
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>평가 상세 정보를 불러오지 못했습니다.</CardTitle>
          <CardDescription>{loadError ?? "평가 상세 정보를 찾을 수 없습니다."}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 pt-0">
          <Button type="button" variant="brand" onClick={() => void refreshEvaluationPage(true)}>
            다시 불러오기
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push(getReturnToPath())}>
            목록으로
          </Button>
        </CardContent>
      </Card>
    );
  }

  const operationHistories = operationHistoriesBlock?.items ?? [];
  const operationHistoriesMeta = operationHistoriesBlock?.meta ?? null;
  const receiptImages = detail.receipt_images ?? [];
  const receiptImage = receiptImages[0] ?? null;
  const receiptStatus = detail.receipt?.status?.trim() || "NONE";
  const receiptButtonLabel = receiptStatus === "VERIFIED" ? "영수증 인증" : "영수증 등록";
  const pendingVisibilityLabel = pendingVisibilityChange?.status === "ACTIVE" ? "노출" : "미노출";
  const pendingVisibilityMessage = pendingVisibilityChange
    ? `해당 평가를 ${pendingVisibilityLabel} 하시겠습니까?`
    : "";

  return (
    <div className="space-y-6">
      {actionError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
          {actionError}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <MemberSummaryCard detail={detail} onBack={() => router.push(getReturnToPath(detail.id))} />
        <HospitalSummaryCard detail={detail} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <HospitalEvaluationContentCard
            detail={detail}
            receiptButtonLabel={receiptButtonLabel}
            receiptVerified={receiptStatus === "VERIFIED"}
            hasReceiptImages={receiptImages.length > 0}
            receiptButtonDisabled={receiptUpdating}
            onOpenReceiptModal={openReceiptModal}
          />
        </div>

        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <RatingScoreCard detail={detail} />
            <AssessmentCard assessment={detail.assessment} />
          </div>
          <HospitalEvaluationHistoryCard
            histories={operationHistories}
            meta={operationHistoriesMeta}
            refreshing={isRefreshing}
            onGoPage={changeHistoriesPage}
          />
        </div>
      </div>

      <ReceiptVerificationModal
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

      <Modal
        isOpen={Boolean(pendingVisibilityChange)}
        onClose={closeVisibilityConfirmModal}
        showCloseButton={false}
        className="mx-4 w-full max-w-md"
      >
        <ModalPanel>
          <ModalHeader className="pr-0">
            <ModalTitle>노출여부 변경</ModalTitle>
          </ModalHeader>

          <ModalBody className="mt-5">
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              {pendingVisibilityMessage}
            </p>

            {pendingVisibilityChange?.status === "INACTIVE" ? (
              <div className="mt-4">
                <label
                  htmlFor="hospital-evaluation-detail-hidden-reason"
                  className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
                >
                  미노출 사유
                </label>
                <InputField
                  id="hospital-evaluation-detail-hidden-reason"
                  name="hidden_reason"
                  value={pendingVisibilityChange.hiddenReason ?? ""}
                  onChange={(event) => updatePendingHiddenReason(event.target.value)}
                  disabled={visibilityUpdating}
                />
              </div>
            ) : null}
          </ModalBody>

          <ModalFooter>
            <Button
              type="button"
              variant="outline"
              onClick={closeVisibilityConfirmModal}
              disabled={visibilityUpdating}
            >
              취소
            </Button>
            <Button
              type="button"
              variant="brand"
              onClick={() => void confirmVisibilityChange()}
              disabled={visibilityUpdating}
            >
              {visibilityUpdating ? "처리 중..." : "확인"}
            </Button>
          </ModalFooter>
        </ModalPanel>
      </Modal>
    </div>
  );
}

function MemberSummaryCard({
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
          <Button type="button" variant="outline" onClick={onBack}>
            목록으로
          </Button>
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

function HospitalSummaryCard({ detail }: { detail: HospitalEvaluationDetailResponse }) {
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

function HospitalEvaluationContentCard({
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
            <CardTitle>{titleHospitalEvaluationDetailReviewType(detail.category_domain)}</CardTitle>
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
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">내용</p>
          <div className="min-h-48 whitespace-pre-wrap break-words rounded-2xl border border-gray-200 bg-white px-4 py-4 text-sm leading-7 text-gray-800 dark:border-gray-800 dark:bg-gray-950/30 dark:text-gray-100">
            {detail.content?.trim() || "-"}
          </div>
        </section>

        <ImageGallery title="평가 이미지" images={detail.images ?? []} />
      </CardContent>
    </Card>
  );
}

function RatingScoreCard({ detail }: { detail: HospitalEvaluationDetailResponse }) {
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
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {formatHospitalEvaluationAverageRating(ratings.average)}점
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-[5.5rem_minmax(0,1fr)_2.5rem] items-center gap-3 text-sm">
            <span className="font-medium text-gray-700 dark:text-gray-200">{row.label}</span>
            <StarRating value={Number(row.value ?? 0)} />
            <span className="text-right font-semibold text-gray-700 dark:text-gray-200">
              {formatHospitalEvaluationDetailRating(row.value)}점
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function AssessmentCard({ assessment }: { assessment?: HospitalEvaluationAssessment | null }) {
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
            <span className="font-semibold text-gray-700 dark:text-gray-200">{row.label}</span>
            <div className="grid grid-cols-2 gap-2">
              {row.options.map((option) => (
                <span
                  key={option.label}
                  className={[
                    "inline-flex h-10 w-full items-center justify-center rounded-lg px-3 text-sm font-semibold ring-1",
                    option.value === row.value
                      ? "bg-brand-500 text-white ring-brand-500"
                      : "bg-white text-gray-600 ring-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:ring-gray-700",
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

function HospitalEvaluationHistoryCard({
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
    <Card as="section">
      <CardHeader className="pb-4">
        <CardTitle>히스토리</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {histories.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {histories.map((history) => (
              <div
                key={history.id}
                className="grid gap-2 py-3 text-sm text-gray-700 md:grid-cols-[10rem_8rem_8rem_minmax(0,1fr)] dark:text-gray-200"
              >
                <span className="whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                  {formatHospitalEvaluationDetailDateTime(history.created_at)}
                </span>
                <span className="truncate font-medium">{history.actor_label?.trim() || "-"}</span>
                <span className="font-medium">{labelHospitalEvaluationHistoryChange(history)}</span>
                <span className="min-w-0 break-words text-sm text-gray-600 dark:text-gray-300">
                  {formatHospitalEvaluationHistoryReason(history)}
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

function ReceiptVerificationModal({
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
          <div className="mx-auto flex aspect-square w-full max-w-[15rem] items-center justify-center overflow-hidden rounded-2xl bg-gray-100 text-sm font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-300">
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
            <ReceiptDecisionOption
              label="인증적합"
              checked={decision === "verify"}
              disabled={updating}
              onClick={() => onDecisionChange("verify")}
            />
            <ReceiptDecisionOption
              label="인증 부적합"
              checked={decision === "reject"}
              disabled={updating}
              onClick={() => onDecisionChange("reject")}
            />
          </div>

          {decision === "reject" ? (
            <div className="space-y-3">
              <label
                htmlFor="hospital-evaluation-receipt-reject-reason"
                className="block text-sm font-semibold text-gray-800 dark:text-white/90"
              >
                인증 부적합 사유
              </label>
              <select
                id="hospital-evaluation-receipt-reject-reason"
                value={rejectReason}
                onChange={(event) => onRejectReasonChange(event.target.value)}
                disabled={updating}
                className="h-11 w-full rounded-lg border border-gray-200 bg-gray-100 px-3 text-sm text-gray-800 outline-none transition focus:border-brand-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
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
                  id="hospital-evaluation-receipt-reject-reason-text"
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
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
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

function VisibilityButtons({
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
        className="h-9 min-w-16"
      >
        노출
      </Button>
      <Button
        type="button"
        size="sm"
        variant={visible ? "brand" : "outline"}
        disabled={disabled || !visible}
        onClick={() => onChange("INACTIVE")}
        className="h-9 min-w-16"
      >
        미노출
      </Button>
    </div>
  );
}

function ReceiptDecisionOption({
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
      className="inline-flex items-center gap-2 text-sm font-semibold text-gray-800 transition disabled:opacity-60 dark:text-gray-100"
    >
      <CircleCheck
        className={checked ? "size-5 text-brand-500" : "size-5 text-gray-400"}
        aria-hidden="true"
      />
      {label}
    </button>
  );
}

function ImageGallery({ title, images }: { title: string; images: HospitalEvaluationMediaAsset[] }) {
  return (
    <section className="space-y-2">
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{title}</p>
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
                  className="group relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950/30"
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
                    <span className="px-3 text-center text-xs text-gray-500 dark:text-gray-400">미리보기 없음</span>
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

function StarRating({ value }: { value: number }) {
  const normalizedValue = Math.max(0, Math.min(5, Math.round(value)));

  return (
    <span className="inline-flex items-center gap-1 text-2xl leading-none" aria-label={`${normalizedValue}점`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <span
          key={index}
          className={index < normalizedValue ? "text-brand-500" : "text-gray-300 dark:text-gray-700"}
        >
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

function EmptyDetailState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-950/30 dark:text-gray-400">
      {children}
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
