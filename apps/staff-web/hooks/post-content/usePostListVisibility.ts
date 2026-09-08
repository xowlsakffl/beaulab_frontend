"use client";

import React from "react";
import { isApiSuccess } from "@beaulab/types";
import { api } from "@/lib/common/api";

type VisibilityRow = { id: number; status: string; visibilityChangeLocked: boolean };
type PendingVisibilityChange<Board> = {
  board: Board;
  source: "bulk" | "row";
  ids: number[];
  status: "ACTIVE" | "INACTIVE";
  hiddenReason: string;
};

export function usePostListVisibility<Board extends string>({
  scopeKey,
  board,
  rows,
  statusPath,
  canUpdateStatus,
  refresh,
}: {
  scopeKey: string;
  board: Board;
  rows: VisibilityRow[];
  statusPath: string;
  canUpdateStatus: boolean;
  refresh: () => void;
}) {
  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(new Set());
  const [pendingVisibilityChange, setPendingVisibilityChange] = React.useState<PendingVisibilityChange<Board> | null>(
    null,
  );
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [bulkUpdating, setBulkUpdating] = React.useState(false);
  const [rowVisibilityUpdatingIds, setRowVisibilityUpdatingIds] = React.useState<Set<number>>(new Set());
  const inFlightRef = React.useRef(false);
  const lifetimeRef = React.useRef(0);
  const currentScopeRef = React.useRef(scopeKey);
  React.useLayoutEffect(() => {
    currentScopeRef.current = scopeKey;
  }, [scopeKey]);
  const refreshRef = React.useRef(refresh);
  React.useLayoutEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  const resetVisibility = React.useCallback(() => {
    setSelectedIds(new Set());
    setPendingVisibilityChange(null);
    setActionError(null);
  }, []);

  React.useEffect(() => {
    lifetimeRef.current += 1;
    inFlightRef.current = false;
    resetVisibility();
    setBulkUpdating(false);
    setRowVisibilityUpdatingIds(new Set());
    return () => {
      lifetimeRef.current += 1;
    };
  }, [scopeKey, resetVisibility]);

  React.useEffect(() => {
    const selectable = new Set(rows.filter((row) => !row.visibilityChangeLocked).map((row) => row.id));
    setSelectedIds((current) => {
      const next = new Set([...current].filter((id) => selectable.has(id)));
      return next.size === current.size ? current : next;
    });
  }, [rows]);

  const toggleRow = React.useCallback(
    (id: number, checked: boolean) => {
      if (checked && !rows.some((row) => row.id === id && !row.visibilityChangeLocked)) return;
      setSelectedIds((current) => {
        const next = new Set(current);
        if (checked) next.add(id);
        else next.delete(id);
        return next;
      });
    },
    [rows],
  );
  const toggleAllRows = React.useCallback(
    (checked: boolean) => {
      setSelectedIds(
        checked ? new Set(rows.filter((row) => !row.visibilityChangeLocked).map((row) => row.id)) : new Set(),
      );
    },
    [rows],
  );

  const requestVisibility = React.useCallback(
    (ids: number[], status: string, source: "bulk" | "row") => {
      if (!canUpdateStatus || inFlightRef.current || (status !== "ACTIVE" && status !== "INACTIVE")) return;
      const selectableIds = new Set(
        rows.filter((row) => !row.visibilityChangeLocked && row.status !== status).map((row) => row.id),
      );
      const targets = ids.filter((id) => selectableIds.has(id));
      if (!targets.length) return;
      setActionError(null);
      setPendingVisibilityChange({ board, ids: targets, status, source, hiddenReason: "" });
    },
    [board, canUpdateStatus, rows],
  );
  const requestBulkVisibilityChange = React.useCallback(
    (status: string) => requestVisibility([...selectedIds], status, "bulk"),
    [requestVisibility, selectedIds],
  );
  const requestRowVisibilityChange = React.useCallback(
    (id: number, status: string) => requestVisibility([id], status, "row"),
    [requestVisibility],
  );
  const closeVisibilityConfirmModal = React.useCallback(() => {
    if (!inFlightRef.current) setPendingVisibilityChange(null);
  }, []);
  const updatePendingHiddenReason = React.useCallback((hiddenReason: string) => {
    setPendingVisibilityChange((current) => (current ? { ...current, hiddenReason } : current));
  }, []);

  const confirmVisibilityChange = React.useCallback(async () => {
    if (!canUpdateStatus || !pendingVisibilityChange || inFlightRef.current) return;
    inFlightRef.current = true;
    const lifetime = lifetimeRef.current;
    const isCurrent = () => currentScopeRef.current === scopeKey && lifetimeRef.current === lifetime;
    const { ids, status, hiddenReason, source } = pendingVisibilityChange;
    setBulkUpdating(source === "bulk");
    setRowVisibilityUpdatingIds(source === "row" ? new Set(ids) : new Set());
    setActionError(null);
    try {
      const response = await api.patch(statusPath, {
        ids,
        status,
        ...(status === "INACTIVE" && hiddenReason.trim() ? { hidden_reason: hiddenReason.trim() } : {}),
      });
      if (!isCurrent()) return;
      if (!isApiSuccess(response)) throw new Error(response.error.message || "노출 상태 변경에 실패했습니다.");
      setPendingVisibilityChange(null);
      setSelectedIds((current) => new Set([...current].filter((id) => !ids.includes(id))));
      refreshRef.current();
    } catch (error) {
      if (isCurrent())
        setActionError(error instanceof Error ? error.message : "노출 상태 변경 중 오류가 발생했습니다.");
    } finally {
      if (isCurrent()) {
        inFlightRef.current = false;
        setBulkUpdating(false);
        setRowVisibilityUpdatingIds(new Set());
      }
    }
  }, [canUpdateStatus, pendingVisibilityChange, scopeKey, statusPath]);

  return {
    selectedIds,
    setSelectedIds,
    actionError,
    bulkUpdating,
    rowVisibilityUpdatingIds,
    pendingVisibilityChange,
    resetVisibility,
    toggleRow,
    toggleAllRows,
    requestBulkVisibilityChange,
    requestRowVisibilityChange,
    closeVisibilityConfirmModal,
    updatePendingHiddenReason,
    confirmVisibilityChange,
  };
}
