"use client";

import { HospitalFormLayout } from "@/components/hospital/form/HospitalFormLayout";
import { useDaumPostcode } from "@/hooks/common/useDaumPostcode";
import { useHospitalAddressSearch } from "@/hooks/hospital/useHospitalAddressSearch";
import { useHospitalCategorySelectorLoader } from "@/hooks/hospital/useHospitalCategorySelectorLoader";
import { useHospitalFieldFocus } from "@/hooks/hospital/useHospitalFieldFocus";
import { useHospitalFeatureList } from "@/hooks/hospital/useHospitalFeatureList";
import { api } from "@/lib/common/api";
import { usePageHeaderExtra } from "@/lib/common/routing/page-header-extra";
import {
  DUPLICATE_ERROR_MESSAGES,
  HOSPITAL_CATEGORY_MAX_SELECTION,
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
  const { focusField, focusFirstErrorField } = useHospitalFieldFocus();
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
  const [uniqueChecks, setUniqueChecks] = React.useState<Record<HospitalUniqueCheckField, HospitalUniqueCheckState | null>>({
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

  const applyDuplicateCheckResult = React.useCallback(
      (field: HospitalUniqueCheckField, available: boolean) => {
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
    },
    [],
  );

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
    focusField,
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
          typeof response.data.available === "boolean"
            ? response.data.available
            : !response.data.exists;

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
          typeof response.data.available === "boolean"
            ? response.data.available
            : !response.data.exists;

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

  const toggleCategory = (categoryId: number, checked: boolean) => {
    if (checked && !form.category_ids.includes(categoryId) && form.category_ids.length >= HOSPITAL_CATEGORY_MAX_SELECTION) {
      setErrors((prev) => ({
        ...prev,
        category_ids: `진료과목은 최대 ${HOSPITAL_CATEGORY_MAX_SELECTION}개까지 선택할 수 있습니다.`,
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      category_ids: checked
        ? prev.category_ids.includes(categoryId)
          ? prev.category_ids
          : [...prev.category_ids, categoryId]
        : prev.category_ids.filter((item) => item !== categoryId),
    }));
    clearError("category_ids");
  };

  const toggleFeature = (featureId: number, checked: boolean) => {
    setForm((prev) => ({
      ...prev,
      feature_ids: checked
        ? prev.feature_ids.includes(featureId)
          ? prev.feature_ids
          : [...prev.feature_ids, featureId]
        : prev.feature_ids.filter((item) => item !== featureId),
    }));
    clearError("feature_ids");
  };

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

    const formData = new FormData();
    formData.append("name", form.name.trim());
    formData.append("department", form.department);
    formData.append("company_name", form.company_name.trim() || form.name.trim());
    formData.append("description", form.description.trim());
    formData.append("consulting_hours", form.consulting_hours.trim());
    formData.append("direction", form.direction.trim());
    formData.append("address", form.address.trim());
    formData.append("address_detail", form.address_detail.trim());
    formData.append("latitude", form.latitude.trim());
    formData.append("longitude", form.longitude.trim());
    formData.append("tel", form.tel.trim());
    formData.append("ad_reception_phone_1", form.ad_reception_phone_1.trim());
    formData.append("ad_reception_phone_2", form.ad_reception_phone_2.trim());
    formData.append("ad_reception_phone_3", form.ad_reception_phone_3.trim());
    formData.append("email", form.email.trim());
    formData.append("allow_status", form.allow_status);
    formData.append("status", form.status);
    formData.append("status_change_reason", form.statusChangeReason.trim());
    formData.append("business_number", form.business_number.trim());
    formData.append("ceo_name", form.ceo_name.trim());
    formData.append("business_type", form.business_type.trim());
    formData.append("business_item", form.business_item.trim());
    formData.append("business_address", form.business_address.trim());
    formData.append("business_address_detail", form.business_address_detail.trim());
    formData.append("settlement_bank_name", form.settlement_bank_name.trim());
    formData.append("settlement_account_number", form.settlement_account_number.trim());
    formData.append("settlement_account_holder", form.settlement_account_holder.trim());
    formData.append("tax_invoice_email", form.tax_invoice_email.trim());

    Object.entries(form.operation_hours).forEach(([dayKey, item]) => {
      formData.append(`operation_hours[${dayKey}][is_closed]`, item.is_closed ? "1" : "0");
      formData.append(`operation_hours[${dayKey}][start]`, item.start);
      formData.append(`operation_hours[${dayKey}][end]`, item.end);
    });

    if (form.issued_at) {
      formData.append("issued_at", form.issued_at);
    }

    form.category_ids.forEach((categoryId) => {
      formData.append("category_ids[]", String(categoryId));
    });
    form.feature_ids.forEach((featureId) => {
      formData.append("feature_ids[]", String(featureId));
    });

    if (logo) {
      formData.append("logo", logo);
    }

    if (businessRegistrationFile) {
      formData.append("business_registration_file", businessRegistrationFile);
    }

    gallery.forEach((file) => formData.append("gallery[]", file));

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
      router.push(response.data?.id ? `/hospitals?highlight=${response.data.id}` : "/hospitals");
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
        <Button type="button" variant="outline" size="sm" onClick={() => router.push("/hospitals")} disabled={isSubmitting}>
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
