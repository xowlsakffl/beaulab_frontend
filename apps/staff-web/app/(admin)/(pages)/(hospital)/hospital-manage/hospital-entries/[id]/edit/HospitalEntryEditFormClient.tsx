"use client";

import React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { isApiSuccess } from "@beaulab/types";
import { Button, SpinnerBlock, useGlobalAlert } from "@beaulab/ui-admin";

import { LoadErrorState } from "@/components/common/LoadErrorState";
import { HospitalAccountInvitationModal } from "@/components/account-hospital/HospitalAccountInvitationModal";
import { resolveAllowStatusValue } from "@/components/common/AllowStatusControls";
import {
  HospitalEntryAllowStatusReadonlyCard,
  HospitalEntryApplicantEditCard,
  HospitalEntryHospitalEditCard,
} from "@/components/hospital-entry/form/HospitalEntryEditCards";
import { MediaPreviewModal, type MediaPreviewState } from "@/components/common/MediaPreviewModal";
import { api } from "@/lib/common/api";
import { getSession } from "@/lib/common/auth/session";
import { HOSPITAL_ACCOUNT_INVITATION_PERMISSIONS } from "@/lib/account-hospital/invitation";
import { buildReturnToPath } from "@/lib/common/navigation/buildReturnToPath";
import { usePageHeaderExtra } from "@/lib/common/routing/page-header-extra";
import { type HospitalEntryDetailResponse, type HospitalEntryMediaAsset } from "@/lib/hospital-entry/detail";
import {
  HOSPITAL_ENTRY_EDIT_FORM_ID,
  HOSPITAL_ENTRY_FIELD_NAMES,
  INITIAL_HOSPITAL_ENTRY_FORM,
  buildHospitalEntryFormData,
  extractHospitalEntryFieldErrors,
  mapHospitalEntryDetailToForm,
  validateHospitalEntryEditForm,
  type HospitalEntryFieldName,
  type HospitalEntryFormErrors,
  type HospitalEntryFormValues,
} from "@/lib/hospital-entry/form";
import { hasPermission } from "@beaulab/auth";

export default function HospitalEntryEditFormClient() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showAlert } = useGlobalAlert();
  const sessionAuth = getSession()?.auth;
  const canViewAccountInvitation = hasPermission(sessionAuth, HOSPITAL_ACCOUNT_INVITATION_PERMISSIONS.show);
  const canSendAccountInvitation = hasPermission(sessionAuth, HOSPITAL_ACCOUNT_INVITATION_PERMISSIONS.update);

  const rawEntryId = Array.isArray(params.id) ? params.id[0] : params.id;
  const entryId = Number(rawEntryId);

  const businessFileInputRef = React.useRef<HTMLInputElement | null>(null);
  const licenseFileInputRef = React.useRef<HTMLInputElement | null>(null);

  const [form, setForm] = React.useState<HospitalEntryFormValues>(INITIAL_HOSPITAL_ENTRY_FORM);
  const [detail, setDetail] = React.useState<HospitalEntryDetailResponse | null>(null);
  const [existingBusinessRegistrationFile, setExistingBusinessRegistrationFile] =
    React.useState<HospitalEntryMediaAsset | null>(null);
  const [existingLicenseFile, setExistingLicenseFile] = React.useState<HospitalEntryMediaAsset | null>(null);
  const [businessRegistrationFile, setBusinessRegistrationFile] = React.useState<File | null>(null);
  const [licenseFile, setLicenseFile] = React.useState<File | null>(null);
  const [errors, setErrors] = React.useState<HospitalEntryFormErrors>({});
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [previewMedia, setPreviewMedia] = React.useState<MediaPreviewState | null>(null);
  const [isAccountInvitationOpen, setIsAccountInvitationOpen] = React.useState(false);

  const detailPath = React.useMemo(() => {
    if (!Number.isFinite(entryId) || entryId <= 0) return "/hospital-manage/hospital-entries";

    const rawReturnTo = searchParams.get("returnTo");
    return rawReturnTo
      ? `/hospital-manage/hospital-entries/${entryId}?returnTo=${encodeURIComponent(rawReturnTo)}`
      : `/hospital-manage/hospital-entries/${entryId}`;
  }, [entryId, searchParams]);

  const getReturnToPath = React.useCallback(
    (highlightId?: number) =>
      buildReturnToPath({
        searchParams,
        fallbackPath: "/hospital-manage/hospital-entries",
        allowedPrefix: "/hospital-manage/hospital-entries",
        highlightId,
      }),
    [searchParams],
  );

  const clearError = React.useCallback((field: HospitalEntryFieldName) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;

      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const setField = React.useCallback(
    <K extends keyof HospitalEntryFormValues>(field: K, value: HospitalEntryFormValues[K]) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      clearError(field);
    },
    [clearError],
  );

  const fetchEntry = React.useCallback(async () => {
    if (!Number.isFinite(entryId) || entryId <= 0) {
      setLoadError("올바르지 않은 입점신청 경로입니다.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      const response = await api.get<HospitalEntryDetailResponse>(`/hospital-entries/${entryId}`);

      if (!isApiSuccess(response)) {
        setLoadError(response.error.message || "입점신청 정보를 불러오지 못했습니다.");
        return;
      }

      setDetail(response.data);
      setForm(mapHospitalEntryDetailToForm(response.data));
      setExistingBusinessRegistrationFile(response.data.business_registration_file ?? null);
      setExistingLicenseFile(response.data.license_file ?? null);
      setBusinessRegistrationFile(null);
      setLicenseFile(null);
      setErrors({});
    } catch {
      setLoadError("입점신청 정보를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [entryId]);

  React.useEffect(() => {
    void fetchEntry();
  }, [fetchEntry]);

  const validate = React.useCallback(() => {
    const nextErrors = validateHospitalEntryEditForm({
      form,
      businessRegistrationFile,
      existingBusinessRegistrationFile,
    });
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      window.setTimeout(() => focusFirstError(nextErrors), 0);
      return false;
    }

    return true;
  }, [businessRegistrationFile, existingBusinessRegistrationFile, form]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;
    if (!Number.isFinite(entryId) || entryId <= 0) return;

    const formData = buildHospitalEntryFormData({
      form,
      businessRegistrationFile,
      licenseFile,
      existingBusinessRegistrationFile,
      existingLicenseFile,
    });

    setIsSubmitting(true);

    try {
      const response = await api.post<HospitalEntryDetailResponse>(`/hospital-entries/${entryId}`, formData);

      if (!isApiSuccess(response)) {
        const nextErrors = extractHospitalEntryFieldErrors(response.error.details);
        if (Object.keys(nextErrors).length > 0) {
          setErrors(nextErrors);
          window.setTimeout(() => focusFirstError(nextErrors), 0);
        }

        showAlert({
          variant: "error",
          title: "입점신청 수정 실패",
          message: response.error.message || "입점신청 수정에 실패했습니다.",
        });
        return;
      }

      showAlert({
        variant: "success",
        title: "입점신청 수정 완료",
        message: "수정된 입점신청 정보를 확인할 수 있습니다.",
      });
      router.push(detailPath);
    } catch {
      showAlert({
        variant: "error",
        title: "입점신청 수정 실패",
        message: "입점신청 수정 중 오류가 발생했습니다.",
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
          onClick={() => router.push(getReturnToPath())}
          disabled={isSubmitting}
        >
          취소
        </Button>
        <Button type="submit" form={HOSPITAL_ENTRY_EDIT_FORM_ID} variant="brand" size="sm" disabled={isSubmitting}>
          {isSubmitting ? "저장 중..." : "저장하기"}
        </Button>
      </>
    ),
    [getReturnToPath, isSubmitting, router],
  );

  usePageHeaderExtra(isLoading || loadError ? null : headerActions);

  if (isLoading) {
    return <SpinnerBlock className="min-h-[60vh]" spinnerClassName="size-10" label="입점신청 정보를 불러오는 중" />;
  }

  if (loadError || !detail) {
    return (
      <LoadErrorState
        title="입점신청 정보를 불러오지 못했습니다."
        message={loadError ?? "입점신청 정보를 찾을 수 없습니다."}
      />
    );
  }

  const allowStatus = resolveAllowStatusValue(detail.allow_status);
  const isConverted = Boolean(detail.hospital_id || detail.converted_at);
  const canViewInvitationForEntry = !isConverted && allowStatus === "APPROVED" && canViewAccountInvitation;
  const canSendInvitationForEntry = !isConverted && allowStatus === "APPROVED" && canSendAccountInvitation;

  return (
    <>
      <form id={HOSPITAL_ENTRY_EDIT_FORM_ID} className="min-w-0 space-y-4" onSubmit={handleSubmit}>
        <section className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">
          <HospitalEntryHospitalEditCard
            form={form}
            errors={errors}
            businessRegistrationMedia={existingBusinessRegistrationFile}
            licenseMedia={existingLicenseFile}
            businessRegistrationFile={businessRegistrationFile}
            licenseFile={licenseFile}
            businessFileInputRef={businessFileInputRef}
            licenseFileInputRef={licenseFileInputRef}
            onFieldChange={setField}
            onBusinessFileChange={(file) => {
              setBusinessRegistrationFile(file);
              clearError("business_registration_file");
            }}
            onLicenseFileChange={(file) => {
              setLicenseFile(file);
              clearError("license_file");
            }}
            onExistingBusinessFileChange={(hasFile) => {
              setExistingBusinessRegistrationFile(hasFile ? existingBusinessRegistrationFile : null);
              clearError("business_registration_file");
            }}
            onExistingLicenseFileChange={(hasFile) => {
              setExistingLicenseFile(hasFile ? existingLicenseFile : null);
              clearError("license_file");
            }}
            onPreview={setPreviewMedia}
          />
          <HospitalEntryApplicantEditCard form={form} errors={errors} onFieldChange={setField} />
        </section>

        <HospitalEntryAllowStatusReadonlyCard
          detail={detail}
          onOpenAccountInvitation={canViewInvitationForEntry ? () => setIsAccountInvitationOpen(true) : undefined}
        />

        <MediaPreviewModal preview={previewMedia} onChange={setPreviewMedia} onClose={() => setPreviewMedia(null)} />
      </form>
      <HospitalAccountInvitationModal
        isOpen={isAccountInvitationOpen}
        sourceType="HOSPITAL_ENTRY"
        sourceId={entryId}
        hospitalName={form.hospital_name}
        initialEmail={form.applicant_email}
        canSend={canSendInvitationForEntry}
        onClose={() => setIsAccountInvitationOpen(false)}
      />
    </>
  );
}

function focusFirstError(errors: HospitalEntryFormErrors) {
  const firstField = HOSPITAL_ENTRY_FIELD_NAMES.find((field) => errors[field]);
  if (!firstField) return;

  const input = document.querySelector<HTMLElement>(
    `[name="${firstField}"], #hospital-entry-${firstField.replace(/_/g, "-")}`,
  );
  input?.focus();
}
