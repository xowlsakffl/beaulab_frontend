import { resolveMediaAssetUrl, type MediaVariantPreference } from "@/lib/common/media";

export type MediaAsset = {
  id?: number | string;
  path?: string | null;
  url?: string | null;
  mime_type?: string | null;
  size?: number | null;
  width?: number | null;
  height?: number | null;
  sort_order?: number | null;
  is_primary?: boolean;
  metadata?: unknown;
};

export type BusinessRegistrationAsset = {
  business_number?: string | null;
  company_name?: string | null;
  ceo_name?: string | null;
  business_type?: string | null;
  business_item?: string | null;
  business_address?: string | null;
  business_address_detail?: string | null;
  settlement_account?: {
    bank_name?: string | null;
    account_number?: string | null;
    account_holder?: string | null;
    tax_invoice_email?: string | null;
  } | null;
  issued_at?: string | null;
  certificate_media?: MediaAsset | null;
};

export type HospitalOperationHours = Record<
  "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun",
  {
    start?: string | null;
    end?: string | null;
    is_closed?: boolean | null;
  }
>;

export type AccountHospitalAsset = {
  id?: number | null;
  name?: string | null;
  nickname?: string | null;
  email?: string | null;
  status?: string | null;
  last_login_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type HospitalCategoryItem = {
  id: number;
  domain?: string | null;
  parent_id?: number | null;
  depth?: number | null;
  name: string;
  full_path?: string | null;
  is_primary?: boolean;
};

export type HospitalFeatureItem = {
  id: number;
  code: string;
  name: string;
  sort_order?: number;
  status?: string;
};

export type HospitalStatusHistory = {
  id?: number | null;
  actor_label?: string | null;
  before_value?: string | null;
  after_value?: string | null;
  reason?: string | null;
  created_at?: string | null;
};

export type HospitalDetailResponse = {
  id: number;
  name: string;
  department?: string | null;
  department_label?: string | null;
  description?: string | null;
  address?: string | null;
  address_detail?: string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
  tel?: string | null;
  ad_reception_phones?: {
    phone_1?: string | null;
    phone_2?: string | null;
    phone_3?: string | null;
  } | null;
  email?: string | null;
  consulting_hours?: string | null;
  operation_hours?: HospitalOperationHours | null;
  direction?: string | null;
  allow_status?: string | null;
  status?: string | null;
  latest_status_history?: HospitalStatusHistory | null;
  logo?: MediaAsset | null;
  gallery?: MediaAsset[] | null;
  categories?: HospitalCategoryItem[] | null;
  features?: HospitalFeatureItem[] | null;
  business_registration?: BusinessRegistrationAsset | null;
  account_hospital?: AccountHospitalAsset | null;
  view_count?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export function resolveMediaUrl(
  media?: MediaAsset | null,
  preferredVariant: MediaVariantPreference = "original",
): string | null {
  return resolveMediaAssetUrl(media, preferredVariant);
}

export function formatBytes(bytes?: number | null) {
  if (!bytes || !Number.isFinite(bytes)) return "";

  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`;
}

export function getMediaFilename(media?: MediaAsset | null) {
  if (!media) return "";

  const rawPath = media.path?.trim();
  if (rawPath) {
    const fileName = rawPath.split("/").filter(Boolean).pop();
    if (fileName) return fileName;
  }

  const rawUrl = media.url?.trim();
  if (rawUrl) {
    const cleanUrl = rawUrl.split("?")[0];
    const fileName = cleanUrl.split("/").filter(Boolean).pop();
    if (fileName) return fileName;
  }

  return `media-${media.id ?? "file"}`;
}

export function isImageMedia(media?: MediaAsset | null) {
  if (!media) return false;
  if (media.mime_type?.startsWith("image/")) return true;

  const candidate = `${media.path ?? ""} ${media.url ?? ""}`;
  return /\.(png|jpe?g|webp|gif|svg)$/i.test(candidate);
}
