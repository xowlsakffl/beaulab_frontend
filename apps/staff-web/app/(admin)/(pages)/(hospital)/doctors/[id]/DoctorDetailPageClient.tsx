"use client";

import React from "react";

import { Can } from "@/components/common/guard";
import {
  DetailCompactMediaCard,
  DetailEmptyState,
  DetailImageMediaCard,
} from "@/components/common/DetailMediaCard";
import { api } from "@/lib/common/api";
import { buildReturnToPath } from "@/lib/common/navigation/buildReturnToPath";
import {
  getDoctorMediaFilename,
  resolveDoctorMediaUrl,
  type DoctorDetailResponse,
  type DoctorMediaAsset,
} from "@/lib/doctor/form";
import {
  formatCareerPeriod,
  labelDoctorApprovalStatus,
  labelDoctorGender,
  labelDoctorOperatingStatus,
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
  StatusBadge,
} from "@beaulab/ui-admin";
import { useParams, useRouter, useSearchParams } from "next/navigation";

const detailItemClass = "grid grid-cols-[7rem_minmax(0,1fr)] items-start gap-4";
const detailLabelClass = "whitespace-nowrap pt-1 text-left text-xs font-medium text-gray-500 dark:text-gray-400";
const detailValueClass = "min-w-0 break-words text-sm leading-6 text-gray-800 dark:text-gray-100";

export default function DoctorDetailPageClient() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawDoctorId = Array.isArray(params.id) ? params.id[0] : params.id;
  const doctorId = Number(rawDoctorId);

  const [detail, setDetail] = React.useState<DoctorDetailResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);

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
    <div className="grid gap-6 lg:items-start lg:grid-cols-[minmax(0,1.38fr)_minmax(240px,0.62fr)]">
      <Card as="section" className="min-w-0">
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle>{detail.name} 상세 정보</CardTitle>
            </div>

            <div className="flex w-full flex-row gap-2 sm:w-auto">
              <Button type="button" variant="outline" className="flex-1 sm:flex-none" onClick={() => router.push(getReturnToPath())}>
                목록으로
              </Button>
              <Can permission="beaulab.doctor.update">
                <Button type="button" variant="brand" className="flex-1 sm:flex-none" onClick={() => router.push(editPath)}>
                  수정하기
                </Button>
              </Can>
            </div>
          </div>
        </CardHeader>

        <div className="space-y-10 divide-y divide-gray-200 dark:divide-gray-800">
          <section className="space-y-6 pb-6">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">기본 정보</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">소속 병의원과 의료진 기본 정보를 확인합니다.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <DetailField label="소속 병의원" value={detail.hospital_name} />
              <DetailField label="사업자등록번호" value={detail.hospital_business_number} />
              <DetailField label="의료진명" value={detail.name} />
              <DetailField label="성별" value={labelDoctorGender(detail.gender)} />
              <DetailField label="직책" value={detail.position} />
              <DetailField label="전문의 여부" value={detail.is_specialist ? "예" : "아니오"} />
              <DetailField label="경력 시작일" value={detail.career_started_at} />
              <DetailField label="경력기간" value={formatCareerPeriod(detail.career_started_at)} />
              <DetailField label="의사면허증 번호" value={detail.license_number} />
              <DetailField label="조회수" value={formatNumber(detail.view_count)} />
              <StatusField label="운영 상태" value={detail.status} kind="status" />
              <StatusField label="검수 상태" value={detail.allow_status} kind="allow_status" />
              <TagField
                label="카테고리"
                items={detail.categories?.map((item) => formatCategoryPath(item.full_path, item.name)) ?? []}
                className="md:col-span-2"
              />
              <DetailField label="등록일" value={formatIsoDate(detail.created_at)} />
              <DetailField label="수정일" value={formatIsoDate(detail.updated_at)} />
            </div>
          </section>

          <section className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">이력 정보</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">학력, 경력, 활동 정보를 확인합니다.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <ListField label="학력 사항" items={detail.educations ?? []} className="md:col-span-2" />
              <ListField label="경력 사항" items={detail.careers ?? []} className="md:col-span-2" />
              <ListField label="활동 사항" items={detail.etc_contents ?? []} className="md:col-span-2" />
            </div>
          </section>
        </div>
      </Card>

      <Card as="aside" className="min-w-0">
        <CardHeader className="pb-6">
          <CardTitle>파일 업로드</CardTitle>
          <CardDescription>프로필 이미지와 각종 증빙 파일을 확인합니다.</CardDescription>
        </CardHeader>

        <div className="space-y-6">
          <ProfileMediaSection
            label="프로필 사진"
            media={detail.profile_image ?? null}
            emptyText="업로드한 프로필 이미지가 없습니다."
          />
          <DocumentSection
            label="의사면허증 이미지"
            items={detail.license_image ? [detail.license_image] : []}
            emptyText="업로드한 의사면허증 파일이 없습니다."
          />
          <DocumentSection
            label="전문의 증명서 이미지"
            items={detail.specialist_certificate_image ? [detail.specialist_certificate_image] : []}
            emptyText="업로드한 전문의 증명서 파일이 없습니다."
          />
          <DocumentSection
            label="졸업/학력 증명서 이미지"
            items={detail.education_certificate_image ?? []}
            emptyText="업로드한 학력 증명서 파일이 없습니다."
          />
          <DocumentSection
            label="활동/기타 증명서"
            items={detail.etc_certificate_image ?? []}
            emptyText="업로드한 활동/기타 증명서 파일이 없습니다."
          />
        </div>
      </Card>
    </div>
  );
}

function DetailField({
  label,
  value,
  className,
}: {
  label: string;
  value?: string | number | null;
  className?: string;
}) {
  const displayValue = typeof value === "number" ? String(value) : value?.trim() || "-";

  return (
    <div className={[detailItemClass, className].filter(Boolean).join(" ")}>
      <p className={detailLabelClass}>{label}</p>
      <div className={detailValueClass}>{displayValue}</div>
    </div>
  );
}

function StatusField({
  label,
  value,
  kind,
}: {
  label: string;
  value?: string | null;
  kind: "status" | "allow_status";
}) {
  const labelText = kind === "status" ? labelDoctorOperatingStatus(value) : labelDoctorApprovalStatus(value);
  const color =
    value === "ACTIVE" || value === "APPROVED"
      ? "success"
      : value === "SUSPENDED" || value === "PENDING"
        ? "warning"
        : "error";

  return (
    <div className={detailItemClass}>
      <p className={detailLabelClass}>{label}</p>
      <div className="flex min-h-[28px] min-w-0 items-center">
        <StatusBadge size="sm" color={color}>
          {labelText || "-"}
        </StatusBadge>
      </div>
    </div>
  );
}

function TagField({
  label,
  items,
  className,
}: {
  label: string;
  items: string[];
  className?: string;
}) {
  return (
    <div className={[detailItemClass, className].filter(Boolean).join(" ")}>
      <p className={detailLabelClass}>{label}</p>
      <div className="flex min-h-[28px] min-w-0 flex-wrap items-center gap-2">
        {items.length > 0 ? (
          items.map((item) => (
            <span
              key={item}
              className="inline-flex max-w-full items-center rounded-full bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 break-all dark:bg-brand-500/10 dark:text-brand-300"
            >
              {item}
            </span>
          ))
        ) : (
          <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
        )}
      </div>
    </div>
  );
}

function ListField({
  label,
  items,
  className,
}: {
  label: string;
  items: string[];
  className?: string;
}) {
  const normalizedItems = items.map((item) => item.trim()).filter(Boolean);

  return (
    <div className={[detailItemClass, className].filter(Boolean).join(" ")}>
      <p className={detailLabelClass}>{label}</p>
      {normalizedItems.length > 0 ? (
        <div className="min-w-0 space-y-2">
          {normalizedItems.map((item, index) => (
            <div key={`${label}-${index}`} className={detailValueClass}>
              {item}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm leading-6 text-gray-500 dark:text-gray-400">-</div>
      )}
    </div>
  );
}

function ProfileMediaSection({
  label,
  media,
  emptyText,
}: {
  label: string;
  media: DoctorMediaAsset | null;
  emptyText: string;
}) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">{label}</h3>

      {media ? (
        <ProfileMediaCard media={media} />
      ) : (
        <DetailEmptyState>{emptyText}</DetailEmptyState>
      )}
    </section>
  );
}

function DocumentSection({
  label,
  items,
  emptyText,
}: {
  label: string;
  items: DoctorMediaAsset[];
  emptyText: string;
}) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">{label}</h3>

      {items.length > 0 ? (
        <div className="space-y-3 pt-2">
          {items.map((item, index) => (
            <DocumentCard key={String(item.id ?? `${label}-${index}`)} media={item} />
          ))}
        </div>
      ) : (
        <DetailEmptyState>{emptyText}</DetailEmptyState>
      )}
    </section>
  );
}

function ProfileMediaCard({ media }: { media: DoctorMediaAsset }) {
  const mediaUrl = resolveDoctorMediaUrl(media);
  const isImage = media.mime_type?.startsWith("image/") ?? false;

  return (
    <DetailImageMediaCard
      fileName={getDoctorMediaFilename(media)}
      fileUrl={mediaUrl}
      imageUrl={mediaUrl && isImage ? mediaUrl : null}
      sizeText={media.size ? formatBytes(media.size) : null}
      className="w-full"
    />
  );
}

function DocumentCard({ media }: { media: DoctorMediaAsset }) {
  const mediaUrl = resolveDoctorMediaUrl(media);

  return (
    <DetailCompactMediaCard
      fileName={getDoctorMediaFilename(media)}
      fileUrl={mediaUrl}
      sizeText={media.size ? formatBytes(media.size) : null}
      previewSizeClassName="h-14 w-14"
    />
  );
}

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes)) return "";

  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`;
}

function formatIsoDate(value?: string | null) {
  if (!value) return "-";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  const hours = String(parsed.getHours()).padStart(2, "0");
  const minutes = String(parsed.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function formatNumber(value?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "-";
  return value.toLocaleString();
}

function formatCategoryPath(fullPath?: string | null, fallbackName?: string | null) {
  const raw = fullPath?.trim() || fallbackName?.trim() || "-";
  return raw.replaceAll(" > ", ">");
}
