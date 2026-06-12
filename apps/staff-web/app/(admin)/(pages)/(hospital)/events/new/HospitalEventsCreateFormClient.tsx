"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { DateRange } from "react-day-picker";
import type { CategorySelectorItem, CategorySelectorLoadParams } from "@beaulab/ui-admin";
import {
  Button,
  Card,
  CircleRemoveButton,
  DateRangeFilterDropdown,
  FormCheckbox,
  FormTextArea,
  HierarchicalCategorySelector,
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

import {
  HospitalMediaPreviewModal,
  type HospitalMediaPreviewState,
} from "@/components/hospital/media/HospitalMediaPreviewModal";
import { AddCircleButton } from "@/components/common/AddCircleButton";
import { useCategorySelectorLoader } from "@/hooks/common/useCategorySelectorLoader";
import { useDoctorHospitalOptions } from "@/hooks/doctor/useDoctorHospitalOptions";
import { useVideoDoctorOptions } from "@/hooks/video/useVideoDoctorOptions";
import { api } from "@/lib/common/api";
import { buildReturnToPath } from "@/lib/common/navigation/buildReturnToPath";
import { usePageHeaderExtra } from "@/lib/common/routing/page-header-extra";
import {
  HOSPITAL_EVENT_CATEGORY_SECTIONS,
  HOSPITAL_EVENT_FIELD_FOCUS_ORDER,
  HOSPITAL_EVENT_PROCEDURE_BENEFIT_MAX_COUNT,
  HOSPITAL_EVENT_PROCEDURE_TARGET_MAX_COUNT,
  INITIAL_HOSPITAL_EVENT_FORM,
  appendHospitalEventFormData,
  calculateHospitalEventConsultationBasePrice,
  calculateHospitalEventDiscountRate,
  emptyDoctorAssignment,
  emptyEventOption,
  extractHospitalEventFieldErrors,
  formatNumberInput,
  parseNumberInput,
  validateCreateHospitalEventForm,
  type HospitalEventCategoryUsage,
  type HospitalEventFieldName,
  type HospitalEventFormErrors,
  type HospitalEventFormValues,
  type HospitalEventOptionForm,
  type HospitalEventType,
} from "@/lib/hospital-event/form";
import {
  formatLocalDate,
  normalizeRangeDate,
  parseDateParam,
} from "@/lib/hospital-event/list";
import type { DoctorHospitalOption } from "@/lib/doctor/form";
import type { VideoDoctorOption } from "@/lib/video/form";

const EVENT_CREATE_FORM_ID = "hospital-event-create-form";
const INITIAL_EVENT_CATEGORY_SECTION_KEY = "surgery";
const EVENT_PERIOD_PRESET_OPTIONS = [
  { key: "oneMonth", label: "1개월" },
  { key: "twoMonths", label: "2개월" },
  { key: "threeMonths", label: "3개월" },
] as const;
const cardClassName = "rounded-xl border border-gray-200 bg-white p-5";
const labelClassName = "text-xs font-semibold text-gray-500";
const inputClassName = "h-9 bg-white px-3 text-sm";
const fileButtonClassName = "h-8 px-3 text-xs";
const THUMBNAIL_VALIDATION_MESSAGE =
  "썸네일은 아래 조건에 맞는 파일만 업로드할 수 있습니다.\n\n- 파일 형식: JPG, PNG\n- 파일 용량: 2MB 이하\n- 이미지 크기: 800 x 800px 이상\n- 이미지 비율: 1:1";
const EVENT_PAGE_VALIDATION_MESSAGE =
  "이벤트 페이지는 아래 조건에 맞는 파일만 업로드할 수 있습니다.\n\n- 파일 형식: JPG, PNG\n- 파일 용량: 5MB 이하\n- 이미지 가로: 800px 이상";
const EVENT_IMAGE_ACCEPT = ".jpg,.jpeg,.png,image/jpeg,image/png";
const EVENT_IMAGE_ALLOWED_MIME_TYPES = ["image/jpeg", "image/png"];
const EVENT_IMAGE_ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png"];

type CachedCategoryItem = CategorySelectorItem & {
  usage?: HospitalEventCategoryUsage;
};

type EventCreateResponse = {
  id: number;
};

export default function HospitalEventsCreateFormClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showAlert } = useGlobalAlert();
  const baseLoadCategories = useCategorySelectorLoader();

  const [form, setForm] = React.useState<HospitalEventFormValues>(INITIAL_HOSPITAL_EVENT_FORM);
  const [errors, setErrors] = React.useState<HospitalEventFormErrors>({});
  const [thumbnailImage, setThumbnailImage] = React.useState<File | null>(null);
  const [eventPageImage, setEventPageImage] = React.useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [previewMedia, setPreviewMedia] = React.useState<HospitalMediaPreviewState | null>(null);
  const [isAppPreviewOpen, setIsAppPreviewOpen] = React.useState(false);
  const [uploadWarning, setUploadWarning] = React.useState<string | null>(null);
  const [categoryCache, setCategoryCache] = React.useState<Record<number, CachedCategoryItem>>({});
  const [categorySectionKey, setCategorySectionKey] = React.useState(INITIAL_EVENT_CATEGORY_SECTION_KEY);
  const [pendingCategorySectionKey, setPendingCategorySectionKey] = React.useState<string | null>(null);

  const selectedHospital = form.hospital_id
    ? {
        id: form.hospital_id,
        name: form.hospital_name,
        business_number: form.hospital_business_number,
      }
    : null;
  const doctorOptionsResult = useVideoDoctorOptions(form.hospital_id);
  const selectedCategoryItems = React.useMemo(
    () => form.category_ids.map((categoryId) => categoryCache[categoryId]).filter(Boolean),
    [categoryCache, form.category_ids],
  );
  const selectedCategoryUsage = React.useMemo<HospitalEventCategoryUsage | null>(() => {
    const usages = new Set(
      form.category_ids
        .map((categoryId) => categoryCache[categoryId]?.usage)
        .filter((usage): usage is HospitalEventCategoryUsage => Boolean(usage)),
    );

    return usages.size === 1 ? Array.from(usages)[0] : null;
  }, [categoryCache, form.category_ids]);
  const isTreatmentEvent = categorySectionKey === "treatment" || selectedCategoryUsage === "HOSPITAL_EVENT_TREATMENT";
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
    (highlightId?: number) => buildReturnToPath({
      searchParams,
      fallbackPath: "/events",
      allowedPrefix: "/events",
      highlightId,
    }),
    [searchParams],
  );

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

  const focusFirstErrorField = React.useCallback((nextErrors: HospitalEventFormErrors) => {
    const targetField = HOSPITAL_EVENT_FIELD_FOCUS_ORDER.find((field) => nextErrors[field]);
    if (!targetField) return;

    const target = document.querySelector<HTMLElement>(`[data-field-target="${targetField}"]`);
    target?.scrollIntoView({ block: "center", behavior: "smooth" });
    window.setTimeout(() => {
      target?.focus();
      target?.querySelector<HTMLElement>("input,textarea,button,[tabindex]")?.focus();
    }, 180);
  }, []);

  const loadEventCategories = React.useCallback(
    async (params: CategorySelectorLoadParams): Promise<CategorySelectorItem[]> => {
      const items = await baseLoadCategories(params);
      const usage = params.section.usage as HospitalEventCategoryUsage | undefined;

      setCategoryCache((prev) => {
        let changed = false;
        const next = { ...prev };

        items.forEach((item) => {
          const cached = next[item.id];
          if (cached && cached.name === item.name && cached.full_path === item.full_path && cached.usage === usage) {
            return;
          }

          changed = true;
          next[item.id] = { ...item, usage };
        });

        return changed ? next : prev;
      });

      return items;
    },
    [baseLoadCategories],
  );

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

  const handleToggleCategory = React.useCallback(
    (categoryId: number, checked: boolean) => {
      const category = categoryCache[categoryId];
      const nextUsage = category?.usage;

      if (checked && category?.has_children) {
        setErrors((prev) => ({ ...prev, category_ids: "이벤트 카테고리는 소분류만 선택할 수 있습니다." }));
        return;
      }

      if (checked && form.category_ids.length >= 3 && !form.category_ids.includes(categoryId)) {
        setErrors((prev) => ({ ...prev, category_ids: "카테고리는 최대 3개까지 선택할 수 있습니다." }));
        return;
      }

      if (checked && selectedCategoryUsage && nextUsage && selectedCategoryUsage !== nextUsage) return;

      setForm((prev) => {
        if (checked) {
          if (prev.category_ids.includes(categoryId)) return prev;

          return {
            ...prev,
            category_ids: [...prev.category_ids, categoryId],
          };
        }

        const nextCategoryIds = prev.category_ids.filter((id) => id !== categoryId);
        return {
          ...prev,
          category_ids: nextCategoryIds,
          primary_category_id: prev.primary_category_id === categoryId ? null : prev.primary_category_id,
          has_options: nextCategoryIds.length === 0 ? false : prev.has_options,
        };
      });
      clearError("category_ids");
      clearError("primary_category_id");
    },
    [categoryCache, clearError, form.category_ids, selectedCategoryUsage],
  );

  const requestCategorySectionChange = React.useCallback(
    (sectionKey: string, currentSectionKey: string) => {
      if (sectionKey === currentSectionKey) return true;

      if (form.category_ids.length > 0) {
        setPendingCategorySectionKey(sectionKey);
        return false;
      }

      setCategorySectionKey(sectionKey);
      return true;
    },
    [form.category_ids.length],
  );

  const closeCategorySectionConfirmModal = React.useCallback(() => {
    setPendingCategorySectionKey(null);
  }, []);

  const confirmCategorySectionChange = React.useCallback(() => {
    if (!pendingCategorySectionKey) return;

    setForm((prev) => ({
      ...prev,
      category_ids: [],
      primary_category_id: null,
      has_options: false,
    }));
    setErrors((prev) => {
      if (!prev.category_ids && !prev.primary_category_id) return prev;

      const next = { ...prev };
      delete next.category_ids;
      delete next.primary_category_id;
      return next;
    });
    setCategorySectionKey(pendingCategorySectionKey);
    setPendingCategorySectionKey(null);
  }, [pendingCategorySectionKey]);

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

  const setOption = React.useCallback((index: number, patch: Partial<HospitalEventOptionForm>) => {
    setForm((prev) => {
      const nextOptions = [...prev.options];
      nextOptions[index] = { ...nextOptions[index], ...patch };

      return { ...prev, options: nextOptions };
    });
    clearError("options");
  }, [clearError]);

  const validate = React.useCallback(() => {
    const nextErrors = validateCreateHospitalEventForm(form, thumbnailImage, eventPageImage, selectedCategoryUsage);
    if (eventPriceError) {
      nextErrors.event_price = eventPriceError;
    }
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      window.setTimeout(() => focusFirstErrorField(nextErrors), 0);
      return false;
    }

    return true;
  }, [eventPageImage, eventPriceError, focusFirstErrorField, form, selectedCategoryUsage, thumbnailImage]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate() || !thumbnailImage) return;

    const formData = new FormData();
    appendHospitalEventFormData(formData, form, thumbnailImage, eventPageImage, selectedCategoryUsage);
    setIsSubmitting(true);

    try {
      const response = await api.post<EventCreateResponse>("/hospital-events", formData);

      if (!isApiSuccess(response)) {
        const nextErrors = extractHospitalEventFieldErrors(response.error.details);
        if (Object.keys(nextErrors).length > 0) {
          setErrors(nextErrors);
          window.setTimeout(() => focusFirstErrorField(nextErrors), 0);
        }

        showAlert({
          variant: "error",
          title: "이벤트 등록 실패",
          message: response.error.message || "이벤트 등록에 실패했습니다.",
        });
        return;
      }

      showAlert({
        variant: "success",
        title: "이벤트 등록 완료",
        message: "등록된 이벤트를 목록에서 확인할 수 있습니다.",
      });
      router.push(`/events?highlight=${response.data.id}`);
    } catch {
      showAlert({
        variant: "error",
        title: "이벤트 등록 실패",
        message: "이벤트 등록 중 오류가 발생했습니다.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const headerActions = React.useMemo(
    () => (
      <>
        <Button type="button" variant="outline" size="sm" onClick={() => router.push(getReturnToPath())} disabled={isSubmitting}>
          취소
        </Button>
        <Button type="button" variant="brand" size="sm" onClick={() => setIsAppPreviewOpen(true)}>
          미리보기 적용
        </Button>
        <Button type="submit" form={EVENT_CREATE_FORM_ID} variant="brand" size="sm" disabled={isSubmitting}>
          {isSubmitting ? "요청 중..." : "검수 요청하기"}
        </Button>
      </>
    ),
    [getReturnToPath, isSubmitting, router],
  );

  usePageHeaderExtra(headerActions);

  return (
    <>
      <form id={EVENT_CREATE_FORM_ID} onSubmit={handleSubmit} autoComplete="off" className="grid min-w-0 gap-4 xl:grid-cols-[minmax(450px,1fr)_minmax(390px,0.9fr)_minmax(280px,0.55fr)]">
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
	            error={errors.category_ids ?? errors.primary_category_id}
	            loadCategories={loadEventCategories}
	            onToggleCategory={handleToggleCategory}
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
          onRemoveOption={(index) => setField("options", form.options.filter((_, optionIndex) => optionIndex !== index))}
          onAddTextItem={(key) => setField(key, [...form[key], ""])}
          onRemoveTextItem={(key, index) => setField(key, form[key].filter((_, itemIndex) => itemIndex !== index))}
          onTextItemChange={(key, index, value) => {
            const nextItems = [...form[key]];
            nextItems[index] = value.slice(0, 90);
            setField(key, nextItems);
          }}
        />

        <EventMediaCard
          eventType={form.event_type}
          thumbnailImage={thumbnailImage}
          eventPageImage={eventPageImage}
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
	            <p className="text-sm font-medium leading-6 text-gray-800">
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
        onClose={() => setIsAppPreviewOpen(false)}
        form={form}
        thumbnailImage={thumbnailImage}
        eventPageImage={eventPageImage}
        discountRate={discountRate}
      />

	      <HospitalMediaPreviewModal preview={previewMedia} onChange={setPreviewMedia} onClose={() => setPreviewMedia(null)} />
      <UploadWarningModal message={uploadWarning} onClose={() => setUploadWarning(null)} />
    </>
  );
}

function HospitalPickerCard({
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
  const visibleOptions = options.slice(0, 3);

  React.useEffect(() => {
    if (selectedHospital?.name) {
      setQuery(selectedHospital.name);
    }
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
    <Card className={cardClassName}>
      <div className="grid grid-cols-[5rem_minmax(0,1fr)] items-start gap-x-2 gap-y-1" data-field-target="hospital_id" tabIndex={-1}>
	        <Label className={`${labelClassName} flex h-9 items-center`}>
	          병의원<span className="ml-0.5 text-brand-500">*</span>
	        </Label>
        <div ref={containerRef} className="relative min-w-0">
          <InputField
            value={query}
            onClick={() => setIsOpen(true)}
            onChange={(event) => {
              const nextQuery = event.target.value;
              setQuery(nextQuery);
              if (selectedHospital && nextQuery !== selectedHospital.name) {
                onClearHospital();
              }
              setIsOpen(true);
            }}
            placeholder="병의원명을 검색해 주세요."
            error={Boolean(error)}
            className={inputClassName}
          />
          {isOpen ? (
            <Card className="absolute left-0 right-0 top-full z-[80] mt-2 max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
              {isLoading ? (
                <div className="py-5">
                  <SpinnerBlock className="min-h-0" spinnerClassName="size-5" label="병의원 검색 중" />
                </div>
              ) : loadError ? (
                <p className="px-3 py-4 text-sm text-error-500">{loadError}</p>
              ) : visibleOptions.length === 0 ? (
                <p className="px-3 py-4 text-sm text-gray-500">검색 결과가 없습니다.</p>
              ) : (
                <div className="space-y-1">
                  {visibleOptions.map((hospital) => (
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
        {error ? <p className="col-start-2 text-xs text-error-500">{error}</p> : null}
	      </div>
    </Card>
  );
}

function CategoryDoctorPickerCard({
  selectedIds,
  selectedItems,
  primaryCategoryId,
  activeSectionKey,
  isMaleTargeted,
  error,
  loadCategories,
  onToggleCategory,
  onSectionChangeRequest,
  onPrimaryCategoryChange,
  onMaleTargetedChange,
  hospitalId,
  doctors,
  isLoading,
  loadError,
  assignments,
  onSelectDoctor,
}: {
  selectedIds: number[];
  selectedItems: CachedCategoryItem[];
  primaryCategoryId: number | null;
  activeSectionKey: string;
  isMaleTargeted: boolean;
  error?: string;
  loadCategories: (params: CategorySelectorLoadParams) => Promise<CategorySelectorItem[]>;
  onToggleCategory: (categoryId: number, checked: boolean) => void;
  onSectionChangeRequest: (sectionKey: string, currentSectionKey: string) => boolean;
  onPrimaryCategoryChange: (value: string) => void;
  onMaleTargetedChange: (checked: boolean) => void;
  hospitalId: number | null;
  doctors: VideoDoctorOption[];
  isLoading: boolean;
  loadError: string | null;
  assignments: HospitalEventFormValues["doctor_assignments"];
  onSelectDoctor: (index: number, doctor: VideoDoctorOption | null) => void;
}) {
  const selectedDoctorIds = new Set(assignments.map((assignment) => assignment.hospital_doctor_id).filter(Boolean));
  const visibleAssignments = doctors.length > 0 ? assignments.slice(0, Math.min(3, doctors.length)) : [];
  const optionsForSlot = (currentId: number | null) => [
    { value: "", label: !hospitalId ? "병의원을 먼저 선택해 주세요." : isLoading ? "의료진 불러오는 중" : "의료진을 선택해 주세요." },
    ...doctors
      .filter((doctor) => !selectedDoctorIds.has(doctor.id) || doctor.id === currentId)
      .map((doctor) => ({ value: String(doctor.id), label: doctor.name })),
  ];

  return (
    <Card className={cardClassName} data-field-target="category_ids" tabIndex={-1}>
      <HierarchicalCategorySelector
        sections={HOSPITAL_EVENT_CATEGORY_SECTIONS}
	        selectedIds={selectedIds}
	        selectedItems={selectedItems}
	        primaryCategoryId={primaryCategoryId}
	        activeSectionKey={activeSectionKey}
	        onSectionChangeRequest={onSectionChangeRequest}
	        onPrimaryCategoryChange={(categoryId) => onPrimaryCategoryChange(String(categoryId))}
        onToggleCategory={onToggleCategory}
        loadCategories={loadCategories}
        error={error}
        errorPlacement="header"
        initialSectionKey="surgery"
        sectionTabsPlacement="header"
        compactSectionTabs
        searchMode="dropdown"
        showSearchTitle={false}
        showDirectTitle={false}
        selectionMode="leaf-click"
        selectedDisplay="input"
        searchDepth={3}
        searchInputClassName="h-9"
        columnHeightClassName="h-[232px]"
        headerTitle={<h3 className="text-sm font-bold text-gray-900">카테고리 설정</h3>}
        afterColumns={
          <div className="flex items-center gap-4 pt-1">
            <FormCheckbox checked={isMaleTargeted} onChange={onMaleTargetedChange} label="남자성형 이벤트" className="size-4 rounded-sm" />
            <span className="text-xs text-gray-500">남성 대상 이벤트일 경우만 선택해주세요.</span>
          </div>
        }
        text={{
          selectedTitle: "선택한 소카테고리",
          primaryTitle: "대표 카테고리 선택",
          selectedPlaceholder: "소카테고리를 선택해 주세요.",
          primaryPlaceholder: "대표 카테고리를 선택해 주세요.",
        }}
      />

	      <div className="mt-6 border-t border-gray-200 pt-5">
	        <h3 className="text-sm font-bold text-gray-900">의료진 선택</h3>
	      </div>
	      {visibleAssignments.length > 0 ? (
	        <div className="mt-3 grid gap-2 sm:grid-cols-3">
	          {visibleAssignments.map((assignment, index) => (
	            <Select
	              key={index}
	              value={assignment.hospital_doctor_id ? String(assignment.hospital_doctor_id) : ""}
	              options={optionsForSlot(assignment.hospital_doctor_id)}
	              showPlaceholderOption={false}
	              disabled={!hospitalId || isLoading}
	              onChange={(value) => {
	                const matched = doctors.find((doctor) => String(doctor.id) === value) ?? null;
	                onSelectDoctor(index, matched);
	              }}
	              className="h-10 px-3"
	            />
	          ))}
	        </div>
	      ) : (
	        <div className="mt-3 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-400">
	          {!hospitalId ? "병의원을 먼저 선택해 주세요." : isLoading ? "의료진을 불러오는 중입니다." : "선택 가능한 의료진이 없습니다."}
	        </div>
	      )}
	      {loadError ? <p className="mt-2 text-xs text-error-500">{loadError}</p> : null}
      <div className="mt-4 rounded-xl bg-gray-50 px-3 py-3 text-xs leading-5 text-gray-600">
        이벤트 접수는 병의원 기준 3시간 정도 소요될 수 있습니다.
        <br />
        이벤트명 및 지정한 카테고리를 등록 후 검수 단계에서 운영자에 의해 변경될 수 있습니다.
      </div>
    </Card>
  );
}

function EventInfoCard({
  form,
  errors,
  isTreatmentEvent,
  discountRate,
  eventPriceError,
  thumbnailImage,
  eventPageImage,
  onThumbnailChange,
  onEventPageChange,
  onUploadWarning,
  onFieldChange,
  onOptionChange,
  onAddOption,
  onRemoveOption,
  onAddTextItem,
  onRemoveTextItem,
  onTextItemChange,
}: {
  form: HospitalEventFormValues;
  errors: HospitalEventFormErrors;
  isTreatmentEvent: boolean;
  discountRate: number;
  eventPriceError: string | null;
  thumbnailImage: File | null;
  eventPageImage: File | null;
  onThumbnailChange: (file: File | null) => void;
  onEventPageChange: (file: File | null) => void;
  onUploadWarning: (message: string) => void;
  onFieldChange: <K extends keyof HospitalEventFormValues>(key: K, value: HospitalEventFormValues[K]) => void;
  onOptionChange: (index: number, patch: Partial<HospitalEventOptionForm>) => void;
  onAddOption: () => void;
  onRemoveOption: (index: number) => void;
  onAddTextItem: (key: "procedure_targets" | "procedure_benefits") => void;
  onRemoveTextItem: (key: "procedure_targets" | "procedure_benefits", index: number) => void;
  onTextItemChange: (key: "procedure_targets" | "procedure_benefits", index: number, value: string) => void;
}) {
  const eventDatePickerRef = React.useRef<HTMLDivElement | null>(null);
  const [isEventDatePickerOpen, setIsEventDatePickerOpen] = React.useState(false);
  const [consultationPriceResetValue, setConsultationPriceResetValue] = React.useState<number | null>(null);
  const eventPriceValue = parseNumberInput(form.event_price);
  const baseConsultationPrice = calculateHospitalEventConsultationBasePrice(eventPriceValue);
  const eventDateRange = React.useMemo<DateRange | undefined>(() => {
    if (!form.event_start_at) return undefined;

    const startDate = parseDateParam(form.event_start_at);
    if (!startDate) return undefined;

    return {
      from: startDate,
      to: form.is_event_period_unlimited ? startDate : parseDateParam(form.event_end_at),
    };
  }, [form.event_end_at, form.event_start_at, form.is_event_period_unlimited]);
  const eventPeriodInputValue = React.useMemo(
    () => formatEventPeriodInputValue(form.event_start_at, form.event_end_at, form.is_event_period_unlimited),
    [form.event_end_at, form.event_start_at, form.is_event_period_unlimited],
  );

  const applyEventDateRange = React.useCallback(
    (nextRange?: DateRange, selectedDay?: Date) => {
      if (!nextRange?.from) {
        onFieldChange("event_start_at", "");
        onFieldChange("event_end_at", "");
        return;
      }

      const eventStartAt = formatLocalDate(normalizeRangeDate(form.is_event_period_unlimited && selectedDay ? selectedDay : nextRange.from));
      const eventEndAt = nextRange.to ? formatLocalDate(normalizeRangeDate(nextRange.to)) : "";

      onFieldChange("event_start_at", eventStartAt);
      onFieldChange("event_end_at", form.is_event_period_unlimited ? "" : eventEndAt);
    },
    [form.is_event_period_unlimited, onFieldChange],
  );

  const applyEventPeriodPreset = React.useCallback(
    (presetKey: string) => {
      const baseDate = parseDateParam(form.event_start_at) ?? normalizeRangeDate(new Date());
      const presetMonths = presetKey === "threeMonths" ? 3 : presetKey === "twoMonths" ? 2 : 1;
      const endDate = addMonthsClamped(baseDate, presetMonths);

      onFieldChange("event_start_at", formatLocalDate(baseDate));
      onFieldChange("event_end_at", formatLocalDate(endDate));
      onFieldChange("is_event_period_unlimited", false);
    },
    [form.event_start_at, onFieldChange],
  );
  const handleConsultationPriceBlur = React.useCallback(() => {
    const consultationPrice = parseNumberInput(form.consultation_price);
    if (eventPriceValue <= 0 || consultationPrice <= 0 || consultationPrice >= baseConsultationPrice) return;

    setConsultationPriceResetValue(baseConsultationPrice);
  }, [baseConsultationPrice, eventPriceValue, form.consultation_price]);
  const confirmConsultationPriceReset = React.useCallback(() => {
    if (consultationPriceResetValue === null) return;

    onFieldChange("consultation_price", formatNumberInput(String(consultationPriceResetValue)));
    setConsultationPriceResetValue(null);
  }, [consultationPriceResetValue, onFieldChange]);

  return (
    <>
    <Card className={cardClassName}>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h3 className="text-sm font-bold text-gray-900">이벤트 정보</h3>
        <SegmentedTabs
          items={[
            { value: "IMAGE", label: "이미지 등록" },
            { value: "TEXT", label: "텍스트 등록" },
          ]}
          value={form.event_type}
          onValueChange={(value) => {
            onFieldChange("event_type", value as HospitalEventType);
          }}
	          className="w-44 rounded-lg p-0.5"
	          tabClassName="whitespace-nowrap rounded-md px-3 py-1.5 text-xs"
	        />
      </div>

      <div className="space-y-4">
        <InlineField label="이벤트명" required error={errors.name} target="name">
          <InputField
            value={form.name}
            onChange={(event) => onFieldChange("name", event.target.value.slice(0, 20))}
            placeholder="20자 이내로 이벤트명을 입력해 주세요."
            error={Boolean(errors.name)}
            className={inputClassName}
          />
        </InlineField>

        <InlineField label="이벤트설명" required error={errors.description} target="description">
          <InputField
            value={form.description}
            onChange={(event) => onFieldChange("description", event.target.value.slice(0, 40))}
            placeholder="40자 이내로 이벤트 설명을 입력해 주세요."
            error={Boolean(errors.description)}
            className={inputClassName}
          />
        </InlineField>

	        <InlineField label="기간선택" required error={errors.event_start_at ?? errors.event_end_at} target={errors.event_start_at ? "event_start_at" : "event_end_at"}>
	          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
	            <DateRangeFilterDropdown
	              label="이벤트 기간"
	              hideLabel
	              containerRef={eventDatePickerRef}
	              value={eventPeriodInputValue}
	              placeholder="이벤트 기간을 선택해 주세요."
	              selected={eventDateRange}
	              isOpen={isEventDatePickerOpen}
	              presetOptions={EVENT_PERIOD_PRESET_OPTIONS}
	              onToggleOpen={() => setIsEventDatePickerOpen((prev) => !prev)}
	              onSelect={applyEventDateRange}
	              onPresetSelect={applyEventPeriodPreset}
	              onReset={() => {
	                onFieldChange("event_start_at", "");
	                onFieldChange("event_end_at", "");
	                setIsEventDatePickerOpen(false);
	              }}
		              onConfirm={() => setIsEventDatePickerOpen(false)}
		              error={Boolean(errors.event_start_at ?? errors.event_end_at)}
		              triggerClassName={inputClassName}
		            />
	            <FormCheckbox
	              checked={form.is_event_period_unlimited}
	              onChange={(checked) => {
	                onFieldChange("is_event_period_unlimited", checked);
	                if (checked) {
	                  onFieldChange("event_end_at", "");
	                }
	              }}
	              label="종료일 없음"
	            />
	          </div>
	        </InlineField>

	        <div className="rounded-xl border border-gray-200 bg-white px-4 py-4">
		          <div className="space-y-3">
			            <div className="grid h-6 grid-cols-[7rem_minmax(0,1fr)] items-center gap-3">
			              <FormCheckbox checked={form.is_vat_included} onChange={(checked) => onFieldChange("is_vat_included", checked)} label="VAT 포함" className="size-4 rounded-full" />
			              <span className="whitespace-nowrap text-xs leading-5 text-gray-500">부가가치세는 할인 금액에 반드시 포함해 주세요.</span>
		            </div>
		            <div className="grid h-6 grid-cols-[7rem_minmax(0,1fr)] items-center gap-3">
		              <FormCheckbox checked={!form.is_vat_included} onChange={(checked) => onFieldChange("is_vat_included", !checked)} label="VAT 비대상" className="size-4 rounded-full" />
		              <span className="whitespace-nowrap text-xs leading-5 text-gray-500">실비·건강보험은 진료(치료)에 해당하는 경우에만 적용 가능합니다.</span>
		            </div>
		          </div>
		          <div className="my-4 h-px bg-gray-200" />
		          <div className="space-y-3">
		            <p className="text-xs text-gray-500">* 실비보험·건강보험 등 치료 목적이 아닌 경우에는 일괄 VAT 포함을 선택해 주세요.</p>
	            <InlineField label="정상 가격" required error={errors.normal_price} target="normal_price">
	              <PriceInput value={form.normal_price} onChange={(value) => onFieldChange("normal_price", value)} error={Boolean(errors.normal_price)} />
	            </InlineField>
	            <InlineField
	              label="이벤트 가격"
	              required
	              error={errors.event_price ?? eventPriceError ?? undefined}
	              target="event_price"
	              footer={<p className="text-xs text-gray-500">* 49% 이상 할인은 적용이 불가합니다.</p>}
	            >
	              <div className="grid grid-cols-[minmax(0,1fr)_4.75rem] gap-2">
	                <PriceInput value={form.event_price} onChange={(value) => onFieldChange("event_price", value)} error={Boolean(errors.event_price || eventPriceError)} />
		                <div className="flex h-9 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-xs font-semibold text-brand-500">
		                  할인율 {discountRate}%
		                </div>
		              </div>
		            </InlineField>
	            <InlineField label="상담신청단가" error={errors.consultation_price} target="consultation_price">
	              <div className="space-y-1">
		                <PriceInput
		                  value={form.consultation_price}
		                  onChange={(value) => onFieldChange("consultation_price", value)}
		                  onBlur={handleConsultationPriceBlur}
		                  error={Boolean(errors.consultation_price)}
		                  unit="P (POINT)"
		                />
	                <p className="text-xs text-gray-500">* 기준 단가보다 높게 책정하여 이벤트 진행 가능하지만, 해당 건의 환불이 불가능합니다.</p>
	              </div>
	            </InlineField>
	          </div>
        </div>

        {isTreatmentEvent ? (
          <EventOptionsSection
            enabled={form.has_options}
            options={form.options}
            error={errors.options}
            onEnabledChange={(checked) => onFieldChange("has_options", checked)}
            onOptionChange={onOptionChange}
            onAddOption={onAddOption}
            onRemoveOption={onRemoveOption}
          />
        ) : null}

        {form.event_type === "TEXT" ? (
          <>
            <TextItemSection
              title="시술 대상"
              items={form.procedure_targets}
              maxItems={HOSPITAL_EVENT_PROCEDURE_TARGET_MAX_COUNT}
              error={errors.procedure_targets}
              onAdd={() => onAddTextItem("procedure_targets")}
              onRemove={(index) => onRemoveTextItem("procedure_targets", index)}
              onChange={(index, value) => onTextItemChange("procedure_targets", index, value)}
            />
            <TextItemSection
              title="시술 장점"
              items={form.procedure_benefits}
              maxItems={HOSPITAL_EVENT_PROCEDURE_BENEFIT_MAX_COUNT}
              error={errors.procedure_benefits}
              onAdd={() => onAddTextItem("procedure_benefits")}
              onRemove={(index) => onRemoveTextItem("procedure_benefits", index)}
              onChange={(index, value) => onTextItemChange("procedure_benefits", index, value)}
            />
            <DoctorVisibilitySection
              assignments={form.doctor_assignments}
              onChange={(index, patch) => {
                const nextAssignments = [...form.doctor_assignments];
                nextAssignments[index] = { ...nextAssignments[index], ...patch };
                onFieldChange("doctor_assignments", nextAssignments);
              }}
            />
          </>
        ) : null}

	        <InlineField label="부작용안내" error={errors.side_effect_notice} target="side_effect_notice">
	          <FormTextArea
            value={form.side_effect_notice}
            onChange={(value) => onFieldChange("side_effect_notice", value.slice(0, 90))}
            rows={3}
            placeholder="예) 수술/시술 후 염증, 출혈, 감염 등 부작용이 발생할 수 있어 주의가 필요합니다."
	            error={Boolean(errors.side_effect_notice)}
	          />
	        </InlineField>

	        <InlineImageFileField
	          label="썸네일"
	          target="thumbnail_image"
	          required
	          helper="800px x 800px 이상, 1:1비율, 2MB 이하"
		          file={thumbnailImage}
		          error={errors.thumbnail_image}
		          onChange={onThumbnailChange}
		          onValidate={(file) => validateImageFile(file, { square: true, maxBytes: 2 * 1024 * 1024, minWidth: 800, minHeight: 800 })}
	          validationMessage={THUMBNAIL_VALIDATION_MESSAGE}
	          onUploadWarning={onUploadWarning}
	        />
	        {form.event_type === "IMAGE" ? (
	          <InlineImageFileField
	            label="이벤트 페이지"
	            target="event_page_image"
	            required
	            helper="가로 800px 이상, 5MB 이하"
		            file={eventPageImage}
		            error={errors.event_page_image}
		            onChange={onEventPageChange}
		            onValidate={(file) => validateImageFile(file, { maxBytes: 5 * 1024 * 1024, minWidth: 800 })}
	            validationMessage={EVENT_PAGE_VALIDATION_MESSAGE}
	            onUploadWarning={onUploadWarning}
	          />
	        ) : null}
		      </div>
	    </Card>
	    <Modal
	      isOpen={consultationPriceResetValue !== null}
	      onClose={confirmConsultationPriceReset}
	      showCloseButton={false}
	      className="mx-4 w-full max-w-md"
	    >
	      <ModalPanel>
	        <ModalHeader className="pr-0">
	          <ModalTitle>상담신청단가 확인</ModalTitle>
	        </ModalHeader>
	        <ModalBody className="mt-5">
	          <p className="text-sm font-medium leading-6 text-gray-800">
	            기준 단가보다 낮게 설정할 수 없어요. 최소 기준 단가로 되돌릴게요.
	          </p>
	        </ModalBody>
	        <ModalFooter>
	          <Button type="button" variant="brand" onClick={confirmConsultationPriceReset}>
	            확인
	          </Button>
	        </ModalFooter>
	      </ModalPanel>
	    </Modal>
    </>
  );
}

function EventOptionsSection({
  enabled,
  options,
  error,
  onEnabledChange,
  onOptionChange,
  onAddOption,
  onRemoveOption,
}: {
  enabled: boolean;
  options: HospitalEventOptionForm[];
  error?: string;
  onEnabledChange: (checked: boolean) => void;
  onOptionChange: (index: number, patch: Partial<HospitalEventOptionForm>) => void;
  onAddOption: () => void;
  onRemoveOption: (index: number) => void;
}) {
	  return (
	    <div className="space-y-2" data-field-target="options" tabIndex={-1}>
	      <div className="flex items-center justify-between gap-3">
	        <div className="flex min-w-0 items-center gap-3">
	          <FormCheckbox checked={enabled} onChange={onEnabledChange} label="이벤트 옵션 선택" className="size-4 rounded-full" />
	          <span className="min-w-0 truncate text-xs text-gray-500">성형 카테고리 선택시 이벤트 옵션을 선택하실 수 없습니다.</span>
	        </div>
	        <Button type="button" variant="outline" size="sm" className="h-7 px-3 text-xs">
	          옵션가이드
	        </Button>
	      </div>
	      {enabled ? (
	        <>
	        <div className="overflow-x-auto rounded-lg border border-gray-200">
	          <table className="w-full table-fixed text-left text-xs">
	            <thead className="border-b border-gray-200 bg-gray-50 text-gray-600">
		              <tr>
		                <th className="px-2 py-2">옵션명</th>
		                <th className="w-16 px-1 py-2 text-center">회차</th>
		                <th className="w-20 px-1 py-2">정가</th>
		                <th className="w-28 px-1 py-2">할인가</th>
		                <th className="w-10 px-1 py-2 text-center">삭제</th>
		              </tr>
            </thead>
            <tbody>
              {options.map((option, index) => {
                const normalPrice = parseNumberInput(option.normal_price);
                const eventPrice = parseNumberInput(option.event_price);
                const discountRate = normalPrice > 0 && eventPrice > 0 ? Math.max(0, Math.floor((1 - eventPrice / normalPrice) * 100)) : 0;

                return (
	                  <tr key={index} className="border-b border-gray-100 last:border-b-0">
		                    <td className="px-1.5 py-1.5">
	                      <EventOptionTableInput
	                        value={option.name}
	                        onChange={(event) => onOptionChange(index, { name: event.target.value.slice(0, 40) })}
	                        placeholder={index === 0 ? "이벤트명과 연관된 시술을 입력해 주세요." : "40자 이내로 입력하세요."}
	                      />
	                    </td>
		                    <td className="px-1 py-1.5">
	                      <div className="flex items-center justify-center gap-1 text-[11px] text-gray-700">
	                        <button
	                          type="button"
	                          className="px-1 text-gray-500"
	                          onClick={() => {
	                            const nextCount = Math.max(1, (Number.parseInt(option.session_count, 10) || 1) - 1);
	                            onOptionChange(index, { session_count: String(nextCount) });
	                          }}
	                        >
	                          -
	                        </button>
	                        <span className="min-w-3 text-center font-medium">{option.session_count || "1"}</span>
	                        <button
	                          type="button"
	                          className="px-1 text-gray-500"
	                          onClick={() => {
	                            const nextCount = (Number.parseInt(option.session_count, 10) || 1) + 1;
	                            onOptionChange(index, { session_count: String(nextCount) });
	                          }}
	                        >
	                          +
	                        </button>
	                      </div>
	                    </td>
		                    <td className="px-1 py-1.5">
	                      <EventOptionTableInput
	                        value={option.normal_price}
	                        onChange={(event) => onOptionChange(index, { normal_price: formatNumberInput(event.target.value) })}
	                        placeholder="정가 입력"
	                      />
	                    </td>
		                    <td className="px-1 py-1.5">
	                      <div className="grid grid-cols-[minmax(0,1fr)_2.25rem] items-center gap-1">
	                        <EventOptionTableInput
	                          value={option.event_price}
	                          onChange={(event) => onOptionChange(index, { event_price: formatNumberInput(event.target.value) })}
	                          placeholder="할인가 입력"
	                        />
	                        <span className="text-right text-[11px] font-medium text-brand-500">{discountRate}%</span>
	                      </div>
	                    </td>
		                    <td className="px-1 py-1.5 text-center">
	                      <CircleRemoveButton onClick={() => onRemoveOption(index)} className="mx-auto size-6" />
	                    </td>
                  </tr>
                );
              })}
            </tbody>
	          </table>
	        </div>
	        <Button type="button" variant="outline" size="sm" className="h-8 w-full" onClick={onAddOption}>
	          + 옵션추가
	        </Button>
	        </>
	      ) : null}
      {error ? <p className="mt-2 text-xs text-error-500">{error}</p> : null}
    </div>
	  );
	}

function EventOptionTableInput(props: React.ComponentProps<"input">) {
  return (
    <input
      {...props}
      className={[
        "h-7 w-full min-w-0 rounded-md border border-transparent bg-transparent px-1 text-[11px] text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-brand-200 focus:bg-white focus:ring-2 focus:ring-brand-100",
        props.className,
      ].filter(Boolean).join(" ")}
    />
  );
}

function TextItemSection({
  title,
  items,
  maxItems,
  error,
  onAdd,
  onRemove,
  onChange,
}: {
  title: string;
  items: string[];
  maxItems: number;
  error?: string;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onChange: (index: number, value: string) => void;
}) {
  const displayItems = items.length > 0 ? items : [""];
  const canAddItem = displayItems.length < maxItems;

  return (
    <div className="grid grid-cols-[6rem_minmax(0,1fr)] items-start gap-3">
      <Label className={`${labelClassName} pt-2`}>
        <span className="block">{title}</span>
        <span className="mt-1 block text-[11px] font-normal text-gray-400">(최대 {maxItems}개)</span>
      </Label>
      <div className="min-w-0 space-y-2">
      {displayItems.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
          <InputField
            value={item}
            onChange={(event) => onChange(index, event.target.value)}
            placeholder="90자 이내로 입력해 주세요."
            className={inputClassName}
          />
          </div>
          {index > 0 ? (
            <CircleRemoveButton
              onClick={() => onRemove(index)}
              className="size-7"
              aria-label={`${title} 삭제`}
            />
          ) : (
            <span className="size-7 shrink-0" aria-hidden="true" />
          )}
        </div>
      ))}
      <div className="flex justify-center">
        <AddCircleButton
          label={`${title} 추가`}
          onClick={() => {
            if (!canAddItem) return;
            onAdd();
          }}
          disabled={!canAddItem}
          className="disabled:cursor-not-allowed disabled:opacity-40"
        />
      </div>
      {error ? <p className="text-xs text-error-500">{error}</p> : null}
      </div>
    </div>
  );
}

function DoctorVisibilitySection({
  assignments,
  onChange,
}: {
  assignments: HospitalEventFormValues["doctor_assignments"];
  onChange: (index: number, patch: Partial<HospitalEventFormValues["doctor_assignments"][number]>) => void;
}) {
  const selectedAssignments = assignments.filter((assignment) => assignment.hospital_doctor_id);

  return (
    <div className="grid grid-cols-[6rem_minmax(0,1fr)] items-start gap-3">
      <Label className={`${labelClassName} pt-2`}>
        <span className="block">의료진</span>
        <span className="block">정보노출선택</span>
      </Label>
      <div className="min-w-0 space-y-2">
      {assignments.map((assignment, index) => {
        if (!assignment.hospital_doctor_id) return null;

        return (
          <div key={assignment.hospital_doctor_id} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
            <InputField value={assignment.name} readOnly className={inputClassName} />
            <FormCheckbox checked={assignment.is_career_visible} onChange={(checked) => onChange(index, { is_career_visible: checked })} label="경력사항 노출" />
            <FormCheckbox checked={assignment.is_activity_visible} onChange={(checked) => onChange(index, { is_activity_visible: checked })} label="활동사항 노출" />
          </div>
        );
      })}
      {selectedAssignments.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-500">
          의료진 선택에서 의료진을 선택하면 노출 항목을 설정할 수 있습니다.
        </div>
      ) : null}
      <p className="text-xs text-gray-500">* 노출여부 체크시 원장님 경력 / 활동 사항은 자동 입력 됩니다.</p>
      </div>
    </div>
  );
}

function EventMediaCard({
  eventType,
  thumbnailImage,
  eventPageImage,
  onThumbnailChange,
  onEventPageChange,
  onPreview,
  onUploadWarning,
}: {
  eventType: HospitalEventType;
  thumbnailImage: File | null;
  eventPageImage: File | null;
  onThumbnailChange: (file: File | null) => void;
  onEventPageChange: (file: File | null) => void;
  onPreview: (preview: HospitalMediaPreviewState) => void;
  onUploadWarning: (message: string) => void;
}) {
  const thumbnailUrl = useObjectUrl(thumbnailImage);
  const eventPageUrl = useObjectUrl(eventPageImage);

  return (
    <div className="min-w-0 space-y-4">
      <SingleImagePreviewPanel
        title="썸네일"
        helper="800px x 800px 이상, 1:1비율, 2MB 이하"
        objectUrl={thumbnailUrl}
        onPreview={onPreview}
        onFileChange={onThumbnailChange}
        onValidate={(file) => validateImageFile(file, { square: true, maxBytes: 2 * 1024 * 1024, minWidth: 800, minHeight: 800 })}
        validationMessage={THUMBNAIL_VALIDATION_MESSAGE}
        onUploadWarning={onUploadWarning}
      />
      {eventType === "IMAGE" ? (
        <SingleImagePreviewPanel
          title="이벤트 페이지"
          helper="가로 800px 이상, 5MB 이하"
          objectUrl={eventPageUrl}
          onPreview={onPreview}
          onFileChange={onEventPageChange}
          onValidate={(file) => validateImageFile(file, { maxBytes: 5 * 1024 * 1024, minWidth: 800 })}
          validationMessage={EVENT_PAGE_VALIDATION_MESSAGE}
          onUploadWarning={onUploadWarning}
          tall
        />
      ) : null}
    </div>
  );
}

function InlineImageFileField({
  label,
  target,
  required = false,
  helper,
  file,
  error,
  onChange,
  onValidate,
  validationMessage,
  onUploadWarning,
}: {
  label: string;
  target: HospitalEventFieldName;
  required?: boolean;
  helper: string;
  file: File | null;
  error?: string;
  onChange: (file: File | null) => void;
  onValidate: (file: File) => Promise<boolean>;
  validationMessage: string;
  onUploadWarning: (message: string) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const displayText = file?.name ?? helper;

  return (
	    <InlineField label={label} required={required} error={error} target={target}>
	      <div className="space-y-2">
        <div className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2">
          <span
            className={[
              "min-w-0 truncate rounded-md px-2 py-1 text-xs",
              file ? "bg-gray-50 font-medium text-gray-700" : "text-gray-500",
            ].join(" ")}
          >
            {displayText}
          </span>
          <Button type="button" variant="brand" size="sm" className={fileButtonClassName} onClick={() => inputRef.current?.click()}>
            파일선택
          </Button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={EVENT_IMAGE_ACCEPT}
          className="hidden"
          onChange={async (event) => {
            const selectedFile = event.target.files?.[0] ?? null;
            event.currentTarget.value = "";
            if (!selectedFile) return;

            const isValid = await onValidate(selectedFile);
            if (!isValid) {
              onUploadWarning(validationMessage);
              return;
            }

            onChange(selectedFile);
          }}
        />
      </div>
    </InlineField>
  );
}

function SingleImagePreviewPanel({
  title,
  helper,
  objectUrl,
  onPreview,
  onFileChange,
  onValidate,
  validationMessage,
  onUploadWarning,
  tall = false,
}: {
  title: string;
  helper: string;
  objectUrl: string | null;
  onPreview: (preview: HospitalMediaPreviewState) => void;
  onFileChange: (file: File | null) => void;
  onValidate: (file: File) => Promise<boolean>;
  validationMessage: string;
  onUploadWarning: (message: string) => void;
	tall?: boolean;
}) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const emptyTitle = title === "이벤트 페이지" ? "이벤트 이미지를 등록해 주세요." : `${title} 이미지를 등록해 주세요.`;

  return (
    <Card className={cardClassName}>
      <div className="mb-2">
        <div>
          <h3 className="text-sm font-bold text-gray-900">{title}</h3>
          <p className="mt-1 text-xs text-gray-500">{helper}</p>
        </div>
      </div>
	      <button
	        type="button"
		        onClick={() => {
		          if (objectUrl) {
		            onPreview({ url: objectUrl, title, isImage: true });
		            return;
		          }

		          inputRef.current?.click();
		        }}
		        className={[
		          "flex w-full items-center justify-center overflow-hidden rounded-xl",
		          tall ? (objectUrl ? "max-h-[32rem]" : "min-h-[18rem]") : "aspect-square",
		          objectUrl ? "cursor-pointer border border-gray-200 bg-gray-50" : "cursor-pointer",
		        ].join(" ")}
	      >
		        {objectUrl ? (
		          // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
		          <img src={objectUrl} alt={title} className={tall ? "h-auto max-h-[32rem] w-full object-contain" : "h-full w-full object-cover"} />
		        ) : (
	          <div className="flex aspect-square w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-gray-300 bg-white px-6 text-center">
	            <div className="flex size-12 items-center justify-center rounded-full bg-brand-50 text-brand-500">
	              <span className="text-2xl leading-none">+</span>
	            </div>
	            <div className="space-y-1">
	              <p className="text-sm font-semibold text-gray-800">{emptyTitle}</p>
	              <p className="text-xs text-gray-500">jpg, png 파일을 업로드할 수 있습니다.</p>
	            </div>
	          </div>
		        )}
	      </button>
	      <input
	        ref={inputRef}
	        type="file"
	        accept={EVENT_IMAGE_ACCEPT}
	        className="hidden"
	        onChange={async (event) => {
	          const selectedFile = event.target.files?.[0] ?? null;
	          event.currentTarget.value = "";
	          if (!selectedFile) return;

	          const isValid = await onValidate(selectedFile);
	          if (!isValid) {
	            onUploadWarning(validationMessage);
	            return;
	          }

	          onFileChange(selectedFile);
	        }}
	      />
	    </Card>
  );
}

function HospitalEventAppPreviewModal({
  isOpen,
  onClose,
  form,
  thumbnailImage,
  eventPageImage,
  discountRate,
}: {
  isOpen: boolean;
  onClose: () => void;
  form: HospitalEventFormValues;
  thumbnailImage: File | null;
  eventPageImage: File | null;
  discountRate: number;
}) {
  const thumbnailUrl = useObjectUrl(thumbnailImage);
  const eventPageUrl = useObjectUrl(eventPageImage);
  const normalPrice = parseNumberInput(form.normal_price);
  const eventPrice = parseNumberInput(form.event_price);
  const heroUrl = thumbnailUrl;
  const heroPlaceholder = "썸네일 이미지를 등록해 주세요.";
  const procedureTargets = form.procedure_targets.map((item) => item.trim()).filter(Boolean);
  const procedureBenefits = form.procedure_benefits.map((item) => item.trim()).filter(Boolean);
  const selectedDoctors = form.doctor_assignments.filter((assignment) => assignment.hospital_doctor_id && assignment.name.trim());
  const options = form.has_options ? form.options.filter((option) => option.name.trim()) : [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showCloseButton={false}
      className="mx-4 w-[calc(100%-2rem)] max-w-[430px] !rounded-[28px] !bg-transparent"
    >
      <div className="mx-auto flex max-h-[86vh] w-full max-w-[390px] flex-col overflow-hidden rounded-[26px] bg-white shadow-2xl shadow-slate-950/30 ring-1 ring-black/10">
        <div className="flex h-11 shrink-0 items-center justify-between px-8 text-[17px] font-bold text-gray-950">
          <span>9:41</span>
          <div className="flex items-center gap-1.5">
            <span className="flex items-end gap-0.5">
              <span className="h-1.5 w-1 rounded-sm bg-gray-950" />
              <span className="h-2.5 w-1 rounded-sm bg-gray-950" />
              <span className="h-3.5 w-1 rounded-sm bg-gray-950" />
            </span>
            <span className="h-3 w-4 rounded-t-full border-2 border-b-0 border-gray-950" />
            <span className="h-3.5 w-6 rounded-sm border-2 border-gray-950 after:ml-5 after:block after:h-1.5 after:w-0.5 after:translate-y-1 after:rounded-r after:bg-gray-950" />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="flex h-14 items-center justify-between px-5 text-gray-500">
            <div className="flex items-center gap-5">
              <button type="button" aria-label="뒤로가기" className="text-4xl leading-none text-gray-500">
                ‹
              </button>
              <span className="text-3xl leading-none">⌂</span>
            </div>
            <div className="flex items-center gap-5 text-2xl">
              <span aria-hidden>⌯</span>
              <span aria-hidden>▱</span>
            </div>
          </div>

          <div className="bg-gray-50">
            {heroUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
              <img
                src={heroUrl}
                alt="썸네일 미리보기"
                className="aspect-square w-full bg-white object-cover"
              />
            ) : (
              <div className="flex aspect-square items-center justify-center bg-gray-100 px-8 text-center text-sm font-semibold text-gray-500">
                {heroPlaceholder}
              </div>
            )}
          </div>

          <div className="space-y-4 px-4 py-4">
            <div>
              <h2 className="break-keep text-[15px] font-bold leading-6 text-gray-900">
                {form.name.trim() || "이벤트명을 입력해 주세요."}
              </h2>
            </div>

            <div className="space-y-3 border-y border-gray-100 py-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-gray-700">정가</span>
                <span className="text-gray-400 line-through">{formatAppPreviewWon(normalPrice)}</span>
              </div>
              <div className="flex items-end justify-between">
                <span className="text-xs font-semibold text-gray-700">할인가</span>
                <div className="text-right">
                  <div className="text-xl font-extrabold text-gray-950">
                    <span className="mr-1 text-brand-500">{discountRate}%</span>
                    {formatAppPreviewWon(eventPrice)}
                  </div>
                  <p className="mt-0.5 text-[11px] text-gray-400">{form.is_vat_included ? "VAT 포함" : "VAT 비대상"}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-gray-900">이벤트 설명</h3>
              <p className="mt-2 break-keep text-xs leading-5 text-gray-500">
                {form.description.trim() || "이벤트 설명을 입력해 주세요."}
              </p>
            </div>

            {form.event_type === "IMAGE" ? (
              <div className="-mx-4 overflow-hidden bg-gray-50">
                {eventPageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
                  <img src={eventPageUrl} alt="이벤트 이미지 미리보기" className="h-auto w-full object-contain" />
                ) : (
                  <div className="flex min-h-48 items-center justify-center px-6 text-center text-xs font-semibold text-gray-400">
                    이벤트 이미지를 등록해 주세요.
                  </div>
                )}
              </div>
            ) : null}

            {options.length > 0 ? (
              <AppPreviewSection title="이벤트 옵션">
                <div className="space-y-2">
                  {options.map((option, index) => {
                    const optionNormalPrice = parseNumberInput(option.normal_price);
                    const optionEventPrice = parseNumberInput(option.event_price);
                    const optionDiscountRate = calculateHospitalEventDiscountRate(optionNormalPrice, optionEventPrice);

                    return (
                      <div key={`${option.name}-${index}`} className="rounded-xl bg-gray-50 px-3 py-2">
                        <div className="flex items-center justify-between gap-3">
                          <span className="min-w-0 flex-1 truncate text-xs font-semibold text-gray-800">{option.name}</span>
                          <span className="shrink-0 text-[11px] text-gray-500">{Math.max(1, Number(option.session_count) || 1)}회</span>
                        </div>
                        <div className="mt-1 flex items-center justify-end gap-2 text-xs">
                          {optionDiscountRate > 0 ? <span className="font-semibold text-brand-500">{optionDiscountRate}%</span> : null}
                          <span className="font-bold text-gray-900">{formatAppPreviewWon(optionEventPrice)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </AppPreviewSection>
            ) : null}

            {form.event_type === "TEXT" ? (
              <>
                <AppPreviewListSection title="시술 대상" items={procedureTargets} emptyText="시술 대상을 입력해 주세요." />
                <AppPreviewListSection title="시술 장점" items={procedureBenefits} emptyText="시술 장점을 입력해 주세요." />
                <AppPreviewSection title="의료진 정보">
                  {selectedDoctors.length > 0 ? (
                    <div className="space-y-2">
                      {selectedDoctors.map((doctor) => (
                        <div key={doctor.hospital_doctor_id} className="rounded-xl bg-gray-50 px-3 py-2">
                          <p className="text-xs font-bold text-gray-900">{doctor.name}</p>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {doctor.is_career_visible ? <AppPreviewChip>경력사항</AppPreviewChip> : null}
                            {doctor.is_activity_visible ? <AppPreviewChip>활동사항</AppPreviewChip> : null}
                            {!doctor.is_career_visible && !doctor.is_activity_visible ? <AppPreviewChip>정보 미노출</AppPreviewChip> : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400">의료진을 선택해 주세요.</p>
                  )}
                </AppPreviewSection>
              </>
            ) : null}

            <AppPreviewSection title="부작용 안내">
              <p className="whitespace-pre-line break-keep text-xs leading-5 text-gray-600">
                {form.side_effect_notice.trim() || "수술/시술 후 염증, 출혈, 감염 등 부작용이 발생할 수 있어 주의가 필요합니다."}
              </p>
            </AppPreviewSection>
          </div>
        </div>

        <div className="grid shrink-0 grid-cols-[4.25rem_minmax(0,1fr)] gap-2 border-t border-gray-100 bg-white px-4 py-3">
          <button type="button" className="h-11 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-700">
            병원
          </button>
          <button type="button" className="h-11 rounded-xl bg-brand-500 text-sm font-bold text-white">
            상담 신청
          </button>
        </div>
      </div>
    </Modal>
  );
}

function AppPreviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-bold text-gray-900">{title}</h3>
      {children}
    </section>
  );
}

function AppPreviewListSection({ title, items, emptyText }: { title: string; items: string[]; emptyText: string }) {
  return (
    <AppPreviewSection title={title}>
      {items.length > 0 ? (
        <ul className="space-y-1.5">
          {items.map((item, index) => (
            <li key={`${item}-${index}`} className="rounded-xl bg-gray-50 px-3 py-2 text-xs leading-5 text-gray-700">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-gray-400">{emptyText}</p>
      )}
    </AppPreviewSection>
  );
}

function AppPreviewChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-500">
      {children}
    </span>
  );
}

function formatAppPreviewWon(value: number) {
  return value > 0 ? `${value.toLocaleString("ko-KR")}원` : "-";
}

function InlineField({
  label,
  required = false,
  error,
  target,
  footer,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  target?: HospitalEventFieldName;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[6rem_minmax(0,1fr)] items-start gap-3" data-field-target={target} tabIndex={target ? -1 : undefined}>
      <Label className={`${labelClassName} pt-2`}>
        {label}
        {required ? <span className="ml-0.5 text-brand-500">*</span> : null}
      </Label>
      <div className="min-w-0">
        {children}
        {error ? <p className="mt-1.5 text-xs text-error-500">{error}</p> : null}
        {footer ? <div className="mt-1.5">{footer}</div> : null}
      </div>
    </div>
  );
}

function PriceInput({
  value,
  onChange,
  onBlur,
  error,
  unit = "원",
}: {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: boolean;
  unit?: string;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_4rem] items-center gap-2">
      <InputField
        value={value}
        onChange={(event) => onChange(formatNumberInput(event.target.value))}
        onBlur={onBlur}
        placeholder="숫자만 입력해 주세요."
        error={error}
        className={inputClassName}
      />
      <span className="text-xs font-semibold text-gray-600">{unit}</span>
    </div>
  );
}

function UploadWarningModal({ message, onClose }: { message: string | null; onClose: () => void }) {
  return (
    <Modal isOpen={Boolean(message)} onClose={onClose} showCloseButton={false} className="mx-4 w-[calc(100%-2rem)] max-w-sm">
      <ModalPanel>
        <ModalHeader className="pr-0">
          <ModalTitle className="text-base">이미지 업로드 조건 확인</ModalTitle>
        </ModalHeader>
        <ModalBody className="mt-5">
          <p className="whitespace-pre-line text-sm font-medium leading-6 text-gray-800">{message}</p>
        </ModalBody>
        <ModalFooter>
          <Button type="button" variant="brand" onClick={onClose}>
            확인
          </Button>
        </ModalFooter>
      </ModalPanel>
    </Modal>
  );
}

function formatEventPeriodInputValue(startAt: string, endAt: string, isUnlimited: boolean) {
  if (!startAt) return "";

  if (isUnlimited) {
    return `${formatShortHyphenDate(startAt)} ~ 무기한`;
  }

  return endAt ? `${formatShortHyphenDate(startAt)} ~ ${formatShortHyphenDate(endAt)}` : formatShortHyphenDate(startAt);
}

function formatShortHyphenDate(value: string) {
  return value.length === 10 ? value.slice(2) : value;
}

function addMonthsClamped(date: Date, months: number) {
  const year = date.getFullYear();
  const month = date.getMonth() + months;
  const day = date.getDate();
  const lastDayOfTargetMonth = new Date(year, month + 1, 0).getDate();

  return normalizeRangeDate(new Date(year, month, Math.min(day, lastDayOfTargetMonth)));
}

function useObjectUrl(file: File | null) {
  const [url, setUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return url;
}

async function validateImageFile(
  file: File,
  constraints: {
    maxBytes: number;
    minWidth?: number;
    minHeight?: number;
    square?: boolean;
  },
) {
  if (!isAllowedEventImageFile(file)) return false;
  if (file.size > constraints.maxBytes) return false;

  const dimensions = await readImageDimensions(file);
  if (!dimensions) return false;
  if (constraints.minWidth && dimensions.width < constraints.minWidth) return false;
  if (constraints.minHeight && dimensions.height < constraints.minHeight) return false;
  if (constraints.square && dimensions.width !== dimensions.height) return false;

  return true;
}

function isAllowedEventImageFile(file: File) {
  const normalizedType = file.type.toLowerCase();
  if (EVENT_IMAGE_ALLOWED_MIME_TYPES.includes(normalizedType)) return true;

  const normalizedName = file.name.toLowerCase();
  return EVENT_IMAGE_ALLOWED_EXTENSIONS.some((extension) => normalizedName.endsWith(extension));
}

function readImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      const result = { width: image.naturalWidth, height: image.naturalHeight };
      URL.revokeObjectURL(url);
      resolve(result);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    image.src = url;
  });
}
