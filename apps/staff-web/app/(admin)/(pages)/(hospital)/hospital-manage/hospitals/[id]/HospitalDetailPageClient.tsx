"use client";

import React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { isApiSuccess } from "@beaulab/types";

import { AdminNoteCreateModal } from "@/components/common/AdminNoteCreateModal";
import { AdminNotesCard } from "@/components/common/AdminNotesCard";
import { AllowStatusConfirmModal } from "@/components/common/AllowStatusControls";
import { Can } from "@/components/common/guard";
import { LoadErrorState } from "@/components/common/LoadErrorState";
import { MediaPreviewModal, type MediaPreviewState } from "@/components/common/MediaPreviewModal";
import {
  AdReceptionCard,
  AllowStatusCard,
  BusinessAccountCard,
  formatHospitalDetailDateTime,
  HospitalImagesCard,
  HospitalInfoCard,
  HospitalLogoCard,
  hospitalDetailCardClassName,
  OperationHistoryCard,
  OperationInfoCard,
  PointCard,
  VerifiedAccountContactCard,
  type HospitalOperationHistoryItem,
} from "@/components/hospital/detail/HospitalDetailSections";
import { api } from "@/lib/common/api";
import { usePageHeaderExtra } from "@/lib/common/routing/page-header-extra";
import { type HospitalDetailResponse } from "@/lib/hospital/detail";
import { labelApprovalStatus, labelReviewStatus } from "@/lib/hospital/list";
import { Button, SpinnerBlock, useGlobalAlert, type DataTableMeta } from "@beaulab/ui-admin";

const HOSPITAL_ADMIN_NOTE_TARGET = "hospital";
const HISTORY_PER_PAGE = 10;

type AdminNoteItem = {
  id: number;
  note?: string | null;
  creator_name?: string | null;
  created_at?: string | null;
};

export default function HospitalDetailPageClient() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showAlert } = useGlobalAlert();

  const rawHospitalId = Array.isArray(params.id) ? params.id[0] : params.id;
  const hospitalId = Number(rawHospitalId);

  const [detail, setDetail] = React.useState<HospitalDetailResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [previewMedia, setPreviewMedia] = React.useState<MediaPreviewState | null>(null);
  const [isActionMenuOpen, setIsActionMenuOpen] = React.useState(false);
  const [isSuspendModalOpen, setIsSuspendModalOpen] = React.useState(false);
  const [isActivateModalOpen, setIsActivateModalOpen] = React.useState(false);
  const [suspendReason, setSuspendReason] = React.useState("");
  const [hospitalStatusError, setHospitalStatusError] = React.useState<string | null>(null);
  const [updatingHospitalStatus, setUpdatingHospitalStatus] = React.useState(false);
  const [updatingAllowStatus, setUpdatingAllowStatus] = React.useState(false);
  const [allowStatusError, setAllowStatusError] = React.useState<string | null>(null);
  const [notes, setNotes] = React.useState<AdminNoteItem[]>([]);
  const [notesLoading, setNotesLoading] = React.useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = React.useState(false);
  const [noteInput, setNoteInput] = React.useState("");
  const [savingNote, setSavingNote] = React.useState(false);
  const [histories, setHistories] = React.useState<HospitalOperationHistoryItem[]>([]);
  const [historyMeta, setHistoryMeta] = React.useState<DataTableMeta | null>(null);
  const [historyPage, setHistoryPage] = React.useState(1);
  const [historiesLoading, setHistoriesLoading] = React.useState(false);
  const [pendingAllowStatusChange, setPendingAllowStatusChange] = React.useState<{
    allowStatus: string;
    reason: string;
  } | null>(null);

  const editPath = React.useMemo(() => {
    const rawReturnTo = searchParams.get("returnTo");
    if (!Number.isFinite(hospitalId) || hospitalId <= 0) {
      return "/hospital-manage/hospitals";
    }

    return rawReturnTo
      ? `/hospital-manage/hospitals/${hospitalId}/edit?returnTo=${encodeURIComponent(rawReturnTo)}`
      : `/hospital-manage/hospitals/${hospitalId}/edit`;
  }, [hospitalId, searchParams]);

  const headerAction = React.useMemo(() => {
    if (!Number.isFinite(hospitalId) || hospitalId <= 0) {
      return null;
    }

    return (
      <Can permission="beaulab.hospital.update">
        <Button type="button" variant="brand" size="sm" onClick={() => router.push(editPath)}>
          수정하기
        </Button>
      </Can>
    );
  }, [editPath, hospitalId, router]);

  const openNewEventDBs = React.useCallback(() => {
    if (!Number.isFinite(hospitalId) || hospitalId <= 0) return;

    router.push(`/customer-db-manage/events?hospital_id=${hospitalId}&statuses=NEW`);
  }, [hospitalId, router]);

  const fetchHospital = React.useCallback(async () => {
    if (!Number.isFinite(hospitalId) || hospitalId <= 0) {
      setLoadError("올바르지 않은 병의원 경로입니다.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      const response = await api.get<HospitalDetailResponse>(`/hospitals/${hospitalId}`, {
        include: "business_registration,categories,features,account_hospital",
      });

      if (!isApiSuccess(response)) {
        setLoadError(response.error.message || "병의원 정보를 불러오지 못했습니다.");
        return;
      }

      setDetail(response.data);
    } catch {
      setLoadError("병의원 정보를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [hospitalId]);

  const fetchNotes = React.useCallback(async () => {
    if (!Number.isFinite(hospitalId) || hospitalId <= 0) return;

    setNotesLoading(true);

    try {
      const response = await api.get<AdminNoteItem[]>("/notes", {
        target_type: HOSPITAL_ADMIN_NOTE_TARGET,
        target_id: hospitalId,
      });

      if (isApiSuccess(response)) {
        setNotes(response.data);
      }
    } finally {
      setNotesLoading(false);
    }
  }, [hospitalId]);

  const fetchHistories = React.useCallback(async () => {
    if (!Number.isFinite(hospitalId) || hospitalId <= 0) return;

    setHistoriesLoading(true);

    try {
      const response = await api.get<HospitalOperationHistoryItem[]>(`/hospitals/${hospitalId}/operation-histories`, {
        operation_histories_page: historyPage,
        operation_histories_per_page: HISTORY_PER_PAGE,
      });

      if (isApiSuccess(response)) {
        setHistories(response.data);
        setHistoryMeta((response.meta as DataTableMeta | null) ?? null);
      }
    } catch {
      // Keep the current history list if only the refresh fails.
    } finally {
      setHistoriesLoading(false);
    }
  }, [hospitalId, historyPage]);

  const refreshHistoriesFromFirstPage = React.useCallback(async () => {
    if (historyPage !== 1) {
      setHistoryPage(1);
      return;
    }

    await fetchHistories();
  }, [fetchHistories, historyPage]);

  React.useEffect(() => {
    void fetchHospital();
  }, [fetchHospital]);

  React.useEffect(() => {
    void fetchNotes();
  }, [fetchNotes]);

  React.useEffect(() => {
    void fetchHistories();
  }, [fetchHistories]);

  const openSuspendModal = React.useCallback(() => {
    setIsActionMenuOpen(false);
    setHospitalStatusError(null);
    setSuspendReason("");
    setIsSuspendModalOpen(true);
  }, []);

  const openActivateModal = React.useCallback(() => {
    setIsActionMenuOpen(false);
    setHospitalStatusError(null);
    setSuspendReason("");
    setIsActivateModalOpen(true);
  }, []);

  const closeSuspendModal = React.useCallback(() => {
    if (updatingHospitalStatus) return;

    setIsSuspendModalOpen(false);
    setHospitalStatusError(null);
    setSuspendReason("");
  }, [updatingHospitalStatus]);

  const closeActivateModal = React.useCallback(() => {
    if (updatingHospitalStatus) return;

    setIsActivateModalOpen(false);
    setHospitalStatusError(null);
    setSuspendReason("");
  }, [updatingHospitalStatus]);

  const submitSuspend = React.useCallback(async () => {
    if (!Number.isFinite(hospitalId) || hospitalId <= 0) return;

    const reason = suspendReason.trim();

    setUpdatingHospitalStatus(true);
    setHospitalStatusError(null);

    try {
      const response = await api.patch<HospitalDetailResponse>(`/hospitals/${hospitalId}/status`, {
        status: "SUSPENDED",
        ...(reason ? { reason } : {}),
      });

      if (!isApiSuccess(response)) {
        setHospitalStatusError(response.error.message || "운영중지 등록에 실패했습니다.");
        return;
      }

      setDetail(response.data);
      setIsSuspendModalOpen(false);
      setSuspendReason("");
      await refreshHistoriesFromFirstPage();
    } catch {
      setHospitalStatusError("운영중지 등록 중 오류가 발생했습니다.");
    } finally {
      setUpdatingHospitalStatus(false);
    }
  }, [hospitalId, refreshHistoriesFromFirstPage, suspendReason]);

  const submitActivate = React.useCallback(async () => {
    if (!Number.isFinite(hospitalId) || hospitalId <= 0) return;

    setUpdatingHospitalStatus(true);
    setHospitalStatusError(null);

    try {
      const response = await api.patch<HospitalDetailResponse>(`/hospitals/${hospitalId}/status`, {
        status: "ACTIVE",
      });

      if (!isApiSuccess(response)) {
        setHospitalStatusError(response.error.message || "정상노출 처리에 실패했습니다.");
        return;
      }

      setDetail(response.data);
      setIsActivateModalOpen(false);
      await refreshHistoriesFromFirstPage();
    } catch {
      setHospitalStatusError("정상노출 처리 중 오류가 발생했습니다.");
    } finally {
      setUpdatingHospitalStatus(false);
    }
  }, [hospitalId, refreshHistoriesFromFirstPage]);

  const requestAllowStatusChange = React.useCallback(
    (allowStatus: string) => {
      if (!detail || updatingAllowStatus || detail.allow_status === allowStatus) return;

      setAllowStatusError(null);
      setPendingAllowStatusChange({ allowStatus, reason: "" });
    },
    [detail, updatingAllowStatus],
  );

  const closeAllowStatusModal = React.useCallback(() => {
    if (updatingAllowStatus) return;

    setPendingAllowStatusChange(null);
    setAllowStatusError(null);
  }, [updatingAllowStatus]);

  const updateAllowStatusReason = React.useCallback((reason: string) => {
    setPendingAllowStatusChange((prev) => (prev ? { ...prev, reason } : prev));
    setAllowStatusError(null);
  }, []);

  const confirmAllowStatusChange = React.useCallback(async () => {
    if (!detail || !pendingAllowStatusChange) return;

    const reason = pendingAllowStatusChange.reason.trim();
    if (pendingAllowStatusChange.allowStatus === "REJECTED" && !reason) {
      setAllowStatusError("반려 사유를 입력해주세요.");
      return;
    }

    setUpdatingAllowStatus(true);
    setAllowStatusError(null);

    try {
      const response = await api.patch<{ updated_count?: number; allow_status?: string; ids?: number[] }>(
        "/hospitals/allow-status",
        {
          ids: [detail.id],
          allow_status: pendingAllowStatusChange.allowStatus,
          ...(reason ? { reason } : {}),
        },
      );

      if (!isApiSuccess(response)) {
        setAllowStatusError(response.error.message || "검수상태 변경에 실패했습니다.");
        return;
      }

      setDetail((prev) => (prev ? { ...prev, allow_status: pendingAllowStatusChange.allowStatus } : prev));
      setPendingAllowStatusChange(null);
      await refreshHistoriesFromFirstPage();
    } catch {
      setAllowStatusError("검수상태 변경 중 오류가 발생했습니다.");
    } finally {
      setUpdatingAllowStatus(false);
    }
  }, [detail, pendingAllowStatusChange, refreshHistoriesFromFirstPage]);

  const saveNote = React.useCallback(async () => {
    const note = noteInput.trim();
    if (!note || savingNote) return;

    setSavingNote(true);

    try {
      const response = await api.post<AdminNoteItem>("/notes", {
        target_type: HOSPITAL_ADMIN_NOTE_TARGET,
        target_id: hospitalId,
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
  }, [fetchNotes, hospitalId, noteInput, savingNote, showAlert]);

  usePageHeaderExtra(headerAction);

  if (isLoading) {
    return <SpinnerBlock className="min-h-[60vh]" spinnerClassName="size-10" label="병의원 정보를 불러오는 중" />;
  }

  if (loadError || !detail) {
    return (
      <LoadErrorState
        title="병의원 정보를 불러오지 못했습니다."
        message={loadError ?? "병의원 정보를 찾을 수 없습니다."}
        onRetry={() => void fetchHospital()}
      />
    );
  }

  return (
    <div className="min-w-0 space-y-4">
      <section className="grid min-w-0 grid-cols-1 items-stretch gap-4 xl:grid-cols-[20rem_minmax(0,1fr)_19rem]">
        <HospitalLogoCard
          logo={detail.logo ?? null}
          hospitalName={detail.name}
          className="xl:col-start-1 xl:row-start-1 xl:self-start"
          onPreview={setPreviewMedia}
        />

        <HospitalInfoCard
          detail={detail}
          className="xl:col-start-2 xl:row-start-1"
          isActionMenuOpen={isActionMenuOpen}
          onToggleActionMenu={() => setIsActionMenuOpen((prev) => !prev)}
          onCloseActionMenu={() => setIsActionMenuOpen(false)}
          onOpenSuspendModal={openSuspendModal}
          onOpenActivateModal={openActivateModal}
          statusUpdating={updatingHospitalStatus}
          onPreview={setPreviewMedia}
        />

        <BusinessAccountCard detail={detail} className="xl:col-start-2 xl:row-start-2" />

        <VerifiedAccountContactCard detail={detail} className="h-full xl:col-start-2 xl:row-start-3" />

        <div className="flex min-w-0 flex-col gap-4 xl:col-start-3 xl:row-span-2 xl:row-start-1 xl:h-full">
          <PointCard detail={detail} onOpenNewEventDBs={openNewEventDBs} />
          <AdReceptionCard detail={detail} className="xl:flex-1" />
        </div>

        <AllowStatusCard
          detail={detail}
          updating={updatingAllowStatus}
          error={allowStatusError}
          onChange={requestAllowStatusChange}
          className="h-full xl:col-start-3 xl:row-start-3"
        />
      </section>

      <HospitalImagesCard detail={detail} onPreview={setPreviewMedia} />
      <OperationInfoCard detail={detail} />
      <section className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">
        <OperationHistoryCard
          histories={histories}
          meta={historyMeta}
          loading={historiesLoading}
          onPageChange={setHistoryPage}
        />
        <AdminNotesCard
          notes={notes}
          loading={notesLoading}
          onAdd={() => setIsNoteModalOpen(true)}
          formatDateTime={formatHospitalDetailDateTime}
          className={hospitalDetailCardClassName}
        />
      </section>
      <MediaPreviewModal preview={previewMedia} onChange={setPreviewMedia} onClose={() => setPreviewMedia(null)} />
      <AllowStatusConfirmModal
        pending={pendingAllowStatusChange}
        subjectLabel="해당 병의원을"
        messageAction="상태로 변경"
        labelStatus={labelReviewStatus}
        updating={updatingAllowStatus}
        error={allowStatusError}
        reasonInputId="hospital-rejected-reason"
        processingText="변경 중"
        onReasonChange={updateAllowStatusReason}
        onClose={closeAllowStatusModal}
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
      <AllowStatusConfirmModal
        pending={isSuspendModalOpen ? { allowStatus: "SUSPENDED", reason: suspendReason } : null}
        title="운영중지 처리"
        subjectLabel="해당 병의원을"
        messageAction="등록"
        labelStatus={labelApprovalStatus}
        updating={updatingHospitalStatus}
        error={hospitalStatusError}
        rejectStatus="SUSPENDED"
        reasonInputId="hospital-suspend-reason"
        reasonLabel="운영중지 사유"
        reasonPlaceholder="운영중지 사유를 입력해주세요."
        processingText="등록 중"
        confirmText="등록"
        onReasonChange={setSuspendReason}
        onClose={closeSuspendModal}
        onConfirm={() => void submitSuspend()}
      />
      <AllowStatusConfirmModal
        pending={isActivateModalOpen ? { allowStatus: "ACTIVE", reason: "" } : null}
        title="정상노출 처리"
        subjectLabel="해당 병의원을"
        messageAction="처리"
        labelStatus={(status) => (status === "ACTIVE" ? "정상노출" : labelApprovalStatus(status))}
        updating={updatingHospitalStatus}
        error={hospitalStatusError}
        rejectStatus="SUSPENDED"
        reasonInputId="hospital-activate-reason"
        processingText="처리 중"
        confirmText="확인"
        onReasonChange={() => undefined}
        onClose={closeActivateModal}
        onConfirm={() => void submitActivate()}
      />
    </div>
  );
}
