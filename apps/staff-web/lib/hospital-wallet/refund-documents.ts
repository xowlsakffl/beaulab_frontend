import { resolveMediaAssetUrl } from "@/lib/common/media";

export type RefundDocumentAsset = {
  id: number;
  path?: string | null;
  mime_type?: string | null;
  size?: number | null;
  metadata?: unknown;
  download_path?: string | null;
};

export type RefundDocuments = {
  operation_id: number;
  status: string;
  hospital?: { id: number; name?: string | null } | null;
  business_registration_file?: RefundDocumentAsset | null;
  bankbook_file?: RefundDocumentAsset | null;
};

export const REFUND_DOCUMENT_ACCEPT = ".jpg,.jpeg,.png,.pdf";
export const REFUND_DOCUMENT_HELP_TEXT = "JPG, JPEG, PNG, PDF / 10MB 이하";

const ACCEPTED_FILE_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export function validateRefundDocumentFile(file: File | null) {
  if (!file) return null;
  if (!ACCEPTED_FILE_TYPES.includes(file.type)) return "JPG, JPEG, PNG, PDF 파일만 등록할 수 있습니다.";
  if (file.size > MAX_FILE_SIZE) return "파일은 10MB 이하로 등록해 주세요.";
  return null;
}

export function refundDocumentFileName(media?: RefundDocumentAsset | null) {
  if (!media) return "";

  if (media.metadata && typeof media.metadata === "object" && !Array.isArray(media.metadata)) {
    const originalName = (media.metadata as { original_name?: unknown }).original_name;
    if (typeof originalName === "string" && originalName.trim()) return originalName.trim();
  }

  return media.path?.split("/").filter(Boolean).pop() ?? "첨부서류";
}

export function refundDocumentUrl(media?: RefundDocumentAsset | null) {
  return media?.download_path?.trim() || resolveMediaAssetUrl(media);
}
