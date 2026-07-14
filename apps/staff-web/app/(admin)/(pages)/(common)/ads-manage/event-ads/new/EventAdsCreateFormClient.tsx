"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  ArrowLeft,
  FormCheckbox,
  InputField,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalPanel,
  ModalTitle,
  SegmentedTabs,
  SpinnerBlock,
  WeeklyReservationCalendar,
  useGlobalAlert,
} from "@beaulab/ui-admin";
import { isApiSuccess } from "@beaulab/types";

import { LoadErrorState } from "@/components/common/LoadErrorState";
import { useObjectUrl } from "@/hooks/common/useObjectUrl";
import { useDoctorHospitalOptions } from "@/hooks/doctor/useDoctorHospitalOptions";
import { api } from "@/lib/common/api";
import { getSession } from "@/lib/common/auth/session";
import { CATEGORY_DOMAINS, type CategoryApiItem } from "@/lib/common/category";
import { usePageHeaderExtra } from "@/lib/common/routing/page-header-extra";
import type { DoctorHospitalOption } from "@/lib/doctor/form";
import { resolveHospitalEventMediaUrl, type HospitalEventApiItem } from "@/lib/hospital-event/list";
import type { EventAdApiItem } from "@/lib/hospital-event-ad/list";
import {
  EVENT_AD_CREATE_FORM_ID,
  EVENT_AD_PLACEMENT_GROUPS,
  FALLBACK_EVENT_AD_PLACEMENT_OPTIONS,
  INITIAL_EVENT_AD_CREATE_FORM,
  buildEventAdCreateFormData,
  eventAdStartDayLabel,
  formatEventAdMonthLabel,
  formatEventAdPeriodLabel,
  isCurrentOrNextMonth,
  monthKey,
  normalizeEventAdCategoryOptions,
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
        sort: "id",
        direction: "desc",
        per_page: 50,
      });

      if (!isApiSuccess(response)) {
        setEventOptions([]);
        setEventLoadError(response.error.message || "이벤트 목록을 불러오지 못했습니다.");
        return;
      }

      setEventOptions(response.data.map(normalizeEventOptionForAd));
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
          <PlacementStep
            activeGroup={activeGroup}
            placementOptions={visiblePlacementOptions}
            onGroupChange={setActiveGroup}
            onSelectPlacement={handleSelectPlacement}
          />
        ) : null}

        {step === "date" && selectedPlacement ? (
          <DateStep
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
          <FormStep
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

      <CategorySelectModal
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

function PlacementStep({
  activeGroup,
  placementOptions,
  onGroupChange,
  onSelectPlacement,
}: {
  activeGroup: EventAdPlacementGroupKey;
  placementOptions: EventAdPlacementOption[];
  onGroupChange: (group: EventAdPlacementGroupKey) => void;
  onSelectPlacement: (placement: EventAdPlacementOption) => void;
}) {
  return (
    <Card className="rounded-xl p-8">
      <div className="space-y-8">
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-gray-900">원하는 광고 위치를 선택해주세요</h2>
          <p className="text-sm text-gray-500">원하는 위치의 광고를 일주일동안 노출시켜드립니다.</p>
        </div>

        <SegmentedTabs
          items={EVENT_AD_PLACEMENT_GROUPS.map((group) => ({ value: group.key, label: group.label }))}
          value={activeGroup}
          onValueChange={onGroupChange}
          className="w-fit min-w-[27rem] rounded-lg border border-gray-200 p-0.5"
          tabClassName="h-9 min-w-24 rounded-md px-4 py-1.5 text-sm font-semibold"
          activeTabClassName="bg-brand-500 text-white shadow-sm"
          inactiveTabClassName="text-gray-500 hover:text-brand-500"
        />

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {placementOptions.map((placement) => (
            <PlacementCard key={placement.value} placement={placement} onClick={() => onSelectPlacement(placement)} />
          ))}
        </div>
      </div>
    </Card>
  );
}

function PlacementCard({ placement, onClick }: { placement: EventAdPlacementOption; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group min-h-32 min-w-0 rounded-xl border border-gray-200 bg-white p-5 text-left transition hover:border-brand-400 hover:bg-brand-50/40 hover:shadow-md"
    >
      <div className="space-y-2">
        <p className="text-sm font-bold text-gray-900">{placement.label}</p>
      </div>
    </button>
  );
}

function DateStep({
  selectedPlacement,
  selectedCategory,
  calendarMonth,
  availabilityWeeks,
  isLoading,
  error,
  onMonthChange,
  onRefresh,
  onSelectWeek,
  onBack,
}: {
  selectedPlacement: EventAdPlacementOption;
  selectedCategory: EventAdCategoryOption | null;
  calendarMonth: Date;
  availabilityWeeks: EventAdAvailabilityWeek[];
  isLoading: boolean;
  error: string | null;
  onMonthChange: (month: Date) => void;
  onRefresh: () => void;
  onSelectWeek: (week: EventAdAvailabilityWeek) => void;
  onBack: () => void;
}) {
  const startDayLabel = eventAdStartDayLabel(selectedPlacement);

  return (
    <Card className="rounded-xl p-8">
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 text-sm">
            <p className="font-bold text-gray-900">상품 구매 유의사항</p>
            <ul className="space-y-1 pl-1 text-gray-600">
              <li className="relative pl-3 before:absolute before:top-2 before:left-0 before:size-1 before:rounded-full before:bg-gray-400">
                희망 노출 시작일은 {startDayLabel}만 선택 가능하며, 선택한 날짜로부터 7일간 자동으로 지정됩니다.
              </li>
              <li className="relative pl-3 before:absolute before:top-2 before:left-0 before:size-1 before:rounded-full before:bg-gray-400">
                배너광고는 주단위로 판매되며 광고 시작일 11:00부터 차주 {startDayLabel} 10:59:59 까지 노출돼요.
              </li>
              <li className="relative pl-3 before:absolute before:top-2 before:left-0 before:size-1 before:rounded-full before:bg-gray-400">
                매월 첫 영업일 오전 9시 30분에 차월 광고 구매가 가능해요.
              </li>
              <li className="relative pl-3 before:absolute before:top-2 before:left-0 before:size-1 before:rounded-full before:bg-gray-400">
                광고 게시일 2 영업일전까지만 신청이 가능해요.
              </li>
            </ul>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border border-gray-200 px-3 text-sm font-semibold text-gray-600 transition hover:border-brand-300 hover:text-brand-500"
          >
            <ArrowLeft className="size-4" />
            <span>뒤로가기</span>
          </button>
        </div>

        <div className="grid gap-8 xl:grid-cols-[340px_minmax(0,1fr)]">
          <aside>
            <div>
              <p className="text-sm font-bold text-gray-900">선택한 광고위치</p>
              <div className="mt-2 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm font-bold text-gray-900">{selectedPlacement.label}</p>
              </div>
              {selectedCategory ? (
                <p className="mt-3 text-xs font-semibold text-brand-500">
                  {selectedCategory.display_name || selectedCategory.name}
                </p>
              ) : null}
            </div>
          </aside>

          <section className="min-w-0">
            {error ? (
              <LoadErrorState title="광고 예약 현황을 불러오지 못했습니다." message={error} onRetry={onRefresh} />
            ) : (
              <WeeklyReservationCalendar<EventAdAvailabilityWeek>
                month={calendarMonth}
                weeks={availabilityWeeks}
                getWeekDate={(week) => week.date}
                getRemainingCount={(week) => week.remaining_count}
                getSlotLimit={(week) => week.slot_limit}
                getIsSoldOut={(week) => week.is_sold_out}
                canGoPrev={isCurrentOrNextMonth(calendarMonth, "prev")}
                canGoNext={isCurrentOrNextMonth(calendarMonth, "next")}
                isLoading={isLoading}
                loadingLabel="예약 현황을 불러오는 중"
                monthLabel={formatEventAdMonthLabel(calendarMonth)}
                availableLabel={(week) => `예약가능(${week.reserved_count}/${week.slot_limit})`}
                showSoldOutWeekRange
                onMonthChange={onMonthChange}
                onSelectWeek={onSelectWeek}
              />
            )}
          </section>
        </div>
      </div>
    </Card>
  );
}

function FormStep({
  form,
  errors,
  selectedPlacement,
  selectedCategory,
  selectedWeek,
  eventOptions,
  isLoadingEvents,
  eventLoadError,
  adImageFile,
  isFreeAd,
  onSubmit,
  onBack,
  onSetField,
  onSelectHospital,
  onClearHospital,
  onSetAdImageFile,
  onAdImageError,
  onFreeAdChange,
}: {
  form: EventAdCreateFormValues;
  errors: EventAdCreateFormErrors;
  selectedPlacement: EventAdPlacementOption;
  selectedCategory: EventAdCategoryOption | null;
  selectedWeek: EventAdAvailabilityWeek;
  eventOptions: EventAdHospitalEventOption[];
  isLoadingEvents: boolean;
  eventLoadError: string | null;
  adImageFile: File | null;
  isFreeAd: boolean;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onBack: () => void;
  onSetField: <K extends keyof EventAdCreateFormValues>(key: K, value: EventAdCreateFormValues[K]) => void;
  onSelectHospital: (hospital: DoctorHospitalOption) => void;
  onClearHospital: () => void;
  onSetAdImageFile: (file: File | null) => void;
  onAdImageError: (message: string) => void;
  onFreeAdChange: (checked: boolean) => void;
}) {
  return (
    <form id={EVENT_AD_CREATE_FORM_ID} onSubmit={onSubmit} autoComplete="off" className="space-y-4">
      <Card className="relative rounded-xl p-6">
        <div className="absolute top-6 right-6">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border border-gray-200 px-3 text-sm font-semibold text-gray-600 transition hover:border-brand-300 hover:text-brand-500"
          >
            <ArrowLeft className="size-4" />
            <span>뒤로가기</span>
          </button>
        </div>

        <div className="grid gap-8 xl:grid-cols-[22rem_minmax(0,1fr)]">
          <div className="min-w-0">
            <AdTemporaryPreviewCard adImageFile={adImageFile} />
          </div>

          <div className="max-w-[34rem] min-w-0 space-y-4">
            <h2 className="text-sm font-bold text-gray-900">상품정보</h2>
            <InfoRow label="광고위치" value={selectedPlacement.label} />
            {selectedCategory ? (
              <InfoRow label="카테고리" value={selectedCategory.display_name || selectedCategory.name} />
            ) : null}
            <InfoRow label="광고기간" value={formatEventAdPeriodLabel(selectedWeek)} />
            <FormRow label="금액">
              <div className="flex h-9 items-center gap-4">
                <span className="text-sm font-semibold text-gray-800">
                  {isFreeAd ? "0원" : formatEventAdCost(selectedPlacement.cost)}
                </span>
                <FormCheckbox checked={isFreeAd} onChange={onFreeAdChange} label="무료이벤트" />
              </div>
            </FormRow>

            <HospitalSearchRow
              selectedHospital={
                form.hospital_id
                  ? {
                      id: form.hospital_id,
                      name: form.hospital_name,
                      business_number: form.hospital_business_number,
                    }
                  : null
              }
              error={errors.hospital_id}
              onSelectHospital={onSelectHospital}
              onClearHospital={onClearHospital}
            />

            <EventSearchRow
              selectedEvent={eventOptions.find((event) => event.id === form.hospital_event_id) ?? null}
              eventOptions={eventOptions}
              disabled={!form.hospital_id || isLoadingEvents}
              isLoading={isLoadingEvents}
              error={errors.hospital_event_id || eventLoadError || undefined}
              placeholder={
                !form.hospital_id
                  ? "병의원을 먼저 선택해 주세요."
                  : isLoadingEvents
                    ? "이벤트 불러오는 중"
                    : "이벤트를 선택해 주세요."
              }
              onSelectEvent={(event) => onSetField("hospital_event_id", event.id)}
              onClearEvent={() => onSetField("hospital_event_id", null)}
            />

            <AdImageFileRow
              file={adImageFile}
              error={errors.ad_image_file}
              onChange={onSetAdImageFile}
              onValidationError={onAdImageError}
            />
          </div>
        </div>
      </Card>
    </form>
  );
}

const EVENT_AD_IMAGE_ACCEPT = "image/jpeg,image/png";
const EVENT_AD_IMAGE_MAX_SIZE = 10 * 1024 * 1024;
const eventAdInputClassName = "h-9 bg-white px-3 text-sm";
const eventAdLabelClassName = "pt-2 text-xs font-semibold text-gray-500";

function AdTemporaryPreviewCard({ adImageFile }: { adImageFile: File | null }) {
  const imageUrl = useObjectUrl(adImageFile);

  return (
    <div className="min-w-0">
      <h2 className="text-sm font-bold text-gray-900">미리보기</h2>
      <div className="mt-4 w-full rounded-[1.75rem] border border-gray-200 bg-white p-2 shadow-sm">
        <div className="mb-3 flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-brand-400" />
          <span className="h-2 w-10 rounded-full bg-gray-200" />
        </div>
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
            <img src={imageUrl} alt="광고 이미지 미리보기" className="aspect-[4/3] w-full object-cover" />
          ) : (
            <div className="flex aspect-[4/3] items-center justify-center px-6 text-center text-xs font-semibold text-gray-400">
              광고 이미지 미리보기
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AdImageFileRow({
  file,
  error,
  onChange,
  onValidationError,
}: {
  file: File | null;
  error?: string;
  onChange: (file: File | null) => void;
  onValidationError: (message: string) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] ?? null;
    event.currentTarget.value = "";

    if (!selectedFile) return;

    if (!EVENT_AD_IMAGE_ACCEPT.split(",").includes(selectedFile.type)) {
      onValidationError("광고 이미지는 jpg, jpeg, png 파일만 업로드할 수 있습니다.");
      return;
    }

    if (selectedFile.size > EVENT_AD_IMAGE_MAX_SIZE) {
      onValidationError("광고 이미지는 최대 10MB 이하로 업로드해 주세요.");
      return;
    }

    onChange(selectedFile);
  };

  return (
    <FormRow label="광고이미지" error={error}>
      <div className="space-y-2">
        <div className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2">
          <span
            className={[
              "min-w-0 truncate rounded-md px-2 py-1 text-xs",
              file ? "bg-gray-50 font-medium text-gray-700" : "text-gray-500",
            ].join(" ")}
          >
            {file?.name ?? "jpg, jpeg, png / 최대 10MB"}
          </span>
          <Button
            type="button"
            variant="brand"
            size="sm"
            className="h-8 shrink-0 px-3 text-xs"
            onClick={() => inputRef.current?.click()}
          >
            파일선택
          </Button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={EVENT_AD_IMAGE_ACCEPT}
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </FormRow>
  );
}

function EventSearchRow({
  selectedEvent,
  eventOptions,
  disabled,
  isLoading,
  error,
  placeholder,
  onSelectEvent,
  onClearEvent,
}: {
  selectedEvent: EventAdHospitalEventOption | null;
  eventOptions: EventAdHospitalEventOption[];
  disabled: boolean;
  isLoading: boolean;
  error?: string;
  placeholder: string;
  onSelectEvent: (event: EventAdHospitalEventOption) => void;
  onClearEvent: () => void;
}) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const [query, setQuery] = React.useState(selectedEvent?.name ?? "");
  const trimmedQuery = query.trim().toLowerCase();

  const filteredEvents = React.useMemo(() => {
    if (!trimmedQuery) return eventOptions;

    return eventOptions.filter((event) => event.name.toLowerCase().includes(trimmedQuery));
  }, [eventOptions, trimmedQuery]);

  React.useEffect(() => {
    setQuery(selectedEvent?.name ?? "");
  }, [selectedEvent?.id, selectedEvent?.name]);

  React.useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isOpen]);

  return (
    <FormRow label="이벤트" required error={error}>
      <div ref={containerRef} className="relative">
        <InputField
          value={query}
          placeholder={placeholder}
          disabled={disabled}
          onClick={() => {
            if (!disabled) setIsOpen(true);
          }}
          onChange={(event) => {
            const nextQuery = event.target.value;
            setQuery(nextQuery);
            if (selectedEvent && nextQuery !== selectedEvent.name) {
              onClearEvent();
            }
            if (!disabled) setIsOpen(true);
          }}
          className={eventAdInputClassName}
        />

        {isOpen && !disabled ? (
          <Card className="absolute top-full right-0 left-0 z-[80] mt-2 max-h-80 overflow-y-auto rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
            {isLoading ? (
              <div className="py-5">
                <SpinnerBlock className="min-h-0" spinnerClassName="size-5" label="이벤트 검색 중" />
              </div>
            ) : filteredEvents.length === 0 ? (
              <p className="px-3 py-4 text-sm text-gray-500">검색 결과가 없습니다.</p>
            ) : (
              <div className="space-y-1">
                {filteredEvents.slice(0, 8).map((event) => (
                  <EventOptionButton
                    key={event.id}
                    event={event}
                    isSelected={selectedEvent?.id === event.id}
                    onClick={() => {
                      onSelectEvent(event);
                      setQuery(event.name);
                      setIsOpen(false);
                    }}
                  />
                ))}
              </div>
            )}
          </Card>
        ) : null}
      </div>
    </FormRow>
  );
}

function EventOptionButton({
  event,
  isSelected,
  onClick,
}: {
  event: EventAdHospitalEventOption;
  isSelected: boolean;
  onClick: () => void;
}) {
  const thumbnailUrl = resolveHospitalEventMediaUrl(event.thumbnail_image, "thumb");

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex w-full min-w-0 gap-3 rounded-lg p-2 text-left transition hover:bg-brand-50",
        isSelected ? "bg-brand-50" : "",
      ].join(" ")}
    >
      <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50 text-[10px] font-semibold text-gray-400">
        {thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- thumbnail URL from API
          <img src={thumbnailUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          "NO IMG"
        )}
      </span>
      <span className="min-w-0 flex-1 space-y-1">
        <span className="block truncate text-sm font-semibold text-gray-800">{event.name}</span>
        <span className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
          <span>{formatEventAdCost(Number(event.event_price ?? 0))}</span>
          <span>{formatEventOptionDate(event.created_at)}</span>
        </span>
      </span>
    </button>
  );
}

function HospitalSearchRow({
  selectedHospital,
  error,
  onSelectHospital,
  onClearHospital,
}: {
  selectedHospital: DoctorHospitalOption | null;
  error?: string;
  onSelectHospital: (hospital: DoctorHospitalOption) => void;
  onClearHospital: () => void;
}) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const [query, setQuery] = React.useState(selectedHospital?.name ?? "");
  const { options, isLoading, error: loadError } = useDoctorHospitalOptions(isOpen, query);

  React.useEffect(() => {
    setQuery(selectedHospital?.name ?? "");
  }, [selectedHospital?.id, selectedHospital?.name]);

  React.useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isOpen]);

  return (
    <FormRow label="병의원" required error={error}>
      <div ref={containerRef} className="relative">
        <InputField
          value={query}
          placeholder="병의원명을 검색해 주세요."
          onClick={() => setIsOpen(true)}
          onChange={(event) => {
            const nextQuery = event.target.value;
            setQuery(nextQuery);
            if (selectedHospital && nextQuery !== selectedHospital.name) {
              onClearHospital();
            }
            setIsOpen(true);
          }}
          className={eventAdInputClassName}
        />
        {isOpen ? (
          <Card className="absolute top-full right-0 left-0 z-[80] mt-2 max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
            {isLoading ? (
              <div className="py-5">
                <SpinnerBlock className="min-h-0" spinnerClassName="size-5" label="병의원 검색 중" />
              </div>
            ) : loadError ? (
              <p className="px-3 py-4 text-sm text-error-500">{loadError}</p>
            ) : options.length === 0 ? (
              <p className="px-3 py-4 text-sm text-gray-500">검색 결과가 없습니다.</p>
            ) : (
              <div className="space-y-1">
                {options.slice(0, 5).map((hospital) => (
                  <button
                    key={hospital.id}
                    type="button"
                    onClick={() => {
                      onSelectHospital(hospital);
                      setQuery(hospital.name);
                      setIsOpen(false);
                    }}
                    className="w-full rounded-lg px-3 py-2 text-left hover:bg-brand-50"
                  >
                    <span className="block truncate text-sm font-semibold text-gray-800">{hospital.name}</span>
                    <span className="block truncate text-xs text-gray-500">
                      HID {hospital.id} · 사업자등록번호 {hospital.business_number?.trim() || "-"}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </Card>
        ) : null}
      </div>
    </FormRow>
  );
}

function FormRow({
  label,
  required = false,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[6rem_minmax(0,1fr)] items-start gap-3">
      <Label className={eventAdLabelClassName}>
        {label}
        {required ? <span className="ml-0.5 text-brand-500">*</span> : null}
      </Label>
      <div className="min-w-0">
        {children}
        {error ? <p className="mt-1.5 text-xs text-error-500">{error}</p> : null}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[6rem_minmax(0,1fr)] gap-3 text-sm">
      <span className="text-xs font-semibold text-gray-500">{label}</span>
      <span className="min-w-0 break-words text-gray-800">{value || "-"}</span>
    </div>
  );
}

function normalizeEventOptionForAd(event: HospitalEventApiItem): EventAdHospitalEventOption {
  return {
    id: event.id,
    name: event.name?.trim() || `이벤트 #${event.id}`,
    thumbnail_image: event.thumbnail_image ?? null,
    created_at: event.created_at ?? null,
    event_price: Number(event.event_price ?? 0),
  };
}

function formatEventAdCost(cost: number) {
  return `${Number(cost || 0).toLocaleString()}원`;
}

function formatEventOptionDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 10) || "-";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function CategorySelectModal({
  placement,
  categories,
  selectedCategoryId,
  isLoading,
  error,
  onSelectCategory,
  onClose,
  onConfirm,
}: {
  placement: EventAdPlacementOption | null;
  categories: EventAdCategoryOption[];
  selectedCategoryId: number | null;
  isLoading: boolean;
  error: string | null;
  onSelectCategory: (categoryId: number) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal isOpen={Boolean(placement)} onClose={onClose} showCloseButton={false} className="mx-4 w-full max-w-2xl">
      <ModalPanel>
        <ModalHeader className="pr-0">
          <ModalTitle>카테고리 선택</ModalTitle>
        </ModalHeader>
        <ModalBody className="mt-5">
          <div className="space-y-5">
            <p className="text-sm font-medium text-gray-800">상단 배너 광고를 게재할 카테고리를 선택해 주세요.</p>
            {isLoading ? (
              <SpinnerBlock className="min-h-24" spinnerClassName="size-7" label="카테고리 불러오는 중" />
            ) : error ? (
              <p className="text-sm text-error-500">{error}</p>
            ) : categories.length === 0 ? (
              <p className="text-sm text-gray-500">선택 가능한 카테고리가 없습니다.</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {categories.map((category) => {
                  const selected = selectedCategoryId === category.id;

                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => onSelectCategory(category.id)}
                      className={[
                        "h-9 min-w-18 rounded-md border px-4 text-sm font-semibold transition",
                        selected
                          ? "border-brand-500 bg-brand-500 text-white"
                          : "border-gray-300 bg-white text-gray-700 hover:border-brand-400 hover:text-brand-500",
                      ].join(" ")}
                    >
                      {category.display_name || category.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button
            type="button"
            variant="brand"
            onClick={onConfirm}
            disabled={isLoading || Boolean(error) || !selectedCategoryId}
          >
            확인
          </Button>
        </ModalFooter>
      </ModalPanel>
    </Modal>
  );
}

function extractEventAdCreateFieldErrors(details: unknown): EventAdCreateFormErrors {
  if (!details || typeof details !== "object" || !("errors" in details)) {
    return {};
  }

  const rawErrors = (details as { errors?: unknown }).errors;
  if (!rawErrors || typeof rawErrors !== "object") {
    return {};
  }

  const nextErrors: EventAdCreateFormErrors = {};
  const fieldMap: Record<string, keyof EventAdCreateFormErrors> = {
    hospital_id: "hospital_id",
    hospital_event_id: "hospital_event_id",
    ad_image_file: "ad_image_file",
  };

  for (const [key, value] of Object.entries(rawErrors)) {
    const field = fieldMap[key];
    if (!field) continue;

    nextErrors[field] = Array.isArray(value) ? String(value[0] ?? "") : String(value ?? "");
  }

  return nextErrors;
}
