"use client";

import { formatOperationHistoryValue } from "@/lib/common/operation-history";
import React from "react";
import { HospitalEventBeforeAfterPhotoPair } from "../form/HospitalEventBeforeAfterPhotos";
import { mapBeforeAfterPhotos } from "@/lib/hospital-event/before-after-photos";

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
import {
  Button,
  Card,
  CategoryBadgeList,
  DataTable,
  FormCheckbox,
  type DataTableColumn,
  type DataTableMeta,
  StatusValueBadge,
} from "@beaulab/ui-admin";

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
  canUpdateStatus,
  updating,
  onAdminStatusChange,
  onPreview,
}: {
  detail: HospitalEventApiItem;
  canUpdateStatus: boolean;
  updating: boolean;
  onAdminStatusChange: (status: "NORMAL" | "FORCED_STOPPED") => void;
  onPreview: (preview: MediaPreviewState) => void;
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
        {canUpdateStatus ? (
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
        ) : (
          <StatusValueBadge
            label={labelHospitalEventAdminStatus(detail.admin_status)}
            color={hospitalEventAdminStatusColor(detail.admin_status)}
          />
        )}
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
        {detail.event_type === "TEXT" ? (
          <>
            <ReadonlyField label="시술 대상" customValue={<ReadonlyTextList items={detail.procedure_targets} />} />
            <ReadonlyField label="시술 장점" customValue={<ReadonlyTextList items={detail.procedure_benefits} />} />
            <ReadonlyField
              label="전후사진"
              customValue={
                detail.before_after_photos?.length ? (
                  <div className="grid grid-cols-2 gap-3">
                    {mapBeforeAfterPhotos(detail.before_after_photos).map((photo, index) => (
                      <HospitalEventBeforeAfterPhotoPair
                        key={photo.key}
                        photo={photo}
                        index={index}
                        onPreview={onPreview}
                        labelVariant="overlay"
                      />
                    ))}
                  </div>
                ) : (
                  "-"
                )
              }
            />
          </>
        ) : null}
        {detail.event_type === "IMAGE" && detail.has_options && Boolean(detail.options?.length) ? (
          <EventOptionsTable options={detail.options ?? []} />
        ) : null}
        <ReadonlyField
          label="부작용안내"
          customValue={<p className="whitespace-pre-wrap">{displayValue(detail.side_effect_notice)}</p>}
        />
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
  canUpdateStatus,
  updating,
  onChange,
}: {
  detail: HospitalEventApiItem;
  canUpdateStatus: boolean;
  updating: boolean;
  onChange: (status: string) => void;
}) {
  return (
    <Card className={cardClassName}>
      <div className="border-b border-gray-200 pb-3">
        <h3 className="text-sm font-bold text-gray-900">검수상태</h3>
      </div>
      <div className="mt-4">
        {canUpdateStatus ? (
          <AllowStatusActionButtons currentStatus={detail.allow_status} disabled={updating} onChange={onChange} />
        ) : (
          <StatusValueBadge
            label={labelHospitalEventAllowStatus(detail.allow_status)}
            color={hospitalEventAllowStatusColor(detail.allow_status)}
          />
        )}
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
  onAdd?: (() => void) | null;
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
  error,
  onPageChange,
}: {
  histories: OperationHistoryItem[];
  meta: DataTableMeta | null;
  loading: boolean;
  error?: string | null;
  onPageChange: (page: number) => void;
}) {
  return (
    <CommonOperationHistoryCard
      histories={histories}
      meta={meta}
      loading={loading}
      error={error}
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
  textPreview,
}: {
  detail: HospitalEventApiItem;
  onPreview: (preview: MediaPreviewState) => void;
  textPreview?: React.ReactNode;
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
      ) : detail.event_type === "TEXT" ? (
        textPreview
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
    <ReadonlyField
      label="가격"
      customValue={
        <div className="space-y-2 [&>label]:opacity-100">
          <div className="grid grid-cols-[minmax(0,1fr)_4.75rem] items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3">
            <div className="min-w-0 space-y-3">
              <ReadonlyField
                label="정상 가격"
                value={formatHospitalEventPrice(Number(detail.normal_price ?? 0))}
                compact
              />
              <ReadonlyField
                label="이벤트 가격"
                value={formatHospitalEventPrice(Number(detail.event_price ?? 0))}
                compact
              />
              <ReadonlyField
                label="상담신청단가"
                value={formatHospitalEventPoint(Number(detail.consultation_price ?? 0))}
                compact
              />
            </div>
            <div className="flex h-11 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-xs font-semibold text-brand-500">
              할인율 {discountRate}%
            </div>
          </div>
          <FormCheckbox
            id={`event-${detail.id}-vat`}
            checked
            disabled
            label={detail.is_vat_included ? "VAT 포함" : "VAT 비대상"}
            onChange={() => {}}
            className="disabled:checked:border-brand-500 disabled:checked:bg-brand-500!"
          />
        </div>
      }
    />
  );
}

type EventOption = NonNullable<HospitalEventApiItem["options"]>[number];

const optionColumns: DataTableColumn<EventOption>[] = [
  {
    key: "name",
    header: "옵션명",
    headerClassName: "bg-gray-50 px-2 py-2 text-left font-semibold text-gray-600",
    cellClassName: "px-2 py-2 align-middle break-words text-gray-700",
    render: (option) => displayValue(option.name),
  },
  {
    key: "session_count",
    header: "회차",
    headerClassName: "w-10 bg-gray-50 px-1 py-2 text-center font-semibold text-gray-600",
    cellClassName: "px-1 py-2 text-center align-middle text-gray-700",
    render: (option) => (option.session_count == null ? "-" : `${option.session_count.toLocaleString()}회`),
  },
  {
    key: "normal_price",
    header: "정가",
    headerClassName: "w-20 bg-gray-50 px-1 py-2 text-left font-semibold text-gray-600",
    cellClassName: "px-1 py-2 align-middle break-words text-gray-700 tabular-nums",
    render: (option) => (option.normal_price == null ? "-" : formatHospitalEventPrice(option.normal_price)),
  },
  {
    key: "event_price",
    header: "할인가",
    headerClassName: "w-28 bg-gray-50 px-1 py-2 text-left font-semibold text-gray-600",
    cellClassName: "px-1 py-2 align-middle break-words text-gray-700 tabular-nums",
    render: (option) => (
      <div className="grid grid-cols-[minmax(0,1fr)_2rem] items-center gap-1">
        <span>{option.event_price == null ? "-" : formatHospitalEventPrice(option.event_price)}</span>
        {option.discount_rate != null ? (
          <span className="text-right font-medium text-brand-500">{option.discount_rate}%</span>
        ) : null}
      </div>
    ),
  },
];

function EventOptionsTable({ options }: { options: EventOption[] }) {
  const rows = options.map((option, index) => ({ ...option, key: option.id ?? index }));

  return (
    <ReadonlyField
      label="이벤트 옵션"
      customValue={
        <div className="[&>div]:rounded-lg">
          <DataTable
            columns={optionColumns}
            rows={rows}
            getRowKey={(row) => row.key}
            tableClassName="w-full table-fixed text-left leading-5 [&_td]:h-10 [&_td]:text-[11px] [&_thead]:border-gray-200"
          />
        </div>
      }
    />
  );
}

function ReadonlyTextList({ items }: { items?: string[] | null }) {
  const values = (items ?? []).filter((item) => item.trim());
  if (values.length === 0) return <>-</>;

  return (
    <ol className="list-decimal space-y-2 pl-5">
      {values.map((item, index) => (
        <li key={index} className="whitespace-pre-wrap">
          {item}
        </li>
      ))}
    </ol>
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
          ? "grid grid-cols-[5.5rem_minmax(0,1fr)] items-start gap-2"
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
  if (usage === "HOSPITAL_EVENT_PROMOTION") return "기획전";
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

  if (Array.isArray(value) && value.length === 0) return "-";

  if (
    field === "consultation_price" &&
    value !== null &&
    value !== undefined &&
    value !== "" &&
    Number.isFinite(Number(value))
  ) {
    return `${Number(value).toLocaleString("ko-KR")}P`;
  }

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
    <StatusValueBadge
      label={label}
      color={historyStatusBadgeColor(field, normalizedValue || displayValue)}
      className="h-5 px-2 text-xs leading-none"
    />
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
    return label === "-" ? formatOperationHistoryValue(value) : label;
  }

  return formatOperationHistoryValue(value);
}
