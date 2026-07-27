"use client";

import React from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { isApiSuccess } from "@beaulab/types";
import { Button, Card, SpinnerBlock, StatusBadge, useGlobalAlert, type DataTableMeta } from "@beaulab/ui-admin";

import { AdminNoteCreateModal } from "@/components/common/AdminNoteCreateModal";
import { AdminNotesCard } from "@/components/common/AdminNotesCard";
import { AllowStatusActionButtons, AllowStatusConfirmModal } from "@/components/common/AllowStatusControls";
import { Can } from "@/components/common/guard";
import { LoadErrorState } from "@/components/common/LoadErrorState";
import { OperationHistoryCard, type OperationHistoryListItem } from "@/components/common/OperationHistoryCard";
import type { OperationHistoryChangeLike } from "@/components/common/OperationHistoryDisplay";
import { MediaPreviewModal, type MediaPreviewState } from "@/components/common/MediaPreviewModal";
import { api } from "@/lib/common/api";
import { usePageHeaderExtra } from "@/lib/common/routing/page-header-extra";
import {
  eventAdAllowStatusColor,
  eventAdStatusColor,
  formatEventAdCost,
  formatEventAdDateTime,
  labelEventAdAllowStatus,
  labelEventAdPlacement,
  labelEventAdStatus,
  resolveEventAdMediaUrl,
  type EventAdApiItem,
  type EventAdMediaAsset,
} from "@/lib/hospital-event-ad/list";

type AdminNoteItem = {
  id: number;
  note?: string | null;
  creator_name?: string | null;
  created_at?: string | null;
};

type PendingAllowStatusChange = {
  allowStatus: string;
  reason: string;
};

const EVENT_AD_ADMIN_NOTE_TARGET = "hospital_event_ad";
const HISTORY_PER_PAGE = 10;
const cardClassName = "rounded-xl border border-gray-200 bg-white p-5";
const labelClassName = "text-xs font-semibold text-gray-500";
const valueClassName = "min-w-0 break-words text-sm leading-6 text-gray-800";

export default function EventAdDetailPageClient() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showAlert } = useGlobalAlert();

  const rawAdId = Array.isArray(params.id) ? params.id[0] : params.id;
  const adId = Number(rawAdId);
  const returnTo = searchParams.get("returnTo");

  const [detail, setDetail] = React.useState<EventAdApiItem | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [previewMedia, setPreviewMedia] = React.useState<MediaPreviewState | null>(null);
  const [notes, setNotes] = React.useState<AdminNoteItem[]>([]);
  const [notesLoading, setNotesLoading] = React.useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = React.useState(false);
  const [noteInput, setNoteInput] = React.useState("");
  const [savingNote, setSavingNote] = React.useState(false);
  const [histories, setHistories] = React.useState<OperationHistoryListItem[]>([]);
  const [historyMeta, setHistoryMeta] = React.useState<DataTableMeta | null>(null);
  const [historyPage, setHistoryPage] = React.useState(1);
  const [historiesLoading, setHistoriesLoading] = React.useState(false);
  const [updatingAllowStatus, setUpdatingAllowStatus] = React.useState(false);
  const [pendingAllowStatusChange, setPendingAllowStatusChange] = React.useState<PendingAllowStatusChange | null>(null);
  const [pendingAllowStatusError, setPendingAllowStatusError] = React.useState<string | null>(null);

  const editPath = React.useMemo(() => {
    if (!Number.isFinite(adId) || adId <= 0) return "/ads-manage/event-ads";
    return returnTo
      ? `/ads-manage/event-ads/${adId}/edit?returnTo=${encodeURIComponent(returnTo)}`
      : `/ads-manage/event-ads/${adId}/edit`;
  }, [adId, returnTo]);

  const fetchDetail = React.useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = Boolean(options?.silent);

      if (!Number.isFinite(adId) || adId <= 0) {
        if (!silent) {
          setLoadError("잘못된 광고 경로입니다.");
          setIsLoading(false);
        }
        return;
      }

      if (!silent) {
        setIsLoading(true);
        setLoadError(null);
      }

      try {
        const response = await api.get<EventAdApiItem>(`/hospital-event-ads/${adId}`);

        if (!isApiSuccess(response)) {
          if (!silent) {
            setLoadError(response.error.message || "광고 정보를 불러오지 못했습니다.");
          }
          return;
        }

        setDetail(response.data);
      } catch {
        if (!silent) {
          setLoadError("광고 정보를 불러오는 중 오류가 발생했습니다.");
        }
      } finally {
        if (!silent) {
          setIsLoading(false);
        }
      }
    },
    [adId],
  );

  const fetchNotes = React.useCallback(async () => {
    if (!Number.isFinite(adId) || adId <= 0) return;

    setNotesLoading(true);

    try {
      const response = await api.get<AdminNoteItem[]>("/notes", {
        target_type: EVENT_AD_ADMIN_NOTE_TARGET,
        target_id: adId,
      });

      if (isApiSuccess(response)) {
        setNotes(response.data);
      }
    } finally {
      setNotesLoading(false);
    }
  }, [adId]);

  const fetchHistories = React.useCallback(async () => {
    if (!Number.isFinite(adId) || adId <= 0) return;

    setHistoriesLoading(true);

    try {
      const response = await api.get<OperationHistoryListItem[]>(`/hospital-event-ads/${adId}/operation-histories`, {
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
  }, [adId, historyPage]);

  React.useEffect(() => {
    void fetchDetail();
  }, [fetchDetail]);

  React.useEffect(() => {
    void fetchNotes();
  }, [fetchNotes]);

  React.useEffect(() => {
    void fetchHistories();
  }, [fetchHistories]);

  const requestAllowStatus = React.useCallback(
    (allowStatus: string) => {
      if (!detail || updatingAllowStatus || detail.allow_status === allowStatus) return;

      setPendingAllowStatusChange({ allowStatus, reason: "" });
      setPendingAllowStatusError(null);
    },
    [detail, updatingAllowStatus],
  );

  const updatePendingAllowStatusReason = React.useCallback((reason: string) => {
    setPendingAllowStatusChange((prev) => (prev ? { ...prev, reason } : prev));
    setPendingAllowStatusError(null);
  }, []);

  const closeAllowStatusConfirmModal = React.useCallback(() => {
    if (updatingAllowStatus) return;

    setPendingAllowStatusChange(null);
    setPendingAllowStatusError(null);
  }, [updatingAllowStatus]);

  const confirmAllowStatusChange = React.useCallback(async () => {
    if (!detail || !pendingAllowStatusChange || updatingAllowStatus) return;

    const reason = pendingAllowStatusChange.reason.trim();
    if (pendingAllowStatusChange.allowStatus === "REJECTED" && !reason) {
      setPendingAllowStatusError("반려 사유를 입력해주세요.");
      return;
    }

    setUpdatingAllowStatus(true);

    try {
      const response = await api.patch<{ updated_count?: number }>("/hospital-event-ads/allow-status", {
        ids: [detail.id],
        allow_status: pendingAllowStatusChange.allowStatus,
        ...(reason ? { reason } : {}),
      });

      if (!isApiSuccess(response)) {
        showAlert({
          variant: "error",
          title: "검수상태 변경 실패",
          message: response.error.message || "검수상태를 변경하지 못했습니다.",
        });
        return;
      }

      setPendingAllowStatusChange(null);
      setPendingAllowStatusError(null);
      await Promise.all([fetchDetail({ silent: true }), fetchHistories()]);
    } finally {
      setUpdatingAllowStatus(false);
    }
  }, [detail, fetchDetail, fetchHistories, pendingAllowStatusChange, showAlert, updatingAllowStatus]);

  const saveNote = React.useCallback(async () => {
    const note = noteInput.trim();
    if (!note || savingNote) return;

    setSavingNote(true);

    try {
      const response = await api.post<AdminNoteItem>("/notes", {
        target_type: EVENT_AD_ADMIN_NOTE_TARGET,
        target_id: adId,
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
  }, [adId, fetchNotes, noteInput, savingNote, showAlert]);

  const headerAction = React.useMemo(
    () => (
      <Can permission="beaulab.hospital_event_ad.update">
        <Button type="button" variant="brand" size="sm" onClick={() => router.push(editPath)}>
          수정하기
        </Button>
      </Can>
    ),
    [editPath, router],
  );

  usePageHeaderExtra(isLoading || loadError ? null : headerAction);

  if (isLoading) {
    return <SpinnerBlock className="min-h-[60vh]" spinnerClassName="size-10" label="광고 정보를 불러오는 중" />;
  }

  if (loadError || !detail) {
    return (
      <LoadErrorState
        title="광고 정보를 불러오지 못했습니다."
        message={loadError ?? "광고 정보를 찾을 수 없습니다."}
        onRetry={() => void fetchDetail()}
      />
    );
  }

  return (
    <div className="min-w-0">
      <section className="grid min-w-0 grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_36rem]">
        <div className="min-w-0 space-y-4">
          <EventAdMainCard
            detail={detail}
            updating={updatingAllowStatus}
            onAllowStatusChange={requestAllowStatus}
            onPreview={setPreviewMedia}
          />
        </div>

        <aside className="min-w-0 space-y-4">
          <AdminNotesCard
            notes={notes}
            loading={notesLoading}
            onAdd={() => setIsNoteModalOpen(true)}
            formatDateTime={formatShortDateTime}
            className={cardClassName}
          />
          <OperationHistoryCard
            histories={histories}
            meta={historyMeta}
            loading={historiesLoading}
            onPageChange={setHistoryPage}
            cardClassName={cardClassName}
            formatDateTime={formatShortDateTime}
            allowStatusLabel={labelEventAdAllowStatus}
            changeValueDisplay={historyChangeDisplay}
          />
        </aside>
      </section>

      <MediaPreviewModal preview={previewMedia} onChange={setPreviewMedia} onClose={() => setPreviewMedia(null)} />
      <AllowStatusConfirmModal
        pending={pendingAllowStatusChange}
        subjectLabel="해당 광고를"
        labelStatus={labelEventAdAllowStatus}
        updating={updatingAllowStatus}
        error={pendingAllowStatusError}
        reasonInputId="hospital-event-ad-rejected-reason"
        onReasonChange={updatePendingAllowStatusReason}
        onClose={closeAllowStatusConfirmModal}
        onConfirm={() => void confirmAllowStatusChange()}
      />
      <AdminNoteCreateModal
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

function EventAdMainCard({
  detail,
  updating,
  onAllowStatusChange,
  onPreview,
}: {
  detail: EventAdApiItem;
  updating: boolean;
  onAllowStatusChange: (status: string) => void;
  onPreview: (preview: MediaPreviewState) => void;
}) {
  return (
    <Card className={cardClassName}>
      <div className="grid min-w-0 gap-10 xl:grid-cols-[22rem_minmax(0,1fr)]">
        <EventAdImageCard media={detail.ad_image ?? null} onPreview={onPreview} />

        <div className="min-w-0 space-y-5">
          <h2 className="text-sm font-bold text-gray-900">상품정보</h2>
          <div className="space-y-4">
            <ReadonlyField label="광고위치" value={detail.placement_label || labelEventAdPlacement(detail.placement)} />
            {formatCategory(detail) !== "-" ? <ReadonlyField label="카테고리" value={formatCategory(detail)} /> : null}
            <ReadonlyField label="광고기간" value={formatPeriod(detail)} />
            <ReadonlyField label="비용" value={formatEventAdCost(Number(detail.cost ?? 0))} />
            <ReadonlyField
              label="병의원"
              value={detail.hospital?.name}
              customValue={
                detail.hospital?.id ? (
                  <DetailLink href={`/hospital-manage/hospitals/${detail.hospital.id}`}>
                    {detail.hospital.name?.trim() || "-"}
                  </DetailLink>
                ) : undefined
              }
            />
            <ReadonlyField
              label="이벤트"
              value={detail.hospital_event?.name}
              customValue={
                detail.hospital_event?.id ? (
                  <DetailLink href={`/ads-manage/events/${detail.hospital_event.id}`}>
                    {detail.hospital_event.name?.trim() || "-"}
                  </DetailLink>
                ) : undefined
              }
            />
            <ReadonlyField label="담당자" value={detail.manager_staff?.name} />
            <ReadonlyField
              label="광고상태"
              customValue={
                detail.ad_status ? (
                  <StatusBadge size="sm" color={eventAdStatusColor(detail.ad_status)}>
                    {detail.ad_status_label || labelEventAdStatus(detail.ad_status)}
                  </StatusBadge>
                ) : (
                  <span>-</span>
                )
              }
            />
            <ReadonlyField
              label="검수상태"
              customValue={
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <Can permission="beaulab.hospital_event_ad.update">
                    <AllowStatusActionButtons
                      currentStatus={detail.allow_status}
                      disabled={updating}
                      onChange={onAllowStatusChange}
                    />
                  </Can>
                </div>
              }
            />
          </div>
        </div>
      </div>
    </Card>
  );
}

function EventAdImageCard({
  media,
  onPreview,
}: {
  media: EventAdMediaAsset | null;
  onPreview: (preview: MediaPreviewState) => void;
}) {
  const mediaUrl = resolveEventAdMediaUrl(media, "original");

  return (
    <div className="min-w-0">
      <h3 className="text-sm font-bold text-gray-900">미리보기</h3>
      <div className="mt-4 w-full rounded-[1.75rem] border border-gray-200 bg-white p-2 shadow-sm">
        <div className="mb-3 flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-brand-400" />
          <span className="h-2 w-10 rounded-full bg-gray-200" />
        </div>
        <button
          type="button"
          disabled={!mediaUrl}
          onClick={() => mediaUrl && onPreview({ url: mediaUrl, title: "광고이미지", isImage: true })}
          className={[
            "flex w-full items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-100",
            "aspect-[4/3]",
            mediaUrl ? "cursor-pointer" : "cursor-default",
          ].join(" ")}
        >
          {mediaUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- runtime storage URL
            <img src={mediaUrl} alt="광고이미지" className="h-full w-full object-cover" />
          ) : (
            <span className="px-6 text-center text-xs font-semibold text-gray-400">등록된 이미지가 없습니다.</span>
          )}
        </button>
      </div>
    </div>
  );
}

function DetailLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline text-gray-800 underline decoration-gray-300 underline-offset-4 transition hover:text-brand-500 hover:decoration-brand-500"
    >
      {children}
    </Link>
  );
}

function ReadonlyField({
  label,
  value,
  customValue,
}: {
  label: string;
  value?: string | number | null;
  customValue?: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[7rem_minmax(0,1fr)] items-start gap-3">
      <p className={labelClassName}>{label}</p>
      <div className={valueClassName}>{customValue ?? displayValue(value)}</div>
    </div>
  );
}

function displayValue(value?: string | number | null) {
  if (typeof value === "number") return value.toLocaleString();
  return value?.trim() || "-";
}

function formatCategory(detail: EventAdApiItem) {
  const category = detail.category ?? detail.categories?.[0] ?? null;
  return category?.full_path?.trim() || category?.name?.trim() || "-";
}

function formatPeriod(detail: EventAdApiItem) {
  const start = formatEventAdDateTime(detail.start_at);
  const end = formatEventAdDateTime(detail.end_at);

  if (start === "-" && end === "-") return "-";

  return `${start} ~ ${end}`;
}

function formatShortDateTime(value?: string | null) {
  const formatted = formatEventAdDateTime(value);

  return formatted.length === 16 ? formatted.slice(2).replace(/-/g, ".") : formatted;
}

function historyChangeDisplay(change: OperationHistoryChangeLike, side: "before" | "after") {
  const display = side === "after" ? change.after_display : change.before_display;
  const value = side === "after" ? change.after_value : change.before_value;
  const field = change.field_key ?? null;

  if (field === "allow_status") {
    const rawValue = String(value ?? "").trim();

    return (
      <StatusBadge size="sm" color={eventAdAllowStatusColor(rawValue)} className="h-5 px-2 text-xs leading-none">
        {display?.trim() || labelEventAdAllowStatus(rawValue)}
      </StatusBadge>
    );
  }

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
