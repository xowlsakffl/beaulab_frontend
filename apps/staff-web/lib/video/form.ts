import type { CategorySelectorSection, ExistingMediaItem, MediaCollectionConfig } from "@beaulab/ui-admin";

import { CATEGORY_DOMAINS, CATEGORY_USAGES } from "@/lib/common/category";
import { validateImageFileRuleMessage, type ImageFileValidationRule } from "@/lib/common/media-validation";
import { getVideoMediaFilename, resolveVideoMediaUrl, type VideoDetailResponse, type VideoMediaAsset } from "./detail";

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

export type VideoHashtagOption = {
  id: number;
  name: string;
  status?: string | null;
};

export type VideoFormValues = {
  hospital_id: number | null;
  hospital_name: string;
  hospital_business_number: string;
  doctor_id: number | null;
  doctor_name: string;
  title: string;
  description: string;
  external_video_url: string;
  duration_seconds: string;
  view_count: string;
  like_count: string;
  category_ids: number[];
  hashtag_ids: number[];
  hashtag_names: string[];
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
  external_video_url: "",
  duration_seconds: "",
  view_count: "0",
  like_count: "0",
  category_ids: [],
  hashtag_ids: [],
  hashtag_names: [],
};

export const VIDEO_CATEGORY_SECTIONS: CategorySelectorSection[] = [
  {
    key: "video",
    label: "카테고리",
    domain: CATEGORY_DOMAINS.HOSPITAL_MEDICAL,
    usage: CATEGORY_USAGES.HOSPITAL_VIDEO_CATEGORY,
    searchPlaceholder: "카테고리명을 입력해주세요. (ex. 눈, 코)",
  },
];

export const VIDEO_THUMBNAIL_MAX_BYTES = 5 * 1024 * 1024;
export const VIDEO_THUMBNAIL_ACCEPT = "image/jpeg,image/png";
export const VIDEO_THUMBNAIL_HELPER_TEXT = "jpg, jpeg, png / 최대 5MB";
const VIDEO_THUMBNAIL_VALIDATION_MESSAGE = "썸네일은 jpg, jpeg, png 파일로 최대 5MB 이하만 업로드할 수 있습니다.";

const VIDEO_THUMBNAIL_IMAGE_RULE: ImageFileValidationRule = {
  allowedExtensions: [".jpg", ".jpeg", ".png"],
  allowedMimeTypes: ["image/jpeg", "image/png"],
  maxBytes: VIDEO_THUMBNAIL_MAX_BYTES,
};

export const VIDEO_THUMBNAIL_COLLECTIONS: readonly MediaCollectionConfig<"thumbnail_file">[] = [
  {
    key: "thumbnail_file",
    label: "썸네일",
    accept: VIDEO_THUMBNAIL_ACCEPT,
    multiple: false,
    maxFiles: 1,
    emptyText: "업로드한 썸네일 파일이 없습니다.",
    helperText: VIDEO_THUMBNAIL_HELPER_TEXT,
  },
];

export const FIELD_FOCUS_ORDER: readonly VideoFieldName[] = [
  "hospital_id",
  "doctor_id",
  "category_ids",
  "hashtag_ids",
  "view_count",
  "like_count",
  "duration_seconds",
  "external_video_url",
  "title",
  "description",
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
  "external_video_url",
  "duration_seconds",
  "view_count",
  "like_count",
  "category_ids",
  "hashtag_ids",
  "hashtag_names",
  "thumbnail_file",
] as const;

export function isVideoFieldName(value: string): value is VideoFieldName {
  return (FIELD_NAMES as readonly string[]).includes(value);
}

export function normalizeVideoErrorField(key: string): VideoFieldName | null {
  if (key.startsWith("category_ids")) return "category_ids";
  if (key.startsWith("hashtag_names")) return "hashtag_ids";
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

export async function validateVideoThumbnailFile(file: File): Promise<string | null> {
  return validateImageFileRuleMessage(file, VIDEO_THUMBNAIL_IMAGE_RULE, VIDEO_THUMBNAIL_VALIDATION_MESSAGE);
}

export function buildVideoExistingFileItem(media?: VideoMediaAsset | null): ExistingMediaItem | null {
  const url = resolveVideoMediaUrl(media);
  if (!media || !url) return null;

  return {
    id: media.id ?? getVideoMediaFilename(media),
    url,
    name: getVideoMediaFilename(media),
    size: media.size ?? null,
    isImage:
      media.mime_type?.startsWith("image/") ??
      /\.(png|jpe?g|webp|gif|svg)$/i.test(`${media.path ?? ""} ${media.url ?? ""}`),
  };
}

export type BuildCreateVideoFormDataParams = {
  form: VideoFormValues;
  thumbnailFile: File | null;
};

export function buildCreateVideoFormData({ form, thumbnailFile }: BuildCreateVideoFormDataParams): FormData {
  const formData = new FormData();

  formData.append("hospital_id", String(form.hospital_id));
  formData.append("title", form.title.trim());
  formData.append("description", form.description.trim());

  if (form.doctor_id) {
    formData.append("doctor_id", String(form.doctor_id));
  }

  if (form.external_video_url.trim()) {
    formData.append("external_video_url", form.external_video_url.trim());
  }

  const durationSeconds = parseVideoDurationInput(form.duration_seconds);
  if (durationSeconds !== null) {
    formData.append("duration_seconds", String(durationSeconds));
  }

  form.category_ids.forEach((categoryId) => {
    formData.append("category_ids[]", String(categoryId));
  });

  form.hashtag_ids.forEach((hashtagId) => {
    formData.append("hashtag_ids[]", String(hashtagId));
  });

  form.hashtag_names.forEach((hashtagName) => {
    formData.append("hashtag_names[]", hashtagName.trim());
  });

  if (thumbnailFile) {
    formData.append("thumbnail_file", thumbnailFile);
  }

  return formData;
}

export type BuildUpdateVideoFormDataParams = {
  form: VideoFormValues;
  thumbnailFile: File | null;
  existingThumbnail: ExistingMediaItem | null;
};

export function buildUpdateVideoFormData({
  form,
  thumbnailFile,
  existingThumbnail,
}: BuildUpdateVideoFormDataParams): FormData {
  const formData = new FormData();
  const durationSeconds = parseVideoDurationInput(form.duration_seconds);

  formData.append("_method", "PATCH");
  formData.append("hospital_id", form.hospital_id ? String(form.hospital_id) : "");
  formData.append("doctor_id", form.doctor_id ? String(form.doctor_id) : "");
  formData.append("title", form.title.trim());
  formData.append("description", form.description.trim());
  formData.append("external_video_url", form.external_video_url.trim());
  formData.append("duration_seconds", durationSeconds === null ? "" : String(durationSeconds));
  formData.append("view_count", normalizeIntegerInput(form.view_count));
  formData.append("like_count", normalizeIntegerInput(form.like_count));

  if (form.category_ids.length > 0) {
    form.category_ids.forEach((categoryId) => {
      formData.append("category_ids[]", String(categoryId));
    });
  } else {
    formData.append("category_ids[]", "");
  }

  if (form.hashtag_ids.length > 0) {
    form.hashtag_ids.forEach((hashtagId) => {
      formData.append("hashtag_ids[]", String(hashtagId));
    });
  } else {
    formData.append("hashtag_ids[]", "");
  }

  form.hashtag_names.forEach((hashtagName) => {
    formData.append("hashtag_names[]", hashtagName.trim());
  });

  if (thumbnailFile) {
    formData.append("thumbnail_file", thumbnailFile);
  } else {
    formData.append("existing_thumbnail_file_id", existingMediaId(existingThumbnail));
  }

  return formData;
}

export function mapVideoDetailToForm(detail: VideoDetailResponse): VideoFormValues {
  const hospitalName = detail.hospital_name ?? detail.hospital?.name ?? "";
  const hospitalBusinessNumber = detail.hospital_business_number ?? detail.hospital?.business_number ?? "";
  const doctorName = detail.doctor_name ?? detail.doctor?.name ?? "";

  return {
    ...INITIAL_VIDEO_FORM,
    hospital_id: detail.hospital_id ?? detail.hospital?.id ?? null,
    hospital_name: hospitalName.trim(),
    hospital_business_number: hospitalBusinessNumber.trim(),
    doctor_id: detail.doctor_id ?? detail.doctor?.id ?? null,
    doctor_name: doctorName.trim(),
    title: detail.title ?? "",
    description: detail.description ?? "",
    external_video_url: detail.external_video_url ?? "",
    duration_seconds: formatVideoDurationInput(detail.duration_seconds),
    view_count: String(Number(detail.view_count ?? 0)),
    like_count: String(Number(detail.like_count ?? 0)),
    category_ids: detail.categories?.map((category) => category.id) ?? [],
    hashtag_ids: detail.hashtags?.map((hashtag) => hashtag.id) ?? [],
    hashtag_names: [],
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

export function extractYoutubeVideoId(value?: string | null): string | null {
  const normalized = value?.trim();
  if (!normalized) return null;

  if (/^[A-Za-z0-9_-]{11}$/.test(normalized)) {
    return normalized;
  }

  let url: URL;
  try {
    url = new URL(normalized);
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  const path = url.pathname.replace(/^\/+|\/+$/g, "");

  if (host === "youtu.be" && path) {
    return path.split("/")[0] ?? null;
  }

  if (host === "youtube.com" || host === "m.youtube.com" || host.endsWith(".youtube.com")) {
    const videoId = url.searchParams.get("v");
    if (videoId) {
      return videoId;
    }

    if (path.startsWith("shorts/")) {
      return path.slice("shorts/".length).split("/")[0] ?? null;
    }

    if (path.startsWith("embed/")) {
      return path.slice("embed/".length).split("/")[0] ?? null;
    }
  }

  return null;
}

export function formatVideoDurationInput(value?: number | null): string {
  if (!Number.isFinite(value)) return "";

  const totalSeconds = Math.max(0, Math.floor(Number(value)));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function formatVideoDurationTypingInput(value?: string | null): string {
  const digits = (value ?? "").replace(/\D/g, "").slice(0, 6);
  if (!digits) return "";

  if (digits.length <= 2) {
    return `0:${digits.padStart(2, "0")}`;
  }

  if (digits.length <= 4) {
    const minutes = String(Number(digits.slice(0, -2)));
    const seconds = digits.slice(-2);
    return `${minutes}:${seconds}`;
  }

  const hours = String(Number(digits.slice(0, -4)));
  const minutes = digits.slice(-4, -2);
  const seconds = digits.slice(-2);

  return `${hours}:${minutes}:${seconds}`;
}

export function parseVideoDurationInput(value?: string | null): number | null {
  const normalized = value?.trim();
  if (!normalized) return null;

  if (/^\d+$/.test(normalized)) {
    return Number(normalized);
  }

  const parts = normalized.split(":");
  if (parts.length !== 2 && parts.length !== 3) {
    return null;
  }

  if (parts.some((part) => !/^\d+$/.test(part))) {
    return null;
  }

  if (parts.length === 2) {
    const minutes = Number(parts[0]);
    const seconds = Number(parts[1]);

    if (seconds >= 60) {
      return null;
    }

    return minutes * 60 + seconds;
  }

  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);
  const seconds = Number(parts[2]);

  if (minutes >= 60 || seconds >= 60) {
    return null;
  }

  return hours * 3600 + minutes * 60 + seconds;
}

function validateVideoBaseForm(form: VideoFormValues, validateMetrics: boolean): VideoFormErrors {
  const nextErrors: VideoFormErrors = {};

  if (!form.hospital_id) {
    nextErrors.hospital_id = "병의원을 선택해 주세요.";
  }

  if (!form.title.trim()) {
    nextErrors.title = "제목을 입력해 주세요.";
  }

  if (!form.external_video_url.trim()) {
    nextErrors.external_video_url = "유튜브 링크를 입력해 주세요.";
  }

  if (form.duration_seconds.trim()) {
    const duration = parseVideoDurationInput(form.duration_seconds);
    if (duration === null || duration < 0) {
      nextErrors.duration_seconds = "재생 시간은 10:50 또는 1:10:50 형식으로 입력해 주세요.";
    }
  }

  if (validateMetrics) {
    if (!isNonNegativeIntegerInput(form.view_count)) {
      nextErrors.view_count = "조회수는 0 이상의 숫자로 입력해 주세요.";
    }

    if (!isNonNegativeIntegerInput(form.like_count)) {
      nextErrors.like_count = "좋아요수는 0 이상의 숫자로 입력해 주세요.";
    }
  }

  return nextErrors;
}

export function validateCreateVideoForm(form: VideoFormValues): VideoFormErrors {
  return validateVideoBaseForm(form, false);
}

export function validateUpdateVideoForm(form: VideoFormValues): VideoFormErrors {
  return validateVideoBaseForm(form, true);
}

function existingMediaId(media?: ExistingMediaItem | null) {
  return media?.id ? String(media.id) : "";
}

function normalizeIntegerInput(value?: string | null) {
  const normalized = (value ?? "").trim();

  return /^\d+$/.test(normalized) ? normalized : "0";
}

function isNonNegativeIntegerInput(value?: string | null) {
  return /^\d+$/.test((value ?? "").trim());
}
