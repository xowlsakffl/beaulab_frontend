"use client";

import React from "react";

import {
  HospitalMediaPreviewModal,
  type HospitalMediaPreviewState,
} from "@/components/hospital/media/HospitalMediaPreviewModal";
import { HospitalBusinessAccountEditCard, HospitalMainInfoEditCard } from "@/components/hospital/form/HospitalMainInfoEditCards";
import { HospitalGalleryEditCard, HospitalLogoEditCard } from "@/components/hospital/form/HospitalMediaEditCards";
import { HospitalOperationEditCard } from "@/components/hospital/form/HospitalOperationEditCard";
import {
  HospitalAdReceptionEditCard,
  HospitalAllowStatusReadOnlyCard,
  HospitalPointEditCard,
  HospitalVerifiedAccountContactEditCard,
} from "@/components/hospital/form/HospitalSideEditCards";
import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalPanel,
  ModalTitle,
  type CategorySelectorItem,
  type CategorySelectorLoadParams,
  type ExistingMediaItem,
} from "@beaulab/ui-admin";

import {
  type HospitalAddressDetailField,
  type HospitalAddressField,
  type HospitalFormErrors,
  type HospitalFormValues,
  type HospitalMediaField,
} from "@/lib/hospital/form";
import {
  type AccountHospitalAsset,
  type HospitalCategoryItem,
  type HospitalFeatureItem,
  type MediaAsset,
} from "@/lib/hospital/detail";
type HospitalFormLayoutProps = {
  mode: "create" | "edit";
  formId: string;
  form: HospitalFormValues;
  errors: HospitalFormErrors;
  logo: File | null;
  gallery: File[];
  existingLogo?: MediaAsset | null;
  existingMediaByCollection?: {
    logo: ExistingMediaItem[];
    gallery: ExistingMediaItem[];
  };
  galleryOrder?: string[];
  businessRegistrationFile: File | null;
  existingCertificate?: MediaAsset | null;
  accountHospital?: AccountHospitalAsset | null;
  pointBalance?: number | string | null;
  selectedCategoryItems?: HospitalCategoryItem[];
  hospitalFeatures: HospitalFeatureItem[];
  isHospitalFeaturesLoading: boolean;
  hospitalFeaturesError: string | null;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onFieldChange: (key: keyof HospitalFormValues, value: HospitalFormValues[keyof HospitalFormValues]) => void;
  onNameChange?: (value: string) => void;
  onNameBlur?: (value: string) => void;
  onBusinessNumberChange?: (value: string) => void;
  onBusinessNumberBlur?: (value: string) => void;
  onLogoChange: (file: File | null) => void;
  onGalleryChange: (files: File[]) => void;
  onExistingItemsChange?: (key: HospitalMediaField, items: ExistingMediaItem[]) => void;
  onGalleryOrderChange?: (order: string[]) => void;
  onBusinessRegistrationFileChange: (file: File | null) => void;
  onExistingCertificateChange?: (hasFile: boolean) => void;
  onOpenAddressSearch: (field: HospitalAddressField, detailFieldId: HospitalAddressDetailField) => Promise<void>;
  loadCategories: (params: CategorySelectorLoadParams) => Promise<CategorySelectorItem[]>;
  onToggleCategory: (categoryId: number, checked: boolean) => void;
  onToggleFeature: (featureId: number, checked: boolean) => void;
};

export function HospitalFormLayout({
  mode,
  formId,
  form,
  errors,
  logo,
  gallery,
  existingLogo = null,
  existingMediaByCollection,
  galleryOrder,
  businessRegistrationFile,
  existingCertificate = null,
  accountHospital = null,
  pointBalance = null,
  selectedCategoryItems,
  hospitalFeatures,
  isHospitalFeaturesLoading,
  hospitalFeaturesError,
  onSubmit,
  onFieldChange,
  onNameChange,
  onNameBlur,
  onBusinessNumberChange,
  onBusinessNumberBlur,
  onLogoChange,
  onGalleryChange,
  onExistingItemsChange,
  onGalleryOrderChange,
  onBusinessRegistrationFileChange,
  onExistingCertificateChange,
  onOpenAddressSearch,
  loadCategories,
  onToggleCategory,
  onToggleFeature,
}: HospitalFormLayoutProps) {
  const isCreate = mode === "create";
  const [previewMedia, setPreviewMedia] = React.useState<HospitalMediaPreviewState | null>(null);
  const [imageUploadWarning, setImageUploadWarning] = React.useState<string | null>(null);

  return (
    <>
      <form id={formId} onSubmit={onSubmit} autoComplete="off" className="min-w-0 space-y-6">
        <div className="grid min-w-0 grid-cols-1 items-stretch gap-4 xl:grid-cols-[20rem_minmax(0,1fr)_19rem]">
          <HospitalLogoEditCard
            logo={logo}
            existingLogo={existingLogo}
            hospitalName={form.name}
            error={errors.logo}
            className="h-full xl:col-start-1 xl:row-start-1"
            onChange={onLogoChange}
            onPreview={setPreviewMedia}
            onUploadValidationError={setImageUploadWarning}
          />

          <HospitalMainInfoEditCard
            mode={mode}
            form={form}
            errors={errors}
            businessRegistrationFile={businessRegistrationFile}
            existingCertificate={existingCertificate}
            className="xl:col-start-2 xl:row-start-1"
            onFieldChange={onFieldChange}
            onNameChange={onNameChange}
            onNameBlur={onNameBlur}
            onBusinessNumberChange={onBusinessNumberChange}
            onBusinessNumberBlur={onBusinessNumberBlur}
            onBusinessRegistrationFileChange={onBusinessRegistrationFileChange}
            onExistingCertificateChange={onExistingCertificateChange}
            onOpenAddressSearch={onOpenAddressSearch}
            onPreview={setPreviewMedia}
          />

          <HospitalBusinessAccountEditCard
            form={form}
            errors={errors}
            className="xl:col-start-2 xl:row-start-2"
            onFieldChange={onFieldChange}
          />

          {isCreate ? null : (
            <HospitalVerifiedAccountContactEditCard accountHospital={accountHospital} className="h-full xl:col-start-2 xl:row-start-3" />
          )}

          <div className="flex min-w-0 flex-col gap-4 xl:col-start-3 xl:row-span-2 xl:row-start-1 xl:h-full">
            <HospitalPointEditCard pointBalance={pointBalance} />
            <HospitalAdReceptionEditCard form={form} errors={errors} onFieldChange={onFieldChange} />
          </div>

          {isCreate ? null : <HospitalAllowStatusReadOnlyCard allowStatus={form.allow_status} className="h-full xl:col-start-3 xl:row-start-3" />}
        </div>

        <HospitalGalleryEditCard
          gallery={gallery}
          existingMediaByCollection={existingMediaByCollection}
          galleryOrder={galleryOrder}
          error={errors.gallery}
          onGalleryChange={onGalleryChange}
          onExistingItemsChange={onExistingItemsChange}
          onGalleryOrderChange={onGalleryOrderChange}
          onPreview={setPreviewMedia}
          onUploadValidationError={setImageUploadWarning}
        />

        <HospitalOperationEditCard
          form={form}
          errors={errors}
          selectedCategoryItems={selectedCategoryItems}
          hospitalFeatures={hospitalFeatures}
          isHospitalFeaturesLoading={isHospitalFeaturesLoading}
          hospitalFeaturesError={hospitalFeaturesError}
          onFieldChange={onFieldChange}
          loadCategories={loadCategories}
          onToggleCategory={onToggleCategory}
          onToggleFeature={onToggleFeature}
        />

        {isCreate ? null : <input type="hidden" name="mode" value="edit" readOnly />}
      </form>
      <HospitalMediaPreviewModal preview={previewMedia} onChange={setPreviewMedia} onClose={() => setPreviewMedia(null)} />
      <Modal
        isOpen={Boolean(imageUploadWarning)}
        onClose={() => setImageUploadWarning(null)}
        showCloseButton={false}
        className="mx-4 w-[calc(100%-2rem)] max-w-sm"
      >
        <ModalPanel>
          <ModalHeader className="pr-0">
            <ModalTitle className="text-base">이미지 업로드 조건 확인</ModalTitle>
          </ModalHeader>
          <ModalBody className="mt-5">
            <p className="whitespace-pre-line text-sm font-medium leading-6 text-gray-800">{imageUploadWarning}</p>
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="brand" onClick={() => setImageUploadWarning(null)}>
              확인
            </Button>
          </ModalFooter>
        </ModalPanel>
      </Modal>
    </>
  );
}
