import { resolveMediaAssetUrl, type MediaVariantPreference } from "@/lib/common/media";
import type { HospitalEntryAllowStatusValue } from "@/lib/hospital-entry/list";

export type HospitalEntryMediaAsset = {
  id?: number | string | null;
  collection?: string | null;
  disk?: string | null;
  path?: string | null;
  url?: string | null;
  mime_type?: string | null;
  size?: number | null;
  width?: number | null;
  height?: number | null;
  sort_order?: number | null;
  is_primary?: boolean | null;
  metadata?: unknown;
};

export type HospitalEntryDetailResponse = {
  id: number;
  hospital_name?: string | null;
  hospital_phone?: string | null;
  address?: string | null;
  address_detail?: string | null;
  business_number?: string | null;
  business_registration_file?: HospitalEntryMediaAsset | null;
  ceo_name?: string | null;
  license_number?: string | null;
  license_file?: HospitalEntryMediaAsset | null;
  applicant_name?: string | null;
  applicant_position?: string | null;
  applicant_phone?: string | null;
  applicant_email?: string | null;
  allow_status?: HospitalEntryAllowStatusValue | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export function resolveHospitalEntryMediaUrl(
  media?: HospitalEntryMediaAsset | null,
  preferredVariant: MediaVariantPreference = "original",
) {
  return resolveMediaAssetUrl(media, preferredVariant);
}

export function getHospitalEntryMediaFilename(media?: HospitalEntryMediaAsset | null) {
  if (!media) return "";

  const originalName = metadataOriginalName(media.metadata);
  if (originalName) return originalName;

  const rawPath = media.path?.trim();
  if (rawPath) {
    const fileName = rawPath.split("/").filter(Boolean).pop();
    if (fileName) return fileName;
  }

  const rawUrl = media.url?.trim();
  if (rawUrl) {
    const fileName = rawUrl.split("?")[0].split("/").filter(Boolean).pop();
    if (fileName) return fileName;
  }

  return `hospital-entry-file-${media.id ?? "file"}`;
}

export function isHospitalEntryImageMedia(media?: HospitalEntryMediaAsset | null) {
  if (!media) return false;
  if (media.mime_type?.startsWith("image/")) return true;

  const candidate = `${media.path ?? ""} ${media.url ?? ""}`;
  return /\.(avif|gif|jpe?g|png|svg|webp)$/i.test(candidate);
}

export function formatHospitalEntryBytes(bytes?: number | null) {
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

function metadataOriginalName(metadata: unknown) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return "";

  const originalName = (metadata as { original_name?: unknown }).original_name;
  return typeof originalName === "string" ? originalName.trim() : "";
}
