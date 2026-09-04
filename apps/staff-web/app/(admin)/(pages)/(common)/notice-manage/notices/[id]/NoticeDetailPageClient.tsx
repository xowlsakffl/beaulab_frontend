"use client";

import React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { isApiSuccess } from "@beaulab/types";
import { Button, SpinnerBlock, type DataTableMeta } from "@beaulab/ui-admin";
import { Can } from "@/components/common/guard";
import { LoadErrorState } from "@/components/common/LoadErrorState";
import { OperationHistoryCard, type OperationHistoryListItem } from "@/components/common/OperationHistoryCard";
import { NoticeContentCard, NoticeSettingsCard } from "@/components/notice/detail/NoticeDetailSections";
import { useNoticeDetail } from "@/hooks/notice/useNoticeDetail";
import { api } from "@/lib/common/api";
import { usePageHeaderExtra } from "@/lib/common/routing/page-header-extra";
import { ownerVisibilityStatusColor } from "@/lib/common/status-labels";
import { formatLocalDateTime } from "@/lib/notice/detail";
import { labelNoticeStatus } from "@/lib/notice/options";

export default function NoticeDetailPageClient() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const noticeId = Number(params.id);
  const { detail, isLoading, loadError } = useNoticeDetail(noticeId);
  const [historyQuery, setHistoryQuery] = React.useState({ noticeId, page: 1 });
  const historyPage = historyQuery.noticeId === noticeId ? historyQuery.page : 1;
  const [histories, setHistories] = React.useState<OperationHistoryListItem[]>([]);
  const [historyMeta, setHistoryMeta] = React.useState<DataTableMeta | null>(null);
  const [historiesLoading, setHistoriesLoading] = React.useState(true);
  const [historyError, setHistoryError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setHistories([]);
    setHistoryMeta(null);
  }, [noticeId]);

  React.useEffect(() => {
    if (!Number.isSafeInteger(noticeId) || noticeId <= 0) return;
    const controller = new AbortController();
    setHistoriesLoading(true);
    setHistoryError(null);
    const load = async () => {
      try {
        const response = await api.get<OperationHistoryListItem[]>(
          `/notices/${noticeId}/operation-histories`,
          {
            operation_histories_page: historyPage,
            operation_histories_per_page: 10,
          },
          { signal: controller.signal },
        );
        if (controller.signal.aborted) return;
        if (!isApiSuccess(response)) {
          setHistoryError(response.error.message || "히스토리를 불러오지 못했습니다.");
          return;
        }
        setHistories(response.data);
        setHistoryMeta((response.meta as DataTableMeta | null) ?? null);
      } catch {
        if (!controller.signal.aborted) setHistoryError("히스토리를 불러오는 중 오류가 발생했습니다.");
      } finally {
        if (!controller.signal.aborted) setHistoriesLoading(false);
      }
    };
    void load();
    return () => controller.abort();
  }, [historyPage, noticeId]);

  const rawReturnTo = searchParams.get("returnTo");
  const editPath =
    `/notice-manage/notices/${noticeId}/edit` + (rawReturnTo ? `?returnTo=${encodeURIComponent(rawReturnTo)}` : "");
  const headerActions = React.useMemo(
    () => (
      <Can permission="beaulab.notice.update">
        <Button size="sm" variant="brand" onClick={() => router.push(editPath)}>
          수정하기
        </Button>
      </Can>
    ),
    [editPath, router],
  );
  usePageHeaderExtra(isLoading || loadError || !detail ? null : headerActions);

  if (isLoading) return <SpinnerBlock className="min-h-[60vh]" spinnerClassName="size-10" />;
  if (loadError || !detail)
    return (
      <LoadErrorState
        title="공지사항 정보를 불러오지 못했습니다."
        message={loadError ?? "공지사항 정보를 찾을 수 없습니다."}
      />
    );

  return (
    <div className="grid min-w-0 grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(480px,1fr)]">
      <NoticeContentCard detail={detail} />
      <aside className="min-w-0 space-y-4">
        <NoticeSettingsCard detail={detail} />
        <div>
          {historyError ? (
            <p role="alert" className="mb-2 text-xs text-error-500">
              {historyError}
            </p>
          ) : null}
          <OperationHistoryCard
            histories={histories}
            meta={historyMeta}
            loading={historiesLoading}
            onPageChange={(page) => setHistoryQuery({ noticeId, page })}
            formatDateTime={formatLocalDateTime}
            statusLabel={labelNoticeStatus}
            statusBadgeColor={ownerVisibilityStatusColor}
          />
        </div>
      </aside>
    </div>
  );
}
