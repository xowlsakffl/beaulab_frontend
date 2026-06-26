"use client";

import React from "react";
import { Button, Modal } from "@beaulab/ui-admin";

import { useObjectUrl } from "@/hooks/common/useObjectUrl";
import {
  calculateHospitalEventDiscountRate,
  parseNumberInput,
  type HospitalEventFormValues,
} from "@/lib/hospital-event/form";
import {
  resolveHospitalEventMediaUrl,
  type HospitalEventMedia,
} from "@/lib/hospital-event/list";

export function HospitalEventAppPreviewModal({
  isOpen,
  onClose,
  form,
  thumbnailImage,
  eventPageImage,
  existingThumbnailImage,
  existingEventPageImage,
  discountRate,
}: {
  isOpen: boolean;
  onClose: () => void;
  form: HospitalEventFormValues;
  thumbnailImage: File | null;
  eventPageImage: File | null;
  existingThumbnailImage: HospitalEventMedia | null;
  existingEventPageImage: HospitalEventMedia | null;
  discountRate: number;
}) {
  const thumbnailObjectUrl = useObjectUrl(thumbnailImage);
  const eventPageObjectUrl = useObjectUrl(eventPageImage);
  const thumbnailUrl = thumbnailObjectUrl ?? resolveHospitalEventMediaUrl(existingThumbnailImage, "original");
  const eventPageUrl = eventPageObjectUrl ?? resolveHospitalEventMediaUrl(existingEventPageImage, "original");
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
          <Button type="button" variant="outline" size="auth" className="rounded-xl font-bold text-gray-700">
            병원
          </Button>
          <Button type="button" variant="brand" size="auth" className="rounded-xl font-bold">
            상담 신청
          </Button>
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
