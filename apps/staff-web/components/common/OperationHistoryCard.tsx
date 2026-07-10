"use client";

import React, { type ReactNode } from "react";
import { Button, Card, Pagination, type BadgeColor, type DataTableMeta } from "@beaulab/ui-admin";

import { AddCircleButton } from "@/components/common/AddCircleButton";
import {
  OperationHistoryActionBadge,
  OperationHistoryReason,
  normalizeOperationHistoryFieldLabel,
  type OperationHistoryChangeLike,
  type OperationHistoryLike,
} from "@/components/common/OperationHistoryDisplay";

export type OperationHistoryListItem = OperationHistoryLike & {
  id: number;
  actor_label?: string | null;
  created_at?: string | null;
  changes?: OperationHistoryChangeLike[] | null;
};

type OperationHistoryCardProps = {
  histories: OperationHistoryListItem[];
  meta: DataTableMeta | null;
  loading: boolean;
  onPageChange: (page: number) => void;
  cardClassName?: string;
  title?: string;
  formatDateTime: (value?: string | null) => string;
  actionLabelOverride?: (history: OperationHistoryLike, label: string) => string | null | undefined;
  statusLabel?: (status: string, fallbackLabel?: string) => string;
  statusBadgeColor?: (status: string) => BadgeColor;
  allowStatusLabel?: (status: string, fallbackLabel?: string) => string;
  changeValueDisplay?: (change: OperationHistoryChangeLike, side: "before" | "after") => ReactNode;
};

const stateBoxClassName =
  "flex min-h-24 items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500";

export function OperationHistoryCard({
  histories,
  meta,
  loading,
  onPageChange,
  cardClassName = "rounded-xl border border-gray-200 bg-white p-5",
  title = "히스토리",
  formatDateTime,
  actionLabelOverride,
  statusLabel,
  statusBadgeColor,
  allowStatusLabel,
  changeValueDisplay = defaultChangeValueDisplay,
}: OperationHistoryCardProps) {
  const [expandedHistoryIds, setExpandedHistoryIds] = React.useState<Set<number>>(() => new Set());
  const hasHistories = histories.length > 0;

  const toggleExpandedHistory = React.useCallback((historyId: number) => {
    setExpandedHistoryIds((current) => {
      const next = new Set(current);
      if (next.has(historyId)) {
        next.delete(historyId);
      } else {
        next.add(historyId);
      }

      return next;
    });
  }, []);

  return (
    <Card className={cardClassName}>
      <h3 className="mb-4 border-b border-gray-200 pb-3 text-sm font-bold text-gray-900">{title}</h3>
      {hasHistories ? (
        <div
          className={["space-y-3", loading ? "pointer-events-none opacity-60" : ""].filter(Boolean).join(" ")}
          aria-busy={loading}
        >
          <div className="max-h-56 min-h-24 space-y-3 overflow-y-auto pr-1">
            {histories.map((history) => {
              const changes = history.changes ?? [];
              const canExpand = history.action === "UPDATED" && changes.length > 0;
              const isExpanded = expandedHistoryIds.has(history.id);

              return (
                <div key={history.id} className="space-y-2 border-b border-gray-100 pb-3 last:border-b-0 last:pb-0">
                  <div className="grid grid-cols-[6.5rem_5rem_5rem_minmax(0,1fr)_2rem] items-start gap-3 text-xs text-gray-600">
                    <span>{formatDateTime(history.created_at)}</span>
                    <span>{history.actor_label || "-"}</span>
                    <span>
                      <OperationHistoryActionBadge history={history} actionLabelOverride={actionLabelOverride} />
                    </span>
                    <span className="break-words">
                      <OperationHistoryReason
                        history={history}
                        statusLabel={statusLabel}
                        statusBadgeColor={statusBadgeColor}
                        allowStatusLabel={allowStatusLabel}
                      />
                    </span>
                    {canExpand ? (
                      isExpanded ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label="변경 상세 닫기"
                          className="ml-auto size-7 rounded-full border border-gray-300 bg-white p-0 text-brand-600 shadow-none hover:border-gray-300 hover:bg-white hover:text-brand-600"
                          onClick={() => toggleExpandedHistory(history.id)}
                        >
                          <span className="text-xs leading-none">-</span>
                        </Button>
                      ) : (
                        <AddCircleButton
                          label="변경 상세 열기"
                          className="ml-auto"
                          onClick={() => toggleExpandedHistory(history.id)}
                        />
                      )
                    ) : (
                      <span aria-hidden="true" />
                    )}
                  </div>
                  {canExpand && isExpanded ? (
                    <div className="space-y-2 rounded-lg bg-gray-50 p-3">
                      {changes.map((change, index) => (
                        <div
                          key={`${history.id}-${change.field_key ?? index}`}
                          className="space-y-1 text-xs text-gray-600"
                        >
                          <p className="font-semibold text-gray-900">
                            {normalizeOperationHistoryFieldLabel(change.field_label, change.field_key) || "변경 항목"}
                          </p>
                          <div className="grid grid-cols-[4rem_minmax(0,1fr)] gap-2">
                            <span className="font-semibold text-gray-500">변경 전</span>
                            <span className="break-words whitespace-pre-line">
                              {changeValueDisplay(change, "before")}
                            </span>
                          </div>
                          <div className="grid grid-cols-[4rem_minmax(0,1fr)] gap-2">
                            <span className="font-semibold text-brand-600">변경 후</span>
                            <span className="break-words whitespace-pre-line">
                              {changeValueDisplay(change, "after")}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
          {meta ? (
            <div className="flex justify-center pt-2">
              <Pagination
                currentPage={meta.current_page}
                totalPages={Math.max(1, meta.last_page)}
                onPageChange={onPageChange}
              />
            </div>
          ) : null}
        </div>
      ) : loading ? (
        <div className={stateBoxClassName}>히스토리를 불러오는 중입니다.</div>
      ) : (
        <div className={stateBoxClassName}>등록된 히스토리가 없습니다.</div>
      )}
    </Card>
  );
}

function defaultChangeValueDisplay(change: OperationHistoryChangeLike, side: "before" | "after") {
  const display = side === "after" ? change.after_display : change.before_display;
  const value = side === "after" ? change.after_value : change.before_value;

  if (typeof display === "string" && display.trim() !== "") {
    return display;
  }

  return stringifyHistoryValue(value);
}

function stringifyHistoryValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "예" : "아니오";
  if (typeof value === "string" || typeof value === "number") return String(value);

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}
