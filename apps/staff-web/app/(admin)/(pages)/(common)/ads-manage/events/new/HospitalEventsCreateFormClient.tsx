"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalPanel,
  ModalTitle,
  SpinnerBlock,
  useGlobalAlert,
} from "@beaulab/ui-admin";
import { isApiSuccess } from "@beaulab/types";

import { HospitalMediaPreviewModal } from "@/components/hospital/media/HospitalMediaPreviewModal";
import { LoadErrorState } from "@/components/common/LoadErrorState";
import { HospitalEventAppPreviewModal } from "@/components/hospital-event/form/HospitalEventAppPreviewModal";
import { EventInfoCard } from "@/components/hospital-event/form/HospitalEventInfoCard";
import { HospitalEventMediaCard } from "@/components/hospital-event/form/HospitalEventMediaFields";
import {
  CategoryDoctorPickerCard,
  HospitalPickerCard,
} from "@/components/hospital-event/form/HospitalEventPickerCards";
import { UploadWarningModal } from "@/components/hospital-event/form/HospitalEventUploadWarningModal";
import { useHospitalEventCategorySelection } from "@/hooks/hospital-event/useHospitalEventCategorySelection";
import { useHospitalEventFieldFocus } from "@/hooks/hospital-event/useHospitalEventFieldFocus";
import { useHospitalEventMediaState } from "@/hooks/hospital-event/useHospitalEventMediaState";
import { useVideoDoctorOptions } from "@/hooks/video/useVideoDoctorOptions";
import { api } from "@/lib/common/api";
import { buildReturnToPath } from "@/lib/common/navigation/buildReturnToPath";
import { usePageHeaderExtra } from "@/lib/common/routing/page-header-extra";
import {
  INITIAL_HOSPITAL_EVENT_FORM,
  buildHospitalEventFormData,
  calculateHospitalEventDiscountRate,
  emptyDoctorAssignment,
  emptyEventOption,
  extractHospitalEventFieldErrors,
  mapHospitalEventDetailToForm,
  parseNumberInput,
  validateCreateHospitalEventForm,
  type HospitalEventFieldName,
  type HospitalEventFormErrors,
  type HospitalEventFormValues,
  type HospitalEventOptionForm,
} from "@/lib/hospital-event/form";
import { type HospitalEventApiItem } from "@/lib/hospital-event/list";
import type { DoctorHospitalOption } from "@/lib/doctor/form";
import type { VideoDoctorOption } from "@/lib/video/form";

const EVENT_CREATE_FORM_ID = "hospital-event-create-form";

type EventCreateResponse = {
  id: number;
};

type HospitalEventFormMode = "create" | "edit" | "duplicate";

export default function HospitalEventsCreateFormClient() {
  const searchParams = useSearchParams();
  const duplicateSourceEventId = React.useMemo(() => {
    const parsed = Number(searchParams.get("copyFrom") ?? "");
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }, [searchParams]);

  return (
    <HospitalEventsFormClient
      mode={duplicateSourceEventId ? "duplicate" : "create"}
      sourceEventId={duplicateSourceEventId ?? undefined}
    />
  );
}
export function HospitalEventsEditFormClient({ eventId }: { eventId: number }) {
  return <HospitalEventsFormClient mode="edit" eventId={eventId} />;
}
function HospitalEventsFormClient({
  mode,
  eventId,
  sourceEventId,
}: {
  mode: HospitalEventFormMode;
  eventId?: number;
  sourceEventId?: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showAlert } = useGlobalAlert();
  const { focusFirstErrorField } = useHospitalEventFieldFocus();
  const {
    thumbnailImage,
    setThumbnailImage,
    eventPageImage,
    setEventPageImage,
    existingThumbnailImage,
    existingEventPageImage,
    previewMedia,
    setPreviewMedia,
    isAppPreviewOpen,
    openAppPreview,
    closeAppPreview,
    uploadWarning,
    setUploadWarning,
    closeUploadWarning,
    applyExistingMedia,
    closePreviewMedia,
  } = useHospitalEventMediaState();

  const [form, setForm] = React.useState<HospitalEventFormValues>(INITIAL_HOSPITAL_EVENT_FORM);
  const [errors, setErrors] = React.useState<HospitalEventFormErrors>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(mode === "edit" || mode === "duplicate");
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const selectedHospital = form.hospital_id
    ? {
        id: form.hospital_id,
        name: form.hospital_name,
        business_number: form.hospital_business_number,
      }
    : null;
  const doctorOptionsResult = useVideoDoctorOptions(form.hospital_id);
  const normalPrice = parseNumberInput(form.normal_price);
  const eventPrice = parseNumberInput(form.event_price);
  const discountRate = calculateHospitalEventDiscountRate(normalPrice, eventPrice);
  const eventPriceError =
    normalPrice > 0 && eventPrice > normalPrice
      ? "이벤트 가격은 정상 가격을 초과할 수 없습니다."
      : normalPrice > 0 && eventPrice > 0 && eventPrice * 100 < normalPrice * 51
        ? "할인율은 49%를 초과할 수 없습니다."
        : null;

  const getReturnToPath = React.useCallback(
    (highlightId?: number) =>
      buildReturnToPath({
        searchParams,
        fallbackPath: "/ads-manage/events",
        allowedPrefix: "/ads-manage/events",
        highlightId,
      }),
    [searchParams],
  );

  const detailPath = React.useMemo(() => {
    if (mode !== "edit" || !eventId || !Number.isFinite(eventId) || eventId <= 0) return "/ads-manage/events";

    const rawReturnTo = searchParams.get("returnTo");
    return rawReturnTo
      ? `/ads-manage/events/${eventId}?returnTo=${encodeURIComponent(rawReturnTo)}`
      : `/ads-manage/events/${eventId}`;
  }, [eventId, mode, searchParams]);

  const clearError = React.useCallback((field: HospitalEventFieldName) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;

      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const setField = React.useCallback(
    <K extends keyof HospitalEventFormValues>(key: K, value: HospitalEventFormValues[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      clearError(key);
    },
    [clearError],
  );

  const {
    categorySectionKey,
    pendingCategorySectionKey,
    selectedCategoryItems,
    selectedCategoryUsage,
    isTreatmentEvent,
    loadEventCategories,
    applyDetailCategories,
    toggleCategory,
    requestCategorySectionChange,
    closeCategorySectionConfirmModal,
    confirmCategorySectionChange,
  } = useHospitalEventCategorySelection({
    categoryIds: form.category_ids,
    setForm,
    setErrors,
    clearError,
  });

  const fetchEvent = React.useCallback(async () => {
    const targetEventId = mode === "edit" ? eventId : sourceEventId;

    if (!targetEventId || !Number.isFinite(targetEventId) || targetEventId <= 0) {
      setLoadError("잘못된 이벤트 경로입니다.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      const response = await api.get<HospitalEventApiItem>(`/hospital-events/${targetEventId}`);

      if (!isApiSuccess(response)) {
        setLoadError(
          response.error.message ||
            (mode === "edit" ? "이벤트 정보를 불러오지 못했습니다." : "복제할 이벤트 정보를 불러오지 못했습니다."),
        );
        return;
      }

      const detail = response.data;
      setForm(mapHospitalEventDetailToForm(detail));
      applyExistingMedia(detail.thumbnail_image, detail.event_page_image);
      setErrors({});
      applyDetailCategories(detail.categories);
    } catch {
      setLoadError(
        mode === "edit"
          ? "이벤트 정보를 불러오는 중 오류가 발생했습니다."
          : "복제할 이벤트 정보를 불러오는 중 오류가 발생했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [applyDetailCategories, applyExistingMedia, eventId, mode, sourceEventId]);

  React.useEffect(() => {
    if (mode !== "edit" && mode !== "duplicate") return;

    void fetchEvent();
  }, [fetchEvent, mode]);

  const handleSelectHospital = React.useCallback(
    (hospital: DoctorHospitalOption) => {
      setForm((prev) => ({
        ...prev,
        hospital_id: hospital.id,
        hospital_name: hospital.name,
        hospital_business_number: hospital.business_number?.trim() ?? "",
        doctor_assignments: [emptyDoctorAssignment(), emptyDoctorAssignment(), emptyDoctorAssignment()],
      }));
      clearError("hospital_id");
    },
    [clearError],
  );

  const handleClearHospital = React.useCallback(() => {
    setForm((prev) => ({
      ...prev,
      hospital_id: null,
      hospital_name: "",
      hospital_business_number: "",
      doctor_assignments: [emptyDoctorAssignment(), emptyDoctorAssignment(), emptyDoctorAssignment()],
    }));
  }, []);

  const setDoctorAssignment = React.useCallback((index: number, doctor: VideoDoctorOption | null) => {
    setForm((prev) => {
      const nextAssignments = [...prev.doctor_assignments];
      nextAssignments[index] = doctor
        ? {
            ...nextAssignments[index],
            hospital_doctor_id: doctor.id,
            name: doctor.name,
          }
        : emptyDoctorAssignment();

      return { ...prev, doctor_assignments: nextAssignments };
    });
  }, []);

  const setOption = React.useCallback(
    (index: number, patch: Partial<HospitalEventOptionForm>) => {
      setForm((prev) => {
        const nextOptions = [...prev.options];
        nextOptions[index] = { ...nextOptions[index], ...patch };

        return { ...prev, options: nextOptions };
      });
      clearError("options");
    },
    [clearError],
  );

  const validate = React.useCallback(() => {
    const nextErrors = validateCreateHospitalEventForm(form, thumbnailImage, eventPageImage, selectedCategoryUsage, {
      hasExistingThumbnailImage: Boolean(existingThumbnailImage),
      hasExistingEventPageImage: Boolean(existingEventPageImage),
    });
    if (eventPriceError) {
      nextErrors.event_price = eventPriceError;
    }
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      window.setTimeout(() => focusFirstErrorField(nextErrors), 0);
      return false;
    }

    return true;
  }, [
    eventPageImage,
    eventPriceError,
    existingEventPageImage,
    existingThumbnailImage,
    focusFirstErrorField,
    form,
    selectedCategoryUsage,
    thumbnailImage,
  ]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;
    if (mode === "edit" && (!eventId || !Number.isFinite(eventId) || eventId <= 0)) return;
    if (mode === "duplicate" && (!sourceEventId || !Number.isFinite(sourceEventId) || sourceEventId <= 0)) return;

    const formData = buildHospitalEventFormData({
      form,
      thumbnailImage,
      eventPageImage,
      selectedCategoryUsage,
      includeDefaultStatuses: mode !== "edit",
    });
    setIsSubmitting(true);

    try {
      const response = await (async () => {
        if (mode === "edit") {
          return api.post<HospitalEventApiItem>(`/hospital-events/${eventId}`, formData);
        }

        if (mode === "duplicate") {
          return api.post<EventCreateResponse>(`/hospital-events/${sourceEventId}/duplicate`, formData);
        }

        return api.post<EventCreateResponse>("/hospital-events", formData);
      })();

      if (!isApiSuccess(response)) {
        const nextErrors = extractHospitalEventFieldErrors(response.error.details);
        if (Object.keys(nextErrors).length > 0) {
          setErrors(nextErrors);
          window.setTimeout(() => focusFirstErrorField(nextErrors), 0);
        }

        showAlert({
          variant: "error",
          title: mode === "edit" ? "이벤트 수정 실패" : "이벤트 등록 실패",
          message:
            response.error.message || (mode === "edit" ? "이벤트 수정에 실패했습니다." : "이벤트 등록에 실패했습니다."),
        });
        return;
      }

      showAlert({
        variant: "success",
        title: mode === "edit" ? "이벤트 수정 완료" : "이벤트 등록 완료",
        message:
          mode === "edit" ? "수정한 이벤트 정보를 확인할 수 있습니다." : "등록된 이벤트를 목록에서 확인할 수 있습니다.",
      });
      router.push(mode === "edit" ? detailPath : getReturnToPath(Number(response.data.id)));
    } catch {
      showAlert({
        variant: "error",
        title: mode === "edit" ? "이벤트 수정 실패" : "이벤트 등록 실패",
        message: mode === "edit" ? "이벤트 수정 중 오류가 발생했습니다." : "이벤트 등록 중 오류가 발생했습니다.",
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
        <Button type="button" variant="brand" size="sm" onClick={openAppPreview}>
          미리보기 적용
        </Button>
        <Button type="submit" form={EVENT_CREATE_FORM_ID} variant="brand" size="sm" disabled={isSubmitting}>
          {isSubmitting ? "저장 중..." : mode === "edit" ? "저장하기" : "등록하기"}
        </Button>
      </>
    ),
    [getReturnToPath, isSubmitting, mode, openAppPreview, router],
  );

  usePageHeaderExtra(isLoading || loadError ? null : headerActions);

  if (isLoading) {
    return <SpinnerBlock className="min-h-[60vh]" spinnerClassName="size-10" label="이벤트 정보를 불러오는 중" />;
  }

  if (loadError) {
    return (
      <LoadErrorState
        title="이벤트 정보를 불러오지 못했습니다."
        message={loadError}
        onRetry={() => void fetchEvent()}
      />
    );
  }

  return (
    <>
      <form
        id={EVENT_CREATE_FORM_ID}
        onSubmit={handleSubmit}
        autoComplete="off"
        className="grid min-w-0 gap-4 xl:grid-cols-[minmax(450px,1fr)_minmax(390px,0.9fr)_minmax(280px,0.55fr)]"
      >
        <div className="min-w-0 space-y-4">
          <HospitalPickerCard
            selectedHospital={selectedHospital}
            error={errors.hospital_id}
            onSelectHospital={handleSelectHospital}
            onClearHospital={handleClearHospital}
          />

          <CategoryDoctorPickerCard
            selectedIds={form.category_ids}
            selectedItems={selectedCategoryItems}
            primaryCategoryId={form.primary_category_id}
            activeSectionKey={categorySectionKey}
            isMaleTargeted={form.is_male_targeted}
            error={errors.category_ids}
            primaryError={errors.primary_category_id}
            loadCategories={loadEventCategories}
            onToggleCategory={toggleCategory}
            onSectionChangeRequest={requestCategorySectionChange}
            onPrimaryCategoryChange={(value) => setField("primary_category_id", value ? Number(value) : null)}
            onMaleTargetedChange={(checked) => setField("is_male_targeted", checked)}
            hospitalId={form.hospital_id}
            doctors={doctorOptionsResult.options}
            isLoading={doctorOptionsResult.isLoading}
            loadError={doctorOptionsResult.error}
            assignments={form.doctor_assignments}
            onSelectDoctor={setDoctorAssignment}
          />
        </div>

        <EventInfoCard
          form={form}
          errors={errors}
          isTreatmentEvent={isTreatmentEvent}
          discountRate={discountRate}
          eventPriceError={eventPriceError}
          thumbnailImage={thumbnailImage}
          eventPageImage={eventPageImage}
          existingThumbnailImage={existingThumbnailImage}
          existingEventPageImage={existingEventPageImage}
          onThumbnailChange={(file) => {
            setThumbnailImage(file);
            clearError("thumbnail_image");
          }}
          onEventPageChange={(file) => {
            setEventPageImage(file);
            clearError("event_page_image");
          }}
          onUploadWarning={setUploadWarning}
          onFieldChange={setField}
          onOptionChange={setOption}
          onAddOption={() => setField("options", [...form.options, emptyEventOption()])}
          onRemoveOption={(index) =>
            setField(
              "options",
              form.options.filter((_, optionIndex) => optionIndex !== index),
            )
          }
          onAddTextItem={(key) => setField(key, [...form[key], ""])}
          onRemoveTextItem={(key, index) =>
            setField(
              key,
              form[key].filter((_, itemIndex) => itemIndex !== index),
            )
          }
          onTextItemChange={(key, index, value) => {
            const nextItems = [...form[key]];
            nextItems[index] = value.slice(0, 90);
            setField(key, nextItems);
          }}
        />

        <HospitalEventMediaCard
          eventType={form.event_type}
          thumbnailImage={thumbnailImage}
          eventPageImage={eventPageImage}
          existingThumbnailImage={existingThumbnailImage}
          existingEventPageImage={existingEventPageImage}
          onThumbnailChange={(file) => {
            setThumbnailImage(file);
            clearError("thumbnail_image");
          }}
          onEventPageChange={(file) => {
            setEventPageImage(file);
            clearError("event_page_image");
          }}
          onPreview={setPreviewMedia}
          onUploadWarning={setUploadWarning}
        />
      </form>

      <Modal
        isOpen={Boolean(pendingCategorySectionKey)}
        onClose={closeCategorySectionConfirmModal}
        showCloseButton={false}
        className="mx-4 w-full max-w-md"
      >
        <ModalPanel>
          <ModalHeader className="pr-0">
            <ModalTitle>카테고리 전환</ModalTitle>
          </ModalHeader>

          <ModalBody className="mt-5">
            <p className="text-sm leading-6 font-medium text-gray-800">
              카테고리 전환 시 기존 선택된 카테고리가 초기화 됩니다. 전환하시겠습니까?
            </p>
          </ModalBody>

          <ModalFooter>
            <Button type="button" variant="outline" onClick={closeCategorySectionConfirmModal}>
              취소
            </Button>
            <Button type="button" variant="brand" onClick={confirmCategorySectionChange}>
              확인
            </Button>
          </ModalFooter>
        </ModalPanel>
      </Modal>

      <HospitalEventAppPreviewModal
        isOpen={isAppPreviewOpen}
        onClose={closeAppPreview}
        form={form}
        thumbnailImage={thumbnailImage}
        eventPageImage={eventPageImage}
        existingThumbnailImage={existingThumbnailImage}
        existingEventPageImage={existingEventPageImage}
        discountRate={discountRate}
      />

      <HospitalMediaPreviewModal preview={previewMedia} onChange={setPreviewMedia} onClose={closePreviewMedia} />
      <UploadWarningModal message={uploadWarning} onClose={closeUploadWarning} />
    </>
  );
}
