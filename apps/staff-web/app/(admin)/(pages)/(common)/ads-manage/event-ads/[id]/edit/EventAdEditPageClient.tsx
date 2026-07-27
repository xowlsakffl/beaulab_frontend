"use client";

import React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { isApiSuccess } from "@beaulab/types";
import { Button, SpinnerBlock, useGlobalAlert } from "@beaulab/ui-admin";

import { LoadErrorState } from "@/components/common/LoadErrorState";
import { api } from "@/lib/common/api";
import { usePageHeaderExtra } from "@/lib/common/routing/page-header-extra";
import type { DoctorHospitalOption } from "@/lib/doctor/form";
import { type HospitalEventApiItem } from "@/lib/hospital-event/list";
import { formatEventAdLocalDate, type EventAdApiItem } from "@/lib/hospital-event-ad/list";
import {
  EVENT_AD_CREATE_FORM_ID,
  FALLBACK_EVENT_AD_PLACEMENT_OPTIONS,
  INITIAL_EVENT_AD_CREATE_FORM,
  buildEventAdEditFormData,
  extractEventAdEditFieldErrors,
  normalizeEventAdPlacementOptions,
  type EventAdAvailabilityWeek,
  type EventAdCategoryOption,
  type EventAdCreateFormErrors,
  type EventAdCreateFormValues,
  type EventAdHospitalEventOption,
  type EventAdPlacementOption,
  validateEventAdEditForm,
} from "@/lib/hospital-event-ad/form";
import { EventAdFormStep } from "@/components/hospital-event-ad/form/EventAdFormStep";

type EditReadyState = {
  detail: EventAdApiItem;
  selectedPlacement: EventAdPlacementOption;
  selectedCategory: EventAdCategoryOption | null;
  selectedWeek: EventAdAvailabilityWeek;
};

export default function EventAdEditPageClient() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showAlert } = useGlobalAlert();

  const rawAdId = Array.isArray(params.id) ? params.id[0] : params.id;
  const adId = Number(rawAdId);
  const returnTo = searchParams.get("returnTo");

  const [readyState, setReadyState] = React.useState<EditReadyState | null>(null);
  const [form, setForm] = React.useState<EventAdCreateFormValues>(INITIAL_EVENT_AD_CREATE_FORM);
  const [errors, setErrors] = React.useState<EventAdCreateFormErrors>({});
  const [eventOptions, setEventOptions] = React.useState<EventAdHospitalEventOption[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [isLoadingEvents, setIsLoadingEvents] = React.useState(false);
  const [eventLoadError, setEventLoadError] = React.useState<string | null>(null);
  const [adImageFile, setAdImageFile] = React.useState<File | null>(null);
  const [isFreeAd, setIsFreeAd] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const detailPath = React.useMemo(() => {
    if (!Number.isFinite(adId) || adId <= 0) return "/ads-manage/event-ads";
    return returnTo
      ? `/ads-manage/event-ads/${adId}?returnTo=${encodeURIComponent(returnTo)}`
      : `/ads-manage/event-ads/${adId}`;
  }, [adId, returnTo]);

  const fetchDetail = React.useCallback(async () => {
    if (!Number.isFinite(adId) || adId <= 0) {
      setLoadError("잘못된 광고 경로입니다.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      const [detailResponse, placementResponse] = await Promise.all([
        api.get<EventAdApiItem>(`/hospital-event-ads/${adId}`),
        api.get<EventAdPlacementOption[]>("/hospital-event-ads/placements"),
      ]);

      if (!isApiSuccess(detailResponse)) {
        setLoadError(detailResponse.error.message || "광고 정보를 불러오지 못했습니다.");
        return;
      }

      const detail = detailResponse.data;
      const placementOptions = isApiSuccess(placementResponse)
        ? normalizeEventAdPlacementOptions(placementResponse.data)
        : FALLBACK_EVENT_AD_PLACEMENT_OPTIONS;
      const selectedPlacement =
        placementOptions.find((option) => option.value === detail.placement) ??
        normalizeEventAdPlacementOptions(FALLBACK_EVENT_AD_PLACEMENT_OPTIONS).find(
          (option) => option.value === detail.placement,
        ) ??
        normalizeEventAdPlacementOptions(FALLBACK_EVENT_AD_PLACEMENT_OPTIONS)[0];

      setReadyState({
        detail,
        selectedPlacement,
        selectedCategory: normalizeDetailCategory(detail),
        selectedWeek: buildDetailWeek(detail, selectedPlacement),
      });
      setForm({
        hospital_id: detail.hospital?.id ? Number(detail.hospital.id) : null,
        hospital_name: detail.hospital?.name?.trim() ?? "",
        hospital_business_number: "",
        hospital_event_id: selectableHospitalEventId(detail),
      });
      setEventOptions(normalizeInitialEventOptions(detail));
      setIsFreeAd(Number(detail.cost ?? 0) === 0);
      setAdImageFile(null);
      setErrors({});
    } catch {
      setLoadError("광고 정보를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [adId]);

  React.useEffect(() => {
    void fetchDetail();
  }, [fetchDetail]);

  const fetchEvents = React.useCallback(
    async (hospitalId: number | null) => {
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
          setEventLoadError(response.error.message || "이벤트 목록을 불러오지 못했습니다.");
          return;
        }

        const selectableOptions = response.data.filter(isSelectableEventForAd).map(normalizeEventOptionForAd);

        setEventOptions(mergeEventOptions(selectableOptions, readyState?.detail ?? null));
        setForm((prev) => {
          if (!prev.hospital_event_id) return prev;

          const hasSelectableEvent =
            selectableOptions.some((event) => event.id === prev.hospital_event_id) ||
            normalizeInitialEventOptions(readyState?.detail ?? null).some(
              (event) => event.id === prev.hospital_event_id,
            );

          return hasSelectableEvent ? prev : { ...prev, hospital_event_id: null };
        });
      } catch {
        setEventLoadError("이벤트 목록을 불러오는 중 오류가 발생했습니다.");
      } finally {
        setIsLoadingEvents(false);
      }
    },
    [readyState?.detail],
  );

  React.useEffect(() => {
    void fetchEvents(form.hospital_id);
  }, [fetchEvents, form.hospital_id]);

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
  }, []);

  const handleClearHospital = React.useCallback(() => {
    setForm((prev) => ({
      ...prev,
      hospital_id: null,
      hospital_name: "",
      hospital_business_number: "",
      hospital_event_id: null,
    }));
  }, []);

  const handleSubmit = React.useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!readyState || isSubmitting) return;

      const nextErrors = validateEventAdEditForm(form, adImageFile, readyState.detail.ad_image ?? null);
      if (Object.keys(nextErrors).length > 0) {
        setErrors(nextErrors);
        return;
      }

      setIsSubmitting(true);

      try {
        const formData = buildEventAdEditFormData({
          form,
          selectedPlacement: readyState.selectedPlacement,
          selectedCategory: readyState.selectedCategory,
          selectedWeek: readyState.selectedWeek,
          adImageFile,
          existingAdImage: readyState.detail.ad_image ?? null,
          isFreeAd,
        });
        const response = await api.post<EventAdApiItem>(`/hospital-event-ads/${readyState.detail.id}`, formData);

        if (!isApiSuccess(response)) {
          const apiErrors = extractEventAdEditFieldErrors(response.error.details);
          if (Object.keys(apiErrors).length > 0) {
            setErrors(apiErrors);
          }

          showAlert({
            variant: "error",
            title: "광고 수정 실패",
            message: response.error.message || "광고 수정에 실패했습니다.",
          });
          return;
        }

        showAlert({
          variant: "success",
          title: "광고 수정 완료",
          message: "광고 정보가 수정되었습니다.",
        });
        router.push(detailPath);
      } catch {
        showAlert({
          variant: "error",
          title: "광고 수정 실패",
          message: "광고 수정 중 오류가 발생했습니다.",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [adImageFile, detailPath, form, isFreeAd, isSubmitting, readyState, router, showAlert],
  );

  const headerActions = React.useMemo(
    () => (
      <>
        <Button type="button" variant="outline" size="sm" onClick={() => router.push(detailPath)}>
          취소
        </Button>
        <Button type="submit" form={EVENT_AD_CREATE_FORM_ID} variant="brand" size="sm" disabled={isSubmitting}>
          {isSubmitting ? "저장 중..." : "저장하기"}
        </Button>
      </>
    ),
    [detailPath, isSubmitting, router],
  );

  usePageHeaderExtra(isLoading || loadError ? null : headerActions);

  if (isLoading) {
    return <SpinnerBlock className="min-h-[60vh]" spinnerClassName="size-10" label="광고 정보를 불러오는 중" />;
  }

  if (loadError || !readyState) {
    return (
      <LoadErrorState
        title="광고 정보를 불러오지 못했습니다."
        message={loadError ?? "광고 정보를 찾을 수 없습니다."}
        onRetry={() => void fetchDetail()}
      />
    );
  }

  return (
    <EventAdFormStep
      form={form}
      errors={errors}
      selectedPlacement={readyState.selectedPlacement}
      selectedCategory={readyState.selectedCategory}
      selectedWeek={readyState.selectedWeek}
      eventOptions={eventOptions}
      isLoadingEvents={isLoadingEvents}
      eventLoadError={eventLoadError}
      adImageFile={adImageFile}
      existingAdImage={readyState.detail.ad_image ?? null}
      isFreeAd={isFreeAd}
      isHospitalEditable={false}
      onSubmit={handleSubmit}
      onBack={() => router.push(detailPath)}
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
  );
}

function normalizeDetailCategory(detail: EventAdApiItem): EventAdCategoryOption | null {
  const category = detail.category ?? detail.categories?.[0] ?? null;
  if (!category?.id) return null;

  return {
    id: Number(category.id),
    name: category.name?.trim() || category.full_path?.trim() || "카테고리",
    code: category.code ?? undefined,
    full_path: category.full_path ?? undefined,
    depth: Number(category.depth ?? 0),
    display_name: category.name?.trim() || category.full_path?.trim() || "카테고리",
  };
}

function buildDetailWeek(detail: EventAdApiItem, placement: EventAdPlacementOption): EventAdAvailabilityWeek {
  const startDate = detail.start_at?.slice(0, 10) || formatEventAdLocalDate(new Date());

  return {
    date: startDate,
    start_at: detail.start_at ?? `${startDate}T11:00:00.000000Z`,
    end_at: detail.end_at ?? `${startDate}T10:59:59.000000Z`,
    reserved_count: 0,
    remaining_count: 1,
    slot_limit: placement.slot_limit || 3,
    is_sold_out: false,
    is_past: false,
    is_deadline_closed: false,
  };
}

function normalizeInitialEventOptions(detail: EventAdApiItem | null): EventAdHospitalEventOption[] {
  if (!detail?.hospital_event?.id) return [];
  if (!isSelectableHospitalEvent(detail)) return [];

  return [
    {
      id: Number(detail.hospital_event.id),
      name: detail.hospital_event.name?.trim() || `이벤트 #${detail.hospital_event.id}`,
      thumbnail_image: detail.hospital_event.thumbnail_image ?? null,
      created_at: null,
      event_price: null,
    },
  ];
}

function selectableHospitalEventId(detail: EventAdApiItem): number | null {
  if (!detail.hospital_event?.id || !isSelectableHospitalEvent(detail)) return null;

  return Number(detail.hospital_event.id);
}

function isSelectableHospitalEvent(detail: EventAdApiItem | null): boolean {
  return detail?.hospital_event?.allow_status === "APPROVED" && detail.hospital_event.admin_status === "NORMAL";
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

function isSelectableEventForAd(event: HospitalEventApiItem): boolean {
  return event.allow_status === "APPROVED" && event.admin_status === "NORMAL";
}

function mergeEventOptions(options: EventAdHospitalEventOption[], detail: EventAdApiItem | null) {
  const map = new Map<number, EventAdHospitalEventOption>();

  for (const option of options) {
    map.set(option.id, option);
  }

  for (const option of normalizeInitialEventOptions(detail)) {
    if (!map.has(option.id)) {
      map.set(option.id, option);
    }
  }

  return Array.from(map.values());
}
