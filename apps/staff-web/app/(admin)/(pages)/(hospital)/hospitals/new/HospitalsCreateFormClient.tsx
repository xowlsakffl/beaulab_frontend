"use client";

import { api } from "@/lib/api";
import { isApiSuccess } from "@beaulab/types";
import {
  Button,
  FormCheckbox,
  FormTextArea,
  InputField
} from "@beaulab/ui-admin";
import { useRouter } from "next/navigation";
import React from "react";

type HospitalCreateForm = {
  name: string;
  tel: string;
  email: string;
  address: string;
  address_detail: string;
  latitude: string;
  longitude: string;
  description: string;
  consulting_hours: string;
  direction: string;
  activate_now: boolean;
};

type FieldName = keyof HospitalCreateForm | "logo" | "gallery";

const INITIAL_FORM: HospitalCreateForm = {
  name: "",
  tel: "",
  email: "",
  address: "",
  address_detail: "",
  latitude: "",
  longitude: "",
  description: "",
  consulting_hours: "",
  direction: "",
  activate_now: false,
};

export default function HospitalsCreateFormClient() {
  const router = useRouter();

  const [form, setForm] = React.useState<HospitalCreateForm>(INITIAL_FORM);
  const [logo, setLogo] = React.useState<File | null>(null);
  const [gallery, setGallery] = React.useState<File[]>([]);
  const [errors, setErrors] = React.useState<Partial<Record<FieldName, string>>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const setField = <K extends keyof HospitalCreateForm>(key: K, value: HospitalCreateForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleAddressSearch = () => {
    const address = window.prompt("주소를 입력해주세요.");
    if (!address) return;

    setField("address", address.trim());
    setField("latitude", "");
    setField("longitude", "");
  };

  const validate = () => {
    const nextErrors: Partial<Record<FieldName, string>> = {};

    if (!form.name.trim()) {
      nextErrors.name = "병원명은 필수입니다.";
    }

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = "올바른 이메일 형식이 아닙니다.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validate()) return;

    const formData = new FormData();
    formData.append("name", form.name.trim());
    formData.append("description", form.description);
    formData.append("consulting_hours", form.consulting_hours);
    formData.append("direction", form.direction);
    formData.append("address", form.address);
    formData.append("address_detail", form.address_detail);
    formData.append("latitude", form.latitude);
    formData.append("longitude", form.longitude);
    formData.append("tel", form.tel);
    formData.append("email", form.email);
    formData.append("activate_now", String(form.activate_now));

    if (logo) {
      formData.append("logo", logo);
    }

    gallery.forEach((file) => formData.append("gallery[]", file));

    setIsSubmitting(true);

    try {
      const response = await api.post<{ id: number }>("/hospitals", formData);

      if (!isApiSuccess(response)) {
        window.alert(response.error.message || "병원 등록에 실패했습니다.");
        return;
      }

      window.alert("병원이 등록되었습니다.");
      router.push("/hospitals");
      router.refresh();
    } catch {
      window.alert("병원 등록 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="space-y-6 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">병원 정보 입력</h2>

        <div className="space-y-2">
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">병원명 *</label>
          <InputField
            id="name"
            name="name"
            placeholder="병원명을 입력하세요."
            defaultValue={form.name}
            onChange={(e) => setField("name", e.target.value)}
            error={Boolean(errors.name)}
            hint={errors.name}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="tel" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">대표 번호</label>
            <InputField
              id="tel"
              name="tel"
              placeholder="예) 02-1234-5678"
              defaultValue={form.tel}
              onChange={(e) => setField("tel", e.target.value)}
              error={Boolean(errors.tel)}
              hint={errors.tel}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">대표 이메일</label>
            <InputField
              id="email"
              name="email"
              type="email"
              placeholder="예) hello@beaulab.co"
              defaultValue={form.email}
              onChange={(e) => setField("email", e.target.value)}
              error={Boolean(errors.email)}
              hint={errors.email}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="address" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">주소</label>
          <div className="flex gap-2">
            <InputField
              key={`address-${form.address}`}
              id="address"
              name="address"
              placeholder="주소 검색 버튼을 눌러 선택하세요."
              defaultValue={form.address}
              disabled
              error={Boolean(errors.address)}
              hint={errors.address}
              className="flex-1"
            />
            <Button type="button" variant="brand" onClick={handleAddressSearch}>
              주소 검색
            </Button>
          </div>
          <InputField
            id="address_detail"
            name="address_detail"
            placeholder="상세 주소"
            defaultValue={form.address_detail}
            onChange={(e) => setField("address_detail", e.target.value)}
            error={Boolean(errors.address_detail)}
            hint={errors.address_detail}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">병원 소개</label>
          <FormTextArea
            placeholder="간단 소개를 입력하세요."
            rows={4}
            value={form.description}
            onChange={(value) => setField("description", value)}
            error={Boolean(errors.description)}
            hint={errors.description}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="consulting_hours" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">운영 시간</label>
          <FormTextArea
            placeholder="예) 평일 10:00~19:00 / 토 10:00~15:00"
            rows={3}
            value={form.consulting_hours}
            onChange={(value) => setField("consulting_hours", value)}
            error={Boolean(errors.consulting_hours)}
            hint={errors.consulting_hours}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="direction" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">오시는 길</label>
          <FormTextArea
            placeholder="예) 2호선 홍대입구역 3번 출구 도보 5분"
            rows={3}
            value={form.direction}
            onChange={(value) => setField("direction", value)}
            error={Boolean(errors.direction)}
            hint={errors.direction}
          />
        </div>

        <FormCheckbox
          id="activate_now"
          checked={form.activate_now}
          onChange={(checked) => setField("activate_now", checked)}
          label="등록 후 바로 활성화"
        />

        <Button type="submit" variant="brand" size="auth" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "등록 중..." : "병원 등록"}
        </Button>
      </section>

      <aside className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">이미지 업로드</h3>

        <div className="space-y-2">
          <label htmlFor="logo" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">로고 (1장)</label>
          <input
            id="logo"
            name="logo"
            type="file"
            accept="image/*"
            onChange={(e) => setLogo(e.target.files?.[0] ?? null)}
            className="block w-full rounded-lg border border-gray-300 p-2 text-sm dark:border-gray-700"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="gallery" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">대표/내부 이미지 (최대 12장)</label>
          <input
            id="gallery"
            name="gallery"
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []).slice(0, 12);
              setGallery(files);
            }}
            className="block w-full rounded-lg border border-gray-300 p-2 text-sm dark:border-gray-700"
          />
          <p className="text-xs text-gray-500">선택된 파일 {gallery.length}개</p>
        </div>
      </aside>
    </form>
  );
}
