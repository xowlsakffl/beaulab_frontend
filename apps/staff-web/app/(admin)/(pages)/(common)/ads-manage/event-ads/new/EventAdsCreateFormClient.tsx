"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  ChevronLeft,
  ChevronRight,
  FormCheckbox,
  FormFileInput,
  InputField,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalPanel,
  ModalTitle,
  Select,
  SegmentedTabs,
  SpinnerBlock,
  useGlobalAlert,
} from "@beaulab/ui-admin";
import { isApiSuccess } from "@beaulab/types";

import { LoadErrorState } from "@/components/common/LoadErrorState";
import { useDoctorHospitalOptions } from "@/hooks/doctor/useDoctorHospitalOptions";
import { api } from "@/lib/common/api";
import { getSession } from "@/lib/common/auth/session";
import { CATEGORY_DOMAINS, type CategoryApiItem } from "@/lib/common/category";
import { usePageHeaderExtra } from "@/lib/common/routing/page-header-extra";
import type { DoctorHospitalOption } from "@/lib/doctor/form";
import type { EventAdApiItem } from "@/lib/hospital-event-ad/list";
import {
  EVENT_AD_CREATE_FORM_ID,
  EVENT_AD_PLACEMENT_GROUPS,
  FALLBACK_EVENT_AD_PLACEMENT_OPTIONS,
  INITIAL_EVENT_AD_CREATE_FORM,
  addDays,
  buildCalendarDays,
  buildEventAdCreateFormData,
  formatEventAdMonthLabel,
  formatEventAdPeriodLabel,
  isCurrentOrNextMonth,
  isDateInRange,
  isSameDate,
  isSameMonth,
  monthKey,
  normalizeEventAdCategoryOptions,
  normalizeEventAdPlacementOptions,
  parseDateKey,
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
  const [hoveredWeekDate, setHoveredWeekDate] = React.useState<string | null>(null);
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
  const weekByDate = React.useMemo(
    () => new Map(availabilityWeeks.map((week) => [week.date, week])),
    [availabilityWeeks],
  );
  const calendarDays = React.useMemo(() => buildCalendarDays(calendarMonth), [calendarMonth]);

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
      setHoveredWeekDate(null);

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
    setHoveredWeekDate(null);
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
      const response = await api.get<EventAdHospitalEventOption[]>("/hospital-events", {
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

      setEventOptions(response.data.map((event) => ({ id: event.id, name: event.name })));
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
            calendarDays={calendarDays}
            weekByDate={weekByDate}
            isLoading={isLoadingAvailability}
            error={availabilityError}
            hoveredWeekDate={hoveredWeekDate}
            onHoverWeek={setHoveredWeekDate}
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
            onFreeAdChange={(checked) => {
              setIsFreeAd(checked);
              if (checked) {
                setField("cost", "0");
              }
            }}
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
  calendarDays,
  weekByDate,
  isLoading,
  error,
  hoveredWeekDate,
  onHoverWeek,
  onMonthChange,
  onRefresh,
  onSelectWeek,
  onBack,
}: {
  selectedPlacement: EventAdPlacementOption;
  selectedCategory: EventAdCategoryOption | null;
  calendarMonth: Date;
  calendarDays: Date[];
  weekByDate: Map<string, EventAdAvailabilityWeek>;
  isLoading: boolean;
  error: string | null;
  hoveredWeekDate: string | null;
  onHoverWeek: (date: string | null) => void;
  onMonthChange: (month: Date) => void;
  onRefresh: () => void;
  onSelectWeek: (week: EventAdAvailabilityWeek) => void;
  onBack: () => void;
}) {
  const canGoPrev = isCurrentOrNextMonth(calendarMonth, "prev");
  const canGoNext = isCurrentOrNextMonth(calendarMonth, "next");
  const hoveredStart = hoveredWeekDate ? parseDateKey(hoveredWeekDate) : null;
  const hoveredEnd = hoveredStart ? addDays(hoveredStart, 6) : null;
  const today = new Date();

  return (
    <Card className="rounded-xl p-8">
      <div className="grid gap-8 xl:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="space-y-5">
          <Button type="button" variant="outline" size="sm" onClick={onBack}>
            광고 위치 다시 선택
          </Button>

          <div className="space-y-2 text-sm">
            <p className="font-bold text-gray-900">상품 구매 유의사항</p>
            <ul className="list-disc space-y-1 pl-5 text-gray-600">
              <li>희망 노출 시작일은 화요일만 선택 가능합니다.</li>
              <li>선택한 날짜의 11:00부터 차주 화요일 10:59까지 노출됩니다.</li>
              <li>각 광고 영역은 주차별 최대 3구좌까지 구매 가능합니다.</li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-bold text-gray-900">선택한 광고위치</p>
            <div className="mt-2 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm font-bold text-gray-900">{selectedPlacement.label}</p>
              <p className="mt-1 text-xs text-gray-500">주 {selectedPlacement.slot_limit}구좌</p>
            </div>
            {selectedCategory ? (
              <p className="mt-3 text-xs font-semibold text-brand-500">
                {selectedCategory.display_name || selectedCategory.name}
              </p>
            ) : null}
          </div>
        </aside>

        <section className="min-w-0">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">{formatEventAdMonthLabel(calendarMonth)}</h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!canGoPrev}
                onClick={() => onMonthChange(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
                className="flex size-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="이전달"
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                type="button"
                disabled={!canGoNext}
                onClick={() => onMonthChange(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
                className="flex size-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="다음달"
              >
                <ChevronRight className="size-5" />
              </button>
            </div>
          </div>

          {error ? (
            <LoadErrorState title="광고 예약 현황을 불러오지 못했습니다." message={error} onRetry={onRefresh} />
          ) : (
            <div className="relative overflow-hidden rounded-xl border border-gray-200">
              {isLoading ? (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70">
                  <SpinnerBlock className="min-h-0" spinnerClassName="size-7" label="예약 현황을 불러오는 중" />
                </div>
              ) : null}
              <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
                {["일", "월", "화", "수", "목", "금", "토"].map((day, index) => (
                  <div
                    key={day}
                    className={`px-3 py-2 text-xs font-bold ${index === 0 ? "text-error-500" : index === 6 ? "text-brand-500" : "text-gray-500"}`}
                  >
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {calendarDays.map((date) => {
                  const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
                  const week = weekByDate.get(dateKey);
                  const isDimmed = !isSameMonth(date, calendarMonth);
                  const isToday = isSameDate(date, today);
                  const isHighlighted =
                    hoveredStart && hoveredEnd && isSameMonth(date, calendarMonth)
                      ? isDateInRange(date, hoveredStart, hoveredEnd)
                      : false;
                  const isAvailable = Boolean(week && !week.is_sold_out && week.remaining_count > 0);

                  return (
                    <button
                      key={dateKey}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => week && onSelectWeek(week)}
                      onMouseEnter={() => onHoverWeek(isAvailable ? dateKey : null)}
                      onMouseLeave={() => onHoverWeek(null)}
                      className={[
                        "relative min-h-28 border-r border-b border-gray-200 p-2 text-left transition",
                        isDimmed ? "bg-gray-50 text-gray-300" : "bg-white text-gray-800",
                        isToday ? "bg-warning-50" : "",
                        isHighlighted ? "bg-brand-50" : "",
                        isAvailable ? "cursor-pointer hover:bg-brand-50" : "cursor-default",
                      ].join(" ")}
                    >
                      <span className="text-sm font-semibold">{date.getDate()}</span>
                      {week ? (
                        <span
                          className={[
                            "absolute right-2 bottom-3 left-2 flex h-7 items-center justify-center rounded-md text-xs font-bold",
                            week.is_sold_out || week.remaining_count <= 0
                              ? "bg-gray-100 text-gray-500"
                              : "bg-brand-50 text-brand-500",
                          ].join(" ")}
                        >
                          {week.is_sold_out || week.remaining_count <= 0
                            ? "판매종료"
                            : `예약가능(${week.remaining_count}/${week.slot_limit})`}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>
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
  onFreeAdChange: (checked: boolean) => void;
}) {
  return (
    <form id={EVENT_AD_CREATE_FORM_ID} onSubmit={onSubmit} autoComplete="off" className="space-y-4">
      <Button type="button" variant="outline" size="sm" onClick={onBack}>
        날짜 다시 선택
      </Button>

      <Card className="rounded-xl p-6">
        <div className="max-w-3xl space-y-4">
          <h2 className="text-sm font-bold text-gray-900">상품정보</h2>
          <InfoRow label="광고위치" value={selectedPlacement.label} />
          {selectedCategory ? (
            <InfoRow label="카테고리" value={selectedCategory.display_name || selectedCategory.name} />
          ) : null}
          <InfoRow label="광고기간" value={formatEventAdPeriodLabel(selectedWeek)} />

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

          <FormRow label="이벤트" required error={errors.hospital_event_id || eventLoadError || undefined}>
            <Select
              value={form.hospital_event_id ? String(form.hospital_event_id) : ""}
              options={eventOptions.map((event) => ({ value: String(event.id), label: event.name }))}
              placeholder={
                !form.hospital_id
                  ? "병의원을 먼저 선택해 주세요."
                  : isLoadingEvents
                    ? "이벤트 불러오는 중"
                    : "이벤트를 선택해 주세요."
              }
              disabled={!form.hospital_id || isLoadingEvents}
              onChange={(value) => onSetField("hospital_event_id", Number(value) || null)}
              className="h-11 px-3"
            />
          </FormRow>

          <FormRow label="금액" required error={errors.cost}>
            <div className="flex items-center gap-3">
              <InputField
                type="number"
                min="0"
                value={form.cost}
                disabled={isFreeAd}
                onChange={(event) => onSetField("cost", event.target.value)}
                className="bg-white"
              />
              <FormCheckbox checked={isFreeAd} onChange={onFreeAdChange} label="무료이벤트" />
            </div>
          </FormRow>

          <FormRow label="광고이미지" error={errors.ad_image_file}>
            <FormFileInput
              key={adImageFile?.name ?? "empty-ad-image"}
              accept="image/jpeg,image/png"
              onChange={(event) => onSetAdImageFile(event.target.files?.[0] ?? null)}
              className="bg-white"
            />
            <p className="mt-1.5 text-xs text-gray-500">jpg, jpeg, png / 최대 10MB</p>
            {adImageFile ? (
              <div className="mt-2 flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                <span className="truncate">{adImageFile.name}</span>
                <button
                  type="button"
                  className="shrink-0 text-gray-500 hover:text-brand-500"
                  onClick={() => onSetAdImageFile(null)}
                >
                  삭제
                </button>
              </div>
            ) : null}
          </FormRow>
        </div>
      </Card>
    </form>
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
          className="bg-white"
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
      <Label className="flex h-11 items-center text-xs font-semibold text-gray-500">
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
    cost: "cost",
    ad_image_file: "ad_image_file",
  };

  for (const [key, value] of Object.entries(rawErrors)) {
    const field = fieldMap[key];
    if (!field) continue;

    nextErrors[field] = Array.isArray(value) ? String(value[0] ?? "") : String(value ?? "");
  }

  return nextErrors;
}
