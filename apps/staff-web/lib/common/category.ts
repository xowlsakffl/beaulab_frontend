import type { CategorySelectorItem } from "@beaulab/ui-admin";

export type CategoryApiItem = {
  id: number;
  name: string;
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
