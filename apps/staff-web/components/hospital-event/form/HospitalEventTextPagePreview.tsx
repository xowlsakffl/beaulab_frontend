"use client";

import React from "react";
import { BadgeCheck, Car, Check, RefreshCw, UserRound, Button, Card } from "@beaulab/ui-admin";
import type { MediaPreviewState } from "@/components/common/MediaPreviewModal";
import type { HospitalEventPreviewContextState } from "@/hooks/hospital-event/useHospitalEventPreviewContext";
import { resolveDoctorMediaUrl } from "@/lib/doctor/detail";
import type { HospitalFeatureItem } from "@/lib/hospital/detail";
import { hasBeforeAfterPhoto, type HospitalEventBeforeAfterPhoto } from "@/lib/hospital-event/before-after-photos";
import type { HospitalEventFormValues } from "@/lib/hospital-event/form";
import type { HospitalEventPreviewFocus, HospitalEventPreviewSection } from "@/lib/hospital-event/preview";
import { HospitalEventBeforeAfterPhotoPair } from "./HospitalEventBeforeAfterPhotos";

const featureImages: Record<string, string> = {
  CCTV: "/images/hospital/features/ic_hospital_service_12.png",
  REAL_NAME_SYSTEM: "/images/hospital/features/ic_hospital_service_5.svg",
  DEDICATED_RECOVERY_ROOM: "/images/hospital/features/ic_hospital_service_10.svg",
  NIGHT_COUNSELING: "/images/hospital/features/ic_hospital_service_6.svg",
  ANESTHESIOLOGIST: "/images/hospital/features/ic_hospital_service_2.svg",
  FEMALE_DOCTOR_CARE: "/images/hospital/features/ic_hospital_service_7.svg",
  EMERGENCY_SYSTEM: "/images/hospital/features/ic_hospital_service_8.svg",
  INPATIENT_ROOM: "/images/hospital/features/ic_hospital_service_9.svg",
  AFTERCARE: "/images/hospital/features/ic_hospital_service_4.svg",
};

type TextPageProps = {
  form: HospitalEventFormValues;
  photos: HospitalEventBeforeAfterPhoto[];
  context: HospitalEventPreviewContextState;
  focus?: HospitalEventPreviewFocus;
  onPreview?: (preview: MediaPreviewState) => void;
  className?: string;
};

export function HospitalEventTextPagePreview(props: TextPageProps) {
  return (
    <Card className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="mb-4 text-sm font-bold text-gray-900">이벤트 페이지</h3>
      <HospitalEventTextPage {...props} />
    </Card>
  );
}

export function HospitalEventTextPage({
  form,
  photos,
  context,
  focus = null,
  onPreview,
  className = "",
}: TextPageProps) {
  const selectedDoctors = form.doctor_assignments.filter((doctor) => doctor.hospital_doctor_id);
  const displayPhotos = photos.filter(hasBeforeAfterPhoto);

  const regionProps = (section: HospitalEventPreviewSection) => ({
    "data-preview-region": section,
    "data-preview-active": focus?.section === section || undefined,
    className: `relative isolate min-w-0 space-y-4 ${focus?.section === section ? "after:pointer-events-none after:absolute after:inset-0 after:z-10 after:border-2 after:border-brand-500 after:content-['']" : ""}`,
  });

  return (
    <div
      aria-label="이벤트 페이지 미리보기"
      className={`space-y-8 bg-white [overflow-wrap:anywhere] text-gray-900 ${className}`}
    >
      <section {...regionProps("procedure_targets")}>
        <SectionTitle>시술 대상</SectionTitle>
        <PreviewTextList items={form.procedure_targets} />
      </section>
      <section className="min-w-0 space-y-4">
        <SectionTitle>병원 장점</SectionTitle>
        {context.isLoading ? (
          <EmptyText>불러오는 중...</EmptyText>
        ) : context.error ? (
          <div className="flex items-start gap-2 text-xs text-error-500" role="status">
            <span className="min-w-0 flex-1">{context.error}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-6 shrink-0"
              title="병원 정보 다시 불러오기"
              aria-label="병원 정보 다시 불러오기"
              onClick={context.retry}
            >
              <RefreshCw className="size-3.5" />
            </Button>
          </div>
        ) : context.data?.features.length ? (
          <HospitalFeatures features={context.data.features} />
        ) : (
          <EmptyText>{form.hospital_id ? "등록된 병원 장점이 없습니다." : "병의원 미선택"}</EmptyText>
        )}
      </section>
      <section {...regionProps("procedure_benefits")}>
        <SectionTitle>시술 장점</SectionTitle>
        <PreviewTextList items={form.procedure_benefits} numbered />
      </section>
      <section {...regionProps("before_after_photos")}>
        <SectionTitle>전후사진</SectionTitle>
        {displayPhotos.length ? (
          <div className="grid grid-cols-1 gap-3">
            {displayPhotos.map((photo, index) => (
              <HospitalEventBeforeAfterPhotoPair key={photo.key} photo={photo} index={index} onPreview={onPreview} />
            ))}
          </div>
        ) : (
          <EmptyText>등록된 전후사진이 없습니다.</EmptyText>
        )}
      </section>
      <section {...regionProps("doctor_assignments")}>
        <SectionTitle>의료진</SectionTitle>
        {selectedDoctors.length ? (
          <div className="space-y-5">
            {selectedDoctors.map((assignment) => {
              const doctor = context.data?.doctors.find((item) => item.id === assignment.hospital_doctor_id);
              const photoUrl = resolveDoctorMediaUrl(doctor?.profile_image);
              return (
                <article
                  key={assignment.hospital_doctor_id}
                  className="grid grid-cols-[7rem_minmax(0,1fr)] items-start gap-3"
                >
                  {photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- API/local media URL
                    <img
                      src={photoUrl}
                      alt={assignment.name}
                      className="aspect-[3/4] w-full rounded-md bg-gray-50 object-cover"
                    />
                  ) : (
                    <div className="flex aspect-[3/4] items-center justify-center rounded-md bg-gray-50">
                      <UserRound className="size-6 text-gray-300" />
                    </div>
                  )}
                  <div className="min-w-0 space-y-2">
                    <p className="text-xs font-semibold">
                      {doctor?.name ?? assignment.name}
                      <span className="ml-1 font-normal text-gray-500">{doctor?.position}</span>
                    </p>
                    {context.isLoading ? (
                      <EmptyText>불러오는 중...</EmptyText>
                    ) : context.error ? (
                      <EmptyText>의료진 정보를 불러오지 못했습니다.</EmptyText>
                    ) : (
                      <>
                        {assignment.is_career_visible ? (
                          <DoctorList
                            title="경력사항"
                            items={[...(doctor?.educations ?? []), ...(doctor?.careers ?? [])]}
                          />
                        ) : null}
                        {assignment.is_activity_visible ? (
                          <DoctorList title="활동사항" items={doctor?.etc_contents ?? []} />
                        ) : null}
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyText>선택된 의료진이 없습니다.</EmptyText>
        )}
      </section>
      <section {...regionProps("side_effect_notice")}>
        <SectionTitle>부작용 안내</SectionTitle>
        {form.side_effect_notice.trim() ? (
          <p className="text-xs leading-5 whitespace-pre-wrap text-gray-600">{form.side_effect_notice}</p>
        ) : (
          <EmptyText>등록된 안내가 없습니다.</EmptyText>
        )}
      </section>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h4 className="border-b border-gray-100 pb-2 text-sm font-bold text-gray-900">{children}</h4>;
}

function EmptyText({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] leading-5 text-gray-400">{children}</p>;
}

function PreviewTextList({ items, numbered = false }: { items: string[]; numbered?: boolean }) {
  const visible = items.length ? items.filter((item, index) => index === 0 || item.trim()) : [""];
  return (
    <ul className="space-y-2.5">
      {visible.map((item, index) => (
        <li key={index} className="flex min-h-5 items-start gap-2 text-xs leading-5 text-gray-600">
          {numbered ? (
            <span className="w-5 shrink-0 text-sm leading-5 font-medium text-gray-600 tabular-nums">
              {String(index + 1).padStart(2, "0")}
            </span>
          ) : (
            <Check className="mt-0.5 size-3.5 shrink-0 text-gray-800" />
          )}
          <span className="min-w-0 whitespace-pre-wrap">{item}</span>
        </li>
      ))}
    </ul>
  );
}

function HospitalFeatures({ features }: { features: HospitalFeatureItem[] }) {
  const dragRef = React.useRef<{ pointerId: number; startX: number; scrollLeft: number } | null>(null);
  const endDrag = (event: React.PointerEvent<HTMLUListElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <div className="min-w-0 bg-gray-50">
      <ul
        aria-label="병원 장점 목록"
        tabIndex={0}
        className={`no-scrollbar grid min-w-0 cursor-grab grid-flow-col overflow-x-auto overscroll-x-contain py-4 select-none active:cursor-grabbing ${features.length > 5 ? "auto-cols-[calc((100%-1.5rem)/5)]" : "auto-cols-[20%]"}`}
        onPointerDown={(event) => {
          const list = event.currentTarget;
          if (event.pointerType !== "mouse" || event.button !== 0 || list.scrollWidth <= list.clientWidth) return;
          event.preventDefault();
          dragRef.current = { pointerId: event.pointerId, startX: event.clientX, scrollLeft: list.scrollLeft };
          list.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          const drag = dragRef.current;
          if (drag?.pointerId !== event.pointerId) return;
          event.currentTarget.scrollLeft = drag.scrollLeft + drag.startX - event.clientX;
        }}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onLostPointerCapture={() => {
          dragRef.current = null;
        }}
      >
        {features.map((feature) => {
          const image = featureImages[feature.code];
          const FallbackIcon = feature.code === "PARKING" ? Car : BadgeCheck;
          return (
            <li key={feature.id} className="flex min-w-0 flex-col items-center gap-2 px-0.5 text-center">
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element -- Original hospital feature assets shared with the native app.
                <img
                  src={image}
                  alt=""
                  draggable={false}
                  width={28}
                  height={28}
                  className="size-7 shrink-0 object-contain"
                />
              ) : (
                <FallbackIcon className="size-7 shrink-0 text-gray-600" strokeWidth={1.5} aria-hidden="true" />
              )}
              <span className="min-h-8 text-[10px] leading-4 font-semibold text-gray-900">{feature.name}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function DoctorList({ title, items }: { title: string; items: string[] }) {
  const visible = items.filter((item) => item.trim());
  if (!visible.length) return null;
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-semibold">{title}</p>
      <ul className="list-inside list-disc space-y-1 text-[10px] leading-4 text-gray-500">
        {visible.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
