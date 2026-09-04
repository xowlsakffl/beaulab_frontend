import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle, FormCheckbox, StatusValueBadge } from "@beaulab/ui-admin";

import { NoticeAttachmentSection } from "@/components/notice/form/NoticeAttachmentSection";
import { ownerVisibilityStatusColor } from "@/lib/common/status-labels";
import type { NoticeDetailResponse } from "@/lib/notice/detail";
import { labelNoticeChannel, labelNoticeStatus } from "@/lib/notice/options";

type NoticeDetailCardProps = {
  detail: NoticeDetailResponse;
};

const noticeDetailCardClassName = "rounded-xl border border-gray-200 bg-white p-5";

export function NoticeContentCard({ detail }: NoticeDetailCardProps) {
  return (
    <Card as="section" className={noticeDetailCardClassName} aria-labelledby="notice-content-heading">
      <CardHeader className="mb-5">
        <CardTitle id="notice-content-heading" className="font-bold text-gray-900">
          기본 정보
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-3">
          <NoticeDetailField label="제목">{detail.title?.trim() || "-"}</NoticeDetailField>
          <NoticeDetailField label="내용">
            <div
              className="notice-content-view min-h-64 max-w-full overflow-x-auto text-sm leading-6 break-words text-gray-800 [&_a]:text-brand-600 [&_a]:underline [&_blockquote]:my-3 [&_blockquote]:border-l-2 [&_blockquote]:border-brand-300 [&_blockquote]:pl-4 [&_h2]:my-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:my-3 [&_h3]:text-base [&_h3]:font-semibold [&_img]:my-3 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-lg [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-2 [&_pre]:overflow-x-auto [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&>:first-child]:mt-0 [&>:last-child]:mb-0"
              dangerouslySetInnerHTML={{ __html: detail.content }}
            />
          </NoticeDetailField>
        </dl>
      </CardContent>
    </Card>
  );
}

export function NoticeSettingsCard({ detail }: NoticeDetailCardProps) {
  return (
    <Card as="section" className={noticeDetailCardClassName} aria-labelledby="notice-settings-heading">
      <CardHeader className="mb-5">
        <CardTitle id="notice-settings-heading" className="font-bold text-gray-900">
          게시 정보
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-3">
          <NoticeDetailField label="채널" compact>
            {labelNoticeChannel(detail.channel)}
          </NoticeDetailField>
          <NoticeDetailField label="공개여부" compact>
            <StatusValueBadge
              label={labelNoticeStatus(detail.status)}
              color={ownerVisibilityStatusColor(detail.status)}
            />
          </NoticeDetailField>
          <NoticeDetailField label="상단공지" compact>
            <FormCheckbox ariaLabel="상단공지" checked={detail.is_pinned} disabled onChange={() => {}} />
          </NoticeDetailField>
          <NoticeDetailField label="첨부파일" compact>
            <NoticeAttachmentSection existingAttachments={detail.attachments ?? []} readOnly />
          </NoticeDetailField>
        </dl>
      </CardContent>
    </Card>
  );
}

function NoticeDetailField({
  label,
  compact = false,
  children,
}: {
  label: string;
  compact?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={
        compact ? "grid grid-cols-[7.25rem_minmax(0,1fr)] gap-3" : "grid grid-cols-[8.5rem_minmax(0,1fr)] gap-4"
      }
    >
      <dt className="pt-0.5 text-xs font-semibold text-gray-500">{label}</dt>
      <dd className="min-w-0 text-sm leading-6 break-words text-gray-800">{children}</dd>
    </div>
  );
}
