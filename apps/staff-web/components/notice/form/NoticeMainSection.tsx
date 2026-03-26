"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FormSettingToggleRow,
  InputField,
  Label,
  RichTextEditor,
  Select,
} from "@beaulab/ui-admin";

import {
  NOTICE_CHANNEL_OPTIONS,
  NOTICE_STATUS_OPTIONS,
  type NoticeFormErrors,
  type NoticeFormValues,
} from "@/lib/notice/form";

type NoticeMainSectionProps = {
  form: NoticeFormValues;
  errors: NoticeFormErrors;
  onFieldChange: (key: keyof NoticeFormValues, value: NoticeFormValues[keyof NoticeFormValues]) => void;
  onContentChange: (value: string) => void;
  onUploadEditorImage: (file: File) => Promise<{ url: string }>;
};

export function NoticeMainSection({
  form,
  errors,
  onFieldChange,
  onContentChange,
  onUploadEditorImage,
}: NoticeMainSectionProps) {
  return (
    <Card as="section">
      <CardHeader className="pb-6">
        <CardTitle>기본 정보</CardTitle>
        <CardDescription>공지 채널, 제목, 게시 설정과 본문 내용을 입력해 주세요.</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">제목 *</Label>
            <InputField
              id="title"
              name="title"
              value={form.title}
              onChange={(event) => onFieldChange("title", event.target.value)}
              placeholder="공지 제목을 입력해 주세요."
              error={Boolean(errors.title)}
              hint={errors.title}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="channel">채널 *</Label>
              <Select
                id="channel"
                name="channel"
                value={form.channel}
                options={[...NOTICE_CHANNEL_OPTIONS]}
                placeholder="채널을 선택해 주세요."
                onChange={(value) => onFieldChange("channel", value)}
                className="h-11 w-full px-4"
              />
              {errors.channel ? <p className="text-xs text-error-500">{errors.channel}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">운영 상태 *</Label>
              <Select
                id="status"
                name="status"
                value={form.status}
                options={[...NOTICE_STATUS_OPTIONS]}
                placeholder="운영 상태를 선택해 주세요."
                onChange={(value) => onFieldChange("status", value)}
                className="h-11 w-full px-4"
              />
              {errors.status ? <p className="text-xs text-error-500">{errors.status}</p> : null}
            </div>
          </div>

          <div className="space-y-3">
            <Label>게시 옵션</Label>
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50/80 dark:border-gray-800 dark:bg-gray-900/50">
              <FormSettingToggleRow
                title="상단 공지"
                description="공지 목록 상단에 우선 노출합니다."
                checked={form.is_pinned}
                onChange={(checked) => onFieldChange("is_pinned", checked)}
              />

              <FormSettingToggleRow
                title="관리자 메인 팝업"
                description="관리자 메인 진입 시 팝업으로 노출합니다."
                checked={form.is_important}
                onChange={(checked) => onFieldChange("is_important", checked)}
              />

              <FormSettingToggleRow
                title="무기한 게시"
                description="게시 종료 없이 계속 노출합니다."
                checked={form.is_publish_period_unlimited}
                onChange={(checked) => onFieldChange("is_publish_period_unlimited", checked)}
                isLast
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 min-w-0">
                    <Label htmlFor="publish_start_at">게시 시작 일시</Label>
                    <InputField
                      id="publish_start_at"
                      name="publish_start_at"
                      type="datetime-local"
                      value={form.publish_start_at}
                      onChange={(event) => onFieldChange("publish_start_at", event.target.value)}
                      disabled={form.is_publish_period_unlimited}
                      error={Boolean(errors.publish_start_at)}
                      hint={errors.publish_start_at}
                    />
                  </div>

                  <div className="space-y-2 min-w-0">
                    <Label htmlFor="publish_end_at">게시 종료 일시</Label>
                    <InputField
                      id="publish_end_at"
                      name="publish_end_at"
                      type="datetime-local"
                      value={form.publish_end_at}
                      onChange={(event) => onFieldChange("publish_end_at", event.target.value)}
                      disabled={form.is_publish_period_unlimited}
                      error={Boolean(errors.publish_end_at)}
                      hint={errors.publish_end_at}
                    />
                  </div>
                </div>
              </FormSettingToggleRow>
            </div>
          </div>

          <div className="space-y-2" data-field-target="content" tabIndex={-1}>
            <Label htmlFor="notice-content">내용 *</Label>
            <RichTextEditor
              id="notice-content"
              name="content"
              value={form.content}
              onChange={onContentChange}
              onUploadImage={onUploadEditorImage}
              placeholder="공지사항 내용을 입력해 주세요."
              error={Boolean(errors.content)}
              hint={errors.content}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
