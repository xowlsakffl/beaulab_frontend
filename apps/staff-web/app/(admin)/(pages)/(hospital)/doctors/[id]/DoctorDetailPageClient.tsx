"use client";

import React from "react";

import { Can } from "@/components/common/guard";
import {
  HospitalMediaPreviewModal,
  type HospitalMediaPreviewState,
} from "@/components/hospital/media/HospitalMediaPreviewModal";
import { api } from "@/lib/common/api";
import { buildReturnToPath } from "@/lib/common/navigation/buildReturnToPath";
import { usePageHeaderExtra } from "@/lib/common/routing/page-header-extra";
import {
  resolveDoctorMediaUrl,
  type DoctorDetailResponse,
  type DoctorMediaAsset,
} from "@/lib/doctor/detail";
import {
  formatCareerPeriod,
  labelDoctorGender,
  labelDoctorSpecialistField,
} from "@/lib/doctor/list";
import { isApiSuccess } from "@beaulab/types";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  SpinnerBlock,
} from "@beaulab/ui-admin";
import { useParams, useRouter, useSearchParams } from "next/navigation";

const infoCardClassName = "rounded-xl border border-gray-200 bg-white p-5";
const labelClassName = "text-xs font-bold text-gray-800";
const valueClassName = "min-w-0 break-words text-sm leading-6 text-gray-800";

export default function DoctorDetailPageClient() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawDoctorId = Array.isArray(params.id) ? params.id[0] : params.id;
  const doctorId = Number(rawDoctorId);

  const [detail, setDetail] = React.useState<DoctorDetailResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [previewMedia, setPreviewMedia] = React.useState<HospitalMediaPreviewState | null>(null);

  const getReturnToPath = React.useCallback(
    (highlightId?: number) =>
      buildReturnToPath({
        searchParams,
        fallbackPath: "/doctors",
        allowedPrefix: "/doctors",
        highlightId,
      }),
    [searchParams],
  );

  const editPath = React.useMemo(() => {
    const rawReturnTo = searchParams.get("returnTo");
    if (!Number.isFinite(doctorId) || doctorId <= 0) {
      return "/doctors";
    }

    return rawReturnTo
      ? `/doctors/${doctorId}/edit?returnTo=${encodeURIComponent(rawReturnTo)}`
      : `/doctors/${doctorId}/edit`;
  }, [doctorId, searchParams]);

  const headerAction = React.useMemo(() => {
    if (!Number.isFinite(doctorId) || doctorId <= 0) return null;

    return (
      <Can permission="beaulab.doctor.update">
        <Button type="button" variant="brand" size="sm" onClick={() => router.push(editPath)}>
          수정하기
        </Button>
      </Can>
    );
  }, [doctorId, editPath, router]);

  const fetchDoctor = React.useCallback(async () => {
    if (!Number.isFinite(doctorId) || doctorId <= 0) {
      setLoadError("잘못된 의료진 경로입니다.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      const response = await api.get<DoctorDetailResponse>(`/doctors/${doctorId}`);

      if (!isApiSuccess(response)) {
        setLoadError(response.error.message || "의료진 정보를 불러오지 못했습니다.");
        return;
      }

      setDetail(response.data);
    } catch {
      setLoadError("의료진 정보를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [doctorId]);

  React.useEffect(() => {
    void fetchDoctor();
  }, [fetchDoctor]);

  usePageHeaderExtra(headerAction);

  if (isLoading) {
    return <SpinnerBlock className="min-h-[60vh]" spinnerClassName="size-10" />;
  }

  if (loadError || !detail) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>의료진 정보를 불러오지 못했습니다.</CardTitle>
          <CardDescription>{loadError ?? "의료진 정보를 찾을 수 없습니다."}</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2 pt-0">
          <Button type="button" variant="brand" onClick={() => void fetchDoctor()}>
            다시 불러오기
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push(getReturnToPath())}>
            목록으로
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="min-w-0 space-y-4">
      <section className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[18rem_minmax(0,1fr)]">
        <ProfilePhotoCard
          media={detail.profile_image ?? null}
          doctorName={detail.name}
          onPreview={setPreviewMedia}
        />
        <DoctorBasicInfoCard detail={detail} onPreview={setPreviewMedia} />

        <InfoPanel title="진료분야">
          <BadgeBlock items={categoryLabels(detail.categories)} />
        </InfoPanel>
        <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-3">
          <InfoPanel title="경력사항">
            <ListBlock items={detail.careers ?? []} />
          </InfoPanel>
          <InfoPanel title="활동사항">
            <ListBlock items={detail.etc_contents ?? []} />
          </InfoPanel>
          <InfoPanel title="학력사항">
            <ListBlock items={detail.educations ?? []} />
          </InfoPanel>
        </div>
      </section>

      <HospitalMediaPreviewModal preview={previewMedia} onChange={setPreviewMedia} onClose={() => setPreviewMedia(null)} />
    </div>
  );
}

function ProfilePhotoCard({
  media,
  doctorName,
  onPreview,
}: {
  media: DoctorMediaAsset | null;
  doctorName: string;
  onPreview: (preview: HospitalMediaPreviewState) => void;
}) {
  const mediaUrl = resolveDoctorMediaUrl(media);
  const isImage = isImageDoctorMedia(media);

  return (
    <Card className="flex min-h-[18rem] items-center justify-center rounded-xl border border-gray-200 bg-white p-3 xl:h-[18rem]">
      {mediaUrl ? (
        <button
          type="button"
          onClick={() =>
            onPreview({
              url: mediaUrl,
              title: `${doctorName} 프로필`,
              isImage,
            })
          }
          className="flex h-full w-full items-center justify-center overflow-hidden rounded-lg bg-white"
        >
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element -- runtime storage URL
            <img src={mediaUrl} alt={`${doctorName} 프로필`} className="h-full w-full object-cover" />
          ) : (
            <span className="text-sm font-medium text-gray-500">프로필 파일</span>
          )}
        </button>
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-lg bg-white text-sm font-medium text-gray-400">
          프로필 사진
        </div>
      )}
    </Card>
  );
}

function DoctorBasicInfoCard({
  detail,
  onPreview,
}: {
  detail: DoctorDetailResponse;
  onPreview: (preview: HospitalMediaPreviewState) => void;
}) {
  return (
    <Card className={`${infoCardClassName} min-h-[18rem]`}>
      <div className="grid h-full min-w-0 gap-x-16 gap-y-6 md:grid-cols-2">
        <div className="space-y-6">
          <InfoRow label="병의원" value={detail.hospital_name} />
          <InfoRow label="의료진" value={detail.name} />
          <InfoRow label="직책" value={detail.position} />
          <InfoRow label="성별" value={labelDoctorGender(detail.gender)} />
        </div>

        <div className="space-y-6">
          <InfoRow label="경력기간" value={formatCareerPeriod(detail.career_started_at)} />
          <InfoRow
            label="의사면허 번호"
            value={detail.license_number}
            action={<PreviewButton title="의사면허증 이미지" media={detail.license_image ?? null} onPreview={onPreview} />}
          />
          <InfoRow
            label="전문의"
            value={labelDoctorSpecialistField(detail.specialist?.code, detail.specialist?.label)}
            action={<PreviewButton title="전문의 증명서 이미지" media={detail.specialist_certificate_image ?? null} onPreview={onPreview} />}
          />
        </div>
      </div>
    </Card>
  );
}

function InfoRow({
  label,
  value,
  action,
}: {
  label: string;
  value?: string | number | null;
  action?: React.ReactNode;
}) {
  const displayValue = typeof value === "number" ? String(value) : value?.trim() || "-";

  return (
    <div className="grid min-w-0 grid-cols-[8.5rem_minmax(0,1fr)] items-start gap-5">
      <p className={labelClassName}>{label}</p>
      <div className="flex min-w-0 items-center gap-2">
        <p className={`${valueClassName} min-w-0 flex-1`}>{displayValue}</p>
        {action}
      </div>
    </div>
  );
}

function PreviewButton({
  title,
  media,
  onPreview,
}: {
  title: string;
  media: DoctorMediaAsset | null;
  onPreview: (preview: HospitalMediaPreviewState) => void;
}) {
  const mediaUrl = resolveDoctorMediaUrl(media);
  if (!mediaUrl) return null;

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() =>
        onPreview({
          url: mediaUrl,
          title,
          isImage: isImageDoctorMedia(media),
        })
      }
      className="h-7 shrink-0 px-2 text-xs"
    >
      미리보기
    </Button>
  );
}

function InfoPanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={`${infoCardClassName} min-h-[12rem]`}>
      <h3 className="mb-5 text-sm font-bold text-gray-900">{title}</h3>
      {children}
    </Card>
  );
}

function ListBlock({ items }: { items: string[] }) {
  const normalizedItems = items.map((item) => item.trim()).filter(Boolean);

  if (normalizedItems.length === 0) {
    return <p className={valueClassName}>-</p>;
  }

  return (
    <div className="space-y-2">
      {normalizedItems.map((item, index) => (
        <p key={`${item}-${index}`} className={valueClassName}>
          {item}
        </p>
      ))}
    </div>
  );
}

function BadgeBlock({ items }: { items: string[] }) {
  const normalizedItems = items.map((item) => item.trim()).filter(Boolean);

  if (normalizedItems.length === 0) {
    return <p className={valueClassName}>-</p>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {normalizedItems.map((item) => (
        <span
          key={item}
          className="inline-flex max-w-full items-center rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-600"
        >
          <span className="line-clamp-1 break-all">{item}</span>
        </span>
      ))}
    </div>
  );
}

function categoryLabels(categories?: Array<{ name?: string | null; full_path?: string | null }> | null) {
  if (!categories || categories.length === 0) return [];

  return categories
    .map((category) => formatCategoryPath(category.full_path, category.name))
    .filter((item): item is string => Boolean(item && item !== "-"));
}

function formatCategoryPath(fullPath?: string | null, fallbackName?: string | null) {
  const raw = fullPath?.trim() || fallbackName?.trim() || "-";
  return raw.replace(/\s*>\s*/g, " > ");
}

function isImageDoctorMedia(media?: DoctorMediaAsset | null) {
  const mimeType = media?.mime_type?.trim().toLowerCase();
  if (mimeType) return mimeType.startsWith("image/");

  const mediaUrl = resolveDoctorMediaUrl(media);
  if (!mediaUrl) return false;

  return /\.(avif|gif|jpe?g|png|svg|webp)$/i.test(mediaUrl.split("?")[0] ?? "");
}
