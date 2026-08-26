"use client";

import React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { hasPermission } from "@beaulab/auth";
import { isApiSuccess } from "@beaulab/types";
import { Button, SpinnerBlock, useGlobalAlert, type DataTableMeta } from "@beaulab/ui-admin";

import { AllowStatusConfirmModal } from "@/components/common/AllowStatusControls";
import { Can } from "@/components/common/guard";
import { LoadErrorState } from "@/components/common/LoadErrorState";
import { MediaPreviewModal, type MediaPreviewState } from "@/components/common/MediaPreviewModal";
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
import { getSession } from "@/lib/common/auth/session";
import { STAFF_STATUS_PERMISSIONS } from "@/lib/common/status-permissions";
import { usePageHeaderExtra } from "@/lib/common/routing/page-header-extra";
import { labelHospitalEventAllowStatus, type HospitalEventApiItem } from "@/lib/hospital-event/list";

type PendingAdminStatusChange = {
  allowStatus: "NORMAL" | "FORCED_STOPPED";
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
  const canUpdateStatus = hasPermission(getSession()?.auth, STAFF_STATUS_PERMISSIONS.hospitalEvent);

  const rawEventId = Array.isArray(params.id) ? params.id[0] : params.id;
  const eventId = Number(rawEventId);

  const [detail, setDetail] = React.useState<HospitalEventApiItem | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [previewMedia, setPreviewMedia] = React.useState<MediaPreviewState | null>(null);
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
  const [pendingAdminStatusChange, setPendingAdminStatusChange] = React.useState<PendingAdminStatusChange | null>(null);
  const [pendingAdminStatusError, setPendingAdminStatusError] = React.useState<string | null>(null);
  const [pendingAllowStatusChange, setPendingAllowStatusChange] = React.useState<PendingAllowStatusChange | null>(null);
  const [pendingAllowStatusError, setPendingAllowStatusError] = React.useState<string | null>(null);

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

  const requestAdminStatusChange = React.useCallback(
    (adminStatus: "NORMAL" | "FORCED_STOPPED") => {
      if (!detail || updatingStatus || detail.admin_status === adminStatus) return;

      setPendingAdminStatusChange({ allowStatus: adminStatus, reason: "" });
      setPendingAdminStatusError(null);
    },
    [detail, updatingStatus],
  );

  const updateAdminStatus = React.useCallback(
    async (adminStatus: "NORMAL" | "FORCED_STOPPED", reason?: string) => {
      if (!detail || updatingStatus) return false;

      setUpdatingStatus(true);

      try {
        const response = await api.patch<{ updated_count?: number }>("/hospital-events/admin-status", {
          ids: [detail.id],
          admin_status: adminStatus,
          ...(reason?.trim() ? { reason: reason.trim() } : {}),
        });

        if (!isApiSuccess(response)) {
          showAlert({
            variant: "error",
            title: adminStatus === "FORCED_STOPPED" ? "강제중지 실패" : "정상 전환 실패",
            message: response.error.message || "강제중지 상태를 변경하지 못했습니다.",
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

  const closeAdminStatusConfirmModal = React.useCallback(() => {
    if (updatingStatus) return;
    setPendingAdminStatusChange(null);
    setPendingAdminStatusError(null);
  }, [updatingStatus]);

  const updatePendingAdminStatusReason = React.useCallback((reason: string) => {
    setPendingAdminStatusChange((prev) => (prev ? { ...prev, reason } : prev));
    setPendingAdminStatusError(null);
  }, []);

  const confirmAdminStatusChange = React.useCallback(async () => {
    if (!pendingAdminStatusChange) return;

    const reason = pendingAdminStatusChange.reason.trim();
    if (pendingAdminStatusChange.allowStatus === "FORCED_STOPPED" && !reason) {
      setPendingAdminStatusError("강제중지 사유를 입력해주세요.");
      return;
    }

    const succeeded = await updateAdminStatus(pendingAdminStatusChange.allowStatus, reason);
    if (succeeded) {
      setPendingAdminStatusChange(null);
      setPendingAdminStatusError(null);
    }
  }, [pendingAdminStatusChange, updateAdminStatus]);

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
        <Can permission="beaulab.hospital_event.update">
          <Button type="button" variant="brand" size="sm" onClick={() => router.push(editPath)}>
            수정하기
          </Button>
        </Can>
      </div>
    );
  }, [editPath, eventId, router]);

  usePageHeaderExtra(isLoading || loadError ? null : headerActions);

  if (isLoading) {
    return <SpinnerBlock className="min-h-[60vh]" spinnerClassName="size-10" label="이벤트 정보를 불러오는 중" />;
  }

  if (loadError || !detail) {
    return (
      <LoadErrorState
        title="이벤트 정보를 불러오지 못했습니다."
        message={loadError ?? "이벤트 정보를 찾을 수 없습니다."}
      />
    );
  }

  return (
    <div className="min-w-0 space-y-4">
      <section className="grid min-w-0 grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(420px,1fr)_minmax(360px,0.85fr)_minmax(280px,0.55fr)]">
        <EventMainCard
          detail={detail}
          canUpdateStatus={canUpdateStatus}
          updating={updatingStatus}
          onAdminStatusChange={requestAdminStatusChange}
        />

        <div className="min-w-0 space-y-4">
          <EventInfoSummaryCard detail={detail} />
          <AllowStatusCard
            detail={detail}
            canUpdateStatus={canUpdateStatus}
            updating={updatingStatus}
            onChange={requestAllowStatus}
          />
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

      <MediaPreviewModal preview={previewMedia} onChange={setPreviewMedia} onClose={() => setPreviewMedia(null)} />
      {canUpdateStatus ? (
        <>
          <AllowStatusConfirmModal
            pending={pendingAdminStatusChange}
            title={pendingAdminStatusChange?.allowStatus === "NORMAL" ? "정상 전환" : "강제중지"}
            subjectLabel="해당 이벤트를"
            labelStatus={(status) => (status === "NORMAL" ? "정상" : "강제중지")}
            messageAction="처리"
            updating={updatingStatus}
            error={pendingAdminStatusError}
            rejectStatus="FORCED_STOPPED"
            reasonInputId="hospital-event-force-stop-reason"
            reasonLabel="강제중지 사유"
            reasonPlaceholder="강제중지 사유를 입력해주세요."
            onReasonChange={updatePendingAdminStatusReason}
            onClose={closeAdminStatusConfirmModal}
            onConfirm={() => void confirmAdminStatusChange()}
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
        </>
      ) : null}
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
