import { Card, CardDescription, CardHeader, CardTitle, FormCheckbox, InputField, Label, Select } from "@beaulab/ui-admin";

import {
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
            onChange={(event) => onFieldChange("external_video_id", event.target.value)}
            placeholder="예: dQw4w9WgXcQ"
            error={Boolean(errors.external_video_id)}
            hint={errors.external_video_id}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration_seconds">재생 시간(초)</Label>
          <InputField
            id="duration_seconds"
            name="duration_seconds"
            type="number"
            min="0"
            step={1}
            value={form.duration_seconds}
            onChange={(event) => onFieldChange("duration_seconds", event.target.value)}
            placeholder="예: 90"
            error={Boolean(errors.duration_seconds)}
            hint={errors.duration_seconds}
          />
        </div>

        <div className="space-y-3">
          <FormCheckbox
            id="is_publish_period_unlimited"
            checked={form.is_publish_period_unlimited}
            onChange={(checked) => onFieldChange("is_publish_period_unlimited", checked)}
            label="무기한 게시"
          />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
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

            <div className="space-y-2">
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
        </div>
      </div>
    </Card>
  );
}
