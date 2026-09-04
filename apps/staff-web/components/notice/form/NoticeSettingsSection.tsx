"use client";

import type { ReactNode } from "react";
import { Card, FormCheckbox, Select } from "@beaulab/ui-admin";
import { NOTICE_CHANNEL_OPTIONS, NOTICE_STATUS_OPTIONS } from "@/lib/notice/options";
import type { NoticeFormErrors, NoticeFormValues } from "@/lib/notice/form";
import { NoticeFormField } from "./NoticeFormField";

type NoticeSettingsSectionProps = {
  form: NoticeFormValues;
  errors: NoticeFormErrors;
  canUpdateStatus: boolean;
  onFieldChange: <K extends keyof NoticeFormValues>(key: K, value: NoticeFormValues[K]) => void;
  children: ReactNode;
};

export function NoticeSettingsSection({
  form,
  errors,
  canUpdateStatus,
  onFieldChange,
  children,
}: NoticeSettingsSectionProps) {
  return (
    <Card as="section" className="min-w-0 space-y-5 rounded-xl p-5">
      <NoticeFormField label="채널" htmlFor="channel" required error={errors.channel}>
        <Select
          id="channel"
          name="channel"
          value={form.channel}
          options={NOTICE_CHANNEL_OPTIONS}
          placeholder="채널을 선택해 주세요."
          onChange={(value) => onFieldChange("channel", value)}
        />
      </NoticeFormField>
      <NoticeFormField label="공개여부" htmlFor="status" required error={errors.status}>
        <Select
          id="status"
          name="status"
          value={form.status}
          options={NOTICE_STATUS_OPTIONS}
          showPlaceholderOption={false}
          disabled={!canUpdateStatus}
          onChange={(value) => onFieldChange("status", value)}
        />
      </NoticeFormField>
      <NoticeFormField label="상단공지" htmlFor="is_pinned">
        <div className="flex h-11 items-center">
          <FormCheckbox
            id="is_pinned"
            ariaLabel="상단공지"
            checked={form.is_pinned}
            onChange={(checked) => onFieldChange("is_pinned", checked)}
          />
        </div>
      </NoticeFormField>
      {children}
    </Card>
  );
}
