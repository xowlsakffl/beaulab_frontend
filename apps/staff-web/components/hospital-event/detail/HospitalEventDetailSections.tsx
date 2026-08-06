"use client";

import React from "react";

import { AdminNoteCreateModal as NoteCreateModal } from "@/components/common/AdminNoteCreateModal";
import { AdminNotesCard as CommonAdminNotesCard } from "@/components/common/AdminNotesCard";
import { AllowStatusActionButtons } from "@/components/common/AllowStatusControls";
import { OperationHistoryCard as CommonOperationHistoryCard } from "@/components/common/OperationHistoryCard";
import type { MediaPreviewState } from "@/components/common/MediaPreviewModal";
import { HOSPITAL_EVENT_PAGE_IMAGE_HELPER_TEXT, HOSPITAL_EVENT_THUMBNAIL_HELPER_TEXT } from "@/lib/hospital-event/form";
import {
  formatHospitalEventPoint,
  formatHospitalEventPrice,
  hospitalEventAdminStatusColor,
  hospitalEventAllowStatusColor,
  hospitalEventHospitalStatusColor,
  labelHospitalEventAdminStatus,
  labelHospitalEventAllowStatus,
  labelHospitalEventHospitalStatus,
  resolveHospitalEventMediaUrl,
  type HospitalEventApiItem,
  type HospitalEventCategory,
  type HospitalEventMedia,
} from "@/lib/hospital-event/list";
import { Button, Card, CategoryBadgeList, StatusBadge, type DataTableMeta } from "@beaulab/ui-admin";

export { NoteCreateModal };

export type AdminNoteItem = {
  id: number;
  note?: string | null;
  creator_name?: string | null;
  created_at?: string | null;
};

export type OperationHistoryChangeItem = {
  id?: number;
  field_key?: string | null;
  field_label?: string | null;
  before_value?: unknown;
  after_value?: unknown;
  before_display?: string | null;
  after_display?: string | null;
  sort_order?: number | null;
};

export type OperationHistoryItem = {
  id: number;
  actor_label?: string | null;
  field?: string | null;
  action?: string | null;
  action_label?: string | null;
  changes?: OperationHistoryChangeItem[] | null;
  before_value?: unknown;
  after_value?: unknown;
  reason?: string | null;
  created_at?: string | null;
};

const cardClassName = "rounded-xl border border-gray-200 bg-white p-5";
const labelClassName = "text-xs font-semibold text-gray-500";
const valueClassName = "min-w-0 break-words text-sm leading-6 text-gray-800";

export function EventMainCard({
  detail,
  updating,
  onAdminStatusChange,
}: {
  detail: HospitalEventApiItem;
  updating: boolean;
  onAdminStatusChange: (status: "NORMAL" | "FORCED_STOPPED") => void;
}) {
  const categoryBadges = eventCategoryBadges(detail.categories);
  const primaryCategory = detail.categories?.find((category) => category.is_primary) ?? detail.categories?.[0] ?? null;
  const eventTypeLabel = inferEventSectionLabel(detail.categories);
  const isForcedStopped = detail.admin_status === "FORCED_STOPPED";

  return (
    <Card className={cardClassName}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="truncate text-sm font-bold text-gray-900">{eventTypeLabel} 이벤트</h2>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={updating}
          className="h-9 min-w-24 shrink-0 px-4 text-sm"
          onClick={() => onAdminStatusChange(isForcedStopped ? "NORMAL" : "FORCED_STOPPED")}
        >
          {isForcedStopped ? "정상노출" : "강제중지"}
        </Button>
        <span className="sr-only">현재 강제중지 상태: {labelHospitalEventAdminStatus(detail.admin_status)}</span>
      </div>

      <div className="space-y-4">
        <ReadonlyField label="병의원" value={detail.hospital?.name} />
        <ReadonlyField
          label="대표 카테고리"
          value={primaryCategory ? categoryFullPath(primaryCategory) : "-"}
          customValue={<CategoryBadgeList values={primaryCategory ? [categoryFullPath(primaryCategory)] : ["-"]} />}
        />
        <ReadonlyField
          label="선택한 카테고리"
          value="-"
          customValue={<CategoryBadgeList values={categoryBadges.map((category) => category.label)} />}
        />
        <ReadonlyField label="의료진 선택" value="-" customValue={<DoctorBadgeList detail={detail} />} />
        <ReadonlyField label="이벤트명" value={detail.name} />
        <ReadonlyField label="이벤트설명" value={detail.description} />
        <ReadonlyField label="이벤트기간" value={eventPeriodLabel(detail)} />
        <PriceSummaryCard detail={detail} />
      </div>
    </Card>
  );
}

export function EventInfoSummaryCard({ detail }: { detail: HospitalEventApiItem }) {
  return (
    <Card className={cardClassName}>
      <h3 className="mb-4 border-b border-gray-200 pb-3 text-sm font-bold text-gray-900">이벤트 정보</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <ReadonlyMini label="등록일자" value={formatDate(detail.created_at)} />
        <ReadonlyMini label="최근수정일" value={formatDate(detail.updated_at)} />
        <ReadonlyMini label="공개여부" value={labelHospitalEventHospitalStatus(detail.hospital_status)} />
      </div>
    </Card>
  );
}

export function AllowStatusCard({
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
        <AllowStatusActionButtons currentStatus={detail.allow_status} disabled={updating} onChange={onChange} />
      </div>
    </Card>
  );
}

export function AdminNotesCard({
  notes,
  loading,
  onAdd,
}: {
  notes: AdminNoteItem[];
  loading: boolean;
  onAdd: () => void;
}) {
  return (
    <CommonAdminNotesCard
      notes={notes}
      loading={loading}
      onAdd={onAdd}
      formatDateTime={formatDateTime}
      className={cardClassName}
    />
  );
}

export function OperationHistoryCard({
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
  return (
    <CommonOperationHistoryCard
      histories={histories}
      meta={meta}
      loading={loading}
      onPageChange={onPageChange}
      cardClassName={cardClassName}
      formatDateTime={formatDateTime}
      changeValueDisplay={historyChangeDisplay}
    />
  );
}

export function EventMediaColumn({
  detail,
  onPreview,
}: {
  detail: HospitalEventApiItem;
  onPreview: (preview: MediaPreviewState) => void;
}) {
  return (
    <div className="min-w-0 space-y-4">
      <MediaPreviewCard
        title="썸네일"
        helper={HOSPITAL_EVENT_THUMBNAIL_HELPER_TEXT}
        media={detail.thumbnail_image ?? null}
        onPreview={onPreview}
      />
      {detail.event_type === "IMAGE" ? (
        <MediaPreviewCard
          title="이벤트 페이지"
          helper={HOSPITAL_EVENT_PAGE_IMAGE_HELPER_TEXT}
          media={detail.event_page_image ?? null}
          onPreview={onPreview}
          tall
        />
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
  onPreview: (preview: MediaPreviewState) => void;
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
          <img
            src={mediaUrl}
            alt={title}
            className={tall ? "h-auto max-h-[32rem] w-full object-contain" : "h-full w-full object-cover"}
          />
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
        <ReadonlyField
          label="상담신청단가"
          value={formatHospitalEventPoint(Number(detail.consultation_price ?? 0))}
          compact
        />
      </div>
    </div>
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
    <div
      className={
        compact
          ? "grid grid-cols-[7rem_minmax(0,1fr)] items-start gap-3"
          : "grid grid-cols-[8rem_minmax(0,1fr)] items-start gap-4"
      }
    >
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

  if (isStatusHistoryField(field)) {
    return historyStatusBadge(field, value, display);
  }

  if (typeof display === "string" && display.trim() !== "") {
    return historyRawValueLabel(field, display);
  }

  return historyRawValueLabel(field, value);
}

function isStatusHistoryField(field: string | null) {
  return field === "admin_status" || field === "hospital_status" || field === "allow_status";
}

function historyStatusBadge(field: string | null, value: unknown, display?: string | null) {
  const normalizedValue = String(value ?? "").trim();
  const displayValue = display?.trim() || normalizedValue;
  const label = historyRawValueLabel(field, displayValue);

  if (label === "-") {
    return "-";
  }

  return (
    <StatusBadge
      size="sm"
      color={historyStatusBadgeColor(field, normalizedValue || displayValue)}
      className="h-5 px-2 text-xs leading-none"
    >
      {label}
    </StatusBadge>
  );
}

function historyStatusBadgeColor(field: string | null, value: string) {
  if (field === "admin_status") {
    return hospitalEventAdminStatusColor(value);
  }

  if (field === "hospital_status") {
    return hospitalEventHospitalStatusColor(value);
  }

  return hospitalEventAllowStatusColor(value);
}

function historyRawValueLabel(field: string | null, value: unknown) {
  if (field === "hospital_status") {
    return labelHospitalEventHospitalStatus(String(value ?? ""));
  }

  if (field === "admin_status") {
    return labelHospitalEventAdminStatus(String(value ?? ""));
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
