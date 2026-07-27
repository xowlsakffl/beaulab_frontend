"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button, SpinnerBlock, useGlobalAlert } from "@beaulab/ui-admin";
import { isApiSuccess } from "@beaulab/types";

import { LoadErrorState } from "@/components/common/LoadErrorState";
import { EventAdCategorySelectModal } from "@/components/hospital-event-ad/form/EventAdCategorySelectModal";
import { EventAdDateStep } from "@/components/hospital-event-ad/form/EventAdDateStep";
import { EventAdFormStep } from "@/components/hospital-event-ad/form/EventAdFormStep";
import { EventAdPlacementStep } from "@/components/hospital-event-ad/form/EventAdPlacementStep";
import { api } from "@/lib/common/api";
import { getSession } from "@/lib/common/auth/session";
import { CATEGORY_DOMAINS, type CategoryApiItem } from "@/lib/common/category";
import { usePageHeaderExtra } from "@/lib/common/routing/page-header-extra";
import type { DoctorHospitalOption } from "@/lib/doctor/form";
import { type HospitalEventApiItem } from "@/lib/hospital-event/list";
import { type EventAdApiItem } from "@/lib/hospital-event-ad/list";
import {
  EVENT_AD_CREATE_FORM_ID,
  EVENT_AD_PLACEMENT_GROUPS,
  FALLBACK_EVENT_AD_PLACEMENT_OPTIONS,
  INITIAL_EVENT_AD_CREATE_FORM,
  buildEventAdCreateFormData,
  extractEventAdCreateFieldErrors,
  isSelectableEventAdHospitalEvent,
  monthKey,
  normalizeEventAdCategoryOptions,
  normalizeEventAdHospitalEventOption,
  normalizeEventAdPlacementOptions,
  startOfMonth,
  validateEventAdCreateForm,
  type EventAdAvailabilityResponse,
  type EventAdAvailabilityWeek,
  type EventAdCategoryOption,
  type EventAdCreateFormErrors,
  type EventAdCreateFormValues,
  type EventAdHospitalEventOption,
  type EventAdPlacementGroupKey,
  type EventAdPlacementOption,
} from "@/lib/hospital-event-ad/form";

type StepKey = "placement" | "date" | "form";

export default function EventAdsCreateFormClient() {
  const router = useRouter();
  const { showAlert } = useGlobalAlert();
  const [step, setStep] = React.useState<StepKey>("placement");
  const [placementOptions, setPlacementOptions] = React.useState<EventAdPlacementOption[]>([]);
  const [activeGroup, setActiveGroup] = React.useState<EventAdPlacementGroupKey>("main");
  const [selectedPlacement, setSelectedPlacement] = React.useState<EventAdPlacementOption | null>(null);
  const [selectedCategory, setSelectedCategory] = React.useState<EventAdCategoryOption | null>(null);
  const [selectedWeek, setSelectedWeek] = React.useState<EventAdAvailabilityWeek | null>(null);
  const [isLoadingPlacements, setIsLoadingPlacements] = React.useState(true);
  const [placementLoadError, setPlacementLoadError] = React.useState<string | null>(null);
  const [categoryModalPlacement, setCategoryModalPlacement] = React.useState<EventAdPlacementOption | null>(null);
  const [categoryOptions, setCategoryOptions] = React.useState<EventAdCategoryOption[]>([]);
  const [categoryModalSelectedId, setCategoryModalSelectedId] = React.useState<number | null>(null);
  const [isLoadingCategories, setIsLoadingCategories] = React.useState(false);
  const [categoryLoadError, setCategoryLoadError] = React.useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = React.useState(() => startOfMonth(new Date()));
  const [availabilityWeeks, setAvailabilityWeeks] = React.useState<EventAdAvailabilityWeek[]>([]);
  const [isLoadingAvailability, setIsLoadingAvailability] = React.useState(false);
  const [availabilityError, setAvailabilityError] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<EventAdCreateFormValues>(INITIAL_EVENT_AD_CREATE_FORM);
  const [errors, setErrors] = React.useState<EventAdCreateFormErrors>({});
  const [eventOptions, setEventOptions] = React.useState<EventAdHospitalEventOption[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = React.useState(false);
  const [eventLoadError, setEventLoadError] = React.useState<string | null>(null);
  const [adImageFile, setAdImageFile] = React.useState<File | null>(null);
  const [isFreeAd, setIsFreeAd] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const availabilityRequestIdRef = React.useRef(0);

  const placementMap = React.useMemo(
    () => new Map(placementOptions.map((option) => [option.value, option])),
    [placementOptions],
  );
  const visiblePlacementOptions = React.useMemo(() => {
    const group = EVENT_AD_PLACEMENT_GROUPS.find((item) => item.key === activeGroup);

    return (group?.values ?? []).map((value) => placementMap.get(value)).filter(Boolean) as EventAdPlacementOption[];
  }, [activeGroup, placementMap]);

  const selectedCategoryForModal = React.useMemo(
    () => categoryOptions.find((category) => category.id === categoryModalSelectedId) ?? null,
    [categoryModalSelectedId, categoryOptions],
  );

  const fetchPlacementOptions = React.useCallback(async () => {
    setIsLoadingPlacements(true);
    setPlacementLoadError(null);

    try {
      const response = await api.get<EventAdPlacementOption[]>("/hospital-event-ads/placements");

      if (!isApiSuccess(response)) {
        setPlacementLoadError(response.error.message || "광고 위치를 불러오지 못했습니다.");
        setPlacementOptions(FALLBACK_EVENT_AD_PLACEMENT_OPTIONS);
        return;
      }

      setPlacementOptions(normalizeEventAdPlacementOptions(response.data));
    } catch {
      setPlacementLoadError("광고 위치를 불러오는 중 오류가 발생했습니다.");
      setPlacementOptions(FALLBACK_EVENT_AD_PLACEMENT_OPTIONS);
    } finally {
      setIsLoadingPlacements(false);
    }
  }, []);

  React.useEffect(() => {
    void fetchPlacementOptions();
  }, [fetchPlacementOptions]);

  const fetchCategories = React.useCallback(async (placement: EventAdPlacementOption) => {
    if (!placement.category_usage) {
      setCategoryOptions([]);
      return;
    }

    setIsLoadingCategories(true);
    setCategoryLoadError(null);
    setCategoryOptions([]);

    try {
      const response = await api.get<CategoryApiItem[]>("/categories/selector", {
        domain: CATEGORY_DOMAINS.HOSPITAL_MEDICAL,
        usage: placement.category_usage,
        status: ["ACTIVE"],
        per_page: 100,
      });

      if (!isApiSuccess(response)) {
        setCategoryLoadError(response.error.message || "카테고리 목록을 불러오지 못했습니다.");
        return;
      }

      setCategoryOptions(normalizeEventAdCategoryOptions(placement.category_usage, response.data));
    } catch {
      setCategoryLoadError("카테고리 목록을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoadingCategories(false);
    }
  }, []);

  const openCategoryModal = React.useCallback(
    (placement: EventAdPlacementOption) => {
      setCategoryModalPlacement(placement);
      setCategoryModalSelectedId(null);
      void fetchCategories(placement);
    },
    [fetchCategories],
  );

  const handleSelectPlacement = React.useCallback(
    (placement: EventAdPlacementOption) => {
      setSelectedWeek(null);

      if (placement.category_required) {
        openCategoryModal(placement);
        return;
      }

      setSelectedPlacement(placement);
      setSelectedCategory(null);
      setCalendarMonth(startOfMonth(new Date()));
      setStep("date");
    },
    [openCategoryModal],
  );

  const closeCategoryModal = React.useCallback(() => {
    setCategoryModalPlacement(null);
    setCategoryOptions([]);
    setCategoryModalSelectedId(null);
    setCategoryLoadError(null);
  }, []);

  const confirmCategoryModal = React.useCallback(() => {
    if (!categoryModalPlacement || !selectedCategoryForModal) return;

    setSelectedPlacement(categoryModalPlacement);
    setSelectedCategory(selectedCategoryForModal);
    setSelectedWeek(null);
    setCalendarMonth(startOfMonth(new Date()));
    setStep("date");
    closeCategoryModal();
  }, [categoryModalPlacement, closeCategoryModal, selectedCategoryForModal]);

  const fetchAvailability = React.useCallback(async () => {
    if (!selectedPlacement) return;
    if (selectedPlacement.category_required && !selectedCategory) return;

    availabilityRequestIdRef.current += 1;
    const requestId = availabilityRequestIdRef.current;

    setIsLoadingAvailability(true);
    setAvailabilityError(null);

    try {
      const response = await api.get<EventAdAvailabilityResponse>("/hospital-event-ads/availability", {
        placement: selectedPlacement.value,
        category_id: selectedCategory?.id ?? undefined,
        month: monthKey(calendarMonth),
      });

      if (requestId !== availabilityRequestIdRef.current) return;

      if (!isApiSuccess(response)) {
        setAvailabilityError(response.error.message || "광고 예약 현황을 불러오지 못했습니다.");
        setAvailabilityWeeks([]);
        return;
      }

      setAvailabilityWeeks(response.data.weeks);
    } catch {
      if (requestId !== availabilityRequestIdRef.current) return;

      setAvailabilityError("광고 예약 현황을 불러오는 중 오류가 발생했습니다.");
      setAvailabilityWeeks([]);
    } finally {
      if (requestId === availabilityRequestIdRef.current) {
        setIsLoadingAvailability(false);
      }
    }
  }, [calendarMonth, selectedCategory, selectedPlacement]);

  React.useEffect(() => {
    if (step !== "date") return;

    void fetchAvailability();
  }, [fetchAvailability, step]);

  const fetchEvents = React.useCallback(async (hospitalId: number | null) => {
    if (!hospitalId) {
      setEventOptions([]);
      setEventLoadError(null);
      return;
    }

    setIsLoadingEvents(true);
    setEventLoadError(null);

    try {
      const response = await api.get<HospitalEventApiItem[]>("/hospital-events", {
        hospital_id: hospitalId,
        allow_status: "APPROVED",
        admin_status: "NORMAL",
        sort: "id",
        direction: "desc",
        per_page: 50,
      });

      if (!isApiSuccess(response)) {
        setEventOptions([]);
        setEventLoadError(response.error.message || "이벤트 목록을 불러오지 못했습니다.");
        return;
      }

      setEventOptions(response.data.filter(isSelectableEventAdHospitalEvent).map(normalizeEventAdHospitalEventOption));
    } catch {
      setEventOptions([]);
      setEventLoadError("이벤트 목록을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoadingEvents(false);
    }
  }, []);

  React.useEffect(() => {
    if (step !== "form") return;

    void fetchEvents(form.hospital_id);
  }, [fetchEvents, form.hospital_id, step]);

  const setField = React.useCallback(
    <K extends keyof EventAdCreateFormValues>(key: K, value: EventAdCreateFormValues[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      setErrors((prev) => {
        if (!prev[key as keyof EventAdCreateFormErrors]) return prev;

        const next = { ...prev };
        delete next[key as keyof EventAdCreateFormErrors];
        return next;
      });
    },
    [],
  );

  const handleSelectHospital = React.useCallback((hospital: DoctorHospitalOption) => {
    setForm((prev) => ({
      ...prev,
      hospital_id: hospital.id,
      hospital_name: hospital.name,
      hospital_business_number: hospital.business_number?.trim() ?? "",
      hospital_event_id: null,
    }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.hospital_id;
      delete next.hospital_event_id;
      return next;
    });
    setEventOptions([]);
  }, []);

  const handleClearHospital = React.useCallback(() => {
    setForm((prev) => ({
      ...prev,
      hospital_id: null,
      hospital_name: "",
      hospital_business_number: "",
      hospital_event_id: null,
    }));
    setEventOptions([]);
  }, []);

  const handleSelectWeek = React.useCallback((week: EventAdAvailabilityWeek) => {
    if (week.is_sold_out || week.remaining_count <= 0) return;

    setSelectedWeek(week);
    setStep("form");
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedPlacement || !selectedWeek) return;

    const nextErrors = validateEventAdCreateForm(form, adImageFile);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const session = getSession();
      const managerStaffId = Number((session?.profile as { id?: number | string } | undefined)?.id ?? 0);
      const formData = buildEventAdCreateFormData({
        form,
        selectedPlacement,
        selectedCategory,
        selectedWeek,
        adImageFile,
        isFreeAd,
        managerStaffId: Number.isFinite(managerStaffId) && managerStaffId > 0 ? managerStaffId : null,
      });
      const response = await api.post<EventAdApiItem>("/hospital-event-ads", formData);

      if (!isApiSuccess(response)) {
        const apiErrors = extractEventAdCreateFieldErrors(response.error.details);
        if (Object.keys(apiErrors).length > 0) {
          setErrors(apiErrors);
        }

        showAlert({
          variant: "error",
          title: "광고 등록 실패",
          message: response.error.message || "광고 등록에 실패했습니다.",
        });
        return;
      }

      showAlert({
        variant: "success",
        title: "광고 등록 완료",
        message: "등록한 광고를 목록에서 확인할 수 있습니다.",
      });
      router.push(`/ads-manage/event-ads?highlight=${response.data.id}`);
    } catch {
      showAlert({
        variant: "error",
        title: "광고 등록 실패",
        message: "광고 등록 중 오류가 발생했습니다.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const headerActions = React.useMemo(() => {
    if (step !== "form") return null;

    return (
      <>
        <Button type="button" variant="outline" size="sm" onClick={() => router.push("/ads-manage/event-ads")}>
          취소
        </Button>
        <Button type="submit" form={EVENT_AD_CREATE_FORM_ID} variant="brand" size="sm" disabled={isSubmitting}>
          {isSubmitting ? "저장 중..." : "저장하기"}
        </Button>
      </>
    );
  }, [isSubmitting, router, step]);

  usePageHeaderExtra(headerActions);

  if (isLoadingPlacements) {
    return <SpinnerBlock className="min-h-[60vh]" spinnerClassName="size-10" label="광고 위치를 불러오는 중" />;
  }

  if (placementLoadError && placementOptions.length === 0) {
    return (
      <LoadErrorState
        title="광고 위치를 불러오지 못했습니다."
        message={placementLoadError}
        onRetry={() => void fetchPlacementOptions()}
      />
    );
  }

  return (
    <>
      <div className="space-y-6">
        {step === "placement" ? (
          <EventAdPlacementStep
            activeGroup={activeGroup}
            placementOptions={visiblePlacementOptions}
            onGroupChange={setActiveGroup}
            onSelectPlacement={handleSelectPlacement}
          />
        ) : null}

        {step === "date" && selectedPlacement ? (
          <EventAdDateStep
            selectedPlacement={selectedPlacement}
            selectedCategory={selectedCategory}
            calendarMonth={calendarMonth}
            availabilityWeeks={availabilityWeeks}
            isLoading={isLoadingAvailability}
            error={availabilityError}
            onMonthChange={setCalendarMonth}
            onRefresh={() => void fetchAvailability()}
            onSelectWeek={handleSelectWeek}
            onBack={() => setStep("placement")}
          />
        ) : null}

        {step === "form" && selectedPlacement && selectedWeek ? (
          <EventAdFormStep
            form={form}
            errors={errors}
            selectedPlacement={selectedPlacement}
            selectedCategory={selectedCategory}
            selectedWeek={selectedWeek}
            eventOptions={eventOptions}
            isLoadingEvents={isLoadingEvents}
            eventLoadError={eventLoadError}
            adImageFile={adImageFile}
            isFreeAd={isFreeAd}
            onSubmit={handleSubmit}
            onBack={() => setStep("date")}
            onSetField={setField}
            onSelectHospital={handleSelectHospital}
            onClearHospital={handleClearHospital}
            onSetAdImageFile={(file) => {
              setAdImageFile(file);
              setErrors((prev) => {
                const next = { ...prev };
                delete next.ad_image_file;
                return next;
              });
            }}
            onAdImageError={(message) => setErrors((prev) => ({ ...prev, ad_image_file: message }))}
            onFreeAdChange={setIsFreeAd}
          />
        ) : null}
      </div>

      <EventAdCategorySelectModal
        placement={categoryModalPlacement}
        categories={categoryOptions}
        selectedCategoryId={categoryModalSelectedId}
        isLoading={isLoadingCategories}
        error={categoryLoadError}
        onSelectCategory={setCategoryModalSelectedId}
        onClose={closeCategoryModal}
        onConfirm={confirmCategoryModal}
      />
    </>
  );
}
