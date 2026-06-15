"use client";

import React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { isApiSuccess } from "@beaulab/types";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CategoryBadgeList,
  FormTextArea,
  InputField,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalPanel,
  ModalTitle,
  Pagination,
  SpinnerBlock,
  StatusBadge,
  useGlobalAlert,
  type DataTableMeta,
} from "@beaulab/ui-admin";

import { AddCircleButton } from "@/components/common/AddCircleButton";
import { Can } from "@/components/common/guard";
import { VisibilityActionButtons } from "@/components/common/VisibilityActionButtons";
import {
  HospitalMediaPreviewModal,
  type HospitalMediaPreviewState,
} from "@/components/hospital/media/HospitalMediaPreviewModal";
import { api } from "@/lib/common/api";
import { buildReturnToPath } from "@/lib/common/navigation/buildReturnToPath";
import { usePageHeaderExtra } from "@/lib/common/routing/page-header-extra";
import {
  formatHospitalEventPoint,
  formatHospitalEventPrice,
  labelHospitalEventAllowStatus,
  resolveHospitalEventMediaUrl,
  type HospitalEventApiItem,
  type HospitalEventCategory,
  type HospitalEventMedia,
} from "@/lib/hospital-event/list";

type AdminNoteItem = {
  id: number;
  note?: string | null;
  creator_name?: string | null;
  created_at?: string | null;
};

type OperationHistoryChangeItem = {
  id?: number;
  field_key?: string | null;
  field_label?: string | null;
  before_value?: unknown;
  after_value?: unknown;
  before_display?: string | null;
  after_display?: string | null;
  sort_order?: number | null;
};

type OperationHistoryItem = {
  id: number;
  actor_label?: string | null;
  field?: string | null;
  action?: string | null;
  changes?: OperationHistoryChangeItem[] | null;
  before_value?: unknown;
  after_value?: unknown;
  reason?: string | null;
  created_at?: string | null;
};

type PendingVisibilityChange = {
  status: "ACTIVE" | "INACTIVE";
  reason: string;
};

type PendingAllowStatusChange = {
  allowStatus: string;
  reason: string;
};

const cardClassName = "rounded-xl border border-gray-200 bg-white p-5";
const labelClassName = "text-xs font-semibold text-gray-500";
const valueClassName = "min-w-0 break-words text-sm leading-6 text-gray-800";
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

  const getReturnToPath = React.useCallback(
    (highlightId?: number) =>
      buildReturnToPath({
        searchParams,
        fallbackPath: "/events",
        allowedPrefix: "/events",
        highlightId,
      }),
    [searchParams],
  );

  const editPath = React.useMemo(() => {
    const rawReturnTo = searchParams.get("returnTo");
    if (!Number.isFinite(eventId) || eventId <= 0) return "/events";

    return rawReturnTo
      ? `/events/${eventId}/edit?returnTo=${encodeURIComponent(rawReturnTo)}`
      : `/events/${eventId}/edit`;
  }, [eventId, searchParams]);

  const fetchEvent = React.useCallback(async (options?: { silent?: boolean }) => {
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
  }, [eventId]);

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
          showAlert({ variant: "error", title: "노출상태 변경 실패", message: response.error.message || "노출상태를 변경하지 못했습니다." });
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
          showAlert({ variant: "error", title: "검수상태 변경 실패", message: response.error.message || "검수상태를 변경하지 못했습니다." });
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
    setPendingVisibilityChange((prev) => prev ? { ...prev, reason } : prev);
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
  }, [updatingStatus]);

  const updatePendingAllowStatusReason = React.useCallback((reason: string) => {
    setPendingAllowStatusChange((prev) => prev ? { ...prev, reason } : prev);
  }, []);

  const confirmAllowStatusChange = React.useCallback(async () => {
    if (!pendingAllowStatusChange) return;

    const reason = pendingAllowStatusChange.reason.trim();
    if (pendingAllowStatusChange.allowStatus === "REJECTED" && !reason) {
      showAlert({ variant: "error", title: "검수반려 사유 확인", message: "검수반려 사유를 입력해주세요." });
      return;
    }

    const succeeded = await updateAllowStatus(pendingAllowStatusChange.allowStatus, reason);
    if (succeeded) {
      setPendingAllowStatusChange(null);
    }
  }, [pendingAllowStatusChange, showAlert, updateAllowStatus]);

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
        showAlert({ variant: "error", title: "관리자 메모 저장 실패", message: response.error.message || "관리자 메모를 저장하지 못했습니다." });
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
        <Button type="button" variant="outline" size="sm" onClick={() => router.push(getReturnToPath(detail?.id))}>
          취소
        </Button>
        <Can permission="beaulab.hospital_event.update">
          <Button type="button" variant="brand" size="sm" onClick={() => router.push(editPath)}>
            수정하기
          </Button>
        </Can>
      </div>
    );
  }, [detail?.id, editPath, eventId, getReturnToPath, router]);

  usePageHeaderExtra(isLoading || loadError ? null : headerActions);

  if (isLoading) {
    return <SpinnerBlock className="min-h-[60vh]" spinnerClassName="size-10" label="이벤트 정보를 불러오는 중" />;
  }

  if (loadError || !detail) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>이벤트 정보를 불러오지 못했습니다.</CardTitle>
          <CardDescription>{loadError ?? "이벤트 정보를 찾을 수 없습니다."}</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2 pt-0">
          <Button type="button" variant="brand" onClick={() => void fetchEvent()}>
            다시 불러오기
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push(getReturnToPath())}>
            취소
          </Button>
        </CardContent>
      </Card>
    );
  }

  const pendingVisibilityLabel = pendingVisibilityChange?.status === "ACTIVE" ? "노출" : "미노출";
  const pendingAllowStatusLabel = pendingAllowStatusChange
    ? labelHospitalEventAllowStatus(pendingAllowStatusChange.allowStatus)
    : "";

  return (
    <div className="min-w-0 space-y-4">
      <section className="grid min-w-0 grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(420px,1fr)_minmax(360px,0.85fr)_minmax(280px,0.55fr)]">
        <EventMainCard
          detail={detail}
          updating={updatingStatus}
          onVisibilityChange={requestVisibilityStatus}
        />

        <div className="min-w-0 space-y-4">
          <EventInfoSummaryCard detail={detail} />
          <AllowStatusCard detail={detail} updating={updatingStatus} onChange={requestAllowStatus} />
          <AdminNotesCard
            notes={notes}
            loading={notesLoading}
            onAdd={() => setIsNoteModalOpen(true)}
          />
          <OperationHistoryCard
            histories={histories}
            meta={historyMeta}
            loading={historiesLoading}
            onPageChange={setHistoryPage}
          />
        </div>

        <EventMediaColumn detail={detail} onPreview={setPreviewMedia} />
      </section>

      <HospitalMediaPreviewModal preview={previewMedia} onChange={setPreviewMedia} onClose={() => setPreviewMedia(null)} />
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
            <p className="text-sm font-medium text-gray-800">
              해당 이벤트를 {pendingVisibilityLabel} 하시겠습니까?
            </p>
            {pendingVisibilityChange?.status === "INACTIVE" ? (
              <div className="mt-4">
                <label htmlFor="hospital-event-hidden-reason" className="mb-1.5 block text-sm font-medium text-gray-700">
                  미노출 사유
                </label>
                <InputField
                  id="hospital-event-hidden-reason"
                  name="hidden_reason"
                  value={pendingVisibilityChange.reason}
                  onChange={(event) => updatePendingVisibilityReason(event.target.value)}
                  disabled={updatingStatus}
                  placeholder="미노출 사유를 입력해주세요."
                />
              </div>
            ) : null}
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="outline" onClick={closeVisibilityConfirmModal} disabled={updatingStatus}>
              취소
            </Button>
            <Button type="button" variant="brand" onClick={() => void confirmVisibilityChange()} disabled={updatingStatus}>
              {updatingStatus ? "처리 중..." : "확인"}
            </Button>
          </ModalFooter>
        </ModalPanel>
      </Modal>
      <Modal
        isOpen={Boolean(pendingAllowStatusChange)}
        onClose={closeAllowStatusConfirmModal}
        showCloseButton={false}
        className="mx-4 w-full max-w-md"
      >
        <ModalPanel>
          <ModalHeader className="pr-0">
            <ModalTitle>검수상태 변경</ModalTitle>
          </ModalHeader>
          <ModalBody className="mt-5">
            <p className="text-sm font-medium text-gray-800">
              해당 이벤트를 {pendingAllowStatusLabel} 처리하시겠습니까?
            </p>
            {pendingAllowStatusChange?.allowStatus === "REJECTED" ? (
              <div className="mt-4">
                <label htmlFor="hospital-event-rejected-reason" className="mb-1.5 block text-sm font-medium text-gray-700">
                  검수반려 사유
                </label>
                <InputField
                  id="hospital-event-rejected-reason"
                  name="rejected_reason"
                  value={pendingAllowStatusChange.reason}
                  onChange={(event) => updatePendingAllowStatusReason(event.target.value)}
                  disabled={updatingStatus}
                  placeholder="검수반려 사유를 입력해주세요."
                />
              </div>
            ) : null}
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="outline" onClick={closeAllowStatusConfirmModal} disabled={updatingStatus}>
              취소
            </Button>
            <Button type="button" variant="brand" onClick={() => void confirmAllowStatusChange()} disabled={updatingStatus}>
              {updatingStatus ? "처리 중..." : "확인"}
            </Button>
          </ModalFooter>
        </ModalPanel>
      </Modal>
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

function EventMainCard({
  detail,
  updating,
  onVisibilityChange,
}: {
  detail: HospitalEventApiItem;
  updating: boolean;
  onVisibilityChange: (status: "ACTIVE" | "INACTIVE") => void;
}) {
  const categoryBadges = eventCategoryBadges(detail.categories);
  const primaryCategory = detail.categories?.find((category) => category.is_primary) ?? detail.categories?.[0] ?? null;
  const eventTypeLabel = inferEventSectionLabel(detail.categories);

  return (
    <Card className={cardClassName}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="truncate text-sm font-bold text-gray-900">{eventTypeLabel} 이벤트</h2>
          {detail.allow_status === "PARTNER_CANCELED" ? (
            <StatusBadge size="sm" color="error">
              {labelHospitalEventAllowStatus(detail.allow_status)}
            </StatusBadge>
          ) : null}
        </div>
        <VisibilityActionButtons
          status={detail.status}
          disabled={updating}
          mode="action"
          className="shrink-0"
          onChange={onVisibilityChange}
        />
      </div>

      <div className="space-y-4">
        <ReadonlyField label="병의원" value={detail.hospital?.name} />
        <ReadonlyField
          label="대표 카테고리"
          value={primaryCategory ? categoryFullPath(primaryCategory) : "-"}
          customValue={<CategoryBadgeList values={primaryCategory ? [categoryFullPath(primaryCategory)] : ["-"]} />}
        />
        <ReadonlyField
          label="선택한 소카테고리"
          value="-"
          customValue={<CategoryBadgeList values={categoryBadges.map((category) => category.label)} />}
        />
        <ReadonlyField
          label="의료진 선택"
          value="-"
          customValue={<DoctorBadgeList detail={detail} />}
        />
        <ReadonlyField label="이벤트명" value={detail.name} />
        <ReadonlyField label="이벤트설명" value={detail.description} />
        <ReadonlyField label="이벤트기간" value={eventPeriodLabel(detail)} />
        <PriceSummaryCard detail={detail} />
      </div>
    </Card>
  );
}

function EventInfoSummaryCard({ detail }: { detail: HospitalEventApiItem }) {
  return (
    <Card className={cardClassName}>
      <h3 className="mb-4 border-b border-gray-200 pb-3 text-sm font-bold text-gray-900">이벤트 정보</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <ReadonlyMini label="등록일자" value={formatDate(detail.created_at)} />
        <ReadonlyMini label="최근수정일" value={formatDate(detail.updated_at)} />
      </div>
    </Card>
  );
}

function AllowStatusCard({
  detail,
  updating,
  onChange,
}: {
  detail: HospitalEventApiItem;
  updating: boolean;
  onChange: (status: string) => void;
}) {
  return (
    <Card className={cardClassName}>
      <div className="border-b border-gray-200 pb-3">
        <h3 className="text-sm font-bold text-gray-900">검수상태</h3>
      </div>
      <div className="mt-4">
        <AllowStatusButtons detail={detail} updating={updating} onChange={onChange} />
      </div>
    </Card>
  );
}

function AllowStatusButtons({
  detail,
  updating,
  onChange,
  compact = false,
}: {
  detail: HospitalEventApiItem;
  updating: boolean;
  onChange: (status: string) => void;
  compact?: boolean;
}) {
  const statuses = [
    ["PENDING", "검수신청중"],
    ["REVIEWING", "검토중"],
    ["REJECTED", "검수반려"],
    ["APPROVED", "검수완료"],
  ] as const;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {statuses.map(([value, label]) => {
        const active = detail.allow_status === value;
        const approved = value === "APPROVED";

        return (
          <Button
            key={value}
            type="button"
            variant={active ? "brand" : "outline"}
            disabled={updating}
            onClick={() => onChange(value)}
            className={[
              "text-sm font-semibold",
              compact
                ? approved ? "h-10 min-w-24 px-4" : "h-9 min-w-20 px-3"
                : approved ? "h-11 min-w-28 px-6" : "h-9 min-w-20 px-4",
            ].join(" ")}
          >
            {label}
          </Button>
        );
      })}
    </div>
  );
}

function AdminNotesCard({
  notes,
  loading,
  onAdd,
}: {
  notes: AdminNoteItem[];
  loading: boolean;
  onAdd: () => void;
}) {
  return (
    <Card className={cardClassName}>
      <div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-3">
        <h3 className="text-sm font-bold text-gray-900">관리자 메모</h3>
        <AddCircleButton label="관리자 메모 추가" onClick={onAdd} />
      </div>
      {loading ? (
        <p className="text-sm text-gray-500">메모를 불러오는 중입니다.</p>
      ) : notes.length > 0 ? (
        <div className="max-h-44 space-y-3 overflow-y-auto pr-1">
          {notes.map((note) => (
            <div key={note.id} className="grid grid-cols-[6.5rem_5rem_minmax(0,1fr)] gap-3 text-xs text-gray-600">
              <span>{formatDateTime(note.created_at)}</span>
              <span>{note.creator_name || "-"}</span>
              <span className="break-words">{note.note || "-"}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">등록된 관리자 메모가 없습니다.</p>
      )}
    </Card>
  );
}

function OperationHistoryCard({
  histories,
  meta,
  loading,
  onPageChange,
}: {
  histories: OperationHistoryItem[];
  meta: DataTableMeta | null;
  loading: boolean;
  onPageChange: (page: number) => void;
}) {
  const [expandedHistoryIds, setExpandedHistoryIds] = React.useState<Set<number>>(() => new Set());

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
      <h3 className="mb-4 border-b border-gray-200 pb-3 text-sm font-bold text-gray-900">히스토리</h3>
      {loading ? (
        <p className="text-sm text-gray-500">히스토리를 불러오는 중입니다.</p>
      ) : histories.length > 0 ? (
        <div className="space-y-3">
          <div className="max-h-56 space-y-3 overflow-y-auto pr-1">
            {histories.map((history) => {
              const changes = history.changes ?? [];
              const canExpand = history.action === "UPDATED" && changes.length > 0;
              const isExpanded = expandedHistoryIds.has(history.id);

              return (
                <div key={history.id} className="space-y-2 border-b border-gray-100 pb-3 last:border-b-0 last:pb-0">
                  <div className="grid grid-cols-[6.5rem_5rem_5rem_minmax(0,1fr)_2rem] items-start gap-3 text-xs text-gray-600">
                    <span>{formatDateTime(history.created_at)}</span>
                    <span>{history.actor_label || "-"}</span>
                    <span>{historyValueLabel(history)}</span>
                    <span className="break-words">{historyReasonLabel(history)}</span>
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
                          <span className="text-sm leading-none">−</span>
                        </Button>
                      ) : (
                        <AddCircleButton label="변경 상세 열기" className="ml-auto" onClick={() => toggleExpandedHistory(history.id)} />
                      )
                    ) : (
                      <span aria-hidden="true" />
                    )}
                  </div>
                  {canExpand && isExpanded ? (
                    <div className="space-y-2 rounded-lg bg-gray-50 p-3">
                      {changes.map((change, index) => (
                        <div key={`${history.id}-${change.field_key ?? index}`} className="space-y-1 text-xs text-gray-600">
                          <p className="font-semibold text-gray-900">{change.field_label || change.field_key || "변경 항목"}</p>
                          <div className="grid grid-cols-[4rem_minmax(0,1fr)] gap-2">
                            <span className="font-semibold text-gray-500">변경 전</span>
                            <span className="whitespace-pre-line break-words">{historyChangeDisplay(change, "before")}</span>
                          </div>
                          <div className="grid grid-cols-[4rem_minmax(0,1fr)] gap-2">
                            <span className="font-semibold text-brand-600">변경 후</span>
                            <span className="whitespace-pre-line break-words">{historyChangeDisplay(change, "after")}</span>
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
              <Pagination currentPage={meta.current_page} totalPages={Math.max(1, meta.last_page)} onPageChange={onPageChange} />
            </div>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-gray-500">등록된 히스토리가 없습니다.</p>
      )}
    </Card>
  );
}

function EventMediaColumn({
  detail,
  onPreview,
}: {
  detail: HospitalEventApiItem;
  onPreview: (preview: HospitalMediaPreviewState) => void;
}) {
  return (
    <div className="min-w-0 space-y-4">
      <MediaPreviewCard title="썸네일" helper="800px x 800px 이상, 1:1비율, 2MB 이하" media={detail.thumbnail_image ?? null} onPreview={onPreview} />
      {detail.event_type === "IMAGE" ? (
        <MediaPreviewCard title="이벤트 페이지" helper="가로 800px 이상, 5MB 이하" media={detail.event_page_image ?? null} onPreview={onPreview} tall />
      ) : null}
    </div>
  );
}

function MediaPreviewCard({
  title,
  helper,
  media,
  onPreview,
  tall = false,
}: {
  title: string;
  helper: string;
  media: HospitalEventMedia | null;
  onPreview: (preview: HospitalMediaPreviewState) => void;
  tall?: boolean;
}) {
  const mediaUrl = resolveHospitalEventMediaUrl(media, "original");

  return (
    <Card className={cardClassName}>
      <h3 className="text-sm font-bold text-gray-900">{title}</h3>
      <p className="mt-1 text-xs text-gray-500">{helper}</p>
      <button
        type="button"
        disabled={!mediaUrl}
        onClick={() => mediaUrl && onPreview({ url: mediaUrl, title, isImage: true })}
        className={[
          "mt-3 flex w-full items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50",
          tall ? "min-h-[20rem]" : "aspect-square",
          mediaUrl ? "cursor-pointer" : "cursor-default",
        ].join(" ")}
      >
        {mediaUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- runtime storage URL
          <img src={mediaUrl} alt={title} className={tall ? "h-auto max-h-[32rem] w-full object-contain" : "h-full w-full object-cover"} />
        ) : (
          <span className="p-6 text-center text-sm text-gray-400">등록된 이미지가 없습니다.</span>
        )}
      </button>
    </Card>
  );
}

function PriceSummaryCard({ detail }: { detail: HospitalEventApiItem }) {
  const discountRate = Number(detail.discount_rate ?? 0);

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-4">
      <div className="space-y-3">
        <ReadonlyField label="VAT" value={detail.is_vat_included ? "VAT 포함" : "VAT 비대상"} compact />
        <ReadonlyField label="정상 가격" value={formatHospitalEventPrice(Number(detail.normal_price ?? 0))} compact />
        <div className="grid grid-cols-[7rem_minmax(0,1fr)] items-start gap-3">
          <p className={labelClassName}>이벤트 가격</p>
          <div className="min-w-0 text-sm leading-6 text-gray-800">
            <span className="font-semibold">{formatHospitalEventPrice(Number(detail.event_price ?? 0))}</span>
            <span className="ml-2 font-bold text-brand-500">할인율 {discountRate}%</span>
          </div>
        </div>
        <ReadonlyField label="상담신청단가" value={formatHospitalEventPoint(Number(detail.consultation_price ?? 0))} compact />
      </div>
    </div>
  );
}

function NoteCreateModal({
  isOpen,
  value,
  saving,
  onChange,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  value: string;
  saving: boolean;
  onChange: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton={false} className="mx-4 w-full max-w-lg">
      <ModalPanel>
        <ModalHeader className="pr-0">
          <ModalTitle>관리자 메모 등록</ModalTitle>
        </ModalHeader>
        <ModalBody className="mt-5">
          <FormTextArea value={value} onChange={(next) => onChange(next.slice(0, 1000))} rows={5} placeholder="관리자 메모를 입력해 주세요." />
        </ModalBody>
        <ModalFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            취소
          </Button>
          <Button type="button" variant="brand" onClick={onSave} disabled={saving || !value.trim()}>
            등록
          </Button>
        </ModalFooter>
      </ModalPanel>
    </Modal>
  );
}

function ReadonlyField({
  label,
  value,
  customValue,
  compact = false,
}: {
  label: string;
  value?: string | number | null;
  customValue?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "grid grid-cols-[7rem_minmax(0,1fr)] items-start gap-3" : "grid grid-cols-[8rem_minmax(0,1fr)] items-start gap-4"}>
      <p className={labelClassName}>{label}</p>
      <div className={valueClassName}>{customValue ?? displayValue(value)}</div>
    </div>
  );
}

function ReadonlyMini({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="grid grid-cols-[7rem_minmax(0,1fr)] items-start gap-3">
      <p className={labelClassName}>{label}</p>
      <p className={valueClassName}>{displayValue(value)}</p>
    </div>
  );
}

function displayValue(value?: string | number | null) {
  if (typeof value === "number") return value.toLocaleString();
  return value?.trim() || "-";
}

function eventCategoryBadges(categories?: HospitalEventCategory[] | null) {
  return (categories ?? []).map((category) => ({
    label: category.name?.trim() || categoryFullPath(category),
    isPrimary: Boolean(category.is_primary),
  }));
}

function categoryFullPath(category: HospitalEventCategory) {
  return category.full_path?.trim() || category.name?.trim() || "-";
}

function inferEventSectionLabel(categories?: HospitalEventCategory[] | null) {
  const usage = categories?.find((category) => category.usage)?.usage;
  return usage === "HOSPITAL_EVENT_TREATMENT" ? "쁘띠/시술" : "성형";
}

function DoctorBadgeList({ detail }: { detail: HospitalEventApiItem }) {
  const doctors = detail.doctors ?? [];
  if (doctors.length === 0) {
    return <span>-</span>;
  }

  return (
    <div className="space-y-2">
      {doctors.map((doctor, index) => {
        const name = doctor.name?.trim() || `의료진 ${index + 1}`;

        return (
          <div key={`${doctor.id ?? name}-${index}`} className="flex w-full min-w-0">
            <div className="inline-flex w-fit max-w-full min-w-0 items-center gap-2 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-700">
              <span className="min-w-0 truncate font-semibold text-gray-800">{name}</span>
              <div className="flex shrink-0 items-center gap-1.5">
                {doctor.is_career_visible ? (
                  <span className="rounded-full bg-brand-50 px-1.5 py-0.5 font-semibold text-brand-600">경력사항</span>
                ) : null}
                {doctor.is_activity_visible ? (
                  <span className="rounded-full bg-brand-50 px-1.5 py-0.5 font-semibold text-brand-600">활동사항</span>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function eventPeriodLabel(detail: HospitalEventApiItem) {
  const start = formatDate(detail.event_start_at);
  if (detail.is_event_period_unlimited) return `${start} ~ 무기한`;

  return `${start} ~ ${formatDate(detail.event_end_at)}`;
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);

  const year = String(date.getFullYear()).slice(2);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const year = String(date.getFullYear()).slice(2);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${year}.${month}.${day} ${hour}:${minute}`;
}

function historyChangeDisplay(change: OperationHistoryChangeItem, side: "before" | "after") {
  const display = side === "after" ? change.after_display : change.before_display;
  const value = side === "after" ? change.after_value : change.before_value;
  const field = change.field_key ?? null;

  if (typeof display === "string" && display.trim() !== "") {
    return historyRawValueLabel(field, display);
  }

  return historyRawValueLabel(field, value);
}

function historyRawValueLabel(field: string | null, value: unknown) {
  if (field === "status") {
    return value === "ACTIVE" ? "노출" : value === "INACTIVE" ? "미노출" : stringifyHistoryValue(value);
  }

  if (field === "allow_status") {
    const label = labelHospitalEventAllowStatus(String(value ?? ""));
    return label === "-" ? stringifyHistoryValue(value) : label;
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

function historyReasonLabel(history: OperationHistoryItem) {
  const reason = history.reason?.trim();
  if (reason) {
    return reason;
  }

  if (history.action !== "UPDATED") {
    return "-";
  }

  const labels = (history.changes ?? [])
    .map((change) => (change.field_label || change.field_key || "").trim())
    .filter(Boolean);

  if (labels.length === 0) {
    return "수정";
  }

  const uniqueLabels = Array.from(new Set(labels));

  return `${uniqueLabels.join(", ")} 수정`;
}

function historyValueLabel(history: OperationHistoryItem) {
  const firstChange = history.changes?.[0] ?? null;
  const field = firstChange?.field_key ?? history.field ?? null;

  if (history.action === "UPDATED") {
    return "수정";
  }

  if (field === "status") {
    return firstChange ? historyChangeDisplay(firstChange, "after") : historyRawValueLabel(field, history.after_value);
  }

  if (field === "allow_status") {
    return firstChange ? historyChangeDisplay(firstChange, "after") : historyRawValueLabel(field, history.after_value);
  }

  return firstChange?.field_label || history.field || history.action || "-";
}
