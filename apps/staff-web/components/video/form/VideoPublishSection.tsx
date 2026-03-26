import React from "react";
import { Card, CardDescription, CardHeader, CardTitle, FormSettingToggleRow, InputField, Label, Select } from "@beaulab/ui-admin";

import {
  extractYoutubeVideoId,
  formatVideoDurationTypingInput,
  VIDEO_DISTRIBUTION_OPTIONS,
  type VideoFormErrors,
  type VideoFormValues,
} from "@/lib/video/form";

type VideoPublishSectionProps = {
  form: VideoFormValues;
  errors: VideoFormErrors;
  onFieldChange: (key: keyof VideoFormValues, value: VideoFormValues[keyof VideoFormValues]) => void;
};

export function VideoPublishSection({
  form,
  errors,
  onFieldChange,
}: VideoPublishSectionProps) {
  const resolveYoutubeMetadata = React.useCallback((rawValue: string) => {
    const videoId = extractYoutubeVideoId(rawValue);
    if (!videoId) {
      return;
    }

    if (form.external_video_id !== videoId) {
      onFieldChange("external_video_id", videoId);
    }
  }, [form.external_video_id, onFieldChange]);

  return (
    <Card as="section">
      <CardHeader className="pb-6">
        <CardTitle>배포 정보</CardTitle>
        <CardDescription>배포 채널과 게시 기간, 외부 영상 정보를 입력해 주세요.</CardDescription>
      </CardHeader>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="distribution_channel">배포채널 *</Label>
          <Select
            id="distribution_channel"
            name="distribution_channel"
            value={form.distribution_channel}
            options={[...VIDEO_DISTRIBUTION_OPTIONS]}
            placeholder="배포채널을 선택해 주세요."
            onChange={(value: string) => onFieldChange("distribution_channel", value)}
            className="h-11 w-full px-4"
          />
          {errors.distribution_channel ? <p className="text-xs text-error-500">{errors.distribution_channel}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="external_video_url">외부 영상 URL</Label>
          <InputField
            id="external_video_url"
            name="external_video_url"
            value={form.external_video_url}
            onChange={(event) => onFieldChange("external_video_url", event.target.value)}
            onBlur={() => {
              resolveYoutubeMetadata(form.external_video_url);
            }}
            placeholder="예: https://www.youtube.com/watch?v=..."
            error={Boolean(errors.external_video_url)}
            hint={errors.external_video_url}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="external_video_id">외부 영상 ID</Label>
          <InputField
            id="external_video_id"
            name="external_video_id"
            value={form.external_video_id}
            readOnly
            placeholder="외부 영상 URL 입력 시 자동 반영됩니다."
            className="bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-200"
            error={Boolean(errors.external_video_id)}
            hint={errors.external_video_id}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration_seconds">재생 시간</Label>
          <InputField
            id="duration_seconds"
            name="duration_seconds"
            type="text"
            value={form.duration_seconds}
            onChange={(event) => onFieldChange("duration_seconds", formatVideoDurationTypingInput(event.target.value))}
            placeholder="예: 10:50"
            error={Boolean(errors.duration_seconds)}
            hint={errors.duration_seconds}
          />
        </div>

        <div className="space-y-3">
          <Label>게시 기간</Label>
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50/80 dark:border-gray-800 dark:bg-gray-900/50">
            <FormSettingToggleRow
              title="무기한 게시"
              description="게시 종료 없이 계속 노출합니다."
              checked={form.is_publish_period_unlimited}
              onChange={(checked) => onFieldChange("is_publish_period_unlimited", checked)}
              isLast
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 min-w-0">
                  <Label htmlFor="publish_start_at">게시 시작 시각</Label>
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
                  <Label htmlFor="publish_end_at">게시 종료 시각</Label>
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
      </div>
    </Card>
  );
}
