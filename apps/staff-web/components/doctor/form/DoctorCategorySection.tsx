import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  HierarchicalCategorySelector,
  type CategorySelectorItem,
  type CategorySelectorLoadParams,
} from "@beaulab/ui-admin";

import { DOCTOR_CATEGORY_SECTIONS, type DoctorFormErrors } from "@/lib/doctor/form";

type DoctorCategorySectionProps = {
  selectedIds: number[];
  errors: DoctorFormErrors;
  loadCategories: (params: CategorySelectorLoadParams) => Promise<CategorySelectorItem[]>;
  onToggleCategory: (categoryId: number, checked: boolean) => void;
};

export function DoctorCategorySection({
  selectedIds,
  errors,
  loadCategories,
  onToggleCategory,
}: DoctorCategorySectionProps) {
  return (
    <Card as="section" className="flex flex-1 flex-col">
      <CardHeader className="pb-6">
        <CardTitle>주요 시술 분야</CardTitle>
        <CardDescription>의료진이 담당하는 진료/시술 카테고리를 선택해 주세요.</CardDescription>
      </CardHeader>

      <div data-field-target="category_ids" tabIndex={-1} className="flex-1">
        <HierarchicalCategorySelector
          sections={DOCTOR_CATEGORY_SECTIONS}
          selectedIds={selectedIds}
          onToggleCategory={onToggleCategory}
          loadCategories={loadCategories}
          error={errors.category_ids}
          initialSectionKey="surgery"
        />
      </div>
    </Card>
  );
}
