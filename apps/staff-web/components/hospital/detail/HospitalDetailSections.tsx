"use client";

import React from "react";

import { AllowStatusActionButtons } from "@/components/common/AllowStatusControls";
import { Can } from "@/components/common/guard";
import { MediaPreviewItem, MediaPreviewState } from "@/components/common/MediaPreviewModal";
import { OperationHistoryCard as CommonOperationHistoryCard } from "@/components/common/OperationHistoryCard";
import {
  formatHospitalWalletBalance,
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
  MoreVertical,
  Star,
  StatusBadge,
  type DataTableMeta,
} from "@beaulab/ui-admin";

export const hospitalDetailCardClassName = "rounded-xl border border-gray-200 bg-white p-5";

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

export type HospitalOperationHistoryChangeItem = {
  id?: number;
  field_key?: string | null;
  field_label?: string | null;
  before_value?: unknown;
  after_value?: unknown;
  before_display?: string | null;
  after_display?: string | null;
  sort_order?: number | null;
};

export type HospitalOperationHistoryItem = {
  id: number;
  actor_label?: string | null;
  field?: string | null;
  action?: string | null;
  action_label?: string | null;
  changes?: HospitalOperationHistoryChangeItem[] | null;
  before_value?: unknown;
  after_value?: unknown;
  reason?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string | null;
};

export function HospitalLogoCard({
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

export function HospitalInfoCard({
  detail,
  className,
  isActionMenuOpen,
  onToggleActionMenu,
  onCloseActionMenu,
  onOpenSuspendModal,
  onOpenActivateModal,
  statusUpdating,
  onPreview,
}: {
  detail: HospitalDetailResponse;
  className?: string;
  isActionMenuOpen: boolean;
  onToggleActionMenu: () => void;
  onCloseActionMenu: () => void;
  onOpenSuspendModal: () => void;
  onOpenActivateModal: () => void;
  statusUpdating: boolean;
  onPreview: (preview: MediaPreviewState) => void;
}) {
  const statusHistoryText = buildStatusHistoryText(detail);
  const isSuspended = detail.status === "SUSPENDED";
  const cannotChangeStatus = detail.status === "WITHDRAWN" || statusUpdating;
  const statusActionLabel = isSuspended ? "정상노출" : "운영중지";
  const handleStatusAction = isSuspended ? onOpenActivateModal : onOpenSuspendModal;

  return (
    <Card className={[hospitalDetailCardClassName, className].filter(Boolean).join(" ")}>
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
                disabled={cannotChangeStatus}
                onItemClick={onCloseActionMenu}
                onClick={handleStatusAction}
                baseClassName={
                  cannotChangeStatus
                    ? "block w-full cursor-not-allowed px-4 py-2 text-left text-sm font-semibold text-gray-300"
                    : "block w-full px-4 py-2 text-left text-sm font-semibold text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                }
              >
                {statusUpdating ? "처리중" : statusActionLabel}
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

export function BusinessAccountCard({ detail, className }: { detail: HospitalDetailResponse; className?: string }) {
  const settlementAccount = detail.business_registration?.settlement_account;

  return (
    <Card className={[hospitalDetailCardClassName, className].filter(Boolean).join(" ")}>
      <h3 className="mb-5 text-sm font-bold text-gray-900">사업자 계좌정보</h3>
      <div className="grid gap-x-8 gap-y-3 md:grid-cols-2">
        <InfoField label="세금계산서 이메일" value={settlementAccount?.tax_invoice_email} className="md:col-span-2" />
        <InfoField label="정산 계좌번호" value={settlementAccountNumber(settlementAccount)} />
        <InfoField label="예금주명" value={settlementAccount?.account_holder} />
      </div>
    </Card>
  );
}

export function VerifiedAccountContactCard({
  detail,
  className,
}: {
  detail: HospitalDetailResponse;
  className?: string;
}) {
  return (
    <Card className={[hospitalDetailCardClassName, className].filter(Boolean).join(" ")}>
      <h3 className="mb-5 text-sm font-bold text-gray-900">인증된 계정 연락처</h3>
      <div className="space-y-3">
        <InfoField label="전화번호" value={detail.account_hospital?.phone} compact />
      </div>
    </Card>
  );
}

export function AllowStatusCard({
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
    <Card className={[hospitalDetailCardClassName, className].filter(Boolean).join(" ")}>
      <div className="flex min-h-[3.5rem] flex-wrap items-center gap-x-8 gap-y-3">
        <h3 className="text-sm font-bold text-gray-900">검수상태</h3>
        <AllowStatusActionButtons currentStatus={detail.allow_status} disabled={updating} onChange={onChange} />
      </div>
      {error ? <p className="mt-3 text-sm font-medium text-rose-600">{error}</p> : null}
    </Card>
  );
}

export function PointCard({
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
    <Card className={[hospitalDetailCardClassName, className].filter(Boolean).join(" ")}>
      <div className="flex min-h-[5rem] flex-col justify-between gap-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-gray-900">현재 충전금 잔액</h3>
          <Button type="button" variant="brand" size="sm" onClick={onOpenNewEventDBs} className="h-8 px-3 text-xs">
            미확인 DB {newEventDBCount.toLocaleString()}건
          </Button>
        </div>
        <p className="text-right text-base font-bold text-gray-900">
          {formatHospitalWalletBalance(detail.wallet?.total_balance)}
        </p>
      </div>
    </Card>
  );
}

export function AdReceptionCard({ detail, className }: { detail: HospitalDetailResponse; className?: string }) {
  const phones = detail.ad_reception_phones;

  return (
    <Card className={[hospitalDetailCardClassName, "min-h-[9rem]", className].filter(Boolean).join(" ")}>
      <h3 className="mb-5 text-sm font-bold text-gray-900">광고 안내 수신 접수전화번호</h3>
      <div className="space-y-3">
        <InfoField label="[필수] 담당자1" value={phones?.phone_1} compact />
        <InfoField label="[선택] 담당자2" value={phones?.phone_2} compact />
        <InfoField label="[선택] 담당자3" value={phones?.phone_3} compact />
      </div>
    </Card>
  );
}

export function HospitalImagesCard({
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
    <Card className={hospitalDetailCardClassName}>
      <h3 className="mb-4 text-sm font-bold text-gray-900">병의원이미지</h3>
      {gallery.length > 0 ? (
        <div className="grid auto-cols-[calc((100%_-_1rem)/2)] grid-flow-col gap-4 overflow-x-auto pb-2 md:auto-cols-[calc((100%_-_3rem)/4)]">
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

export function OperationInfoCard({ detail }: { detail: HospitalDetailResponse }) {
  return (
    <Card className={hospitalDetailCardClassName}>
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

export function OperationHistoryCard({
  histories,
  meta,
  loading,
  onPageChange,
}: {
  histories: HospitalOperationHistoryItem[];
  meta: DataTableMeta | null;
  loading: boolean;
  onPageChange: (page: number) => void;
}) {
  return (
    <CommonOperationHistoryCard
      histories={histories}
      meta={meta}
      loading={loading}
      onPageChange={onPageChange}
      cardClassName={hospitalDetailCardClassName}
      formatDateTime={formatHospitalDetailDateTime}
      statusLabel={labelApprovalStatus}
      statusBadgeColor={hospitalStatusBadgeColor}
      allowStatusLabel={labelReviewStatus}
      changeValueDisplay={historyChangeDisplay}
    />
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
      className="relative flex aspect-[76/49] min-w-0 items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-white text-left shadow-sm disabled:cursor-default"
      aria-label={canPreview ? `${getMediaFilename(media)} 원본보기` : undefined}
    >
      <span className="absolute top-2 left-2 z-10 rounded bg-gray-700 px-2 py-0.5 text-[10px] font-semibold text-white">
        {badgeText}
      </span>
      {isRepresentative ? (
        <span className="absolute top-3 right-3 z-10 inline-flex size-8 items-center justify-center rounded-full bg-white/90 text-gray-500 shadow-sm">
          <Star className="size-4 fill-yellow-400 text-yellow-500" />
        </span>
      ) : null}
      {mediaUrl && isImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- runtime storage URL
        <img src={mediaUrl} alt={getMediaFilename(media)} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full items-center justify-center px-4 text-center text-sm text-gray-500">
          원본보기를 지원하지 않는 파일입니다.
        </div>
      )}
    </button>
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

function LinkInfoField({ label, href, className }: { label: string; href?: string | null; className?: string }) {
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

function BadgeInfoField({ label, items, compact = false }: { label: string; items: string[]; compact?: boolean }) {
  return (
    <div
      className={
        compact ? "grid grid-cols-[7.25rem_minmax(0,1fr)] gap-3" : "grid grid-cols-[8.5rem_minmax(0,1fr)] gap-4"
      }
    >
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

function settlementAccountNumber(
  account?: {
    bank_name?: string | null;
    account_number?: string | null;
  } | null,
) {
  const parts = [account?.bank_name, account?.account_number].map((item) => item?.trim()).filter(Boolean);

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

  return features.map((feature) => feature.name?.trim()).filter((item): item is string => Boolean(item));
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

export function formatHospitalDetailDateTime(value?: string | null) {
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

function historyChangeDisplay(change: HospitalOperationHistoryChangeItem, side: "before" | "after") {
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
      ? (parsed as Record<string, { start?: unknown; end?: unknown; is_closed?: unknown }>)
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
