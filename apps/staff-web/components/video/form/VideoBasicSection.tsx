"use client";

import React from "react";
import { isApiSuccess } from "@beaulab/types";
import {
  Button,
  Card,
  ChevronDown,
  FormTextArea,
  InputField,
  Search,
  Select,
  SpinnerBlock,
  X,
  type CategorySelectorItem,
  type CategorySelectorLoadParams,
  type ExistingMediaItem,
} from "@beaulab/ui-admin";

import { useObjectUrl } from "@/hooks/common/useObjectUrl";
import { useVideoDoctorOptions } from "@/hooks/video/useVideoDoctorOptions";
import { useVideoHospitalOptions } from "@/hooks/video/useVideoHospitalOptions";
import { api } from "@/lib/common/api";
import { normalizeHashtagName, sanitizeHashtagName, validateHashtagName } from "@/lib/hashtag/list";
import type { VideoCategoryItem, VideoHashtagItem } from "@/lib/video/detail";
import {
  VIDEO_CATEGORY_SECTIONS,
  formatVideoDurationTypingInput,
  type VideoDoctorOption,
  type VideoFormErrors,
  type VideoFormValues,
  type VideoHashtagOption,
  type VideoHospitalOption,
} from "@/lib/video/form";

const cardClassName = "rounded-xl border border-gray-200 bg-white p-5";
const labelClassName = "pt-0.5 text-xs font-semibold text-gray-500";
const videoCategorySection = VIDEO_CATEGORY_SECTIONS[0];

type VideoBasicSectionProps = {
  form: VideoFormValues;
  errors: VideoFormErrors;
  thumbnailFile: File | null;
  existingThumbnail?: ExistingMediaItem | null;
  selectedCategoryItems?: VideoCategoryItem[];
  selectedHashtagItems?: VideoHashtagItem[];
  showMetrics?: boolean;
  loadCategories: (params: CategorySelectorLoadParams) => Promise<CategorySelectorItem[]>;
  onFieldChange: (key: keyof VideoFormValues, value: VideoFormValues[keyof VideoFormValues]) => void;
  onSelectHospital: (hospital: VideoHospitalOption) => void;
  onClearHospital: () => void;
  onSelectDoctorOption: (doctor: VideoDoctorOption | null) => void;
  onToggleCategory: (categoryId: number, checked: boolean) => void;
  onToggleHashtag: (hashtagId: number, checked: boolean) => void;
  onAddHashtagName: (name: string) => void;
  onRemoveHashtagName: (name: string) => void;
  onThumbnailChange: (file: File | null) => void;
};

export function VideoBasicSection({
  form,
  errors,
  thumbnailFile,
  existingThumbnail = null,
  selectedCategoryItems,
  selectedHashtagItems,
  showMetrics = true,
  loadCategories,
  onFieldChange,
  onSelectHospital,
  onClearHospital,
  onSelectDoctorOption,
  onToggleCategory,
  onToggleHashtag,
  onAddHashtagName,
  onRemoveHashtagName,
  onThumbnailChange,
}: VideoBasicSectionProps) {
  const doctorOptionsResult = useVideoDoctorOptions(form.hospital_id);
  const selectedHospital = form.hospital_id
    ? {
        id: form.hospital_id,
        name: form.hospital_name,
        business_number: form.hospital_business_number,
      }
    : null;

  const selectedDoctorOption = React.useMemo(() => {
    if (!form.doctor_id) return null;

    const matchedOption = doctorOptionsResult.options.find((item) => item.id === form.doctor_id);
    if (matchedOption) return matchedOption;

    return {
      id: form.doctor_id,
      name: form.doctor_name || `의료진 #${form.doctor_id}`,
      position: null,
    } satisfies VideoDoctorOption;
  }, [doctorOptionsResult.options, form.doctor_id, form.doctor_name]);

  const doctorSelectOptions = React.useMemo(() => {
    const baseOptions = doctorOptionsResult.options.map((item) => ({
      value: String(item.id),
      label: item.position ? `${item.name} (${item.position})` : item.name,
    }));

    if (selectedDoctorOption && !doctorOptionsResult.options.some((item) => item.id === selectedDoctorOption.id)) {
      return [
        {
          value: String(selectedDoctorOption.id),
          label: selectedDoctorOption.position
            ? `${selectedDoctorOption.name} (${selectedDoctorOption.position})`
            : selectedDoctorOption.name,
        },
        ...baseOptions,
      ];
    }

    return baseOptions;
  }, [doctorOptionsResult.options, selectedDoctorOption]);

  return (
    <Card as="section" className={cardClassName}>
      <h2 className="mb-5 text-sm font-bold text-gray-900">동영상 정보</h2>

      <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-[20rem_minmax(0,1fr)]">
        <VideoThumbnailPicker
          file={thumbnailFile}
          existingThumbnail={existingThumbnail}
          error={errors.thumbnail_file}
          onChange={onThumbnailChange}
        />

        <div className="grid min-w-0 gap-x-8 gap-y-3 md:grid-cols-2">
          <EditField label="병의원" required error={errors.hospital_id}>
            <VideoHospitalPicker
              selectedHospital={selectedHospital}
              error={errors.hospital_id}
              onSelectHospital={onSelectHospital}
              onClearHospital={onClearHospital}
            />
          </EditField>

          <EditField label="의료진" error={errors.doctor_id}>
            <Select
              id="doctor_id"
              name="doctor_id"
              value={form.doctor_id ? String(form.doctor_id) : ""}
              options={doctorSelectOptions}
              placeholder={
                !form.hospital_id
                  ? "병의원을 먼저 선택해 주세요."
                  : doctorOptionsResult.isLoading
                    ? "불러오는 중"
                    : "의료진을 선택해 주세요."
              }
              disabled={!form.hospital_id || doctorOptionsResult.isLoading}
              onChange={(value: string) => {
                if (!value) {
                  onSelectDoctorOption(null);
                  return;
                }

                const matched =
                  doctorOptionsResult.options.find((item) => String(item.id) === value) ?? selectedDoctorOption ?? null;

                onSelectDoctorOption(matched && String(matched.id) === value ? matched : null);
              }}
              className="h-9 bg-white px-3 py-1.5"
            />
            {doctorOptionsResult.error ? <p className="text-xs text-error-500">{doctorOptionsResult.error}</p> : null}
          </EditField>

          <EditField label="카테고리" error={errors.category_ids}>
            <VideoCategorySelect
              selectedIds={form.category_ids}
              selectedItems={selectedCategoryItems}
              error={errors.category_ids}
              loadCategories={loadCategories}
              onToggleCategory={onToggleCategory}
            />
          </EditField>

          <EditField label="해시태그" error={errors.hashtag_ids}>
            <VideoHashtagSelect
              selectedIds={form.hashtag_ids}
              selectedNames={form.hashtag_names}
              selectedItems={selectedHashtagItems}
              onToggleHashtag={onToggleHashtag}
              onAddHashtagName={onAddHashtagName}
              onRemoveHashtagName={onRemoveHashtagName}
            />
          </EditField>

          {showMetrics ? (
            <>
              <EditField label="조회수" error={errors.view_count}>
                <InputField
                  id="view_count"
                  name="view_count"
                  value={form.view_count}
                  placeholder="0"
                  onChange={(event) => onFieldChange("view_count", event.target.value.replace(/\D/g, ""))}
                  error={Boolean(errors.view_count)}
                  className="h-9 bg-white px-3 py-1.5"
                />
              </EditField>

              <EditField label="좋아요수" error={errors.like_count}>
                <InputField
                  id="like_count"
                  name="like_count"
                  value={form.like_count}
                  placeholder="0"
                  onChange={(event) => onFieldChange("like_count", event.target.value.replace(/\D/g, ""))}
                  error={Boolean(errors.like_count)}
                  className="h-9 bg-white px-3 py-1.5"
                />
              </EditField>
            </>
          ) : null}

          <EditField label="재생시간" error={errors.duration_seconds}>
            <InputField
              id="duration_seconds"
              name="duration_seconds"
              value={form.duration_seconds}
              placeholder="10:30"
              onChange={(event) =>
                onFieldChange("duration_seconds", formatVideoDurationTypingInput(event.target.value))
              }
              error={Boolean(errors.duration_seconds)}
              className="h-9 bg-white px-3 py-1.5"
            />
          </EditField>

          <EditField label="유튜브 링크" required error={errors.external_video_url} className="md:col-span-2">
            <InputField
              id="external_video_url"
              name="external_video_url"
              type="url"
              value={form.external_video_url}
              placeholder="https://www.youtube.com/watch?v=..."
              onChange={(event) => onFieldChange("external_video_url", event.target.value)}
              error={Boolean(errors.external_video_url)}
              className="h-9 bg-white px-3 py-1.5"
            />
          </EditField>

          <EditField label="동영상 제목" required error={errors.title} className="md:col-span-2">
            <InputField
              id="title"
              name="title"
              value={form.title}
              placeholder="동영상 제목을 입력해 주세요."
              onChange={(event) => onFieldChange("title", event.target.value)}
              error={Boolean(errors.title)}
              className="h-9 bg-white px-3 py-1.5"
            />
          </EditField>

          <EditField label="영상설명" error={errors.description} className="md:col-span-2">
            <FormTextArea
              id="description"
              name="description"
              rows={4}
              value={form.description}
              placeholder="영상 설명을 입력해 주세요."
              onChange={(value) => onFieldChange("description", value)}
              error={Boolean(errors.description)}
            />
          </EditField>
        </div>
      </div>
    </Card>
  );
}

function VideoThumbnailPicker({
  file,
  existingThumbnail,
  error,
  onChange,
}: {
  file: File | null;
  existingThumbnail: ExistingMediaItem | null;
  error?: string;
  onChange: (file: File | null) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const fileUrl = useObjectUrl(file);
  const previewUrl = fileUrl ?? existingThumbnail?.url ?? null;

  return (
    <Card
      data-media-collection="thumbnail_file"
      tabIndex={-1}
      className="flex min-h-[14rem] flex-col items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white p-4"
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => {
          const nextFile = event.target.files?.[0] ?? null;
          event.currentTarget.value = "";
          onChange(nextFile);
        }}
      />

      {previewUrl ? (
        <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element -- runtime storage URL or local object URL */}
          <img src={previewUrl} alt="동영상 썸네일" className="h-full w-full object-cover" />
        </div>
      ) : (
        <button
          type="button"
          className="flex aspect-square w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-gray-300 bg-white px-6 text-center transition-colors hover:border-brand-200 hover:bg-brand-50/30"
          onClick={() => inputRef.current?.click()}
        >
          <div className="flex size-12 items-center justify-center rounded-full bg-brand-50 text-brand-500">
            <span className="text-2xl leading-none">+</span>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-gray-800">썸네일 이미지를 등록해 주세요.</p>
            <p className="text-xs text-gray-500">jpg, png, webp 파일을 업로드할 수 있습니다.</p>
          </div>
        </button>
      )}

      <Button type="button" variant="brand" size="sm" className="w-full" onClick={() => inputRef.current?.click()}>
        {previewUrl ? "이미지 수정하기" : "이미지 등록하기"}
      </Button>
      {error ? <p className="w-full text-left text-xs text-error-500">{error}</p> : null}
    </Card>
  );
}

function VideoHospitalPicker({
  selectedHospital,
  error,
  onSelectHospital,
  onClearHospital,
}: {
  selectedHospital: VideoHospitalOption | null;
  error?: string;
  onSelectHospital: (hospital: VideoHospitalOption) => void;
  onClearHospital: () => void;
}) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const [query, setQuery] = React.useState(selectedHospital?.name ?? "");
  const { options, isLoading, error: loadError } = useVideoHospitalOptions(isOpen, query);
  const visibleOptions = options.slice(0, 3);
  const selectedHospitalId = selectedHospital?.id;
  const selectedHospitalName = selectedHospital?.name;

  React.useEffect(() => {
    if (!selectedHospitalName) return;
    setQuery(selectedHospitalName);
  }, [selectedHospitalId, selectedHospitalName]);

  React.useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative" data-field-target="hospital_id" tabIndex={-1}>
      <Search className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-gray-400" />
      <InputField
        id="hospital_id"
        value={query}
        onClick={() => setIsOpen(true)}
        onChange={(event) => {
          const nextQuery = event.target.value;
          setQuery(nextQuery);
          if (selectedHospital && nextQuery !== selectedHospitalName) {
            onClearHospital();
          }
          setIsOpen(true);
        }}
        placeholder="병의원명 또는 사업자등록번호 검색"
        error={Boolean(error)}
        className="h-9 bg-white pr-3 pl-9"
      />

      {isOpen ? (
        <Card className="absolute top-full right-0 left-0 z-[90] mt-2 max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
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
              {visibleOptions.map((hospital) => {
                const businessNumber = hospital.business_number?.trim() || "-";

                return (
                  <button
                    key={hospital.id}
                    type="button"
                    className="w-full rounded-lg px-3 py-2 text-left hover:bg-brand-50"
                    onClick={() => {
                      onSelectHospital(hospital);
                      setQuery(hospital.name);
                      setIsOpen(false);
                    }}
                  >
                    <span className="block truncate text-sm font-semibold text-gray-800">{hospital.name}</span>
                    <span className="block truncate text-xs text-gray-500">
                      HID {hospital.id} · 사업자등록번호 {businessNumber}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </Card>
      ) : null}
    </div>
  );
}

function VideoCategorySelect({
  selectedIds,
  selectedItems,
  error,
  loadCategories,
  onToggleCategory,
}: {
  selectedIds: number[];
  selectedItems?: VideoCategoryItem[];
  error?: string;
  loadCategories: (params: CategorySelectorLoadParams) => Promise<CategorySelectorItem[]>;
  onToggleCategory: (categoryId: number, checked: boolean) => void;
}) {
  const [options, setOptions] = React.useState<Array<{ value: string; label: string }>>([]);
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    setIsLoading(true);
    loadCategories({ section: videoCategorySection, depth: 1, perPage: 100 })
      .then((items) => {
        if (!isMounted) return;
        setOptions(items.map((item) => ({ value: String(item.id), label: item.name })));
        setLoadError(null);
      })
      .catch(() => {
        if (!isMounted) return;
        setLoadError("카테고리를 불러오지 못했습니다.");
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [loadCategories]);

  useOutsideClose(containerRef, isOpen, () => setIsOpen(false));

  const selectedLabels = selectedIds.map((id) => {
    const option = options.find((item) => item.value === String(id));
    const fallback = selectedItems?.find((item) => item.id === id);
    return {
      id,
      label: option?.label ?? fallback?.name ?? String(id),
    };
  });

  return (
    <div ref={containerRef} className="relative space-y-2" data-field-target="category_ids" tabIndex={-1}>
      <ChipBox
        error={Boolean(error)}
        emptyText="선택된 카테고리가 없습니다."
        items={selectedLabels}
        onRemove={(id) => onToggleCategory(Number(id), false)}
      />
      <DropdownTrigger label="전체" onClick={() => setIsOpen((prev) => !prev)} />

      {isOpen ? (
        <OptionsPanel
          loading={isLoading}
          loadingText="카테고리 불러오는 중"
          loadError={loadError}
          emptyText="선택 가능한 카테고리가 없습니다."
        >
          {options.map((option) => {
            const categoryId = Number(option.value);
            const isSelected = selectedIds.includes(categoryId);

            return (
              <OptionButton
                key={option.value}
                label={option.label}
                selected={isSelected}
                onClick={() => {
                  if (!Number.isFinite(categoryId)) return;
                  onToggleCategory(categoryId, !isSelected);
                }}
              />
            );
          })}
        </OptionsPanel>
      ) : null}

      {error ? <p className="text-xs text-error-500">{error}</p> : null}
    </div>
  );
}

function VideoHashtagSelect({
  selectedIds,
  selectedNames,
  selectedItems,
  onToggleHashtag,
  onAddHashtagName,
  onRemoveHashtagName,
}: {
  selectedIds: number[];
  selectedNames: string[];
  selectedItems?: VideoHashtagItem[];
  onToggleHashtag: (hashtagId: number, checked: boolean) => void;
  onAddHashtagName: (name: string) => void;
  onRemoveHashtagName: (name: string) => void;
}) {
  const [options, setOptions] = React.useState<VideoHashtagOption[]>([]);
  const [query, setQuery] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [inputError, setInputError] = React.useState<string | null>(null);
  const [selectedNameCache, setSelectedNameCache] = React.useState<Record<number, string>>({});
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  useOutsideClose(containerRef, isOpen, () => setIsOpen(false));

  React.useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const response = await api.get<VideoHashtagOption[]>("/hashtags", {
          q: sanitizeHashtagName(query) || undefined,
          status: "ACTIVE",
          per_page: 20,
        });

        if (!isMounted) return;

        if (!isApiSuccess(response)) {
          setOptions([]);
          setLoadError(response.error.message || "해시태그를 불러오지 못했습니다.");
          return;
        }

        setOptions(response.data);
      } catch {
        if (!isMounted) return;
        setOptions([]);
        setLoadError("해시태그를 불러오는 중 오류가 발생했습니다.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }, 250);

    return () => {
      isMounted = false;
      window.clearTimeout(timer);
    };
  }, [isOpen, query]);

  React.useEffect(() => {
    setSelectedNameCache((prev) => {
      const next = { ...prev };

      selectedItems?.forEach((item) => {
        next[item.id] = item.name;
      });

      options.forEach((item) => {
        next[item.id] = item.name;
      });

      return next;
    });
  }, [options, selectedItems]);

  const sanitizedQuery = React.useMemo(() => sanitizeHashtagName(query), [query]);
  const normalizedQuery = React.useMemo(() => normalizeHashtagName(sanitizedQuery), [sanitizedQuery]);
  const exactOption = React.useMemo(() => {
    if (!normalizedQuery) return null;
    return options.find((option) => normalizeHashtagName(option.name) === normalizedQuery) ?? null;
  }, [normalizedQuery, options]);
  const selectedNormalizedNames = React.useMemo(() => {
    const names = [
      ...selectedIds
        .map((id) => selectedNameCache[id])
        .filter((name): name is string => typeof name === "string" && name.trim().length > 0),
      ...selectedNames,
    ];

    return new Set(names.map((name) => normalizeHashtagName(name)).filter(Boolean));
  }, [selectedIds, selectedNameCache, selectedNames]);
  const canAddHashtagName = Boolean(sanitizedQuery) && !exactOption;

  const handleAddHashtagName = React.useCallback(() => {
    const validationError = validateHashtagName(sanitizedQuery);
    if (validationError) {
      setInputError(validationError);
      return;
    }

    if (selectedNormalizedNames.has(normalizedQuery)) {
      setInputError("이미 선택된 해시태그입니다.");
      return;
    }

    onAddHashtagName(sanitizedQuery);
    setQuery("");
    setInputError(null);
    setIsOpen(false);
  }, [normalizedQuery, onAddHashtagName, sanitizedQuery, selectedNormalizedNames]);

  const handleToggleOption = React.useCallback(
    (option: VideoHashtagOption) => {
      const isSelected = selectedIds.includes(option.id);
      onToggleHashtag(option.id, !isSelected);

      if (!isSelected) {
        const normalizedName = normalizeHashtagName(option.name);
        selectedNames.filter((name) => normalizeHashtagName(name) === normalizedName).forEach(onRemoveHashtagName);
      }

      setQuery("");
      setInputError(null);
    },
    [onRemoveHashtagName, onToggleHashtag, selectedIds, selectedNames],
  );

  const selectedLabels = selectedIds.map((id): { id: string | number; label: string } => {
    const optionName = selectedNameCache[id];
    const fallback = selectedItems?.find((item) => item.id === id);
    const name = optionName ?? fallback?.name ?? "해시태그";

    return {
      id,
      label: `#${name}`,
    };
  });
  const selectedNameLabels = selectedNames.map((name): { id: string | number; label: string } => ({
    id: `name:${normalizeHashtagName(name)}`,
    label: `#${name}`,
  }));

  return (
    <div ref={containerRef} className="space-y-2" data-field-target="hashtag_ids" tabIndex={-1}>
      <ChipBox
        emptyText="선택된 해시태그가 없습니다."
        items={[...selectedLabels, ...selectedNameLabels]}
        onRemove={(id) => {
          if (typeof id === "number") {
            onToggleHashtag(id, false);
            return;
          }

          const normalizedName = id.replace(/^name:/, "");
          const targetName = selectedNames.find((name) => normalizeHashtagName(name) === normalizedName);
          if (targetName) {
            onRemoveHashtagName(targetName);
          }
        }}
      />
      <div className="relative">
        <InputField
          value={query}
          onClick={() => setIsOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setInputError(null);
            setIsOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();

            if (exactOption) {
              handleToggleOption(exactOption);
              return;
            }

            if (canAddHashtagName) {
              handleAddHashtagName();
            }
          }}
          placeholder="해시태그 검색 또는 입력"
          className="h-9 bg-white px-3 py-1.5"
        />

        {isOpen ? (
          <Card className="absolute top-full right-0 left-0 z-[80] mt-2 rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
            <div className="mt-1 max-h-64 overflow-y-auto">
              {isLoading ? (
                <SpinnerBlock className="min-h-20" spinnerClassName="size-5" label="해시태그 불러오는 중" />
              ) : loadError ? (
                <p className="px-3 py-4 text-sm text-error-500">{loadError}</p>
              ) : (
                <div className="space-y-1">
                  {options.map((option) => {
                    const isSelected = selectedIds.includes(option.id);

                    return (
                      <OptionButton
                        key={option.id}
                        label={`#${option.name}`}
                        selected={isSelected}
                        onClick={() => handleToggleOption(option)}
                      />
                    );
                  })}

                  {canAddHashtagName ? (
                    <button
                      type="button"
                      onClick={handleAddHashtagName}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-semibold text-brand-600 hover:bg-brand-50"
                    >
                      <span>#{sanitizedQuery} 추가</span>
                    </button>
                  ) : options.length === 0 ? (
                    <p className="px-3 py-4 text-sm text-gray-500">검색 결과가 없습니다.</p>
                  ) : null}
                </div>
              )}
            </div>
            {inputError ? <p className="mt-2 px-1 text-xs text-error-500">{inputError}</p> : null}
          </Card>
        ) : null}
      </div>
    </div>
  );
}

function EditField({
  label,
  required = false,
  error,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={["grid grid-cols-[7.25rem_minmax(0,1fr)] gap-x-3 gap-y-1", className].filter(Boolean).join(" ")}>
      <p className={labelClassName}>
        {label}
        {required ? <RequiredMark /> : null}
      </p>
      <div className="min-w-0">
        {children}
        {error ? <p className="mt-1 text-xs text-error-500">{error}</p> : null}
      </div>
    </div>
  );
}

function ChipBox({
  items,
  emptyText,
  error = false,
  onRemove,
}: {
  items: Array<{ id: number | string; label: string }>;
  emptyText: string;
  error?: boolean;
  onRemove: (id: number | string) => void;
}) {
  return (
    <div
      className={[
        "h-20 overflow-y-auto rounded-xl border bg-white p-2",
        error ? "border-error-500" : "border-gray-200",
      ].join(" ")}
    >
      {items.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onRemove(item.id)}
              className="inline-flex max-w-full items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-600"
            >
              <span className="truncate">{item.label}</span>
              <X className="size-3 shrink-0" />
            </button>
          ))}
        </div>
      ) : (
        <span className="px-1 py-2 text-sm text-gray-400">{emptyText}</span>
      )}
    </div>
  );
}

function DropdownTrigger({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onClick}
        className="flex h-9 w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700"
      >
        {label}
        <ChevronDown className="size-4 text-gray-500" />
      </button>
    </div>
  );
}

function OptionsPanel({
  loading,
  loadingText,
  loadError,
  emptyText,
  children,
}: {
  loading: boolean;
  loadingText: string;
  loadError: string | null;
  emptyText: string;
  children: React.ReactNode;
}) {
  const hasChildren = React.Children.count(children) > 0;

  return (
    <Card className="absolute top-full right-0 left-0 z-[80] mt-2 max-h-72 overflow-y-auto rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
      {loading ? (
        <div className="py-5">
          <SpinnerBlock className="min-h-0" spinnerClassName="size-5" label={loadingText} />
        </div>
      ) : loadError ? (
        <p className="px-3 py-4 text-sm text-error-500">{loadError}</p>
      ) : hasChildren ? (
        <div className="space-y-1">{children}</div>
      ) : (
        <p className="px-3 py-4 text-sm text-gray-500">{emptyText}</p>
      )}
    </Card>
  );
}

function OptionButton({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm",
        selected ? "bg-brand-50 font-semibold text-brand-700" : "text-gray-700 hover:bg-gray-50",
      ].join(" ")}
    >
      <span>{label}</span>
      {selected ? <span className="text-xs">선택됨</span> : null}
    </button>
  );
}

function useOutsideClose(containerRef: React.RefObject<HTMLDivElement | null>, isOpen: boolean, onClose: () => void) {
  React.useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [containerRef, isOpen, onClose]);
}

function RequiredMark() {
  return <span className="text-error-500">*</span>;
}
