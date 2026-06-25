"use client";

import React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { isApiSuccess } from "@beaulab/types";

import { AddCircleButton } from "@/components/common/AddCircleButton";
import { Can } from "@/components/common/guard";
import { LoadErrorState } from "@/components/common/LoadErrorState";
import {
  OperationHistoryActionBadge,
  OperationHistoryReason,
} from "@/components/common/OperationHistoryDisplay";
import {
  HospitalMediaPreviewModal,
  type HospitalMediaPreviewItem,
  type HospitalMediaPreviewState,
} from "@/components/hospital/media/HospitalMediaPreviewModal";
import { api } from "@/lib/common/api";
import { usePageHeaderExtra } from "@/lib/common/routing/page-header-extra";
import {
  getMediaFilename,
  isImageMedia,
  resolveMediaUrl,
  type HospitalDetailResponse,
  type MediaAsset,
} from "@/lib/hospital/detail";
import { hospitalStatusBadgeColor, labelApprovalStatus, labelReviewStatus } from "@/lib/hospital/list";
import {
  Button,
  Card,
  CategoryBadgeList,
  Dropdown,
  DropdownItem,
  FormTextArea,
  InputField,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalPanel,
  ModalTitle,
  MoreVertical,
  Pagination,
  SpinnerBlock,
  Star,
  StatusBadge,
  useGlobalAlert,
  type DataTableMeta,
} from "@beaulab/ui-admin";

const cardClassName = "rounded-xl border border-gray-200 bg-white p-5";
const labelClassName = "pt-0.5 text-xs font-semibold text-gray-500";
const valueClassName = "min-w-0 break-words text-sm leading-6 text-gray-800";
const HOSPITAL_ADMIN_NOTE_TARGET = "hospital";
const HISTORY_PER_PAGE = 10;

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
  action_label?: string | null;
  changes?: OperationHistoryChangeItem[] | null;
  before_value?: unknown;
  after_value?: unknown;
  reason?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string | null;
};

const dayLabels = [
  ["mon", "월"],
  ["tue", "화"],
  ["wed", "수"],
  ["thu", "목"],
  ["fri", "금"],
  ["sat", "토"],
  ["sun", "일"],
] as const;

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
  const [previewMedia, setPreviewMedia] = React.useState<HospitalMediaPreviewState | null>(null);
  const [isActionMenuOpen, setIsActionMenuOpen] = React.useState(false);
  const [isSuspendModalOpen, setIsSuspendModalOpen] = React.useState(false);
  const [suspendError, setSuspendError] = React.useState<string | null>(null);
  const [suspending, setSuspending] = React.useState(false);
  const [updatingAllowStatus, setUpdatingAllowStatus] = React.useState(false);
  const [allowStatusError, setAllowStatusError] = React.useState<string | null>(null);
  const [notes, setNotes] = React.useState<AdminNoteItem[]>([]);
  const [notesLoading, setNotesLoading] = React.useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = React.useState(false);
  const [noteInput, setNoteInput] = React.useState("");
  const [savingNote, setSavingNote] = React.useState(false);
  const [histories, setHistories] = React.useState<OperationHistoryItem[]>([]);
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
      return "/hospitals";
    }

    return rawReturnTo
      ? `/hospitals/${hospitalId}/edit?returnTo=${encodeURIComponent(rawReturnTo)}`
      : `/hospitals/${hospitalId}/edit`;
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

    router.push(`/customer-db/events?hospital_id=${hospitalId}&statuses=NEW`);
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
      const response = await api.get<OperationHistoryItem[]>(`/hospitals/${hospitalId}/operation-histories`, {
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
    setSuspendError(null);
    setIsSuspendModalOpen(true);
  }, []);

  const closeSuspendModal = React.useCallback(() => {
    if (suspending) return;

    setIsSuspendModalOpen(false);
    setSuspendError(null);
  }, [suspending]);

  const submitSuspend = React.useCallback(async () => {
    if (!Number.isFinite(hospitalId) || hospitalId <= 0) return;

    setSuspending(true);
    setSuspendError(null);

    try {
      const response = await api.patch<HospitalDetailResponse>(`/hospitals/${hospitalId}/status`, {
        status: "SUSPENDED",
      });

      if (!isApiSuccess(response)) {
        setSuspendError(response.error.message || "운영중지 등록에 실패했습니다.");
        return;
      }

      setDetail(response.data);
      setIsSuspendModalOpen(false);
      await refreshHistoriesFromFirstPage();
    } catch {
      setSuspendError("운영중지 등록 중 오류가 발생했습니다.");
    } finally {
      setSuspending(false);
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
    setPendingAllowStatusChange((prev) => prev ? { ...prev, reason } : prev);
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

      setDetail((prev) => prev ? { ...prev, allow_status: pendingAllowStatusChange.allowStatus } : prev);
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
        />
      </section>
      <HospitalMediaPreviewModal preview={previewMedia} onChange={setPreviewMedia} onClose={() => setPreviewMedia(null)} />
      <AllowStatusConfirmModal
        pending={pendingAllowStatusChange}
        updating={updatingAllowStatus}
        error={allowStatusError}
        onReasonChange={updateAllowStatusReason}
        onClose={closeAllowStatusModal}
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
      <Modal isOpen={isSuspendModalOpen} onClose={closeSuspendModal} className="mx-4 max-w-md" showCloseButton={false}>
        <ModalPanel>
          <ModalHeader className="pr-0">
            <ModalTitle>운영중지 처리</ModalTitle>
          </ModalHeader>
          <ModalBody className="mt-5 space-y-3">
            <p className="whitespace-pre-line text-sm leading-6 text-gray-700 font-medium">
              해당 병의원을 운영중지 등록 하시겠습니까?
            </p>
            {suspendError ? <p className="text-sm text-rose-600">{suspendError}</p> : null}
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="outline" onClick={closeSuspendModal} disabled={suspending}>
              취소
            </Button>
            <Button type="button" variant="brand" onClick={() => void submitSuspend()} disabled={suspending}>
              {suspending ? "등록 중" : "등록"}
            </Button>
          </ModalFooter>
        </ModalPanel>
      </Modal>
    </div>
  );
}

function HospitalLogoCard({
  logo,
  hospitalName,
  className,
  onPreview,
}: {
  logo: MediaAsset | null;
  hospitalName: string;
  className?: string;
  onPreview: (preview: HospitalMediaPreviewState) => void;
}) {
  const logoUrl = resolveMediaUrl(logo);
  const isImage = isImageMedia(logo);

  return (
    <Card
      className={[
        "flex min-h-[14rem] items-center justify-center rounded-xl border border-gray-200 bg-white p-4",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {logoUrl && isImage ? (
        <button
          type="button"
          onClick={() =>
            onPreview({
              url: logoUrl,
              title: `${hospitalName} 로고`,
              isImage,
            })
          }
          className="flex h-full w-full items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-white"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- runtime storage URL */}
          <img src={logoUrl} alt={`${hospitalName} 로고`} className="h-full w-full object-cover" />
        </button>
      ) : (
        <div className="flex size-24 items-center justify-center rounded-full border-2 border-gray-700 bg-white text-xl font-bold text-gray-800">
          {buildLogoInitials(hospitalName)}
        </div>
      )}
    </Card>
  );
}

function HospitalInfoCard({
  detail,
  className,
  isActionMenuOpen,
  onToggleActionMenu,
  onCloseActionMenu,
  onOpenSuspendModal,
  onPreview,
}: {
  detail: HospitalDetailResponse;
  className?: string;
  isActionMenuOpen: boolean;
  onToggleActionMenu: () => void;
  onCloseActionMenu: () => void;
  onOpenSuspendModal: () => void;
  onPreview: (preview: HospitalMediaPreviewState) => void;
}) {
  const statusHistoryText = buildStatusHistoryText(detail);
  const cannotSuspend = detail.status === "SUSPENDED" || detail.status === "WITHDRAWN";

  return (
    <Card className={[cardClassName, className].filter(Boolean).join(" ")}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-bold text-gray-900">병의원정보</h2>
          {detail.status && detail.status !== "ACTIVE" ? (
            <StatusBadge size="sm" color={hospitalStatusBadgeColor(detail.status)}>
              {labelApprovalStatus(detail.status)}
            </StatusBadge>
          ) : null}
          {detail.status && detail.status !== "ACTIVE" && statusHistoryText ? (
            <span className="text-xs text-gray-700">[{statusHistoryText}]</span>
          ) : null}
        </div>
        <Can permission="beaulab.hospital.update">
          <div className="relative">
            <button
              type="button"
              className="dropdown-toggle rounded-full p-1 text-gray-700 hover:bg-gray-50"
              aria-label="병의원 메뉴"
              aria-expanded={isActionMenuOpen}
              onClick={(event) => {
                event.stopPropagation();
                onToggleActionMenu();
              }}
            >
              <MoreVertical className="size-4" />
            </button>
            <Dropdown isOpen={isActionMenuOpen} onClose={onCloseActionMenu} className="w-36 overflow-hidden py-1">
              <DropdownItem
                disabled={cannotSuspend}
                onItemClick={onCloseActionMenu}
                onClick={onOpenSuspendModal}
                baseClassName={
                  cannotSuspend
                    ? "block w-full cursor-not-allowed px-4 py-2 text-left text-sm font-semibold text-gray-300"
                    : "block w-full px-4 py-2 text-left text-sm font-semibold text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                }
              >
                운영중지
              </DropdownItem>
            </Dropdown>
          </div>
        </Can>
      </div>

      <div className="grid gap-x-8 gap-y-3 md:grid-cols-2">
        <InfoField label="병의원명" value={detail.name} />
        <InfoField label="대표자" value={detail.business_registration?.ceo_name} />
        <InfoField label="병의원주소" value={joinAddress(detail.address, detail.address_detail)} />
        <InfoField label="전화번호" value={detail.tel} />
        <InfoField label="사업자등록번호" value={detail.business_registration?.business_number} />
        <CertificatePreviewField media={detail.business_registration?.certificate_media} onPreview={onPreview} />
        <InfoField label="업태" value={detail.business_registration?.business_type} />
        <InfoField label="종목" value={detail.business_registration?.business_item} />
        <LinkInfoField label="유튜브 링크" href={detail.youtube_link} className="md:col-span-2" />
      </div>
    </Card>
  );
}

function BusinessAccountCard({ detail, className }: { detail: HospitalDetailResponse; className?: string }) {
  const settlementAccount = detail.business_registration?.settlement_account;

  return (
    <Card className={[cardClassName, className].filter(Boolean).join(" ")}>
      <h3 className="mb-5 text-sm font-bold text-gray-900">사업자 계좌정보</h3>
      <div className="grid gap-x-8 gap-y-3 md:grid-cols-2">
        <InfoField label="세금계산서 이메일" value={settlementAccount?.tax_invoice_email} className="md:col-span-2" />
        <InfoField label="정산 계좌번호" value={settlementAccountNumber(settlementAccount)} />
        <InfoField label="예금주명" value={settlementAccount?.account_holder} />
      </div>
    </Card>
  );
}

function VerifiedAccountContactCard({ detail, className }: { detail: HospitalDetailResponse; className?: string }) {
  return (
    <Card className={[cardClassName, className].filter(Boolean).join(" ")}>
      <h3 className="mb-5 text-sm font-bold text-gray-900">인증된 계정 연락처</h3>
      <div className="space-y-3">
        <InfoField label="전화번호" value={detail.account_hospital?.phone} compact />
        <InfoField label="이메일" value={detail.account_hospital?.email ?? detail.email} compact />
      </div>
    </Card>
  );
}

function AllowStatusCard({
  detail,
  updating,
  error,
  onChange,
  className,
}: {
  detail: HospitalDetailResponse;
  updating: boolean;
  error: string | null;
  onChange: (status: string) => void;
  className?: string;
}) {
  return (
    <Card className={[cardClassName, className].filter(Boolean).join(" ")}>
      <div className="flex min-h-[3.5rem] flex-wrap items-center gap-x-8 gap-y-3">
        <h3 className="text-sm font-bold text-gray-900">검수상태</h3>
        <AllowStatusButtons detail={detail} updating={updating} onChange={onChange} />
      </div>
      {error ? <p className="mt-3 text-sm font-medium text-rose-600">{error}</p> : null}
    </Card>
  );
}

function AllowStatusButtons({
  detail,
  updating,
  onChange,
}: {
  detail: HospitalDetailResponse;
  updating: boolean;
  onChange: (status: string) => void;
}) {
  const statuses = [
    ["REVIEWING", "검수"],
    ["APPROVED", "승인"],
    ["REJECTED", "반려"],
  ] as const;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {statuses.map(([value, label]) => {
        const active = detail.allow_status === value;

        return (
          <Button
            key={value}
            type="button"
            variant={active ? "brand" : "outline"}
            disabled={updating || active}
            onClick={() => onChange(value)}
            className="h-10 min-w-16 px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
          >
            {label}
          </Button>
        );
      })}
    </div>
  );
}

function AllowStatusConfirmModal({
  pending,
  updating,
  error,
  onReasonChange,
  onClose,
  onConfirm,
}: {
  pending: { allowStatus: string; reason: string } | null;
  updating: boolean;
  error: string | null;
  onReasonChange: (reason: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const statusLabel = pending ? labelReviewStatus(pending.allowStatus) : "";
  const requiresReason = pending?.allowStatus === "REJECTED";

  return (
    <Modal isOpen={pending !== null} onClose={onClose} className="mx-4 max-w-md" showCloseButton={false}>
      <ModalPanel>
        <ModalHeader className="pr-0">
          <ModalTitle>검수상태 변경</ModalTitle>
        </ModalHeader>
        <ModalBody className="mt-5 space-y-4">
          <p className="text-sm font-medium text-gray-800">
            해당 병의원을 {statusLabel} 상태로 변경하시겠습니까?
          </p>
          {requiresReason ? (
            <div className="mt-4">
              <label htmlFor="hospital-rejected-reason" className="mb-1.5 block text-sm font-medium text-gray-700">
                반려 사유
              </label>
              <InputField
                id="hospital-rejected-reason"
                name="rejected_reason"
                value={pending?.reason ?? ""}
                onChange={(event) => onReasonChange(event.target.value)}
                disabled={updating}
                placeholder="반려 사유를 입력해주세요."
                error={Boolean(error)}
                hint={error ?? undefined}
              />
            </div>
          ) : null}
          {error && !requiresReason ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
        </ModalBody>
        <ModalFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={updating}>
            취소
          </Button>
          <Button type="button" variant="brand" onClick={onConfirm} disabled={updating}>
            {updating ? "변경 중" : "확인"}
          </Button>
        </ModalFooter>
      </ModalPanel>
    </Modal>
  );
}

function PointCard({
  detail,
  className,
  onOpenNewEventDBs,
}: {
  detail: HospitalDetailResponse;
  className?: string;
  onOpenNewEventDBs: () => void;
}) {
  const newEventDBCount = Number(detail.new_event_db_count ?? 0);

  return (
    <Card className={[cardClassName, className].filter(Boolean).join(" ")}>
      <div className="flex min-h-[5rem] flex-col justify-between gap-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-gray-900">현재 포인트 잔액</h3>
          <Button type="button" variant="brand" size="sm" onClick={onOpenNewEventDBs} className="h-8 px-3 text-xs">
            미확인 DB {newEventDBCount.toLocaleString()}건
          </Button>
        </div>
        <p className="text-right text-sm font-bold text-gray-900">0 P</p>
      </div>
    </Card>
  );
}

function AdReceptionCard({ detail, className }: { detail: HospitalDetailResponse; className?: string }) {
  const phones = detail.ad_reception_phones;

  return (
    <Card className={[cardClassName, "min-h-[9rem]", className].filter(Boolean).join(" ")}>
      <h3 className="mb-5 text-sm font-bold text-gray-900">광고 안내 수신 접수전화번호</h3>
      <div className="space-y-3">
        <InfoField label="[필수] 담당자1" value={phones?.phone_1} compact />
        <InfoField label="[선택] 담당자2" value={phones?.phone_2} compact />
        <InfoField label="[선택] 담당자3" value={phones?.phone_3} compact />
      </div>
    </Card>
  );
}

function HospitalImagesCard({
  detail,
  onPreview,
}: {
  detail: HospitalDetailResponse;
  onPreview: (preview: HospitalMediaPreviewState) => void;
}) {
  const gallery = detail.gallery ?? [];
  const previewIndexByGalleryIndex = new Map<number, number>();
  const previewItems = gallery.reduce<HospitalMediaPreviewItem[]>((items, media, index) => {
    const mediaUrl = resolveMediaUrl(media);
    if (!mediaUrl || !isImageMedia(media)) return items;

    previewIndexByGalleryIndex.set(index, items.length);
    items.push({
      url: mediaUrl,
      title: galleryImageTitle(media, index),
      isImage: true,
    });

    return items;
  }, []);

  return (
    <Card className={cardClassName}>
      <h3 className="mb-4 text-sm font-bold text-gray-900">병의원이미지</h3>
      {gallery.length > 0 ? (
        <div className="grid grid-flow-col auto-cols-[calc((100%_-_1rem)/2)] gap-4 overflow-x-auto pb-2 md:auto-cols-[calc((100%_-_3rem)/4)]">
          {gallery.map((media, index) => (
            <HospitalImageTile
              key={String(media.id ?? `gallery-${index}`)}
              media={media}
              index={index}
              isRepresentative={Boolean(media.is_primary) || index === 0}
              previewItems={previewItems}
              previewIndex={previewIndexByGalleryIndex.get(index) ?? null}
              onPreview={onPreview}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
          등록된 병의원 이미지가 없습니다.
        </div>
      )}
    </Card>
  );
}

function HospitalImageTile({
  media,
  index,
  isRepresentative,
  previewItems,
  previewIndex,
  onPreview,
}: {
  media: MediaAsset;
  index: number;
  isRepresentative: boolean;
  previewItems: HospitalMediaPreviewItem[];
  previewIndex: number | null;
  onPreview: (preview: HospitalMediaPreviewState) => void;
}) {
  const mediaUrl = resolveMediaUrl(media);
  const isImage = isImageMedia(media);
  const badgeText = galleryImageTitle(media, index);
  const canPreview = Boolean(mediaUrl && isImage && previewIndex !== null);

  const handlePreview = () => {
    if (!mediaUrl || !isImage || previewIndex === null) return;
    onPreview({
      url: mediaUrl,
      title: badgeText,
      isImage,
      items: previewItems,
      index: previewIndex,
    });
  };

  return (
    <button
      type="button"
      onClick={handlePreview}
      disabled={!canPreview}
      className="relative flex aspect-[76/49] min-w-0 items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-white text-left shadow-sm disabled:cursor-default"
      aria-label={canPreview ? `${getMediaFilename(media)} 원본보기` : undefined}
    >
      <span className="absolute left-2 top-2 z-10 rounded bg-gray-700 px-2 py-0.5 text-[10px] font-semibold text-white">
        {badgeText}
      </span>
      {isRepresentative ? (
        <span className="absolute right-3 top-3 z-10 inline-flex size-8 items-center justify-center rounded-full bg-white/90 text-gray-500 shadow-sm">
          <Star className="size-4 fill-yellow-400 text-yellow-500" />
        </span>
      ) : null}
      {mediaUrl && isImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- runtime storage URL
        <img src={mediaUrl} alt={getMediaFilename(media)} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full items-center justify-center px-4 text-center text-sm text-gray-500">
          미리보기를 지원하지 않는 파일입니다.
        </div>
      )}
    </button>
  );
}

function OperationInfoCard({ detail }: { detail: HospitalDetailResponse }) {
  return (
    <Card className={cardClassName}>
      <h3 className="mb-5 text-sm font-bold text-gray-900">운영정보</h3>
      <div className="grid grid-cols-[minmax(14rem,0.8fr)_minmax(16rem,1fr)_minmax(18rem,1fr)_minmax(18rem,1fr)] gap-x-10 gap-y-6">
        <div className="space-y-4">
          <InfoField label="분과" value={detail.department_label ?? detail.department} compact />
          <BadgeInfoField label="진료과목" items={categoryLabels(detail.categories)} compact />
        </div>
        <div className="space-y-4">
          <BadgeInfoField label="병의원정보" items={featureLabels(detail.features)} compact />
        </div>
        <div className="space-y-4">
          <InfoField label="병의원소개" value={detail.description} multiline compact />
        </div>
        <div className="space-y-4">
          <InfoField label="진료시간" value={operationHoursSummary(detail)} multiline compact />
          <InfoField label="오시는길" value={detail.direction} multiline compact />
        </div>
      </div>
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
      <h3 className="mb-4 border-b border-gray-200 pb-3 text-sm font-bold text-gray-900">히스토리</h3>
      {hasHistories ? (
        <div className={["space-y-3", loading ? "pointer-events-none opacity-60" : ""].filter(Boolean).join(" ")} aria-busy={loading}>
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
                    <span>
                      <OperationHistoryActionBadge history={history} actionLabelOverride={hospitalHistoryActionLabel} />
                    </span>
                    <span className="break-words">
                      <OperationHistoryReason
                        history={history}
                        statusLabel={labelApprovalStatus}
                        statusBadgeColor={hospitalStatusBadgeColor}
                        allowStatusLabel={labelReviewStatus}
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
                          <span className="text-sm leading-none">-</span>
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
      ) : loading ? (
        <div className="flex min-h-56 items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
          히스토리를 불러오는 중입니다.
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
          등록된 히스토리가 없습니다.
        </div>
      )}
    </Card>
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
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
          등록된 관리자 메모가 없습니다.
        </div>
      )}
    </Card>
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

function InfoField({
  label,
  value,
  multiline = false,
  compact = false,
  className,
}: {
  label: string;
  value?: string | number | null;
  multiline?: boolean;
  compact?: boolean;
  className?: string;
}) {
  const displayValue = typeof value === "number" ? String(value) : value?.trim() || "-";

  return (
    <div
      className={[
        compact ? "grid grid-cols-[7.25rem_minmax(0,1fr)] gap-3" : "grid grid-cols-[8.5rem_minmax(0,1fr)] gap-4",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <p className={labelClassName}>{label}</p>
      <p className={`${valueClassName} ${multiline ? "whitespace-pre-line" : ""}`}>{displayValue}</p>
    </div>
  );
}

function LinkInfoField({
  label,
  href,
  className,
}: {
  label: string;
  href?: string | null;
  className?: string;
}) {
  const value = href?.trim();

  return (
    <div className={["grid grid-cols-[8.5rem_minmax(0,1fr)] gap-4", className].filter(Boolean).join(" ")}>
      <p className={labelClassName}>{label}</p>
      {value ? (
        <a
          href={value}
          target="_blank"
          rel="noreferrer"
          className={`${valueClassName} transition-colors hover:text-brand-500 hover:underline`}
        >
          {value}
        </a>
      ) : (
        <p className={valueClassName}>-</p>
      )}
    </div>
  );
}

function BadgeInfoField({
  label,
  items,
  compact = false,
}: {
  label: string;
  items: string[];
  compact?: boolean;
}) {
  return (
    <div className={compact ? "grid grid-cols-[7.25rem_minmax(0,1fr)] gap-3" : "grid grid-cols-[8.5rem_minmax(0,1fr)] gap-4"}>
      <p className={labelClassName}>{label}</p>
      <CategoryBadgeList values={items} empty={<p className={valueClassName}>-</p>} />
    </div>
  );
}

function CertificatePreviewField({
  media,
  onPreview,
}: {
  media?: MediaAsset | null;
  onPreview: (preview: HospitalMediaPreviewState) => void;
}) {
  const mediaUrl = resolveMediaUrl(media);
  const displayValue = mediaLabel(media);
  const isImage = isImageMedia(media);

  return (
    <div className="grid grid-cols-[8.5rem_minmax(0,1fr)] gap-4">
      <p className={labelClassName}>사업자등록증</p>
      <div className="flex min-w-0 items-center gap-2">
        <p className={`${valueClassName} min-w-0 truncate`}>{displayValue}</p>
        {mediaUrl ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              onPreview({
                url: mediaUrl,
                title: "사업자등록증",
                isImage,
              })
            }
            className="h-7 shrink-0 px-2 text-xs"
          >
            원본보기
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function mediaLabel(media?: MediaAsset | null) {
  return media ? getMediaFilename(media) : "-";
}

function galleryImageTitle(media: MediaAsset, index: number) {
  return Boolean(media.is_primary) || index === 0 ? "대표이미지" : `내부이미지${index}`;
}

function settlementAccountNumber(account?: {
  bank_name?: string | null;
  account_number?: string | null;
} | null) {
  const parts = [account?.bank_name, account?.account_number]
    .map((item) => item?.trim())
    .filter(Boolean);

  return parts.length > 0 ? parts.join(" ") : "-";
}

function categoryLabels(categories?: Array<{ name?: string | null; full_path?: string | null }> | null) {
  if (!categories || categories.length === 0) return [];

  return categories
    .map((category) => category.name?.trim() || category.full_path?.trim())
    .filter((item): item is string => Boolean(item));
}

function featureLabels(features?: Array<{ name?: string | null }> | null) {
  if (!features || features.length === 0) return [];

  return features
    .map((feature) => feature.name?.trim())
    .filter((item): item is string => Boolean(item));
}

function operationHoursSummary(detail: HospitalDetailResponse) {
  const operationHours = detail.operation_hours;

  if (!operationHours) {
    return detail.consulting_hours?.trim() || "-";
  }

  return dayLabels
    .map(([key, label]) => {
      const item = operationHours[key];
      if (!item) return `${label} -`;
      if (item.is_closed) return `${label} 진료안함`;
      return `${label} ${item.start ?? "-"} ~ ${item.end ?? "-"}`;
    })
    .join("\n");
}

function buildStatusHistoryText(detail: HospitalDetailResponse) {
  const history = detail.latest_status_history;
  if (!history) return "";

  const reason = history.reason?.trim();
  const createdAt = formatShortDateTime(history.created_at);

  return [reason, createdAt].filter(Boolean).join(" · ");
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
    const label = labelApprovalStatus(String(value ?? ""));
    return label === "-" ? stringifyHistoryValue(value) : label;
  }

  if (field === "allow_status") {
    const label = labelReviewStatus(String(value ?? ""));
    return label === "-" ? stringifyHistoryValue(value) : label;
  }

  if (field === "categories") {
    return categoryHistoryValueLabel(value);
  }

  if (field === "operation_hours") {
    return operationHoursHistoryValueLabel(value);
  }

  return stringifyHistoryValue(value);
}

function hospitalHistoryActionLabel(
  history: {
    action?: string | null;
    field?: string | null;
    changes?: Array<{ field_key?: string | null }> | null;
  },
  defaultLabel: string,
) {
  const field = history.changes?.[0]?.field_key ?? history.field ?? null;

  if (history.action === "STATUS_UPDATED" && field === "allow_status") {
    return "검수 상태 변경";
  }

  if (history.action === "STATUS_UPDATED" && field === "status") {
    return "상태 변경";
  }

  return defaultLabel;
}

function categoryHistoryValueLabel(value: unknown) {
  if (typeof value === "string") {
    return stripPrimaryMarker(value);
  }

  if (Array.isArray(value)) {
    const paths = value
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const path = "path" in item ? item.path : null;
        return typeof path === "string" ? stripPrimaryMarker(path) : null;
      })
      .filter((item): item is string => Boolean(item));

    return paths.length > 0 ? paths.join("\n") : "-";
  }

  return stringifyHistoryValue(value);
}

function stripPrimaryMarker(value: string) {
  return value.replace(/^\[대표\]\s*/gm, "");
}

function operationHoursHistoryValueLabel(value: unknown) {
  const operationHours = parseOperationHoursHistoryValue(value);
  if (!operationHours) {
    return stringifyHistoryValue(value);
  }

  const lines = dayLabels
    .map(([key, label]) => {
      const item = operationHours[key];
      if (!item || typeof item !== "object") return null;

      if (isOperationDayClosed(item.is_closed)) {
        return `${label} 진료안함`;
      }

      const start = String(item.start ?? "").trim() || "-";
      const end = String(item.end ?? "").trim() || "-";
      return `${label} ${start} ~ ${end}`;
    })
    .filter((item): item is string => Boolean(item));

  return lines.length > 0 ? lines.join("\n") : "-";
}

function isOperationDayClosed(value: unknown) {
  return value === true || value === 1 || value === "1" || value === "true" || value === "TRUE";
}

function parseOperationHoursHistoryValue(value: unknown) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, { start?: unknown; end?: unknown; is_closed?: unknown }>;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();
  if (!trimmedValue.startsWith("{")) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmedValue);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, { start?: unknown; end?: unknown; is_closed?: unknown }>
      : null;
  } catch {
    return null;
  }
}

function stringifyHistoryValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "string" || typeof value === "number") return String(value);

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function formatShortDateTime(value?: string | null) {
  if (!value) return "";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  const year = String(parsed.getFullYear() % 100).padStart(2, "0");
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  const hours = String(parsed.getHours()).padStart(2, "0");
  const minutes = String(parsed.getMinutes()).padStart(2, "0");

  return `${year}.${month}.${day} ${hours}:${minutes}`;
}

function joinAddress(address?: string | null, detail?: string | null) {
  return [address?.trim(), detail?.trim()].filter(Boolean).join("\n");
}

function buildLogoInitials(name: string) {
  const normalized = name.trim();
  if (!normalized) return "D:A";
  const words = normalized.split(/\s+/).filter(Boolean);
  if (words.length >= 2) return `${words[0][0] ?? "D"}:${words[1][0] ?? "A"}`.toUpperCase();
  return normalized.slice(0, 2).toUpperCase();
}
