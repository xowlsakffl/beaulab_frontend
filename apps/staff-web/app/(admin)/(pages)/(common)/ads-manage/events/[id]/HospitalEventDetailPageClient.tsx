"use client";

import React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { isApiSuccess } from "@beaulab/types";
import { Button, SpinnerBlock, useGlobalAlert, type DataTableMeta } from "@beaulab/ui-admin";

import { AllowStatusConfirmModal } from "@/components/common/AllowStatusControls";
import { Can } from "@/components/common/guard";
import { LoadErrorState } from "@/components/common/LoadErrorState";
import { VisibilityConfirmModal } from "@/components/common/VisibilityActionButtons";
import {
  HospitalMediaPreviewModal,
  type HospitalMediaPreviewState,
} from "@/components/hospital/media/HospitalMediaPreviewModal";
import {
  AdminNotesCard,
  AllowStatusCard,
  EventInfoSummaryCard,
  EventMainCard,
  EventMediaColumn,
  NoteCreateModal,
  OperationHistoryCard,
  type AdminNoteItem,
  type OperationHistoryItem,
} from "@/components/hospital-event/detail/HospitalEventDetailSections";
import { api } from "@/lib/common/api";
import { buildReturnToPath } from "@/lib/common/navigation/buildReturnToPath";
import { usePageHeaderExtra } from "@/lib/common/routing/page-header-extra";
import { labelHospitalEventAllowStatus, type HospitalEventApiItem } from "@/lib/hospital-event/list";

type PendingVisibilityChange = {
  status: "ACTIVE" | "INACTIVE";
  reason: string;
};

type PendingAllowStatusChange = {
  allowStatus: string;
  reason: string;
};

const EVENT_ADMIN_NOTE_TARGET = "hospital_event";
const HISTORY_PER_PAGE = 10;

export default function HospitalEventDetailPageClient() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showAlert } = useGlobalAlert();

  const rawEventId = Array.isArray(params.id) ? params.id[0] : params.id;
  const eventId = Number(rawEventId);

  const [detail, setDetail] = React.useState<HospitalEventApiItem | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [previewMedia, setPreviewMedia] = React.useState<HospitalMediaPreviewState | null>(null);
  const [updatingStatus, setUpdatingStatus] = React.useState(false);
  const [notes, setNotes] = React.useState<AdminNoteItem[]>([]);
  const [notesLoading, setNotesLoading] = React.useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = React.useState(false);
  const [noteInput, setNoteInput] = React.useState("");
  const [savingNote, setSavingNote] = React.useState(false);
  const [histories, setHistories] = React.useState<OperationHistoryItem[]>([]);
  const [historyMeta, setHistoryMeta] = React.useState<DataTableMeta | null>(null);
  const [historyPage, setHistoryPage] = React.useState(1);
  const [historiesLoading, setHistoriesLoading] = React.useState(false);
  const [pendingVisibilityChange, setPendingVisibilityChange] = React.useState<PendingVisibilityChange | null>(null);
  const [pendingAllowStatusChange, setPendingAllowStatusChange] = React.useState<PendingAllowStatusChange | null>(null);
  const [pendingAllowStatusError, setPendingAllowStatusError] = React.useState<string | null>(null);

  const getReturnToPath = React.useCallback(
    (highlightId?: number) =>
      buildReturnToPath({
        searchParams,
        fallbackPath: "/ads-manage/events",
        allowedPrefix: "/ads-manage/events",
        highlightId,
      }),
    [searchParams],
  );

  const editPath = React.useMemo(() => {
    const rawReturnTo = searchParams.get("returnTo");
    if (!Number.isFinite(eventId) || eventId <= 0) return "/ads-manage/events";

    return rawReturnTo
      ? `/ads-manage/events/${eventId}/edit?returnTo=${encodeURIComponent(rawReturnTo)}`
      : `/ads-manage/events/${eventId}/edit`;
  }, [eventId, searchParams]);

  const fetchEvent = React.useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = Boolean(options?.silent);

      if (!Number.isFinite(eventId) || eventId <= 0) {
        if (!silent) {
          setLoadError("잘못된 이벤트 경로입니다.");
          setIsLoading(false);
        }
        return;
      }

      if (!silent) {
        setIsLoading(true);
        setLoadError(null);
      }

      try {
        const response = await api.get<HospitalEventApiItem>(`/hospital-events/${eventId}`);

        if (!isApiSuccess(response)) {
          if (!silent) {
            setLoadError(response.error.message || "이벤트 정보를 불러오지 못했습니다.");
          }
          return;
        }

        setDetail(response.data);
      } catch {
        if (!silent) {
          setLoadError("이벤트 정보를 불러오는 중 오류가 발생했습니다.");
        }
      } finally {
        if (!silent) {
          setIsLoading(false);
        }
      }
    },
    [eventId],
  );

  const fetchNotes = React.useCallback(async () => {
    if (!Number.isFinite(eventId) || eventId <= 0) return;

    setNotesLoading(true);

    try {
      const response = await api.get<AdminNoteItem[]>("/notes", {
        target_type: EVENT_ADMIN_NOTE_TARGET,
        target_id: eventId,
      });

      if (isApiSuccess(response)) {
        setNotes(response.data);
      }
    } finally {
      setNotesLoading(false);
    }
  }, [eventId]);

  const fetchHistories = React.useCallback(async () => {
    if (!Number.isFinite(eventId) || eventId <= 0) return;

    setHistoriesLoading(true);

    try {
      const response = await api.get<OperationHistoryItem[]>(`/hospital-events/${eventId}/operation-histories`, {
        operation_histories_page: historyPage,
        operation_histories_per_page: HISTORY_PER_PAGE,
      });

      if (isApiSuccess(response)) {
        setHistories(response.data);
        setHistoryMeta((response.meta as DataTableMeta | null) ?? null);
      }
    } finally {
      setHistoriesLoading(false);
    }
  }, [eventId, historyPage]);

  React.useEffect(() => {
    void fetchEvent();
  }, [fetchEvent]);

  React.useEffect(() => {
    void fetchNotes();
  }, [fetchNotes]);

  React.useEffect(() => {
    void fetchHistories();
  }, [fetchHistories]);

  const requestVisibilityStatus = React.useCallback(
    (status: "ACTIVE" | "INACTIVE") => {
      if (!detail || updatingStatus || detail.status === status) return;

      setPendingVisibilityChange({ status, reason: "" });
    },
    [detail, updatingStatus],
  );

  const updateVisibilityStatus = React.useCallback(
    async (status: "ACTIVE" | "INACTIVE", reason?: string) => {
      if (!detail || updatingStatus) return false;

      setUpdatingStatus(true);

      try {
        const response = await api.patch<{ updated_count?: number }>("/hospital-events/status", {
          ids: [detail.id],
          status,
          ...(reason?.trim() ? { reason: reason.trim() } : {}),
        });

        if (!isApiSuccess(response)) {
          showAlert({
            variant: "error",
            title: "노출상태 변경 실패",
            message: response.error.message || "노출상태를 변경하지 못했습니다.",
          });
          return false;
        }

        await Promise.all([fetchEvent({ silent: true }), fetchHistories()]);
        return true;
      } finally {
        setUpdatingStatus(false);
      }
    },
    [detail, fetchEvent, fetchHistories, showAlert, updatingStatus],
  );

  const requestAllowStatus = React.useCallback(
    (allowStatus: string) => {
      if (!detail || updatingStatus || detail.allow_status === allowStatus) return;

      setPendingAllowStatusChange({ allowStatus, reason: "" });
      setPendingAllowStatusError(null);
    },
    [detail, updatingStatus],
  );

  const updateAllowStatus = React.useCallback(
    async (allowStatus: string, reason?: string) => {
      if (!detail || updatingStatus) return false;

      setUpdatingStatus(true);

      try {
        const response = await api.patch<{ updated_count?: number }>("/hospital-events/allow-status", {
          ids: [detail.id],
          allow_status: allowStatus,
          ...(reason?.trim() ? { reason: reason.trim() } : {}),
        });

        if (!isApiSuccess(response)) {
          showAlert({
            variant: "error",
            title: "검수상태 변경 실패",
            message: response.error.message || "검수상태를 변경하지 못했습니다.",
          });
          return false;
        }

        await Promise.all([fetchEvent({ silent: true }), fetchHistories()]);
        return true;
      } finally {
        setUpdatingStatus(false);
      }
    },
    [detail, fetchEvent, fetchHistories, showAlert, updatingStatus],
  );

  const closeVisibilityConfirmModal = React.useCallback(() => {
    if (updatingStatus) return;
    setPendingVisibilityChange(null);
  }, [updatingStatus]);

  const updatePendingVisibilityReason = React.useCallback((reason: string) => {
    setPendingVisibilityChange((prev) => (prev ? { ...prev, reason } : prev));
  }, []);

  const confirmVisibilityChange = React.useCallback(async () => {
    if (!pendingVisibilityChange) return;

    const reason = pendingVisibilityChange.reason.trim();
    if (pendingVisibilityChange.status === "INACTIVE" && !reason) {
      showAlert({ variant: "error", title: "미노출 사유 확인", message: "미노출 사유를 입력해주세요." });
      return;
    }

    const succeeded = await updateVisibilityStatus(pendingVisibilityChange.status, reason);
    if (succeeded) {
      setPendingVisibilityChange(null);
    }
  }, [pendingVisibilityChange, showAlert, updateVisibilityStatus]);

  const closeAllowStatusConfirmModal = React.useCallback(() => {
    if (updatingStatus) return;
    setPendingAllowStatusChange(null);
    setPendingAllowStatusError(null);
  }, [updatingStatus]);

  const updatePendingAllowStatusReason = React.useCallback((reason: string) => {
    setPendingAllowStatusChange((prev) => (prev ? { ...prev, reason } : prev));
    setPendingAllowStatusError(null);
  }, []);

  const confirmAllowStatusChange = React.useCallback(async () => {
    if (!pendingAllowStatusChange) return;

    const reason = pendingAllowStatusChange.reason.trim();
    if (pendingAllowStatusChange.allowStatus === "REJECTED" && !reason) {
      setPendingAllowStatusError("반려 사유를 입력해주세요.");
      return;
    }

    const succeeded = await updateAllowStatus(pendingAllowStatusChange.allowStatus, reason);
    if (succeeded) {
      setPendingAllowStatusChange(null);
      setPendingAllowStatusError(null);
    }
  }, [pendingAllowStatusChange, updateAllowStatus]);

  const saveNote = React.useCallback(async () => {
    const note = noteInput.trim();
    if (!note || savingNote) return;

    setSavingNote(true);

    try {
      const response = await api.post<AdminNoteItem>("/notes", {
        target_type: EVENT_ADMIN_NOTE_TARGET,
        target_id: eventId,
        note,
        is_internal: true,
      });

      if (!isApiSuccess(response)) {
        showAlert({
          variant: "error",
          title: "관리자 메모 저장 실패",
          message: response.error.message || "관리자 메모를 저장하지 못했습니다.",
        });
        return;
      }

      setNoteInput("");
      setIsNoteModalOpen(false);
      await fetchNotes();
    } finally {
      setSavingNote(false);
    }
  }, [eventId, fetchNotes, noteInput, savingNote, showAlert]);

  const headerActions = React.useMemo(() => {
    if (!Number.isFinite(eventId) || eventId <= 0) return null;

    return (
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => router.push(getReturnToPath())}>
          취소
        </Button>
        <Can permission="beaulab.hospital_event.update">
          <Button type="button" variant="brand" size="sm" onClick={() => router.push(editPath)}>
            수정하기
          </Button>
        </Can>
      </div>
    );
  }, [editPath, eventId, getReturnToPath, router]);

  usePageHeaderExtra(isLoading || loadError ? null : headerActions);

  if (isLoading) {
    return <SpinnerBlock className="min-h-[60vh]" spinnerClassName="size-10" label="이벤트 정보를 불러오는 중" />;
  }

  if (loadError || !detail) {
    return (
      <LoadErrorState
        title="이벤트 정보를 불러오지 못했습니다."
        message={loadError ?? "이벤트 정보를 찾을 수 없습니다."}
        onRetry={() => void fetchEvent()}
      />
    );
  }

  const pendingVisibilityLabel = pendingVisibilityChange?.status === "ACTIVE" ? "노출" : "미노출";
  return (
    <div className="min-w-0 space-y-4">
      <section className="grid min-w-0 grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(420px,1fr)_minmax(360px,0.85fr)_minmax(280px,0.55fr)]">
        <EventMainCard detail={detail} updating={updatingStatus} onVisibilityChange={requestVisibilityStatus} />

        <div className="min-w-0 space-y-4">
          <EventInfoSummaryCard detail={detail} />
          <AllowStatusCard detail={detail} updating={updatingStatus} onChange={requestAllowStatus} />
          <AdminNotesCard notes={notes} loading={notesLoading} onAdd={() => setIsNoteModalOpen(true)} />
          <OperationHistoryCard
            histories={histories}
            meta={historyMeta}
            loading={historiesLoading}
            onPageChange={setHistoryPage}
          />
        </div>

        <EventMediaColumn detail={detail} onPreview={setPreviewMedia} />
      </section>

      <HospitalMediaPreviewModal
        preview={previewMedia}
        onChange={setPreviewMedia}
        onClose={() => setPreviewMedia(null)}
      />
      <VisibilityConfirmModal
        isOpen={Boolean(pendingVisibilityChange)}
        status={pendingVisibilityChange?.status}
        message={<>해당 이벤트를 {pendingVisibilityLabel} 하시겠습니까?</>}
        hiddenReasonValue={pendingVisibilityChange?.reason ?? ""}
        updating={updatingStatus}
        reasonInputId="hospital-event-hidden-reason"
        reasonPlaceholder="미노출 사유를 입력해주세요."
        onHiddenReasonChange={updatePendingVisibilityReason}
        onClose={closeVisibilityConfirmModal}
        onConfirm={() => void confirmVisibilityChange()}
      />
      <AllowStatusConfirmModal
        pending={pendingAllowStatusChange}
        subjectLabel="해당 이벤트를"
        labelStatus={labelHospitalEventAllowStatus}
        updating={updatingStatus}
        error={pendingAllowStatusError}
        reasonInputId="hospital-event-rejected-reason"
        onReasonChange={updatePendingAllowStatusReason}
        onClose={closeAllowStatusConfirmModal}
        onConfirm={() => void confirmAllowStatusChange()}
      />
      <NoteCreateModal
        isOpen={isNoteModalOpen}
        value={noteInput}
        saving={savingNote}
        onChange={setNoteInput}
        onClose={() => {
          if (savingNote) return;
          setIsNoteModalOpen(false);
        }}
        onSave={saveNote}
      />
    </div>
  );
}
