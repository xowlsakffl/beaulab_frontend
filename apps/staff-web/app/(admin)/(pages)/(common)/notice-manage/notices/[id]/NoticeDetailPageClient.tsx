"use client";

import React from "react";
import { useOperationHistories } from "@/hooks/common/useOperationHistories";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button, SpinnerBlock } from "@beaulab/ui-admin";
import { Can } from "@/components/common/guard";
import { LoadErrorState } from "@/components/common/LoadErrorState";
import { OperationHistoryCard, type OperationHistoryListItem } from "@/components/common/OperationHistoryCard";
import { NoticeContentCard, NoticeSettingsCard } from "@/components/notice/detail/NoticeDetailSections";
import { useNoticeDetail } from "@/hooks/notice/useNoticeDetail";
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
  const {
    histories,
    meta: historyMeta,
    loading: historiesLoading,
    error: historiesError,
    setPage: setHistoryPage,
  } = useOperationHistories<OperationHistoryListItem>(
    Number.isSafeInteger(noticeId) && noticeId > 0 ? `/notices/${noticeId}/operation-histories` : null,
  );

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
          <OperationHistoryCard
            histories={histories}
            meta={historyMeta}
            loading={historiesLoading}
            error={historiesError}
            onPageChange={setHistoryPage}
            formatDateTime={formatLocalDateTime}
            statusLabel={labelNoticeStatus}
            statusBadgeColor={ownerVisibilityStatusColor}
          />
        </div>
      </aside>
    </div>
  );
}
