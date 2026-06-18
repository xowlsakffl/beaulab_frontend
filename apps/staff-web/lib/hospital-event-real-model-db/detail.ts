import {
  formatHospitalEventRealModelDBDateTime,
  labelHospitalEventRealModelDBStatus,
  type HospitalEventRealModelDBApiItem,
  type HospitalEventRealModelDBMediaAsset,
  type HospitalEventRealModelDBStatus,
} from "./list";

export type HospitalEventRealModelDBDetail = {
  id: number;
  createdAt: string;
  updatedAt: string;
  hospitalId: number | null;
  hospitalName: string;
  eventId: number | null;
  eventName: string;
  eventNormalPrice: number;
  eventPrice: number;
  eventThumbnailImage: HospitalEventRealModelDBMediaAsset | null;
  accountUserId: number | null;
  accountUserNickname: string;
  accountUserEmail: string;
  name: string;
  genderLabel: string;
  birthDate: string;
  phone: string;
  heightCm: number;
  weightKg: number;
  surgeryPeriodLabel: string;
  supportPart: string;
  instagramUrl: string;
  blogUrl: string;
  specialNotes: Array<{
    code: string;
    label: string;
  }>;
  applicationReason: string;
  inquiry: string;
  status: HospitalEventRealModelDBStatus;
  statusLabel: string;
  images: HospitalEventRealModelDBMediaAsset[];
};

export function normalizeHospitalEventRealModelDBDetail(
  item: HospitalEventRealModelDBApiItem,
): HospitalEventRealModelDBDetail {
  const status = normalizeStatus(item.status?.code);

  return {
    id: Number(item.id ?? 0),
    createdAt: formatHospitalEventRealModelDBDateTime(item.created_at),
    updatedAt: formatHospitalEventRealModelDBDateTime(item.updated_at),
    hospitalId: normalizeNullableId(item.hospital?.id),
    hospitalName: item.hospital?.name?.trim() || "-",
    eventId: normalizeNullableId(item.event?.id),
    eventName: item.event?.name?.trim() || "-",
    eventNormalPrice: Number(item.event?.normal_price ?? 0),
    eventPrice: Number(item.event?.event_price ?? 0),
    eventThumbnailImage: item.event?.thumbnail_image ?? null,
    accountUserId: normalizeNullableId(item.account_user?.id),
    accountUserNickname: item.account_user?.nickname?.trim() || "-",
    accountUserEmail: item.account_user?.email?.trim() || "-",
    name: item.name?.trim() || "-",
    genderLabel: item.gender?.label?.trim() || "-",
    birthDate: formatDate(item.birth_date),
    phone: item.phone?.trim() || item.phone_normalized?.trim() || "-",
    heightCm: Number(item.height_cm ?? 0),
    weightKg: Number(item.weight_kg ?? 0),
    surgeryPeriodLabel: item.surgery_period?.label?.trim() || "-",
    supportPart: item.support_part?.trim() || "-",
    instagramUrl: item.instagram_url?.trim() || "-",
    blogUrl: item.blog_url?.trim() || "-",
    specialNotes: normalizeSpecialNotes(item.special_notes),
    applicationReason: item.application_reason?.trim() || "-",
    inquiry: item.inquiry?.trim() || "-",
    status,
    statusLabel: item.status?.label?.trim() || labelHospitalEventRealModelDBStatus(status),
    images: Array.isArray(item.images) ? item.images.filter((image) => Number(image?.id ?? 0) > 0) : [],
  };
}

function normalizeStatus(value?: string | null): HospitalEventRealModelDBStatus {
  if (value === "APPROVED" || value === "REJECTED") return value;

  return "RECEIVED";
}

function normalizeSpecialNotes(value: HospitalEventRealModelDBApiItem["special_notes"]) {
  if (!Array.isArray(value)) return [];

  return value
    .map((note) => ({
      code: note?.code?.trim() || "",
      label: note?.label?.trim() || note?.code?.trim() || "",
    }))
    .filter((note) => note.label);
}

function normalizeNullableId(value: number | null | undefined) {
  const id = Number(value ?? 0);

  return Number.isInteger(id) && id > 0 ? id : null;
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return value;

  return `${match[1]}-${match[2]}-${match[3]}`;
}
