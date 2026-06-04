"use client";

import React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { isApiSuccess } from "@beaulab/types";

import { Can } from "@/components/common/guard";
import { api } from "@/lib/common/api";
import { usePageHeaderExtra } from "@/lib/common/routing/page-header-extra";
import {
  getMediaFilename,
  isImageMedia,
  resolveMediaUrl,
  type HospitalDetailResponse,
  type MediaAsset,
} from "@/lib/hospital/detail";
import { labelApprovalStatus } from "@/lib/hospital/list";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ChevronLeft,
  ChevronRight,
  Modal,
  ModalBody,
  ModalHeader,
  ModalPanel,
  ModalTitle,
  MoreVertical,
  SpinnerBlock,
  Star,
  StatusBadge,
} from "@beaulab/ui-admin";

const cardClassName = "rounded-xl border border-gray-200 bg-white p-5";
const labelClassName = "pt-0.5 text-xs font-semibold text-gray-500";
const valueClassName = "min-w-0 break-words text-sm leading-6 text-gray-800";

const dayLabels = [
  ["mon", "월"],
  ["tue", "화"],
  ["wed", "수"],
  ["thu", "목"],
  ["fri", "금"],
  ["sat", "토"],
  ["sun", "일"],
] as const;

type MediaPreviewState = {
  url: string;
  title: string;
  isImage: boolean;
  items?: MediaPreviewItem[];
  index?: number;
};

type MediaPreviewItem = {
  url: string;
  title: string;
  isImage: boolean;
};

const EMPTY_MEDIA_PREVIEW_ITEMS: MediaPreviewItem[] = [];

export default function HospitalDetailPageClient() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawHospitalId = Array.isArray(params.id) ? params.id[0] : params.id;
  const hospitalId = Number(rawHospitalId);

  const [detail, setDetail] = React.useState<HospitalDetailResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [previewMedia, setPreviewMedia] = React.useState<MediaPreviewState | null>(null);

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

  React.useEffect(() => {
    void fetchHospital();
  }, [fetchHospital]);

  usePageHeaderExtra(headerAction);

  if (isLoading) {
    return <SpinnerBlock className="min-h-[60vh]" spinnerClassName="size-10" label="병의원 정보를 불러오는 중" />;
  }

  if (loadError || !detail) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>병의원 정보를 불러오지 못했습니다.</CardTitle>
          <CardDescription>{loadError ?? "병의원 정보를 찾을 수 없습니다."}</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2 pt-0">
          <Button type="button" variant="brand" onClick={() => void fetchHospital()}>
            다시 불러오기
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="min-w-0 space-y-6">
      <section className="grid min-w-0 grid-cols-1 items-stretch gap-3 xl:grid-cols-[20rem_minmax(0,1fr)_19rem]">
        <HospitalLogoCard
          logo={detail.logo ?? null}
          hospitalName={detail.name}
          className="xl:h-full"
          onPreview={setPreviewMedia}
        />

        <div className="grid min-w-0 gap-3">
          <HospitalInfoCard detail={detail} onPreview={setPreviewMedia} />
          <BusinessAccountCard detail={detail} />
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          <PointCard />
          <AdReceptionCard detail={detail} className="xl:flex-1" />
        </div>
      </section>

      <HospitalImagesCard detail={detail} onPreview={setPreviewMedia} />
      <OperationInfoCard detail={detail} />
      <MediaPreviewModal preview={previewMedia} onChange={setPreviewMedia} onClose={() => setPreviewMedia(null)} />
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
  onPreview: (preview: MediaPreviewState) => void;
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
  onPreview,
}: {
  detail: HospitalDetailResponse;
  className?: string;
  onPreview: (preview: MediaPreviewState) => void;
}) {
  const statusHistoryText = buildStatusHistoryText(detail);

  return (
    <Card className={[cardClassName, className].filter(Boolean).join(" ")}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-bold text-gray-900">병의원정보</h2>
          {detail.status && detail.status !== "ACTIVE" ? (
            <StatusBadge size="sm" color={statusBadgeColor(detail.status)}>
              {labelApprovalStatus(detail.status)}
            </StatusBadge>
          ) : null}
          {detail.status && detail.status !== "ACTIVE" && statusHistoryText ? (
            <span className="text-xs text-gray-700">[{statusHistoryText}]</span>
          ) : null}
        </div>
        <button type="button" className="rounded-full p-1 text-gray-700 hover:bg-white" aria-label="병의원 메뉴">
          <MoreVertical className="size-4" />
        </button>
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
      </div>
    </Card>
  );
}

function BusinessAccountCard({ detail, className }: { detail: HospitalDetailResponse; className?: string }) {
  const settlementAccount = detail.business_registration?.settlement_account;

  return (
    <Card className={[cardClassName, className].filter(Boolean).join(" ")}>
      <div className="grid gap-x-8 gap-y-3 md:grid-cols-2">
        <InfoField label="세금계산서 이메일" value={settlementAccount?.tax_invoice_email} className="md:col-span-2" />
        <InfoField label="정산 계좌번호" value={settlementAccountNumber(settlementAccount)} />
        <InfoField label="예금주명" value={settlementAccount?.account_holder} />
      </div>
    </Card>
  );
}

function PointCard({ className }: { className?: string }) {
  return (
    <Card className={[cardClassName, className].filter(Boolean).join(" ")}>
      <div className="flex min-h-[5rem] flex-col justify-between gap-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-gray-900">현재 포인트 잔액</h3>
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
  onPreview: (preview: MediaPreviewState) => void;
}) {
  const gallery = detail.gallery ?? [];
  const previewIndexByGalleryIndex = new Map<number, number>();
  const previewItems = gallery.reduce<MediaPreviewItem[]>((items, media, index) => {
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
  previewItems: MediaPreviewItem[];
  previewIndex: number | null;
  onPreview: (preview: MediaPreviewState) => void;
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
      className="relative flex h-48 min-w-0 items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 text-left disabled:cursor-default"
      aria-label={canPreview ? `${getMediaFilename(media)} 미리보기` : undefined}
    >
      <span className="absolute left-2 top-2 z-10 rounded bg-gray-700 px-2 py-0.5 text-[10px] font-semibold text-white">
        {badgeText}
      </span>
      {isRepresentative ? (
        <span className="absolute right-2 top-2 z-10 rounded-full bg-white/90 p-1 text-brand-500">
          <Star className="size-4 fill-current" />
        </span>
      ) : null}
      {mediaUrl && isImage ? (
        <div className="flex h-full w-full items-center justify-center bg-gray-50 p-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- runtime storage URL */}
          <img src={mediaUrl} alt={getMediaFilename(media)} className="h-auto w-auto max-h-full max-w-full object-contain" />
        </div>
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
      <div className="grid gap-x-14 gap-y-4 lg:grid-cols-2">
        <div className="space-y-4">
          <InfoField label="분과" value={detail.department_label ?? detail.department} />
          <BadgeInfoField label="진료과목" items={categoryLabels(detail.categories)} />
          <BadgeInfoField label="병원정보" items={featureLabels(detail.features)} />
        </div>
        <div className="space-y-4">
          <InfoField label="병원소개" value={detail.description} multiline />
          <InfoField label="진료시간" value={operationHoursSummary(detail)} multiline />
          <InfoField label="오시는길" value={detail.direction} multiline />
        </div>
      </div>
    </Card>
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
      {items.length > 0 ? (
        <div className="flex min-w-0 flex-wrap gap-1.5">
          {items.map((item) => (
            <span
              key={item}
              className="inline-flex max-w-full items-center rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-200"
            >
              <span className="line-clamp-1 break-all">{item}</span>
            </span>
          ))}
        </div>
      ) : (
        <p className={valueClassName}>-</p>
      )}
    </div>
  );
}

function CertificatePreviewField({
  media,
  onPreview,
}: {
  media?: MediaAsset | null;
  onPreview: (preview: MediaPreviewState) => void;
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
            미리보기
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function MediaPreviewModal({
  preview,
  onChange,
  onClose,
}: {
  preview: MediaPreviewState | null;
  onChange: (preview: MediaPreviewState) => void;
  onClose: () => void;
}) {
  const items = preview?.items?.length ? preview.items : EMPTY_MEDIA_PREVIEW_ITEMS;
  const activeIndex = preview?.index ?? 0;
  const canNavigate = Boolean(preview && items.length > 1);

  const navigateTo = React.useCallback(
    (nextIndex: number) => {
      if (!preview || !canNavigate) return;

      const normalizedIndex = (nextIndex + items.length) % items.length;
      const nextItem = items[normalizedIndex];
      if (!nextItem) return;

      onChange({
        ...nextItem,
        items,
        index: normalizedIndex,
      });
    },
    [canNavigate, items, onChange, preview],
  );

  const navigateRelative = React.useCallback(
    (direction: -1 | 1) => {
      navigateTo(activeIndex + direction);
    },
    [activeIndex, navigateTo],
  );

  React.useEffect(() => {
    if (!canNavigate) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        navigateRelative(-1);
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        navigateRelative(1);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [canNavigate, navigateRelative]);

  if (!preview) return null;

  const currentPreview = items[activeIndex] ?? preview;

  return (
    <Modal isOpen={Boolean(preview)} onClose={onClose} className="mx-4 w-full max-w-5xl">
      <ModalPanel className="max-h-[92vh] overflow-hidden">
        <ModalHeader>
          <ModalTitle className="truncate text-base">
            {currentPreview.title}
            {canNavigate ? <span className="ml-2 text-sm font-medium text-gray-500">{activeIndex + 1} / {items.length}</span> : null}
          </ModalTitle>
        </ModalHeader>

        <ModalBody className="min-h-0 overflow-auto rounded-2xl bg-gray-100 p-4">
          {currentPreview.isImage ? (
            <div className="relative flex min-h-[60vh] items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element -- runtime storage URL */}
              <img src={currentPreview.url} alt={currentPreview.title} className="max-h-[76vh] max-w-full object-contain" />
              {canNavigate ? (
                <>
                  <button
                    type="button"
                    onClick={() => navigateRelative(-1)}
                    className="absolute left-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-sm ring-1 ring-gray-200 transition hover:bg-white"
                    aria-label="이전 이미지"
                  >
                    <ChevronLeft className="size-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateRelative(1)}
                    className="absolute right-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-sm ring-1 ring-gray-200 transition hover:bg-white"
                    aria-label="다음 이미지"
                  >
                    <ChevronRight className="size-5" />
                  </button>
                </>
              ) : null}
            </div>
          ) : (
            <iframe
              src={currentPreview.url}
              title={currentPreview.title}
              className="h-[76vh] w-full rounded-xl border border-gray-200 bg-white"
            />
          )}
        </ModalBody>
      </ModalPanel>
    </Modal>
  );
}

function statusBadgeColor(status: string) {
  if (status === "ACTIVE" || status === "APPROVED") return "success" as const;
  if (status === "SUSPENDED" || status === "PENDING") return "warning" as const;
  return "error" as const;
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
    .map((category) => category.full_path?.trim() || category.name?.trim())
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
