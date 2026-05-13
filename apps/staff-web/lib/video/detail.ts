export type VideoHospitalRef = {
  id: number;
  name?: string | null;
  business_number?: string | null;
};

export type VideoDoctorRef = {
  id: number;
  name?: string | null;
  position?: string | null;
};

export type VideoMediaAsset = {
  id?: number | string;
  path?: string | null;
  url?: string | null;
  mime_type?: string | null;
  size?: number | null;
  width?: number | null;
  height?: number | null;
  is_primary?: boolean;
  metadata?: Record<string, unknown> | null;
};

export type VideoCategoryItem = {
  id: number;
  domain?: string | null;
  name: string;
  full_path?: string | null;
  is_primary?: boolean;
};

export type VideoDetailResponse = {
  id: number;
  hospital?: VideoHospitalRef | null;
  hospital_id?: number | null;
  hospital_name?: string | null;
  hospital_business_number?: string | null;
  doctor?: VideoDoctorRef | null;
  doctor_id?: number | null;
  doctor_name?: string | null;
  title: string;
  description?: string | null;
  distribution_channel?: string | null;
  external_video_id?: string | null;
  external_video_url?: string | null;
  thumbnail_file?: VideoMediaAsset | null;
  video_file?: VideoMediaAsset | null;
  duration_seconds?: number | null;
  status?: string | null;
  allow_status?: string | null;
  view_count?: number | null;
  like_count?: number | null;
  allowed_at?: string | null;
  publish_start_at?: string | null;
  publish_end_at?: string | null;
  is_publish_period_unlimited?: boolean | null;
  categories?: VideoCategoryItem[] | null;
  created_at?: string | null;
  updated_at?: string | null;
};

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

export function resolveVideoMediaUrl(media?: VideoMediaAsset | null): string | null {
  const rawUrl = media?.url?.trim();
  if (rawUrl) return rawUrl;

  const rawPath = media?.path?.trim();
  if (!rawPath) return null;
  if (/^https?:\/\//i.test(rawPath)) return rawPath;
  if (!API_BASE_URL) return rawPath;
  if (rawPath.startsWith("/storage/")) return `${API_BASE_URL}${rawPath}`;
  if (rawPath.startsWith("storage/")) return `${API_BASE_URL}/${rawPath}`;
  if (rawPath.startsWith("/")) return `${API_BASE_URL}${rawPath}`;

  return `${API_BASE_URL}/storage/${rawPath}`;
}

export function getVideoMediaFilename(media?: VideoMediaAsset | null) {
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

  return `video-media-${media.id ?? "file"}`;
}

export function formatBytes(bytes?: number | null) {
  if (!Number.isFinite(bytes)) return "";

  const units = ["B", "KB", "MB", "GB"];
  let value = Number(bytes);
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`;
}
