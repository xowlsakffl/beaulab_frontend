import type { CategorySelectorItem } from "@beaulab/ui-admin";

export const CATEGORY_DOMAINS = {
  HOSPITAL_MEDICAL: "HOSPITAL_MEDICAL",
} as const;

export const CATEGORY_USAGES = {
  HOSPITAL_DOCTOR_SUBJECT: "HOSPITAL_DOCTOR_SUBJECT",
  HOSPITAL_REVIEW_SURGERY: "HOSPITAL_REVIEW_SURGERY",
  HOSPITAL_REVIEW_TREATMENT: "HOSPITAL_REVIEW_TREATMENT",
} as const;

export const HOSPITAL_REVIEW_CATEGORY_DOMAINS = {
  SURGERY: CATEGORY_USAGES.HOSPITAL_REVIEW_SURGERY,
  TREATMENT: CATEGORY_USAGES.HOSPITAL_REVIEW_TREATMENT,
} as const;

export type CategoryApiItem = {
  id: number;
  name: string;
  code?: string | null;
  full_path?: string | null;
  parent_id?: number | null;
  depth: number;
  domain: string;
  status: string;
  has_children?: boolean;
};

export function normalizeCategorySelectorItem(item: CategoryApiItem): CategorySelectorItem {
  return {
    id: item.id,
    name: item.name,
    full_path: item.full_path,
    depth: item.depth,
    parent_id: item.parent_id,
    has_children: item.has_children,
  };
}
