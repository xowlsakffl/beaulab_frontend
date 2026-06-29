"use client";

import { Card, CardContent, CardHeader, CardTitle, Pagination, type DataTableMeta } from "@beaulab/ui-admin";

import {
  OperationHistoryActionBadge,
  OperationHistoryReason,
  type OperationHistoryLike,
} from "@/components/common/OperationHistoryDisplay";

type ReportedOriginalHistoryItem = OperationHistoryLike & {
  id?: number | string | null;
  actor_label?: string | null;
};

type ReportedOriginalHistoryCardProps<THistory extends ReportedOriginalHistoryItem> = {
  histories: THistory[];
  meta: DataTableMeta | null;
  refreshing: boolean;
  formatDate: (history: THistory) => string;
  onGoPage: (page: number) => void;
};

export function ReportedOriginalHistoryCard<THistory extends ReportedOriginalHistoryItem>({
  histories,
  meta,
  refreshing,
  formatDate,
  onGoPage,
}: ReportedOriginalHistoryCardProps<THistory>) {
  return (
    <Card as="section">
      <CardHeader className="pb-4">
        <CardTitle>히스토리</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {histories.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {histories.map((history, index) => (
              <div
                key={history.id ?? index}
                className="grid gap-2 py-3 text-sm text-gray-700 md:grid-cols-[10rem_8rem_8rem_minmax(0,1fr)]"
              >
                <span className="text-xs whitespace-nowrap text-gray-500">{formatDate(history)}</span>
                <span className="truncate font-medium">{history.actor_label?.trim() || "-"}</span>
                <span>
                  <OperationHistoryActionBadge history={history} />
                </span>
                <span className="min-w-0 text-sm break-words text-gray-600">
                  <OperationHistoryReason history={history} />
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
            등록된 히스토리가 없습니다.
          </div>
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
