import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  HierarchicalCategorySelector,
  type CategorySelectorItem,
  type CategorySelectorLoadParams,
} from "@beaulab/ui-admin";

import { DOCTOR_CATEGORY_SECTIONS, type DoctorCategoryItem, type DoctorFormErrors } from "@/lib/doctor/form";

type DoctorCategorySectionProps = {
  selectedIds: number[];
  selectedItems?: DoctorCategoryItem[];
  errors: DoctorFormErrors;
  loadCategories: (params: CategorySelectorLoadParams) => Promise<CategorySelectorItem[]>;
  onToggleCategory: (categoryId: number, checked: boolean) => void;
};

export function DoctorCategorySection({
  selectedIds,
  selectedItems,
  errors,
  loadCategories,
  onToggleCategory,
}: DoctorCategorySectionProps) {
  return (
    <Card as="section">
      <CardHeader className="pb-6">
        <CardTitle>주요 시술 분야</CardTitle>
        <CardDescription>의료진이 담당하는 진료/시술 카테고리를 선택해 주세요.</CardDescription>
      </CardHeader>

      <div data-field-target="category_ids" tabIndex={-1}>
        <HierarchicalCategorySelector
          sections={DOCTOR_CATEGORY_SECTIONS}
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
