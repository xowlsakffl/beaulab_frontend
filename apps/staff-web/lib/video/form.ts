import type { CategorySelectorSection, ExistingMediaItem, MediaCollectionConfig } from "@beaulab/ui-admin";

export type VideoHospitalOption = {
  id: number;
  name: string;
  business_number?: string | null;
};

export type VideoDoctorOption = {
  id: number;
  name: string;
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
  hospital_id: number;
  hospital_name?: string | null;
  hospital_business_number?: string | null;
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

export type VideoFormValues = {
  hospital_id: number | null;
  hospital_name: string;
  hospital_business_number: string;
  doctor_id: number | null;
  doctor_name: string;
  title: string;
  description: string;
  distribution_channel: string;
  external_video_id: string;
  external_video_url: string;
  duration_seconds: string;
  status: string;
  allow_status: string;
  category_ids: number[];
  publish_start_at: string;
  publish_end_at: string;
  is_publish_period_unlimited: boolean;
};

export type VideoFieldName = keyof VideoFormValues | "thumbnail_file";
export type VideoFormErrors = Partial<Record<VideoFieldName, string>>;

export const INITIAL_VIDEO_FORM: VideoFormValues = {
  hospital_id: null,
  hospital_name: "",
  hospital_business_number: "",
  doctor_id: null,
  doctor_name: "",
  title: "",
  description: "",
  distribution_channel: "YOUTUBE_APP",
  external_video_id: "",
  external_video_url: "",
  duration_seconds: "",
  status: "ACTIVE",
  allow_status: "SUBMITTED",
  category_ids: [],
  publish_start_at: "",
  publish_end_at: "",
  is_publish_period_unlimited: false,
};

export const VIDEO_CATEGORY_SECTIONS: CategorySelectorSection[] = [
  {
    key: "surgery",
    label: "성형",
    domain: "HOSPITAL_SURGERY",
    searchPlaceholder: "카테고리명을 입력해주세요. (ex. 눈, 코)",
  },
  {
    key: "treatment",
    label: "쁘띠/피부",
    domain: "HOSPITAL_TREATMENT",
    searchPlaceholder: "카테고리명을 입력해주세요. (ex. 인모드)",
  },
];

export const VIDEO_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "정상" },
  { value: "INACTIVE", label: "비활성" },
] as const;

export const VIDEO_ALLOW_STATUS_OPTIONS = [
  { value: "SUBMITTED", label: "검수신청" },
  { value: "IN_REVIEW", label: "검수중" },
  { value: "APPROVED", label: "검수완료" },
  { value: "REJECTED", label: "검수반려" },
  { value: "EXCLUDED", label: "게시제외" },
  { value: "PARTNER_CANCELED", label: "신청취소" },
] as const;

export const VIDEO_DISTRIBUTION_OPTIONS = [
  { value: "YOUTUBE_APP", label: "유튜브/앱" },
  { value: "APP", label: "앱" },
] as const;

export const VIDEO_THUMBNAIL_COLLECTIONS: readonly MediaCollectionConfig<"thumbnail_file">[] = [
  {
    key: "thumbnail_file",
    label: "썸네일",
    accept: "image/jpeg,image/png,image/webp",
    multiple: false,
    maxFiles: 1,
    emptyText: "업로드한 썸네일 파일이 없습니다.",
    helperText: "jpg, png, webp / 최대 10MB",
  },
];

export const FIELD_FOCUS_ORDER: readonly VideoFieldName[] = [
  "hospital_id",
  "doctor_id",
  "title",
  "distribution_channel",
  "status",
  "allow_status",
  "category_ids",
  "external_video_url",
  "external_video_id",
  "duration_seconds",
  "publish_start_at",
  "publish_end_at",
  "thumbnail_file",
] as const;

const FIELD_NAMES: readonly VideoFieldName[] = [
  "hospital_id",
  "hospital_name",
  "hospital_business_number",
  "doctor_id",
  "doctor_name",
  "title",
  "description",
  "distribution_channel",
  "external_video_id",
  "external_video_url",
  "duration_seconds",
  "status",
  "allow_status",
  "category_ids",
  "publish_start_at",
  "publish_end_at",
  "is_publish_period_unlimited",
  "thumbnail_file",
] as const;

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

export function isVideoFieldName(value: string): value is VideoFieldName {
  return (FIELD_NAMES as readonly string[]).includes(value);
}

export function normalizeVideoErrorField(key: string): VideoFieldName | null {
  if (key.startsWith("category_ids")) return "category_ids";
  if (key.startsWith("thumbnail_file")) return "thumbnail_file";
  if (isVideoFieldName(key)) return key;
  return null;
}

export function extractVideoFieldErrors(details: unknown): VideoFormErrors {
  if (!details || typeof details !== "object" || !("errors" in details)) {
    return {};
  }

  const rawErrors = (details as { errors?: unknown }).errors;
  if (!rawErrors || typeof rawErrors !== "object") {
    return {};
  }

  const nextErrors: VideoFormErrors = {};

  for (const [key, value] of Object.entries(rawErrors as Record<string, unknown>)) {
    const normalizedField = normalizeVideoErrorField(key);
    if (!normalizedField) continue;

    if (Array.isArray(value)) {
      const firstMessage = value.find((item): item is string => typeof item === "string" && item.trim().length > 0);
      if (firstMessage) {
        nextErrors[normalizedField] = firstMessage;
      }
      continue;
    }

    if (typeof value === "string" && value.trim()) {
      nextErrors[normalizedField] = value.trim();
    }
  }

  return nextErrors;
}

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

export function buildVideoExistingFileItem(media?: VideoMediaAsset | null): ExistingMediaItem | null {
  const url = resolveVideoMediaUrl(media);
  if (!media || !url) return null;

  return {
    id: media.id ?? getVideoMediaFilename(media),
    url,
    name: getVideoMediaFilename(media),
    size: media.size ?? null,
    isImage: media.mime_type?.startsWith("image/") ?? /\.(png|jpe?g|webp|gif|svg)$/i.test(`${media.path ?? ""} ${media.url ?? ""}`),
  };
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

export function mapVideoDetailToForm(detail: VideoDetailResponse): VideoFormValues {
  return {
    ...INITIAL_VIDEO_FORM,
    hospital_id: detail.hospital_id,
    hospital_name: detail.hospital_name?.trim() ?? "",
    hospital_business_number: detail.hospital_business_number?.trim() ?? "",
    doctor_id: detail.doctor_id ?? null,
    doctor_name: detail.doctor_name?.trim() ?? "",
    title: detail.title ?? "",
    description: detail.description ?? "",
    distribution_channel: detail.distribution_channel ?? INITIAL_VIDEO_FORM.distribution_channel,
    external_video_id: detail.external_video_id ?? "",
    external_video_url: detail.external_video_url ?? "",
    duration_seconds: detail.duration_seconds ? String(detail.duration_seconds) : "",
    status: detail.status ?? INITIAL_VIDEO_FORM.status,
    allow_status: detail.allow_status ?? INITIAL_VIDEO_FORM.allow_status,
    category_ids: detail.categories?.map((category) => category.id) ?? [],
    publish_start_at: formatDateTimeInput(detail.publish_start_at),
    publish_end_at: formatDateTimeInput(detail.publish_end_at),
    is_publish_period_unlimited: Boolean(detail.is_publish_period_unlimited),
  };
}

export function formatDateTimeInput(value?: string | null) {
  if (!value) return "";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  const hours = String(parsed.getHours()).padStart(2, "0");
  const minutes = String(parsed.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function validateVideoBaseForm(form: VideoFormValues, requireExternalSource: boolean): VideoFormErrors {
  const nextErrors: VideoFormErrors = {};

  if (!form.hospital_id) {
    nextErrors.hospital_id = "병의원을 선택해 주세요.";
  }

  if (!form.title.trim()) {
    nextErrors.title = "제목을 입력해 주세요.";
  }

  if (!form.distribution_channel) {
    nextErrors.distribution_channel = "배포채널을 선택해 주세요.";
  }

  if (!form.status) {
    nextErrors.status = "운영 상태를 선택해 주세요.";
  }

  if (!form.allow_status) {
    nextErrors.allow_status = "검수 상태를 선택해 주세요.";
  }

  if (requireExternalSource && !form.external_video_id.trim() && !form.external_video_url.trim()) {
    nextErrors.external_video_url = "외부 영상 URL 또는 영상 ID를 입력해 주세요.";
  }

  if (form.duration_seconds.trim()) {
    const duration = Number(form.duration_seconds);
    if (!Number.isFinite(duration) || duration < 0 || !Number.isInteger(duration)) {
      nextErrors.duration_seconds = "재생 시간은 0 이상의 정수만 입력해 주세요.";
    }
  }

  if (!form.is_publish_period_unlimited && form.publish_start_at && form.publish_end_at) {
    const start = new Date(form.publish_start_at);
    const end = new Date(form.publish_end_at);

    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end.getTime() < start.getTime()) {
      nextErrors.publish_end_at = "게시 종료 시각은 시작 시각 이후여야 합니다.";
    }
  }

  return nextErrors;
}

export function validateCreateVideoForm(form: VideoFormValues): VideoFormErrors {
  return validateVideoBaseForm(form, true);
}

export function validateUpdateVideoForm(form: VideoFormValues): VideoFormErrors {
  return validateVideoBaseForm(form, false);
}
