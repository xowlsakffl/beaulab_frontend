import type { CategorySelectorItem } from "@beaulab/ui-admin";

export const CATEGORY_DOMAINS = {
  HOSPITAL_MEDICAL: "HOSPITAL_MEDICAL",
} as const;

export const CATEGORY_USAGES = {
  HOSPITAL_DOCTOR_SUBJECT: "HOSPITAL_DOCTOR_SUBJECT",
  HOSPITAL_REVIEW_SURGERY: "HOSPITAL_REVIEW_SURGERY",
  HOSPITAL_REVIEW_TREATMENT: "HOSPITAL_REVIEW_TREATMENT",
  HOSPITAL_EVENT_SURGERY: "HOSPITAL_EVENT_SURGERY",
  HOSPITAL_EVENT_TREATMENT: "HOSPITAL_EVENT_TREATMENT",
  HOSPITAL_EVENT_AD_SURGERY: "HOSPITAL_EVENT_AD_SURGERY",
  HOSPITAL_EVENT_AD_TREATMENT: "HOSPITAL_EVENT_AD_TREATMENT",
  HOSPITAL_VIDEO_CATEGORY: "HOSPITAL_VIDEO_CATEGORY",
} as const;

export const HOSPITAL_REVIEW_CATEGORY_DOMAINS = {
  SURGERY: CATEGORY_USAGES.HOSPITAL_REVIEW_SURGERY,
  TREATMENT: CATEGORY_USAGES.HOSPITAL_REVIEW_TREATMENT,
} as const;

export const CATEGORY_GROUP_CODES = {
  SURGERY: "SURGERY",
  TREATMENT: "TREATMENT",
} as const;

const CATEGORY_GROUP_LABELS = {
  [CATEGORY_GROUP_CODES.SURGERY]: "성형",
  [CATEGORY_GROUP_CODES.TREATMENT]: "쁘띠",
} as const;

export type CategoryApiItem = {
  id: number;
  name: string;
  code?: string | null;
  group_code?: string | null;
  group_label?: string | null;
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
    group_code: item.group_code ?? null,
    group_label: item.group_label ?? null,
    full_path: item.full_path,
    depth: item.depth,
    parent_id: item.parent_id,
    has_children: item.has_children,
  };
}

export function groupMedicalCategorySelectorItems<T extends CategorySelectorItem>(items: T[]) {
  const surgeryItems = items.filter((item) => item.group_code === CATEGORY_GROUP_CODES.SURGERY);
  const treatmentItems = items.filter((item) => item.group_code === CATEGORY_GROUP_CODES.TREATMENT);
  const otherItems = items.filter(
    (item) => item.group_code !== CATEGORY_GROUP_CODES.SURGERY && item.group_code !== CATEGORY_GROUP_CODES.TREATMENT,
  );

  return [
    {
      key: CATEGORY_GROUP_CODES.SURGERY,
      label: CATEGORY_GROUP_LABELS[CATEGORY_GROUP_CODES.SURGERY],
      items: surgeryItems,
    },
    {
      key: CATEGORY_GROUP_CODES.TREATMENT,
      label: CATEGORY_GROUP_LABELS[CATEGORY_GROUP_CODES.TREATMENT],
      items: treatmentItems,
    },
    {
      key: "OTHER",
      label: "기타",
      items: otherItems,
    },
  ].filter((group) => group.items.length > 0);
}
