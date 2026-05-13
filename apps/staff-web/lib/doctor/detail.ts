export type DoctorMediaAsset = {
  id?: number | string;
  path?: string | null;
  url?: string | null;
  mime_type?: string | null;
  size?: number | null;
};

export type DoctorCategoryItem = {
  id: number;
  domain?: string | null;
  name: string;
  full_path?: string | null;
  is_primary?: boolean;
};

export type DoctorDetailResponse = {
  id: number;
  hospital_id: number;
  hospital_name?: string | null;
  hospital_business_number?: string | null;
  name: string;
  gender?: string | null;
  position?: string | null;
  career_started_at?: string | null;
  license_number?: string | null;
  is_specialist?: boolean | null;
  status?: string | null;
  allow_status?: string | null;
  educations?: string[] | null;
  careers?: string[] | null;
  etc_contents?: string[] | null;
  categories?: DoctorCategoryItem[] | null;
  profile_image?: DoctorMediaAsset | null;
  license_image?: DoctorMediaAsset | null;
  specialist_certificate_image?: DoctorMediaAsset | null;
  education_certificate_image?: DoctorMediaAsset[] | null;
  etc_certificate_image?: DoctorMediaAsset[] | null;
  view_count?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

export function resolveDoctorMediaUrl(media?: DoctorMediaAsset | null): string | null {
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

export function getDoctorMediaFilename(media?: DoctorMediaAsset | null) {
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

  return `doctor-media-${media.id ?? "file"}`;
}
