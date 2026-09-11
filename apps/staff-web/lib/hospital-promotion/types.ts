import type { DataTableMeta } from "@beaulab/ui-admin";

export const PROMOTION_PATH = "/promotion-manage/hospitals";
export const PROMOTION_API = "/hospital-promotions";
export const PROMOTION_CACHE = "hospital-promotions";
export const PROMOTION_PERMISSIONS = {
  show: "beaulab.hospital_promotion.show",
  create: "beaulab.hospital_promotion.create",
  update: "beaulab.hospital_promotion.update",
  status: "beaulab.hospital_promotion.status_update",
} as const;

export type PromotionSide = "LEFT" | "RIGHT";
export type PromotionProgress = "UPCOMING" | "CURRENT" | "ENDED";
export type PromotionStatus = "ACTIVE" | "INACTIVE";

export type PromotionBanner = {
  id: number;
  path: string;
  file_name: string;
  size: number | null;
  mime_type: string | null;
  width?: number | null;
  height?: number | null;
};

export type HospitalPromotion = {
  id: number;
  title: string;
  side: PromotionSide;
  slot: number;
  start_date: string;
  end_date: string;
  status: PromotionStatus;
  progress: PromotionProgress;
  click_count: number;
  banner: PromotionBanner | null;
  creator: { id: number; name: string } | null;
  created_at: string;
  updated_at: string;
};

export type HospitalPromotionDetail = HospitalPromotion & { content: string };
export type PromotionScheduleConflict = Pick<
  HospitalPromotion,
  "id" | "title" | "side" | "slot" | "start_date" | "end_date"
>;
export type PromotionAvailability = {
  available: boolean;
  conflicts: PromotionScheduleConflict[];
  has_more: boolean;
};
export type PromotionSlot = {
  slot: number;
  promotion: HospitalPromotion | null;
  filtered_out: boolean;
};
export type PromotionBoardSide = {
  current: PromotionSlot[];
  upcoming: { items: HospitalPromotion[]; meta: DataTableMeta };
};
export type PromotionBoard = {
  today: string;
  left: PromotionBoardSide;
  right: PromotionBoardSide;
};
