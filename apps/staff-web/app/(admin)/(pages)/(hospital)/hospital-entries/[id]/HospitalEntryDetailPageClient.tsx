"use client";

import React from "react";
import { useParams } from "next/navigation";
import { isApiSuccess } from "@beaulab/types";
import {
  Button,
  Card,
  InputField,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalPanel,
  ModalTitle,
  SpinnerBlock,
  useGlobalAlert,
} from "@beaulab/ui-admin";

import { LoadErrorState } from "@/components/common/LoadErrorState";
import {
  HospitalMediaPreviewModal,
  type HospitalMediaPreviewState,
} from "@/components/hospital/media/HospitalMediaPreviewModal";
import { api } from "@/lib/common/api";
import { usePageHeaderExtra } from "@/lib/common/routing/page-header-extra";
import {
  formatHospitalEntryBytes,
  getHospitalEntryMediaFilename,
  isHospitalEntryImageMedia,
  resolveHospitalEntryMediaUrl,
  type HospitalEntryDetailResponse,
  type HospitalEntryMediaAsset,
} from "@/lib/hospital-entry/detail";
import {
  labelHospitalEntryAllowStatus,
} from "@/lib/hospital-entry/list";

const infoCardClassName = "rounded-xl border border-gray-200 bg-white p-5";
const cardTitleClassName = "text-sm font-semibold text-gray-800";
const labelClassName = "pt-0.5 text-xs font-semibold text-gray-500";
const valueClassName = "min-w-0 break-words text-sm leading-6 text-gray-800";

type PendingAllowStatusChange = {
  allowStatus: string;
  reason: string;
};

export default function HospitalEntryDetailPageClient() {
  const params = useParams<{ id: string }>();
  const { showAlert } = useGlobalAlert();

  const rawEntryId = Array.isArray(params.id) ? params.id[0] : params.id;
  const entryId = Number(rawEntryId);

  const [detail, setDetail] = React.useState<HospitalEntryDetailResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [previewMedia, setPreviewMedia] = React.useState<HospitalMediaPreviewState | null>(null);
  const [updatingStatus, setUpdatingStatus] = React.useState(false);
  const [pendingAllowStatusChange, setPendingAllowStatusChange] = React.useState<PendingAllowStatusChange | null>(null);
  const [pendingAllowStatusError, setPendingAllowStatusError] = React.useState<string | null>(null);

  const fetchEntry = React.useCallback(async (options: { silent?: boolean } = {}) => {
    if (!Number.isFinite(entryId) || entryId <= 0) {
      setLoadError("올바르지 않은 입점신청 경로입니다.");
      setIsLoading(false);
      return;
    }

    if (!options.silent) {
      setIsLoading(true);
    }
    setLoadError(null);

    try {
      const response = await api.get<HospitalEntryDetailResponse>(`/hospital-entries/${entryId}`);

      if (!isApiSuccess(response)) {
        setLoadError(response.error.message || "입점신청 정보를 불러오지 못했습니다.");
        return;
      }

      setDetail(response.data);
    } catch {
      setLoadError("입점신청 정보를 불러오는 중 오류가 발생했습니다.");
    } finally {
      if (!options.silent) {
        setIsLoading(false);
      }
    }
  }, [entryId]);

  React.useEffect(() => {
    void fetchEntry();
  }, [fetchEntry]);

  const requestAllowStatus = React.useCallback(
    (allowStatus: string) => {
      if (!detail || updatingStatus || resolveAllowStatusCode(detail.allow_status) === allowStatus) return;

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
        const response = await api.patch<{ updated_count?: number }>("/hospital-entries/allow-status", {
          ids: [detail.id],
          allow_status: allowStatus,
          ...(reason?.trim() ? { reason: reason.trim() } : {}),
        });

        if (!isApiSuccess(response)) {
          showAlert({
            variant: "error",
            title: "승인상태 변경 실패",
            message: response.error.message || "승인상태를 변경하지 못했습니다.",
          });
          return false;
        }

        await fetchEntry({ silent: true });
        return true;
      } finally {
        setUpdatingStatus(false);
      }
    },
    [detail, fetchEntry, showAlert, updatingStatus],
  );

  const closeAllowStatusConfirmModal = React.useCallback(() => {
    if (updatingStatus) return;
    setPendingAllowStatusChange(null);
    setPendingAllowStatusError(null);
  }, [updatingStatus]);

  const updatePendingAllowStatusReason = React.useCallback((reason: string) => {
    setPendingAllowStatusChange((prev) => prev ? { ...prev, reason } : prev);
    setPendingAllowStatusError(null);
  }, []);

  const confirmAllowStatusChange = React.useCallback(async () => {
    if (!pendingAllowStatusChange) return;

    const reason = pendingAllowStatusChange.reason.trim();
    if (pendingAllowStatusChange.allowStatus === "REJECTED" && !reason) {
      setPendingAllowStatusError("입점반려 사유를 입력해주세요.");
      return;
    }

    const succeeded = await updateAllowStatus(pendingAllowStatusChange.allowStatus, reason);
    if (succeeded) {
      setPendingAllowStatusChange(null);
      setPendingAllowStatusError(null);
    }
  }, [pendingAllowStatusChange, updateAllowStatus]);

  usePageHeaderExtra(null);

  if (isLoading) {
    return <SpinnerBlock className="min-h-[60vh]" spinnerClassName="size-10" label="입점신청 정보를 불러오는 중" />;
  }

  if (loadError || !detail) {
    return (
      <LoadErrorState
        title="입점신청 정보를 불러오지 못했습니다."
        message={loadError ?? "입점신청 정보를 찾을 수 없습니다."}
        onRetry={() => void fetchEntry()}
      />
    );
  }

  const pendingAllowStatusLabel = pendingAllowStatusChange
    ? labelHospitalEntryAllowStatus(pendingAllowStatusChange.allowStatus)
    : "";

  return (
    <div className="min-w-0 space-y-4">
      <section className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">
        <HospitalEntryHospitalInfoCard detail={detail} onPreview={setPreviewMedia} />
        <HospitalEntryApplicantInfoCard detail={detail} />
      </section>

      <HospitalEntryAllowStatusCard
        detail={detail}
        updating={updatingStatus}
        onChange={requestAllowStatus}
      />

      <HospitalMediaPreviewModal
        preview={previewMedia}
        onChange={setPreviewMedia}
        onClose={() => setPreviewMedia(null)}
      />
      <Modal
        isOpen={Boolean(pendingAllowStatusChange)}
        onClose={closeAllowStatusConfirmModal}
        showCloseButton={false}
        className="mx-4 w-full max-w-md"
      >
        <ModalPanel>
          <ModalHeader className="pr-0">
            <ModalTitle>승인상태 변경</ModalTitle>
          </ModalHeader>
          <ModalBody className="mt-5">
            <p className="text-sm font-medium text-gray-800">
              해당 입점신청을 {pendingAllowStatusLabel} 처리하시겠습니까?
            </p>
            {pendingAllowStatusChange?.allowStatus === "REJECTED" ? (
              <div className="mt-4">
                <label htmlFor="hospital-entry-rejected-reason" className="mb-1.5 block text-sm font-medium text-gray-700">
                  입점반려 사유
                </label>
                <InputField
                  id="hospital-entry-rejected-reason"
                  name="rejected_reason"
                  value={pendingAllowStatusChange.reason}
                  onChange={(event) => updatePendingAllowStatusReason(event.target.value)}
                  disabled={updatingStatus}
                  placeholder="입점반려 사유를 입력해주세요."
                  error={Boolean(pendingAllowStatusError)}
                  hint={pendingAllowStatusError ?? undefined}
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
    </div>
  );
}

function HospitalEntryHospitalInfoCard({
  detail,
  onPreview,
}: {
  detail: HospitalEntryDetailResponse;
  onPreview: (preview: HospitalMediaPreviewState) => void;
}) {
  return (
    <Card className={`${infoCardClassName} h-full min-h-[18rem]`}>
      <h2 className={`mb-6 ${cardTitleClassName}`}>병의원 정보</h2>
      <div className="space-y-5">
        <InfoRow label="병의원명" value={detail.hospital_name} />
        <InfoRow label="전화번호" value={detail.hospital_phone} />
        <InfoRow label="주소" value={joinAddress(detail.address, detail.address_detail)} multiline />
        <InfoRow label="사업자등록번호" value={detail.business_number} />
        <FileInfoRow
          label="사업자등록증"
          title="사업자등록증"
          media={detail.business_registration_file ?? null}
          onPreview={onPreview}
        />
        <InfoRow label="대표자" value={detail.ceo_name} />
        <InfoRow label="의사면허번호" value={detail.license_number} />
        <FileInfoRow
          label="의사면허증"
          title="의사면허증"
          media={detail.license_file ?? null}
          onPreview={onPreview}
        />
      </div>
    </Card>
  );
}

function HospitalEntryApplicantInfoCard({ detail }: { detail: HospitalEntryDetailResponse }) {
  return (
    <Card className={`${infoCardClassName} h-full min-h-[18rem]`}>
      <h2 className={`mb-6 ${cardTitleClassName}`}>신청자 정보</h2>
      <div className="space-y-5">
        <InfoRow label="이름" value={detail.applicant_name} />
        <InfoRow label="직책" value={detail.applicant_position} />
        <InfoRow label="이메일주소" value={detail.applicant_email} />
        <InfoRow label="전화번호" value={detail.applicant_phone} />
      </div>
    </Card>
  );
}

function HospitalEntryAllowStatusCard({
  detail,
  updating,
  onChange,
}: {
  detail: HospitalEntryDetailResponse;
  updating: boolean;
  onChange: (status: string) => void;
}) {
  return (
    <Card className={infoCardClassName}>
      <div className="flex min-h-[3.5rem] flex-wrap items-center gap-x-8 gap-y-3">
        <h2 className="text-sm font-bold text-gray-900">승인상태</h2>
        <AllowStatusButtons detail={detail} updating={updating} onChange={onChange} />
      </div>
    </Card>
  );
}

function AllowStatusButtons({
  detail,
  updating,
  onChange,
}: {
  detail: HospitalEntryDetailResponse;
  updating: boolean;
  onChange: (status: string) => void;
}) {
  const currentStatus = resolveAllowStatusCode(detail.allow_status);
  const statuses = [
    ["REJECTED", "입점반려"],
    ["APPROVED", "입점승인"],
  ] as const;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {statuses.map(([value, label]) => {
        const active = currentStatus === value;

        return (
          <Button
            key={value}
            type="button"
            variant={active ? "brand" : "outline"}
            disabled={updating}
            onClick={() => onChange(value)}
            className="h-9 min-w-24 px-4 text-sm font-semibold"
          >
            {label}
          </Button>
        );
      })}
    </div>
  );
}

function InfoRow({
  label,
  value,
  action,
  multiline = false,
  className,
}: {
  label: string;
  value?: string | number | null;
  action?: React.ReactNode;
  multiline?: boolean;
  className?: string;
}) {
  const displayValue = typeof value === "number" ? String(value) : value?.trim() || "-";

  return (
    <div className={["grid min-w-0 grid-cols-[8.5rem_minmax(0,1fr)] items-start gap-4", className].filter(Boolean).join(" ")}>
      <p className={labelClassName}>{label}</p>
      <div className="flex min-w-0 items-center gap-2">
        <p className={`${valueClassName} min-w-0 flex-1 ${multiline ? "whitespace-pre-line" : ""}`}>{displayValue}</p>
        {action}
      </div>
    </div>
  );
}

function FileInfoRow({
  label,
  title,
  media,
  onPreview,
}: {
  label: string;
  title: string;
  media: HospitalEntryMediaAsset | null;
  onPreview: (preview: HospitalMediaPreviewState) => void;
}) {
  const mediaUrl = resolveHospitalEntryMediaUrl(media);
  const fileName = media ? getHospitalEntryMediaFilename(media) : "";
  const sizeText = formatHospitalEntryBytes(media?.size);
  const displayValue = [fileName, sizeText].filter(Boolean).join(" · ") || "-";

  return (
    <InfoRow
      label={label}
      value={displayValue}
      action={
        mediaUrl ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              onPreview({
                url: mediaUrl,
                title,
                isImage: isHospitalEntryImageMedia(media),
              })
            }
            className="h-7 shrink-0 px-2 text-xs"
          >
            원본보기
          </Button>
        ) : null
      }
    />
  );
}

function joinAddress(address?: string | null, addressDetail?: string | null) {
  return [address?.trim(), addressDetail?.trim()].filter(Boolean).join("\n");
}

function resolveAllowStatusCode(status?: HospitalEntryDetailResponse["allow_status"]) {
  if (!status) return "";
  if (typeof status === "string") return status;

  return status.code?.trim() || "";
}
