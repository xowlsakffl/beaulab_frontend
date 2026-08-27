"use client";

import React from "react";
import { hasPermission } from "@beaulab/auth";

import { CategoryBadgeList, StatusValueBadge, Button, Card, SpinnerBlock } from "@beaulab/ui-admin";
import { AllowStatusActionButtons, AllowStatusConfirmModal } from "@/components/common/AllowStatusControls";
import { Can } from "@/components/common/guard";
import { LoadErrorState } from "@/components/common/LoadErrorState";
import { MediaPreviewModal, type MediaPreviewState } from "@/components/common/MediaPreviewModal";
import { api } from "@/lib/common/api";
import { reviewAllowStatusColor } from "@/lib/common/review-status";
import { getSession } from "@/lib/common/auth/session";
import { STAFF_STATUS_PERMISSIONS } from "@/lib/common/status-permissions";
import { usePageHeaderExtra } from "@/lib/common/routing/page-header-extra";
import { resolveDoctorMediaUrl, type DoctorDetailResponse, type DoctorMediaAsset } from "@/lib/doctor/detail";
import {
  formatCareerPeriod,
  labelDoctorApprovalStatus,
  labelDoctorGender,
  labelDoctorSpecialistField,
} from "@/lib/doctor/list";
import { isApiSuccess } from "@beaulab/types";

import { useParams, useRouter, useSearchParams } from "next/navigation";

const infoCardClassName = "rounded-xl border border-gray-200 bg-white p-5";
const cardTitleClassName = "text-sm font-semibold text-gray-800";
const labelClassName = "pt-0.5 text-xs font-semibold text-gray-500";
const valueClassName = "min-w-0 break-words text-sm leading-6 text-gray-800";

type PendingAllowStatusChange = {
  allowStatus: string;
  reason: string;
};

export default function DoctorDetailPageClient() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const canUpdateStatus = hasPermission(getSession()?.auth, STAFF_STATUS_PERMISSIONS.doctor);

  const rawDoctorId = Array.isArray(params.id) ? params.id[0] : params.id;
  const doctorId = Number(rawDoctorId);

  const [detail, setDetail] = React.useState<DoctorDetailResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [previewMedia, setPreviewMedia] = React.useState<MediaPreviewState | null>(null);
  const [updatingAllowStatus, setUpdatingAllowStatus] = React.useState(false);
  const [allowStatusError, setAllowStatusError] = React.useState<string | null>(null);
  const [pendingAllowStatusChange, setPendingAllowStatusChange] = React.useState<PendingAllowStatusChange | null>(null);

  const editPath = React.useMemo(() => {
    const rawReturnTo = searchParams.get("returnTo");
    if (!Number.isFinite(doctorId) || doctorId <= 0) {
      return "/hospital-manage/doctors";
    }

    return rawReturnTo
      ? `/hospital-manage/doctors/${doctorId}/edit?returnTo=${encodeURIComponent(rawReturnTo)}`
      : `/hospital-manage/doctors/${doctorId}/edit`;
  }, [doctorId, searchParams]);

  const headerAction = React.useMemo(() => {
    if (!Number.isFinite(doctorId) || doctorId <= 0) return null;

    return (
      <Can permission="beaulab.doctor.update">
        <Button type="button" variant="brand" size="sm" onClick={() => router.push(editPath)}>
          수정하기
        </Button>
      </Can>
    );
  }, [doctorId, editPath, router]);

  const fetchDoctor = React.useCallback(async () => {
    if (!Number.isFinite(doctorId) || doctorId <= 0) {
      setLoadError("잘못된 의료진 경로입니다.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      const response = await api.get<DoctorDetailResponse>(`/doctors/${doctorId}`);

      if (!isApiSuccess(response)) {
        setLoadError(response.error.message || "의료진 정보를 불러오지 못했습니다.");
        return;
      }

      setDetail(response.data);
    } catch {
      setLoadError("의료진 정보를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [doctorId]);

  React.useEffect(() => {
    void fetchDoctor();
  }, [fetchDoctor]);

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
      const response = await api.patch<DoctorDetailResponse>(`/doctors/${doctorId}`, {
        allow_status: pendingAllowStatusChange.allowStatus,
        ...(reason ? { reason } : {}),
      });

      if (!isApiSuccess(response)) {
        setAllowStatusError(response.error.message || "검수상태 변경 중 오류가 발생했습니다.");
        return;
      }

      setDetail(response.data);
      setPendingAllowStatusChange(null);
    } catch {
      setAllowStatusError("검수상태 변경 중 오류가 발생했습니다.");
    } finally {
      setUpdatingAllowStatus(false);
    }
  }, [detail, doctorId, pendingAllowStatusChange]);

  usePageHeaderExtra(headerAction);

  if (isLoading) {
    return <SpinnerBlock className="min-h-[60vh]" spinnerClassName="size-10" />;
  }

  if (loadError || !detail) {
    return (
      <LoadErrorState
        title="의료진 정보를 불러오지 못했습니다."
        message={loadError ?? "의료진 정보를 찾을 수 없습니다."}
      />
    );
  }

  return (
    <div className="min-w-0 space-y-4">
      <section className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[18rem_minmax(0,1fr)]">
        <ProfilePhotoCard media={detail.profile_image ?? null} doctorName={detail.name} onPreview={setPreviewMedia} />
        <DoctorBasicInfoCard detail={detail} onPreview={setPreviewMedia} />
        <DoctorAllowStatusCard
          detail={detail}
          canUpdate={canUpdateStatus}
          updating={updatingAllowStatus}
          error={allowStatusError}
          onChange={requestAllowStatusChange}
        />

        <InfoPanel title="진료분야">
          <BadgeBlock items={categoryLabels(detail.categories)} />
        </InfoPanel>
        <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-3">
          <InfoPanel title="경력사항">
            <ListBlock items={detail.careers ?? []} />
          </InfoPanel>
          <InfoPanel title="활동사항">
            <ListBlock items={detail.etc_contents ?? []} />
          </InfoPanel>
          <InfoPanel title="학력사항">
            <ListBlock items={detail.educations ?? []} />
          </InfoPanel>
        </div>
      </section>

      <MediaPreviewModal preview={previewMedia} onChange={setPreviewMedia} onClose={() => setPreviewMedia(null)} />
      {canUpdateStatus ? (
        <AllowStatusConfirmModal
          pending={pendingAllowStatusChange}
          subjectLabel="해당 의료진을"
          messageAction="상태로 변경"
          labelStatus={labelDoctorApprovalStatus}
          updating={updatingAllowStatus}
          error={allowStatusError}
          reasonInputId="doctor-rejected-reason"
          processingText="변경 중"
          onReasonChange={updateAllowStatusReason}
          onClose={closeAllowStatusModal}
          onConfirm={() => void confirmAllowStatusChange()}
        />
      ) : null}
    </div>
  );
}

function DoctorAllowStatusCard({
  detail,
  canUpdate,
  updating,
  error,
  onChange,
}: {
  detail: DoctorDetailResponse;
  canUpdate: boolean;
  updating: boolean;
  error: string | null;
  onChange: (status: string) => void;
}) {
  return (
    <Card className={`${infoCardClassName} xl:col-start-2`}>
      <div className="flex min-h-[3.5rem] flex-wrap items-center gap-x-8 gap-y-3">
        <h3 className={cardTitleClassName}>검수상태</h3>
        {canUpdate ? (
          <AllowStatusActionButtons currentStatus={detail.allow_status} disabled={updating} onChange={onChange} />
        ) : (
          <StatusValueBadge
            label={labelDoctorApprovalStatus(detail.allow_status)}
            color={reviewAllowStatusColor(detail.allow_status)}
          />
        )}
      </div>
      {error ? <p className="mt-3 text-sm font-medium text-rose-600">{error}</p> : null}
    </Card>
  );
}

function ProfilePhotoCard({
  media,
  doctorName,
  onPreview,
}: {
  media: DoctorMediaAsset | null;
  doctorName: string;
  onPreview: (preview: MediaPreviewState) => void;
}) {
  const mediaUrl = resolveDoctorMediaUrl(media);
  const isImage = isImageDoctorMedia(media);

  return (
    <Card className="flex min-h-[18rem] items-center justify-center rounded-xl border border-gray-200 bg-white p-3 xl:h-[18rem]">
      {mediaUrl ? (
        <button
          type="button"
          onClick={() =>
            onPreview({
              url: mediaUrl,
              title: `${doctorName} 프로필`,
              isImage,
            })
          }
          className="flex h-full w-full items-center justify-center overflow-hidden rounded-lg bg-white"
        >
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element -- runtime storage URL
            <img src={mediaUrl} alt={`${doctorName} 프로필`} className="h-full w-full object-cover" />
          ) : (
            <span className="text-sm font-medium text-gray-500">프로필 파일</span>
          )}
        </button>
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-lg bg-white text-sm font-medium text-gray-400">
          프로필 사진
        </div>
      )}
    </Card>
  );
}

function DoctorBasicInfoCard({
  detail,
  onPreview,
}: {
  detail: DoctorDetailResponse;
  onPreview: (preview: MediaPreviewState) => void;
}) {
  return (
    <Card className={`${infoCardClassName} flex min-h-[18rem] flex-col`}>
      <h2 className={`mb-6 ${cardTitleClassName}`}>의료진정보</h2>
      <div className="grid min-w-0 flex-1 gap-x-16 gap-y-6 md:grid-cols-2">
        <div className="space-y-6">
          <InfoRow label="병의원" value={detail.hospital_name} />
          <InfoRow label="의료진" value={detail.name} />
          <InfoRow label="직책" value={detail.position} />
          <InfoRow label="성별" value={labelDoctorGender(detail.gender)} />
        </div>

        <div className="space-y-6">
          <InfoRow label="경력기간" value={formatCareerPeriod(detail.career_started_at)} />
          <InfoRow
            label="의사면허 번호"
            value={detail.license_number}
            action={
              <PreviewButton title="의사면허증 이미지" media={detail.license_image ?? null} onPreview={onPreview} />
            }
          />
          <InfoRow
            label="전문의"
            value={labelDoctorSpecialistField(detail.specialist?.code, detail.specialist?.label)}
            action={
              <PreviewButton
                title="전문의 증명서 이미지"
                media={detail.specialist_certificate_image ?? null}
                onPreview={onPreview}
              />
            }
          />
        </div>
      </div>
    </Card>
  );
}

function InfoRow({
  label,
  value,
  action,
}: {
  label: string;
  value?: string | number | null;
  action?: React.ReactNode;
}) {
  const displayValue = typeof value === "number" ? String(value) : value?.trim() || "-";

  return (
    <div className="grid min-w-0 grid-cols-[8.5rem_minmax(0,1fr)] items-start gap-4">
      <p className={labelClassName}>{label}</p>
      <div className="flex min-w-0 items-center gap-2">
        <p className={`${valueClassName} min-w-0 flex-1`}>{displayValue}</p>
        {action}
      </div>
    </div>
  );
}

function PreviewButton({
  title,
  media,
  onPreview,
}: {
  title: string;
  media: DoctorMediaAsset | null;
  onPreview: (preview: MediaPreviewState) => void;
}) {
  const mediaUrl = resolveDoctorMediaUrl(media);
  if (!mediaUrl) return null;

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() =>
        onPreview({
          url: mediaUrl,
          title,
          isImage: isImageDoctorMedia(media),
        })
      }
      className="h-7 shrink-0 px-2 text-xs"
    >
      원본보기
    </Button>
  );
}

function InfoPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className={`${infoCardClassName} min-h-[12rem]`}>
      <h3 className={`mb-5 ${cardTitleClassName}`}>{title}</h3>
      {children}
    </Card>
  );
}

function ListBlock({ items }: { items: string[] }) {
  const normalizedItems = items.map((item) => item.trim()).filter(Boolean);

  if (normalizedItems.length === 0) {
    return <p className={valueClassName}>-</p>;
  }

  return (
    <div className="space-y-2">
      {normalizedItems.map((item, index) => (
        <p key={`${item}-${index}`} className={valueClassName}>
          {item}
        </p>
      ))}
    </div>
  );
}

function BadgeBlock({ items }: { items: string[] }) {
  return <CategoryBadgeList values={items} empty={<p className={valueClassName}>-</p>} />;
}

function categoryLabels(categories?: Array<{ name?: string | null; full_path?: string | null }> | null) {
  if (!categories || categories.length === 0) return [];

  return categories
    .map((category) => category.name?.trim() || formatCategoryPath(category.full_path, category.name))
    .filter((item): item is string => Boolean(item && item !== "-"));
}

function formatCategoryPath(fullPath?: string | null, fallbackName?: string | null) {
  const raw = fullPath?.trim() || fallbackName?.trim() || "-";
  return raw.replace(/\s*>\s*/g, " > ");
}

function isImageDoctorMedia(media?: DoctorMediaAsset | null) {
  const mimeType = media?.mime_type?.trim().toLowerCase();
  if (mimeType) return mimeType.startsWith("image/");

  const mediaUrl = resolveDoctorMediaUrl(media);
  if (!mediaUrl) return false;

  return /\.(avif|gif|jpe?g|png|svg|webp)$/i.test(mediaUrl.split("?")[0] ?? "");
}
