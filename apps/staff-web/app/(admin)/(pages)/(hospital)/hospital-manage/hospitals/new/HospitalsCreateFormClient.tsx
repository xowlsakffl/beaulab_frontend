"use client";

import { HospitalFormLayout } from "@/components/hospital/form/HospitalFormLayout";
import { useDaumPostcode } from "@/hooks/common/useDaumPostcode";
import { useHospitalAddressSearch } from "@/hooks/hospital/useHospitalAddressSearch";
import { useHospitalCategorySelectorLoader } from "@/hooks/hospital/useHospitalCategorySelectorLoader";
import { useHospitalFieldFocus } from "@/hooks/hospital/useHospitalFieldFocus";
import { useHospitalFeatureList } from "@/hooks/hospital/useHospitalFeatureList";
import { useHospitalFormSelections } from "@/hooks/hospital/useHospitalFormSelections";
import { api } from "@/lib/common/api";
import { usePageHeaderExtra } from "@/lib/common/routing/page-header-extra";
import {
  buildCreateHospitalFormData,
  DUPLICATE_ERROR_MESSAGES,
  extractFieldErrors,
  INITIAL_HOSPITAL_FORM,
  normalizeBusinessNumber,
  validateCreateHospitalForm,
  type DuplicateCheckResponse,
  type HospitalFieldName,
  type HospitalFormErrors,
  type HospitalFormValues,
  type HospitalUniqueCheckField,
  type HospitalUniqueCheckState,
} from "@/lib/hospital/form";
import { isApiSuccess } from "@beaulab/types";
import { Button, useGlobalAlert } from "@beaulab/ui-admin";
import { useRouter } from "next/navigation";
import React from "react";

const HOSPITAL_CREATE_FORM_ID = "hospital-create-form";

export default function HospitalsCreateFormClient() {
  const router = useRouter();
  const { showAlert } = useGlobalAlert();
  const { openPostcode, geocodeAddress } = useDaumPostcode();
  const { focusFirstErrorField } = useHospitalFieldFocus();
  const loadCategories = useHospitalCategorySelectorLoader();
  const {
    features: hospitalFeatures,
    isLoading: isHospitalFeaturesLoading,
    error: hospitalFeaturesError,
  } = useHospitalFeatureList();

  const [form, setForm] = React.useState<HospitalFormValues>(INITIAL_HOSPITAL_FORM);
  const [logo, setLogo] = React.useState<File | null>(null);
  const [gallery, setGallery] = React.useState<File[]>([]);
  const [businessRegistrationFile, setBusinessRegistrationFile] = React.useState<File | null>(null);
  const [errors, setErrors] = React.useState<HospitalFormErrors>({});
  const [uniqueChecks, setUniqueChecks] = React.useState<
    Record<HospitalUniqueCheckField, HospitalUniqueCheckState | null>
  >({
    name: null,
    business_number: null,
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const latestFormRef = React.useRef(form);

  React.useEffect(() => {
    latestFormRef.current = form;
  }, [form]);

  const clearError = React.useCallback((field: HospitalFieldName) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const applyDuplicateCheckResult = React.useCallback((field: HospitalUniqueCheckField, available: boolean) => {
    const message = DUPLICATE_ERROR_MESSAGES[field];

    setErrors((prev) => {
      if (available) {
        if (prev[field] !== message) return prev;
        const next = { ...prev };
        delete next[field];
        return next;
      }

      if (prev[field] === message) return prev;

      return {
        ...prev,
        [field]: message,
      };
    });
  }, []);

  const resetUniqueCheck = React.useCallback((field: HospitalUniqueCheckField, value: string) => {
    const normalizedValue = field === "business_number" ? normalizeBusinessNumber(value) : value.trim();

    setUniqueChecks((prev) => {
      if (!prev[field] || prev[field].value === normalizedValue) {
        return prev;
      }

      return {
        ...prev,
        [field]: null,
      };
    });
  }, []);

  const setField = <K extends keyof HospitalFormValues>(key: K, value: HospitalFormValues[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    clearError(key);
  };

  const { openAddressSearch } = useHospitalAddressSearch({
    openPostcode,
    geocodeAddress,
    clearError,
    setErrors,
    setForm,
    showAlert,
  });

  const checkHospitalNameDuplicate = React.useCallback(
    async (rawValue: string) => {
      const value = rawValue.trim();

      if (!value) {
        return;
      }

      if (uniqueChecks.name?.value === value) {
        applyDuplicateCheckResult("name", uniqueChecks.name.available);
        return;
      }

      try {
        const response = await api.post<DuplicateCheckResponse>("/hospitals/check-name", {
          name: value,
        });

        if (!isApiSuccess(response)) {
          return;
        }

        if (latestFormRef.current.name.trim() !== value) {
          return;
        }

        const available =
          typeof response.data.available === "boolean" ? response.data.available : !response.data.exists;

        setUniqueChecks((prev) => ({
          ...prev,
          name: {
            value,
            available,
          },
        }));
        applyDuplicateCheckResult("name", available);
      } catch {
        // Final uniqueness is still enforced on submit.
      }
    },
    [applyDuplicateCheckResult, uniqueChecks.name],
  );

  const checkHospitalBusinessNumberDuplicate = React.useCallback(
    async (rawValue: string) => {
      const normalizedValue = normalizeBusinessNumber(rawValue);

      if (!normalizedValue) {
        return;
      }

      if (uniqueChecks.business_number?.value === normalizedValue) {
        applyDuplicateCheckResult("business_number", uniqueChecks.business_number.available);
        return;
      }

      try {
        const response = await api.post<DuplicateCheckResponse>("/hospitals/check-business-number", {
          business_number: rawValue,
        });

        if (!isApiSuccess(response)) {
          return;
        }

        const checkedBusinessNumber = response.data.business_number ?? normalizedValue;

        if (normalizeBusinessNumber(latestFormRef.current.business_number) !== checkedBusinessNumber) {
          return;
        }

        const available =
          typeof response.data.available === "boolean" ? response.data.available : !response.data.exists;

        setUniqueChecks((prev) => ({
          ...prev,
          business_number: {
            value: checkedBusinessNumber,
            available,
          },
        }));
        applyDuplicateCheckResult("business_number", available);
      } catch {
        // Final uniqueness is still enforced on submit.
      }
    },
    [applyDuplicateCheckResult, uniqueChecks.business_number],
  );

  const { toggleCategory, toggleFeature } = useHospitalFormSelections({
    categoryIds: form.category_ids,
    setForm,
    setErrors,
    clearError,
  });

  const validate = () => {
    const nextErrors = validateCreateHospitalForm({
      form,
      logo,
      gallery,
      businessRegistrationFile,
      uniqueChecks,
    });

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      focusFirstErrorField(nextErrors);
      return false;
    }

    return true;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validate()) return;

    const formData = buildCreateHospitalFormData({
      form,
      logo,
      gallery,
      businessRegistrationFile,
    });

    setIsSubmitting(true);

    try {
      const response = await api.post<{ id: number }>("/hospitals", formData);

      if (!isApiSuccess(response)) {
        const nextErrors = extractFieldErrors(response.error.details);
        if (Object.keys(nextErrors).length > 0) {
          setErrors(nextErrors);
          focusFirstErrorField(nextErrors);
        }
        showAlert({
          variant: "error",
          title: "병의원 등록 실패",
          message: response.error.message || "병의원 등록에 실패했습니다.",
        });
        return;
      }

      showAlert({
        variant: "success",
        title: "병의원 등록 완료",
        message: "새로 등록된 병의원을 목록에서 확인할 수 있습니다.",
      });
      router.push(
        response.data?.id ? `/hospital-manage/hospitals?highlight=${response.data.id}` : "/hospital-manage/hospitals",
      );
    } catch {
      showAlert({
        variant: "error",
        title: "병의원 등록 실패",
        message: "병의원 등록 중 오류가 발생했습니다.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const headerActions = React.useMemo(
    () => (
      <>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => router.push("/hospital-manage/hospitals")}
          disabled={isSubmitting}
        >
          취소
        </Button>
        <Button type="submit" form={HOSPITAL_CREATE_FORM_ID} variant="brand" size="sm" disabled={isSubmitting}>
          {isSubmitting ? "저장 중..." : "저장하기"}
        </Button>
      </>
    ),
    [isSubmitting, router],
  );

  usePageHeaderExtra(headerActions);

  return (
    <HospitalFormLayout
      mode="create"
      formId={HOSPITAL_CREATE_FORM_ID}
      form={form}
      errors={errors}
      logo={logo}
      gallery={gallery}
      businessRegistrationFile={businessRegistrationFile}
      hospitalFeatures={hospitalFeatures}
      isHospitalFeaturesLoading={isHospitalFeaturesLoading}
      hospitalFeaturesError={hospitalFeaturesError}
      onSubmit={handleSubmit}
      onFieldChange={setField}
      onNameChange={(value) => {
        setField("name", value);
        setField("company_name", value);
        resetUniqueCheck("name", value);
      }}
      onNameBlur={(value) => void checkHospitalNameDuplicate(value)}
      onBusinessNumberChange={(value) => {
        setField("business_number", value);
        resetUniqueCheck("business_number", value);
      }}
      onBusinessNumberBlur={(value) => void checkHospitalBusinessNumberDuplicate(value)}
      onLogoChange={(file) => {
        setLogo(file);
        clearError("logo");
      }}
      onGalleryChange={(files) => {
        setGallery(files);
        clearError("gallery");
      }}
      onBusinessRegistrationFileChange={(file) => {
        setBusinessRegistrationFile(file);
        clearError("business_registration_file");
      }}
      onOpenAddressSearch={openAddressSearch}
      loadCategories={loadCategories}
      onToggleCategory={toggleCategory}
      onToggleFeature={toggleFeature}
    />
  );
}
