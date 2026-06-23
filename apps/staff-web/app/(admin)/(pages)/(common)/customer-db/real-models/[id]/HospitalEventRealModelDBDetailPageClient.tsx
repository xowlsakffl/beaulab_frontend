"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { isApiSuccess } from "@beaulab/types";
import {
  Button,
  Card,
  CardContent,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalPanel,
  ModalTitle,
  SpinnerBlock,
  StatusBadge,
} from "@beaulab/ui-admin";

import {
  HospitalMediaPreviewModal,
  type HospitalMediaPreviewItem,
  type HospitalMediaPreviewState,
} from "@/components/hospital/media/HospitalMediaPreviewModal";
import { api, isApiRequestCanceledError } from "@/lib/common/api";
import {
  normalizeHospitalEventRealModelDBDetail,
  type HospitalEventRealModelDBDetail,
} from "@/lib/hospital-event-real-model-db/detail";
import {
  hospitalEventRealModelDBStatusColor,
  labelHospitalEventRealModelDBStatus,
  resolveHospitalEventRealModelDBMediaUrl,
  type HospitalEventRealModelDBApiItem,
  type HospitalEventRealModelDBMediaAsset,
  type HospitalEventRealModelDBStatus,
} from "@/lib/hospital-event-real-model-db/list";

const infoCardClassName = "rounded-xl border border-gray-200 bg-white p-5";
const cardTitleClassName = "text-sm font-semibold text-gray-800";
const labelClassName = "pt-0.5 text-xs font-semibold text-gray-500";
const valueClassName = "min-w-0 break-words text-sm leading-6 text-gray-800";

const SPECIAL_NOTE_OPTIONS = [
  { code: "REVISION_SURGERY", label: "재수술이에요" },
  { code: "RECENT_SURGERY_WITHIN_6_MONTHS", label: "6개월 이내 수술 이력이 있어요" },
  { code: "SIDE_EFFECT_EXPERIENCED", label: "수술 후 부작용을 겪고 있어요" },
  { code: "FUNCTIONAL_PROBLEM", label: "선천 / 후천적 기능 문제가 있어요" },
] as const;

export default function HospitalEventRealModelDBDetailPageClient() {
  const params = useParams<{ id: string }>();
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const applicationId = Number(rawId);

  const [detail, setDetail] = React.useState<HospitalEventRealModelDBDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = React.useState<HospitalEventRealModelDBStatus | null>(null);
  const [statusError, setStatusError] = React.useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = React.useState<HospitalEventRealModelDBStatus | null>(null);
  const [previewMedia, setPreviewMedia] = React.useState<HospitalMediaPreviewState | null>(null);

  const fetchDetail = React.useCallback(async () => {
    if (!Number.isFinite(applicationId) || applicationId <= 0) {
      setLoadError("올바르지 않은 리얼모델 DB 경로입니다.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(null);

    let canceled = false;

    try {
      const response = await api.get<HospitalEventRealModelDBApiItem>(
        `/hospital-event-real-model-dbs/${applicationId}`,
        {},
        { latestKey: `hospital-event-real-model-dbs:${applicationId}` },
      );

      if (!isApiSuccess(response)) {
        setLoadError(response.error.message || "리얼모델 DB 상세 정보를 불러오지 못했습니다.");
        return;
      }

      setDetail(normalizeHospitalEventRealModelDBDetail(response.data));
    } catch (error) {
      if (isApiRequestCanceledError(error)) {
        canceled = true;
        return;
      }

      setLoadError("리얼모델 DB 상세 정보를 불러오는 중 오류가 발생했습니다.");
    } finally {
      if (!canceled) {
        setLoading(false);
      }
    }
  }, [applicationId]);

  React.useEffect(() => {
    void fetchDetail();
  }, [fetchDetail]);

  const updateStatus = React.useCallback(
    async (status: HospitalEventRealModelDBStatus): Promise<boolean> => {
      if (!detail || detail.status === status || updatingStatus) return false;

      setUpdatingStatus(status);
      setStatusError(null);

      try {
        const response = await api.patch<{ updated_count?: number; status?: string }>("/hospital-event-real-model-dbs/status", {
          ids: [detail.id],
          status,
        });

        if (!isApiSuccess(response)) {
          setStatusError(response.error.message || "승인여부 변경에 실패했습니다.");
          return false;
        }

        setDetail((prev) =>
          prev
            ? {
                ...prev,
                status,
                statusLabel: labelHospitalEventRealModelDBStatus(status),
              }
            : prev,
        );
        return true;
      } catch {
        setStatusError("승인여부 변경 중 오류가 발생했습니다.");
        return false;
      } finally {
        setUpdatingStatus(null);
      }
    },
    [detail, updatingStatus],
  );

  const requestStatusChange = React.useCallback(
    (status: HospitalEventRealModelDBStatus) => {
      if (!detail || detail.status === status || updatingStatus) return;

      setStatusError(null);
      setPendingStatus(status);
    },
    [detail, updatingStatus],
  );

  const closeStatusConfirmModal = React.useCallback(() => {
    if (updatingStatus !== null) return;

    setPendingStatus(null);
  }, [updatingStatus]);

  const confirmStatusChange = React.useCallback(async () => {
    if (!pendingStatus) return;

    const isUpdated = await updateStatus(pendingStatus);
    if (isUpdated) {
      setPendingStatus(null);
    }
  }, [pendingStatus, updateStatus]);

  if (loading) {
    return <SpinnerBlock className="min-h-[60vh]" spinnerClassName="size-10" label="리얼모델 DB 상세 정보를 불러오는 중" />;
  }

  if (loadError || !detail) {
    return (
      <Card className={infoCardClassName}>
        <CardContent className="p-10 text-center text-sm text-rose-600">
          {loadError || "리얼모델 DB 상세 정보가 없습니다."}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <MemberInfoCard
          detail={detail}
          updatingStatus={updatingStatus}
          statusError={statusError}
          onStatusChange={requestStatusChange}
        />

        <MemberImagesCard
          images={detail.images}
          onPreview={(preview) => setPreviewMedia(preview)}
        />

        <div className="grid min-w-0 grid-cols-3 gap-4">
          <InfoPanel title="회원 특이사항">
            <SpecialNotesBlock notes={detail.specialNotes} />
          </InfoPanel>
          <InfoPanel title="리얼모델 지원이유">
            <TextBlock content={detail.applicationReason} />
          </InfoPanel>
          <InfoPanel title="문의사항">
            <TextBlock content={detail.inquiry} />
          </InfoPanel>
        </div>
      </div>

      <HospitalMediaPreviewModal
        preview={previewMedia}
        onChange={setPreviewMedia}
        onClose={() => setPreviewMedia(null)}
      />

      <StatusConfirmModal
        status={pendingStatus}
        updatingStatus={updatingStatus}
        onClose={closeStatusConfirmModal}
        onConfirm={() => void confirmStatusChange()}
      />
    </>
  );
}

function MemberInfoCard({
  detail,
  updatingStatus,
  statusError,
  onStatusChange,
}: {
  detail: HospitalEventRealModelDBDetail;
  updatingStatus: HospitalEventRealModelDBStatus | null;
  statusError: string | null;
  onStatusChange: (status: HospitalEventRealModelDBStatus) => void;
}) {
  return (
    <Card className={`${infoCardClassName} min-h-[18rem]`}>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h2 className={cardTitleClassName}>회원정보</h2>
          <StatusBadge size="sm" color={hospitalEventRealModelDBStatusColor(detail.status)}>
            {detail.statusLabel}
          </StatusBadge>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <StatusButton
            label="승인"
            value="APPROVED"
            currentStatus={detail.status}
            updatingStatus={updatingStatus}
            onStatusChange={onStatusChange}
          />
          <StatusButton
            label="미승인"
            value="REJECTED"
            currentStatus={detail.status}
            updatingStatus={updatingStatus}
            onStatusChange={onStatusChange}
          />
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-[minmax(18rem,0.9fr)_minmax(0,2.2fr)] gap-x-10">
        <div className="min-w-0 border-r border-gray-200 pr-10">
          <div className="space-y-6">
            <InfoRow label="이름" value={<UserLink detail={detail} />} />
            <InfoRow label="전화번호" value={detail.phone} />
            <EventSummaryCard detail={detail} />
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-3 gap-x-8 gap-y-5">
          <InfoRow label="생년월일" value={detail.birthDate} compact />
          <InfoRow label="성별" value={detail.genderLabel} compact />
          <InfoRow label="수술시기" value={detail.surgeryPeriodLabel} compact />
          <InfoRow label="지원부위" value={detail.supportPart} compact />
          <InfoRow label="키" value={detail.heightCm > 0 ? `${detail.heightCm}cm` : "-"} compact />
          <InfoRow label="몸무게" value={detail.weightKg > 0 ? `${detail.weightKg}kg` : "-"} compact />
          <div className="col-span-3">
            <InfoRow label="인스타 주소" value={<ExternalTextLink value={detail.instagramUrl} />} compact />
          </div>
          <div className="col-span-3">
            <InfoRow label="블로그 주소" value={<ExternalTextLink value={detail.blogUrl} />} compact />
          </div>
        </div>
      </div>

      {statusError ? <p className="mt-4 text-sm font-medium text-rose-600">{statusError}</p> : null}
    </Card>
  );
}

function StatusButton({
  label,
  value,
  currentStatus,
  updatingStatus,
  onStatusChange,
}: {
  label: string;
  value: HospitalEventRealModelDBStatus;
  currentStatus: HospitalEventRealModelDBStatus;
  updatingStatus: HospitalEventRealModelDBStatus | null;
  onStatusChange: (status: HospitalEventRealModelDBStatus) => void;
}) {
  const isCurrent = currentStatus === value;

  return (
    <Button
      type="button"
      variant={isCurrent ? "brand" : "outline"}
      size="sm"
      disabled={isCurrent || updatingStatus !== null}
      onClick={() => onStatusChange(value)}
      className="h-9 min-w-16 px-3 text-sm"
    >
      {updatingStatus === value ? "처리중" : label}
    </Button>
  );
}

function StatusConfirmModal({
  status,
  updatingStatus,
  onClose,
  onConfirm,
}: {
  status: HospitalEventRealModelDBStatus | null;
  updatingStatus: HospitalEventRealModelDBStatus | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const statusLabel = status ? labelHospitalEventRealModelDBStatus(status) : "";

  return (
    <Modal
      isOpen={status !== null}
      onClose={onClose}
      showCloseButton={false}
      className="mx-4 w-full max-w-md"
    >
      <ModalPanel>
        <ModalHeader className="pr-0">
          <ModalTitle>승인여부 변경</ModalTitle>
        </ModalHeader>

        <ModalBody className="mt-5">
          <p className="text-sm font-medium text-gray-800">
            해당 리얼모델DB를 {statusLabel}하시겠습니까?
          </p>
        </ModalBody>

        <ModalFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={updatingStatus !== null}
          >
            취소
          </Button>
          <Button
            type="button"
            variant="brand"
            onClick={onConfirm}
            disabled={updatingStatus !== null}
          >
            {updatingStatus !== null ? "처리 중..." : "확인"}
          </Button>
        </ModalFooter>
      </ModalPanel>
    </Modal>
  );
}

function InfoRow({
  label,
  value,
  compact = false,
}: {
  label: string;
  value: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={[
        "grid min-w-0 items-start",
        compact ? "grid-cols-[5.75rem_minmax(0,1fr)] gap-3" : "grid-cols-[8.5rem_minmax(0,1fr)] gap-4",
      ].join(" ")}
    >
      <p className={labelClassName}>{label}</p>
      <div className={`${valueClassName} min-w-0`}>{value}</div>
    </div>
  );
}

function UserLink({ detail }: { detail: HospitalEventRealModelDBDetail }) {
  return (
    <InternalTextLink
      href={detail.accountUserId ? `/users/${detail.accountUserId}` : null}
      value={detail.name}
    />
  );
}

function InternalTextLink({ href, value }: { href?: string | null; value: string }) {
  if (!href || value === "-") return <span>{value}</span>;

  return (
    <Link
      href={href}
      className="underline decoration-gray-300 underline-offset-4 transition hover:text-brand-500 hover:decoration-brand-500"
    >
      {value}
    </Link>
  );
}

function ExternalTextLink({ value }: { value: string }) {
  if (!value || value === "-") return <span>-</span>;

  const href = /^https?:\/\//i.test(value) ? value : `https://${value}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="underline decoration-gray-300 underline-offset-4 transition hover:text-brand-500 hover:decoration-brand-500"
    >
      {value}
    </a>
  );
}

function EventSummaryCard({ detail }: { detail: HospitalEventRealModelDBDetail }) {
  const thumbnailUrl = resolveHospitalEventRealModelDBMediaUrl(detail.eventThumbnailImage, "thumb");
  const content = (
    <>
      <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50 text-[11px] font-semibold text-gray-400">
        {thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- runtime storage URL
          <img src={thumbnailUrl} alt={detail.eventName} className="h-full w-full object-cover" />
        ) : (
          "이벤트"
        )}
      </div>
      <div className="flex min-h-20 min-w-0 flex-1 items-center">
        <p className="truncate text-sm font-semibold text-gray-800">{detail.eventName}</p>
      </div>
    </>
  );
  const className = "flex min-w-0 items-start gap-3 rounded-lg border border-gray-200 bg-white p-3 transition hover:border-brand-200 hover:bg-brand-50/40";

  if (!detail.eventId) {
    return <div className={className}>{content}</div>;
  }

  return (
    <Link
      href={`/events/${detail.eventId}`}
      className={className}
    >
      {content}
    </Link>
  );
}

function MemberImagesCard({
  images,
  onPreview,
}: {
  images: HospitalEventRealModelDBMediaAsset[];
  onPreview: (preview: HospitalMediaPreviewState) => void;
}) {
  const previewIndexByImageIndex = new Map<number, number>();
  const previewItems = images.reduce<HospitalMediaPreviewItem[]>((items, image, index) => {
    const url = resolveHospitalEventRealModelDBMediaUrl(image, "original");
    if (!url || !isImageMedia(image)) return items;

    previewIndexByImageIndex.set(index, items.length);
    items.push({
      url,
      title: realModelImageTitle(index),
      isImage: true,
    });

    return items;
  }, []);

  return (
    <Card className={infoCardClassName}>
      <h3 className={`mb-5 ${cardTitleClassName}`}>회원이미지</h3>
      {images.length > 0 ? (
        <div className="grid grid-flow-col auto-cols-[calc((100%_-_1rem)/2)] gap-4 overflow-x-auto pb-2 md:auto-cols-[calc((100%_-_3rem)/4)]">
          {images.map((image, index) => (
            <RealModelImageTile
              key={String(image.id ?? `real-model-${index}`)}
              image={image}
              index={index}
              previewItems={previewItems}
              previewIndex={previewIndexByImageIndex.get(index) ?? null}
              onPreview={onPreview}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
          등록된 회원 이미지가 없습니다.
        </div>
      )}
    </Card>
  );
}

function RealModelImageTile({
  image,
  index,
  previewItems,
  previewIndex,
  onPreview,
}: {
  image: HospitalEventRealModelDBMediaAsset;
  index: number;
  previewItems: HospitalMediaPreviewItem[];
  previewIndex: number | null;
  onPreview: (preview: HospitalMediaPreviewState) => void;
}) {
  const mediaUrl = resolveHospitalEventRealModelDBMediaUrl(image, "thumb");
  const originalUrl = resolveHospitalEventRealModelDBMediaUrl(image, "original");
  const isImage = isImageMedia(image);
  const badgeText = realModelImageTitle(index);
  const canPreview = Boolean(originalUrl && isImage && previewIndex !== null);

  const handlePreview = () => {
    if (!originalUrl || !isImage || previewIndex === null) return;
    const item = previewItems[previewIndex];
    if (!item) return;

    onPreview({
      ...item,
      items: previewItems,
      index: previewIndex,
    });
  };

  return (
    <button
      type="button"
      onClick={handlePreview}
      disabled={!canPreview}
      className="relative flex aspect-[76/49] min-w-0 items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 text-left disabled:cursor-default"
      aria-label={canPreview ? `${badgeText} 원본보기` : undefined}
    >
      <span className="absolute left-2 top-2 z-10 rounded bg-gray-700 px-2 py-0.5 text-[10px] font-semibold text-white">
        {badgeText}
      </span>
      {mediaUrl && isImage ? (
        <div className="flex h-full w-full items-center justify-center bg-gray-50 p-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- runtime storage URL */}
          <img src={mediaUrl} alt={badgeText} className="h-auto w-auto max-h-full max-w-full object-contain" />
        </div>
      ) : (
        <div className="flex h-full items-center justify-center px-4 text-center text-sm text-gray-500">
          미리보기를 지원하지 않는 파일입니다.
        </div>
      )}
    </button>
  );
}

function realModelImageTitle(index: number) {
  return index === 0 ? "회원이미지" : `회원이미지${index + 1}`;
}

function isImageMedia(media?: HospitalEventRealModelDBMediaAsset | null) {
  const mimeType = media?.mime_type?.trim().toLowerCase();
  if (mimeType) return mimeType.startsWith("image/");

  const mediaUrl = resolveHospitalEventRealModelDBMediaUrl(media, "original");
  if (!mediaUrl) return false;

  return /\.(avif|gif|jpe?g|png|svg|webp)$/i.test(mediaUrl.split("?")[0] ?? "");
}

function InfoPanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={`${infoCardClassName} min-h-[12rem]`}>
      <h3 className={`mb-5 ${cardTitleClassName}`}>{title}</h3>
      {children}
    </Card>
  );
}

function SpecialNotesBlock({
  notes,
}: {
  notes: HospitalEventRealModelDBDetail["specialNotes"];
}) {
  const selectedCodes = new Set(notes.map((note) => note.code));

  return (
    <div className="space-y-3">
      {SPECIAL_NOTE_OPTIONS.map((option) => {
        const selected = selectedCodes.has(option.code);

        return (
          <div key={option.code} className="flex items-center gap-2 text-sm text-gray-700">
            <span
              className={[
                "flex size-4 shrink-0 items-center justify-center rounded border",
                selected ? "border-brand-500 bg-brand-500" : "border-gray-300 bg-white",
              ].join(" ")}
            >
              {selected ? <span className="size-1.5 rounded-full bg-white" /> : null}
            </span>
            <span className={selected ? "font-medium text-gray-800" : "text-gray-500"}>{option.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function TextBlock({
  content,
}: {
  content: string;
}) {
  return <p className="min-h-[144px] whitespace-pre-wrap break-words text-sm leading-7 text-gray-700">{content || "-"}</p>;
}
