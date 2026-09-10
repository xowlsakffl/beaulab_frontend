import type { DoctorDetailResponse } from "@/lib/doctor/detail";
import type { HospitalFeatureItem } from "@/lib/hospital/detail";

export type HospitalEventPreviewContext = {
  hospital_id: number;
  features: HospitalFeatureItem[];
  doctors: Pick<
    DoctorDetailResponse,
    "id" | "name" | "position" | "educations" | "careers" | "etc_contents" | "profile_image"
  >[];
};

export const HOSPITAL_EVENT_PREVIEW_SECTIONS = [
  "procedure_targets",
  "procedure_benefits",
  "before_after_photos",
  "doctor_assignments",
  "side_effect_notice",
] as const;

export type HospitalEventPreviewSection = (typeof HOSPITAL_EVENT_PREVIEW_SECTIONS)[number];
export type HospitalEventPreviewFocus = { section: HospitalEventPreviewSection } | null;

export function getHospitalEventPreviewSection(target: EventTarget | null): HospitalEventPreviewSection | null {
  if (!(target instanceof Element)) return null;
  const field = target.closest<HTMLElement>("[data-preview-section], [data-field-target]");
  const section = field?.dataset.previewSection ?? field?.dataset.fieldTarget;
  return HOSPITAL_EVENT_PREVIEW_SECTIONS.find((value) => value === section) ?? null;
}
