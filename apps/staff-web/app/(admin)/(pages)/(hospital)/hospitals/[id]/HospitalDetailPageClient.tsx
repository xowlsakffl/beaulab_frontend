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
  formatBytes,
  getMediaFilename,
  isImageMedia,
  resolveMediaUrl,
  type HospitalDetailResponse,
  type MediaAsset,
} from "@/lib/hospital/form";
import { labelApprovalStatus, labelReviewStatus } from "@/lib/hospital/list";
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

export default function HospitalDetailPageClient() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawHospitalId = Array.isArray(params.id) ? params.id[0] : params.id;
  const hospitalId = Number(rawHospitalId);

  const [detail, setDetail] = React.useState<HospitalDetailResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const getReturnToPath = React.useCallback(
    (highlightId?: number) =>
      buildReturnToPath({
        searchParams,
        fallbackPath: "/hospitals",
        allowedPrefix: "/hospitals",
        highlightId,
      }),
    [searchParams],
  );

  const editPath = React.useMemo(() => {
    const rawReturnTo = searchParams.get("returnTo");
    if (!Number.isFinite(hospitalId) || hospitalId <= 0) {
      return "/hospitals";
    }

    return rawReturnTo
      ? `/hospitals/${hospitalId}/edit?returnTo=${encodeURIComponent(rawReturnTo)}`
      : `/hospitals/${hospitalId}/edit`;
  }, [hospitalId, searchParams]);

  const fetchHospital = React.useCallback(async () => {
    if (!Number.isFinite(hospitalId) || hospitalId <= 0) {
      setLoadError("잘못된 병의원 경로입니다.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      const response = await api.get<HospitalDetailResponse>(`/hospitals/${hospitalId}`, {
        include: "business_registration,categories,features",
      });

      if (!isApiSuccess(response)) {
        setLoadError(response.error.message || "병의원 정보를 불러오지 못했습니다.");
        return;
      }

      setDetail(response.data);
    } catch {
      setLoadError("병의원 정보를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [hospitalId]);

  React.useEffect(() => {
    void fetchHospital();
  }, [fetchHospital]);

  if (isLoading) {
    return <SpinnerBlock className="min-h-[60vh]" spinnerClassName="size-10" />;
  }

  if (loadError || !detail) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>병의원 정보를 불러오지 못했습니다.</CardTitle>
          <CardDescription>{loadError ?? "병의원 정보를 찾을 수 없습니다."}</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2 pt-0">
          <Button type="button" variant="brand" onClick={() => void fetchHospital()}>
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
    <div className="grid gap-6 lg:items-start lg:grid-cols-[minmax(0,1.36fr)_minmax(240px,0.64fr)]">
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
              <Can permission="beaulab.hospital.update">
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
              <p className="text-xs text-gray-500 dark:text-gray-400">병의원의 기본 정보를 확인합니다.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <DetailField label="병의원명" value={detail.name} className="md:col-span-2" />
              <DetailField label="대표 번호" value={detail.tel} />
              <DetailField label="대표 이메일" value={detail.email} />
              <StatusField label="운영 상태" value={detail.status} kind="status" />
              <StatusField label="검수 상태" value={detail.allow_status} kind="allow_status" />
              <DetailField label="조회수" value={formatNumber(detail.view_count)} className="md:col-span-2" />
              <TagField
                label="카테고리"
                items={detail.categories?.map((item) => formatCategoryPath(item.full_path, item.name)) ?? []}
                className="md:col-span-2"
              />
              <TagField
                label="병의원정보"
                items={detail.features?.map((item) => item.name) ?? []}
                className="md:col-span-2"
              />
              <DetailField label="병의원 주소" value={joinAddress(detail.address, detail.address_detail)} multiline className="md:col-span-2" />
              <DetailField label="병의원 소개" value={detail.description} multiline className="md:col-span-2" />
              <DetailField label="운영 시간" value={detail.consulting_hours} multiline className="md:col-span-2" />
              <DetailField label="찾아오는 길" value={detail.direction} multiline className="md:col-span-2" />
              <DetailField label="등록일" value={formatIsoDate(detail.created_at)} />
              <DetailField label="수정일" value={formatIsoDate(detail.updated_at)} />
            </div>
          </section>

          <section className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">사업자 정보</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">사업자 등록 정보와 등록증 파일을 확인합니다.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <DetailField label="사업자 등록번호" value={detail.business_registration?.business_number} />
              <DetailField label="상호명" value={detail.business_registration?.company_name} />
              <DetailField label="대표자" value={detail.business_registration?.ceo_name} />
              <DetailField label="사업자 등록일" value={detail.business_registration?.issued_at} />
              <DetailField label="업태" value={detail.business_registration?.business_type} />
              <DetailField label="종목" value={detail.business_registration?.business_item} />
              <DetailField
                label="사업장 주소"
                value={joinAddress(
                  detail.business_registration?.business_address,
                  detail.business_registration?.business_address_detail,
                )}
                multiline
                className="md:col-span-2"
              />
              <FileSummaryField
                label="사업자등록증 파일"
                media={detail.business_registration?.certificate_media ?? null}
                className="md:col-span-2"
              />
            </div>
          </section>
        </div>
      </Card>

      <Card as="aside" className="min-w-0">
        <CardHeader className="pb-6">
          <CardTitle>파일 업로드</CardTitle>
          <CardDescription>로고와 대표/내부 이미지를 확인합니다.</CardDescription>
        </CardHeader>

        <div className="space-y-6">
          <MediaSection label="로고" items={detail.logo ? [detail.logo] : []} emptyText="업로드한 로고 파일이 없습니다." single />
          <MediaSection label="대표/내부 이미지" items={detail.gallery ?? []} emptyText="업로드한 이미지가 없습니다." />
        </div>
      </Card>
    </div>
  );
}

function DetailField({
  label,
  value,
  multiline = false,
  className,
}: {
  label: string;
  value?: string | number | null;
  multiline?: boolean;
  className?: string;
}) {
  const displayValue = typeof value === "number" ? String(value) : value?.trim() || "-";

  return (
    <div className={["space-y-2", className].filter(Boolean).join(" ")}>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <div
        className={
          multiline
            ? "whitespace-pre-line break-words text-sm leading-6 text-gray-800 dark:text-gray-100"
            : "break-words text-sm leading-6 text-gray-800 dark:text-gray-100"
        }
      >
        {displayValue}
      </div>
    </div>
  );
}

function StatusField({
  label,
  value,
  kind,
  className,
}: {
  label: string;
  value?: string | null;
  kind: "status" | "allow_status";
  className?: string;
}) {
  const status = value ?? "";
  const labelText = kind === "status" ? labelApprovalStatus(status) : labelReviewStatus(status);
  const color =
    status === "ACTIVE" || status === "APPROVED"
      ? "success"
      : status === "SUSPENDED" || status === "PENDING"
        ? "warning"
        : "error";

  return (
    <div className={["space-y-2", className].filter(Boolean).join(" ")}>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <div className="flex min-h-[28px] items-center">
        <StatusBadge size="sm" color={color}>
          {labelText || "-"}
        </StatusBadge>
      </div>
    </div>
  );
}

function TagField({ label, items, className }: { label: string; items: string[]; className?: string }) {
  return (
    <div className={["space-y-2", className].filter(Boolean).join(" ")}>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <div className="flex min-h-[28px] flex-wrap items-center gap-2">
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

function FileSummaryField({
  label,
  media,
  className,
}: {
  label: string;
  media: MediaAsset | null;
  className?: string;
}) {
  const fileUrl = resolveMediaUrl(media);

  return (
    <div className={["space-y-2", className].filter(Boolean).join(" ")}>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
      {media ? (
        <DetailCompactMediaCard
          fileName={getMediaFilename(media)}
          fileUrl={fileUrl}
          sizeText={media.size ? formatBytes(media.size) : null}
          previewSizeClassName="h-14 w-14"
        />
      ) : (
        <div className="text-sm text-gray-500 dark:text-gray-400">-</div>
      )}
    </div>
  );
}

function MediaSection({
  label,
  items,
  emptyText,
  single = false,
}: {
  label: string;
  items: MediaAsset[];
  emptyText: string;
  single?: boolean;
}) {
  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">{label}</h3>
      </div>

      {items.length > 0 ? (
        <div className="space-y-3 pt-2">
          {items.map((item, index) =>
            single ? (
              <LogoMediaCard key={String(item.id ?? `${label}-${index}`)} media={item} />
            ) : (
              <MediaCard key={String(item.id ?? `${label}-${index}`)} media={item} showRepresentative />
            ),
          )}
        </div>
      ) : (
        <DetailEmptyState>{emptyText}</DetailEmptyState>
      )}
    </section>
  );
}

function LogoMediaCard({ media }: { media: MediaAsset }) {
  const mediaUrl = resolveMediaUrl(media);
  const isImage = isImageMedia(media);

  return (
    <DetailCompactMediaCard
      fileName={getMediaFilename(media)}
      fileUrl={mediaUrl}
      sizeText={media.size ? formatBytes(media.size) : null}
      previewUrl={mediaUrl && isImage ? mediaUrl : null}
      previewSizeClassName="h-20 w-20"
    />
  );
}

function MediaCard({
  media,
  showRepresentative = false,
}: {
  media: MediaAsset;
  showRepresentative?: boolean;
}) {
  const mediaUrl = resolveMediaUrl(media);
  const isImage = isImageMedia(media);

  return (
    <DetailImageMediaCard
      fileName={getMediaFilename(media)}
      fileUrl={mediaUrl}
      imageUrl={mediaUrl && isImage ? mediaUrl : null}
      sizeText={media.size ? formatBytes(media.size) : null}
      badgeText={showRepresentative && media.is_primary ? "대표" : null}
    />
  );
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

function joinAddress(address?: string | null, detail?: string | null) {
  return [address?.trim(), detail?.trim()].filter(Boolean).join("\n");
}

function formatCategoryPath(fullPath?: string | null, fallbackName?: string | null) {
  const raw = fullPath?.trim() || fallbackName?.trim() || "-";
  return raw.replaceAll(" > ", ">");
}
