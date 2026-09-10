import { validateImageFileRuleMessage } from "@/lib/common/media-validation";
import type { HospitalEventApiItem, HospitalEventMedia } from "./list";

export const BEFORE_AFTER_PHOTO_MAX_COUNT = 4;
export const BEFORE_AFTER_PHOTO_HELPER = "jpg, jpeg, png / 5MB";
export const BEFORE_AFTER_PHOTO_SIDES = [
  { key: "before", label: "전" },
  { key: "after", label: "후" },
] as const;
export type BeforeAfterPhotoSide = "before" | "after";
export type HospitalEventPhotoInput = { file: File | null; media: HospitalEventMedia | null };
export type HospitalEventBeforeAfterPhoto = {
  key: string;
  before: HospitalEventPhotoInput;
  after: HospitalEventPhotoInput;
};

export function emptyBeforeAfterPhoto(): HospitalEventBeforeAfterPhoto {
  return { key: crypto.randomUUID(), before: { file: null, media: null }, after: { file: null, media: null } };
}

export function mapBeforeAfterPhotos(
  photos: HospitalEventApiItem["before_after_photos"],
): HospitalEventBeforeAfterPhoto[] {
  return (photos ?? []).map((photo, index) => ({
    key: `existing:${photo.before_image?.id ?? photo.after_image?.id ?? index}`,
    before: { file: null, media: photo.before_image },
    after: { file: null, media: photo.after_image },
  }));
}

export function hasBeforeAfterPhoto(pair: HospitalEventBeforeAfterPhoto): boolean {
  return Boolean(pair.before.file || pair.before.media || pair.after.file || pair.after.media);
}

export function validateBeforeAfterPhotos(photos: HospitalEventBeforeAfterPhoto[]): string | undefined {
  if (photos.length > BEFORE_AFTER_PHOTO_MAX_COUNT) return "전후사진은 최대 4세트까지 등록할 수 있습니다.";
  const incompleteIndex = photos.findIndex(
    (photo) =>
      hasBeforeAfterPhoto(photo) &&
      (!(photo.before.file || photo.before.media) || !(photo.after.file || photo.after.media)),
  );
  if (incompleteIndex >= 0) return `${incompleteIndex + 1}번째 전후사진의 전/후 사진을 모두 등록해 주세요.`;
}

export function validateBeforeAfterPhotoFile(file: File) {
  return validateImageFileRuleMessage(
    file,
    {
      allowedExtensions: [".jpg", ".jpeg", ".png"],
      allowedMimeTypes: ["image/jpeg", "image/png"],
      maxBytes: 5 * 1024 * 1024,
    },
    "전후사진은 JPG, PNG 파일로 장당 5MB 이하만 등록할 수 있습니다.",
  );
}

export function appendBeforeAfterPhotos(data: FormData, photos: HospitalEventBeforeAfterPhoto[]) {
  const pairs = photos.filter(hasBeforeAfterPhoto);
  if (!pairs.length) data.append("before_after_photos", "[]");
  pairs.forEach((photo, index) => {
    BEFORE_AFTER_PHOTO_SIDES.forEach(({ key: side }) => {
      const value = photo[side];
      if (value.file) data.append(`before_after_photos[${index}][${side}_image]`, value.file);
      else if (value.media?.id) data.append(`before_after_photos[${index}][${side}_media_id]`, String(value.media.id));
    });
  });
}
