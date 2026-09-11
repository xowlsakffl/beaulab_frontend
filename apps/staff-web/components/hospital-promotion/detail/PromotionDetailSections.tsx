"use client";

import React, { type ReactNode } from "react";
import { Card, StatusValueBadge } from "@beaulab/ui-admin";
import { MediaPreviewModal, type MediaPreviewState } from "@/components/common/MediaPreviewModal";
import { promotionBannerItem } from "@/lib/hospital-promotion/detail";
import {
  labelPromotionProgress,
  promotionPositionOption,
  labelPromotionStatus,
  promotionProgressColor,
  promotionStatusColor,
} from "@/lib/hospital-promotion/options";
import type { HospitalPromotionDetail } from "@/lib/hospital-promotion/types";

function DetailField({
  label,
  children,
  compact = false,
  className = "",
}: {
  label: string;
  children: ReactNode;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`grid min-w-0 ${compact ? "grid-cols-[7.25rem_minmax(0,1fr)] gap-3" : "grid-cols-[8.5rem_minmax(0,1fr)] gap-4"} ${className}`}
    >
      <dt className="pt-0.5 text-xs font-semibold text-gray-500">{label}</dt>
      <dd className="min-w-0 text-sm leading-6 break-words text-gray-800">{children}</dd>
    </div>
  );
}

export function PromotionBannerCard({ detail }: { detail: HospitalPromotionDetail }) {
  const [preview, setPreview] = React.useState<MediaPreviewState | null>(null);
  const banner = promotionBannerItem(detail.banner)[0];
  return (
    <Card as="section" className="min-w-0 rounded-xl border border-gray-200 bg-white p-5">
      <dl className="space-y-5">
        <DetailField label="배너 이미지">
          {banner ? (
            <button
              type="button"
              aria-label="배너 이미지 원본보기"
              className="flex min-h-40 w-full items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
              onClick={() => setPreview({ url: banner.url, title: banner.name, isImage: true })}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- runtime media URL */}
              <img src={banner.url} alt={detail.title} className="max-h-96 w-full object-contain" />
            </button>
          ) : (
            "-"
          )}
        </DetailField>
      </dl>
      <MediaPreviewModal preview={preview} onChange={setPreview} onClose={() => setPreview(null)} />
    </Card>
  );
}

export function PromotionContentCard({ detail }: { detail: HospitalPromotionDetail }) {
  return (
    <Card as="section" className="min-w-0 rounded-xl border border-gray-200 bg-white p-5">
      <dl>
        <DetailField label="내용">
          <div
            className="min-h-64 max-w-full overflow-x-auto text-sm leading-6 break-words text-gray-800 [&_a]:text-brand-600 [&_a]:underline [&_blockquote]:my-3 [&_blockquote]:border-l-2 [&_blockquote]:border-brand-300 [&_blockquote]:pl-4 [&_h2]:my-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:my-3 [&_h3]:text-base [&_h3]:font-semibold [&_img]:my-3 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-lg [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-2 [&_pre]:overflow-x-auto [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&>:first-child]:mt-0 [&>:last-child]:mb-0"
            dangerouslySetInnerHTML={{ __html: detail.content }}
          />
        </DetailField>
      </dl>
    </Card>
  );
}

export function PromotionSettingsCard({ detail }: { detail: HospitalPromotionDetail }) {
  return (
    <Card as="section" className="min-w-0 rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="mb-5 border-b border-gray-200 pb-3 text-sm font-bold text-gray-900">기본정보</h2>
      <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
        <DetailField label="프로모션명" compact className="sm:col-span-2">
          {detail.title}
        </DetailField>
        <DetailField label="게시위치" compact>
          {promotionPositionOption(detail.side, detail.slot)?.label ?? "-"}
        </DetailField>
        <DetailField label="게시기간" compact>
          <span className="inline-block whitespace-nowrap">{detail.start_date}</span> ~{" "}
          <span className="inline-block whitespace-nowrap">{detail.end_date}</span>
        </DetailField>
        <DetailField label="진행상태" compact>
          <StatusValueBadge
            label={labelPromotionProgress(detail.progress)}
            color={promotionProgressColor(detail.progress)}
          />
        </DetailField>
        <DetailField label="공개여부" compact>
          <StatusValueBadge label={labelPromotionStatus(detail.status)} color={promotionStatusColor(detail.status)} />
        </DetailField>
      </dl>
    </Card>
  );
}
