"use client";

import { replaceCurrentPageUrl } from "@/lib/common/navigation/replaceCurrentPageUrl";

import React from "react";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import { hasPermission } from "@beaulab/auth";
import { isApiSuccess } from "@beaulab/types";
import { Card, CardContent, SpinnerBlock, type DataTableMeta } from "@beaulab/ui-admin";

import { ReportedEvaluationDetailView } from "@/components/reported-content/detail/ReportedEvaluationDetailView";
import { ReportedReviewDetailView } from "@/components/reported-content/detail/ReportedReviewDetailView";
import { ReportedTalkDetailView } from "@/components/reported-content/detail/ReportedTalkDetailView";
import { api } from "@/lib/common/api";
import { getSession } from "@/lib/common/auth/session";
import { reportedContentStatusPermission, STAFF_STATUS_PERMISSIONS } from "@/lib/common/status-permissions";
import {
  HOSPITAL_EVALUATION_DETAIL_HISTORY_PER_PAGE,
  type HospitalEvaluationDetailResponse,
  type HospitalEvaluationOperationHistory,
} from "@/lib/hospital-evaluation/detail";
import {
  HOSPITAL_REVIEW_DETAIL_HISTORY_PER_PAGE,
  type HospitalReviewDetailResponse,
  type HospitalReviewOperationHistory,
} from "@/lib/hospital-review/detail";
import { TALK_DETAIL_HISTORY_PER_PAGE, type TalkDetailResponse, type TalkOperationHistory } from "@/lib/talk/detail";
import type {
  ReportedContentDetailReportItem,
  ReportedContentDetailResponse,
  ReportedContentReportsBlock,
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

const historiesDefaultPage = 1;

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
  const auth = getSession()?.auth;
  const canUpdateReportedStatus = hasPermission(auth, reportedContentStatusPermission(config.targetType));
  const originalStatusPermission =
    config.kind === "talk"
      ? STAFF_STATUS_PERMISSIONS.talk
      : config.kind === "review"
        ? STAFF_STATUS_PERMISSIONS.hospitalReview
        : STAFF_STATUS_PERMISSIONS.hospitalEvaluation;
  const canUpdateOriginalStatus = hasPermission(auth, originalStatusPermission);
  const params = useParams<{ id: string }>();
  const pathname = usePathname();
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
  const hasLoadedRef = React.useRef(false);

  const syncDetailQuery = React.useCallback(
    (nextHistoriesPage: number) => {
      const nextSearchParams = new URLSearchParams(searchParams.toString());
      syncPageParam(nextSearchParams, "operation_histories_page", nextHistoriesPage, historiesDefaultPage);

      const nextQuery = nextSearchParams.toString();
      replaceCurrentPageUrl(nextQuery ? `${pathname}?${nextQuery}` : pathname);
    },
    [pathname, searchParams],
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
    return (
      <ReportedTalkDetailView
        detail={detail as TalkDetailResponse}
        histories={histories as TalkOperationHistory[]}
        historiesMeta={historiesMeta}
        refreshing={refreshing}
        targetType={config.targetType}
        targetId={targetId}
        reportedDetail={reportedDetail}
        reportedReports={reportedReports}
        actionError={actionError}
        onActionError={setActionError}
        onSaved={() => refreshDetail(true)}
        onReportedStatusUpdated={() => void fetchHistories(true)}
        onHistoryPageChange={changeHistoriesPage}
        canUpdateReportedStatus={canUpdateReportedStatus}
        canUpdateOriginalStatus={canUpdateOriginalStatus}
      />
    );
  }

  if (config.kind === "review") {
    return (
      <ReportedReviewDetailView
        boardType={config.boardType}
        detail={detail as HospitalReviewDetailResponse}
        histories={histories as HospitalReviewOperationHistory[]}
        historiesMeta={historiesMeta}
        refreshing={refreshing}
        targetType={config.targetType}
        targetId={targetId}
        reportedDetail={reportedDetail}
        reportedReports={reportedReports}
        actionError={actionError}
        onActionError={setActionError}
        onSaved={() => refreshDetail(true)}
        onReportedStatusUpdated={() => void fetchHistories(true)}
        onHistoryPageChange={changeHistoriesPage}
        canUpdateReportedStatus={canUpdateReportedStatus}
        canUpdateOriginalStatus={canUpdateOriginalStatus}
      />
    );
  }

  if (config.kind === "evaluation") {
    return (
      <ReportedEvaluationDetailView
        detail={detail as HospitalEvaluationDetailResponse}
        histories={histories as HospitalEvaluationOperationHistory[]}
        historiesMeta={historiesMeta}
        refreshing={refreshing}
        targetType={config.targetType}
        targetId={targetId}
        reportedDetail={reportedDetail}
        reportedReports={reportedReports}
        actionError={actionError}
        onActionError={setActionError}
        onSaved={() => refreshDetail(true)}
        onReportedStatusUpdated={() => void fetchHistories(true)}
        onHistoryPageChange={changeHistoriesPage}
        canUpdateReportedStatus={canUpdateReportedStatus}
        canUpdateReceiptStatus={canUpdateOriginalStatus}
      />
    );
  }

  return null;
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
