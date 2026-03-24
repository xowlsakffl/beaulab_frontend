import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  HierarchicalCategorySelector,
  type CategorySelectorItem,
  type CategorySelectorLoadParams,
} from "@beaulab/ui-admin";

import { VIDEO_CATEGORY_SECTIONS, type VideoCategoryItem, type VideoFormErrors } from "@/lib/video/form";

type VideoCategorySectionProps = {
  selectedIds: number[];
  selectedItems?: VideoCategoryItem[];
  errors: VideoFormErrors;
  loadCategories: (params: CategorySelectorLoadParams) => Promise<CategorySelectorItem[]>;
  onToggleCategory: (categoryId: number, checked: boolean) => void;
};

export function VideoCategorySection({
  selectedIds,
  selectedItems,
  errors,
  loadCategories,
  onToggleCategory,
}: VideoCategorySectionProps) {
  return (
    <Card as="section">
      <CardHeader className="pb-6">
        <CardTitle>카테고리</CardTitle>
        <CardDescription>동영상과 연결할 시술/진료 카테고리를 선택해 주세요.</CardDescription>
      </CardHeader>

      <div data-field-target="category_ids" tabIndex={-1}>
        <HierarchicalCategorySelector
          sections={VIDEO_CATEGORY_SECTIONS}
          selectedIds={selectedIds}
          selectedItems={selectedItems}
          onToggleCategory={onToggleCategory}
          loadCategories={loadCategories}
          error={errors.category_ids}
          initialSectionKey="surgery"
        />
      </div>
    </Card>
  );
}
